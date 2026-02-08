# Complete Treatment Publishing Pipeline

## 🎯 The Simple Workflow

```
Edit treatment.md → Run script → Done!
```

## 📝 Step-by-Step

### 1. Edit the Treatment
Open and edit: **`pages/summer/treatment.md`**

Make your spellchecks, rephrasing, and edits directly in this file.

### 2. Publish
Run the publishing script:

```bash
cd pages/summer
./update-treat cred16G
```

### 3. What Happens Automatically

The script:
- ✅ Archives your current version (cred16F → `treatment-versions/`)
- ✅ Updates `treatment.md` header (version, date, status)
- ✅ Parses treatment into ACT structure
- ✅ Updates `storybook.html` with new version
- ✅ Commits to git: `Update treatment to cred16G`
- ✅ Pushes to remote

### 4. View Results
Open `storybook.html` in your browser to see:
- **Latest version** (cred16G) - active by default
- **Previous 3 versions** - available via version selector

## 📁 File Structure

```
pages/summer/
├── treatment.md              ← EDIT THIS FILE
├── storybook.html            ← Auto-updated by script
├── update-treat.js           ← The automation script
├── treatment-versions/       ← Auto-archived versions
│   ├── treatment-v1.1-2025-01-24-cred16F.md
│   ├── treatment-v1.0-2025-12-22-cred15e.md
│   └── ...
└── PUBLISHING.md             ← Full documentation
```

## 🚀 Quick Commands

```bash
# Publish new version (with git commit & push)
./update-treat cred16G

# Publish without git
./update-treat cred16G --no-git

# Publish with commit but no push
./update-treat cred16G --no-push
```

## 🔄 Version Flow

```
cred16F (current)
  ↓
Edit treatment.md
  ↓
./update-treat cred16G
  ↓
cred16G (new current)
  ↓
cred16F (archived)
```

## 💡 Tips

- **Always edit `treatment.md`** - it's the source of truth
- **Run the script after editing** - it handles everything else
- **Check storybook.html** - verify your changes appear correctly
- **Use version selector** - compare with previous versions

## 🐛 Troubleshooting

**Script can't parse treatment?**
- Make sure ACT structure is correct: `## ACT I`, `## ACT II`, etc.
- Check that each ACT has: `### Title`, `**Duration:**`, and content

**Git operations fail?**
- Use `--no-git` flag if not in a git repo
- Or commit manually: `git add . && git commit -m "Update treatment"`

**Storybook not showing changes?**
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check that `storybook.html` was updated (look at the meta line)

## 📚 More Info

See `PUBLISHING.md` for detailed documentation.

