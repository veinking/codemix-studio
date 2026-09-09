import SwiftUI

struct SQLResultsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var session: AppSession
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    let report: SQLRunReport
    var title: String = "SQL Results"

    @State private var shareURLs: [URL] = []
    @State private var savedDatasetMessage: String?
    @State private var isWorking = false

    private var exportableResult: SQLResultSet? {
        guard let primary = report.primaryResult,
              !primary.columns.isEmpty,
              primary.isReadOnly else { return nil }
        return primary
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Run Summary") {
                    LabeledContent("Statements", value: "\(report.statementCount)")
                    LabeledContent("Elapsed", value: String(format: "%.1f ms", report.elapsedMilliseconds))
                }

                if exportableResult != nil {
                    Section {
                        Button {
                            exportForSharing()
                        } label: {
                            Label("Share Result as CSV", systemImage: "square.and.arrow.up")
                        }
                        .disabled(isWorking)

                        Button {
                            saveAsDataset()
                        } label: {
                            Label("Save Result as Dataset", systemImage: "tablecells.badge.ellipsis")
                        }
                        .disabled(isWorking)

                        if isWorking {
                            HStack(spacing: 10) {
                                ProgressView()
                                Text("Preparing complete query result…")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    } header: {
                        Text("Result Actions")
                    } footer: {
                        Text("These actions use the complete read-only query result, not only the on-screen preview.")
                    }
                }

                ForEach(report.resultSets) { result in
                    Section("Statement \(result.statementIndex)") {
                        if !result.statementSQL.isEmpty {
                            DisclosureGroup("SQL that ran") {
                                Text(result.statementSQL)
                                    .font(.caption.monospaced())
                                    .textSelection(.enabled)
                                    .padding(.vertical, 4)
                            }
                        }

                        if result.columns.isEmpty {
                            Label(
                                result.affectedRows == 1
                                    ? "1 row affected"
                                    : "\(result.affectedRows) rows affected",
                                systemImage: "checkmark.circle"
                            )
                            .foregroundStyle(.secondary)

                            if !result.isReadOnly {
                                Label {
                                    Text("This change applies to bIDE's local derived SQLite database. Imported CSV/XLSX/JSON source files are unchanged. Rebuilding or migrating the derived database can replace SQL-only edits from those source files.")
                                        .font(.caption)
                                } icon: {
                                    Image(systemName: "externaldrive.badge.exclamationmark")
                                }
                                .foregroundStyle(.secondary)
                            }
                        } else if result.rows.isEmpty {
                            ContentUnavailableView(
                                "No Rows Returned",
                                systemImage: "tablecells",
                                description: Text("The SQL statement returned columns, but no data rows matched.")
                            )
                            .frame(maxWidth: .infinity, minHeight: 120)
                        } else {
                            HStack {
                                Text("\(result.rows.count) rows shown")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                                if result.isTruncated {
                                    Label("First 500", systemImage: "scissors")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                }
                            }
                            SQLResultTableView(result: result)
                                .listRowInsets(EdgeInsets())
                        }
                    }
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .disabled(isWorking)
                }
            }
        }
        .interactiveDismissDisabled(isWorking)
        .sheet(isPresented: Binding(
            get: { !shareURLs.isEmpty },
            set: { if !$0 { shareURLs = [] } }
        )) {
            ActivityShareSheet(urls: shareURLs)
        }
        .alert("Saved to Datasets", isPresented: Binding(
            get: { savedDatasetMessage != nil },
            set: { if !$0 { savedDatasetMessage = nil } }
        )) {
            Button("View Datasets") {
                savedDatasetMessage = nil
                session.selectedSection = .datasets
                dismiss()
            }
            Button("Stay Here", role: .cancel) {
                savedDatasetMessage = nil
            }
        } message: {
            Text(savedDatasetMessage ?? "The SQL result is now a project dataset.")
        }
        .alert("Export Error", isPresented: Binding(
            get: { dataWorkspace.dataError != nil },
            set: { if !$0 { dataWorkspace.dataError = nil } }
        )) {
            Button("OK", role: .cancel) { dataWorkspace.dataError = nil }
        } message: {
            Text(dataWorkspace.dataError ?? "Could not export the SQL result.")
        }
    }

    private func exportForSharing() {
        guard let projectID = workspace.activeProjectID, !isWorking else { return }
        isWorking = true
        Task {
            defer { isWorking = false }
            if let url = await dataWorkspace.exportSQLResult(
                report,
                projectID: projectID,
                registerAsDataset: false
            ) {
                shareURLs = [url]
            }
        }
    }

    private func saveAsDataset() {
        guard let projectID = workspace.activeProjectID, !isWorking else { return }
        isWorking = true
        Task {
            defer { isWorking = false }
            if let url = await dataWorkspace.exportSQLResult(
                report,
                projectID: projectID,
                registerAsDataset: true
            ) {
                savedDatasetMessage = "\(url.lastPathComponent) is ready in this project's Datasets tab."
            }
        }
    }
}

struct SQLResultTableView: View {
    let result: SQLResultSet

    private var preferredHeight: CGFloat {
        let rowsIncludingHeader = min(result.rows.count + 1, 12)
        return max(72, CGFloat(rowsIncludingHeader) * 36)
    }

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            LazyVStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 0) {
                    ForEach(Array(result.columns.enumerated()), id: \.offset) { _, column in
                        Text(column)
                            .font(.caption.monospaced().weight(.bold))
                            .lineLimit(1)
                            .frame(width: 150, alignment: .leading)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 7)
                            .background(.thinMaterial)
                    }
                }

                ForEach(Array(result.rows.enumerated()), id: \.offset) { rowIndex, row in
                    HStack(spacing: 0) {
                        ForEach(Array(result.columns.indices), id: \.self) { columnIndex in
                            let value = columnIndex < row.count ? row[columnIndex] : nil
                            Text(value ?? "NULL")
                                .font(.caption.monospaced())
                                .foregroundStyle(value == nil ? Color.secondary : Color.primary)
                                .lineLimit(2)
                                .frame(width: 150, alignment: .leading)
                                .frame(minHeight: 32, alignment: .leading)
                                .padding(.horizontal, 8)
                                .background(rowIndex.isMultiple(of: 2) ? Color.clear : Color.secondary.opacity(0.05))
                        }
                    }
                    Divider()
                }
            }
        }
        .defaultScrollAnchor(.top)
        .frame(height: preferredHeight)
    }
}
