import SwiftUI
import UIKit

@main
struct BideApp: App {
    @StateObject private var session = AppSession()
    @StateObject private var workspace = WorkspaceStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(workspace)
                .onOpenURL { url in
                    guard url.isFileURL else { return }
                    if workspace.importCodeFilesAsProject([url]) != nil {
                        session.selectedSection = .workspace
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
                    workspace.saveActiveDocumentNow()
                }
        }
    }
}
