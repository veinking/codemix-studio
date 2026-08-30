import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: AppSession
    @EnvironmentObject private var workspace: WorkspaceStore
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                tabletLayout
            } else {
                phoneLayout
            }
        }
        .tint(.primary)
    }

    private var tabletLayout: some View {
        NavigationSplitView {
            List(AppSection.allCases) { section in
                Button {
                    session.selectedSection = section
                } label: {
                    HStack {
                        Label(section.rawValue, systemImage: section.systemImage)
                        Spacer()
                        if session.selectedSection == section {
                            Image(systemName: "checkmark")
                                .font(.caption.weight(.semibold))
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .navigationTitle("bIDE")
        } detail: {
            NavigationStack {
                destination(for: session.selectedSection)
            }
        }
    }

    private var phoneLayout: some View {
        TabView(selection: $session.selectedSection) {
            ForEach(AppSection.allCases) { section in
                NavigationStack {
                    destination(for: section)
                }
                .tabItem {
                    Label(section.rawValue, systemImage: section.systemImage)
                }
                .tag(section)
            }
        }
    }

    @ViewBuilder
    private func destination(for section: AppSection) -> some View {
        switch section {
        case .workspace:
            WorkspaceView()
        case .projects:
            ProjectsView()
        case .datasets:
            // Dataset detail/navigation state belongs to the active project. Rebuild
            // this root when the project changes so a detail from Project A cannot
            // remain actionable after switching to Project B.
            DatasetsView()
                .id(workspace.activeProjectID)
        case .account:
            AccountView()
        }
    }
}

private struct AccountView: View {
    @EnvironmentObject private var session: AppSession

    private enum ProductLinks {
        static let supportEmail = URL(string: "mailto:support@pocketbi.app?subject=bIDE%20iOS%20Support")!
        static let support = URL(string: "https://bideide.com/support")!
        static let privacy = URL(string: "https://bideide.com/privacy")!
        static let terms = URL(string: "https://bideide.com/terms")!
    }

    var body: some View {
        List {
            Section("Access") {
                LabeledContent("Status", value: session.entitlement.hasProAccess ? "Pro" : "Free")
                LabeledContent("Source", value: accessSource)
            }

            Section("Account") {
                Text("PocketBI ID and shared entitlements are intentionally deferred until the standalone editor/runtime path is stable.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Support & Legal") {
                Link(destination: ProductLinks.supportEmail) {
                    Label("Email Support", systemImage: "envelope")
                }
                Link(destination: ProductLinks.support) {
                    Label("bIDE Support", systemImage: "questionmark.circle")
                }
                Link(destination: ProductLinks.privacy) {
                    Label("Privacy Policy", systemImage: "hand.raised")
                }
                Link(destination: ProductLinks.terms) {
                    Label("Terms of Use", systemImage: "doc.text")
                }

                Text("Support: support@pocketbi.app")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
            }
        }
        .navigationTitle("Account")
    }

    private var accessSource: String {
        switch session.entitlement {
        case .free: return "None"
        case .bidePro: return "bIDE Pro"
        case .pocketBIPro: return "PocketBI Pro"
        case .business: return "Business"
        }
    }
}
