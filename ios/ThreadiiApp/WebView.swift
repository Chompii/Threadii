import SwiftUI
import WebKit

/// Wraps a single persistent WKWebView pointed at the live Threadii site.
/// Login uses localStorage (bearer token), not cookies, and WKWebView's
/// default website data store already persists that across launches —
/// no extra session handling needed here.
struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var loadFailed: Bool
    @Binding var estimatedProgress: Double
    let reloadTrigger: Int

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        // The web app already handles safe-area padding itself via CSS
        // (env(safe-area-inset-*)), so let it own that instead of the
        // system double-applying insets on top.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.backgroundColor = ThreadiiTheme.steel
        webView.isOpaque = false

        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        context.coordinator.observeProgress(for: webView)
        context.coordinator.webView = webView
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.lastReloadTrigger != reloadTrigger {
            context.coordinator.lastReloadTrigger = reloadTrigger
            webView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let parent: WebView
        weak var webView: WKWebView?
        var lastReloadTrigger = 0
        private var progressObservation: NSKeyValueObservation?

        init(_ parent: WebView) {
            self.parent = parent
        }

        func observeProgress(for webView: WKWebView) {
            progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, _ in
                DispatchQueue.main.async {
                    self?.parent.estimatedProgress = webView.estimatedProgress
                }
            }
        }

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            webView?.reload()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
                self.parent.loadFailed = false
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                webView.scrollView.refreshControl?.endRefreshing()
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            handleFailure(webView, error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            handleFailure(webView, error)
        }

        private func handleFailure(_ webView: WKWebView, _ error: Error) {
            if (error as NSError).code == NSURLErrorCancelled { return } // e.g. a reload superseding an in-flight load
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.loadFailed = true
                webView.scrollView.refreshControl?.endRefreshing()
            }
        }

        // Keep threadii.app navigation in-app; send anything else (there's
        // nothing today, but this is cheap insurance) out to Safari.
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url, let host = url.host else {
                decisionHandler(.allow)
                return
            }
            if host == "threadii.app" || host.hasSuffix(".threadii.app") {
                decisionHandler(.allow)
            } else if url.scheme == "http" || url.scheme == "https" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.allow)
            }
        }

        // window.open()/target="_blank" — load in the same webview rather
        // than silently doing nothing (WKWebView has no popup UI by default).
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }

        // Not currently used by the web app, but implemented so a future
        // alert()/confirm() call doesn't just silently no-op.
        func webView(
            _ webView: WKWebView,
            runJavaScriptAlertPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping () -> Void
        ) {
            presentAlert(message: message, hasCancel: false) { _ in completionHandler() }
        }

        func webView(
            _ webView: WKWebView,
            runJavaScriptConfirmPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping (Bool) -> Void
        ) {
            presentAlert(message: message, hasCancel: true, completion: completionHandler)
        }

        private func presentAlert(message: String, hasCancel: Bool, completion: @escaping (Bool) -> Void) {
            DispatchQueue.main.async {
                guard let root = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .flatMap({ $0.windows })
                    .first(where: { $0.isKeyWindow })?.rootViewController
                else {
                    completion(true)
                    return
                }
                let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
                if hasCancel {
                    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completion(false) })
                }
                alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completion(true) })
                root.present(alert, animated: true)
            }
        }
    }
}
