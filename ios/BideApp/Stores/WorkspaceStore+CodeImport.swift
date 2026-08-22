import Foundation

@MainActor
extension WorkspaceStore {
    /// Imports one or more standalone Python / SQL / R source files as a new local bIDE project.
    /// The original files remain untouched; bIDE copies their contents into its own project storage.
    @discardableResult
    func importCodeFilesAsProject(_ sourceURLs: [URL]) -> UUID? {
        let supported = sourceURLs.filter { CodeLanguage.infer(from: $0.lastPathComponent) != nil }
        guard !supported.isEmpty else {
            saveState = .failed("No supported Python, SQL, or R files were selected.")
            return nil
        }

        let projectName: String
        if supported.count == 1 {
            let base = supported[0].deletingPathExtension().lastPathComponent
                .trimmingCharacters(in: .whitespacesAndNewlines)
            projectName = base.isEmpty ? "Imported Code" : base
        } else {
            projectName = "Imported Code"
        }

        createProject(named: projectName)
        guard let importedProjectID = activeProjectID else { return nil }

        // Remove the default starter files so an imported project contains the files the user chose,
        // rather than a second set of unrelated analysis.py/query.sql/model.R placeholders.
        for file in files {
            deleteFile(file)
        }

        var importedCount = 0
        for sourceURL in supported {
            guard let language = CodeLanguage.infer(from: sourceURL.lastPathComponent) else { continue }
            let grantedAccess = sourceURL.startAccessingSecurityScopedResource()
            defer {
                if grantedAccess {
                    sourceURL.stopAccessingSecurityScopedResource()
                }
            }

            do {
                let sourceText = try String(contentsOf: sourceURL, encoding: .utf8)
                createFile(
                    named: sourceURL.deletingPathExtension().lastPathComponent,
                    language: language
                )
                updateDocumentText(sourceText)
                saveActiveDocumentNow()
                importedCount += 1
            } catch {
                saveState = .failed("Could not import \(sourceURL.lastPathComponent): \(error.localizedDescription)")
            }
        }

        if importedCount == 0 {
            if let project = activeProject {
                deleteProject(project)
            }
            return nil
        }

        openProject(importedProjectID)
        return importedProjectID
    }
}
