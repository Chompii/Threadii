import SwiftUI

struct ContentView: View {
    @State private var isLoading = true
    @State private var loadFailed = false
    @State private var progress: Double = 0
    @State private var reloadTrigger = 0

    private let siteURL = URL(string: "https://threadii.app")!

    var body: some View {
        ZStack {
            ThreadiiTheme.steelColor.ignoresSafeArea()

            WebView(
                url: siteURL,
                isLoading: $isLoading,
                loadFailed: $loadFailed,
                estimatedProgress: $progress,
                reloadTrigger: reloadTrigger
            )
            .ignoresSafeArea()
            .opacity(loadFailed ? 0 : 1)

            if isLoading && !loadFailed {
                VStack(spacing: 16) {
                    Text("Threadii")
                        .font(.system(size: 28, weight: .heavy, design: .serif))
                        .foregroundColor(ThreadiiTheme.creamColor)
                    ProgressView(value: progress)
                        .progressViewStyle(.linear)
                        .tint(ThreadiiTheme.creamColor)
                        .frame(width: 140)
                }
                .transition(.opacity)
            }

            if loadFailed {
                VStack(spacing: 18) {
                    Text("Couldn't load Threadii")
                        .font(.headline)
                        .foregroundColor(ThreadiiTheme.inkColor)
                    Text("Check your connection and try again.")
                        .font(.subheadline)
                        .foregroundColor(ThreadiiTheme.taupeColor)
                    Button {
                        loadFailed = false
                        isLoading = true
                        reloadTrigger += 1
                    } label: {
                        Text("Try Again")
                            .font(.headline)
                            .foregroundColor(ThreadiiTheme.creamColor)
                            .padding(.horizontal, 28)
                            .padding(.vertical, 12)
                            .background(ThreadiiTheme.steelColor)
                            .clipShape(Capsule())
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(ThreadiiTheme.creamColor.ignoresSafeArea())
            }
        }
        .animation(.easeOut(duration: 0.2), value: isLoading)
        .preferredColorScheme(.light)
    }
}

#Preview {
    ContentView()
}
