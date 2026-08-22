import Foundation

struct EditorCommand: Identifiable, Equatable {
    let id = UUID()
    let action: EditorAction
}

enum EditorAction: Equatable {
    case insert(String)
    case insertPair(String, String)
    case indent
    case outdent
    case moveCaret(Int)
    case undo
    case redo
    case findReplace
    case findNext(String)
    case replaceNext(String, String)
    case replaceAll(String, String)
    case replaceCurrentToken(String)
    case dismissKeyboard
    case runSelection
}
