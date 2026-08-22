import SwiftUI

struct SQLResultsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    let report: SQLRunReport
    var title: String = "SQL Results"

    @State private var shareURLs: [URL] = []
    @State private var savedDatasetMessage: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    LabeledContent("Statements", value: "\(report.statementCount)")
                    LabeledContent("Elapsed", value: String(format: "%.1f ms", report.elapsedMilliseconds))
                }

                ForEach(report.resultSets) { result in
                    Section("Statement \(result.statementIndex)") {
                        if result.columns.isEmpty {
                            Label(
                                result.affectedRows == 1
                                    ? "1 row affected"
                                    : "\(result.affectedRows) rows affected",
                                systemImage: "checkmark.circle"
                            )
                            .foregroundStyle(.secondary)
                        } else {
                            HStack {
                                Text("\(result.rowCount) rows shown")
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
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if report.primaryResult?.columns.isEmpty == false {
                        Menu {
                            Button("Share Result as CSV", systemImage: "square.and.arrow.up") {
                                exportForSharing()
                            }
                            Button("Save Result as Dataset", systemImage: "tablecells.badge.ellipsis") {
                                saveAsDataset()
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
        }
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
            Button("OK", role: .cancel) { savedDatasetMessage = nil }
        } message: {
            Text(savedDatasetMessage ?? "The SQL result is now a project dataset.")
        }
    }

    private func exportForSharing() {
        guard let projectID = workspace.activeProjectID else { return }
        Task {
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
        guard let projectID = workspace.activeProjectID else { return }
        Task {
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
        .frame(minHeight: 120, idealHeight: 360, maxHeight: 520)
    }
}
