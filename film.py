#!/usr/bin/env python3
"""
film.py — Barnacle Films TUI
Arrow keys to navigate, Enter to open, Esc to go back.
"""

import curses
import json
import os
import re
import subprocess
import sys
import textwrap
from datetime import date
from pathlib import Path

ROOT        = Path(__file__).parent
CONFIG_DIR  = Path.home() / '.config' / 'barnacle'
CONFIG_FILE = CONFIG_DIR / 'film.json'

# ── Config ────────────────────────────────────────────────────────────────────

def load_config():
    try:
        return json.loads(CONFIG_FILE.read_text())
    except Exception:
        return {'first_run': True, 'favorites': [], 'recent': []}

def save_config(cfg):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))

# ── Projects ──────────────────────────────────────────────────────────────────

PROJECTS = [
    {'key': 'summer',  'name': 'Creatures in the Tall Grass', 'short': 'su', 'type': 'film',  'label': 'Scene',
     'status': 'active',      'desc': 'A family discovers something ancient in a rural field.',
     'path':   ROOT / 'pages'  / 'summer'  / 'script-system',
     'scenes': ROOT / 'pages'  / 'summer'  / 'script-system' / 'scenes'},
    {'key': 'winter',  'name': 'Winter',                      'short': 'wi', 'type': 'film',  'label': 'Scene',
     'status': 'development', 'desc': 'A long winter brings a small town to its breaking point.',
     'path':   ROOT / 'pages'  / 'winter'  / 'script-system',
     'scenes': ROOT / 'pages'  / 'winter'  / 'script-system' / 'scenes'},
    {'key': 'nibbler', 'name': 'The Nibbler',                 'short': 'ni', 'type': 'film',  'label': 'Scene',
     'status': 'draft',       'desc': 'Something small and persistent eats away at the edges of a life.',
     'path':   ROOT / 'pages'  / 'nibbler' / 'script-system',
     'scenes': ROOT / 'pages'  / 'nibbler' / 'script-system' / 'scenes'},
    {'key': 'black',   'name': 'Black',                       'short': 'bl', 'type': 'novel', 'label': 'Chapter',
     'status': 'draft',       'desc': '',
     'path':   ROOT / 'novels' / 'black',
     'scenes': ROOT / 'novels' / 'black'   / 'chapters'},
    {'key': 'cyan',    'name': 'Cyan',                        'short': 'cy', 'type': 'novel', 'label': 'Chapter',
     'status': 'development', 'desc': '',
     'path':   ROOT / 'novels' / 'cyan',
     'scenes': ROOT / 'novels' / 'cyan'    / 'chapters'},
    {'key': 'magenta', 'name': 'Magenta',                     'short': 'ma', 'type': 'novel', 'label': 'Chapter',
     'status': 'development', 'desc': '',
     'path':   ROOT / 'novels' / 'magenta',
     'scenes': ROOT / 'novels' / 'magenta' / 'chapters'},
    {'key': 'yellow',  'name': 'Yellow',                      'short': 'ye', 'type': 'novel', 'label': 'Chapter',
     'status': 'draft',       'desc': '',
     'path':   ROOT / 'novels' / 'yellow',
     'scenes': ROOT / 'novels' / 'yellow'  / 'chapters'},
]

PROJECT_MAP = {p['key']: p for p in PROJECTS}
for p in PROJECTS:
    PROJECT_MAP[p['short']] = p

# ── Data ──────────────────────────────────────────────────────────────────────

def load_manifest(proj):
    try:
        return json.loads((proj['path'] / 'manifest.json').read_text())
    except Exception:
        files = sorted(proj['scenes'].glob('*.md'))
        return [{'id': f.stem, 'file': f.name,
                 'title': f.stem.replace('_', ' ').replace('-', ' ').title()} for f in files]

def load_content(proj, filename):
    try:
        return (proj['scenes'] / filename).read_text()
    except FileNotFoundError:
        return f'[File not found: {filename}]'

def scene_count(proj):
    try:
        return len(load_manifest(proj))
    except Exception:
        return len(list(proj['scenes'].glob('*.md')))

def resolve(arg, scenes):
    try:
        n = int(arg)
        if 1 <= n <= len(scenes):
            return scenes[n - 1], n
    except (ValueError, TypeError):
        pass
    for i, s in enumerate(scenes):
        if s.get('id') == arg or s.get('nickname') == arg:
            return s, i + 1
    return None, None

# ── Favorites / Recent ────────────────────────────────────────────────────────

def fav_add(cfg, proj, scene, n):
    favs = cfg.setdefault('favorites', [])
    for f in favs:
        if f['project'] == proj['key'] and f['n'] == n:
            return False  # already exists
    favs.append({'project': proj['key'], 'n': n,
                 'title': scene.get('title', scene.get('id', '')),
                 'file': scene.get('file', ''), 'added': str(date.today())})
    save_config(cfg)
    return True

