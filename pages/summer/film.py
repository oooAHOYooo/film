#!/usr/bin/env python3
"""
film.py — Creatures in the Tall Grass CLI
Usage: python film.py <command> [args]
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent
SCENES_DIR = ROOT / "script-system" / "scenes"
MANIFEST = ROOT / "script-system" / "manifest.json"
PRODUCTION_DATA = ROOT / "production-data.json"
CHARS_DIR = ROOT / "characters" / "sheets"
NOTES_DIR = ROOT / "directors-notes" / "notes"
BIBLE_DIR = ROOT / "bible-system" / "content"
SCRIPT_COMPILE = ROOT / "script-system" / "compile.js"
PROD_COMPILE = ROOT / "compile-production.js"

# ── ANSI colors ──────────────────────────────────────────────────────────────

RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
GOLD   = "\033[33m"
CYAN   = "\033[36m"
GREEN  = "\033[32m"
RED    = "\033[31m"
BLUE   = "\033[34m"
NAVY   = "\033[34;1m"
GREY   = "\033[90m"

def bold(s): return f"{BOLD}{s}{RESET}"
def gold(s): return f"{GOLD}{s}{RESET}"
def cyan(s): return f"{CYAN}{s}{RESET}"
def dim(s):  return f"{DIM}{s}{RESET}"
def green(s): return f"{GREEN}{s}{RESET}"
def red(s):  return f"{RED}{s}{RESET}"
def grey(s): return f"{GREY}{s}{RESET}"

# ── Data loaders ─────────────────────────────────────────────────────────────

def load_manifest():
    with open(MANIFEST) as f:
        return json.load(f)

def load_production_data():
    try:
        with open(PRODUCTION_DATA) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def load_scene_content(filename):
    path = SCENES_DIR / filename
    try:
        return path.read_text()
    except FileNotFoundError:
        return f"[Scene file not found: {filename}]"

def get_scene_heading(content):
    m = re.search(r'^(INT\.|EXT\.)\s+(.+?)\s*-\s*(.+)$', content, re.MULTILINE)
    if m:
        return m.group(2).strip(), m.group(3).strip()
    return '', ''

def get_scene_summary(content):
    m = re.search(r'<!--\s*summary:\s*([\s\S]+?)\s*-->', content)
    return m.group(1).strip() if m else ''

def resolve_scene(arg, scenes):
    """Resolve a scene by number (1-28) or id/nickname."""
    try:
        n = int(arg)
        if 1 <= n <= len(scenes):
            return scenes[n - 1], n
    except ValueError:
        pass
    for i, s in enumerate(scenes):
        if s['id'] == arg or s.get('nickname') == arg or s['file'] == arg:
            return s, i + 1
    return None, None

# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_scenes(args):
    """List all scenes grouped by act."""
    scenes = load_manifest()
    current_act = None
    act_labels = {1: "ACT I — Arrival & Discovery", 2: "ACT II — The Creature",
                  3: "ACT III — The Return", 4: "ACT IV — Aftermath"}

    print()
    print(bold(gold("  CREATURES IN THE TALL GRASS")))
    print(dim("  Scene List\n"))

    for i, s in enumerate(scenes):
        n = i + 1
        act = s.get('act', 0)
        if act != current_act:
            current_act = act
            label = act_labels.get(act, f"ACT {act}")
            print(f"\n  {gold(bold(label))}")
            print(f"  {dim('─' * 40)}")

        content = load_scene_content(s['file'])
        summary = get_scene_summary(content)
        title = s.get('title', s['id'])
        num = f"{n:>2}"
        print(f"  {cyan(num)}. {bold(title)}")
        if summary:
            print(f"      {dim(summary)}")
    print()

def cmd_read(args):
    """Read a scene: film.py read <n|id>"""
    if not args:
        print(red("Usage: film.py read <scene_number_or_id>"))
        return
    scenes = load_manifest()
    scene, n = resolve_scene(args[0], scenes)
    if not scene:
        print(red(f"Scene not found: {args[0]}"))
        return

    content = load_scene_content(scene['file'])
    title = scene.get('title', scene['id'])
    act = scene.get('act', 0)
    act_labels = {1: "I", 2: "II", 3: "III", 4: "IV"}
    act_str = f"Act {act_labels.get(act, act)}" if act else ""

    print()
    print(bold(gold(f"  Scene {n}: {title}")))
    if act_str:
        print(dim(f"  {act_str} — {scene.get('actTitle', '')}"))
    print(f"  {dim('─' * 60)}\n")

    # Strip HTML comments, format for terminal
    text = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL).strip()

    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            print()
        elif re.match(r'^(INT\.|EXT\.)', stripped, re.IGNORECASE):
            print(f"  {bold(cyan(stripped))}")
        elif stripped == stripped.upper() and len(stripped) > 1 and len(stripped) < 35 and not stripped.startswith('('):
            # Character name
            print(f"\n  {bold(green(stripped))}")
        elif re.match(r'^\(.+\)$', stripped):
            # Parenthetical
            print(f"    {grey(stripped)}")
        elif re.match(r'^\(action\)$', stripped, re.IGNORECASE):
            print()
        else:
            # Dialogue or action
            prev_is_name = False
            print(f"  {line}")
    print()

def cmd_compile(args):
    """Compile the script using Node.js compilers."""
    print(bold(gold("\n  Compiling...\n")))

    if not SCRIPT_COMPILE.exists():
        print(red(f"  Compile script not found: {SCRIPT_COMPILE}"))
        return

    # Script compiler
    print(f"  {cyan('→')} script-system/compile.js")
    result = subprocess.run(['node', str(SCRIPT_COMPILE)], capture_output=True, text=True, cwd=ROOT)
    if result.returncode == 0:
        for line in result.stdout.strip().split('\n'):
            print(f"    {green('✓')} {line}")
    else:
        print(red(f"    Error: {result.stderr}"))

    # Production compiler
    if PROD_COMPILE.exists():
        print(f"\n  {cyan('→')} compile-production.js")
        result = subprocess.run(['node', str(PROD_COMPILE)], capture_output=True, text=True, cwd=ROOT)
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                print(f"    {green('✓')} {line}")
        else:
            print(red(f"    Error: {result.stderr}"))

    print(f"\n  {green(bold('Done.'))}\n")

def cmd_production(args):
    """Show production breakdown table."""
    scenes = load_manifest()
    prod = load_production_data()

    print()
    print(bold(gold("  PRODUCTION BREAKDOWN")))
    print(dim("  Creatures in the Tall Grass\n"))

    total_days = 0
    total_min = 0
    pickup_count = 0

    current_act = None
    act_labels = {1: "ACT I", 2: "ACT II", 3: "ACT III", 4: "ACT IV"}

    # Header
    print(f"  {bold(cyan('  # │ Scene')):<36} {bold(cyan('Location')):<28} {bold(cyan('Time')):<12} {bold(cyan('Dur')):<7} {bold(cyan('Days')):<6} {bold(cyan('Act'))}")
    print(f"  {'─'*80}")

    for i, s in enumerate(scenes):
        n = i + 1
        act = s.get('act', 0)
        if act != current_act:
            current_act = act
            print(f"\n  {gold(act_labels.get(act, f'ACT {act}'))}")

        content = load_scene_content(s['file'])
        loc, time = get_scene_heading(content)
        d = prod.get(s['id'], {})

        dur = d.get('durationMin')
        days = d.get('shootDays', 0)
        pickup = d.get('pickup', False)

        if not pickup:
            total_days += days or 0
        total_min += dur or 0
        if pickup:
            pickup_count += 1

        title = s.get('title', s['id'])[:22]
        loc_str = (loc or '—')[:22]
        time_str = (time or '—')[:10]
        dur_str = f"{dur}m" if dur else '—'
        days_str = 'pickup' if pickup else (str(days) if days else '—')
        act_str = f"Act {act}" if act else '—'

        print(f"  {cyan(f'{n:>2}')} │ {title:<24} {loc_str:<24} {time_str:<12} {dur_str:<7} {days_str:<8} {grey(act_str)}")

    print(f"\n  {'─'*80}")
    print(f"  {bold('Total:')} {green(str(total_min))} min  ·  {green(str(total_days))} shoot days + {green(str(pickup_count))} pickup scenes")
    print()

def cmd_status(args):
    """Show overall film status."""
    scenes = load_manifest()
    prod = load_production_data()

    acts = {}
    total_min = 0
    total_days = 0
    pickup_count = 0

    for i, s in enumerate(scenes):
        act = s.get('act', 0)
        acts.setdefault(act, {'scenes': 0, 'min': 0})
        acts[act]['scenes'] += 1
        d = prod.get(s['id'], {})
        dur = d.get('durationMin', 0) or 0
        days = d.get('shootDays', 0) or 0
        pickup = d.get('pickup', False)
        acts[act]['min'] += dur
        total_min += dur
        if not pickup:
            total_days += days
        else:
            pickup_count += 1

    print()
    print(bold(gold("  CREATURES IN THE TALL GRASS")))
    print(dim("  Production Status\n"))

    print(f"  {bold('Film:')}       {cyan('Creatures in the Tall Grass')}")
    print(f"  {bold('Studio:')}     Barnacle Films")
    print(f"  {bold('Director:')}   Alex Gonzalez")
    print(f"  {bold('Shoot:')}      June 19 – July 12, 2026 · Branford, CT")
    print(f"  {bold('Camera:')}     RED Komodo 6K / Anamorphic")
    print(f"  {bold('Status:')}     {green('Fully Funded · Greenlit · Pre-Production')}")
    print()

    act_titles = {1: "Arrival & Discovery", 2: "The Creature", 3: "The Return", 4: "Aftermath"}
    act_rnum = {1: "I", 2: "II", 3: "III", 4: "IV"}

    print(f"  {bold(cyan('Act Breakdown'))}")
    print(f"  {'─'*40}")
    for act in sorted(acts):
        a = acts[act]
        title = act_titles.get(act, '')
        rnum = act_rnum.get(act, str(act))
        print(f"  Act {rnum:<4} {title:<22} {a['scenes']} scenes   ~{a['min']} min")

    print(f"  {'─'*40}")
    print(f"  {'Total':<28} {len(scenes)} scenes   ~{total_min} min")
    print(f"  {bold('Shoot Days:')} {green(str(total_days))} + {green(str(pickup_count))} pickup\n")

def cmd_characters(args):
    """Show character list or a specific character sheet."""
    sheets = list(CHARS_DIR.glob('*.md'))

    if args:
        name = args[0].lower()
        match = None
        for s in sheets:
            if s.stem.lower() == name or name in s.stem.lower():
                match = s
                break
        if not match:
            print(red(f"Character not found: {args[0]}"))
            print(f"Available: {', '.join(s.stem for s in sheets)}")
            return

        print()
        print(bold(gold(f"  {match.stem.upper()}")))
        print(dim("  Character Sheet\n"))
        content = match.read_text().strip()
        # Remove title line if it's just # Name
        lines = content.split('\n')
        for line in lines:
            if line.startswith('# '):
                continue
            elif line.startswith('- '):
                print(f"  {cyan('·')} {line[2:]}")
            else:
                print(f"  {line}")
        print()
        return

    print()
    print(bold(gold("  CHARACTERS")))
    print(dim("  Creatures in the Tall Grass\n"))

    char_roles = {
        'dallas': 'Protagonist — Bioacoustics researcher',
        'makayla': 'Dominic\'s daughter — sharp-witted, 22',
        'asher': 'Dominic\'s son — quiet, 14',
        'dominic': 'Dallas\'s brother',
        'janice': 'Dominic\'s wife',
        'howie': 'Neighbor',
        'mr-mike': 'LifeGroup leader',
    }

    for sheet in sorted(sheets):
        name = sheet.stem
        role = char_roles.get(name, '')
        print(f"  {cyan(bold(name.replace('-', ' ').title()))}")
        if role:
            print(f"    {dim(role)}")

    print(f"\n  {dim('Usage: film.py characters <name>')}\n")

def cmd_notes(args):
    """List director's notes or show one."""
    notes = list(NOTES_DIR.glob('*.md'))

    # Also include other note files at directors-notes level
    extra = [
        ROOT / 'directors-notes' / 'other_ideas.md',
        ROOT / 'directors-notes' / 'script_additions.md',
        ROOT / 'directors-notes' / 'script_analysis_notes.md',
    ]
    all_notes = notes + [p for p in extra if p.exists()]

    if args:
        name = args[0].lower()
        match = None
        for n in all_notes:
            if n.stem.lower() == name or name in n.stem.lower():
                match = n
                break
        if not match:
            print(red(f"Note not found: {args[0]}"))
        else:
            print()
            print(bold(gold(f"  {match.stem.replace('-', ' ').replace('_', ' ').title()}")))
            print(dim("  Director's Note\n"))
            print(match.read_text())
        return

    print()
    print(bold(gold("  DIRECTOR'S NOTES")))
    print()
    for n in sorted(all_notes):
        print(f"  {cyan('→')} {n.stem.replace('-', ' ').replace('_', ' ')}")
    print(f"\n  {dim('Usage: film.py notes <name>')}\n")

