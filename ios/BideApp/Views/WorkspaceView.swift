import SwiftUI

struct WorkspaceView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var selection = NSRange(location: 0, length: 0)
    @State private var editorCommand: EditorCommand?
    @State private var filesPresented = false
    @State private var newFilePresented = false
    @State private var findReplacePresented = false
    @State private var findText = ""
    @State private var replaceText = ""
    @State private var runPreview = ""
    @State private var runPreviewPresented = false

    private var isCompact: Bool {
        horizontalSizeClass == .compact
    }

    private var suggestions: [CompletionSuggestion] {
        CompletionProvider.suggestions(
            text: workspace.documentText,
            selection: selection,
            language: workspace.documentLanguage,
            projectFiles: workspace.files
        )
    }

    private var documentID: String {
        "\(workspace.activeProjectID?.uuidString ?? "none")::\(workspace.activeFileID ?? "none")"
    }

    var body: some View {
        Group {
            if isCompact {
                editorPane
            } else {
                HStack(spacing: 0) {
                    ProjectFileBrowser(onCreateFile: { newFilePresented = true })
                        .frame(minWidth: 220, idealWidth: 250, maxWidth: 285)
                    Divider()
                    editorPane
                }
            }
        }
        .navigationTitle(workspace.activeProjectName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                if isCompact {
                    Button {
                        filesPresented = true
                    } label: {
                        Image(systemName: "sidebar.left")
                    }
                    .accessibilityLabel("Files")
                }
            }

            ToolbarItemGroup(placement: .topBarTrailing) {
                projectMenu

                Button {
                    workspace.saveActiveDocumentNow()
                } label: {
                    saveStateLabel
                }
                .accessibilityLabel("Save file")

                Button {
                    editorCommand = EditorCommand(action: .runSelection)
                } label: {
                    Image(systemName: "play.fill")
                }
                .keyboardShortcut("r", modifiers: .command)
                .accessibilityLabel("Run selection or file")
                .disabled(workspace.activeFile == nil)
            }
        }
        .sheet(isPresented: $filesPresented) {
            NavigationStack {
                ProjectFileBrowser(onCreateFile: {
                    filesPresented = false
                    DispatchQueue.main.async {
                        newFilePresented = true
                    }
                })
                .navigationTitle("Files")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { filesPresented = false }
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $newFilePresented) {
            NewFileSheet { name, language in
                workspace.createFile(named: name, language: language)
                selection = NSRange(location: 0, length: 0)
            }
        }
        .sheet(isPresented: $findReplacePresented) {
            FindReplaceSheet(
                findText: $findText,
                replaceText: $replaceText,
                onFindNext: {
                    editorCommand = EditorCommand(action: .findNext(findText))
                },
                onReplaceNext: {
                    editorCommand = EditorCommand(action: .replaceNext(findText, replaceText))
                },
                onReplaceAll: {
                    editorCommand = EditorCommand(action: .replaceAll(findText, replaceText))
                }
            )
        }
        .alert("Runtime comes next", isPresented: $runPreviewPresented) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(runPreview.isEmpty
                 ? "The native editor is ready for runtime wiring in the next phase."
                 : "Run selection/file is wired at the editor boundary. Execution is intentionally disabled during Phase 1.\n\n\(runPreview.prefix(220))")
        }
        .onChange(of: workspace.activeFileID) { _, _ in
            selection = NSRange(location: 0, length: 0)
        }
    }

    @ViewBuilder
    private var editorPane: some View {
        VStack(spacing: 0) {
            editorHeader
            Divider()

            if workspace.activeFile != nil {
                BideCodeEditor(
                    text: Binding(
                        get: { workspace.documentText },
                        set: { workspace.updateDocumentText($0) }
                    ),
                    language: workspace.documentLanguage,
                    documentID: documentID,
                    selection: $selection,
                    command: $editorCommand,
                    wrapLines: isCompact,
                    onRunRequested: { code in
                        runPreview = code
                        runPreviewPresented = true
                    }
                )
                .id(documentID)

                Divider()
                CodingToolbar(
                    suggestions: suggestions,
                    onCommand: handleEditorAction
                )
            } else {
                ContentUnavailableView(
                    "No Open File",
                    systemImage: "doc.badge.plus",
                    description: Text("Create a Python, SQL, or R file to begin.")
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .safeAreaInset(edge: .bottom) {
                    Button("Create File") {
                        newFilePresented = true
                    }
                    .buttonStyle(.borderedProminent)
                    .padding()
                }
            }
        }
        .background(Color(uiColor: .secondarySystemBackground))
    }

    private var editorHeader: some View {
        HStack(spacing: 10) {
            if let file = workspace.activeFile {
                Image(systemName: workspace.documentLanguage.systemImage)
                    .foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 1) {
                    Text(file.name)
                        .font(.subheadline.monospaced().weight(.semibold))
                        .lineLimit(1)
                    Text("Active file")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } else {
                Text("No open file")
                    .font(.subheadline.weight(.semibold))
            }

            Spacer()

            Text(workspace.documentLanguage.displayName)
                .font(.caption.monospaced().weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.thinMaterial, in: Capsule())
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var projectMenu: some View {
        Menu {
            ForEach(workspace.projects) { project in
                Button {
                    workspace.openProject(project.id)
                    selection = NSRange(location: 0, length: 0)
                } label: {
                    if project.id == workspace.activeProjectID {
                        Label(project.name, systemImage: "checkmark")
                    } else {
                        Text(project.name)
                    }
                }
            }
        } label: {
            Image(systemName: "folder")
        }
        .accessibilityLabel("Switch project")
    }

    @ViewBuilder
    private var saveStateLabel: some View {
        switch workspace.saveState {
        case .saved:
            Image(systemName: "checkmark.circle")
        case .saving:
            ProgressView()
                .controlSize(.small)
        case .failed:
            Image(systemName: "exclamationmark.triangle")
                .foregroundStyle(.orange)
        }
    }

    private func handleEditorAction(_ action: EditorAction) {
        if action == .findReplace {
            findReplacePresented = true
        } else {
            editorCommand = EditorCommand(action: action)
        }
    }
}

private struct NewFileSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = "untitled"
    @State private var language: CodeLanguage = .python

    let onCreate: (String, CodeLanguage) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("File") {
                    TextField("Name", text: $name)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Picker("Language", selection: $language) {
                        ForEach(CodeLanguage.allCases) { language in
                            Label(language.displayName, systemImage: language.systemImage)
                                .tag(language)
                        }
                    }
                }

                Section {
                    LabeledContent("Extension", value: ".\(language.fileExtension)")
                } footer: {
                    Text("Native bIDE V1 intentionally supports Python, SQL, and R code files only.")
                }
            }
            .navigationTitle("New File")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        onCreate(name, language)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }
}

private struct FindReplaceSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var findText: String
    @Binding var replaceText: String

    let onFindNext: () -> Void
    let onReplaceNext: () -> Void
    let onReplaceAll: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Find") {
                    TextField("Text to find", text: $findText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.search)
                        .onSubmit(onFindNext)
                }

                Section("Replace") {
                    TextField("Replacement", text: $replaceText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                Section {
                    Button("Find Next", action: onFindNext)
                        .disabled(findText.isEmpty)
                    Button("Replace Next", action: onReplaceNext)
                        .disabled(findText.isEmpty)
                    Button("Replace All", action: onReplaceAll)
                        .disabled(findText.isEmpty)
                }
            }
            .navigationTitle("Find & Replace")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
