import SwiftUI

@MainActor
final class AppSession: ObservableObject {
    @Published var selectedSection: AppSection = .workspace
    @Published var entitlement: EntitlementTier = .free
    @Published var isSignedIn = false
}

enum AppSection: String, CaseIterable, Identifiable, Hashable {
    case workspace = "Workspace"
    case projects = "Projects"
    case datasets = "Datasets"
    case account = "Account"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .workspace: return "chevron.left.forwardslash.chevron.right"
        case .projects: return "folder"
        case .datasets: return "tablecells"
        case .account: return "person.crop.circle"
        }
    }
}

enum EntitlementTier: String {
    case free
    case bidePro
    case pocketBIPro
    case business

    var hasProAccess: Bool {
        self != .free
    }
}
