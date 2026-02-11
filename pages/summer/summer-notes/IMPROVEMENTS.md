# Creatures in the Tall Grass — Improvements

## The Big Idea

Every act is a trip into the tall grass. Each trip goes deeper. Each trip gets weirder.

| Act | Trip | Tone |
|-----|------|------|
| I | Dallas wanders in casually to record sounds. Hears something that shouldn't exist. Walks out rattled. | Curiosity → unease |
| II | Dallas goes in deliberately. Finds the dying creature. Brings it home. Something chases him out. | Discovery → fear |
| III | Makayla runs in. Dallas follows. They find the creatures, face the predators, it resolves. | Desperation → awe |
| IV | Dallas walks to the edge. Doesn't go in. Tunes the dial from outside. The dial clicks. | Stillness → acceptance |

Act IV is the act where he DOESN'T go in. That's the growth.

---

## 5-Minute Tasks

Do these in order. Each one is small. Don't skip around.

---

### Round 1 — The First Trip (Act I)

**Task 1.1 — Write the first grass scene (5 min)**
Before Dallas goes into town for batteries, he steps into the tall grass behind his house. Just a few yards. He's testing his equipment. Write 8-10 lines of screenplay:
- Slugline: EXT. TALL GRASS - BEHIND DALLAS'S HOUSE - DAY
- He walks in casually, scope in hand
- The readings are normal at first, then spike into a pattern he doesn't recognize
- A sound — not wind, not birds, not insects — something tonal
- He records it. Looks deeper into the grass. Decides not to go further.
- He walks back to the house and the readings go flat
- Save as a new scene file: `02b_first_grass.md` (or renumber later)

**Task 1.2 — Connect it to the battery walk (5 min)**
Open `01_arrival.md`. Add 2-3 lines at the end where Dallas looks at the dead equipment, looks back at the grass, then heads into town for batteries. The grass is now the reason he leaves the house — not just dead batteries. He wants better equipment because he heard something real.

**Task 1.3 — Plant the first grass mention in Dominic's dialogue (5 min)**
Open the fellowship/walk scenes (03-05). Find a spot where Dominic is talking about the neighborhood. Add one line where Dominic mentions the tall grass casually: something like "Nobody goes back there" or "kids used to play in there but the ticks got bad" — something mundane that later becomes ominous. One line. That's it.

**Task 1.4 — Update the manifest (5 min)**
Add the new grass scene to `manifest.json` in the right position (after arrival, before the battery walk). Don't recompile yet — just get the manifest right.

**Task 1.5 — Recompile and read (5 min)**
Run `node pages/summer/script-system/compile.js`. Read the first 5 scenes of `full_script.md`. Does the first trip feel natural? Does it make you want to know what's in the grass? If yes, move on. If not, note what feels off and come back later.

---

### Round 2 — Strengthen Act II's Trip

**Task 2.1 — Reread scenes 11-14 (5 min)**
Read `11_howie_walk.md`, `12_the_burn_mark.md`, `13_entering_grass.md`, `14_creature_rescue.md` back to back. This is Dallas's second trip into the grass. Ask yourself: does it feel different from the first trip? It should be scarier, more deliberate. Note what's missing.

**Task 2.2 — Add a callback to the first trip (5 min)**
In `13_entering_grass.md`, add 2-3 lines where Dallas recognizes the pattern on his scope — it's the same waveform from his first trip, but stronger. He knows this frequency. That's why he ties up Howie and goes in. He's not exploring anymore — he's following something he heard before.

**Task 2.3 — Make the creature's sound specific (5 min)**
In `14_creature_rescue.md`, you describe the creature's back-holes making sound. Add one concrete detail about what the sound reminds Dallas of. His wife's voice? A specific recording? A lullaby? Something that explains why he can't walk away. One line of internal reaction.

**Task 2.4 — Add the "something chasing" beat (5 min)**
Check `16_the_escape.md` (13 lines). This is where something charges through the grass at Dallas. Expand by 5-7 lines:
- The sound of the grass parting behind him — not wind, something heavy
- His scope going haywire — readings he's never seen
- Dallas running with the creature in his coat, Howie pulling at the tree leash
- The sound stopping exactly at the tree line, like it won't cross into the open

**Task 2.5 — Compile and read Act II (5 min)**
Recompile. Read scenes 11-17. The second trip should feel like: "I've been here before but something has changed." If it does, move on.

