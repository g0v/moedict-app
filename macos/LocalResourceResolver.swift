import Foundation

enum LocalResourceResolver {
    static func resolve(_ requestURL: URL, under rootDirectory: URL) -> URL? {
        guard requestURL.scheme == "app",
              requestURL.host == "localhost",
              requestURL.port == nil,
              requestURL.user == nil,
              requestURL.password == nil else {
            return nil
        }

        let root = rootDirectory.standardizedFileURL.resolvingSymlinksInPath()
        let path = requestURL.path.isEmpty || requestURL.path == "/"
            ? "/index.html"
            : requestURL.path
        let segments = path.split(separator: "/", omittingEmptySubsequences: true)
        guard !segments.contains(where: { $0 == "." || $0 == ".." || $0.contains("\\") || $0.contains("\0") }) else {
            return nil
        }

        let candidate = root.appendingPathComponent(segments.joined(separator: "/"))
            .standardizedFileURL.resolvingSymlinksInPath()
        guard isInside(candidate, root: root) else { return nil }

        var isDirectory: ObjCBool = false
        let exists = FileManager.default.fileExists(atPath: candidate.path, isDirectory: &isDirectory)
        let resolved: URL
        if !exists && candidate.pathExtension.isEmpty {
            resolved = root.appendingPathComponent("index.html")
        } else if isDirectory.boolValue {
            resolved = candidate.appendingPathComponent("index.html")
        } else {
            resolved = candidate
        }

        let file = resolved.standardizedFileURL.resolvingSymlinksInPath()
        return isInside(file, root: root) ? file : nil
    }

    private static func isInside(_ file: URL, root: URL) -> Bool {
        let rootPath = root.path.hasSuffix("/") ? String(root.path.dropLast()) : root.path
        return file.path.hasPrefix(rootPath + "/")
    }
}
