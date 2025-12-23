# Treatment Version Control Guide

## Overview

The treatment document (`treatment.md`) uses a simple version control system to track changes and maintain a history of edits.

## File Structure

```
pages/summer/
├── treatment.md                    # Main editable treatment (CURRENT VERSION)
├── original-treatment.md           # Original AG text version
├── treatment-versions/             # Version history directory
│   ├── README.md
│   └── treatment-v1.0-2025-01-24.md
├── version-control.js              # Version control script
└── VERSION_CONTROL.md             # This file
```

## Workflow

### 1. Editing the Treatment

Edit `treatment.md` directly. The file uses markdown format for easy editing.

**Important:** Before making major changes, create a version backup first.

### 2. Creating a New Version

**Option A: Using the Script (Recommended)**

```bash
cd pages/summer
node version-control.js create
```

**Option B: Manual Method**

1. Update the version number in `treatment.md` header:
   ```markdown
   **Version:** 1.1
   **Last Updated:** 2025-01-25
   ```

2. Copy the file to versions directory:
   ```bash
   cp treatment.md treatment-versions/treatment-v1.1-2025-01-25.md
   ```

3. Add entry to Version History table in `treatment.md`

### 3. Viewing Versions

**List all versions:**
```bash
node version-control.js list
```

**View a specific version:**
```bash
node version-control.js show 1.0
```

## Version Numbering

- **Major.Minor** format (e.g., 1.0, 1.1, 2.0)
- Increment **minor** for small edits, additions, refinements
- Increment **major** for significant structural changes, new acts, major rewrites

## Version History Table

Keep the Version History table in `treatment.md` updated:

```markdown
## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2025-01-25 | Updated ACT II dialogue | AG |
| 1.0 | 2025-01-24 | Initial enhanced version | AG |
```

## Best Practices

1. **Create versions before major edits** - Don't lose work
2. **Use descriptive change notes** - Help track what changed
3. **Keep versions organized** - Use consistent naming
4. **Update the history table** - Maintain clear documentation
5. **Regular backups** - Create versions periodically, not just for major changes

## Integration with Storybook

The storybook HTML file (`storybook.html`) reads from the treatment data. After editing `treatment.md`:

1. Update the `treatmentData` array in `storybook.html` if needed
2. Or create a script to auto-sync (future enhancement)

## Quick Reference

```bash
# Create new version
node version-control.js create

# List all versions  
node version-control.js list

# View version 1.0
node version-control.js show 1.0
```

