# Summer Film Data

This directory contains all data, scripts, and documentation for the summer film treatment.

## Structure

```
data/summer/
├── treatment-versions/      # Archived treatment versions
│   ├── notes/              # Change notes for each version
│   └── treatment-v*.md     # Version archives
├── scripts/                # Utility scripts
│   ├── create-new-version.sh
│   ├── parse-treatment.js
│   └── version-control.js
├── docs/                   # Documentation
│   ├── PUBLISHING.md
│   ├── QUICK-START.md
│   ├── README-PIPELINE.md
│   └── VERSION_CONTROL.md
└── original-treatment.md   # Original treatment file
```

## Working Files

- **Edit:** `pages/summer/treatment.md` (working file)
- **Update:** Run `node update-treatment.js` from project root
- **View:** `pages/summer/storybook.html` (HTML viewer)

## Notes Location

Change notes are automatically generated in:
`data/summer/treatment-versions/notes/`

Each note file shows what changed between versions.

