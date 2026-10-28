# App Lock (Edge version) - a tiny helper that runs on this PC only.
# It shows the App Lock page in Edge at http://localhost:8765 and closes locked apps until the timer ends.
param([switch]$NoBrowser)

$port = 8765
$url  = "http://localhost:$port/"
$root = Split-Path -Parent $PSCommandPath

# Never allow locking these, or Windows itself stops working
$protected = @('explorer','powershell','pwsh','svchost','csrss','winlogon','wininit','dwm','lsass','services','smss','System','Idle','Taskmgr','ShellExperienceHost','StartMenuExperienceHost','SearchHost','sihost','ctfmon','conhost')

function Open-Page {
    if ($NoBrowser) { return }
    try { Start-Process 'msedge.exe' $url -ErrorAction Stop } catch { Start-Process "microsoft-edge:$url" }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
try { $listener.Start() } catch {
    # Already running: just show the page
    Open-Page
    exit
}
Open-Page

$S = @{ locked = $false; end = [datetime]::MinValue; procs = @(); names = @(); lastHit = Get-Date }

function Send($ctx, [int]$code, [string]$type, [string]$body) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($body)
    $ctx.Response.StatusCode = $code
    $ctx.Response.ContentType = $type
    $ctx.Response.Headers.Add('Cache-Control', 'no-store')
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
}

function Send-Json($ctx, [int]$code, $obj) { Send $ctx $code 'application/json; charset=utf-8' (ConvertTo-Json -InputObject $obj -Depth 4 -Compress) }

function Get-RunningApps {
    @(Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $protected -notcontains $_.ProcessName } |
        Sort-Object ProcessName -Unique | ForEach-Object {
            $n = $_.Description; if (-not $n) { $n = $_.ProcessName }
            @{ n = $n; p = $_.ProcessName }
        })
}

function Get-State {
    $endMs = 0
    if ($S.locked) { $endMs = [int64]($S.end.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds }
    @{ locked = $S.locked; end = $endMs; apps = @($S.names) }
}

function Enforce {
    if (-not $S.locked) { return }
    if ((Get-Date) -ge $S.end) {
        $S.locked = $false
        Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-Command',
            "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Time is up. Your apps are unlocked.', 'App Lock') | Out-Null"
        return
    }
    Get-Process -Name $S.procs -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Handle($ctx) {
    $req  = $ctx.Request
    $path = $req.Url.AbsolutePath

    if ($req.HttpMethod -eq 'GET' -and ($path -eq '/' -or $path -eq '/index.html')) {
        Send $ctx 200 'text/html; charset=utf-8' ([IO.File]::ReadAllText((Join-Path $root 'index.html')))
        return
    }

    # API calls must come from the App Lock page itself, not from other websites
    if ($path -like '/api/*') {
        $origin = $req.Headers['Origin']
        if ($req.Headers['X-AppLock'] -ne '1' -or ($origin -and $origin -ne "http://localhost:$port")) {
            Send-Json $ctx 403 @{ error = 'Not allowed.' }; return
        }
    }

    if ($path -eq '/api/state') {
        Send-Json $ctx 200 (Get-State); return
    }
    if ($path -eq '/api/running') {
        Send-Json $ctx 200 @{ apps = (Get-RunningApps) }; return
    }
    if ($path -eq '/api/start' -and $req.HttpMethod -eq 'POST') {
        if ($S.locked) { Send-Json $ctx 409 @{ error = 'A lock is already running.' }; return }
        $body = (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd() | ConvertFrom-Json
        $mins = [int]$body.minutes
        $apps = @($body.apps | Where-Object { $_.p -match '^[A-Za-z0-9._ -]+$' -and $protected -notcontains $_.p })
        if ($apps.Count -eq 0) { Send-Json $ctx 400 @{ error = 'Pick at least one app.' }; return }
        if ($mins -lt 1 -or $mins -gt 1439) { Send-Json $ctx 400 @{ error = 'Set a time between 1 minute and 23 hours 59 minutes.' }; return }
        $S.procs  = @($apps | ForEach-Object { $_.p })
        $S.names  = @($apps | ForEach-Object { $_.n })
        $S.end    = (Get-Date).AddMinutes($mins)
        $S.locked = $true
        Enforce
        Send-Json $ctx 200 (Get-State); return
    }
    Send-Json $ctx 404 @{ error = 'Not found.' }
}

while ($true) {
    $task = $listener.GetContextAsync()
    while (-not $task.Wait(1000)) {
        Enforce
        # Shut down quietly when nothing is locked and the page has been closed for a while
        if (-not $S.locked -and ((Get-Date) - $S.lastHit).TotalMinutes -gt 10) { $listener.Stop(); exit }
    }
    $ctx = $task.Result
    $S.lastHit = Get-Date
    try { Handle $ctx } catch { try { Send-Json $ctx 500 @{ error = $_.Exception.Message } } catch {} }
}
