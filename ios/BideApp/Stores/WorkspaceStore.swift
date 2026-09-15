import Foundation
import SwiftUI

@MainActor
final class WorkspaceStore: ObservableObject {
    enum SaveState: Equatable {
        case saved
        case saving
        case failed(String)
    }

    @Published private(set) var projects: [BideProjectManifest] = []
    @Published private(set) var files: [BideProjectFile] = []
    @Published private(set) var activeProjectID: UUID?
    @Published private(set) var activeFileID: String?
    @Published var documentText = ""
    @Published private(set) var documentLanguage: CodeLanguage = .python
    @Published private(set) var saveState: SaveState = .saved

    private let fileManager: FileManager
    private let rootDirectory: URL
    private var autosaveTask: Task<Void, Never>?

    private let importableProjectExtensions: Set<String> = [
        "py", "sql", "r",
        "csv", "tsv", "json", "xlsx", "xls", "parquet",
        "txt", "md"
    ]

    init() {
        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        fileManager = manager
        rootDirectory = documents.appendingPathComponent("bIDE Projects", isDirectory: true)
        bootstrap()
    }

    var activeProject: BideProjectManifest? {
        projects.first(where: { $0.id == activeProjectID })
    }

    var activeFile: BideProjectFile? {
        files.first(where: { $0.id == activeFileID })
    }

    var activeProjectName: String {
        activeProject?.name ?? "No Project"
    }

    func updateDocumentText(_ text: String) {
        guard text != documentText else { return }
        documentText = text
        saveState = .saving
        scheduleAutosave()
    }

    func createProject(named requestedName: String) {
        let trimmed = requestedName.trimmingCharacters(in: .whitespacesAndNewlines)
        let name = trimmed.isEmpty ? "Untitled Project" : trimmed
        let manifest = BideProjectManifest(name: name)
        let directory = projectDirectory(for: manifest.id)

        do {
            try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
            try fileManager.createDirectory(at: directory.appendingPathComponent("data", isDirectory: true), withIntermediateDirectories: true)
            try fileManager.createDirectory(at: directory.appendingPathComponent("exports", isDirectory: true), withIntermediateDirectories: true)
            try writeManifest(manifest, to: directory)
            try CodeLanguage.python.starterCode.write(
                to: directory.appendingPathComponent("analysis.py"),
                atomically: true,
                encoding: .utf8
            )
            try CodeLanguage.sql.starterCode.write(
                to: directory.appendingPathComponent("query.sql"),
                atomically: true,
                encoding: .utf8
            )
            try CodeLanguage.r.starterCode.write(
                to: directory.appendingPathComponent("model.R"),
                atomically: true,
                encoding: .utf8
            )
            refreshProjects()
            openProject(manifest.id)
        } catch {
            saveState = .failed("Could not create project: \(error.localizedDescription)")
        }
    }

