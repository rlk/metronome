# metronome

A simple metronome app: [rlk.github.io/metronome](https://rlk.github.io/metronome)

This metronome is intended to be as simple as possible while still being useful. The design has very few requirements:

-   To optionally tick on the upbeat instead of the downbeat.
-   To allow the tempo to be set quickly and accurately.
-   To work in either landscape or portrait layout, on mobile or desktop.

## Full-screen Display

The content is defined as a web document, but is intended to be used like a mobile app. The toolbar of your mobile browser might cover part of the interface. If so, use one of these methods of eliminating the toolbar.

-   Install as a PWA (Android)
-   "Add to Home Screen" (iOS)
-   "Page Menu" > "Hide Toolbar" (iOS)

## Screen Wake Lock

The Start / Stop button turns green to indicate that the app holds the [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API). This ensures that the display won't dim or lock while the metronome is running.

If the Start / Stop button is not green, then the app still works normally, but the device might interrupt the metronome's operation. This may be due to a low power state, or the lack of a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS).
