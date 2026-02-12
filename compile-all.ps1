# Run compile-all.js using Node even when node isn't on PATH
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:APPDATA\nvm\current\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
)
$node = $null
foreach ($p in $nodePaths) {
    if ($p -and (Test-Path -LiteralPath $p -ErrorAction SilentlyContinue)) {
        $node = $p
        break
    }
}
if (-not $node) {
    Write-Error "Node.js not found. Install from https://nodejs.org or add it to PATH."
    exit 1
}
& $node $PSScriptRoot\compile-all.js @args
