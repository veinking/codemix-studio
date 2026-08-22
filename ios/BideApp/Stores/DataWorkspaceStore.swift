import Foundation
import SwiftUI

@MainActor
final class DataWorkspaceStore: ObservableObject {
    @Published private(set) var datasets: [DatasetAsset] = []
    @Published private(set) var activeProjectID: UUID?
    @Published private(set) var isImporting = false
    @Published private(set) var importStatus: String?
    @Published private(set) var isRunningSQL = false
    @Published var lastSQLRun: SQLRunReport?
    @Published var sqlError: String?
    @Published var dataError: String?

    private let fileManager: FileManager
    private let projectsRoot: URL

    init() {
        let manager = FileManager.default
        let documents = manager.urls(for: .documentDirectory, in: .userDomainMask).first!
        fileManager = manager
        projectsRoot = documents.appendingPathComponent("bIDE Projects", isDirectory: true)
    }

    var tables: [DatasetTableDescriptor] {
        datasets.flatMap(\.tables)
    }

    func openProject(_ projectID: UUID?) {
        activeProjectID = projectID
        lastSQLRun = nil
        sqlError = nil
        dataError = nil
        guard let projectID else {
            datasets = []
            return
        }
        datasets = loadRegistry(projectID: projectID)
    }

    func reconcileProjectFiles(projectID: UUID) async {
        if activeProjectID != projectID {
            openProject(projectID)
        }

        let projectURL = projectDirectory(projectID)
        guard let enumerator = fileManager.enumerator(
            at: projectURL,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles, .skipsPackageDescendants]
        ) else { return }

        let knownPaths = Set(datasets.map(\.relativePath))
        let prefix = projectURL.path.hasSuffix("/") ? projectURL.path : projectURL.path + "/"
        var unregistered: [(URL, DatasetFormat)] = []

        for case let url as URL in enumerator {
            guard (try? url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile) == true else { continue }
            let relativePath = url.path.replacingOccurrences(of: prefix, with: "")
            guard !relativePath.isEmpty,
                  !knownPaths.contains(relativePath),
                  !relativePath.hasPrefix("exports/") else { continue }
            guard let format = DatasetFormat.infer(from: url) else { continue }
            unregistered.append((url, format))
        }

        guard !unregistered.isEmpty else { return }
        isImporting = true
        dataError = nil
        defer {
            isImporting = false
            importStatus = nil
        }

