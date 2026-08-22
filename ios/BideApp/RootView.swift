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
            List(AppSection.allCases, selection: $session.selectedSection) { section in
                Label(section.rawValue, systemImage: section.systemImage)
                    .tag(section)
            }
            .navigationTitle("bIDE")
        } detail: {
            destination(for: session.selectedSection)
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

private struct WorkspaceView: View {
    @State private var language = "Python"
    @State private var code = "# Start coding in bIDE\nprint(\"Hello from bIDE\")"

    private let languages = ["Python", "SQL", "R"]

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Picker("Language", selection: $language) {
                    ForEach(languages, id: \.self) { language in
                        Text(language).tag(language)
                    }
                }
                .pickerStyle(.menu)

                Spacer()

                Button {
                    // Runtime wiring comes after the native shell is validated.
                } label: {
                    Label("Run", systemImage: "play.fill")
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()

            Divider()

            TextEditor(text: $code)
                .font(.system(.body, design: .monospaced))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(8)
        }
        .navigationTitle("Workspace")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ProjectsView: View {
    var body: some View {
        ContentUnavailableView(
            "Projects",
            systemImage: "folder",
            description: Text("Create or open a local project. Cloud sync can be added after sign-in.")
        )
        .navigationTitle("Projects")
    }
}

private struct DatasetsView: View {
    var body: some View {
        ContentUnavailableView(
            "Datasets",
            systemImage: "tablecells",
            description: Text("Import CSV/XLSX data or receive a trusted handoff from PocketBI.")
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
                Button(session.isSignedIn ? "Signed in" : "Sign in to sync") {
                    // Shared PocketBI ID wiring is intentionally deferred.
                }
                .disabled(session.isSignedIn)
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
