import Foundation
import XCTest
@testable import bIDE

@MainActor
final class CodeRuntimeSmokeTests: XCTestCase {
    func testBundledPythonSupportsGeneralCodeAndSessionState() async throws {
        let runtime = try makeRuntime()

        await runtime.execute(
            """
            import math

            def summarize(values):
                squares = [value ** 2 for value in values]
                return {"total": sum(values), "squares": squares}

            summary = summarize([1, 2, 3, 4])
            saved_answer = int(math.sqrt(1764))
            print(summary["total"])
            print(summary["squares"])
            print(saved_answer)
            """,
            language: .python
        )

        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected Python bridge error")
        let first = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(first.succeeded, first.error)
        XCTAssertEqual(first.language, .python)
        XCTAssertTrue(first.stdout.contains("10"), "Unexpected Python output: \(first.stdout)")
        XCTAssertTrue(first.stdout.contains("[1, 4, 9, 16]"), "Unexpected Python output: \(first.stdout)")
        XCTAssertTrue(first.stdout.contains("42"), "Unexpected Python output: \(first.stdout)")
        XCTAssertTrue(first.runtime.contains("Pyodide"), "Unexpected Python runtime label: \(first.runtime)")

        await runtime.execute("print(saved_answer + 1)", language: .python)
        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected Python persistence error")
        let second = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(second.succeeded, second.error)
        XCTAssertTrue(second.stdout.contains("43"), "Python session state did not persist: \(second.stdout)")
    }

    func testBundledRSupportsGeneralCodeAndSessionState() async throws {
        let runtime = try makeRuntime()

        await runtime.execute(
            """
            score_mean <- function(values) mean(values, na.rm = TRUE)
            frame <- data.frame(
              name = c("A", "B", "C", "D"),
              x = c(1, 2, 3, 4),
              y = c(3, 5, 7, 9)
            )
            saved_mean <- score_mean(c(1, 2, 3, NA))
            model <- lm(y ~ x, data = frame)
            print(saved_mean)
            print(nrow(frame))
            print(unname(coef(model)[2]))
            """,
            language: .r
        )

        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected R bridge error")
        let first = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(first.succeeded, first.error)
        XCTAssertEqual(first.language, .r)
        XCTAssertTrue(first.stdout.contains("2"), "Unexpected R output: \(first.stdout)")
        XCTAssertTrue(first.stdout.contains("4"), "Unexpected R data.frame output: \(first.stdout)")
        XCTAssertTrue(first.runtime.contains("webR"), "Unexpected R runtime label: \(first.runtime)")

        await runtime.execute("print(saved_mean + 10)", language: .r)
        XCTAssertNil(runtime.runtimeError, runtime.runtimeError ?? "Unexpected R persistence error")
        let second = try XCTUnwrap(runtime.lastRun)
        XCTAssertTrue(second.succeeded, second.error)
        XCTAssertTrue(second.stdout.contains("12"), "R session state did not persist: \(second.stdout)")
    }

    private func makeRuntime() throws -> CodeRuntimeStore {
        let bundle = Bundle(for: CodeRuntimeSmokeTests.self)
        let runtimeRoot = try XCTUnwrap(
            bundle.url(forResource: "RuntimeAssets", withExtension: nil),
            "The test bundle must contain the same pinned RuntimeAssets folder shipped by bIDE."
        )
        let runtime = CodeRuntimeStore()
        runtime.runtimeRootOverride = runtimeRoot
        return runtime
    }
}
