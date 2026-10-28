# App Lock - pick apps, set a timer, and those apps get closed until time is up.
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# Friendly name -> process name (without .exe)
$common = [ordered]@{
    'Discord'            = 'Discord'
    'Steam'              = 'steam'
    'Roblox'             = 'RobloxPlayerBeta'
    'Spotify'            = 'Spotify'
    'WhatsApp'           = 'WhatsApp'
    'Telegram'           = 'Telegram'
    'Google Chrome'      = 'chrome'
    'Firefox'            = 'firefox'
    'Microsoft Edge'     = 'msedge'
    'Epic Games'         = 'EpicGamesLauncher'
    'Minecraft Launcher' = 'MinecraftLauncher'
    'Valorant / Riot'    = 'RiotClientServices'
    'Fortnite'           = 'FortniteClient-Win64-Shipping'
    'Xbox app'           = 'XboxPcApp'
    'Microsoft Teams'    = 'ms-teams'
    'Slack'              = 'slack'
}
# Never allow locking these, or Windows itself stops working
$protected = @('explorer','powershell','pwsh','svchost','csrss','winlogon','wininit','dwm','lsass','services','smss','System','Taskmgr','ShellExperienceHost','StartMenuExperienceHost','SearchHost','sihost','ctfmon')

$script:map    = @{}      # list text -> process name
$script:locked = $false
$script:end    = $null
$script:procs  = @()

function Add-AppItem([string]$label, [string]$proc, [bool]$checked = $false) {
    $text = "$label  ($proc.exe)"
    if ($script:map.ContainsKey($text)) { return }
    $script:map[$text] = $proc
    [void]$list.Items.Add($text, $checked)
}

$font      = New-Object Drawing.Font('Segoe UI', 10)
$fontBold  = New-Object Drawing.Font('Segoe UI Semibold', 11)
$fontClock = New-Object Drawing.Font('Consolas', 30, [Drawing.FontStyle]::Bold)

$form = New-Object Windows.Forms.Form
$form.Text = 'App Lock'
$form.ClientSize = New-Object Drawing.Size(420, 610)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false
$form.Font = $font
$form.BackColor = [Drawing.Color]::FromArgb(245, 246, 250)

$lblApps = New-Object Windows.Forms.Label
$lblApps.Text = '1. Tick the apps to lock'
$lblApps.Font = $fontBold
$lblApps.Location = '16,14'; $lblApps.AutoSize = $true
$form.Controls.Add($lblApps)

$list = New-Object Windows.Forms.CheckedListBox
$list.Location = '16,42'; $list.Size = '388,250'
$list.CheckOnClick = $true
$form.Controls.Add($list)

$txtCustom = New-Object Windows.Forms.TextBox
$txtCustom.Location = '16,302'; $txtCustom.Size = '270,26'
$form.Controls.Add($txtCustom)

$btnAdd = New-Object Windows.Forms.Button
$btnAdd.Text = 'Add app'
$btnAdd.Location = '294,300'; $btnAdd.Size = '110,30'
$form.Controls.Add($btnAdd)

$lblHint = New-Object Windows.Forms.Label
$lblHint.Text = 'Not listed? Open the app, then click Refresh. Or type its name from Task Manager > Details (without .exe).'
$lblHint.ForeColor = [Drawing.Color]::DimGray
$lblHint.Location = '16,334'; $lblHint.Size = '300,36'
$lblHint.Font = New-Object Drawing.Font('Segoe UI', 8.5)
$form.Controls.Add($lblHint)

$btnRefresh = New-Object Windows.Forms.Button
$btnRefresh.Text = 'Refresh'
$btnRefresh.Location = '324,336'; $btnRefresh.Size = '80,28'
$form.Controls.Add($btnRefresh)

$lblTime = New-Object Windows.Forms.Label
$lblTime.Text = '2. Set the timer'
$lblTime.Font = $fontBold
$lblTime.Location = '16,380'; $lblTime.AutoSize = $true
$form.Controls.Add($lblTime)

$lblH = New-Object Windows.Forms.Label
$lblH.Text = 'Hours'; $lblH.Location = '16,414'; $lblH.AutoSize = $true
$form.Controls.Add($lblH)
$numH = New-Object Windows.Forms.NumericUpDown
$numH.Location = '70,411'; $numH.Size = '60,26'; $numH.Maximum = 23; $numH.Value = 0
$form.Controls.Add($numH)

$lblM = New-Object Windows.Forms.Label
$lblM.Text = 'Minutes'; $lblM.Location = '150,414'; $lblM.AutoSize = $true
$form.Controls.Add($lblM)
$numM = New-Object Windows.Forms.NumericUpDown
$numM.Location = '215,411'; $numM.Size = '60,26'; $numM.Maximum = 59; $numM.Value = 45
$form.Controls.Add($numM)

