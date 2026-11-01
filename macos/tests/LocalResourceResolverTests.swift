import Foundation

@main
struct LocalResourceResolverTests {
    static func main() throws {
        let fileManager = FileManager.default
        let fixture = fileManager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let root = fixture.appendingPathComponent("public")
        let assets = root.appendingPathComponent("assets")
        let directory = root.appendingPathComponent("dictionary")
        try fileManager.createDirectory(at: assets, withIntermediateDirectories: true)
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: fixture) }

        let index = root.appendingPathComponent("index.html")
        let asset = assets.appendingPathComponent("main.js")
        let directoryIndex = directory.appendingPathComponent("index.html")
        let outside = fixture.appendingPathComponent("private.txt")
        try Data("home".utf8).write(to: index)
        try Data("asset".utf8).write(to: asset)
        try Data("directory".utf8).write(to: directoryIndex)
        try Data("private".utf8).write(to: outside)
        try fileManager.createSymbolicLink(
            at: root.appendingPathComponent("linked.txt"),
            withDestinationURL: outside
        )

        func resolved(_ address: String) -> URL? {
            LocalResourceResolver.resolve(URL(string: address)!, under: root)
        }

        precondition(resolved("app://localhost/") == index)
        precondition(resolved("app://localhost/assets/main.js") == asset)
        precondition(resolved("app://localhost/dictionary/") == directoryIndex)
        precondition(resolved("app://localhost/未收錄") == index)
        precondition(resolved("app://localhost/%2e%2e%2fprivate.txt") == nil)
        precondition(resolved("app://localhost/%2f..%2fprivate.txt") == nil)
        precondition(resolved("app://localhost/linked.txt") == nil)
        precondition(resolved("app://other/assets/main.js") == nil)
        precondition(resolved("https://localhost/assets/main.js") == nil)

        print("LocalResourceResolver tests passed")
    }
}
