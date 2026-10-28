# App Lock

Lock distracting apps on Windows for a set amount of time. Pick the apps, choose how long, and any of those apps closes as soon as it opens until the timer runs out.

App Lock opens in Microsoft Edge at `http://localhost:8765`. Everything runs on your own PC: no install, no account, no internet needed (apart from loading the fonts).

## Features

- Pick from popular apps (Discord, Steam, Roblox, Spotify, Chrome and more), apps you have open right now, or any app by name
- Quick time buttons from 15 minutes to 3 hours, or set exact hours and minutes
- A countdown dial that shrinks as time passes
- Keeps running after you close the browser tab
- Pop-up when time is up
- Refuses to lock core Windows programs (File Explorer, Task Manager and similar)

## Install

1. Download this repository (**Code → Download ZIP**) and unzip it somewhere you'll keep it, for example `C:\Users\<you>\AppLock`.
2. Right-click `Install.ps1` → **Run with PowerShell**. This puts an **App Lock** shortcut on your desktop.
3. Double-click **App Lock** on your desktop. It opens in Edge.

If Windows blocks the script, open PowerShell in the folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\Install.ps1
```

## How it works

A web page can't close other programs, so App Lock has two parts:

| File | What it does |
| --- | --- |
| `AppLockServer.ps1` | A small helper that runs hidden in the background. It serves the page on `localhost:8765` and closes locked apps every second until the timer ends. |
| `index.html` | The page you see in Edge. |
| `Install.ps1` | Creates the desktop shortcut. |
| `AppLock.ps1` | An alternative version with its own window instead of Edge. Run it with `powershell -ExecutionPolicy Bypass -File .\AppLock.ps1`. |

The helper only accepts requests from the App Lock page itself, so other websites can't control it. When nothing is locked and the page has been closed for 10 minutes, it shuts itself off.

## Limits

- The lock ends if you restart or log out, or if you end **Windows PowerShell** in Task Manager.
- If you lock Microsoft Edge, the App Lock page closes too, but the lock keeps running.
- Windows only.
