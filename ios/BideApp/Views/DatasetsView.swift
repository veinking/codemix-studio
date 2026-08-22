import SwiftUI

struct DatasetsView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore

    @State private var importerPresented = false
    @State private var shareURLs: [URL] = []
    @State private var deleteTarget: DatasetAsset?

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
                    .frame(maxWidth: .infinity, minHeight: 240)
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
                Text("Imported data stays inside this local bIDE project. SQL tables are rebuilt from the project files, so the original imported dataset remains the source asset.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Datasets")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if !dataWorkspace.datasets.isEmpty, let projectID = workspace.activeProjectID {
                    Menu {
                        Button("Rebuild SQL Database", systemImage: "arrow.clockwise") {
                            Task { await dataWorkspace.rebuildDatabase(projectID: projectID) }
                        }
                        Button("Share All Dataset Files", systemImage: "square.and.arrow.up") {
                            shareURLs = dataWorkspace.datasets.map {
                                dataWorkspace.fileURL(for: $0, projectID: projectID)
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                    .disabled(dataWorkspace.isImporting)
                }

                Button {
                    importerPresented = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Import datasets")
                .disabled(workspace.activeProjectID == nil || dataWorkspace.isImporting)
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
        .sheet(isPresented: Binding(
            get: { !shareURLs.isEmpty },
            set: { if !$0 { shareURLs = [] } }
        )) {
            ActivityShareSheet(urls: shareURLs)
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
            Text("The local dataset file and its SQL table(s) will be removed from this project.")
        }
        .alert("Dataset Error", isPresented: Binding(
            get: { dataWorkspace.dataError != nil },
            set: { if !$0 { dataWorkspace.dataError = nil } }
        )) {
            Button("OK", role: .cancel) { dataWorkspace.dataError = nil }
        } message: {
            Text(dataWorkspace.dataError ?? "Unknown dataset error.")
        }
    }

    private var datasetSummary: String {
        let count = dataWorkspace.datasets.count
        let tableCount = dataWorkspace.tables.count
        return "\(count) dataset\(count == 1 ? "" : "s") · \(tableCount) SQL table\(tableCount == 1 ? "" : "s")"
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
        }
        .navigationTitle(asset.fileName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    sharePresented = true
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Share dataset")
            }
        }
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
                        Text("First \(result.rowCount) rows")
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
