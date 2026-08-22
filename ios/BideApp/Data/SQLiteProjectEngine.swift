import Foundation
import SQLite3

enum SQLiteProjectEngineError: LocalizedError, Sendable {
    case sqlite(String)
    case emptySQL

    var errorDescription: String? {
        switch self {
        case .sqlite(let message): return message
        case .emptySQL: return "There is no SQL to run."
        }
    }
}

enum SQLiteProjectEngine {
    static func importTable(
        databaseURL: URL,
        sqliteName: String,
        table: ParsedDatasetTable
    ) throws {
        let db = try openDatabase(at: databaseURL)
        defer { sqlite3_close(db) }

        try executeRaw(db, "BEGIN IMMEDIATE TRANSACTION;")
        do {
            try executeRaw(db, "DROP TABLE IF EXISTS \(quoteIdentifier(sqliteName));")

            let columnSQL = table.columns.map { column in
                "\(quoteIdentifier(column.name)) \(column.type.rawValue)"
            }.joined(separator: ", ")
            try executeRaw(db, "CREATE TABLE \(quoteIdentifier(sqliteName)) (\(columnSQL));")

            if !table.rows.isEmpty {
                let placeholders = Array(repeating: "?", count: table.columns.count).joined(separator: ", ")
                let insertSQL = "INSERT INTO \(quoteIdentifier(sqliteName)) VALUES (\(placeholders));"
                var statement: OpaquePointer?
                guard sqlite3_prepare_v2(db, insertSQL, -1, &statement, nil) == SQLITE_OK,
                      let statement else {
                    throw SQLiteProjectEngineError.sqlite(lastError(db))
                }
                defer { sqlite3_finalize(statement) }

                for row in table.rows {
                    sqlite3_reset(statement)
                    sqlite3_clear_bindings(statement)

                    for (columnIndex, column) in table.columns.enumerated() {
                        let value = columnIndex < row.count ? row[columnIndex] : nil
                        try bind(
                            value,
                            type: column.type,
                            index: Int32(columnIndex + 1),
                            statement: statement,
                            db: db
                        )
                    }

                    guard sqlite3_step(statement) == SQLITE_DONE else {
                        throw SQLiteProjectEngineError.sqlite(lastError(db))
                    }
                }
            }

            try executeRaw(db, "COMMIT;")
        } catch {
            try? executeRaw(db, "ROLLBACK;")
            throw error
        }
    }

    static func dropTables(databaseURL: URL, names: [String]) throws {
        guard FileManager.default.fileExists(atPath: databaseURL.path) else { return }
        let db = try openDatabase(at: databaseURL)
        defer { sqlite3_close(db) }
        for name in names {
            try executeRaw(db, "DROP TABLE IF EXISTS \(quoteIdentifier(name));")
        }
    }

    static func execute(
        databaseURL: URL,
        sql: String,
        rowLimit: Int = 500
    ) throws -> SQLRunReport {
        let trimmed = sql.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw SQLiteProjectEngineError.emptySQL }

        let started = Date()
        let db = try openDatabase(at: databaseURL)
        defer { sqlite3_close(db) }

        var resultSets: [SQLResultSet] = []
        var statementCount = 0

        try sql.withCString { basePointer in
            var current: UnsafePointer<CChar>? = basePointer

            while let cursor = current, cursor.pointee != 0 {
                var statement: OpaquePointer?
                var tail: UnsafePointer<CChar>?
                let prepareResult = sqlite3_prepare_v2(db, cursor, -1, &statement, &tail)
                guard prepareResult == SQLITE_OK else {
                    throw SQLiteProjectEngineError.sqlite(lastError(db))
                }

                guard let statement else {
                    if tail == cursor { break }
                    current = tail
                    continue
                }
                defer { sqlite3_finalize(statement) }

                statementCount += 1
                let columnCount = Int(sqlite3_column_count(statement))
                let columns = (0..<columnCount).map { index -> String in
                    guard let pointer = sqlite3_column_name(statement, Int32(index)) else {
                        return "Column \(index + 1)"
                    }
                    return String(cString: pointer)
                }

                var rows: [[String?]] = []
                var truncated = false
                var stepResult = sqlite3_step(statement)

                while stepResult == SQLITE_ROW {
                    if rows.count < rowLimit {
                        rows.append((0..<columnCount).map { columnValue(statement, index: Int32($0)) })
                    } else {
                        truncated = true
                        break
                    }
                    stepResult = sqlite3_step(statement)
                }

                if !truncated, stepResult != SQLITE_DONE {
                    throw SQLiteProjectEngineError.sqlite(lastError(db))
                }

                resultSets.append(
                    SQLResultSet(
                        columns: columns,
                        rows: rows,
                        rowCount: rows.count,
                        affectedRows: columnCount == 0 ? Int(sqlite3_changes(db)) : 0,
                        isTruncated: truncated,
                        statementIndex: statementCount
                    )
                )

                if tail == cursor { break }
                current = tail
            }
        }

