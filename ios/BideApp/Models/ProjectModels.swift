import Foundation

struct BideProjectManifest: Codable, Identifiable, Hashable {
    let id: UUID
    var name: String
    let createdAt: Date
    var updatedAt: Date

    init(id: UUID = UUID(), name: String, createdAt: Date = .now, updatedAt: Date = .now) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

struct BideProjectFile: Identifiable, Hashable {
    let relativePath: String
    let url: URL
    let language: CodeLanguage

    var id: String { relativePath }
    var name: String { url.lastPathComponent }
}