def fav_remove(cfg, idx):
    if 0 <= idx < len(cfg.get('favorites', [])):
        cfg['favorites'].pop(idx)
        save_config(cfg)

def push_recent(cfg, proj, scene, n):
    recent = cfg.setdefault('recent', [])
    entry  = {'project': proj['key'], 'n': n,
               'title': scene.get('title', scene.get('id', '')),
               'file': scene.get('file', '')}
    cfg['recent'] = [r for r in recent
                     if not (r['project'] == entry['project'] and r['n'] == entry['n'])]
    cfg['recent'].insert(0, entry)
    cfg['recent'] = cfg['recent'][:10]
    save_config(cfg)

# ── Content formatting ────────────────────────────────────────────────────────

def format_lines(content):
    """Return list of (text, style) for the reader."""
    lines  = []
    clean  = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL).strip()
    for raw in clean.split('\n'):
        s = raw.strip()
        if not s:
            lines.append(('', 'blank'))
        elif re.match(r'^(INT\.|EXT\.)', s, re.IGNORECASE):
            lines.append((s, 'heading'))
        elif re.match(r'^(FADE|CUT TO|DISSOLVE|SMASH CUT)', s, re.IGNORECASE):
            lines.append((s, 'dim'))
        elif re.match(r'^\(action\)$', s, re.IGNORECASE):
            lines.append(('', 'blank'))
        elif re.match(r'^\(.+\)$', s):
            lines.append(('    ' + s, 'paren'))
        elif s == s.upper() and 1 < len(s) < 35 and not s.startswith('#'):
            lines.append(('', 'blank'))
            lines.append((s, 'character'))
        elif s.startswith('#'):
            text = s.lstrip('#').strip()
            lines.append(('', 'blank'))
            lines.append((text, 'gold'))
            lines.append(('', 'blank'))
        else:
            lines.append(('  ' + raw, 'normal'))
    return lines

def build_scene_rows(proj, scenes, cfg):
    """Build navigable row list for project view (headers + scenes)."""
    fav_set  = {(f['project'], f['n']) for f in cfg.get('favorites', [])}
    act_nums = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V'}
    rows, cur_act = [], None
    for i, s in enumerate(scenes):
        n   = i + 1
        act = s.get('act')
        act_title = s.get('actTitle', '')
        if act and act != cur_act:
            cur_act = act
            rows.append({'kind': 'header',
                         'text': f"Act {act_nums.get(act, str(act))} — {act_title}"})
        rows.append({'kind': 'scene', 'n': n, 'scene': s,
                     'title': s.get('title', s.get('id', f'Scene {n}')),
                     'fav': (proj['key'], n) in fav_set})
    return rows

def run_search(term, proj=None):
    results = []
    term_l  = term.lower()
    targets = [proj] if proj else PROJECTS
    for p in targets:
        scenes = load_manifest(p)
        for i, s in enumerate(scenes):
            n       = i + 1
            content = load_content(p, s['file'])
            clean   = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
            hits    = [l.strip() for l in clean.split('\n') if term_l in l.lower() and l.strip()]
            if hits:
                results.append({'proj_key': p['key'], 'proj_name': p['name'],
                                 'label': p['label'], 'n': n,
                                 'title': s.get('title', s.get('id', '')),
                                 'match': hits[0][:90]})
    return results

# ── App ───────────────────────────────────────────────────────────────────────