        let elapsed = Date().timeIntervalSince(started) * 1_000
        return SQLRunReport(
            resultSets: resultSets,
            statementCount: statementCount,
            elapsedMilliseconds: elapsed
        )
    }

    static func quoteIdentifier(_ identifier: String) -> String {
        "\"\(identifier.replacingOccurrences(of: "\"", with: "\"\""))\""
    }

    private static func openDatabase(at url: URL) throws -> OpaquePointer {
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )

        var db: OpaquePointer?
        let flags = SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX
        guard sqlite3_open_v2(url.path, &db, flags, nil) == SQLITE_OK, let db else {
            let message = db.map(lastError) ?? "Could not open the project SQLite database."
            if let db { sqlite3_close(db) }
            throw SQLiteProjectEngineError.sqlite(message)
        }
        sqlite3_busy_timeout(db, 3_000)
        return db
    }

    private static func executeRaw(_ db: OpaquePointer, _ sql: String) throws {
        var errorPointer: UnsafeMutablePointer<CChar>?
        let result = sqlite3_exec(db, sql, nil, nil, &errorPointer)
        guard result == SQLITE_OK else {
            let message = errorPointer.map { String(cString: $0) } ?? lastError(db)
            sqlite3_free(errorPointer)
            throw SQLiteProjectEngineError.sqlite(message)
        }
    }

    private static func bind(
        _ value: String?,
        type: DatasetColumnType,
        index: Int32,
        statement: OpaquePointer,
        db: OpaquePointer
    ) throws {
        guard let value else {
            guard sqlite3_bind_null(statement, index) == SQLITE_OK else {
                throw SQLiteProjectEngineError.sqlite(lastError(db))
            }
            return
        }

        let result: Int32
        switch type {
        case .integer:
            if let integer = Int64(value) {
                result = sqlite3_bind_int64(statement, index, integer)
            } else {
                result = bindText(value, index: index, statement: statement)
            }
        case .real:
            if let number = Double(value) {
                result = sqlite3_bind_double(statement, index, number)
            } else {
                result = bindText(value, index: index, statement: statement)
            }
        case .text:
            result = bindText(value, index: index, statement: statement)
        }

        guard result == SQLITE_OK else {
            throw SQLiteProjectEngineError.sqlite(lastError(db))
        }
    }

    private static func bindText(_ value: String, index: Int32, statement: OpaquePointer) -> Int32 {
        value.withCString { pointer in
            sqlite3_bind_text(
                statement,
                index,
                pointer,
                -1,
                unsafeBitCast(-1, to: sqlite3_destructor_type.self)
            )
        }
    }

    private static func columnValue(_ statement: OpaquePointer, index: Int32) -> String? {
        switch sqlite3_column_type(statement, index) {
        case SQLITE_NULL:
            return nil
        case SQLITE_INTEGER:
            return String(sqlite3_column_int64(statement, index))
        case SQLITE_FLOAT:
            return String(sqlite3_column_double(statement, index))
        case SQLITE_TEXT:
            guard let pointer = sqlite3_column_text(statement, index) else { return nil }
            return String(cString: pointer)
        case SQLITE_BLOB:
            return "<BLOB \(sqlite3_column_bytes(statement, index)) bytes>"
        default:
            return nil
        }
    }

    private static func lastError(_ db: OpaquePointer) -> String {
        guard let pointer = sqlite3_errmsg(db) else { return "SQLite error." }
        return String(cString: pointer)
    }
}
