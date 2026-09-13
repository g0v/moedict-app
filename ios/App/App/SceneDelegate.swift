import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // The window and its root CAPBridgeViewController are instantiated
        // from Main.storyboard via UISceneStoryboardFile in Info.plist.
        // iOS 26+ traps at launch (___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption)
        // for apps without a scene delegate, so this class must exist even
        // though no manual wiring is needed here.
        guard let _ = (scene as? UIWindowScene) else { return }
        // Cold launch from a URL or activity delivers it in the connection
        // options — the openURLContexts/continue callbacks below only fire
        // for already-connected scenes. Forward both so the App API sees
        // the launch link exactly once.
        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
        for activity in connectionOptions.userActivities {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Preserve the App API's URL-open tracking under the scene lifecycle
        // (application(_:open:options:) is not called for scene-based apps).
        guard let url = URLContexts.first?.url else { return }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        // Same forwarding as AppDelegate for Universal Links / Handoff.
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }

}
