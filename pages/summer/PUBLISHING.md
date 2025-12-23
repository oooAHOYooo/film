# Treatment Publishing Pipeline

## Quick Start

**Edit → Publish → Done!**

1. Edit `treatment.md` with your spellchecks and rephrasing
2. Run: `./update-treat cred16G`
3. That's it! The script handles everything else.

## What the Script Does

The `update-treat.js` script automates the entire publishing workflow:

1. ✅ **Archives** the current version to `treatment-versions/`
2. ✅ **Updates** `treatment.md` header (version, date, status)
3. ✅ **Updates** `storybook.html` with the new version
4. ✅ **Commits** changes to git
5. ✅ **Pushes** to remote (optional)

## Usage

```bash
cd pages/summer

# Basic usage (commits and pushes)
./update-treat cred16G

# Skip git operations
./update-treat cred16G --no-git

# Commit but don't push
./update-treat cred16G --no-push
```

## Workflow Example

```bash
# 1. Edit the treatment
# Open treatment.md in your editor and make changes

# 2. Publish the new version
./update-treat cred16G

# Output:
# 🚀 Publishing treatment: cred16G
# Current: v1.1 (cred16F)
# New: v1.2 (cred16G)
# ✅ Archived to: treatment-v1.1-2025-01-24-cred16F.md
# ✅ Updated treatment.md header
# ✅ Updated storybook.html
# ✅ Committed: Update treatment to cred16G
# ✅ Pushed to remote
# ✅ Done! Treatment cred16G is now live in the storybook.
```

## File Locations

- **Edit here:** `pages/summer/treatment.md` ← This is your working file
- **View here:** `pages/summer/storybook.html` ← Auto-updated by script
- **Archives:** `pages/summer/treatment-versions/` ← Auto-archived by script

## Storybook Versions

The storybook automatically shows:
- **Latest version** (active by default)
- **Previous 3 versions** (available via version selector)

All versions are accessible through the version selector buttons in the storybook.

## Version Naming

- **Cred versions:** `cred16F`, `cred16G`, `cred17`, etc.
- **File versions:** Auto-incremented (1.1 → 1.2 → 1.3)
- **Archive format:** `treatment-v{VERSION}-{DATE}-{STATUS}.md`

## Git Integration

The script automatically:
- Stages: `treatment.md`, `storybook.html`, and `treatment-versions/`
- Commits with message: `Update treatment to {cred-version}`
- Pushes to remote (unless `--no-push` flag is used)

## Troubleshooting

**Script fails to parse treatment?**
- Make sure `treatment.md` has proper ACT structure with `## ACT I`, `## ACT II`, etc.

**Git operations fail?**
- Use `--no-git` flag if you're not in a git repo
- Or commit manually after running the script

**Storybook not updating?**
- Check browser cache (hard refresh: Cmd+Shift+R)
- Verify `storybook.html` was updated (check the meta line)

## Manual Override

If you need to manually update something:

1. **Edit treatment.md** - Make your changes
2. **Update header manually:**
   ```markdown
   **Version:** 1.2
   **Last Updated:** 2025-01-24
   **Status:** cred16G
   ```
3. **Archive manually:**
   ```bash
   cp treatment.md treatment-versions/treatment-v1.1-2025-01-24-cred16F.md
   ```
4. **Update storybook manually** - Edit `storybook.html` directly

But really, just use the script! 🚀

