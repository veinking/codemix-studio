import CoreXLSX
import Foundation

enum DatasetParserError: LocalizedError {
    case unreadable(String)
    case unsupportedJSON
    case emptyDataset(String)
    case invalidExcel

    var errorDescription: String? {
        switch self {
        case .unreadable(let name):
            return "Could not read \(name)."
        case .unsupportedJSON:
            return "JSON datasets must be an array of objects, an object, or an array of scalar values."
        case .emptyDataset(let name):
            return "\(name) does not contain any tabular rows."
        case .invalidExcel:
            return "The XLSX workbook could not be parsed. Legacy .xls files are not supported yet."
        }
    }
}

enum DatasetParser {
    static func parse(url: URL, format: DatasetFormat) throws -> [ParsedDatasetTable] {
        switch format {
        case .csv:
            return [try parseDelimited(url: url, delimiter: ",")]
        case .tsv:
            return [try parseDelimited(url: url, delimiter: "\t")]
        case .text:
            return [try parseText(url: url)]
        case .json:
            return [try parseJSON(url: url)]
        case .xlsx:
            return try parseXLSX(url: url)
        }
    }

    private static func parseDelimited(url: URL, delimiter: Character) throws -> ParsedDatasetTable {
        guard var source = try? String(contentsOf: url, encoding: .utf8) else {
            throw DatasetParserError.unreadable(url.lastPathComponent)
        }
        if source.first == "\u{feff}" {
            source.removeFirst()
        }
        let records = delimitedRecords(in: source, delimiter: delimiter)
        return try normalize(records: records, displayName: url.deletingPathExtension().lastPathComponent)
    }

    private static func parseText(url: URL) throws -> ParsedDatasetTable {
        guard var source = try? String(contentsOf: url, encoding: .utf8) else {
            throw DatasetParserError.unreadable(url.lastPathComponent)
        }
        if source.first == "\u{feff}" {
            source.removeFirst()
        }

        let sample = source.split(whereSeparator: \.isNewline).first.map(String.init) ?? ""
        let candidates: [Character] = ["\t", ",", "|", ";"]
        let best = candidates
            .map { delimiter in (delimiter, sample.filter { $0 == delimiter }.count) }
            .max { lhs, rhs in lhs.1 < rhs.1 }

        if let best, best.1 > 0 {
            return try normalize(
                records: delimitedRecords(in: source, delimiter: best.0),
                displayName: url.deletingPathExtension().lastPathComponent
            )
        }

        let rows = source
            .split(whereSeparator: \.isNewline)
            .map { [String($0)] }
        guard !rows.isEmpty else {
            throw DatasetParserError.emptyDataset(url.lastPathComponent)
        }
        return ParsedDatasetTable(
            displayName: url.deletingPathExtension().lastPathComponent,
            sourceSheetName: nil,
            columns: [DatasetColumn(name: "text", type: .text)],
            rows: rows.map { $0.map(Optional.some) }
        )
    }

    private static func parseJSON(url: URL) throws -> ParsedDatasetTable {
        let data = try Data(contentsOf: url)
        let object = try JSONSerialization.jsonObject(with: data)
        let name = url.deletingPathExtension().lastPathComponent

        if let dictionaries = object as? [[String: Any]] {
            guard !dictionaries.isEmpty else { throw DatasetParserError.emptyDataset(url.lastPathComponent) }
            let headers = Array(Set(dictionaries.flatMap { $0.keys })).sorted()
            guard !headers.isEmpty else { throw DatasetParserError.emptyDataset(url.lastPathComponent) }
            let rows = dictionaries.map { dictionary in
                headers.map { stringifyJSONValue(dictionary[$0]) }
            }
            return makeTable(displayName: name, sourceSheetName: nil, headers: headers, rows: rows)
        }

        if let dictionary = object as? [String: Any] {
            let headers = dictionary.keys.sorted()
            guard !headers.isEmpty else { throw DatasetParserError.emptyDataset(url.lastPathComponent) }
            let row = headers.map { stringifyJSONValue(dictionary[$0]) }
            return makeTable(displayName: name, sourceSheetName: nil, headers: headers, rows: [row])
        }

        if let values = object as? [Any] {
            guard !values.isEmpty else { throw DatasetParserError.emptyDataset(url.lastPathComponent) }
            let rows = values.map { [stringifyJSONValue($0)] }
            return makeTable(displayName: name, sourceSheetName: nil, headers: ["value"], rows: rows)
        }

        throw DatasetParserError.unsupportedJSON
    }

