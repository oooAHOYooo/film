# CITG Restructure Handoff Package

Built 7/5/2026 from full script compile v24. Drop this folder into the CITG repo (suggested:
`/restructure/` at repo root, next to the scene files).

## Contents

```
CITG_RESTRUCTURE_BRIEF.md          The spec. Source of truth for all decisions.
reference_drafts/
  s18.md                           Full rewrite — Life Group with Makayla's walkout,
                                   Dominic's recognition beat, the street chase.
  s22.md                           NEW scene — The Blind (waypoint mid-chase).
                                   Replaces retired Load-Out.
  s25_trigger_option1.md           Blaster beat: Dominic fires it.
  s25_trigger_option3.md           Blaster beat: nobody fires it (the offering).
patches/
  PATCHES.md                       Explicit edit instructions for s07, s15, s19 (retire),
                                   s22-old (retire), s23, s24, s25, s26 + grep list.
```

## Before running anything — two human decisions

1. **Fill in the shot-status table** in the brief (Section 1). Scenes marked SHOT are never
   rewritten — conflicts become pickup notes instead.
2. **Pick the s25 blaster option** (brief, Section 3 → OPEN DECISION). Delete the unused
   trigger draft or move it to /archive/. Note: staging is nearly identical up to the toggle
   moment, so it's coverable both ways on the day if still undecided at shoot time.

## Claude Code kickoff prompt (paste as-is after the two decisions above)

> Read restructure/CITG_RESTRUCTURE_BRIEF.md, restructure/patches/PATCHES.md, and everything in
> restructure/reference_drafts/. These are the spec and reference drafts for a structural rewrite
> of the back half of the script. The reference drafts define target content and voice — conform
> repo scene files to them, preserving our file conventions (scene comment blocks, (action)
> markers, summary comments, GOING TO FILM tags).
>
> Rules: never modify a scene marked SHOT in the brief's status table — propose pickup notes in
> comments instead. One scene file per commit, message format "sNN: what changed". Retired scenes
> move to /archive/, never deleted. Do not invent story decisions not in the brief — stop and ask.
> No dialogue polish beyond the reference drafts; this is Pass 1 (structure) only.
>
> Order of operations: (1) s07 patch — smallest change, use it to confirm you're preserving
> conventions correctly, then wait for my review before continuing. (2) Retire s19 and old s22 to
> /archive/. (3) Install new s18 and s22 from reference drafts, merging with any SHOT-scene
> constraints. (4) Apply s23 and s24 patches. (5) Splice the chosen s25 trigger. (6) s26 line fix.
> (7) Run the full grep list from PATCHES.md and report every hit with file and line. (8) Recompile
> the full script and verify the compile has no duplicated scenes.

## After Pass 1

Read the new compile top to bottom once, clean, before any Pass 2 work. Then request a separate
humanize-pass brief: per-character voice notes (Pat, Mary, Josh, Tyler consistency across life
group and aftermath), texture targets per scene, and the typo/format cleanup list (brief,
Section 7). Keep Pass 2 in a fresh Claude Code session so structural context doesn't bleed into
line-editing judgment.
