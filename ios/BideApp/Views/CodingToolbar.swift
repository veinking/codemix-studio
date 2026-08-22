import SwiftUI

struct CodingToolbar: View {
    let suggestions: [CompletionSuggestion]
    let onCommand: (EditorAction) -> Void

    var body: some View {
        VStack(spacing: 0) {
            if !suggestions.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(suggestions) { suggestion in
                            Button(suggestion.label) {
                                onCommand(.replaceCurrentToken(suggestion.insertText))
                            }
                            .font(.caption.monospaced())
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                }
                Divider()
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    control("⇤", accessibility: "Outdent") { .outdent }
                    control("Tab", accessibility: "Indent") { .indent }
                    control("←", accessibility: "Move cursor left") { .moveCaret(-1) }
                    control("→", accessibility: "Move cursor right") { .moveCaret(1) }
                    control("( )", accessibility: "Insert parentheses") { .insertPair("(", ")") }
                    control("[ ]", accessibility: "Insert brackets") { .insertPair("[", "]") }
                    control("{ }", accessibility: "Insert braces") { .insertPair("{", "}") }
                    control("\" \"", accessibility: "Insert quotes") { .insertPair("\"", "\"") }
                    control(":", accessibility: "Insert colon") { .insert(":") }
                    control("_", accessibility: "Insert underscore") { .insert("_") }
                    control("#", accessibility: "Insert hash") { .insert("#") }

                    Button {
                        onCommand(.findReplace)
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .frame(minWidth: 30)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .accessibilityLabel("Find and replace")

                    Button {
                        onCommand(.undo)
                    } label: {
                        Image(systemName: "arrow.uturn.backward")
                            .frame(minWidth: 30)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .accessibilityLabel("Undo")

                    Button {
                        onCommand(.redo)
                    } label: {
                        Image(systemName: "arrow.uturn.forward")
                            .frame(minWidth: 30)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .accessibilityLabel("Redo")
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 7)
            }
        }
        .background(.bar)
    }

    @ViewBuilder
    private func control(
        _ title: String,
        accessibility: String,
        action: @escaping () -> EditorAction
    ) -> some View {
        Button(title) {
            onCommand(action())
        }
        .font(.caption.monospaced().weight(.semibold))
        .buttonStyle(.bordered)
        .controlSize(.small)
        .accessibilityLabel(accessibility)
    }
}
