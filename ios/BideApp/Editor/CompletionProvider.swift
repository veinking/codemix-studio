import Foundation

struct CompletionSuggestion: Identifiable, Hashable {
    let label: String
    let insertText: String

    var id: String { "\(label)|\(insertText)" }
}

enum CompletionProvider {
    static func suggestions(
        text: String,
        selection: NSRange,
        language: CodeLanguage,
        projectFiles: [BideProjectFile],
        datasets: [DatasetAsset] = []
    ) -> [CompletionSuggestion] {
        guard selection.length == 0 else { return [] }
        let prefix = currentToken(in: text, caret: selection.location).lowercased()
        guard !prefix.isEmpty else { return [] }

        var candidates = languageSuggestions[language] ?? []
        candidates += projectFiles.map { file in
            CompletionSuggestion(label: file.name, insertText: file.name)
        }
        candidates += datasetSuggestions(language: language, datasets: datasets)

        var seen = Set<String>()
        return candidates
            .filter { suggestion in
                let searchable = suggestion.label.lowercased()
                return searchable.hasPrefix(prefix) || searchable.contains(prefix)
            }
            .filter { seen.insert($0.id).inserted }
            .prefix(8)
            .map { $0 }
    }

    static func currentToken(in text: String, caret: Int) -> String {
        let nsText = text as NSString
        let safeCaret = min(max(0, caret), nsText.length)
        guard safeCaret > 0 else { return "" }

        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "_."))
        var start = safeCaret
        while start > 0 {
            let range = NSRange(location: start - 1, length: 1)
            let scalarString = nsText.substring(with: range)
            guard scalarString.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { break }
            start -= 1
        }
        return nsText.substring(with: NSRange(location: start, length: safeCaret - start))
    }

    private static func datasetSuggestions(
        language: CodeLanguage,
        datasets: [DatasetAsset]
    ) -> [CompletionSuggestion] {
        switch language {
        case .sql:
            return datasets.flatMap { asset in
                asset.tables.flatMap { table -> [CompletionSuggestion] in
                    var suggestions = [
                        CompletionSuggestion(label: table.sqliteName, insertText: table.sqliteName)
                    ]
                    suggestions += table.columns.map { column in
                        CompletionSuggestion(
                            label: "\(table.sqliteName).\(column.name)",
                            insertText: "\(table.sqliteName).\(column.name)"
                        )
                    }
                    return suggestions
                }
            }
        case .python, .r:
            return datasets.map { asset in
                let path = "data/\(asset.fileName)"
                return CompletionSuggestion(label: path, insertText: path)
            }
        }
    }

    private static let languageSuggestions: [CodeLanguage: [CompletionSuggestion]] = [
        .python: [
            .init(label: "print", insertText: "print()"),
            .init(label: "import pandas as pd", insertText: "import pandas as pd"),
            .init(label: "pd.read_csv", insertText: "pd.read_csv(\"data.csv\")"),
            .init(label: "df.head", insertText: "df.head()"),
            .init(label: "def", insertText: "def function_name():\n    pass"),
            .init(label: "for", insertText: "for item in items:\n    pass")
        ],
        .sql: [
            .init(label: "SELECT", insertText: "SELECT *\nFROM table_name;"),
            .init(label: "WHERE", insertText: "WHERE condition"),
            .init(label: "JOIN", insertText: "JOIN table_name ON left_id = right_id"),
            .init(label: "GROUP BY", insertText: "GROUP BY column_name"),
            .init(label: "ORDER BY", insertText: "ORDER BY column_name DESC"),
            .init(label: "LIMIT", insertText: "LIMIT 100")
        ],
        .r: [
            .init(label: "library(dplyr)", insertText: "library(dplyr)"),
            .init(label: "read.csv", insertText: "read.csv(\"data.csv\")"),
            .init(label: "data.frame", insertText: "data.frame()"),
            .init(label: "ggplot", insertText: "ggplot(data, aes(x = x, y = y))"),
            .init(label: "mutate", insertText: "mutate()"),
            .init(label: "summarise", insertText: "summarise()")
        ]
    ]
}