    @discardableResult
    func importProject(from sourceURL: URL) -> UUID? {
        let grantedAccess = sourceURL.startAccessingSecurityScopedResource()
        defer {
            if grantedAccess {
                sourceURL.stopAccessingSecurityScopedResource()
            }
        }

        let sourceName = sourceURL.lastPathComponent.trimmingCharacters(in: .whitespacesAndNewlines)
        let manifest = BideProjectManifest(name: sourceName.isEmpty ? "Imported Project" : sourceName)
        let destinationRoot = projectDirectory(for: manifest.id)

        do {
            try fileManager.createDirectory(at: destinationRoot, withIntermediateDirectories: true)
            try fileManager.createDirectory(
                at: destinationRoot.appendingPathComponent("data", isDirectory: true),
                withIntermediateDirectories: true
            )
            try fileManager.createDirectory(
                at: destinationRoot.appendingPathComponent("exports", isDirectory: true),
                withIntermediateDirectories: true
            )
            try writeManifest(manifest, to: destinationRoot)

            guard let enumerator = fileManager.enumerator(
                at: sourceURL,
                includingPropertiesForKeys: [.isRegularFileKey, .isDirectoryKey],
                options: [.skipsHiddenFiles, .skipsPackageDescendants]
            ) else {
                throw CocoaError(.fileReadUnknown)
            }

            let sourcePrefix = sourceURL.path.hasSuffix("/") ? sourceURL.path : sourceURL.path + "/"
            for case let itemURL as URL in enumerator {
                let relativePath = itemURL.path.replacingOccurrences(of: sourcePrefix, with: "")
                guard !relativePath.isEmpty else { continue }

                let components = relativePath.split(separator: "/").map(String.init)
                if components.contains(where: { ["node_modules", ".git", ".venv", "venv", "__pycache__"].contains($0) }) {
                    if (try? itemURL.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true {
                        enumerator.skipDescendants()
                    }
                    continue
                }

                let values = try itemURL.resourceValues(forKeys: [.isRegularFileKey, .isDirectoryKey])
                let destination = destinationRoot.appendingPathComponent(relativePath)

                if values.isDirectory == true {
                    try fileManager.createDirectory(at: destination, withIntermediateDirectories: true)
                    continue
                }

                guard values.isRegularFile == true else { continue }
                guard itemURL.lastPathComponent != "project.bide.json" else { continue }
                guard importableProjectExtensions.contains(itemURL.pathExtension.lowercased()) else { continue }

                try fileManager.createDirectory(
                    at: destination.deletingLastPathComponent(),
                    withIntermediateDirectories: true
                )
                try fileManager.copyItem(at: itemURL, to: destination)
            }

            refreshProjects()
            openProject(manifest.id)
            return manifest.id
        } catch {
            try? fileManager.removeItem(at: destinationRoot)
            saveState = .failed("Could not import project: \(error.localizedDescription)")
            return nil
        }
    }

    func renameProject(_ project: BideProjectManifest, to requestedName: String) {
        let name = requestedName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        var updated = project
        updated.name = name
        updated.updatedAt = .now

        do {
            try writeManifest(updated, to: projectDirectory(for: project.id))
            refreshProjects()
        } catch {
            saveState = .failed("Could not rename project: \(error.localizedDescription)")
        }
    }

    func deleteProject(_ project: BideProjectManifest) {
        autosaveTask?.cancel()
        if project.id == activeProjectID {
            saveActiveDocumentNow()
        }

        do {
            try fileManager.removeItem(at: projectDirectory(for: project.id))
            refreshProjects()
            if projects.isEmpty {
                createProject(named: "My Project")
            } else if project.id == activeProjectID {
                openProject(projects[0].id)
            }
        } catch {
            saveState = .failed("Could not delete project: \(error.localizedDescription)")
        }
    }

    func openProject(_ id: UUID) {
        guard projects.contains(where: { $0.id == id }) else { return }
        saveActiveDocumentNow()
        activeProjectID = id
        UserDefaults.standard.set(id.uuidString, forKey: "bide.lastProject")
        refreshFiles()

        let lastFile = UserDefaults.standard.string(forKey: "bide.lastFile.\(id.uuidString)")
        if let lastFile, files.contains(where: { $0.id == lastFile }) {
            openFile(lastFile)
        } else if let first = files.first {
            openFile(first.id)
        } else {
            activeFileID = nil
            documentText = ""
            documentLanguage = .python
        }
    }

    func openFile(_ relativePath: String) {
        guard let file = files.first(where: { $0.id == relativePath }) else { return }
        saveActiveDocumentNow()

        do {
            documentText = try String(contentsOf: file.url, encoding: .utf8)
            documentLanguage = file.language
            activeFileID = file.id
            if let projectID = activeProjectID {
                UserDefaults.standard.set(file.id, forKey: "bide.lastFile.\(projectID.uuidString)")
            }
            saveState = .saved
        } catch {
            saveState = .failed("Could not open \(file.name): \(error.localizedDescription)")
        }
    }

    func createFile(named requestedName: String, language: CodeLanguage) {
        guard let projectID = activeProjectID else { return }
        let projectDirectory = projectDirectory(for: projectID)
        let cleanBase = sanitizedFileBase(requestedName)
        let fileName = uniqueFileName(base: cleanBase, language: language, in: projectDirectory)
        let url = projectDirectory.appendingPathComponent(fileName)

        do {
            try language.starterCode.write(to: url, atomically: true, encoding: .utf8)
            touchActiveProject()
            refreshFiles()
            openFile(fileName)
        } catch {
            saveState = .failed("Could not create file: \(error.localizedDescription)")
        }
    }

    func renameFile(_ file: BideProjectFile, to requestedName: String) {
        let base = sanitizedFileBase(requestedName)
        guard !base.isEmpty else { return }
        let newName = "\(base).\(file.language.fileExtension)"
        guard newName != file.name else { return }
        let destination = file.url.deletingLastPathComponent().appendingPathComponent(newName)
        guard !fileManager.fileExists(atPath: destination.path) else {
            saveState = .failed("A file named \(newName) already exists.")
            return
        }

        saveActiveDocumentNow()
        do {
            try fileManager.moveItem(at: file.url, to: destination)
            let wasActive = activeFileID == file.id
            touchActiveProject()
            refreshFiles()
            if wasActive {
                let components = file.relativePath.split(separator: "/")
                let newRelative: String
                if components.count <= 1 {
                    newRelative = newName
                } else {
                    newRelative = components.dropLast().map(String.init).joined(separator: "/") + "/" + newName
                }
                openFile(newRelative)
            }
        } catch {
            saveState = .failed("Could not rename file: \(error.localizedDescription)")
        }
    }

    func deleteFile(_ file: BideProjectFile) {
        saveActiveDocumentNow()
        do {
            try fileManager.removeItem(at: file.url)
            let wasActive = activeFileID == file.id
            touchActiveProject()
            refreshFiles()
            if wasActive {
                if let first = files.first {
                    openFile(first.id)
                } else {
                    activeFileID = nil
                    documentText = ""
                }
            }
        } catch {
            saveState = .failed("Could not delete file: \(error.localizedDescription)")
        }
    }

    func saveActiveDocumentNow() {
        autosaveTask?.cancel()
        autosaveTask = nil
        guard let file = activeFile else { return }

        do {
            try documentText.write(to: file.url, atomically: true, encoding: .utf8)
            saveState = .saved
        } catch {
            saveState = .failed("Autosave failed: \(error.localizedDescription)")
        }
    }

    private func bootstrap() {
        do {
            try fileManager.createDirectory(at: rootDirectory, withIntermediateDirectories: true)
            refreshProjects()
            if projects.isEmpty {
                createProject(named: "My Project")
                return
            }

            if let stored = UserDefaults.standard.string(forKey: "bide.lastProject"),
               let id = UUID(uuidString: stored),
               projects.contains(where: { $0.id == id }) {
                openProject(id)
            } else if let first = projects.first {
                openProject(first.id)
            }
        } catch {
            saveState = .failed("Workspace could not start: \(error.localizedDescription)")
        }
    }

    private func scheduleAutosave() {
        autosaveTask?.cancel()
        autosaveTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 650_000_000)
            guard !Task.isCancelled else { return }
            self?.saveActiveDocumentNow()
        }
    }

    private func refreshProjects() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let directories = try? fileManager.contentsOfDirectory(
            at: rootDirectory,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else {
            projects = []
            return
        }

        projects = directories.compactMap { directory in
            guard (try? directory.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true else { return nil }
            let manifestURL = directory.appendingPathComponent("project.bide.json")
            guard let data = try? Data(contentsOf: manifestURL) else { return nil }
            return try? decoder.decode(BideProjectManifest.self, from: data)
        }
        .sorted { lhs, rhs in
            lhs.updatedAt > rhs.updatedAt
        }
    }

    private func refreshFiles() {
        guard let projectID = activeProjectID else {
            files = []
            return
        }
        let directory = projectDirectory(for: projectID)
        guard let enumerator = fileManager.enumerator(
            at: directory,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles]
        ) else {
            files = []
            return
        }

        var nextFiles: [BideProjectFile] = []
        for case let url as URL in enumerator {
            guard (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
            guard let language = CodeLanguage.infer(from: url.lastPathComponent) else { continue }
            let prefix = directory.path.hasSuffix("/") ? directory.path : directory.path + "/"
            let relativePath = url.path.replacingOccurrences(of: prefix, with: "")
            nextFiles.append(BideProjectFile(relativePath: relativePath, url: url, language: language))
        }

        files = nextFiles.sorted { lhs, rhs in
            lhs.relativePath.localizedStandardCompare(rhs.relativePath) == .orderedAscending
        }
    }

    private func touchActiveProject() {
        guard let project = activeProject else { return }
        var updated = project
        updated.updatedAt = .now
        try? writeManifest(updated, to: projectDirectory(for: project.id))
        refreshProjects()
    }

    private func projectDirectory(for id: UUID) -> URL {
        rootDirectory.appendingPathComponent(id.uuidString, isDirectory: true)
    }

    private func writeManifest(_ manifest: BideProjectManifest, to directory: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(manifest)
        try data.write(to: directory.appendingPathComponent("project.bide.json"), options: .atomic)
    }

    private func sanitizedFileBase(_ requestedName: String) -> String {
        let raw = requestedName.trimmingCharacters(in: .whitespacesAndNewlines)
        let withoutExtension = URL(fileURLWithPath: raw).deletingPathExtension().lastPathComponent
        let sanitized = withoutExtension.replacingOccurrences(
            of: "[^A-Za-z0-9 _-]+",
            with: "_",
            options: .regularExpression
        )
        return sanitized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "untitled" : sanitized
    }

    private func uniqueFileName(base: String, language: CodeLanguage, in directory: URL) -> String {
        let initial = "\(base).\(language.fileExtension)"
        if !fileManager.fileExists(atPath: directory.appendingPathComponent(initial).path) {
            return initial
        }

        var index = 2
        while fileManager.fileExists(atPath: directory.appendingPathComponent("\(base) \(index).\(language.fileExtension)").path) {
            index += 1
        }
        return "\(base) \(index).\(language.fileExtension)"
    }
}
