import Foundation
import SwiftUI
import UIKit
@preconcurrency import Runestone
import TreeSitterPythonRunestone
import TreeSitterRRunestone
import TreeSitterSQLRunestone

struct BideCodeEditor: UIViewRepresentable {
    @Binding var text: String
    let language: CodeLanguage
    let documentID: String
    @Binding var selection: NSRange
    @Binding var command: EditorCommand?
    let wrapLines: Bool
    let onRunRequested: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> TextView {
        let textView = TextView()
        textView.editorDelegate = context.coordinator
        configure(textView)
        context.coordinator.loadDocument(into: textView)
        return textView
    }

    func updateUIView(_ textView: TextView, context: Context) {
        context.coordinator.parent = self
        textView.isLineWrappingEnabled = wrapLines

        if context.coordinator.loadedDocumentID != documentID || context.coordinator.loadedLanguage != language {
            context.coordinator.loadDocument(into: textView)
        } else if !context.coordinator.isApplyingExternalText, textView.text != text {
            let oldSelection = textView.selectedRange
            context.coordinator.isApplyingExternalText = true
            textView.text = text
            let maxLocation = (textView.text as NSString).length
            textView.selectedRange = NSRange(
                location: min(oldSelection.location, maxLocation),
                length: 0
            )
            context.coordinator.isApplyingExternalText = false
        }

        if let command, context.coordinator.lastCommandID != command.id {
            context.coordinator.lastCommandID = command.id
            context.coordinator.execute(command.action, in: textView)
            DispatchQueue.main.async {
                if self.command?.id == command.id {
                    self.command = nil
                }
            }
        }
    }