class App:

    def __init__(self, stdscr, cfg):
        self.scr = stdscr
        self.cfg = cfg
        self.msg = ''        # one-line flash message (shown in bottom bar)
        self.stack = []

        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(1, curses.COLOR_YELLOW,  -1)   # gold
        curses.init_pair(2, curses.COLOR_CYAN,    -1)   # cyan
        curses.init_pair(3, curses.COLOR_GREEN,   -1)   # green
        curses.init_pair(4, curses.COLOR_RED,     -1)   # red
        curses.init_pair(5, curses.COLOR_MAGENTA, -1)   # magenta
        curses.init_pair(6, curses.COLOR_WHITE,   -1)   # white
        # selection: dark text on cyan bg
        curses.init_pair(7, curses.COLOR_BLACK, curses.COLOR_CYAN)
        # top/bottom bars: black on white
        curses.init_pair(8, curses.COLOR_BLACK, curses.COLOR_WHITE)

        self.GOLD  = curses.color_pair(1)
        self.CYAN  = curses.color_pair(2)
        self.GREEN = curses.color_pair(3)
        self.RED   = curses.color_pair(4)
        self.MAG   = curses.color_pair(5)
        self.SEL   = curses.color_pair(7)
        self.BAR   = curses.color_pair(8)

        curses.curs_set(0)
        self.scr.keypad(True)
        self.scr.timeout(50)  # non-blocking so resize works
        self.compact = False

        if cfg.get('first_run', True):
            self.stack.append({'screen': 'guide', 'offset': 0})
            cfg['first_run'] = False
            save_config(cfg)
        else:
            self.stack.append({'screen': 'hub', 'sel': 0})

    # ── Navigation ────────────────────────────────────────────────────────────

    def push(self, state):
        self.stack.append(state)

    def pop(self):
        if len(self.stack) > 1:
            self.stack.pop()

    @property
    def st(self):
        return self.stack[-1]

    # ── Main loop ─────────────────────────────────────────────────────────────

    def run(self):
        while True:
            h, w = self.scr.getmaxyx()
            self.scr.erase()
            self.draw(h, w)
            self.scr.refresh()
            key = self.scr.getch()
            if key == -1:
                continue
            if key == curses.KEY_RESIZE:
                continue
            result = self.dispatch(key)
            if result == 'quit':
                break

    # ── Draw dispatch ─────────────────────────────────────────────────────────

    def draw(self, h, w):
        s = self.st['screen']
        if   s == 'hub':     self.draw_hub(h, w)
        elif s == 'project': self.draw_project(h, w)
        elif s == 'reader':  self.draw_reader(h, w)
        elif s == 'favs':    self.draw_favs(h, w)
        elif s == 'recent':  self.draw_recent(h, w)
        elif s == 'search':  self.draw_search(h, w)
        elif s == 'guide':   self.draw_guide(h, w)

    # ── Key dispatch ──────────────────────────────────────────────────────────

    def dispatch(self, key):
        s = self.st['screen']
        if   s == 'hub':     return self.key_hub(key)
        elif s == 'project': return self.key_project(key)
        elif s == 'reader':  return self.key_reader(key)
        elif s == 'favs':    return self.key_favs(key)
        elif s == 'recent':  return self.key_recent(key)
        elif s == 'search':  return self.key_search(key)
        elif s == 'guide':   return self.key_guide(key)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def put(self, y, x, text, attr=0):
        h, w = self.scr.getmaxyx()
        if y < 0 or y >= h or x < 0 or x >= w:
            return
        text = text[:max(0, w - x - 1)]
        try:
            self.scr.addstr(y, x, text, attr)
        except curses.error:
            pass

    def fill(self, y, attr):
        h, w = self.scr.getmaxyx()
        try:
            self.scr.addstr(y, 0, ' ' * (w - 1), attr)
        except curses.error:
            pass

    def bar(self, y, left, right=''):
        h, w = self.scr.getmaxyx()
        self.fill(y, self.BAR)
        self.put(y, 2, left, self.BAR | curses.A_BOLD)
        if right:
            rx = w - len(right) - 2
            if rx > len(left) + 4:
                self.put(y, rx, right, self.BAR)

    def hline(self, y, w, char='─'):
        self.put(y, 2, char * (w - 4), curses.A_DIM)

    def clamp_sel(self, st, n):
        st['sel'] = max(0, min(st.get('sel', 0), n - 1))

    def scroll_to(self, st, content_h, sel_row):
        off = st.get('offset', 0)
        if sel_row < off:
            off = sel_row
        elif sel_row >= off + content_h:
            off = sel_row - content_h + 1
        st['offset'] = off
        return off

    STATUS_COLORS = {
        'active':      'GREEN',
        'draft':       'GOLD',
        'development': 'MAG',
        'hold':        'RED',
        'complete':    'CYAN',
    }
    STATUS_ICONS = {
        'active':      '■',
        'draft':       '○',
        'development': '◆',
        'hold':        '▪',
        'complete':    '●',
    }

    def status_attr(self, status):
        return getattr(self, self.STATUS_COLORS.get(status, 'GOLD'), 0)

    def get_display_lines(self, raw_lines, width):
        """Word-wrap raw lines to width; skip blanks in compact mode."""
        result  = []
        wrap_w  = max(20, width - 4)
        for text, style in raw_lines:
            if not text.strip():
                if not self.compact:
                    result.append(('', 'blank'))
                continue
            if len(text) <= wrap_w:
                result.append((text, style))
            else:
                indent     = len(text) - len(text.lstrip())
                sub_indent = ' ' * indent
                chunks     = textwrap.wrap(
                    text, wrap_w,
                    subsequent_indent=sub_indent,
                    break_long_words=True,
                )
                for chunk in chunks:
                    result.append((chunk, style))
        return result

    # ── HUB ───────────────────────────────────────────────────────────────────

    def draw_hub(self, h, w):
        st    = self.st
        films = [p for p in PROJECTS if p['type'] == 'film']
        novs  = [p for p in PROJECTS if p['type'] == 'novel']
        items = films + novs
        self.clamp_sel(st, len(items))
        sel   = st['sel']
        favs  = self.cfg.get('favorites', [])
        recent = self.cfg.get('recent', [])

        self.bar(0, 'BARNACLE FILMS', '? guide · q quit')

        y = 2
        self.put(y, 2, 'FILMS', self.CYAN | curses.A_BOLD); y += 1
        self.hline(y, w); y += 1

        for i, p in enumerate(films):
            n        = scene_count(p)
            fc       = sum(1 for f in favs if f['project'] == p['key'])
            sel_this = (i == sel)
            star     = ' ★' if fc else ''
            right    = f"{n} scenes"
            if sel_this:
                self.fill(y, self.SEL)
                self.put(y, 2, f"▶  {p['name']}{star}", self.SEL | curses.A_BOLD)
                self.put(y, w - len(right) - 3, right, self.SEL)
            else:
                self.put(y, 2, f"   {p['name']}", 0)
                if fc: self.put(y, 2 + 3 + len(p['name']), ' ★', self.GOLD)
                self.put(y, w - len(right) - 3, right, curses.A_DIM)
            y += 1
            if not self.compact and y < h - 1:
                icon   = self.STATUS_ICONS.get(p.get('status', ''), '·')
                status = p.get('status', '')
                desc   = p.get('desc', '')
                badge  = f"{icon} {status}"
                meta   = f"   {badge}  {desc}".rstrip() if desc else f"   {badge}"
                self.put(y, 2, meta, self.status_attr(status) | curses.A_DIM)
                y += 1

        y += 1
        self.put(y, 2, 'NOVELS', self.MAG | curses.A_BOLD); y += 1
        self.hline(y, w); y += 1

        for i, p in enumerate(novs):
            n        = scene_count(p)
            fc       = sum(1 for f in favs if f['project'] == p['key'])
            idx      = len(films) + i
            sel_this = (idx == sel)
            right    = f"{n} chapters"
            if sel_this:
                self.fill(y, self.SEL)
                self.put(y, 2, f"▶  {p['name']}", self.SEL | curses.A_BOLD)
                if fc: self.put(y, 2 + 3 + len(p['name']), ' ★', self.SEL)
                self.put(y, w - len(right) - 3, right, self.SEL)
            else:
                self.put(y, 2, f"   {p['name']}", 0)
                if fc: self.put(y, 2 + 3 + len(p['name']), ' ★', self.GOLD)
                self.put(y, w - len(right) - 3, right, curses.A_DIM)
            y += 1
            if not self.compact and y < h - 1:
                icon   = self.STATUS_ICONS.get(p.get('status', ''), '·')
                status = p.get('status', '')
                desc   = p.get('desc', '')
                badge  = f"{icon} {status}"
                meta   = f"   {badge}  {desc}".rstrip() if desc else f"   {badge}"
                self.put(y, 2, meta, self.status_attr(status) | curses.A_DIM)
                y += 1

        # Recent hint
        if recent and h - y > 3:
            y += 1
            r0 = recent[0]
            self.put(y, 2, f"Last opened: {r0['title']}  ({r0['project']} #{r0['n']})", curses.A_DIM)

        compact_hint = '  [compact]' if self.compact else ''
        hint = self.msg or f'f favorites · r recent · / search · z compact{compact_hint}'
        self.bar(h - 1, '↑↓  Enter open', hint)
        self.msg = ''

    def key_hub(self, key):
        st    = self.st
        items = [p for p in PROJECTS if p['type'] == 'film'] + \
                [p for p in PROJECTS if p['type'] == 'novel']
        n     = len(items)
        sel   = st.get('sel', 0)

        if key in (ord('q'), ord('Q')):
            return 'quit'
        elif key in (curses.KEY_UP, ord('k')):
            st['sel'] = max(0, sel - 1)
        elif key in (curses.KEY_DOWN, ord('j')):
            st['sel'] = min(n - 1, sel + 1)
        elif key == ord('g'):
            st['sel'] = 0
        elif key == ord('G'):
            st['sel'] = n - 1
        elif key in (curses.KEY_ENTER, 10, 13):
            self.push({'screen': 'project', 'proj': items[sel],
                       'scenes': load_manifest(items[sel]),
                       'rows': [], 'sel': 0, 'offset': 0})
            self._rebuild_rows()
        elif key in (ord('f'), ord('F')):
            self.push({'screen': 'favs', 'sel': 0, 'offset': 0})
        elif key in (ord('r'), ord('R')):
            self.push({'screen': 'recent', 'sel': 0})
        elif key == ord('/'):
            self.push({'screen': 'search', 'proj': None,
                       'query': '', 'results': [], 'sel': 0, 'offset': 0, 'mode': 'input'})
        elif key in (ord('?'), ord('h')):
            self.push({'screen': 'guide', 'offset': 0})
        elif key == ord('z'):
            self.compact = not self.compact

    # ── PROJECT ───────────────────────────────────────────────────────────────

    def _rebuild_rows(self):
        st = self.st
        st['rows'] = build_scene_rows(st['proj'], st['scenes'], self.cfg)

    def _selectable(self):
        return [i for i, r in enumerate(self.st['rows']) if r['kind'] == 'scene']

    def draw_project(self, h, w):
        st   = self.st
        proj = st['proj']
        rows = st['rows']
        if not rows:
            self._rebuild_rows()
            rows = st['rows']

        selectable = self._selectable()
        if not selectable:
            return
        self.clamp_sel(st, len(selectable))
        sel_row = selectable[st['sel']]

        content_h = h - 3
        off = self.scroll_to(st, content_h, sel_row)

        ptype = 'Film' if proj['type'] == 'film' else 'Novel'
        self.bar(0, proj['name'].upper(), f"{ptype} · Esc back")

        for i in range(content_h):
            ri = off + i
            y  = i + 1
            if ri >= len(rows):
                break
            row = rows[ri]
            is_sel = (ri == sel_row)

            if row['kind'] == 'header':
                self.put(y, 2, row['text'], self.GOLD | curses.A_BOLD)
            else:
                n     = row['n']
                title = row['title']
                star  = '★' if row['fav'] else ' '
                if is_sel:
                    self.fill(y, self.SEL)
                    self.put(y, 2, f"▶ {star} {n:>3}.  {title}", self.SEL | curses.A_BOLD)
                else:
                    self.put(y, 2, f"  {star} {n:>3}.  {title}", 0)
                    if row['fav']:
                        self.put(y, 4, star, self.GOLD)

        hint = self.msg or 'f favorite · / search · n next · p prev · g top · G bottom'
        self.bar(h - 1, '↑↓  Enter read  Esc back', hint)
        self.msg = ''

    def key_project(self, key):
        st         = self.st
        selectable = self._selectable()
        n          = len(selectable)
        sel        = st.get('sel', 0)

        if key in (27, ord('q')):
            self.pop()
        elif key in (curses.KEY_UP, ord('k')):
            st['sel'] = max(0, sel - 1)
        elif key in (curses.KEY_DOWN, ord('j')):
            st['sel'] = min(n - 1, sel + 1)
        elif key == ord('g'):
            st['sel'] = 0
        elif key == ord('G'):
            st['sel'] = n - 1
        elif key == curses.KEY_PPAGE:
            st['sel'] = max(0, sel - 10)
        elif key == curses.KEY_NPAGE:
            st['sel'] = min(n - 1, sel + 10)
        elif key in (curses.KEY_ENTER, 10, 13):
            if selectable:
                row = st['rows'][selectable[sel]]
                self._open_scene(st['proj'], row['scene'], row['n'])
        elif key == ord('f'):
            if selectable:
                row = st['rows'][selectable[sel]]
                added = fav_add(self.cfg, st['proj'], row['scene'], row['n'])
                self.msg = f"★ Saved: {row['title']}" if added else 'Already in favorites'
                self._rebuild_rows()
        elif key == ord('/'):
            self.push({'screen': 'search', 'proj': st['proj'],
                       'query': '', 'results': [], 'sel': 0, 'offset': 0, 'mode': 'input'})
        elif key == ord('z'):
            self.compact = not self.compact
        elif key in (ord('?'), ord('h')):
            self.push({'screen': 'guide', 'offset': 0})

    def _open_scene(self, proj, scene, n):
        lines = format_lines(load_content(proj, scene['file']))
        push_recent(self.cfg, proj, scene, n)
        self.push({'screen': 'reader', 'proj': proj, 'scene': scene,
                   'n': n, 'lines': lines, 'offset': 0})

    # ── READER ────────────────────────────────────────────────────────────────

    def draw_reader(self, h, w):
        st    = self.st
        proj  = st['proj']
        scene = st['scene']
        n     = st['n']
        lines = st['lines']
        off   = st['offset']

        act_nums = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V'}
        act      = scene.get('act', 0)
        act_str  = ''
        if act:
            act_str = f"Act {act_nums.get(act, act)} — {scene.get('actTitle', '')}"

        label  = proj['label']
        title  = scene.get('title', f'{label} {n}')
        header = f"{label} {n}: {title}"

        self.bar(0, header, 'Esc back')

        content_y = 1
        if act_str:
            self.put(1, 2, act_str, curses.A_DIM)
            content_y = 2

        content_h    = h - content_y - 1
        dlines       = self.get_display_lines(lines, w)
        st['_dlines'] = dlines
        max_off      = max(0, len(dlines) - content_h)
        st['offset'] = max(0, min(off, max_off))
        off = st['offset']

        styles = {
            'heading':   self.CYAN  | curses.A_BOLD,
            'character': self.GREEN | curses.A_BOLD,
            'gold':      self.GOLD  | curses.A_BOLD,
            'paren':     curses.A_DIM,
            'dim':       curses.A_DIM,
            'normal':    0,
            'blank':     0,
        }

        for i in range(content_h):
            li = off + i
            y  = content_y + i
            if li >= len(dlines):
                break
            text, style = dlines[li]
            self.put(y, 0, text, styles.get(style, 0))

        # Scroll %
        pct      = int(off / max_off * 100) if max_off else 100
        fav_set  = {(f['project'], f['n']) for f in self.cfg.get('favorites', [])}
        is_fav   = (proj['key'], n) in fav_set
        fav_hint = '★ favorited' if is_fav else 'f = bookmark'
        compact_tag = '  [compact]' if self.compact else ''

        hint = self.msg or f"{fav_hint} · n next · p prev · z compact{compact_tag}"
        self.bar(h - 1, f"↑↓ scroll  PgDn/PgUp  [{pct}%]", hint)
        self.msg = ''

    def key_reader(self, key):
        st        = self.st
        h, w      = self.scr.getmaxyx()
        content_h = h - 3
        dlines    = st.get('_dlines', st['lines'])
        max_off   = max(0, len(dlines) - content_h)

        if key in (27, ord('q')):
            self.pop()
        elif key in (curses.KEY_UP, ord('k')):
            st['offset'] = max(0, st['offset'] - 1)
        elif key in (curses.KEY_DOWN, ord('j'), ord(' ')):
            st['offset'] = min(max_off, st['offset'] + 1)
        elif key == curses.KEY_PPAGE:
            st['offset'] = max(0, st['offset'] - content_h)
        elif key == curses.KEY_NPAGE:
            st['offset'] = min(max_off, st['offset'] + content_h)
        elif key == ord('g'):
            st['offset'] = 0
        elif key == ord('G'):
            st['offset'] = max_off
        elif key == ord('f'):
            added = fav_add(self.cfg, st['proj'], st['scene'], st['n'])
            self.msg = '★ Saved to favorites' if added else 'Already in favorites'
        elif key == ord('n'):
            self._step_scene(+1)
        elif key == ord('p'):
            self._step_scene(-1)
        elif key == ord('z'):
            self.compact = not self.compact
            st['offset'] = 0  # reset scroll since line count changes
        elif key in (ord('?'), ord('h')):
            self.push({'screen': 'guide', 'offset': 0})

    def _step_scene(self, delta):
        st     = self.st
        proj   = st['proj']
        scenes = load_manifest(proj)
        new_n  = st['n'] + delta
        if 1 <= new_n <= len(scenes):
            scene = scenes[new_n - 1]
            lines = format_lines(load_content(proj, scene['file']))
            push_recent(self.cfg, proj, scene, new_n)
            st['scene'] = scene
            st['n']     = new_n
            st['lines'] = lines
            st['offset'] = 0

    # ── FAVS ──────────────────────────────────────────────────────────────────

    def draw_favs(self, h, w):
        st   = self.st
        favs = self.cfg.get('favorites', [])

        self.bar(0, 'FAVORITES  ★', 'Esc back')

        if not favs:
            self.put(3, 4, 'No favorites yet.', curses.A_DIM)
            self.put(4, 4, 'Open any scene and press  f  to bookmark it.', curses.A_DIM)
            self.bar(h - 1, 'Esc back', '')
            return

        self.clamp_sel(st, len(favs))
        sel       = st['sel']
        content_h = h - 3
        off = self.scroll_to(st, content_h, sel)

        for i in range(content_h):
            idx = off + i
            y   = i + 1
            if idx >= len(favs) or y >= h - 1:
                break
            fav      = favs[idx]
            pname    = PROJECT_MAP.get(fav['project'], {}).get('name', fav['project'])
            lbl      = PROJECT_MAP.get(fav['project'], {}).get('label', 'Scene')
            is_sel   = (idx == sel)
            meta     = f"  {pname} · {lbl} {fav['n']} · added {fav.get('added', '')}"

            if is_sel:
                self.fill(y, self.SEL)
                self.put(y, 2, f"▶ {idx+1}.  {fav['title']}", self.SEL | curses.A_BOLD)
                self.put(y, w - len(meta) - 1, meta, self.SEL)
            else:
                self.put(y, 2, f"  {idx+1}.  {fav['title']}", 0)
                self.put(y, w - len(meta) - 1, meta, curses.A_DIM)

        hint = self.msg or 'd remove'
        self.bar(h - 1, '↑↓  Enter open  Esc back', hint)
        self.msg = ''

    def key_favs(self, key):
        st   = self.st
        favs = self.cfg.get('favorites', [])

        if key in (27, ord('q')):
            self.pop()
        elif key in (curses.KEY_UP, ord('k')):
            st['sel'] = max(0, st['sel'] - 1)
        elif key in (curses.KEY_DOWN, ord('j')):
            st['sel'] = min(max(0, len(favs) - 1), st['sel'] + 1)
        elif key in (curses.KEY_ENTER, 10, 13):
            if favs:
                f    = favs[st['sel']]
                proj = PROJECT_MAP.get(f['project'])
                if proj:
                    scenes = load_manifest(proj)
                    scene, n = resolve(str(f['n']), scenes)
                    if scene:
                        self._open_scene(proj, scene, n)
        elif key in (ord('d'), ord('x')):
            if favs:
                fav_remove(self.cfg, st['sel'])
                self.msg = 'Removed from favorites'
                st['sel'] = max(0, st['sel'] - 1) if st['sel'] >= len(self.cfg.get('favorites', [])) else st['sel']

    # ── RECENT ────────────────────────────────────────────────────────────────

    def draw_recent(self, h, w):
        st     = self.st
        recent = self.cfg.get('recent', [])

        self.bar(0, 'RECENTLY READ', 'Esc back')

        if not recent:
            self.put(3, 4, 'Nothing opened yet.', curses.A_DIM)
            self.bar(h - 1, 'Esc back', '')
            return

        self.clamp_sel(st, len(recent))
        sel = st['sel']

        for i, r in enumerate(recent):
            y = i + 2
            if y >= h - 1:
                break
            pname  = PROJECT_MAP.get(r['project'], {}).get('name', r['project'])
            lbl    = PROJECT_MAP.get(r['project'], {}).get('label', 'Scene')
            meta   = f"  {pname} · {lbl} {r['n']}"
            is_sel = (i == sel)

            if is_sel:
                self.fill(y, self.SEL)
                self.put(y, 2, f"▶  {r['title']}", self.SEL | curses.A_BOLD)
                self.put(y, w - len(meta) - 1, meta, self.SEL)
            else:
                self.put(y, 4, r['title'], 0)
                self.put(y, w - len(meta) - 1, meta, curses.A_DIM)

        self.bar(h - 1, '↑↓  Enter open  Esc back', '')

    def key_recent(self, key):
        st     = self.st
        recent = self.cfg.get('recent', [])

        if key in (27, ord('q')):
            self.pop()
        elif key in (curses.KEY_UP, ord('k')):
            st['sel'] = max(0, st['sel'] - 1)
        elif key in (curses.KEY_DOWN, ord('j')):
            st['sel'] = min(max(0, len(recent) - 1), st['sel'] + 1)
        elif key in (curses.KEY_ENTER, 10, 13):
            if recent:
                r    = recent[st['sel']]
                proj = PROJECT_MAP.get(r['project'])
                if proj:
                    scenes = load_manifest(proj)
                    scene, n = resolve(str(r['n']), scenes)
                    if scene:
                        self._open_scene(proj, scene, n)

    # ── SEARCH ────────────────────────────────────────────────────────────────

    def draw_search(self, h, w):
        st      = self.st
        mode    = st['mode']
        query   = st['query']
        results = st['results']
        sel     = st['sel']

        scope = st['proj']['name'] if st['proj'] else 'All Projects'
        self.bar(0, f'SEARCH  —  {scope}', 'Esc back')

        # Input line
        self.put(2, 2, '/', self.GOLD | curses.A_BOLD)
        self.put(2, 3, query, curses.A_BOLD)
        if mode == 'input':
            self.put(2, 3 + len(query), '▌', curses.A_DIM)
        self.hline(3, w)

        if mode == 'results':
            if not results:
                self.put(5, 4, f'No results for "{query}"', curses.A_DIM)
            else:
                self.clamp_sel(st, len(results))
                content_h = h - 6
                off = self.scroll_to(st, content_h, sel)

                for i in range(content_h):
                    idx = off + i
                    y   = 5 + i
                    if idx >= len(results) or y >= h - 1:
                        break
                    r      = results[idx]
                    meta   = f"  [{r['proj_name']} {r['label']} {r['n']}]"
                    is_sel = (idx == sel)
                    if is_sel:
                        self.fill(y, self.SEL)
                        self.put(y, 2, f"▶  {r['title']}", self.SEL | curses.A_BOLD)
                        self.put(y, w - len(meta) - 1, meta, self.SEL)
                    else:
                        self.put(y, 4, r['title'], curses.A_BOLD)
                        self.put(y, 4 + len(r['title']), meta, curses.A_DIM)

        if mode == 'input':
            self.bar(h - 1, 'Type your search', 'Enter go · Esc cancel · Backspace erase')
        else:
            cnt = f"{len(results)} result(s)"
            self.bar(h - 1, '↑↓  Enter open  / new search  Esc back', cnt)

    def key_search(self, key):
        st   = self.st
        mode = st['mode']

        if mode == 'input':
            if key == 27:
                self.pop()
            elif key in (curses.KEY_ENTER, 10, 13):
                if st['query']:
                    st['results'] = run_search(st['query'], st['proj'])
                    st['mode']    = 'results'
                    st['sel']     = 0
                    st['offset']  = 0
            elif key in (curses.KEY_BACKSPACE, 127, 8):
                st['query'] = st['query'][:-1]
            elif 32 <= key <= 126:
                st['query'] += chr(key)
        else:
            results = st['results']
            if key in (27, ord('q')):
                self.pop()
            elif key == ord('/'):
                st['mode'] = 'input'
            elif key in (curses.KEY_UP, ord('k')):
                st['sel'] = max(0, st['sel'] - 1)
            elif key in (curses.KEY_DOWN, ord('j')):
                st['sel'] = min(max(0, len(results) - 1), st['sel'] + 1)
            elif key in (curses.KEY_ENTER, 10, 13):
                if results:
                    r    = results[st['sel']]
                    proj = PROJECT_MAP.get(r['proj_key'])
                    if proj:
                        scenes = load_manifest(proj)
                        scene, n = resolve(str(r['n']), scenes)
                        if scene:
                            self._open_scene(proj, scene, n)

    # ── GUIDE ─────────────────────────────────────────────────────────────────

    GUIDE_LINES = [
        ('BARNACLE FILMS  —  HOW TO USE', 'gold'),
        ('', 'blank'),
        ('GETTING AROUND', 'section'),
        ('  ↑ ↓  or  j k     Navigate up and down', 'normal'),
        ('  Enter            Open selected project, scene, or result', 'normal'),
        ('  Esc  or  q       Go back', 'normal'),
        ('  g / G            Jump to top / bottom of list', 'normal'),
        ('  PgUp / PgDn      Page through long lists and scenes', 'normal'),
        ('', 'blank'),
        ('FROM THE HUB', 'section'),
        ('  1–7              Projects are numbered — just press the number', 'normal'),
        ('  f                Open Favorites', 'normal'),
        ('  r                Open Recent history', 'normal'),
        ('  /                Search across all projects', 'normal'),
        ('', 'blank'),
        ('INSIDE A PROJECT', 'section'),
        ('  Enter            Read the selected scene', 'normal'),
        ('  f                Bookmark the selected scene', 'normal'),
        ('  /                Search within this project', 'normal'),
        ('', 'blank'),
        ('READING A SCENE', 'section'),
        ('  ↑ ↓  or  j k     Scroll line by line', 'normal'),
        ('  Space            Scroll down one line', 'normal'),
        ('  PgDn / PgUp      Scroll by page', 'normal'),
        ('  n / p            Next / previous scene', 'normal'),
        ('  f                Bookmark this scene  ★', 'normal'),
        ('  g / G            Jump to top / bottom', 'normal'),
        ('', 'blank'),
        ('FAVORITES  ★', 'section'),
        ('  Press f on any scene to save it here', 'normal'),
        ('  Enter to jump to it from the favorites list', 'normal'),
        ('  d to remove it from the list', 'normal'),
        ('', 'blank'),
        ('SEARCH', 'section'),
        ('  Type to build query, Enter to run', 'normal'),
        ('  From hub: searches all projects', 'normal'),
        ('  From inside a project: searches that project only', 'normal'),
        ('  /  to start a new search from results', 'normal'),
        ('', 'blank'),
        ('ANYWHERE', 'section'),
        ('  ?  or  h         Show this guide', 'normal'),
        ('  q                Quit (from hub)', 'normal'),
    ]

    def draw_guide(self, h, w):
        st  = self.st
        off = st.get('offset', 0)
        lines = self.GUIDE_LINES

        max_off = max(0, len(lines) - (h - 2))
        st['offset'] = max(0, min(off, max_off))
        off = st['offset']

        self.bar(0, 'HOW TO USE', 'any key to close')

        for i in range(h - 2):
            li = off + i
            y  = i + 1
            if li >= len(lines):
                break
            text, style = lines[li]
            if style == 'gold':
                self.put(y, 2, text, self.GOLD | curses.A_BOLD)
            elif style == 'section':
                self.put(y, 2, text, self.CYAN | curses.A_BOLD)
            elif style == 'normal':
                self.put(y, 0, text, 0)
            # blank: nothing

        pct = int(off / max_off * 100) if max_off else 100
        self.bar(h - 1, '↑↓ scroll', f'[{pct}%]  any key to close')

    def key_guide(self, key):
        st      = self.st
        h, _    = self.scr.getmaxyx()
        content_h = h - 2

        if key in (curses.KEY_UP, ord('k')):
            st['offset'] = max(0, st['offset'] - 1)
        elif key in (curses.KEY_DOWN, ord('j'), ord(' ')):
            max_off = max(0, len(self.GUIDE_LINES) - content_h)
            st['offset'] = min(max_off, st['offset'] + 1)
        elif key == curses.KEY_PPAGE:
            st['offset'] = max(0, st['offset'] - content_h)
        elif key == curses.KEY_NPAGE:
            max_off = max(0, len(self.GUIDE_LINES) - content_h)
            st['offset'] = min(max_off, st['offset'] + content_h)
        elif key == ord('g'):
            st['offset'] = 0
        elif key == ord('G'):
            max_off = max(0, len(self.GUIDE_LINES) - content_h)
            st['offset'] = max_off
        else:
            self.pop()

# ── Entry ─────────────────────────────────────────────────────────────────────

def main(stdscr):
    cfg = load_config()
    app = App(stdscr, cfg)
    app.run()

if __name__ == '__main__':
    # Allow passing a project key as arg to open directly
    if len(sys.argv) > 1:
        key = sys.argv[1].lower()
        if key in PROJECT_MAP:
            # We still run TUI but push project immediately after hub init
            _direct = key
        else:
            print(f"Unknown project: {key}")
            print("Available: " + ' · '.join(p['key'] for p in PROJECTS))
            sys.exit(1)
    curses.wrapper(main)
