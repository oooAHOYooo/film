# CITG Restructure Brief — Act II/III Back Half

**Source draft:** full script compile v24 (7/4/2026)
**Purpose:** Single source of truth for the structural rewrite. Claude Code should treat this file as the spec. Do not invent story decisions not listed here. If a needed decision is missing, stop and ask.

---

## 0. Rules of engagement (read first)

1. **Do not modify any scene marked SHOT in the table below** without explicit instruction. If a change is needed in a shot scene, propose it as a pickup/reshoot note in a comment block instead of rewriting the scene.
2. **One scene file per commit.** Commit message format: `s18: <what changed>`.
3. **Preserve file conventions:** the `<!-- scene: NN file: sNN.md nickname: X -->` comment blocks, `(action)` markers, slug format, scene ID headers, and `<!-- GOING TO FILM ON ... -->` tags. Update `<!-- summary: ... -->` comments to match new content.
4. **Retired scenes are archived, not deleted.** Move to `/archive/` with a header comment noting where their material migrated.
5. **Two-pass discipline:** This brief covers Pass 1 (structure) only. No dialogue polish, no prose texture work in Pass 1. Humanize pass is a separate session with its own brief.
6. After all edits, run the continuity grep list (Section 6) and report matches.

---

## 1. Shot status table — FILL IN BEFORE RUNNING

| Scene | File | Slated | Status (SHOT / PARTIAL / UNSHOT) |
|---|---|---|---|
| 15 | s15.md | Day 4 (6.13.26) | |
| 16 | s16.md | — | |
| 16B | s16b.md | Day 4 | |
| 17 | s17.md | Day 4 | |
| 17B | s17b.md | Day 12 | |
| 17C | s17c.md | Day 12 (6.28.26) | |
| 17D | s17d.md | Day 11 | |
| 18 | s18.md | Day 11 | |
| 19 | s19.md | Day 11 | |
| 22 | s22.md | Day 13 | |
| 23 | s23.md | — | |
| 24 | s24.md | — | |
| 25 | s25.md | — | |
| 26–28 | s26–s28.md | — | |

---

## 2. The core structural change (locked)

**Old shape:** creature escapes → Dallas trance-walks into marsh → rescue trip #1 (s19) → return home → load-out (s22) → trip #2 → trench run → siege → swarm.

