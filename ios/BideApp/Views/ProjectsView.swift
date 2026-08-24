import SwiftUI
import UniformTypeIdentifiers

struct ProjectsView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @EnvironmentObject private var dataWorkspace: DataWorkspaceStore
    @EnvironmentObject private var session: AppSession

    @State private var createPresented = false
    @State private var importFolderPresented = false
    @State private var importFilesPresented = false
    @State private var newProjectName = "New Project"
    @State private var renameTarget: BideProjectManifest?
    @State private var renameValue = ""
    @State private var deleteTarget: BideProjectManifest?
    @State private var projectOperationError: String?

    private var importableCodeTypes: [UTType] {
        var types: [UTType] = [.pythonScript]
        if let sql = UTType(filenameExtension: "sql") { types.append(sql) }
        if let r = UTType(filenameExtension: "r") { types.append(r) }
        return types
    }

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
                                requestProjectDeletion(project)
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
                            requestProjectDeletion(project)
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
                Text("Projects are stored locally on this device. Import a project folder or one or more Python, SQL, or R files directly from Files.")
            }
        }
        .navigationTitle("Projects")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Menu {
                    Button("Import Project Folder", systemImage: "folder.badge.plus") {
                        importFolderPresented = true
                    }
                    Button("Import Code Files", systemImage: "doc.badge.plus") {
                        importFilesPresented = true
                    }
                } label: {
                    Image(systemName: "square.and.arrow.down")
                }
                .accessibilityLabel("Import project or code files")

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
            isPresented: $importFolderPresented,
            allowedContentTypes: [.folder],
            allowsMultipleSelection: false
        ) { result in
            guard case .success(let urls) = result, let sourceURL = urls.first else { return }
            if let importedID = workspace.importProject(from: sourceURL) {
                workspace.openProject(importedID)
                session.selectedSection = .workspace
            }
        }
        .fileImporter(
            isPresented: $importFilesPresented,
            allowedContentTypes: importableCodeTypes,
            allowsMultipleSelection: true
        ) { result in
            guard case .success(let urls) = result else { return }
            if let importedID = workspace.importCodeFilesAsProject(urls) {
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
                guard let target = deleteTarget else { return }
                deleteTarget = nil

                // Recheck at commit time. A database task could have started after the
                // confirmation dialog was presented.
                guard !projectHasDatabaseWork(target.id) else {
                    projectOperationError = "\(target.name) is still running a SQL or dataset operation. Finish that work before deleting the project."
                    return
                }
                workspace.deleteProject(target)
            }
            Button("Cancel", role: .cancel) { deleteTarget = nil }
        } message: {
            Text("The project's local files will be removed from this device.")
        }
        .alert("Project Is Busy", isPresented: Binding(
            get: { projectOperationError != nil },
            set: { if !$0 { projectOperationError = nil } }
        )) {
            Button("OK", role: .cancel) { projectOperationError = nil }
        } message: {
            Text(projectOperationError ?? "Finish the project's current database work before deleting it.")
        }
    }

    private func projectHasDatabaseWork(_ projectID: UUID) -> Bool {
        dataWorkspace.hasActiveDataOperation(projectID: projectID) ||
            dataWorkspace.hasActiveSQLOperation(projectID: projectID)
    }

    private func requestProjectDeletion(_ project: BideProjectManifest) {
        guard !projectHasDatabaseWork(project.id) else {
            projectOperationError = "\(project.name) is still running a SQL or dataset operation. Finish that work before deleting the project."
            return
        }
        deleteTarget = project
    }
}