    private func configure(_ textView: TextView) {
        textView.backgroundColor = .secondarySystemBackground
        textView.showLineNumbers = true
        textView.lineSelectionDisplayType = .line
        textView.lineHeightMultiplier = 1.2
        textView.kern = 0.1
        textView.textContainerInset = UIEdgeInsets(top: 12, left: 8, bottom: 28, right: 12)
        textView.isLineWrappingEnabled = wrapLines
        textView.autocorrectionType = .no
        textView.autocapitalizationType = .none
        textView.spellCheckingType = .no
        textView.smartQuotesType = .no
        textView.smartDashesType = .no
        textView.smartInsertDeleteType = .no
        textView.keyboardType = .asciiCapable
        textView.verticalOverscrollFactor = 0.35
        textView.showsVerticalScrollIndicator = true
        textView.showsHorizontalScrollIndicator = !wrapLines
        if #available(iOS 16.0, *) {
            textView.isFindInteractionEnabled = true
        }
    }

    final class Coordinator: NSObject, TextViewDelegate {
        var parent: BideCodeEditor
        var loadedDocumentID: String?
        var loadedLanguage: CodeLanguage?
        var lastCommandID: UUID?
        var isApplyingExternalText = false

        init(parent: BideCodeEditor) {
            self.parent = parent
        }

        func loadDocument(into textView: TextView) {
            loadedDocumentID = parent.documentID
            loadedLanguage = parent.language
            isApplyingExternalText = true
            let state = TextViewState(text: parent.text, language: parent.language.runestoneLanguage)
            textView.setState(state)
            let length = (parent.text as NSString).length
            let desired = min(parent.selection.location, length)
            textView.selectedRange = NSRange(location: desired, length: 0)
            parent.selection = textView.selectedRange
            isApplyingExternalText = false
        }

        func textViewDidChange(_ textView: TextView) {
            guard !isApplyingExternalText else { return }
            parent.text = textView.text
            parent.selection = textView.selectedRange
        }

        func textViewDidChangeSelection(_ textView: TextView) {
            parent.selection = textView.selectedRange
        }

        func execute(_ action: EditorAction, in textView: TextView) {
            switch action {
            case .insert(let value):
                textView.insertText(value)

            case .insertPair(let opening, let closing):
                let range = textView.selectedRange
                let selected = textView.text(in: range) ?? ""
                let replacement = opening + selected + closing
                textView.replace(range, withText: replacement)
                let openingLength = (opening as NSString).length
                let selectedLength = (selected as NSString).length
                textView.selectedRange = NSRange(
                    location: range.location + openingLength,
                    length: selectedLength
                )

            case .indent:
                indentSelection(in: textView)

            case .outdent:
                outdentSelection(in: textView)

            case .moveCaret(let amount):
                moveCaret(amount, in: textView)

            case .undo:
                textView.undoManager?.undo()

            case .redo:
                textView.undoManager?.redo()

            case .findReplace:
                if #available(iOS 16.0, *) {
                    textView.isFindInteractionEnabled = true
                    textView.findInteraction?.presentFindNavigator(showingReplace: false)
                }

            case .findNext(let query):
                selectNextMatch(query, in: textView)

            case .replaceNext(let query, let replacement):
                replaceNextMatch(query, replacement: replacement, in: textView)

            case .replaceAll(let query, let replacement):
                replaceAllMatches(query, replacement: replacement, in: textView)

            case .replaceCurrentToken(let replacement):
                replaceCurrentToken(with: replacement, in: textView)

            case .runSelection:
                let selected = textView.text(in: textView.selectedRange) ?? ""
                parent.onRunRequested(selected.isEmpty ? textView.text : selected)
            }

            parent.selection = textView.selectedRange
        }

        private func indentSelection(in textView: TextView) {
            let selection = textView.selectedRange
            if selection.length == 0 {
                textView.insertText("    ")
                return
            }

            let nsText = textView.text as NSString
            let lineRange = nsText.lineRange(for: selection)
            let block = nsText.substring(with: lineRange)
            let transformed = block
                .split(separator: "\n", omittingEmptySubsequences: false)
                .map { "    " + $0 }
                .joined(separator: "\n")
            textView.replace(lineRange, withText: transformed)
            textView.selectedRange = NSRange(location: lineRange.location, length: (transformed as NSString).length)
        }

        private func outdentSelection(in textView: TextView) {
            let selection = textView.selectedRange
            let nsText = textView.text as NSString
            let lineRange = nsText.lineRange(for: selection)
            let block = nsText.substring(with: lineRange)
            let transformed = block
                .split(separator: "\n", omittingEmptySubsequences: false)
                .map { line -> String in
                    let value = String(line)
                    if value.hasPrefix("    ") { return String(value.dropFirst(4)) }
                    if value.hasPrefix("\t") { return String(value.dropFirst()) }
                    let spaces = value.prefix(while: { $0 == " " }).count
                    return String(value.dropFirst(min(4, spaces)))
                }
                .joined(separator: "\n")
            textView.replace(lineRange, withText: transformed)
            textView.selectedRange = NSRange(location: lineRange.location, length: (transformed as NSString).length)
        }

        private func moveCaret(_ amount: Int, in textView: TextView) {
            let selection = textView.selectedRange
            let maxLocation = (textView.text as NSString).length
            let startingLocation: Int
            if selection.length > 0 {
                startingLocation = amount < 0 ? selection.location : NSMaxRange(selection)
            } else {
                startingLocation = selection.location
            }
            let next = min(max(0, startingLocation + amount), maxLocation)
            textView.selectedRange = NSRange(location: next, length: 0)
            textView.scrollRangeToVisible(textView.selectedRange)
        }

        private func selectNextMatch(_ query: String, in textView: TextView) {
            guard !query.isEmpty else { return }
            let nsText = textView.text as NSString
            guard nsText.length > 0 else { return }
            let start = min(NSMaxRange(textView.selectedRange), nsText.length)
            var range = nsText.range(
                of: query,
                options: [],
                range: NSRange(location: start, length: nsText.length - start)
            )
            if range.location == NSNotFound, start > 0 {
                range = nsText.range(of: query, options: [], range: NSRange(location: 0, length: start))
            }
            guard range.location != NSNotFound else { return }
            textView.selectedRange = range
            textView.scrollRangeToVisible(range)
        }

        private func replaceNextMatch(_ query: String, replacement: String, in textView: TextView) {
            guard !query.isEmpty else { return }
            let selected = textView.text(in: textView.selectedRange) ?? ""
            if selected == query {
                let range = textView.selectedRange
                textView.replace(range, withText: replacement)
                textView.selectedRange = NSRange(
                    location: range.location + (replacement as NSString).length,
                    length: 0
                )
            } else {
                selectNextMatch(query, in: textView)
                guard (textView.text(in: textView.selectedRange) ?? "") == query else { return }
                let range = textView.selectedRange
                textView.replace(range, withText: replacement)
                textView.selectedRange = NSRange(
                    location: range.location + (replacement as NSString).length,
                    length: 0
                )
            }
        }

        private func replaceAllMatches(_ query: String, replacement: String, in textView: TextView) {
            guard !query.isEmpty else { return }
            let updated = textView.text.replacingOccurrences(of: query, with: replacement)
            guard updated != textView.text else { return }
            isApplyingExternalText = true
            textView.text = updated
            parent.text = updated
            textView.selectedRange = NSRange(location: 0, length: 0)
            parent.selection = textView.selectedRange
            isApplyingExternalText = false
        }

        private func replaceCurrentToken(with replacement: String, in textView: TextView) {
            let caret = textView.selectedRange.location
            let token = CompletionProvider.currentToken(in: textView.text, caret: caret)
            let tokenLength = (token as NSString).length
            if tokenLength == 0 {
                textView.insertText(replacement)
                return
            }
            let range = NSRange(location: max(0, caret - tokenLength), length: tokenLength)
            textView.replace(range, withText: replacement)
            let end = range.location + (replacement as NSString).length
            textView.selectedRange = NSRange(location: end, length: 0)
        }
    }
}

private extension CodeLanguage {
    var runestoneLanguage: TreeSitterLanguage {
        switch self {
        case .python: return .python
        case .sql: return .sql
        case .r: return .r
        }
    }
}
