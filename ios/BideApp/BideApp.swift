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
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)) { _ in
                    workspace.saveActiveDocumentNow()
                }
        }
    }
}
