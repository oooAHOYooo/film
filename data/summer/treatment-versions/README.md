# Treatment Version Control

This directory contains versioned copies of the treatment document.

**Location:** `data/summer/treatment-versions/`

## How to Create a New Version

1. Edit `pages/summer/treatment.md` with your changes
2. Run `node update-treatment.js` (automatically handles versioning)
3. The script will:
   - Archive current version here
   - Generate notes in `notes/` subdirectory
   - Update version numbers automatically

## File Naming Convention

- Format: `treatment-v{VERSION}-{DATE}-{STATUS}.md`
- Example: `treatment-v1.0-2025-12-22-cred15e.md`

## Directory Structure

```
data/summer/
├── treatment-versions/          # Archived versions
│   ├── notes/                   # Change notes for each version
│   └── treatment-v*.md          # Version archives
├── scripts/                     # Utility scripts
├── docs/                        # Documentation
└── original-treatment.md        # Original treatment
```

