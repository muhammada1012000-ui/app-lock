# Creates an "App Lock" shortcut on your desktop that opens App Lock in Microsoft Edge.
$here    = Split-Path -Parent $PSCommandPath
$server  = Join-Path $here 'AppLockServer.ps1'
$desktop = [Environment]::GetFolderPath('Desktop')

$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $desktop 'App Lock.lnk'))
$lnk.TargetPath       = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$lnk.Arguments        = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$server`""
$lnk.IconLocation     = "$env:WINDIR\System32\imageres.dll,54"
$lnk.WorkingDirectory = $here
$lnk.Save()

Write-Host 'Done. Double-click "App Lock" on your desktop to open it in Edge.' -ForegroundColor Green
