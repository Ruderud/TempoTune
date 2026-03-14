import Foundation

@objc(AppRuntimeInfoModule)
class AppRuntimeInfoModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func constantsToExport() -> [AnyHashable: Any]! {
    [
      "distributionChannel": Self.distributionChannel(),
    ]
  }

  private static func distributionChannel() -> String {
#if DEBUG
    return "development"
#else
#if targetEnvironment(simulator)
    return "simulator"
#else
    if isTestFlightBuild() {
      return "testflight"
    }

    if isAppStoreBuild() {
      return "appstore"
    }

    return "unknown"
#endif
#endif
  }

  private static func isTestFlightBuild() -> Bool {
    Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
  }

  private static func isAppStoreBuild() -> Bool {
    guard Bundle.main.appStoreReceiptURL?.lastPathComponent == "receipt" else {
      return false
    }

    return Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") == nil
  }
}