    private static func parseXLSX(url: URL) throws -> [ParsedDatasetTable] {
        guard let file = XLSXFile(filepath: url.path) else {
            throw DatasetParserError.invalidExcel
        }

        let sharedStrings = try file.parseSharedStrings()
        var parsed: [ParsedDatasetTable] = []
        var sheetIndex = 0

        for workbook in try file.parseWorkbooks() {
            for (name, path) in try file.parseWorksheetPathsAndNames(workbook: workbook) {
                sheetIndex += 1
                let worksheet = try file.parseWorksheet(at: path)
                let worksheetRows = worksheet.data?.rows ?? []
                guard !worksheetRows.isEmpty else { continue }

                var sparseRows: [[Int: String?]] = []
                var maxColumnIndex = 0

                for row in worksheetRows {
                    var valuesByIndex: [Int: String?] = [:]
                    for cell in row.cells {
                        let index = excelColumnIndex(cell.reference.column.value)
                        maxColumnIndex = max(maxColumnIndex, index)

                        let sharedValue: String?
                        if let sharedStrings {
                            sharedValue = cell.stringValue(sharedStrings)
                        } else {
                            sharedValue = nil
                        }
                        let value = cell.inlineString?.text ?? sharedValue ?? cell.value
                        valuesByIndex[index] = normalizedCell(value)
                    }
                    sparseRows.append(valuesByIndex)
                }

                let denseRows = sparseRows.map { valuesByIndex in
                    (0...maxColumnIndex).map { valuesByIndex[$0] ?? nil }
                }

                guard let headerIndex = denseRows.firstIndex(where: { row in
                    row.contains { value in
                        guard let value else { return false }
                        return !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    }
                }) else { continue }

                let headerRow = denseRows[headerIndex]
                let dataRows = Array(denseRows.dropFirst(headerIndex + 1))
                let sheetName = name ?? "Sheet \(sheetIndex)"
                let table = makeTable(
                    displayName: sheetName,
                    sourceSheetName: sheetName,
                    headers: headerRow.enumerated().map { index, value in
                        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                        return trimmed.isEmpty ? "Column \(index + 1)" : trimmed
                    },
                    rows: dataRows
                )
                parsed.append(table)
            }
        }

        guard !parsed.isEmpty else { throw DatasetParserError.emptyDataset(url.lastPathComponent) }
        return parsed
    }

    private static func normalize(records: [[String]], displayName: String) throws -> ParsedDatasetTable {
        let nonEmpty = records.filter { row in
            row.contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        }
        guard let first = nonEmpty.first else { throw DatasetParserError.emptyDataset(displayName) }

        let width = max(first.count, nonEmpty.dropFirst().map(\.count).max() ?? 0)
        var headers = (0..<width).map { index -> String in
            guard index < first.count else { return "Column \(index + 1)" }
            let candidate = first[index].trimmingCharacters(in: .whitespacesAndNewlines)
            return candidate.isEmpty ? "Column \(index + 1)" : candidate
        }
        headers = uniqueHeaders(headers)

        let rows = nonEmpty.dropFirst().map { record -> [String?] in
            (0..<width).map { index in
                guard index < record.count else { return nil }
                return normalizedCell(record[index])
            }
        }
        return makeTable(displayName: displayName, sourceSheetName: nil, headers: headers, rows: rows)
    }

