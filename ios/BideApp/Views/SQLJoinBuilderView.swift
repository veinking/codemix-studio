import SwiftUI

struct SQLJoinBuilderView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var session: AppSession

    let tables: [DatasetTableDescriptor]

    @State private var leftTableID: UUID?
    @State private var rightTableID: UUID?
    @State private var leftColumn = ""
    @State private var rightColumn = ""
    @State private var joinType: JoinType = .inner

    var body: some View {
        NavigationStack {
            Form {
                Section("Join Type") {
                    Picker("Type", selection: $joinType) {
                        ForEach(JoinType.allCases) { type in
                            Text(type.label).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Left Table") {
                    Picker("Table", selection: $leftTableID) {
                        ForEach(tables) { table in
                            Text(table.sqliteName).tag(Optional(table.id))
                        }
                    }
                    .onChange(of: leftTableID) { _, _ in
                        if let first = leftTable?.columns.first {
                            leftColumn = first.name
                        }
                        if rightTableID == leftTableID {
                            rightTableID = tables.first(where: { $0.id != leftTableID })?.id
                        }
                    }

                    if let table = leftTable {
                        Picker("Match column", selection: $leftColumn) {
                            ForEach(table.columns) { column in
                                Text(column.name).tag(column.name)
                            }
                        }
                    }
                }

                Section("Right Table") {
                    Picker("Table", selection: $rightTableID) {
                        ForEach(tables.filter { $0.id != leftTableID }) { table in
                            Text(table.sqliteName).tag(Optional(table.id))
                        }
                    }
                    .onChange(of: rightTableID) { _, _ in
                        if let first = rightTable?.columns.first {
                            rightColumn = first.name
                        }
                    }

                    if let table = rightTable {
                        Picker("Match column", selection: $rightColumn) {
                            ForEach(table.columns) { column in
                                Text(column.name).tag(column.name)
                            }
                        }
                    }
                }

                if let sql = generatedSQL {
                    Section("SQL Preview") {
                        Text(sql)
                            .font(.caption.monospaced())
                            .textSelection(.enabled)
                    }

                    Section {
                        Button("Create Join Query", systemImage: "doc.badge.plus") {
                            createQuery(sql)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            }
            .navigationTitle("Join Tables")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear(perform: configureDefaults)
        }
    }

    private var leftTable: DatasetTableDescriptor? {
        guard let leftTableID else { return nil }
        return tables.first(where: { $0.id == leftTableID })
    }

    private var rightTable: DatasetTableDescriptor? {
        guard let rightTableID else { return nil }
        return tables.first(where: { $0.id == rightTableID })
    }

    private var generatedSQL: String? {
        guard let leftTable,
              let rightTable,
              !leftColumn.isEmpty,
              !rightColumn.isEmpty else { return nil }

        let leftName = SQLiteProjectEngine.quoteIdentifier(leftTable.sqliteName)
        let rightName = SQLiteProjectEngine.quoteIdentifier(rightTable.sqliteName)
        let leftKey = SQLiteProjectEngine.quoteIdentifier(leftColumn)
        let rightKey = SQLiteProjectEngine.quoteIdentifier(rightColumn)

        return """
        SELECT *
        FROM \(leftName) AS l
        \(joinType.sql) \(rightName) AS r
          ON l.\(leftKey) = r.\(rightKey);
        """
    }

    private func configureDefaults() {
        guard tables.count >= 2 else { return }
        if leftTableID == nil { leftTableID = tables[0].id }
        if rightTableID == nil { rightTableID = tables[1].id }
        if leftColumn.isEmpty { leftColumn = tables[0].columns.first?.name ?? "" }
        if rightColumn.isEmpty { rightColumn = tables[1].columns.first?.name ?? "" }
    }

    private func createQuery(_ sql: String) {
        let left = leftTable?.sqliteName ?? "left"
        let right = rightTable?.sqliteName ?? "right"
        workspace.createFile(named: "join_\(left)_\(right)", language: .sql)
        workspace.updateDocumentText(sql + "\n")
        workspace.saveActiveDocumentNow()
        session.selectedSection = .workspace
        dismiss()
    }
}

private enum JoinType: String, CaseIterable, Identifiable {
    case inner
    case left

    var id: String { rawValue }
    var label: String { rawValue.capitalized }

    var sql: String {
        switch self {
        case .inner: return "INNER JOIN"
        case .left: return "LEFT JOIN"
        }
    }
}
