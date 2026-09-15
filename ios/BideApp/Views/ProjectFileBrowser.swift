import SwiftUI

struct ProjectFileBrowser: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    let onCreateFile: () -> Void

    @State private var renameTarget: BideProjectFile?
    @State private var renameValue = ""
    @State private var shareURLs: [URL] = []
    @State private var sharePresented = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("PROJECT")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                    Text(workspace.activeProjectName)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                }
                Spacer()
                Button {
                    shareProjectFiles()
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Export project files")
                .disabled(workspace.files.isEmpty)

                Button(action: onCreateFile) {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("New file")
            }
            .padding(12)

            Divider()

            if workspace.files.isEmpty {
                ContentUnavailableView(
                    "No Code Files",
                    systemImage: "doc.badge.plus",
                    description: Text("Create a Python, SQL, or R file to start coding.")
                )
                .frame(maxHeight: .infinity)
            } else {
                List(workspace.files) { file in
                    Button {
                        workspace.openFile(file.id)
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: file.language.systemImage)
                                .foregroundStyle(.secondary)
                                .frame(width: 18)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(file.name)
                                    .font(.subheadline.monospaced())
                                    .lineLimit(1)
                                if file.relativePath != file.name {
                                    Text(file.relativePath)
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }
                            }
                            Spacer(minLength: 4)
                            if file.id == workspace.activeFileID {
                                Image(systemName: "circle.fill")
                                    .font(.system(size: 6))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(
                        file.id == workspace.activeFileID
                            ? Color.accentColor.opacity(0.12)
                            : Color.clear
                    )
                    .contextMenu {
                        Button("Share File", systemImage: "square.and.arrow.up") {
                            shareFile(file)
                        }
                        Button("Rename", systemImage: "pencil") {
                            renameValue = file.name
                            renameTarget = file
                        }
                        Button("Delete", systemImage: "trash", role: .destructive) {
                            workspace.deleteFile(file)
                        }
                    }
                }
                .listStyle(.sidebar)
            }
        }
        .sheet(isPresented: $sharePresented) {
            ActivityShareSheet(urls: shareURLs)
        }
        .alert("Rename File", isPresented: Binding(
            get: { renameTarget != nil },
            set: { if !$0 { renameTarget = nil } }
        )) {
            TextField("File name", text: $renameValue)
            Button("Cancel", role: .cancel) {
                renameTarget = nil
            }
            Button("Rename") {
                if let renameTarget {
                    workspace.renameFile(renameTarget, to: renameValue)
                }
                renameTarget = nil
            }
        } message: {
            Text("The file keeps its current Python, SQL, or R extension.")
        }
    }

    private func shareFile(_ file: BideProjectFile) {
        if file.id == workspace.activeFileID {
            workspace.saveActiveDocumentNow()
        }
        shareURLs = [file.url]
        sharePresented = true
    }

    private func shareProjectFiles() {
        workspace.saveActiveDocumentNow()
        shareURLs = workspace.files.map(\.url)
        guard !shareURLs.isEmpty else { return }
        sharePresented = true
    }
}
