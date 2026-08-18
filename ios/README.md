# Threadii iOS — WebView Wrapper

A native SwiftUI shell around a single `WKWebView` pointed at `https://threadii.app`.
Handles: pull-to-refresh, a loading/progress screen, an offline/error retry screen
matching the app's own steel-blue/cream palette, camera + photo library access for
the existing upload flow, and keeping navigation inside the app (external links
open in Safari instead).

Login persists automatically — the web app stores its session in `localStorage`,
and `WKWebView`'s default data store is persistent across launches, so no extra
session code was needed here.

Since this was written without access to Xcode (no Mac in this environment), it's
plain Swift source files rather than a hand-built `.xcodeproj` — a hand-crafted
project file is easy to get subtly wrong in a way I can't verify without opening
it. Creating a fresh project in Xcode and dropping these files in is more
reliable and takes about five minutes.

## Files

- `ThreadiiApp.swift` — app entry point
- `ContentView.swift` — root view: loading state, error/retry state, hosts the WebView
- `WebView.swift` — the `UIViewRepresentable` WKWebView wrapper + its delegate logic
- `Theme.swift` — brand colors, kept in sync with `client/tailwind.config.js`
- `Info.plist` — camera/photo-library usage strings + launch screen config (reference — see setup below for how to apply it)
- `Assets.xcassets/` — `AccentColor` and `LaunchBackground` color sets (steel blue), plus an empty `AppIcon.appiconset` ready for an actual icon image

## Setup (on a Mac, in Xcode)

1. **Create the project.** File → New → Project → iOS → App.
   - Product Name: `Threadii`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck "Use Core Data" / "Include Tests" (not needed)

2. **Replace the default files.** Xcode generates its own `ThreadiiApp.swift` and
   `ContentView.swift` — delete their contents and paste in the versions from this
   folder (or just delete the generated files and drag in mine, keeping "Copy items
   if needed" checked).

3. **Add the new files.** Drag `WebView.swift` and `Theme.swift` into the project
   navigator (again, "Copy items if needed" checked, target membership on).

4. **Add the Info.plist keys.** Modern Xcode manages `Info.plist` automatically
   rather than using a standalone file, so the safest path is: select the project
   in the navigator → select the **Threadii target** → **Info** tab → add these
   three rows under "Custom iOS Target Properties" (hover any row, click **+**):
   - `Privacy - Camera Usage Description` → `Threadii uses your camera to photograph clothing items you add to your closet.`
   - `Privacy - Photo Library Usage Description` → `Threadii uses your photo library to add pictures of clothing items to your closet.`
   - `Status bar style` → `Light Content`

   (The `Info.plist` file in this folder has the same values in raw XML if you'd
   rather point the build settings at a custom file instead — either approach works.)

5. **Add the colors.** Open `Assets.xcassets` in Xcode (it already exists in the
   generated project). Xcode already created an `AccentColor` entry — click it and
   set RGB to `61, 106, 133` (steel blue, `#3D6A85`). Then right-click in the
   asset list → New Color Set → name it exactly `LaunchBackground` → set it to the
   same `61, 106, 133`. This matches the `<html>` background the web app itself
   uses, so there's no color flash before the page loads.

6. **App icon (optional but recommended before distributing).** Click
   `AppIcon` in `Assets.xcassets` and drag in a 1024×1024 PNG — reuse the smiley
   logo mark from the web app (`client/public` or wherever the source art lives)
   if you have it as a flat image; Xcode only needs the one 1024×1024 size now
   and generates the rest.

7. **Run it.** Select a simulator (or your device) and hit ▶. It should load
   threadii.app directly.

## Notes for later

- If threadii.app ever needs additional native capabilities (push notifications,
  native share sheet, biometric unlock, etc.), those go in `WebView.swift`'s
  `Coordinator` and/or a JS bridge via `WKScriptMessageHandler` — not covered here
  since it wasn't asked for, but the structure leaves room for it.
- `webView.scrollView.contentInsetAdjustmentBehavior = .never` is intentional —
  the web app already pads for the safe area via CSS (`env(safe-area-inset-*)`,
  see `client/src/index.css`). Removing that line would double-pad the content.
