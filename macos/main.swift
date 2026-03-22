import AppKit
import WebKit

// MARK: - Custom URL Scheme Handler
// Serves files from the dist/ directory under the "app" scheme,
// so that fetch('/path') works correctly (file:// would block CORS).

class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    let rootDirectory: URL

    init(rootDirectory: URL) {
        self.rootDirectory = rootDirectory
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: "LocalScheme", code: -1))
            return
        }

        // Map URL path to file on disk
        var path = url.path
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }

        let fileURL = rootDirectory.appendingPathComponent(path)
        var isDir: ObjCBool = false

        // If the path is a directory or doesn't exist and doesn't have an extension,
        // serve index.html (SPA fallback)
        let fileExists = FileManager.default.fileExists(atPath: fileURL.path, isDirectory: &isDir)
        let serveURL: URL
        if !fileExists && fileURL.pathExtension.isEmpty {
            // SPA route – serve index.html
            serveURL = rootDirectory.appendingPathComponent("index.html")
        } else if fileExists && isDir.boolValue {
            serveURL = fileURL.appendingPathComponent("index.html")
        } else {
            serveURL = fileURL
        }

        guard FileManager.default.fileExists(atPath: serveURL.path) else {
            let response = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(Data("404 Not Found".utf8))
            urlSchemeTask.didFinish()
            return
        }

        do {
            let data = try Data(contentsOf: serveURL)
            let mimeType = Self.mimeType(for: serveURL.pathExtension)
            let response = HTTPURLResponse(
                url: url,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: [
                    "Content-Type": mimeType,
                    "Content-Length": "\(data.count)",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                ]
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Nothing to clean up
    }

    static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "js", "mjs": return "application/javascript; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "gif": return "image/gif"
        case "svg": return "image/svg+xml"
        case "ico": return "image/x-icon"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        case "txt": return "text/plain; charset=utf-8"
        case "xml": return "application/xml"
        case "webmanifest": return "application/manifest+json"
        case "webp": return "image/webp"
        default: return "application/octet-stream"
        }
    }
}

// MARK: - App Delegate

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Determine the dist directory
        let distPath: String
        if let resourcePath = Bundle.main.resourcePath,
           FileManager.default.fileExists(atPath: resourcePath + "/public/index.html") {
            distPath = resourcePath + "/public"
        } else {
            // Fallback: resolve relative to executable for dev builds
            let execURL = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
            let candidate = execURL.deletingLastPathComponent().appendingPathComponent("dist").path
            if FileManager.default.fileExists(atPath: candidate + "/index.html") {
                distPath = candidate
            } else {
                // Absolute fallback
                distPath = "/Users/au/w/moedict-app/dist"
            }
        }
        let distURL = URL(fileURLWithPath: distPath)

        // Configure WKWebView with custom scheme handler
        let config = WKWebViewConfiguration()
        let schemeHandler = LocalSchemeHandler(rootDirectory: distURL)
        config.setURLSchemeHandler(schemeHandler, forURLScheme: "app")

        // Allow media playback without user gesture (for audio pronunciations)
        config.mediaTypesRequiringUserActionForPlayback = []

        // Create WebView
        let contentRect = NSRect(x: 0, y: 0, width: 1024, height: 768)
        webView = WKWebView(frame: contentRect, configuration: config)
        webView.autoresizingMask = [.width, .height]

        // Enable back/forward navigation gestures
        webView.allowsBackForwardNavigationGestures = true

        // Create window
        window = NSWindow(
            contentRect: contentRect,
            styleMask: [.titled, .closable, .resizable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "萌典"
        window.contentView = webView
        window.center()
        window.setFrameAutosaveName("MoedictMainWindow")

        // Set minimum window size
        window.minSize = NSSize(width: 400, height: 300)

        // Load the app via custom scheme
        let appURL = URL(string: "app://localhost/")!
        webView.load(URLRequest(url: appURL))

        window.makeKeyAndOrderFront(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ application: NSApplication) -> Bool {
        return true
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
}

// MARK: - Main Entry Point

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
app.run()