def cmd_overview(args):
    """Show film overview and synopsis."""
    print()
    print(bold(gold("  CREATURES IN THE TALL GRASS")))
    print(gold(dim("  The marsh answers.\n")))

    print(f"  {bold('Synopsis')}")
    print(f"  {'─'*60}")
    synopsis = (
        "A bioacoustics researcher moves to a coastal Connecticut town\n"
        "for a fresh start, only to pick up a signal from the marshes\n"
        "that shouldn't exist. When he follows the sound into the reeds,\n"
        "he discovers something injured — and something else hunting it.\n"
        "A grounded sci-fi thriller about sound, solitude, and what we\n"
        "find when we finally stop to listen."
    )
    for line in synopsis.split('\n'):
        print(f"  {line}")

    print(f"\n  {bold('Acts')}")
    print(f"  {'─'*60}")
    acts = [
        ("I",   "Arrival & Discovery",  "Dallas picks up anomalous frequencies. He and Makayla track\n  the signal to a geometric clearing in the marsh."),
        ("II",  "The Creature",         "Dallas recovers a frail, glowing alien mimic. Its singing\n  acts as a beacon for something worse."),
        ("III", "The Return",           "Red-Eyes surround the property. The family builds a defensive\n  acoustic perimeter using military-grade speakers."),
        ("IV",  "Aftermath",            "An intense auditory war. Dallas triggers a massive acoustic\n  collision that vaporizes the attacking shadows."),
    ]
    for rnum, title, desc in acts:
        print(f"\n  {bold(cyan(f'Act {rnum}'))} — {gold(title)}")
        for line in desc.split('\n'):
            print(f"  {dim(line)}")

    print(f"\n  {bold('Cast')}")
    print(f"  {'─'*60}")
    cast = [
        ("Dallas Demartini",  "Dallas Demartini"),
        ("Dominic Armaranto", "Matt Grant"),
        ("Makayla Armaranto", "Charollete"),
        ("Asher Armaranto",   "Mac Sheldon"),
        ("Janice Armaranto",  "Michelle Armaranto"),
        ("Mr. Mike",          "Mike"),
    ]
    for role, actor in cast:
        print(f"  {cyan(role):<24} {actor}")

    print(f"\n  {bold('Production')}")
    print(f"  {'─'*60}")
    print(f"  {dim('Shoot:')}   June 19 – July 12, 2026 · Branford, CT")
    print(f"  {dim('Camera:')}  RED Komodo 6K / Anamorphic 6K")
    print(f"  {dim('Runtime:')} ~90 min feature")
    print(f"  {dim('Studio:')}  Barnacle Films — Alex Gonzalez\n")

