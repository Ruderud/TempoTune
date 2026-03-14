import UIKit
import AVFoundation
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "TempoTune",
      in: window,
      launchOptions: launchOptions
    )

    // Request microphone permission on first launch for tuner WebView
    AVAudioSession.sharedInstance().requestRecordPermission { _ in }

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    if let providerURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
      return providerURL
    }

    return fallbackDebugBundleURL()
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

#if DEBUG
  private func fallbackDebugBundleURL() -> URL? {
    let bundlePath = "index.bundle?platform=ios&dev=true&minify=false"
    let port = ProcessInfo.processInfo.environment["RCT_METRO_PORT"] ?? "8081"
    let hostCandidates: [String]

#if targetEnvironment(simulator)
    hostCandidates = ["localhost", "127.0.0.1"]
#else
    hostCandidates = [
      ProcessInfo.processInfo.environment["RCT_METRO_HOST"],
      ProcessInfo.processInfo.environment["DEV_MACHINE_IP"],
    ]
    .compactMap { value in
      guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines),
            !trimmed.isEmpty else {
        return nil
      }
      return trimmed
    }
#endif

    for host in hostCandidates {
      if let url = URL(string: "http://\(host):\(port)/\(bundlePath)") {
        NSLog("[TempoTune] Falling back to Metro bundle URL: %@", url.absoluteString)
        return url
      }
    }

    NSLog("[TempoTune] Failed to resolve a debug JS bundle URL")
    return nil
  }
#endif
}
