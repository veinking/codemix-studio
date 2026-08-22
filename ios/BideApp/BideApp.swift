import SwiftUI
import UIKit

@main
struct BideApp: App {
    @StateObject private var session = AppSession()
    @StateObject private var workspace = WorkspaceStore()
    @StateObject private var dataWorkspace = DataWorkspaceStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(workspace)
                .environmentObject(dataWorkspace)
                .onAppear {
                    synchronizeDataProject(workspace.activeProjectID)
                }
                .onChange(of: workspace.activeProjectID) { _, projectID in
                    synchronizeDataProject(projectID)
                }
                .onOpenURL { url in
                    guard url.isFileURL else { return }

                    if CodeLanguage.infer(from: url.lastPathComponent) != nil {
                        if workspace.importCodeFilesAsProject([url]) != nil {
                            synchronizeDataProject(workspace.activeProjectID)
                            session.selectedSection = .workspace
                        }
                        return
                    }

                    if DatasetFormat.infer(from: url) != nil,
                       let projectID = workspace.activeProjectID {
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
            await dataWorkspace.reconcileProjectFiles(projectID: projectID)
        }
    }
}
