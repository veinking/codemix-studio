import Foundation

/// The deliberately small executable-language surface for native bIDE V1.
enum CodeLanguage: String, CaseIterable, Codable, Identifiable, Hashable {
    case python
    case sql
    case r

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .python: return "Python"
        case .sql: return "SQL"
        case .r: return "R"
        }
    }

    var fileExtension: String {
        switch self {
        case .python: return "py"
        case .sql: return "sql"
        case .r: return "R"
        }
    }

    var systemImage: String {
        switch self {
        case .python: return "chevron.left.forwardslash.chevron.right"
        case .sql: return "cylinder"
        case .r: return "chart.xyaxis.line"
        }
    }

    var starterCode: String {
        switch self {
        case .python:
            return "# bIDE Python\n\nprint(\"Hello from bIDE\")\n"
        case .sql:
            return "-- bIDE SQL\n\nSELECT 1 AS ready;\n"
        case .r:
            return "# bIDE R\n\nprint(\"Hello from bIDE\")\n"
        }
    }

    static func infer(from fileName: String) -> CodeLanguage? {
        let ext = URL(fileURLWithPath: fileName).pathExtension.lowercased()
        switch ext {
        case "py": return .python
        case "sql": return .sql
        case "r": return .r
        default: return nil
        }
    }
}
