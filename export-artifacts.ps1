$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$exportDir = Join-Path $scriptDir "summer"

# Create format for today's date
$today = Get-Date -Format "yyyy-MM-dd"
$targetDir = Join-Path $exportDir $today

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Created export folder: $targetDir" -ForegroundColor Green
} else {
    Write-Host "Export folder already exists: $targetDir" -ForegroundColor Yellow
}

$copiedCount = 0

# --- 1. Antigravity / Gemini Artifacts ---
$geminiDir = "C:\Users\agonzalez7\.gemini\antigravity\brain"
if (Test-Path $geminiDir) {
    Write-Host "`nScanning Gemini/Antigravity artifacts for today..." -ForegroundColor Cyan
    # Get all .md files created or modified today
    $geminiFiles = Get-ChildItem -Path $geminiDir -Filter "*.md" -Recurse | 
        Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date -and $_.Name -notmatch "metadata.json" }
    
    foreach ($file in $geminiFiles) {
        # Combine the folder ID prefix and file name so we don't overwrite files with the same name from different tasks
        $folderId = $file.Directory.Name.Substring(0, 8) # Using first 8 chars of the UUID folder
        $fileName = "Gemini_${folderId}_$($file.Name)"
        $destPath = Join-Path $targetDir $fileName
        
        Copy-Item -Path $file.FullName -Destination $destPath -Force
        Write-Host "  Copied -> $fileName"
        $copiedCount++
    }
} else {
    Write-Host "Gemini directory not found at $geminiDir" -ForegroundColor DarkGray
}

# --- 2. Catch generic project root artifacts ---
# Sometimes GPT tools create standalone .md files in the root folder during generating sessions.
Write-Host "`nScanning project root for newly created markdown artifacts..." -ForegroundColor Cyan
$rootFiles = Get-ChildItem -Path $scriptDir -Filter "*.md" -Depth 0 |
    Where-Object {
        $_.LastWriteTime.Date -eq (Get-Date).Date -and
        $_.Name -notin @("README.md", "QUICK-COMMAND.md")
    }

foreach ($file in $rootFiles) {
    $destPath = Join-Path $targetDir ("Root_" + $file.Name)
    Copy-Item -Path $file.FullName -Destination $destPath -Force
    Write-Host "  Copied -> Root_$($file.Name)"
    $copiedCount++
}

# --- 3. Downloads Folder (Claude/ChatGPT exports) ---
Write-Host "`nScanning Downloads folder for any saved Claude/ChatGPT chats..." -ForegroundColor Cyan
$downloadsDir = "C:\Users\agonzalez7\Downloads"
if (Test-Path $downloadsDir) {
    $downloadedFiles = Get-ChildItem -Path $downloadsDir -Recurse -Depth 1 |
        Where-Object {
            $_.LastWriteTime.Date -eq (Get-Date).Date -and 
            ($_.Name -match "Claude" -or $_.Name -match "ChatGPT" -or $_.Name -match "conversation") -and 
            $_.Extension -in @(".md", ".txt", ".json", ".html")
        }
        
    foreach ($file in $downloadedFiles) {
        $destPath = Join-Path $targetDir ("Download_" + $file.Name)
        Copy-Item -Path $file.FullName -Destination $destPath -Force
        Write-Host "  Copied -> Download_$($file.Name)"
        $copiedCount++
    }
}

Write-Host "`n=== Export Complete! ===" -ForegroundColor Green
Write-Host "Successfully copied $copiedCount artifact(s) to $targetDir" -ForegroundColor White
Write-Host "Ready for you to review with fresh eyes." -ForegroundColor White
