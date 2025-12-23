# Update Treatment - Simple Command

## Usage

From anywhere in your project:

```bash
# Either of these work:
node update-treatment
./update-treatment
```

That's it! The script automatically:
- ✅ Archives current version
- ✅ Auto-increments version (cred16F → cred16G → cred16H)
- ✅ Updates treatment.md header
- ✅ Updates storybook.html
- ✅ Commits to git
- ✅ Pushes to remote

## Workflow

1. **Edit** `pages/summer/treatment.md`
2. **Save** the file
3. **Run** `update-treatment`
4. **Done!** ✅

## What Gets Auto-Incremented

- **Cred version:** `cred16F` → `cred16G` → `cred16H` → `cred17` → etc.
- **File version:** `1.1` → `1.2` → `1.3` → etc.
- **Date:** Automatically set to today

## Options

```bash
update-treatment              # Normal (commits & pushes)
update-treatment --no-git     # Skip git operations
update-treatment --no-push    # Commit but don't push
```

## Manual Override

If you want to specify a specific cred version:

```bash
cd pages/summer
./update-treat.js cred16Z
```

But usually you don't need to - just run `update-treatment` and it auto-increments!

