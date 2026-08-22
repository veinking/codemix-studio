import Foundation
import UniformTypeIdentifiers

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
        case .xlsx: return "tablecells.badge.ellipsis"
        case .json: return "curlybraces"
        case .text: return "doc.plaintext"
        case .csv, .tsv: return "tablecells"
        }
    }

    static func infer(from url: URL) -> DatasetFormat? {
        switch url.pathExtension.lowercased() {
        case "csv": return .csv
        case "tsv": return .tsv
        case "json": return .json
        case "txt": return .text
        case "xlsx": return .xlsx
        default: return nil
        }
    }

    static var importableTypes: [UTType] {
        var types: [UTType] = [.commaSeparatedText, .json, .plainText]
        if let tsv = UTType(filenameExtension: "tsv") { types.append(tsv) }
        if let xlsx = UTType(filenameExtension: "xlsx") { types.append(xlsx) }
        return types
    }
}

enum DatasetColumnType: String, Codable, Sendable {
    case integer = "INTEGER"
    case real = "REAL"
    case text = "TEXT"
}

struct DatasetColumn: Codable, Hashable, Identifiable, Sendable {
    let name: String
    let type: DatasetColumnType

    var id: String { name }
}

struct DatasetTableDescriptor: Codable, Hashable, Identifiable, Sendable {
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

struct DatasetAsset: Codable, Hashable, Identifiable, Sendable {
    let id: UUID
    let fileName: String
    let relativePath: String
    let format: DatasetFormat
    let sizeBytes: Int64
    let importedAt: Date
    var tables: [DatasetTableDescriptor]

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

struct ParsedDatasetTable: Sendable {
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