---

### Round 3 — Fix Act III (The Big One)

**Task 3.1 — Move the perimeter fence to Act II (5 min)**
The fence-building currently happens mid-Act III. It belongs after the creature disappears (scene 23). Open `23_creature_missing.md` and add 4-5 lines at the end: Dallas goes outside, starts digging poles, stringing copper wire. He's scared. He's building a wall. This is a grief response — he couldn't protect his wife, he couldn't keep the creature, so he builds a fence.

**Task 3.2 — Cut the first Act III scouting trip (5 min)**
The treatment has Dallas and Makayla going into the grass, finding the creature group, getting paralyzed by mist, then walking home, THEN going back in. Cut the first trip. Open `24_marsh_confrontation.md`. Instead of a scouting trip, make this the scene where Makayla is restless on the porch, watching the grass, while Dallas monitors equipment. Build tension. They're waiting, not going in yet. 8-10 lines.

**Task 3.3 — Write Makayla's sprint (5 min)**
This is the ignition of Act III. Write a new version of the moment Makayla grabs the crystal and runs into the grass. 8-10 lines:
- The dinner scene is ending
- Mr. Mike is muttering 115.3 MHz
- Makayla stands up mid-sentence
- Dominic sees her face and knows — "Makayla, don't—"
- She's already out the door
- The sound spikes once, sharp, then cuts to silence
- Dominic at the edge of the grass, calling her name

**Task 3.4 — Consolidate into one climactic trip (5 min)**
`25_predator_attack.md` is 7 lines. This is supposed to be the most intense scene in the film. Expand to 20-25 lines:
- Dallas enters the grass alone (Dominic stays with Mr. Mike)
- The silence — wind outside but nothing in here
- He follows the coordinates from the napkin
- Finds Makayla holding a creature, dazed, with Asher and Dominic nearby
- The golden lights vs. the red eyes — describe it visually
- The creature sings. The predators freeze. Then retreat.
- Don't rush this. Let the images land.

**Task 3.5 — Write the walk home (5 min)**
After the climax, the crew walks out of the grass. Write 8-10 lines for `26_the_perimeter.md`:
- Nobody talks
- The storm is breaking
- Dallas looks back once
- They sit by the window all night
- Morning. Dallas puts equipment in the trash.
- Quietly — not dramatically. Just sets it on top of the garbage.

---

### Round 4 — Give Act IV Room

**Task 4.1 — The trash can scene (5 min)**
Start `28_final_echoes.md` from scratch. First beat: Dallas hears the hum through the kitchen window. He looks at the trash can. His equipment is right there. He stares at it. He takes it out. Wipes it off. This is the scene — he tried to let it go and he can't. 6-8 lines.

**Task 4.2 — The church lunch (5 min)**
Add a scene or expand 28: Dallas and Dominic at the church lunch, not talking. Eating Nica's. Watching the kids. Makayla puts a caterpillar in a jar. Asher is sketching something — maybe one of the creatures from memory. 6-8 lines. This is the family forming without anyone acknowledging it.

**Task 4.3 — The alphabet (5 min)**
Dallas at his workshop. Playing his wife's tape. Recording the hum. Writing symbols — not equations, not science, but an alphabet. He's learning to speak the creature's language. 5-6 lines. Keep it quiet.

**Task 4.4 — The final beat (5 min)**
Janice drops off Howie. Dallas and Howie at the edge of the grass. Howie's ears perk up. Dallas tunes the dial. It clicks into place. Hold on Dallas's face. He hears something. We don't hear it. Cut to black. 4-5 lines. Don't overwrite this. Let it end.

**Task 4.5 — Final compile and full read (5 min)**
Run the compiler. Read the full script start to finish. Don't edit. Just read. Note anything that feels wrong on a piece of paper. Come back to it later.

---

### Round 5 — Cleanup

**Task 5.1 — Check for orphan scene files (5 min)**
`05_news_vans.md` and `06_janice_arrival.md` exist but may be duplicates from the renumbering. Compare them to the manifest versions (`05_news_vans.md`, `08_janice_arrival.md`). If they're old versions, delete them. If they have unique content, merge the good parts.

**Task 5.2 — Fix the equipment contradiction (5 min)**
Search the script for any moment where Dallas uses equipment after the "trash" beat. Make sure the trash-then-retrieval order is clear. If you kept the trash moment, the retrieval in Act IV needs to exist on the page.

