# Script to batch-add scene IDs (sXX.Y) to sluglines
$scenesDir = "c:\Users\agonzalez7\film\pages\summer\script-system\scenes"
$files = Get-ChildItem -Path "$scenesDir\s*.md"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $baseName = $file.BaseName # e.g. s01
    $content = Get-Content $file.FullName
    $newContent = @()
    $counter = 1
    
    foreach ($line in $content) {
        # Match INT. or EXT. at start of line, possibly with trailing whitespace
        if ($line -match "^(INT\.|EXT\.)") {
            # Check if it already has an ID like (s01.1)
            if ($line -notmatch "\((s\d+\.\d+)\)$") {
                $id = "$baseName.$counter"
                $line = "$($line.TrimEnd()) ($id)"
                $counter++
            } else {
                # Already has an ID, just update the counter to stay in sync if we're re-running
                $counter++
            }
        }
        $newContent += $line
    }
    
    $newContent | Set-Content $file.FullName
}

Write-Host "Done! Processed $($files.Count) files."
