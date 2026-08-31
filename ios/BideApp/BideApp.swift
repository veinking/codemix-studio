import SwiftUI
import UIKit

@main
struct BideApp: App {
    @StateObject private var session = AppSession()
    @StateObject private var workspace = WorkspaceStore()
    @StateObject private var dataWorkspace = DataWorkspaceStore()
    @StateObject private var codeRuntime = CodeRuntimeStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(workspace)
                .environmentObject(dataWorkspace)
                .environmentObject(codeRuntime)
                .onAppear {
                    synchronizeDataProject(workspace.activeProjectID)
                }
                .onChange(of: workspace.activeProjectID) { _, projectID in
                    codeRuntime.resetSession()
                    synchronizeDataProject(projectID)
                }
                .onOpenURL { url in
                    guard url.isFileURL else { return }

                    if CodeLanguage.infer(from: url.lastPathComponent) != nil {
                        if workspace.importCodeFilesAsProject([url]) != nil {
                            session.selectedSection = .workspace
                        }
                        return
                    }

                    if DatasetFormat.infer(from: url) != nil,
                       let projectID = workspace.activeProjectID {
                        guard !dataWorkspace.isRunningSQL else {
                            dataWorkspace.dataError = "Finish the current SQL run before importing another dataset."
                            session.selectedSection = .datasets
                            return
                        }
                        Task {
                            await dataWorkspace.importDatasets([url], projectID: projectID)
                            session.selectedSection = .datasets
                        }
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
                    workspace.saveActiveDocumentNow()
                }
        }
    }

    @MainActor
    private func synchronizeDataProject(_ projectID: UUID?) {
        dataWorkspace.openProject(projectID)
        guard let projectID else { return }
        Task {
            // Registry identity is the source-of-truth boundary for every crash-recovery
            // decision. Never interpret staged delete/save files against an unreadable or
            // ambiguously missing registry.
            guard dataWorkspace.validateDatasetRegistryBeforeRecovery(projectID: projectID) else { return }
            guard dataWorkspace.recoverInterruptedDatasetDeletions(projectID: projectID) else { return }
            guard dataWorkspace.recoverInterruptedSavedResults(projectID: projectID) else { return }
            await dataWorkspace.reconcileProjectFiles(projectID: projectID)
            await dataWorkspace.migrateDerivedDatabaseIfNeeded(projectID: projectID)
        }
    }
}
