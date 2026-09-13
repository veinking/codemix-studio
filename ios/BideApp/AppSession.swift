import SwiftUI

@MainActor
final class AppSession: ObservableObject {
    @Published var selectedSection: AppSection = .workspace
    @Published var entitlement: EntitlementTier = .free
    @Published var isSignedIn = false

    func applyAppStorePro(_ isActive: Bool) {
        if isActive {
            // A verified App Store purchase must unlock bIDE even when there is
            // no PocketBI account. Do not downgrade a linked higher-tier account.
            if entitlement == .free {
                entitlement = .bidePro
            }
        } else if entitlement == .bidePro {
            // Only remove the local App Store-derived tier. Linked PocketBI or
            // Business access remains authoritative when present.
            entitlement = .free
        }
    }
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
