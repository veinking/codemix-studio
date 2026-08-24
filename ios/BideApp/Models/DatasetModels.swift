import Foundation
import UniformTypeIdentifiers

struct DatasetColumn: Identifiable, Hashable, Codable, Sendable {
    let id: UUID
    let name: String
    let type: DatasetColumnType

    init(id: UUID = UUID(), name: String, type: DatasetColumnType) {
        self.id = id
        self.name = name
        self.type = type
    }
}

enum DatasetColumnType: String, Codable, Sendable {
    case integer = "INTEGER"
    case real = "REAL"
    case text = "TEXT"
}

enum DatasetFormat: String, Codable, CaseIterable, Sendable {
    case csv
    case tsv
    case json
    case text
    case xlsx

    var displayName: String {
        switch self {
        case .csv: return "CSV"
        case .tsv: return "TSV"
        case .json: return "JSON"
        case .text: return "Text"
        case .xlsx: return "Excel"
        }
    }

    var systemImage: String {
        switch self {
        case .csv, .tsv: return "tablecells"
        case .json: return "curlybraces"
        case .text: return "doc.plaintext"
        case .xlsx: return "tablecells.badge.ellipsis"
        }
    }

    static var importableTypes: [UTType] {
        var result: [UTType] = [.commaSeparatedText, .tabSeparatedText, .json, .plainText]
        if let xlsx = UTType(filenameExtension: "xlsx") { result.append(xlsx) }
        return result
    }

    static func infer(from url: URL) -> DatasetFormat? {
        switch url.pathExtension.lowercased() {
        case "csv": return .csv
        case "tsv": return .tsv
        case "json": return .json
        case "txt", "text", "dat": return .text
        case "xlsx": return .xlsx
        default: return nil
        }
    }
}

struct DatasetTableDescriptor: Identifiable, Hashable, Codable, Sendable {
    let id: UUID
    let displayName: String
    let sqliteName: String
    let sourceSheetName: String?
    let rowCount: Int
    let columns: [DatasetColumn]

    init(
        id: UUID = UUID(),
        displayName: String,
        sqliteName: String,
        sourceSheetName: String? = nil,
        rowCount: Int,
        columns: [DatasetColumn]
    ) {
        self.id = id
        self.displayName = displayName
        self.sqliteName = sqliteName
        self.sourceSheetName = sourceSheetName
        self.rowCount = rowCount
        self.columns = columns
    }
}

struct DatasetAsset: Identifiable, Hashable, Codable, Sendable {
    let id: UUID
    let fileName: String
    let relativePath: String
    let format: DatasetFormat
    let sizeBytes: Int64
    let importedAt: Date
    let tables: [DatasetTableDescriptor]

    init(
        id: UUID = UUID(),
        fileName: String,
        relativePath: String,
        format: DatasetFormat,
        sizeBytes: Int64,
        importedAt: Date = .now,
        tables: [DatasetTableDescriptor]
    ) {
        self.id = id
        self.fileName = fileName
        self.relativePath = relativePath
        self.format = format
        self.sizeBytes = sizeBytes
        self.importedAt = importedAt
        self.tables = tables
    }

    var totalRows: Int {
        tables.reduce(0) { $0 + $1.rowCount }
    }
}

struct ParsedDatasetTable: Hashable, Sendable {
    let displayName: String
    let sourceSheetName: String?
    let columns: [DatasetColumn]
    let rows: [[String?]]
}

struct SQLResultSet: Identifiable, Hashable, Sendable {
    let id = UUID()
    let columns: [String]
    let rows: [[String?]]
    let rowCount: Int
    let affectedRows: Int
    let isTruncated: Bool
    let statementIndex: Int
    let statementSQL: String
    let isReadOnly: Bool
}

struct SQLRunReport: Identifiable, Hashable, Sendable {
    let id = UUID()
    let resultSets: [SQLResultSet]
    let statementCount: Int
    let elapsedMilliseconds: Double

    var primaryResult: SQLResultSet? {
        resultSets.last(where: { !$0.columns.isEmpty }) ?? resultSets.last
    }
}

struct SQLQueryIntegritySummary: Sendable {
    let rowCount: Int
    let columns: [String]
    let valueFingerprint: UInt64
}

struct SQLCSVExportSummary: Sendable {
    let rowCount: Int
    let columns: [String]
    let sampleRows: [[String?]]
    let valueFingerprint: UInt64
}
