import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: AppSession
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
            DatasetsView()
        case .account:
            AccountView()
        }
    }
}

private struct DatasetsView: View {
    var body: some View {
        ContentUnavailableView(
            "Datasets",
            systemImage: "tablecells",
            description: Text("CSV/dataframe import and inspection starts after the editor/project core passes Phase 1.")
        )
        .navigationTitle("Datasets")
    }
}

private struct AccountView: View {
    @EnvironmentObject private var session: AppSession

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
