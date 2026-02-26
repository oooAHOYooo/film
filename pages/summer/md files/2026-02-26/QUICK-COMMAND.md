# Quick Command Reference

## Update Treatment

After editing `pages/summer/treatment.md`, run:

```bash
node update-treatment.js
```

**That's it!** The script will:
- ✅ Archive current version
- ✅ Auto-increment version
- ✅ Generate notes with differences
- ✅ Update storybook
- ✅ Commit and push to git

## Alternative Commands

```bash
# These also work:
./update-treatment          # Bash script version
node update-treatment.js    # Node.js version (RECOMMENDED)
```

## Remember

- **Edit:** `pages/summer/treatment.md`
- **Run:** `node update-treatment.js`
- **Check notes:** `pages/summer/treatment-versions/notes/`

