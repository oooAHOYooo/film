# PATCHES — Keep-but-adjust scenes (Pass 1)

Explicit edit instructions for scenes that are NOT rewritten wholesale. Claude Code: apply these to
the repo source files, one file per commit. If any of these scenes is marked SHOT in the brief's
status table, convert the patch to a pickup/reshoot note in a comment block instead of editing.

---

## s07 — The Coordinates

1. Change slug `INT. JACE'S BASEMENT` → `INT. DOMINIC'S BASEMENT`.
2. Grep the entire repo for `Jace` and report all hits before changing anything beyond the slug.
3. No content changes. This scene establishes the basement as THE ARCHIVE (mother's maps, labeled
   cassettes, "This was once, all of our basement - but Makayla took it over"). Leave it intact —
   it's load-bearing for Dominic's recognition beat in the new s18.6.

---

## s15 — The Tracking Network

1. In s15.1, adjust the device-planting action so Makayla is EXTENDING the existing network toward
   Dallas's side of the marsh, not starting it. Suggested revision of the action line:

   > As they cut through the reeds, Makayla stops every so often to press small devices into the mud
   > at the base of the stalks. Each one blinks a slow, faint amber as it powers on — new nodes,
   > joining a net that has been out here far longer than Dallas has.

   And in the dialogue exchange, her line can carry it:

   > DALLAS: How many of these are out here?
   > MAKAYLA: Enough to cover the whole marsh. These are for your side. The signal moved when you did.

2. LIKELY SHOT (Day 4, 6.13.26) — if so, do not edit; existing footage probably supports this
   reading already. Log as a note.

---

## s19 — The Marsh Rescue → RETIRE

1. Move file to `/archive/s19_retired.md` with header comment:
   `<!-- RETIRED in restructure. Trance rescue removed; single-night chase replaces it. Material migrated: s19.1 laptop image → s18.7; "what happens when you hurt something..." line → s24. -->`
2. Do not delete content.

---

## s22 (old) — The Load-Out → RETIRE

1. Move file to `/archive/s22_loadout_retired.md` with header comment noting the recorder-clip beat
   and blind interior migrated to the new s22 (reference_drafts/s22.md).
2. Install `reference_drafts/s22.md` as the new s22.md.

---

## s23 — The Trench Run

The beats stay (sensory deprivation, lost signal, red eyes, patrol drop, LED cover, near-miss).
The FRAME changes: Dallas and Dominic are chasing Makayla, who is AHEAD of them. Nobody carries the
baby.

1. Remove Dominic's backpack entirely: delete/rewrite every reference to `the backpack with the
   baby`, `clutching the backpack`, `holds the backpack completely still`, `re-shoulders the
   backpack with the baby`.
2. Opening (s23.1): currently Makayla leads with the tracker and Dominic "appears, running toward
   them" having seen the creature. Rewrite the opening so:
   - Dallas and Dominic enter the grass together, following glimpses of Makayla's green chest-rig
     LED ahead through the stalks.
   - Cut Dominic's "I saw it. It was right there and then it was gone." (He hasn't seen the
     creature tonight.) Replace with a Makayla-directed beat, e.g. calling her name into the wind
     and getting nothing back.
3. Mid-scene: when the men lose her LED (the equivalent of the "signal's gone" beat), they are
   turned around in the dark WITHOUT her — this is the scariest stretch, two men who don't know the
   ground. The red eyes appear during this stretch, as written.
4. The patrol near-miss (s23.2–s23.3): reunite them with Makayla JUST BEFORE the Red-Eye drops —
   she doubles back for them ("Keep up" energy from new s22), then the patrol beat plays essentially
   as written: her hand over her own LED, the three of them flat in the mud, the bramble arms
   sweeping inches over their heads. Dominic's still hands now hold nothing — his stillness is for
   his sister pressed into the mud beside him.
5. Keep Dominic's "Never better. Just a light hike in the country." — it survives the reframe.

---

## s24 — The Sanctuary & The Siege

1. Restructure the opening (s24.1): MAKAYLA BREACHES ALONE, FIRST — ahead of the men by thirty
   seconds. She alone witnesses the reunion begin: the baby arriving on its own legs (it self-
   delivered; there is no backpack), stumbling across the flattened grass, the mother lowering her
   brow to it. Makayla lowers the tracker. Her whole life in the marsh has been leading to this —
   keep that action block, it's already written for her.
2. THEN the ring closes — with her inside it. The red-eyes burst through the perimeter as written,
   but Makayla is in the clearing when it happens.
3. Dallas and Dominic break through the reed wall INTO the forming siege. Dominic's first sight is
   his sister inside the ring — redistribute his awe beats accordingly. His whispered "That's its
   mother." can move to Makayla or become Dominic's on arrival, drafter's choice.
4. Remove all backpack/carrying beats ("Dominic swings the backpack around and kneels..." etc.) —
   replace with the baby completing its own crossing to the mother.
5. Migrate in Dallas's line from retired s19, placed on the men's first clear look at the massed
   Red-Eyes:
   > What happens when you hurt something that has no words to tell you it's in pain. What happens
   > when the mercy dies but the creature lives.
6. Keep everything from the mother's bow onward as written, through Makayla's speaker overheating
   and Dallas dropping to the oscillator.

---

## s25 — The Final Blast

1. Keep v24 as the base. Splice in ONE of the two trigger drafts
   (reference_drafts/s25_trigger_option1.md or s25_trigger_option3.md) per the decision in the
   brief, Section 3.
2. The recorder tearing off Dominic's jacket stays in both options.
3. Everything from the halo through the baby's dissolve and "Come on. Let's go home." is unchanged.

---

## s26 — The Morning After

1. Verify/fix Dominic's line `Thanks for letting everyone crash here, Dallas.` — in the new
   structure, life group dispersed home before the marsh; nobody crashes at Dallas's house.
   Options: cut the line, or replace with a small exhausted exchange between the two men (and
   Makayla — decide whether she walks back with them; recommend YES, three of them through the tall
   grass in s26.1, since s27.4 shows her at the church picnic integrated with the group).

---

## Repo-wide greps after all patches (report every hit: file + line)

- `Jace`
- `vision` / `trance` / `glassy` / `sleepwalk`
- `backpack` (in s22–s25 range)
- `wedge`
- `crash here`
- `We end this`
- `load-out` / `gear up`
- `dog backpack` (s16 — this one is fine, it's the transport home in Act II; do NOT remove)
