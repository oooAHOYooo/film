# Treatment Version Notes

This directory contains automatically generated notes for each treatment version update.

## What's in Each Note File?

Each note file (e.g., `notes-cred16H.md`) contains:

### 📊 Summary
- Word count changes
- Lines added/deleted/changed

### ➕ Additions
- New content that was added
- Line numbers for reference

### ➖ Deletions
- Content that was removed
- Line numbers for reference

### 🔄 Changes
- Modified lines showing old vs new
- Line numbers for reference

### 💡 Suggestions for Next Steps
- Automated suggestions based on content analysis:
  - Spellcheck recommendations
  - Structure checks (ACT count, duration markers)
  - Dialogue consistency
  - Pacing considerations
  - Word repetition detection

### 📝 Full Diff
- Complete line-by-line diff (collapsible)

## How It Works

When you run `update-treatment`, the script:
1. Compares the current version with the previous version
2. Generates a detailed notes file
3. Saves it to this directory
4. Includes it in git commits

## Viewing Notes

All notes are markdown files you can:
- View in your editor
- Read in GitHub
- Use for tracking your editing progress

## Example

After running `update-treatment`, check:
```
treatment-versions/notes/notes-cred16H.md
```

This shows you exactly what changed from cred16H to cred16I, plus suggestions for what to work on next!