        for (url, format) in unregistered {
            importStatus = "Registering \(url.lastPathComponent)…"
            do {
                try await registerDataset(at: url, format: format, projectID: projectID)
            } catch {
                dataError = "Could not register \(url.lastPathComponent): \(error.localizedDescription)"
            }
        }
    }

    func importDatasets(_ sourceURLs: [URL], projectID: UUID) async {
        guard !sourceURLs.isEmpty else { return }
        if activeProjectID != projectID {
            openProject(projectID)
        }

        isImporting = true
        importStatus = "Preparing import…"
        dataError = nil
        defer {
            isImporting = false
            importStatus = nil
        }

        for sourceURL in sourceURLs {
            guard let format = DatasetFormat.infer(from: sourceURL) else {
                dataError = "\(sourceURL.lastPathComponent) is not a supported dataset format."
                continue
            }

            importStatus = "Importing \(sourceURL.lastPathComponent)…"
            let grantedAccess = sourceURL.startAccessingSecurityScopedResource()
            let destinationURL: URL

            do {
                let dataDirectory = try ensureDataDirectory(projectID: projectID)
                destinationURL = uniqueDestination(for: sourceURL.lastPathComponent, in: dataDirectory)
                try fileManager.copyItem(at: sourceURL, to: destinationURL)
            } catch {
                if grantedAccess { sourceURL.stopAccessingSecurityScopedResource() }
                dataError = "Could not copy \(sourceURL.lastPathComponent): \(error.localizedDescription)"
                continue
            }

            if grantedAccess { sourceURL.stopAccessingSecurityScopedResource() }

            do {
                try await registerDataset(at: destinationURL, format: format, projectID: projectID)
            } catch {
                try? fileManager.removeItem(at: destinationURL)
                dataError = "Could not import \(sourceURL.lastPathComponent): \(error.localizedDescription)"
            }
        }
    }

    func deleteDataset(_ asset: DatasetAsset, projectID: UUID) async {
        dataError = nil
        let dbURL = databaseURL(projectID: projectID)
        do {
            let names = asset.tables.map(\.sqliteName)
            try await Task.detached(priority: .utility) {
                try SQLiteProjectEngine.dropTables(databaseURL: dbURL, names: names)
            }.value
            let url = projectDirectory(projectID).appendingPathComponent(asset.relativePath)
            if fileManager.fileExists(atPath: url.path) {
                try fileManager.removeItem(at: url)
            }
            datasets.removeAll { $0.id == asset.id }
            try saveRegistry(projectID: projectID)
        } catch {
            dataError = "Could not delete \(asset.fileName): \(error.localizedDescription)"
        }
    }

    func rebuildDatabase(projectID: UUID) async {
        guard !datasets.isEmpty else { return }
        isImporting = true
        importStatus = "Rebuilding project SQL database…"
        dataError = nil
        defer {
            isImporting = false
            importStatus = nil
        }

        let dbURL = databaseURL(projectID: projectID)
        try? fileManager.removeItem(at: dbURL)

        do {
            for asset in datasets {
                let sourceURL = projectDirectory(projectID).appendingPathComponent(asset.relativePath)
                let parsedTables = try await Task.detached(priority: .userInitiated) {
                    try DatasetParser.parse(url: sourceURL, format: asset.format)
                }.value
                guard parsedTables.count == asset.tables.count else {
                    throw DatasetParserError.unreadable(asset.fileName)
                }

                for (parsed, descriptor) in zip(parsedTables, asset.tables) {
                    importStatus = "Reloading \(descriptor.displayName)…"
                    try await Task.detached(priority: .userInitiated) {
                        try SQLiteProjectEngine.importTable(
                            databaseURL: dbURL,
                            sqliteName: descriptor.sqliteName,
                            table: parsed
                        )
                    }.value
                }
            }
        } catch {
            dataError = "Could not rebuild the SQL database: \(error.localizedDescription)"
        }
    }

    func executeSQL(_ sql: String, projectID: UUID) async {
        isRunningSQL = true
        sqlError = nil
        lastSQLRun = nil
        defer { isRunningSQL = false }

        let dbURL = databaseURL(projectID: projectID)
        do {
            let report = try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.execute(databaseURL: dbURL, sql: sql, rowLimit: 500)
            }.value
            lastSQLRun = report
        } catch {
            sqlError = error.localizedDescription
        }
    }

    func preview(_ table: DatasetTableDescriptor, projectID: UUID) async -> SQLRunReport? {
        let dbURL = databaseURL(projectID: projectID)
        do {
            let sql = "SELECT * FROM \(SQLiteProjectEngine.quoteIdentifier(table.sqliteName)) LIMIT 50;"
            return try await Task.detached(priority: .userInitiated) {
                try SQLiteProjectEngine.execute(databaseURL: dbURL, sql: sql, rowLimit: 50)
            }.value
        } catch {
            dataError = "Could not preview \(table.displayName): \(error.localizedDescription)"
            return nil
        }
    }

    func fileURL(for asset: DatasetAsset, projectID: UUID) -> URL {
        projectDirectory(projectID).appendingPathComponent(asset.relativePath)
    }

    private func registerDataset(
        at sourceURL: URL,
        format: DatasetFormat,
        projectID: UUID
    ) async throws {
        let dbURL = databaseURL(projectID: projectID)
        let parsedTables = try await Task.detached(priority: .userInitiated) {
            try DatasetParser.parse(url: sourceURL, format: format)
        }.value

        var usedNames = Set(tables.map { $0.sqliteName.lowercased() })
        var descriptors: [DatasetTableDescriptor] = []
        var importedTableNames: [String] = []
        let fileBase = sourceURL.deletingPathExtension().lastPathComponent

        do {
            for (index, parsedTable) in parsedTables.enumerated() {
                let requestedBase: String
                if parsedTables.count == 1 {
                    requestedBase = fileBase
                } else {
                    requestedBase = "\(fileBase)_\(parsedTable.sourceSheetName ?? "sheet_\(index + 1)")"
                }
                let sqliteName = uniqueSQLiteName(base: requestedBase, usedNames: &usedNames)
                importStatus = "Loading \(parsedTable.displayName) into SQL…"

                try await Task.detached(priority: .userInitiated) {
                    try SQLiteProjectEngine.importTable(
                        databaseURL: dbURL,
                        sqliteName: sqliteName,
                        table: parsedTable
                    )
                }.value
                importedTableNames.append(sqliteName)
                descriptors.append(
                    DatasetTableDescriptor(
                        displayName: parsedTable.displayName,
                        sqliteName: sqliteName,
                        sourceSheetName: parsedTable.sourceSheetName,
                        rowCount: parsedTable.rows.count,
                        columns: parsedTable.columns
                    )
                )
            }

            let projectURL = projectDirectory(projectID)
            let prefix = projectURL.path.hasSuffix("/") ? projectURL.path : projectURL.path + "/"
            let relativePath = sourceURL.path.replacingOccurrences(of: prefix, with: "")
            let fileSize = (try? sourceURL.resourceValues(forKeys: [.fileSizeKey]).fileSize).map(Int64.init) ?? 0
            datasets.append(
                DatasetAsset(
                    fileName: sourceURL.lastPathComponent,
                    relativePath: relativePath,
                    format: format,
                    sizeBytes: fileSize,
                    tables: descriptors
                )
            )
            datasets.sort { $0.importedAt > $1.importedAt }
            try saveRegistry(projectID: projectID)
        } catch {
            if !importedTableNames.isEmpty {
                let names = importedTableNames
                try? await Task.detached(priority: .utility) {
                    try SQLiteProjectEngine.dropTables(databaseURL: dbURL, names: names)
                }.value
            }
            throw error
        }
    }

    private func projectDirectory(_ projectID: UUID) -> URL {
        projectsRoot.appendingPathComponent(projectID.uuidString, isDirectory: true)
    }

    private func dataDirectory(_ projectID: UUID) -> URL {
        projectDirectory(projectID).appendingPathComponent("data", isDirectory: true)
    }

    private func registryURL(projectID: UUID) -> URL {
        projectDirectory(projectID).appendingPathComponent("datasets.bide.json")
    }

    private func databaseURL(projectID: UUID) -> URL {
        dataDirectory(projectID).appendingPathComponent(".bide.sqlite")
    }

    private func ensureDataDirectory(projectID: UUID) throws -> URL {
        let url = dataDirectory(projectID)
        try fileManager.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private func loadRegistry(projectID: UUID) -> [DatasetAsset] {
        let url = registryURL(projectID: projectID)
        guard let data = try? Data(contentsOf: url) else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return (try? decoder.decode([DatasetAsset].self, from: data)) ?? []
    }

    private func saveRegistry(projectID: UUID) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(datasets)
        try data.write(to: registryURL(projectID: projectID), options: .atomic)
    }

    private func uniqueDestination(for fileName: String, in directory: URL) -> URL {
        let source = URL(fileURLWithPath: fileName)
        let ext = source.pathExtension
        let base = source.deletingPathExtension().lastPathComponent
        var candidate = directory.appendingPathComponent(fileName)
        var index = 2
        while fileManager.fileExists(atPath: candidate.path) {
            let nextName = ext.isEmpty ? "\(base) \(index)" : "\(base) \(index).\(ext)"
            candidate = directory.appendingPathComponent(nextName)
            index += 1
        }
        return candidate
    }

    private func uniqueSQLiteName(base: String, usedNames: inout Set<String>) -> String {
        var normalized = base.lowercased().replacingOccurrences(
            of: "[^a-z0-9_]+",
            with: "_",
            options: .regularExpression
        )
        normalized = normalized.trimmingCharacters(in: CharacterSet(charactersIn: "_"))
        if normalized.isEmpty { normalized = "dataset" }
        if normalized.first?.isNumber == true { normalized = "data_\(normalized)" }
        if normalized.hasPrefix("sqlite_") { normalized = "data_\(normalized)" }

        var candidate = normalized
        var index = 2
        while usedNames.contains(candidate.lowercased()) {
            candidate = "\(normalized)_\(index)"
            index += 1
        }
        usedNames.insert(candidate.lowercased())
        return candidate
    }
}
