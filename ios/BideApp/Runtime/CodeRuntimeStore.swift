import Foundation
import Network
import SwiftUI
import WebKit

struct CodeRuntimeExecutionReport: Identifiable, Equatable {
    let id = UUID()
    let language: CodeLanguage
    let succeeded: Bool
    let stdout: String
    let stderr: String
    let value: String
    let error: String
    let runtime: String
    let duration: TimeInterval
}

@MainActor
final class CodeRuntimeStore: NSObject, ObservableObject, WKNavigationDelegate {
    @Published private(set) var isRunning = false
    @Published var lastRun: CodeRuntimeExecutionReport?
    @Published var runtimeError: String?

    private var server: RuntimeHTTPServer?
    private var webView: WKWebView?
    private var navigationContinuation: CheckedContinuation<Void, Error>?

    func execute(_ code: String, language: CodeLanguage) async {
        guard language == .python || language == .r else { return }
        guard !isRunning else { return }

        isRunning = true
        runtimeError = nil
        let startedAt = Date()
        defer { isRunning = false }

        do {
            let webView = try await preparedWebView()
            let rawResult = try await webView.callAsyncJavaScript(
                "return await window.bideRuntime.execute(language, code);",
                arguments: [
                    "language": language.rawValue,
                    "code": code,
                ],
                in: nil,
                contentWorld: .page
            )

            guard let payload = rawResult as? [String: Any] else {
                throw RuntimeBridgeError.invalidResult
            }

            lastRun = CodeRuntimeExecutionReport(
                language: language,
                succeeded: payload["ok"] as? Bool ?? false,
                stdout: payload["stdout"] as? String ?? "",
                stderr: payload["stderr"] as? String ?? "",
                value: payload["value"] as? String ?? "",
                error: payload["error"] as? String ?? "",
                runtime: payload["runtime"] as? String ?? language.displayName,
                duration: Date().timeIntervalSince(startedAt)
            )
        } catch {
            runtimeError = error.localizedDescription
        }
    }

    func resetSession() {
        guard !isRunning else { return }
        navigationContinuation?.resume(throwing: CancellationError())
        navigationContinuation = nil
        webView?.navigationDelegate = nil
        webView?.stopLoading()
        webView = nil
        lastRun = nil
        runtimeError = nil
    }

    private func preparedWebView() async throws -> WKWebView {
        if let webView { return webView }

        guard let runtimeRoot = Bundle.main.url(forResource: "RuntimeAssets", withExtension: nil) else {
            throw RuntimeBridgeError.missingRuntimeBundle
        }

        let runtimeServer: RuntimeHTTPServer
        if let server {
            runtimeServer = server
        } else {
            let nextServer = RuntimeHTTPServer(rootURL: runtimeRoot)
            server = nextServer
            runtimeServer = nextServer
        }
        let port = try await runtimeServer.start()

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        self.webView = webView

        guard let url = URL(string: "http://127.0.0.1:\(port)/runtime-host.html") else {
            throw RuntimeBridgeError.invalidRuntimeURL
        }

        try await withCheckedThrowingContinuation { continuation in
            navigationContinuation = continuation
            webView.load(URLRequest(url: url))
        }

        return webView
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        navigationContinuation?.resume()
        navigationContinuation = nil
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        navigationContinuation?.resume(throwing: error)
        navigationContinuation = nil
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        navigationContinuation?.resume(throwing: error)
        navigationContinuation = nil
    }
}

private enum RuntimeBridgeError: LocalizedError {
    case missingRuntimeBundle
    case invalidRuntimeURL
    case invalidResult

    var errorDescription: String? {
        switch self {
        case .missingRuntimeBundle:
            return "The bundled Python/R runtimes are missing. Rebuild bIDE so RuntimeAssets are prepared before XcodeGen."
        case .invalidRuntimeURL:
            return "bIDE could not start its local runtime bridge."
        case .invalidResult:
            return "The runtime returned an unreadable result."
        }
    }
}

private final class RuntimeHTTPServer: @unchecked Sendable {
    private let rootURL: URL
    private let queue = DispatchQueue(label: "com.bideide.runtime-http")
    private var listener: NWListener?
    private var activePort: UInt16?

    init(rootURL: URL) {
        self.rootURL = rootURL.standardizedFileURL
    }

    deinit {
        listener?.cancel()
    }

