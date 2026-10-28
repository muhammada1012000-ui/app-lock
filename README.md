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
| `index.html` | The page you see. It's hosted on GitHub Pages and also served by the helper at `http://localhost:8765`. |
| `AppLockServer.ps1` | The helper. It runs hidden in the background and closes locked apps every second until the timer ends. |
| `Install.ps1` | Makes the helper start when you sign in, starts it now, and opens App Lock. |
| `AppLock.ps1` | An alternative version with its own window instead of a browser page. Run it with `powershell -ExecutionPolicy Bypass -File .\AppLock.ps1`. |

The helper only listens on your own PC and only accepts requests from the App Lock page, so other websites can't control it.

## Uninstall

Press <kbd>Win</kbd>+<kbd>R</kbd>, type `shell:startup`, press Enter, and delete **App Lock helper**. Then restart your PC, or end **Windows PowerShell** in Task Manager.

## Limits

- The lock ends if you restart or log out, or if you end **Windows PowerShell** in Task Manager.
- If you lock the browser you're using (Edge or Chrome), the App Lock page closes too, but the lock keeps running. Open App Lock in the other browser to see the timer.
- Windows only.
