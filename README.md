# App Lock

Lock distracting apps on Windows for a set amount of time. Pick the apps, choose how long, and any of those apps closes as soon as it opens until the timer runs out.

**Open App Lock: https://muhammada1012000-ui.github.io/app-lock/** (works in Microsoft Edge and Google Chrome)

## Install (one time)

A web page can't close programs on your PC by itself, so App Lock uses a small helper that runs on your computer. Set it up once:

1. Download this repository (**Code → Download ZIP**) and unzip it somewhere you'll keep it, for example `C:\Users\<you>\AppLock`.
2. Right-click `Install.ps1` → **Run with PowerShell**.
3. App Lock opens in your default browser. If Edge or Chrome asks to let the site access devices on your local network, click **Allow**. That's how the page talks to the helper on your PC.

After that, the helper starts by itself, hidden, every time you sign in to Windows. Just open the link above whenever you want to lock apps.

If Windows blocks the script, open PowerShell in the folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install.ps1
```

## Chrome extension

App Lock is also a browser extension, so it sits in your toolbar. It works in Google Chrome and Microsoft Edge, and it uses the same helper as the website, so run `Install.ps1` first.

1. In Chrome, go to `chrome://extensions` (in Edge: `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `extension` folder inside App Lock.
4. Click the puzzle-piece icon in the toolbar and pin **App Lock**.

## Android tablets and phones

On Android, App Lock is an app. It shows the same screen as the website, lists the apps installed on your tablet, and blocks the ones you pick until the timer ends. When you open a locked app, it sends you to the home screen and shows how long is left.

**Download:** on your tablet, open https://github.com/muhammada1012000-ui/app-lock/releases/download/android-latest/AppLock.apk (or open the website on the tablet and tap **Download the App Lock app**).

### Install on a Samsung tablet

1. Open the download link above in Chrome or Samsung Internet on the tablet. If it warns that the file might be harmful, tap **Download anyway**.
2. Open the downloaded **AppLock.apk** (from the notification, or **My Files → Downloads**).
3. If Android says it can't install apps from this source, tap **Settings**, switch on **Allow from this source**, then go back and tap **Install**.
4. If **Auto Blocker** is on (Samsung, One UI 6 and newer), it blocks apps from outside the Galaxy Store. Turn it off under **Settings → Security and privacy → Auto Blocker** while you install, then turn it back on. App Lock keeps working.
5. If Google Play Protect asks to scan the app, choose **Scan app** or **Install without scanning**. App Lock isn't on the Play Store, so Play Protect doesn't know it yet.

### Turn on blocking (one time)

Android only lets apps block other apps through **Accessibility**, so App Lock needs it switched on:

1. Open App Lock and tap **Open Accessibility settings**.
2. Tap **Installed apps** (sometimes **Downloaded apps**) → **App Lock** → switch it on → **Allow**.
3. **If the switch is greyed out** ("Restricted setting"): open **Settings → Apps → App Lock**, tap **⋮** (top right) → **Allow restricted settings**, confirm with your PIN, then repeat step 2. Android does this for every app installed from outside the store.
4. Recommended on Samsung: **Settings → Apps → App Lock → Battery → Unrestricted**, so the tablet never puts App Lock to sleep.

Then pick apps, set the timer, and tap **Start lock**.

### Android limits

- **Accessibility must stay on.** If someone turns off App Lock under Accessibility, blocking stops until it's switched back on. App Lock keeps Settings unlockable so you can't lock yourself out of your tablet.
- **Some apps can't be locked:** App Lock itself, Settings, the phone and emergency-call apps, and the home screen.
- **Blocking happens when the app opens.** A locked app may show for a split second before App Lock sends you home.
- **Uninstalling App Lock ends the lock.** Android doesn't let normal apps prevent their own removal.
- **Locks survive restarts.** The lock is saved on the tablet, and Android restarts App Lock's blocker after boot.
- **Updating:** install the new APK over the old one. If Android says the app conflicts with an existing one, uninstall App Lock first (each cloud build has its own signing key), then install again.
- App Lock asks to show notifications so it can tell you when time is up. Saying no doesn't affect blocking.

### Build the APK yourself

The APK is built automatically by GitHub Actions (`.github/workflows/android.yml`) whenever the Android app or the shared screen changes. You can also run that build by hand under **Actions → Android APK → Run workflow**.

To build it on your own computer instead:

1. Install [Android Studio](https://developer.android.com/studio).
2. **File → Open** → choose the `android` folder.
3. Wait for Gradle to sync, then **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
4. The APK is at `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the tablet, or connect the tablet with USB debugging on and press **Run**.

The build copies `index.html` into the app, so the website, the browser extension and the Android app always share one screen.

### How the Android app works

| File | What it does |
| --- | --- |
| `MainActivity.java` | Shows the shared App Lock screen from the app's own files, at a private address that only exists inside the app. |
| `AppLockBridge.java` | Answers the screen's requests (list apps, start a lock, check setup), the same requests the Windows helper answers. Only App Lock's own page can reach it: there's no network server, and websites can't talk to it. |
| `BlockerService.java` | The Accessibility service. When a locked app comes to the front, it goes to the home screen and shows the locked screen. It only reads the app's package name, never what's on screen. |
| `BlockedActivity.java` | The "this app is locked" screen with the countdown. |
| `LockStore.java` | Saves the lock on the tablet. |
| `UnlockReceiver.java` | The "Time is up" notification. |

## Features

- Pick from popular apps (Discord, Steam, Roblox, Spotify, Chrome and more), apps you have open right now, or any app by name
- Quick time buttons from 15 minutes to 3 hours, or set exact hours and minutes
- A countdown dial that shrinks as time passes
- Keeps running after you close the browser tab
- Pop-up when time is up
- Refuses to lock core Windows programs (File Explorer, Task Manager and similar)

## How it works

| File | What it does |
| --- | --- |
| `index.html` | The whole App Lock screen in one file (design, layout and code). It's the website on GitHub Pages, is served by the helper at `http://localhost:8765`, and is also what the extension and the Android app show. |
| `extension/` | The Chrome/Edge extension. Its pop-up shows `index.html` from the helper on your PC. |
| `android/` | The Android app (see **Android tablets and phones** above). |
| `AppLockServer.ps1` | The helper. It runs hidden in the background and closes locked apps every second until the timer ends. |
| `Install.ps1` | Makes the helper start when you sign in, starts it now, and opens App Lock. |
| `AppLock.ps1` | An alternative version with its own window instead of a browser page. Run it with `powershell -ExecutionPolicy Bypass -File .\AppLock.ps1`. |

The helper only listens on your own PC and only accepts requests from the App Lock page, so other websites can't control it.

## Uninstall

Press <kbd>Win</kbd>+<kbd>R</kbd>, type `shell:startup`, press Enter, and delete **App Lock helper**. Then restart your PC, or end **Windows PowerShell** in Task Manager.

## Limits

- The lock ends if you restart or log out, or if you end **Windows PowerShell** in Task Manager.
- If you lock the browser you're using (Edge or Chrome), the App Lock page closes too, but the lock keeps running. Open App Lock in the other browser to see the timer.
- On computers, Windows only. For Android, see the Android section above.