def cmd_edit(args):
    """Open a scene in $EDITOR."""
    if not args:
        print(red("Usage: film.py edit <scene_number_or_id>"))
        return
    scenes = load_manifest()
    scene, n = resolve_scene(args[0], scenes)
    if not scene:
        print(red(f"Scene not found: {args[0]}"))
        return
    path = SCENES_DIR / scene['file']
    editor = os.environ.get('EDITOR', 'nano')
    print(f"  {cyan('→')} Opening {bold(scene['title'])} in {editor}...")
    subprocess.run([editor, str(path)])

def cmd_search(args):
    """Search all scenes for a term."""
    if not args:
        print(red("Usage: film.py search <term>"))
        return

    term = ' '.join(args).lower()
    scenes = load_manifest()
    found = 0

    print()
    print(bold(gold(f"  Search: \"{term}\"\n")))

    for i, s in enumerate(scenes):
        n = i + 1
        content = load_scene_content(s['file'])
        clean = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

        matches = []
        for j, line in enumerate(clean.split('\n')):
            if term in line.lower():
                matches.append((j + 1, line.strip()))

        if matches:
            found += 1
            title = s.get('title', s['id'])
            print(f"  {cyan(bold(f'Scene {n}: {title}'))}")
            for lineno, line in matches[:3]:
                highlighted = re.sub(re.escape(term), lambda m: gold(bold(m.group())), line, flags=re.IGNORECASE)
                print(f"    {grey(f'L{lineno}:')} {highlighted}")
            if len(matches) > 3:
                print(f"    {dim(f'... +{len(matches)-3} more matches')}")
            print()

    if found == 0:
        print(f"  {dim('No results found.')}\n")
    else:
        print(f"  {dim(f'{found} scene(s) matched.')}\n")