    func start() async throws -> UInt16 {
        if let activePort { return activePort }

        let parameters = NWParameters.tcp
        parameters.requiredInterfaceType = .loopback
        let listener = try NWListener(using: parameters, on: .any)
        self.listener = listener

        return try await withCheckedThrowingContinuation { continuation in
            let gate = ListenerStartGate(continuation)

            listener.stateUpdateHandler = { [weak self] state in
                switch state {
                case .ready:
                    guard let port = listener.port?.rawValue else {
                        gate.fail(RuntimeHTTPServerError.missingPort)
                        return
                    }
                    self?.activePort = port
                    gate.succeed(port)
                case .failed(let error):
                    gate.fail(error)
                case .cancelled:
                    gate.fail(RuntimeHTTPServerError.cancelled)
                default:
                    break
                }
            }

            listener.newConnectionHandler = { [weak self] connection in
                self?.handle(connection)
            }
            listener.start(queue: queue)
        }
    }

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 32 * 1024) { [weak self] data, _, _, error in
            guard let self else {
                connection.cancel()
                return
            }
            guard error == nil, let data, !data.isEmpty else {
                connection.cancel()
                return
            }
            self.respond(to: data, over: connection)
        }
    }

    private func respond(to requestData: Data, over connection: NWConnection) {
        guard let request = String(data: requestData, encoding: .utf8),
              let firstLine = request.split(separator: "\r\n", maxSplits: 1).first else {
            send(status: "400 Bad Request", body: Data(), contentType: "text/plain", over: connection)
            return
        }

        let requestParts = firstLine.split(separator: " ")
        guard requestParts.count >= 2, requestParts[0] == "GET" else {
            send(status: "405 Method Not Allowed", body: Data(), contentType: "text/plain", over: connection)
            return
        }

        let rawPath = String(requestParts[1]).split(separator: "?", maxSplits: 1).first.map(String.init) ?? "/"
        let decodedPath = rawPath.removingPercentEncoding ?? rawPath
        var relativePath = decodedPath == "/" ? "runtime-host.html" : String(decodedPath.dropFirst())
        relativePath = relativePath.replacingOccurrences(of: "\\", with: "/")

        guard !relativePath.isEmpty,
              !relativePath.split(separator: "/").contains("..") else {
            send(status: "403 Forbidden", body: Data(), contentType: "text/plain", over: connection)
            return
        }

        let fileURL = rootURL.appendingPathComponent(relativePath).standardizedFileURL
        let rootPrefix = rootURL.path.hasSuffix("/") ? rootURL.path : rootURL.path + "/"
        guard fileURL.path.hasPrefix(rootPrefix),
              let body = try? Data(contentsOf: fileURL) else {
            send(status: "404 Not Found", body: Data(), contentType: "text/plain", over: connection)
            return
        }

        send(
            status: "200 OK",
            body: body,
            contentType: mimeType(for: fileURL.pathExtension),
            over: connection
        )
    }

    private func send(
        status: String,
        body: Data,
        contentType: String,
        over connection: NWConnection
    ) {
        let headers = """
        HTTP/1.1 \(status)\r
        Content-Length: \(body.count)\r
        Content-Type: \(contentType)\r
        Cache-Control: no-store\r
        Cross-Origin-Opener-Policy: same-origin\r
        Cross-Origin-Embedder-Policy: require-corp\r
        Cross-Origin-Resource-Policy: same-origin\r
        Connection: close\r
        \r
        """
        var response = Data(headers.utf8)
        response.append(body)

        connection.send(content: response, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }

    private func mimeType(for fileExtension: String) -> String {
        switch fileExtension.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "json", "map": return "application/json"
        case "wasm": return "application/wasm"
        case "css": return "text/css; charset=utf-8"
        case "txt": return "text/plain; charset=utf-8"
        case "zip": return "application/zip"
        default: return "application/octet-stream"
        }
    }
}

private final class ListenerStartGate: @unchecked Sendable {
    private let lock = NSLock()
    private var continuation: CheckedContinuation<UInt16, Error>?

    init(_ continuation: CheckedContinuation<UInt16, Error>) {
        self.continuation = continuation
    }

    func succeed(_ port: UInt16) {
        lock.lock()
        defer { lock.unlock() }
        continuation?.resume(returning: port)
        continuation = nil
    }

    func fail(_ error: Error) {
        lock.lock()
        defer { lock.unlock() }
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

private enum RuntimeHTTPServerError: LocalizedError {
    case missingPort
    case cancelled

    var errorDescription: String? {
        switch self {
        case .missingPort: return "The local runtime server did not receive a port."
        case .cancelled: return "The local runtime server stopped before it was ready."
        }
    }
}

struct CodeRuntimeResultsView: View {
    let report: CodeRuntimeExecutionReport

    var body: some View {
        NavigationStack {
            List {
                Section("Run") {
                    LabeledContent("Language", value: report.language.displayName)
                    LabeledContent("Runtime", value: report.runtime)
                    LabeledContent("Status", value: report.succeeded ? "Completed" : "Failed")
                    LabeledContent("Duration", value: String(format: "%.2f s", report.duration))
                }

                if !report.stdout.isEmpty {
                    outputSection(title: "Output", text: report.stdout)
                }
                if !report.value.isEmpty {
                    outputSection(title: "Result", text: report.value)
                }
                if !report.stderr.isEmpty {
                    outputSection(title: "Standard Error", text: report.stderr)
                }
                if !report.error.isEmpty {
                    outputSection(title: "Runtime Error", text: report.error)
                }

                if report.stdout.isEmpty && report.value.isEmpty && report.stderr.isEmpty && report.error.isEmpty {
                    Section {
                        Text("Run completed with no printed output.")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("\(report.language.displayName) Results")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    @ViewBuilder
    private func outputSection(title: String, text: String) -> some View {
        Section(title) {
            ScrollView(.horizontal) {
                Text(text)
                    .font(.system(.footnote, design: .monospaced))
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}