    private static func makeTable(
        displayName: String,
        sourceSheetName: String?,
        headers rawHeaders: [String],
        rows rawRows: [[String?]]
    ) -> ParsedDatasetTable {
        let width = max(rawHeaders.count, rawRows.map(\.count).max() ?? 0)
        let paddedHeaders = (0..<width).map { index -> String in
            if index < rawHeaders.count {
                let trimmed = rawHeaders[index].trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty { return trimmed }
            }
            return "Column \(index + 1)"
        }
        let headers = uniqueHeaders(paddedHeaders)
        let rows = rawRows.map { row in
            (0..<width).map { index in index < row.count ? normalizedCell(row[index]) : nil }
        }
        let columns = headers.enumerated().map { index, header in
            DatasetColumn(name: header, type: inferColumnType(rows: rows, index: index))
        }
        return ParsedDatasetTable(
            displayName: displayName,
            sourceSheetName: sourceSheetName,
            columns: columns,
            rows: rows
        )
    }

    private static func inferColumnType(rows: [[String?]], index: Int) -> DatasetColumnType {
        let values = rows.prefix(5_000).compactMap { row -> String? in
            guard index < row.count, let value = row[index] else { return nil }
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }
        guard !values.isEmpty else { return .text }
        if values.allSatisfy(isStrictInteger) { return .integer }
        if values.allSatisfy(isStrictReal) { return .real }
        return .text
    }

    private static func isStrictInteger(_ value: String) -> Bool {
        guard Int64(value) != nil else { return false }
        return !hasSignificantLeadingZero(value)
    }

    private static func isStrictReal(_ value: String) -> Bool {
        guard Double(value) != nil else { return false }
        return !hasSignificantLeadingZero(value)
    }

    private static func hasSignificantLeadingZero(_ value: String) -> Bool {
        let unsigned = value.hasPrefix("-") || value.hasPrefix("+") ? String(value.dropFirst()) : value
        guard unsigned.count > 1, unsigned.first == "0" else { return false }
        let second = unsigned[unsigned.index(after: unsigned.startIndex)]
        return second != "."
    }

    private static func uniqueHeaders(_ headers: [String]) -> [String] {
        var counts: [String: Int] = [:]
        return headers.map { header in
            let base = header.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Column" : header
            let key = base.lowercased()
            let next = (counts[key] ?? 0) + 1
            counts[key] = next
            return next == 1 ? base : "\(base)_\(next)"
        }
    }

    private static func stringifyJSONValue(_ value: Any?) -> String? {
        guard let value, !(value is NSNull) else { return nil }
        if let string = value as? String { return string }
        if let number = value as? NSNumber { return number.stringValue }
        if JSONSerialization.isValidJSONObject(value),
           let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
           let string = String(data: data, encoding: .utf8) {
            return string
        }
        return String(describing: value)
    }

    private static func normalizedCell(_ value: String?) -> String? {
        guard let value else { return nil }
        let normalized = value.replacingOccurrences(of: "\r\n", with: "\n")
        return normalized.isEmpty ? nil : normalized
    }

    private static func excelColumnIndex(_ letters: String) -> Int {
        var value = 0
        for scalar in letters.uppercased().unicodeScalars {
            let digit = Int(scalar.value) - 64
            guard (1...26).contains(digit) else { continue }
            value = value * 26 + digit
        }
        return max(0, value - 1)
    }

    private static func delimitedRecords(in source: String, delimiter: Character) -> [[String]] {
        var rows: [[String]] = []
        var row: [String] = []
        var field = ""
        var inQuotes = false
        var index = source.startIndex

        while index < source.endIndex {
            let character = source[index]
            let nextIndex = source.index(after: index)

            if character == "\"" {
                if inQuotes, nextIndex < source.endIndex, source[nextIndex] == "\"" {
                    field.append("\"")
                    index = source.index(after: nextIndex)
                    continue
                }
                inQuotes.toggle()
            } else if character == delimiter, !inQuotes {
                row.append(field)
                field = ""
            } else if (character == "\n" || character == "\r"), !inQuotes {
                if character == "\r", nextIndex < source.endIndex, source[nextIndex] == "\n" {
                    index = source.index(after: nextIndex)
                } else {
                    index = nextIndex
                }
                row.append(field)
                rows.append(row)
                row = []
                field = ""
                continue
            } else {
                field.append(character)
            }
            index = nextIndex
        }

        if !field.isEmpty || !row.isEmpty {
            row.append(field)
            rows.append(row)
        }
        return rows
    }
}
