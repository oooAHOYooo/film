# Character sheet source files

**Edit the `.md` files in this folder** to change character content, then recompile so the HTML is updated.

**Recompile:** from project root run  
`npm run characters`  
or from this directory:  
`node compile.js`

- `dallas.md` — Dallas
- `dominic.md` — Dominic
- `makayla.md` — Makayla
- `asher.md` — Asher
- `mr-mike.md` — Mr. Mike
- `janice.md` — Janice
- `howie.md` — Howie

Use a `# Name` heading at the top, then bullet points (`-` or `*`). The compile script supports headings, lists, and paragraphs.

## Photo galleries

Add actor photo URLs in `pages/summer/characters/actors.json` and re-run `node compile.js`.

Example:
```
{
  "dallas": [
    { "name": "Actor Name", "role": "Dallas", "url": "https://example.com/photo.jpg" }
  ]
}
```
