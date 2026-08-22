import SwiftUI

struct ProjectsView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var session: AppSession

    @State private var createPresented = false
    @State private var newProjectName = "New Project"
    @State private var renameTarget: BideProjectManifest?
    @State private var renameValue = ""
    @State private var deleteTarget: BideProjectManifest?

    var body: some View {
        List {
            Section {
                ForEach(workspace.projects) { project in
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

                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.tertiary)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button("Rename", systemImage: "pencil") {
                            renameValue = project.name
                            renameTarget = project
                        }
                        Button("Delete", systemImage: "trash", role: .destructive) {
                            deleteTarget = project
                        }
                    }
                }
            } header: {
                Text("Local Projects")
            } footer: {
                Text("Projects are stored locally on this device during Phase 1. Cloud sync and PocketBI ID are intentionally not connected yet.")
            }
        }
        .navigationTitle("Projects")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    newProjectName = "New Project"
                    createPresented = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("New project")
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