**Task 5.3 — Mr. Mike's payoff (5 min)**
Mr. Mike mutters "115.3 MHz" and scratches coordinates. Does Dallas ever use these? If not, add a line in Act III where Dallas pulls out the napkin with coordinates and they match Mr. Mike's numbers. One line. That's the payoff — Mr. Mike knew all along.

**Task 5.4 — Pat Clendenen's red eye (5 min)**
In Act IV, the treatment says a red eye appears behind Pat on camera. Write this as a scene direction: be specific about how brief it is. "A single red pulse in the fog behind Pat's left shoulder. It blinks once. Pat doesn't notice. Nobody does." This is your sequel hook. Don't oversell it.

**Task 5.5 — Update the treatment (5 min)**
Run `node update-treatment.js` to version the treatment. In the version notes, write: "Restructured — every act is a trip into the grass. Consolidated Act III. Expanded Act IV." Push when ready.

---

## Notes to Self

- The story is about a man who listens for a living, learning to hear something that isn't human. That's it. Every scene should serve that.
- The tall grass is not a location. It's a threshold. Every time someone crosses it, they come back different.
- Makayla is the one who isn't afraid. That matters. She's the future.
- Mr. Mike isn't crazy. He's the only one who's been listening all along.
- The predators eat sound. (Consider this: when they get close, everything goes silent. Dallas's equipment flatlines. For a man who lives by sound, silence is the scariest thing.)
- The ending isn't about answers. The dial clicks into place. Dallas can hear them now. That's enough.

---

## Lore Bible — The Creatures, The Predators, The Storm

*None of this is exposition. None of it goes in dialogue. This is what YOU know as the filmmaker so that every shot, every sound cue, every actor direction has weight behind it. The audience should feel this without anyone explaining it.*

---

### The Marsh — Why Branford

The Branford salt marsh sits where the Branford River meets Long Island Sound. Salt marshes are acoustic anomalies — the dense spartina grass, the shallow tidal channels, the mineral-heavy soil all create natural waveguides that trap and amplify low-frequency sound. Indigenous Mattabeseck people called the area something that roughly translates to "the place that hums back." European settlers ignored this. The marsh was drained, farmed, abandoned, and eventually grew wild again. The tall grass reclaimed it.

The creatures didn't come to Branford. They've always been in the marsh. The marsh grew around them.

---

### The Creatures (The Singers)

**What they are:** Ancient organisms — not extraterrestrial in the UFO sense, but not from any taxonomy humans have built. They predate the marsh. They may predate the continent. Think of them the way you'd think of deep-ocean vent organisms: life that evolved in conditions so different from ours that they seem alien, but they've been here longer than we have.

**How they live:** They exist in the root system of the salt marsh. The tall grass is not their habitat — it's their body. The spartina grass grows the way it does because the creatures' hum feeds the root network. The grass is taller here, denser here, more golden here because something underneath is singing to it. The creatures and the marsh are symbiotic. The grass protects them. They feed the grass with vibration.

**How they communicate:** Through resonance. The holes in their backs are not lungs — they're instruments. Each creature has a unique tonal signature, like a fingerprint made of sound. When they hum together, the frequencies stack into chords. A group of creatures in harmony can bend the air around them, create localized pressure changes, even produce visible light (bioluminescence triggered by specific frequency thresholds). This is the golden glow.

**The crystals:** Compressed resonance. When a creature hums in one place long enough — years, decades — the mineral salts in the marsh soil crystallize around the frequency. The crystals are fossilized sound. They vibrate at the creature's home frequency. That's why Makayla's hair stands up when she touches one — it's still humming. The crystals are also how the creatures navigate: they leave tonal breadcrumbs. A crystal is a waypoint, a marker, a "someone was here."

**Life cycle:** The creatures live long — centuries, possibly longer. They're small because they don't need to be big. Size is for predators and prey that operate in physical space. The creatures operate in acoustic space. Their power is frequency, not mass. The young ones glow brighter but hum quieter. The elders glow dimmer but their hum can paralyze a human nervous system.

**Why the injured one was dying:** It was cut off from the chord. A creature alone can't sustain its own resonance — it needs at least one other to create a harmonic. Alone, its frequency decays. Its glow fades. The back-holes lose pressure. It's not bleeding out — it's going silent. That's death for a Singer: silence.

---

### The Predators (The Eaters)

**What they are:** The same species. Or they were, once.

A Singer that is cut off from the chord for too long doesn't just die — it inverts. The frequency collapses inward. Instead of producing sound, it begins to consume it. The back-holes seal over. The glow shifts from gold to red. The creature grows larger because it's feeding now — absorbing vibration from everything around it. Grass. Soil. Air. Other creatures.

The Eaters are Singers that went silent and survived anyway. They are what happens when resonance turns to hunger.

**How they hunt:** They don't roar. They don't screech. They create silence. When an Eater gets close, sound dies around it — a radius of nothing. Dallas's equipment flatlines. Birds stop mid-call. Wind seems to stop. The silence is the danger. For a bioacoustics researcher, this is existential horror — the world going mute.

They hunt by surrounding a Singer and collapsing the acoustic space around it. The Singer can't hum, can't call for help, can't sustain its glow. Alone and silent, the Singer's frequency is absorbed by the Eater. The Eater grows. The Singer fades.

**The red eyes:** Not eyes. Inverted resonance chambers — the sealed-over back-holes, now glowing red from the compressed energy inside. They pulse because the stolen frequencies are unstable. The Eaters are in pain. They're always in pain. They eat sound to survive but they can never produce it again. They remember what harmony felt like. That's what makes them vicious.

**Why they circle but don't always attack:** They're afraid of the chord. A group of Singers humming in harmony creates a frequency wall the Eaters can't penetrate. The golden light isn't just pretty — it's a weapon. It pushes the Eaters back. But a lone Singer, or a weakened group, is vulnerable. The Eaters wait for the chord to break.

**Why they won't cross the tree line (yet):** The marsh grass amplifies the Singers' frequency. Open ground doesn't. Outside the grass, the Singers' hum dissipates and the Eaters have no frequency to feed on. The open yard is acoustically dead space — nothing to hunt, nothing to eat. But the storm is changing that.

---

### The Storm — Why Now

**The Nor'easter is an acoustic event.**

A major coastal storm changes barometric pressure dramatically. Pressure changes affect how sound travels — low pressure allows low frequencies to travel farther, penetrate deeper, resonate longer. The approaching Nor'easter is literally lowering the acoustic floor of Branford.

What this means:
- **The Singers' hum can now be heard outside the marsh.** Dallas hears it from his house because the storm is carrying frequencies that normally stay trapped in the grass. His equipment spikes because signals that have been inaudible for centuries are suddenly bleeding through.
- **The Eaters can now feed outside the grass.** The storm is expanding the acoustic range of the marsh. The tree line isn't a hard border anymore. Sound carries further, which means the Eaters' silence-radius extends further. The burn marks on Janice's van, on the side of the house — those are spots where an Eater lingered long enough to drain the residual vibration from the metal and wood. Scorch marks from silence.
- **The crystals are activating.** The pressure change is vibrating crystals that have been dormant for years. Makayla's crystal glows because the storm woke it up. All across the marsh, old waypoints are lighting up — which is why the creatures are surfacing. They're following the crystal network, which is suddenly louder than it's been in a long time.
- **Mr. Mike has been through this before.** He remembers the last big storm — maybe 40, 50 years ago. He heard the hum then. He saw something. Nobody believed him. The numbers he scratches — 115.3 MHz — that's the frequency he heard. He's been carrying it in his body ever since. The dementia isn't just age — the residual frequency has been degrading his cognition for decades. He's not muttering nonsense. He's tuned to a channel nobody else can hear.

**After the storm passes:** The pressure normalizes. The frequencies retreat back into the marsh. The Eaters lose range. The tree line becomes a border again. The town goes back to normal. Pat Clendenen calls it a miracle. But the marsh is still humming. It always was. The only thing that changed is that Dallas can hear it now.

---

### Dallas's Wife — The Research

She studied infrasound — sound below the threshold of human hearing (below ~20 Hz). Her thesis, never finished, was about "the Hum" — a real phenomenon where people in certain locations report hearing a persistent low-frequency drone that no one can identify or locate. Windsor Hum. Taos Hum. Bristol Hum. She believed the Hum wasn't mechanical or geological. She believed it was biological — something alive, somewhere, producing a frequency that human ears could almost but not quite detect.

She was right.

She never found the source. She died before she could. Dallas carries her equipment — the same Oscillio device, the same scope — not because it's the best gear, but because it's hers. When the creature's back-hole frequency syncs perfectly with his readings, he's not just witnessing a scientific discovery. He's completing her work. The creature is the answer to the question his wife spent her life asking.

The tape he plays at night — her voice talking about the Hum, about why she had to stop researching — she stopped because she was getting sick. The frequency was affecting her. She didn't know it. Dallas might suspect it but can't face it. The Hum didn't kill her directly, but it pulled her toward something her body couldn't sustain. That's why Dallas puts the equipment in the trash. He's not just done with the creatures. He's afraid of becoming her.

He takes it back out because he's more afraid of not listening.

---

### Character Backstory Facts

**Dallas**
- 38 years old. Hired at Quinnipiac to start next semester.
- His wife, Elena, died 2 years ago. Cancer, but she was also an infrasound researcher who spent years in high-exposure acoustic environments. Dallas has never said the two are connected out loud.
- He chose Branford because Elena had circled it on a map once. She never told him why. He found the map after she died.
- He doesn't talk about Elena to anyone. The photo sticker on the Oscillio is the only visible evidence she existed. Everything else is in boxes he hasn't opened.
- He's not antisocial — he's hollowed out. Dominic fills the space because Dallas doesn't resist it.

**Dominic**
- 52 years old. Lost his wife and young son in a car accident 7 years ago.
- Took in Mr. Mike (his father-in-law) afterward. Not out of obligation — out of guilt. He was supposed to be driving that day.
- The church, the life group, the fellowship lunches, the cooking, the Costco runs — this is how Dominic keeps moving. If he stops doing things for people, he'll have to sit with what happened.
- He builds community around himself compulsively. Dallas is his newest project. He doesn't know it yet, but Dallas is the first person he's met who understands loss without needing it explained.

**Makayla**
- 22. Janice's daughter. Pre-med dropout. Currently "figuring things out."
- She dropped out because she couldn't stop asking questions her professors didn't want to answer. She's not a rebel — she's genuinely curious in a way that makes structured learning feel suffocating.
- She touches the crystal without fear because she doesn't filter experience through caution. She processes by doing, not analyzing. This is the opposite of Dallas, which is why they work well together.
- She has no grief arc. She's the only main character who isn't carrying loss. That's why the creatures respond to her — she's resonant. No interference. Clean signal.

**Asher**
- 15. Makayla's younger brother. Quiet. Observant.
- He's the one who notices patterns — the burn marks leading to the window, the trail of crystals. He doesn't say much about what he sees. He just sees it.
- He sketches constantly. After the events of the film, he starts drawing the creatures from memory. He'll never stop.

**Mr. Mike**
- 78. Dominic's father-in-law.
- Former merchant marine radio operator. Spent 30 years on ships in Long Island Sound and the Atlantic. He heard the Hum decades ago — on a still night off the coast of Branford, his radio picked up a signal on 115.3 MHz that wasn't on any chart. He followed it. He saw something in the water — a glow beneath the surface, moving toward the marshes. He never reported it. Nobody would have believed him.
- The frequency lodged in him. Over the years, it degraded his cognition — not like normal dementia, but targeted. His memory for everyday things eroded, but his recall of the frequency is perfect. He can reproduce the exact tone by humming. He scratches the numbers because his hands remember what his mind is losing.
- When he says "She's here" or "They're coming" — he's not confused. He's the most accurate sensor in the house.

**Janice**
- 45. Dominic's sister. Works at the Branford museum.
- Practical, impatient, loving in a loud way. She doesn't have time for mystery — she has two kids, a job, and a brother who takes in strays (Dallas, Mr. Mike, half the church).
- She never sees the creatures directly. She sees the burn marks, the strange weather, her daughter running into the grass. She represents the town — the people who live next to the extraordinary and never look closely enough to see it.

**Howie**
- Janice's dog. Small. Anxious. Loves Dallas immediately.
- Animals hear frequencies humans can't. Howie has been hearing the Singers his whole life. He's not afraid of the hum — he's afraid of the silence. When the Eaters are near, Howie goes still. That's the tell.

---

### Things That Should Be True But Never Said Out Loud

1. Elena chose Branford on the map because she detected a frequency anomaly in old maritime radio logs from Long Island Sound. She was planning to investigate before she got sick. Dallas doesn't know this — he thinks she circled it randomly.

2. Mr. Mike and Elena never met, but they heard the same signal — 40 years apart, on the same frequency. 115.3 MHz.

3. The Singers have a name for the marsh. It's a chord — three tones played simultaneously. If a human could hear it, it would sound like a lullaby. The creatures have been singing the same song for thousands of years.

4. The Eaters remember the song. They just can't sing it anymore. That's why they circle instead of attacking immediately — they're listening. For a moment, before they feed, they hover at the edge of the chord and remember what they lost.

5. Dallas's dial clicking into place at the end of the film means he's found 115.3 MHz. He's tuned to the frequency Mr. Mike has been carrying for decades, the frequency Elena spent her life chasing. He's the third human to hear it clearly. He won't be the last.

6. The caterpillar Makayla puts in a jar in Act IV isn't just a caterpillar. Watch how it moves. Watch how it hums.

---

## Readiness Check — June 2026 Shoot

### What's ready
- Story and treatment are solid through all 4 acts (v1.11, 17 drafts deep)
- Acts I and II are well-scripted — scenes 01-21 are real screenplay pages with dialogue, action, beats
- Production docs, wardrobe, location scouts — done
- Tooling pipeline works (compile, version, deploy)
- You know Branford and these characters

### What's not ready
- **Scenes 23-28 are stubs.** 7-11 lines each. You cannot shoot Act III/IV off what's on the page. Actors need real scenes.
- **The structural rework** (every act = a trip into the grass) needs to be executed in the actual scene files
- **Creature design** — do you have a practical/VFX plan? The back-holes, bioluminescence, downy fur. This is make-or-break and it's not in any production doc yet.

### The verdict
Not ready today. Can be ready by June if you do the 25 tasks above and lock the creature design. Five months is enough — but only if you start.

---

## Review — What This Film Can Be

**Sundance Film Festival 2027 — U.S. Dramatic Competition**

★★★★ (out of five)

### "A quiet stunner about grief, frequency, and the things that hum back"

There is a moment in **Creatures in the Tall Grass** where Dallas, a bioacoustics researcher played with extraordinary restraint, peels duct tape off a piece of military-grade audio equipment to reveal a photo sticker of himself and his late wife, both wearing headsets, laughing in a field. His thumb lingers on her face. He doesn't say anything. He doesn't need to. The rest of the film is about what happens when the world starts talking back to a man who has spent his whole life listening.

AG's debut feature drops Dallas into Branford, Connecticut — a coastal New England town rendered with the kind of specificity that suggests the filmmaker has walked every sidewalk in it. There are raccoon complaints, parking tickets, fellowship lunches with church-catered food, and brussels sprout arguments between siblings. The film is in no hurry. When Dallas meets his neighbor Dominic — warm, talkative, carrying his own quiet losses — the two orbit each other with the wary tenderness of men who know what absence feels like but won't name it.

The genre elements arrive the way weather does in southern Connecticut: gradually, then all at once. A hum from the salt marsh. Equipment that spikes and dies. Burn marks in the yard. And eventually, deep in the tall grass behind Dallas's house, a dying creature — birdlike, fragile, with downy fur and rabbit ears — that doesn't cry from its mouth. Instead, sound pours from delicate holes in its back, like air forced through a living reed. The holes flutter in sequence like fingers running a scale. It is one of the most original creature designs in recent memory, and the film wisely never over-reveals it.

What distinguishes **Creatures** from the current wave of indie sci-fi is its refusal to escalate in the expected ways. The supernatural elements are filtered through a deeply domestic lens: the creature is hidden during a church life group meeting. Its cries are covered up by hymn singing. Its makeshift hospital is a shoebox in a basement. The most terrifying moment in the film isn't the red-eyed predators circling in the marsh — it's Mr. Mike, the elderly man Dominic cares for, scratching numbers into a wooden end table and muttering "115.3 MHz" while everyone politely ignores him. He has been hearing the frequency longer than anyone. Nobody listened.

Makayla, Dominic's 22-year-old niece, is the film's secret weapon. Where Dallas approaches the creatures with scientific caution and Dominic with protective anxiety, Makayla operates on pure instinct. She touches the crystal without hesitation. She adjusts Dallas's equipment and his readings jump. When the moment comes, she grabs the crystal and sprints into the tall grass without a word, and the film shifts from slow-burn unease into something genuinely breathtaking. Her sprint is the hinge of the entire film.

The climactic sequence in the marsh — golden bioluminescent lights rising like lanterns against circling red eyes — could have tipped into spectacle, but AG keeps it grounded in Dallas's perspective, filtered through his scope and his readings. The sound design carries the weight. When the creatures sing, you feel it in your sternum. When the predators close in, you feel the absence of sound. That's the real horror here: not noise, but silence.

The final act is small and perfect. Dallas puts his equipment in the trash. Then takes it back out. He plays his wife's tape one more time and starts building an alphabet from the hum. He's not trying to capture it or study it anymore. He's learning to speak it. The last image — Dallas at the edge of the tall grass, tuning the dial until it clicks into place, Howie beside him — is the kind of ending that sits with you for days. He doesn't go in. He doesn't need to. He can hear them from here.

**Creatures in the Tall Grass** is a film about a widower who moves to a small town and discovers aliens in the marsh, and it barely raises its voice the entire time. It is a film about listening — to grief, to frequency, to the people around you, to the things that hum beneath the surface of the world. It belongs on a shelf next to **Arrival**, **Beasts of the Southern Wild**, and **The Vast of Night**. It is one of the best films at the festival.

*Premiered at Sundance Film Festival 2027. An A24 release. 93 minutes.*

*"The tall grass is not a location. It's a threshold. Every time someone crosses it, they come back different."*



## NEW SUGGESTED 
*2.11.26

Based on the script provided, the plot you outlined matches some parts of the story, but there are several key differences in the sequence and specific details.

Here is a breakdown of what happens in the script versus your list, followed by a checklist of scenes to add or adjust to reach your desired story:

Does this happen in the script?

Dallas finds creature: Yes. In Scene 7, Dallas finds an injured, bioluminescent creature in the marsh and brings it home.
+1


Makayla also finds creature with Dallas: Close. She doesn't find it with him in the marsh, but she discovers it in his kitchen in Scene 11/12.
+1


Lifegroup Creature freak out: Not yet. The script mentions Lifegroup is scheduled for Thursday at Dallas's house, but the provided text ends before the meeting occurs.
+1


Creature Escapes / Creature Dies: Not yet. The creature is currently alive and being treated by Dallas in an aquarium.
+1


Dark Shadow Fight: Not yet. Dallas sees "dark shadows" in the grass, but there has been no physical fight or marking of the characters so far.


Building the Device: In progress. Dallas and Makayla have discussed his oscillator and how it might track the creatures, but they haven't built a new rescue device yet.
+2

Checklist to reach your plot (Scene-by-Scene Additions)
To align the script with your specific vision, you would need to add or modify the following scenes:

[ ] Scene 14: The Lifegroup Discovery

Action: During the church Lifegroup meeting at Dallas’s house, the creature (likely in the aquarium) is discovered by the group.

Result: Chaos ensues as the neighbors/church members react with fear or wonder (the "freak out").

[ ] Scene 15: The Escape and Death

Action: In the panic of the Lifegroup meeting, the creature escapes into the backyard/marsh.

Action: Dallas and Makayla track it, only to find it has succumbed to its injuries or the environment.

[ ] Scene 16: The Shadow Confrontation


Action: While mourning the creature, the "Dark Shadows" (the spindly figures from Scene 10) emerge from the tall grass.

Action: A physical struggle occurs. The shadows leave physical "marks" on Dallas and Makayla (perhaps bioluminescent burns similar to the ones found in the yard ).

[ ] Scene 17: Engineering the Solution


Action: Realizing the shadows are a threat and the creatures are the key, Makayla and Dallas use the "weird stone" she found  and Dallas’s military-grade oscillators to build a specialized communication/rescue device.

[ ] Scene 18: The Second Rescue

Action: They return to the "Hollow" in the tall grass during the peak of the storm.

Action: They activate the device, which successfully calls to the remaining creatures or protects a new one from the shadows.

[ ] Scene 19: The Departure

Action: The device opens a path or frequency that allows all the creatures to leave the marsh safely.


Action: As they leave, the atmospheric pressure changes, causing the predicted "Nor'easter" to dissipate or move out to sea.

[ ] Scene 20: The Aftermath

Action: The "Storm is missed." The neighborhood is safe, and the tall grass returns to being just grass, though Dallas and Makayla still bear the marks of what happened.