$btnStart = New-Object Windows.Forms.Button
$btnStart.Text = 'Start lock'
$btnStart.Font = $fontBold
$btnStart.Location = '16,452'; $btnStart.Size = '388,44'
$btnStart.BackColor = [Drawing.Color]::FromArgb(181, 117, 26)
$btnStart.ForeColor = [Drawing.Color]::White
$btnStart.FlatStyle = 'Flat'
$form.Controls.Add($btnStart)

$lblClock = New-Object Windows.Forms.Label
$lblClock.Text = '0:45:00'
$lblClock.Font = $fontClock
$lblClock.TextAlign = 'MiddleCenter'
$lblClock.Location = '16,504'; $lblClock.Size = '388,52'
$form.Controls.Add($lblClock)

$lblStatus = New-Object Windows.Forms.Label
$lblStatus.Text = 'Not locked.'
$lblStatus.TextAlign = 'MiddleCenter'
$lblStatus.ForeColor = [Drawing.Color]::DimGray
$lblStatus.Location = '16,558'; $lblStatus.Size = '388,44'
$form.Controls.Add($lblStatus)

function Fill-List {
    $checkedNow = @($list.CheckedItems | ForEach-Object { $script:map[$_] })
    $list.Items.Clear(); $script:map = @{}
    foreach ($k in $common.Keys) { Add-AppItem $k $common[$k] ($checkedNow -contains $common[$k]) }
    # Apps that are open right now with a window
    Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $protected -notcontains $_.ProcessName } |
        Sort-Object ProcessName -Unique | ForEach-Object {
            if ($common.Values -notcontains $_.ProcessName) {
                $name = if ($_.MainWindowTitle) { $_.Description } else { $null }
                if (-not $name) { $name = $_.ProcessName }
                Add-AppItem $name $_.ProcessName ($checkedNow -contains $_.ProcessName)
            }
        }
}

function Show-Preview {
    if (-not $script:locked) {
        $lblClock.Text = '{0}:{1:00}:00' -f [int]$numH.Value, [int]$numM.Value
    }
}

function Set-Editing([bool]$on) {
    foreach ($c in @($list, $txtCustom, $btnAdd, $btnRefresh, $numH, $numM, $btnStart)) { $c.Enabled = $on }
}

function Kill-Locked {
    Get-Process -Name $script:procs -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

$timer = New-Object Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
    $left = $script:end - (Get-Date)
    if ($left.TotalSeconds -le 0) {
        $timer.Stop()
        $script:locked = $false
        Set-Editing $true
        $lblClock.Text = 'Unlocked'
        $lblStatus.Text = 'Time is up. Your apps are free again.'
        $form.Activate()
        [void][Windows.Forms.MessageBox]::Show('Time is up. Your apps are unlocked.', 'App Lock')
        Show-Preview
        return
    }
    Kill-Locked
    $lblClock.Text = '{0}:{1:00}:{2:00}' -f [int][math]::Floor($left.TotalHours), $left.Minutes, $left.Seconds
})

$btnAdd.Add_Click({
    $name = $txtCustom.Text.Trim() -replace '\.exe$', ''
    if (-not $name) { return }
    if ($protected -contains $name) {
        [void][Windows.Forms.MessageBox]::Show("$name is part of Windows and can't be locked.", 'App Lock')
        return
    }
    Add-AppItem $name $name $true
    $txtCustom.Clear()
})
$txtCustom.Add_KeyDown({ if ($_.KeyCode -eq 'Enter') { $btnAdd.PerformClick(); $_.SuppressKeyPress = $true } })
$btnRefresh.Add_Click({ Fill-List })
$numH.Add_ValueChanged({ Show-Preview })
$numM.Add_ValueChanged({ Show-Preview })

$btnStart.Add_Click({
    $script:procs = @($list.CheckedItems | ForEach-Object { $script:map[$_] })
    $mins = [int]$numH.Value * 60 + [int]$numM.Value
    if ($script:procs.Count -eq 0) { [void][Windows.Forms.MessageBox]::Show('Tick at least one app first.', 'App Lock'); return }
    if ($mins -le 0) { [void][Windows.Forms.MessageBox]::Show('Set a time above zero.', 'App Lock'); return }
    $names = ($list.CheckedItems | ForEach-Object { ($_ -split '  \(')[0] }) -join ', '
    $answer = [Windows.Forms.MessageBox]::Show(
        "Lock $names for $mins minutes?`n`nOpen work in these apps will be closed now, and you can't stop the lock early from this window.",
        'App Lock', 'OKCancel', 'Warning')
    if ($answer -ne 'OK') { return }
    $script:end = (Get-Date).AddMinutes($mins)
    $script:locked = $true
    Set-Editing $false
    $lblStatus.Text = "Locked: $names`nUnlocks at $($script:end.ToString('h:mm tt'))"
    Kill-Locked
    $timer.Start()
})

# While locked, closing the window just minimizes it so the lock keeps going
$form.Add_FormClosing({
    if ($script:locked) {
        $_.Cancel = $true
        $form.WindowState = 'Minimized'
    }
})

Fill-List
Show-Preview
[void]$form.ShowDialog()
