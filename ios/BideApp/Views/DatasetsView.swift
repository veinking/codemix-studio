import SwiftUI

struct DatasetsView: View {
    @EnvironmentObject private var session: AppSession
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    @State private var importerPresented = false
    @State private var joinBuilderPresented = false
    @State private var joinResultReport: SQLRunReport?
    @State private var lastCompletedJoinReport: SQLRunReport?
    @State private var openWorkspaceAfterJoinDismiss = false
    @State private var shareURLs: [URL] = []
    @State private var deleteTarget: DatasetAsset?
    @State private var rebuildConfirmationPresented = false

    private var isBusy: Bool {
        dataWorkspace.isImporting || dataWorkspace.isRunningSQL
    }

    var body: some View {
        List {
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(workspace.activeProjectName)
                            .font(.headline)
                        Text(datasetSummary)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "tablecells")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }
            }

            Section {
                Button {
                    importerPresented = true
                } label: {
                    Label("Import Dataset", systemImage: "square.and.arrow.down")
                }
                .disabled(workspace.activeProjectID == nil || isBusy)

                if !dataWorkspace.datasets.isEmpty {
                    Button {
                        dataWorkspace.lastSQLRun = nil
                        joinResultReport = nil
                        openWorkspaceAfterJoinDismiss = false
                        joinBuilderPresented = true
                    } label: {
                        Label("Join Two Tables", systemImage: "arrow.triangle.merge")
                    }
                    .disabled(dataWorkspace.tables.count < 2 || isBusy)

                    Button {
                        rebuildConfirmationPresented = true
                    } label: {
                        Label("Rebuild SQL Database", systemImage: "arrow.clockwise")
                    }
                    .disabled(isBusy)

                    Button {
                        guard let projectID = workspace.activeProjectID else { return }
                        shareURLs = dataWorkspace.datasets.map {
                            dataWorkspace.fileURL(for: $0, projectID: projectID)
                        }
                    } label: {
                        Label("Share Original Dataset Files", systemImage: "square.and.arrow.up")
                    }
                    .disabled(isBusy)
                }
            } header: {
                Text("Quick Actions")
            } footer: {
                if !dataWorkspace.datasets.isEmpty, dataWorkspace.tables.count < 2 {
                    Text("Import at least two SQL tables to enable the guided join builder. Original-file sharing does not export SQL or join results.")
                } else {
                    Text("Use Join Two Tables for combined results. Share Original Dataset Files only shares the imported source files; join/query CSV export lives inside SQL Results.")
                }
            }

            if let report = lastCompletedJoinReport {
                Section("Last Join Result") {
                    if let result = report.primaryResult {
                        LabeledContent("Rows", value: result.rowCount.formatted())
                        LabeledContent("Columns", value: result.columns.count.formatted())
                        if result.isTruncated {
                            Label("Screen preview shows the first 500 rows. Reopening this result keeps full-result save/share actions available.", systemImage: "info.circle")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button {
                        openJoinReport(report)
                    } label: {
                        Label("Open Join Results", systemImage: "tablecells")
                    }
                    .buttonStyle(.borderedProminent)

                    Text("To export the join itself, open Join Results and choose Share Result as CSV. The original-file share action above is intentionally separate.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if dataWorkspace.isImporting {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text(dataWorkspace.importStatus ?? "Importing data…")
                            .font(.subheadline)
                    }
                }
            }

            if dataWorkspace.datasets.isEmpty {
                Section {
                    ContentUnavailableView(
                        "No Datasets Yet",
                        systemImage: "tablecells.badge.ellipsis",
                        description: Text("Import CSV, TSV, JSON, text, or XLSX files into this project.")
                    )
                    .frame(maxWidth: .infinity, minHeight: 220)
                }
            } else {
                Section("Project Datasets") {
                    ForEach(dataWorkspace.datasets) { asset in
                        NavigationLink {
                            DatasetAssetDetailView(asset: asset)
                        } label: {
                            DatasetAssetRow(asset: asset)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                deleteTarget = asset
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }

                            Button {
                                share(asset)
                            } label: {
                                Label("Share", systemImage: "square.and.arrow.up")
                            }
                        }
                    }
                }
            }

            Section {
                Text("Imported data stays inside this local bIDE project. The source file remains authoritative; SQLite is a derived local query layer that can be rebuilt from those files.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Datasets")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    importerPresented = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Import Dataset")
                .disabled(workspace.activeProjectID == nil || isBusy)
            }
        }
        .fileImporter(
            isPresented: $importerPresented,
            allowedContentTypes: DatasetFormat.importableTypes,
            allowsMultipleSelection: true
        ) { result in
            guard case .success(let urls) = result,
                  let projectID = workspace.activeProjectID else { return }
            Task {
                await dataWorkspace.importDatasets(urls, projectID: projectID)
            }
        }
        .sheet(isPresented: $joinBuilderPresented, onDismiss: handleJoinBuilderDismissal) {
            SQLJoinBuilderView(
                tables: dataWorkspace.tables,
                onEditableQueryCreated: {
                    openWorkspaceAfterJoinDismiss = true
                },
                onJoinCompleted: { report in
                    lastCompletedJoinReport = report
                }
            )
        }
        .sheet(item: $joinResultReport) { report in
            SQLResultsView(report: report, title: "Join Results")
                .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: Binding(
            get: { !shareURLs.isEmpty },
            set: { if !$0 { shareURLs = [] } }
        )) {
            ActivityShareSheet(urls: shareURLs)
        }
        .confirmationDialog(
            "Rebuild SQL Database?",
            isPresented: $rebuildConfirmationPresented,
            titleVisibility: .visible
        ) {
            Button("Rebuild Database", role: .destructive) {
                guard let projectID = workspace.activeProjectID else { return }
                Task { await dataWorkspace.rebuildDatabase(projectID: projectID) }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("bIDE will replace the local derived SQLite database from the registered source datasets. SQL-only CREATE/INSERT/UPDATE/DELETE changes that are not present in those source files can be lost. Your original dataset files are not modified.")
        }
        .confirmationDialog(
            "Delete this dataset?",
            isPresented: Binding(
                get: { deleteTarget != nil },
                set: { if !$0 { deleteTarget = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Dataset", role: .destructive) {
                guard let asset = deleteTarget,
                      let projectID = workspace.activeProjectID else {
                    deleteTarget = nil
                    return
                }
                deleteTarget = nil
                Task { await dataWorkspace.deleteDataset(asset, projectID: projectID) }
            }
            Button("Cancel", role: .cancel) { deleteTarget = nil }
        } message: {
            Text("The local dataset file and its generated SQL table(s) will be removed from this project. This cannot be undone from bIDE.")
        }
        .alert("Dataset Error", isPresented: Binding(
            get: { dataWorkspace.dataError != nil },
            set: { if !$0 { dataWorkspace.dataError = nil } }
        )) {
            Button("OK", role: .cancel) { dataWorkspace.dataError = nil }
        } message: {
            Text(dataWorkspace.dataError ?? "Unknown dataset error.")
        }
        .onChange(of: workspace.activeProjectID) { _, _ in
            joinResultReport = nil
            lastCompletedJoinReport = nil
            openWorkspaceAfterJoinDismiss = false
            rebuildConfirmationPresented = false
        }
    }

    private var datasetSummary: String {
        let count = dataWorkspace.datasets.count
        let tableCount = dataWorkspace.tables.count
        return "\(count) dataset\(count == 1 ? "" : "s") · \(tableCount) SQL table\(tableCount == 1 ? "" : "s")"
    }

    private func handleJoinBuilderDismissal() {
        guard openWorkspaceAfterJoinDismiss else { return }
        openWorkspaceAfterJoinDismiss = false
        dataWorkspace.lastSQLRun = nil
        Task { @MainActor in
            await Task.yield()
            session.selectedSection = .workspace
        }
    }

    private func openJoinReport(_ report: SQLRunReport) {
        // Force a nil -> report transition every time so a previous interrupted
        // presentation cannot leave the button inert with a stale non-nil item.
        joinResultReport = nil
        Task { @MainActor in
            await Task.yield()
            joinResultReport = report
        }
    }

    private func share(_ asset: DatasetAsset) {
        guard let projectID = workspace.activeProjectID else { return }
        shareURLs = [dataWorkspace.fileURL(for: asset, projectID: projectID)]
    }
}

private struct DatasetAssetRow: View {
    let asset: DatasetAsset

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: asset.format.systemImage)
                .font(.title3)
                .frame(width: 26)
                .foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 4) {
                Text(asset.fileName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                Text("\(asset.format.displayName) · \(asset.totalRows.formatted()) rows · \(asset.tables.count) table\(asset.tables.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text(ByteCountFormatter.string(fromByteCount: asset.sizeBytes, countStyle: .file))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

private struct DatasetAssetDetailView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    let asset: DatasetAsset
    @State private var sharePresented = false

    var body: some View {
        List {
            Section("File") {
                LabeledContent("Name", value: asset.fileName)
                LabeledContent("Format", value: asset.format.displayName)
                LabeledContent("Size", value: ByteCountFormatter.string(fromByteCount: asset.sizeBytes, countStyle: .file))
                LabeledContent("Rows", value: asset.totalRows.formatted())
                LabeledContent("Tables", value: "\(asset.tables.count)")
            }

            Section("SQL Tables") {
                ForEach(asset.tables) { table in
                    NavigationLink {
                        DatasetTableDetailView(table: table)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(table.displayName)
                                .font(.subheadline.weight(.semibold))
                            Text("\(table.sqliteName) · \(table.rowCount.formatted()) rows · \(table.columns.count) columns")
                                .font(.caption.monospaced())
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Section {
                Button {
                    sharePresented = true
                } label: {
                    Label("Export This Dataset", systemImage: "square.and.arrow.up")
                }
            }
        }
        .navigationTitle(asset.fileName)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $sharePresented) {
            if let projectID = workspace.activeProjectID {
                ActivityShareSheet(urls: [dataWorkspace.fileURL(for: asset, projectID: projectID)])
            }
        }
    }
}

private struct DatasetTableDetailView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore
    @EnvironmentObject private var session: AppSession

    let table: DatasetTableDescriptor
    @State private var preview: SQLRunReport?
    @State private var loadingPreview = false

    var body: some View {
        List {
            Section("SQL") {
                LabeledContent("Table", value: table.sqliteName)
                LabeledContent("Rows", value: table.rowCount.formatted())
                Button("Query in SQL", systemImage: "terminal") {
                    openQuery()
                }
                .buttonStyle(.borderedProminent)
            }

            Section("Columns") {
                ForEach(table.columns) { column in
                    HStack {
                        Text(column.name)
                            .font(.subheadline.monospaced())
                        Spacer()
                        Text(column.type.rawValue)
                            .font(.caption.monospaced().weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section("Preview") {
                if loadingPreview {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                } else if let result = preview?.primaryResult {
                    HStack {
                        Text(result.rows.isEmpty ? "No rows returned" : "First \(result.rows.count) rows")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                    }
                    SQLResultTableView(result: result)
                        .listRowInsets(EdgeInsets())
                } else {
                    Button("Load Preview", systemImage: "eye") {
                        loadPreview()
                    }
                }
            }
        }
        .navigationTitle(table.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if preview == nil { loadPreview() }
        }
    }

    private func loadPreview() {
        guard let projectID = workspace.activeProjectID, !loadingPreview else { return }
        loadingPreview = true
        Task {
            preview = await dataWorkspace.preview(table, projectID: projectID)
            loadingPreview = false
        }
    }

    private func openQuery() {
        let quoted = SQLiteProjectEngine.quoteIdentifier(table.sqliteName)
        workspace.createFile(named: "query_\(table.sqliteName)", language: .sql)
        workspace.updateDocumentText("SELECT *\nFROM \(quoted)\nLIMIT 100;\n")
        workspace.saveActiveDocumentNow()
        session.selectedSection = .workspace
    }
}
