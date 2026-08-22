import SwiftUI
import UniformTypeIdentifiers

struct ProjectsView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var session: AppSession

    @State private var createPresented = false
    @State private var importPresented = false
    @State private var newProjectName = "New Project"
    @State private var renameTarget: BideProjectManifest?
    @State private var renameValue = ""
    @State private var deleteTarget: BideProjectManifest?

    var body: some View {
        List {
            Section {
                ForEach(workspace.projects) { project in
                    HStack(spacing: 10) {
                        Button {
                            workspace.openProject(project.id)
                            session.selectedSection = .workspace
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: project.id == workspace.activeProjectID ? "folder.fill" : "folder")
                                    .font(.title3)
                                    .foregroundStyle(project.id == workspace.activeProjectID ? .primary : .secondary)

                                VStack(alignment: .leading, spacing: 3) {
                                    Text(project.name)
                                        .font(.body.weight(.semibold))
                                        .foregroundStyle(.primary)
                                    Text("Updated \(project.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()

                                if project.id == workspace.activeProjectID {
                                    Text("OPEN")
                                        .font(.caption2.weight(.bold))
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)

                        Menu {
                            Button("Open", systemImage: "folder") {
                                workspace.openProject(project.id)
                                session.selectedSection = .workspace
                            }
                            Button("Rename", systemImage: "pencil") {
                                renameValue = project.name
                                renameTarget = project
                            }
                            Divider()
                            Button("Delete Project", systemImage: "trash", role: .destructive) {
                                deleteTarget = project
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                                .font(.title3)
                                .foregroundStyle(.secondary)
                        }
                        .accessibilityLabel("Project actions for \(project.name)")
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            deleteTarget = project
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }

                        Button {
                            renameValue = project.name
                            renameTarget = project
                        } label: {
                            Label("Rename", systemImage: "pencil")
                        }
                        .tint(.secondary)
                    }
                }
            } header: {
                Text("Local Projects")
            } footer: {
                Text("Projects are stored locally on this device. Use + to create one or the import button to bring in a project folder from Files.")
            }
        }
        .navigationTitle("Projects")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    importPresented = true
                } label: {
                    Image(systemName: "folder.badge.plus")
                }
                .accessibilityLabel("Import project folder")

                Button {
                    newProjectName = "New Project"
                    createPresented = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("New project")
            }
        }
        .fileImporter(
            isPresented: $importPresented,
            allowedContentTypes: [.folder],
            allowsMultipleSelection: false
        ) { result in
            guard case .success(let urls) = result, let sourceURL = urls.first else { return }
            if let importedID = workspace.importProject(from: sourceURL) {
                workspace.openProject(importedID)
                session.selectedSection = .workspace
            }
        }
        .sheet(isPresented: $createPresented) {
            NavigationStack {
                Form {
                    TextField("Project name", text: $newProjectName)
                }
                .navigationTitle("New Project")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { createPresented = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Create") {
                            workspace.createProject(named: newProjectName)
                            createPresented = false
                            session.selectedSection = .workspace
                        }
                        .disabled(newProjectName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
            }
            .presentationDetents([.medium])
        }
        .alert("Rename Project", isPresented: Binding(
            get: { renameTarget != nil },
            set: { if !$0 { renameTarget = nil } }
        )) {
            TextField("Project name", text: $renameValue)
            Button("Cancel", role: .cancel) { renameTarget = nil }
            Button("Rename") {
                if let renameTarget {
                    workspace.renameProject(renameTarget, to: renameValue)
                }
                renameTarget = nil
            }
        }
        .confirmationDialog(
            "Delete this project?",
            isPresented: Binding(
                get: { deleteTarget != nil },
                set: { if !$0 { deleteTarget = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Project", role: .destructive) {
                if let deleteTarget {
                    workspace.deleteProject(deleteTarget)
                }
                deleteTarget = nil
            }
            Button("Cancel", role: .cancel) { deleteTarget = nil }
        } message: {
            Text("The project's local files will be removed from this device.")
        }
    }
}