def cmd_help(args):
    print()
    print(bold(gold("  film.py — Creatures in the Tall Grass CLI\n")))
    commands = [
        ("scenes",              "List all scenes by act"),
        ("read <n|id>",         "Read a scene"),
        ("compile",             "Compile script via Node.js"),
        ("production",          "Scene production breakdown"),
        ("status",              "Overall film status"),
        ("characters [name]",   "List or show character sheets"),
        ("notes [name]",        "List or show director's notes"),
        ("overview",            "Film synopsis and act breakdown"),
        ("edit <n|id>",         "Open scene in $EDITOR"),
        ("search <term>",       "Search across all scenes"),
    ]
    for cmd, desc in commands:
        print(f"  {cyan(f'film.py {cmd}'):<36} {dim(desc)}")
    print()

# ── Main ─────────────────────────────────────────────────────────────────────

COMMANDS = {
    'scenes':     cmd_scenes,
    'list':       cmd_scenes,
    'read':       cmd_read,
    'compile':    cmd_compile,
    'production': cmd_production,
    'prod':       cmd_production,
    'status':     cmd_status,
    'characters': cmd_characters,
    'chars':      cmd_characters,
    'char':       cmd_characters,
    'notes':      cmd_notes,
    'overview':   cmd_overview,
    'edit':       cmd_edit,
    'search':     cmd_search,
    'help':       cmd_help,
}

def main():
    args = sys.argv[1:]

    if not args:
        cmd_help([])
        return

    cmd = args[0].lower()
    rest = args[1:]

    handler = COMMANDS.get(cmd)
    if handler:
        handler(rest)
    else:
        print(red(f"\n  Unknown command: {cmd}"))
        cmd_help([])

if __name__ == '__main__':
    main()