**New shape — one continuous night:**
creature escapes through the hopper window and **runs home to its mother on its own** (it heard the answering song — the second trace on Dallas's scope) → **Makayla walks out mid-hymn** → Dominic trapped hosting, then the party breaks → **Dominic runs down the street after her; Dallas follows with the field bag (blaster already inside per s17d)** → they track her via the **blind** (waypoint) → chase through the marsh (absorbs s23 material) → Makayla reaches the clearing first, witnesses the mother/baby reunion, is **caught inside the red-eye ring when it closes** → Dallas and Dominic break through → siege (s24) → resolution (s25, see Section 4).

**Deleted mechanics:** Dallas's trance/possession and the vision flashes. Dallas's sensitivity to the hum stays (headaches, the rods scene, hearing what others can't) — he is *attuned*, not *controlled*. Every character who enters the storm now chooses to.

**Deleted logistics:** rescue trip #1; the backpack transport of the baby; the load-out scene. The humans never carry the creature — they chase to protect it, because the red eyes converge on the same point and the baby will arrive second.

---

## 3. Scene-by-scene change map

### s07 — The Coordinates — PATCH
- Fix slug `INT. JACE'S BASEMENT` → `INT. DOMINIC'S BASEMENT`. Grep whole repo for `Jace`.
- No other changes. Basement = **the archive** (see Section 5).

### s15 — The Tracking Network — PATCH (verify shot status first)
- Clarify that Makayla is **extending** the node network toward Dallas's side of the marsh (the signal moved when he arrived), not planting it for the first time. One line of action is enough. If SHOT, log as a note only — the existing footage likely supports this reading anyway.

### s16B / s17 — Soother & Resonance — KEEP
- No structural change. These build the blaster. s17's `<!-- NOTE: s17 discovery beat now redundant -->` trim can happen in the humanize pass.

### s17B / s17C — Normal Day & Mute Drive — KEEP
- Dominic's "practiced discipline" material is now load-bearing for his mid-hymn recognition beat. Do not trim.

### s17D — The Handoff — KEEP (verify shot status)
- Everything stays: blaster packed in the field bag, creature staged in Dominic's basement, Makayla's wedge in the hopper window. All of it pays off in the new s18.

### s18 — Life Group — REWRITE BACK HALF (from s18.5 onward)
Keep s18.1–s18.4 essentially as written (arrivals, sick-cat lie, Dallas in the basement, first hymn). Then:

- **s18.5 (basement):** Dallas fights to calm the creature; the second trace (something answering from outside) swells. Keep.
- **s18.6 (living room) — REWRITE:** Makayla's tracker shows the baby's dot **leaving the basement** at the same moment red blips wink on, converging. She shows Dominic the notebook. **New beat: Dominic recognizes his mother's handwriting** (WRONG SONG BRINGS THE WRONG GUESTS, 1971). His "Not. Right. Now." plays as strangled recognition, not annoyance. Makayla does not argue twice. She sets nothing down (she never held a music sheet) and **walks out the front door mid-verse.** The room half-notices. Dominic fully notices and cannot follow — trapped hosting, secret in his basement, mid-hymn.
- **s18.7 (basement) — REWRITE:** Dallas discovers the open window and empty shoebox (keep). CUT the vision. He pulls up the laptop feed: the baby's signal moving fast toward the marsh center; red blips converging; **and Makayla's tracker dot already outside, moving the same direction.** He grabs the field bag (blaster inside) and goes up.
- **s18.8 — REWRITE:** Dallas bursts up with the empty shoebox / bag on his back. That breaks the party. Dominic makes the call: "Storm's getting bad. Everybody home." Guests empty into the rain. CUT trance-walk and "They're already in the grass" delivered glassy-eyed — Dallas can say a grounded version of it, terrified and lucid.
- **s18.9 (street) — REWRITE:** Taillights one direction; **Dominic running the other way down the middle of the street in the rain, shouting her name**, pushing against the current of his own departing guests. Headlights sweep him — the host, mask off, in front of everyone he lied to all night. Makayla is a small figure at the grass line; she doesn't turn. Dallas catches up with the bag. They go in together.

### s19 — The Marsh Rescue — RETIRE → /archive/
Material that migrates:
- The empty-basement / live-laptop image (s19.1) → absorbed into new s18.7.
- "What happens when you hurt something that has no words..." (Dallas's line) → migrate to s24, on first clear look at the red-eyes.
- The oscillator-as-corridor idea → available for s24/s25 if needed.
Everything else (trance walk, rescue, "we end this") is cut by design.

### s22 — The Load-Out — RETIRE → /archive/
Material that migrates:
- Makayla clipping the scuffed recorder to Dominic's jacket ("It stays on you") → **migrate to the blind waypoint beat** (new s22, below). This must survive — it pays off in s25 when the recorder tears off his jacket to join the swarm.
- The blind interior (maps, mother's charts under her newer lines) → same.

### NEW s22 — The Blind (waypoint) — WRITE
Short scene. Dominic and Dallas, tracking Makayla's dot, reach the blind. **Dominic has never seen it** — his sister built a second home in the woods and he never knew. Beat of him taking in the charts: mother's handwriting again, decades of it. Makayla is there for seconds only — grabbing the speaker, checking the live node feed — or has just left (choose in drafting whichever plays faster; do not let this scene breathe long, it's a waypoint mid-chase). The recorder-clip beat happens here if she's present; if she's already gone, the recorder is left FOR Dominic with intent (weaker — prefer she's present). They see on her feed how many red signals there are. They go in.

### s23 — The Trench Run — KEEP, REFRAME
Same beats (sensory deprivation, signal loss, patrol near-miss, LED cover). Reframe: they are chasing **Makayla's** dot, not carrying the baby. Remove all backpack/baby-carrying references. Makayla is AHEAD of them, not leading them — adjust the single-file blocking accordingly (Dallas and Dominic only; Makayla's green LED glimpsed ahead through the grass can replace the tracker-following logic).

### s24 — The Sanctuary & The Siege — KEEP, ADJUST OPENING
- Makayla breaches the clearing FIRST and ALONE (before Dallas/Dominic arrive): witnesses the baby arrive on its own legs and reunite with the mother. The ring of red-eyes closes **with her inside it.**
- Dallas and Dominic break through the reeds into an already-forming siege. Dominic's reunion-witness lines redistribute (he arrives seeing his sister inside the ring — his line priority is her).
- Migrate Dallas's "what happens when you hurt something golden" line here.
- Remove baby-in-backpack beats (Dominic no longer carries it).

### s25 — The Final Blast — KEEP RESOLUTION, ADD BLASTER TRIGGER
The recorder swarm, the halo, the red-eyes collapsing into dead leaves, the mother's death, the baby's dissolve — **all preserved as written.** The change: the blaster becomes the *seed of the choir*, bridging "one source was never going to be enough" to the swarm.

> **OPEN DECISION — DECIDE BEFORE PASS 1:**
> **Option 1 (Dominic fires it):** Dallas, pinned to the oscillator, cannot bring himself to broadcast Sierra's cassette — spending the last of her voice. Dominic grabs the bag, flips the taped toggle, fires. The recorders hear Sierra's recording of the call, pick it up, relay it → swarm. The no-tech brother pulls the trigger; Dallas is released from having to.
> **Option 3 (nobody fires it):** Dallas raises the blaster — and lowers it. Plays the cassette quietly as an offering instead. The mother recognizes Sierra's song (Sierra recorded HER, years ago) and SHE pulls the recorders out of the ground. Human contribution is restraint; red-eye collapse reads as release, not defeat. Directly sets up s28.4 (the hum matches Sierra's song).
> Either way: the recorder tearing off Dominic's jacket stays.

### s26–s28 — Aftermath — KEEP, LIGHT PATCH
- s26: "Thanks for letting everyone crash here" — verify this still makes sense (life group dispersed home in new s18; nobody crashes at Dallas's). Likely cut or rewrite the line.
- s27/s28: unchanged. If Option 3 chosen for s25, s28.4's Sierra-song revelation is a confirmation rather than a surprise — no text change required, but note it.

---

## 4. Blaster continuity thread (verify end-to-end after edits)

s17 (built: creature's call processed onto cassette, loaded into Makayla's soother rig, Sierra's recorder involved) → s17d (packed into field bag, bag by attic stairs, then on Dallas's back at life group) → new s18 (bag goes into the marsh on Dallas's back) → s25 (fired or consciously not fired, per decision). **The bag must never teleport.** Check every scene between 17d and 25 for the bag's location.

NOTE: s17d says Sierra's cassette is loaded in the deck; s17.2 says a *processed copy* on a blank cassette went into the rig while the original stayed with Dallas. Reconcile: recommend the **original Sierra cassette is in the rig** (higher stakes for the fire/don't-fire decision), with the processed-copy language in s17.2 adjusted, unless s17 footage is SHOT — then conform to footage.

## 5. Location logic (locked — applies to all scenes)

- **The basement (Dominic's house) = the archive.** Mother's original maps, decades of labeled cassettes, stored recordings. Memory. Nothing in it listens live. Dominic has coexisted with it for years, filed under "quirky sister," never read it.
- **The blind = the ear.** Live collection point for the entire node network. Makayla's own construction; mother's charts under her newer bearing lines. Present tense.
- **The nodes = the senses.** Amber devices distributed across marsh and neighborhood; first shown in the opening montage (s00a) — s15 is the answer to the film's first mystery.

Any scene that confuses these roles (e.g., live monitoring in the basement, archival storage at the blind) gets flagged.

## 6. Continuity grep list (run after all edits; report every hit with file + line)

- `Jace` — old character name
- `vision` / `trance` / `glassy` / `sleepwalk` — trance mechanic removed
- `backpack` in s22–s25 range — baby is never carried
- `wedge` — Makayla's paint-stirrer wedge; its failure should be visible/implied in new s18.7
- `crash here` — s26 line to verify
- `load-out` / `gear up` — retired scene references
- `We end this` — retired s19 dialogue
- Scene-number references inside summary comments that point at retired scenes

## 7. Out of scope for Pass 1 (save for humanize pass)

- Dialogue polish and texture
- s17 redundant-discovery trim (per existing NOTE comment)
- Property manager scene tightening
- Typos and formatting inconsistencies in shot scenes (s00b `PROPERTY MANAGERDown and around`, s16 `drapped`, `suspciously`, s27 `mechniasm`, s17 `DALLS`)
- Pat Clendenen / Mary / Josh voice consistency across life group and aftermath
