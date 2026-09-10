import Foundation
import XCTest
@testable import bIDE

@MainActor
final class CodeRuntimeSmokeTests: XCTestCase {
    func testBundledPythonAndRExecuteThroughNativeRuntimeBridge() async throws {
        let bundle = Bundle(for: CodeRuntimeSmokeTests.self)
        let runtimeRoot = try XCTUnwrap(
            bundle.url(forResource: "RuntimeAssets", withExtension: nil),
            "The test bundle must contain the same pinned RuntimeAssets folder shipped by bIDE."
        )

        let runtime = CodeRuntimeStore()
        runtime.runtimeRootOverride = runtimeRoot

        await runtime.execute(
            """
            values = [2, 4, 6]
            print(sum(values))
            """,
            language: .python
        )

        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected Python bridge error")
        let python = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(python.succeeded, python.error)
        XCTAssertEqual(python.language, .python)
        XCTAssertTrue(python.stdout.contains("12"), "Unexpected Python output: \(python.stdout)")
        XCTAssertTrue(python.runtime.contains("Pyodide"), "Unexpected Python runtime label: \(python.runtime)")

        runtime.resetSession()

        await runtime.execute(
            """
            x <- c(1, 2, 3, NA)
            print(mean(x, na.rm = TRUE))
            """,
            language: .r
        )

        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected R bridge error")
        let r = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(r.succeeded, r.error)
        XCTAssertEqual(r.language, .r)
        XCTAssertTrue(r.stdout.contains("2"), "Unexpected R output: \(r.stdout)")
        XCTAssertTrue(r.runtime.contains("webR"), "Unexpected R runtime label: \(r.runtime)")
    }
}
