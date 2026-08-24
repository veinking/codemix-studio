import SwiftUI

struct SQLJoinBuilderView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    let tables: [DatasetTableDescriptor]
    let onEditableQueryCreated: () -> Void

    @State private var leftTableID: UUID?
    @State private var rightTableID: UUID?
    @State private var leftColumn = ""
    @State private var rightColumn = ""
    @State private var joinType: JoinType = .inner

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $joinType) {
                        ForEach(JoinType.allCases) { type in
                            Text(type.label).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Join Type")
                } footer: {
                    Text(joinType == .inner
                         ? "Inner keeps only rows that match in both tables."
                         : "Left keeps every row from the left table, even when the right table has no match.")
                }

                Section("Left Table") {
                    Picker("Table", selection: $leftTableID) {
                        ForEach(tables) { table in
                            Text(table.displayName).tag(Optional(table.id))
                        }
                    }
                    .onChange(of: leftTableID) { _, _ in
                        if rightTableID == leftTableID {
                            rightTableID = tables.first(where: { $0.id != leftTableID })?.id
                        }
                        suggestJoinColumns()
                    }

                    if let table = leftTable {
                        LabeledContent("SQL name", value: table.sqliteName)
                            .font(.caption)
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
                            Text(table.displayName).tag(Optional(table.id))
                        }
                    }
                    .onChange(of: rightTableID) { _, _ in
                        suggestJoinColumns()
                    }

                    if let table = rightTable {
                        LabeledContent("SQL name", value: table.sqliteName)
                            .font(.caption)
                        Picker("Match column", selection: $rightColumn) {
                            ForEach(table.columns) { column in
                                Text(column.name).tag(column.name)
                            }
                        }
                    }
                }

                if !leftColumn.isEmpty, !rightColumn.isEmpty {
                    Section {
                        HStack {
                            Image(systemName: leftColumn.caseInsensitiveCompare(rightColumn) == .orderedSame
                                  ? "checkmark.circle.fill"
                                  : "link")
                                .foregroundStyle(.secondary)
                            Text("\(leftColumn) ↔ \(rightColumn)")
                                .font(.subheadline.monospaced())
                        }
                    } footer: {
                        Text("bIDE automatically prefers same-named ID/key columns when both tables have one. You can change either column above.")
                    }
                }

                if let sql = generatedSQL {
                    Section("Generated SQL") {
                        Text(sql)
                            .font(.caption.monospaced())
                            .textSelection(.enabled)
                    }

                    Section {
                        Button {
                            runJoin(sql)
                        } label: {
                            HStack {
                                Label("Run Join & View Results", systemImage: "play.fill")
                                if dataWorkspace.isRunningSQL {
                                    Spacer()
                                    ProgressView()
                                        .controlSize(.small)
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(dataWorkspace.isRunningSQL)

                        Button("Create Editable Join Query", systemImage: "doc.badge.plus") {
                            createQuery(sql)
                        }
                        .disabled(dataWorkspace.isRunningSQL)
                    } footer: {
                        Text("Run the join immediately to inspect, save, or share its result. Or create an editable SQL file if you want to customize it first.")
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
            .alert("Join Error", isPresented: Binding(
                get: { dataWorkspace.sqlError != nil },
                set: { if !$0 { dataWorkspace.sqlError = nil } }
            )) {
                Button("OK", role: .cancel) { dataWorkspace.sqlError = nil }
            } message: {
                Text(dataWorkspace.sqlError ?? "Could not complete the join action.")
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
        SELECT l.*, r.*
        FROM \(leftName) AS l
        \(joinType.sql) \(rightName) AS r
          ON l.\(leftKey) = r.\(rightKey);
        """
    }

    private func configureDefaults() {
        guard tables.count >= 2 else { return }
        leftTableID = leftTableID ?? tables[0].id
        rightTableID = rightTableID ?? tables.first(where: { $0.id != leftTableID })?.id
        suggestJoinColumns()
    }

    private func suggestJoinColumns() {
        guard let leftTable, let rightTable else { return }

        let rightNames = Dictionary(uniqueKeysWithValues: rightTable.columns.map {
            ($0.name.lowercased(), $0.name)
        })
        let shared = leftTable.columns.compactMap { left -> (left: String, right: String, score: Int)? in
            guard let right = rightNames[left.name.lowercased()] else { return nil }
            return (left.name, right, joinKeyScore(left.name))
        }
        .sorted { lhs, rhs in
            if lhs.score != rhs.score { return lhs.score > rhs.score }
            return lhs.left.localizedStandardCompare(rhs.left) == .orderedAscending
        }

        if let best = shared.first {
            leftColumn = best.left
            rightColumn = best.right
        } else {
            leftColumn = leftTable.columns.first?.name ?? ""
            rightColumn = rightTable.columns.first?.name ?? ""
        }
    }

    private func joinKeyScore(_ name: String) -> Int {
        let normalized = name.lowercased()
        if normalized == "id" { return 90 }
        if normalized.hasSuffix("_id") { return 100 }
        if normalized.contains("key") { return 80 }
        if normalized.contains("code") { return 70 }
        return 10
    }

    private func runJoin(_ sql: String) {
        guard let projectID = workspace.activeProjectID else {
            dataWorkspace.sqlError = "Open or create a project before running a join."
            return
        }
        guard !dataWorkspace.isRunningSQL else { return }

        Task {
            await dataWorkspace.executeSQL(sql, projectID: projectID)
            if dataWorkspace.lastSQLRun != nil {
                dismiss()
            }
        }
    }

    private func createQuery(_ sql: String) {
        guard workspace.activeProjectID != nil else {
            dataWorkspace.sqlError = "Open or create a project before creating a join query."
            return
        }

        let previousFileID = workspace.activeFileID
        let left = leftTable?.sqliteName ?? "left"
        let right = rightTable?.sqliteName ?? "right"
        workspace.createFile(named: "join_\(left)_\(right)", language: .sql)

        guard let createdFileID = workspace.activeFileID,
              createdFileID != previousFileID,
              workspace.activeFile?.language == .sql else {
            dataWorkspace.sqlError = "bIDE could not create the editable SQL file. The Join Builder will stay open so nothing is lost."
            return
        }

        workspace.updateDocumentText(sql + "\n")
        workspace.saveActiveDocumentNow()
        onEditableQueryCreated()
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
