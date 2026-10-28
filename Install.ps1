# Sets up App Lock's helper to start hidden every time you sign in to Windows, and starts it now.
# Then open App Lock in Edge or Chrome: https://muhammada1012000-ui.github.io/app-lock/
$here    = Split-Path -Parent $PSCommandPath
$server  = Join-Path $here 'AppLockServer.ps1'
$startup = [Environment]::GetFolderPath('Startup')
$helperArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$server`" -NoBrowser"

$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $startup 'App Lock helper.lnk'))
$lnk.TargetPath       = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$lnk.Arguments        = $helperArgs
$lnk.WorkingDirectory = $here
$lnk.Save()

# Remove the old desktop shortcut from earlier versions
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'App Lock.lnk') -ErrorAction SilentlyContinue

Start-Process powershell -WindowStyle Hidden -ArgumentList $helperArgs
# Opens in your default browser (Edge, Chrome, ...)
Start-Process 'https://muhammada1012000-ui.github.io/app-lock/'
Write-Host 'Done. App Lock is open in your browser, and its helper now starts by itself when you sign in.' -ForegroundColor Green
