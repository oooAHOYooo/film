#!/usr/bin/env node
// apply-shotlists.js — redesigns shot lists to liquid glass style and adds them to all days
const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// ─── HTML helpers ──────────────────────────────────────────────────────────────

function th() {
  return `                    <table style="width:100%; border-collapse:collapse; font-size:0.81rem;">
                        <thead><tr style="background:#f5f5f5;">
                            <th style="width:50px; padding:6px 12px; text-align:left; font-size:0.68rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#555; border-bottom:1px solid #e0e0e0;">SHOT</th>
                            <th style="width:78px; padding:6px 12px; text-align:left; font-size:0.68rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#555; border-bottom:1px solid #e0e0e0;">TYPE</th>
                            <th style="padding:6px 12px; text-align:left; font-size:0.68rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#555; border-bottom:1px solid #e0e0e0;">DESCRIPTION</th>
                            <th style="width:150px; padding:6px 12px; text-align:left; font-size:0.68rem; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#555; border-bottom:1px solid #e0e0e0;">NOTES</th>
                        </tr></thead>
                        <tbody>`;
}

function sl(label) {
  return `                            <tr><td colspan="4" style="background:#f9f9f9; padding:5px 12px; font-size:0.65rem; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:#888; border-bottom:1px solid #ebebeb;">${label}</td></tr>`;
}

function sr(shot, type, desc) {
  return `                            <tr style="border-bottom:1px solid #ebebeb;"><td style="padding:6px 12px; font-weight:600; color:#111;">${shot}</td><td style="padding:6px 12px; color:#666; font-size:0.78rem;">${type}</td><td style="padding:6px 12px; color:#222;">${desc}</td><td style="padding:6px 12px; color:#ccc; font-style:italic; font-size:0.76rem;"></td></tr>`;
}

function scene(id, name, rows) {
  return `                <div style="margin-bottom:14px; border-radius:10px; overflow:hidden; border:1px solid #e0e0e0; box-shadow:0 1px 6px rgba(0,0,0,0.06);">
                    <div style="background:#111; color:#fff; padding:7px 14px; font-size:0.7rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;">${id} — ${name}</div>
${th()}
${rows}
                        </tbody>
                    </table>
                </div>`;
}

function shotSection(sceneBlocks) {
  return `            <section style="margin-top:36px;">
                <h3 style="margin:0 0 14px 0; font-size:0.72rem; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#111; border-bottom:2px solid #111; padding-bottom:7px;">SHOT LIST</h3>
${sceneBlocks}
            </section>

`;
}

function noScenes(msg) {
  return `            <section style="margin-top:36px;">
                <h3 style="margin:0 0 14px 0; font-size:0.72rem; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#111; border-bottom:2px solid #111; padding-bottom:7px;">SHOT LIST</h3>
                <div style="border-radius:10px; border:1px solid #e0e0e0; padding:16px 18px; color:#aaa; font-size:0.82rem; font-style:italic;">${msg}</div>
            </section>

`;
}

// ─── Shot list content per day ─────────────────────────────────────────────────

const SHOT_LISTS = {

  1: shotSection([
    scene('S00', 'BRANFORD MONTAGE', [
      sr('1A', 'WIDE', 'Establishing — town green, main street, coastal homes'),
      sr('1B', 'WIDE', 'Marsh / tall grass edge at golden hour'),
      sr('1C', 'WIDE', 'Various coastal neighborhood exteriors — handheld, roaming'),
      sr('1D', 'WIDE', 'Slow push into the tall grass line'),
    ].join('\n')),
    scene('S02.3', 'BRANFORD AT NIGHT MONTAGES', [
      sl('EXT. COASTAL NEIGHBORHOOD — NIGHT'),
      sr('2A', 'WIDE', 'Dallas walking alone through coastal neighborhood at night, recorder in hand'),
      sr('2B', 'MED', 'Dallas stopping at tall grass patch, taking a deep breath'),
      sr('2C', 'CLOSE', 'Dallas\'s hand holding the audio recorder'),
      sr('2D', 'INSERT', 'Recorder display / waveform needle'),
      sr('2E', 'MED', 'Dallas pointing recorder microphone toward the ocean — recording'),
      sr('2F', 'WIDE', 'Breeze moving through tall grass along coastal path'),
      sr('2G', 'WIDE', 'Dallas walking home alone down a dark neighborhood street'),
    ].join('\n')),
    scene('S09C', 'DALLAS WANDERING DISCOVERY', [
      sl('EXT. BRANFORD MARSH EDGE — DUSK'),
      sr('3A', 'WIDE', 'Dallas walking along marsh perimeter at dusk — oscillator in hand'),
      sr('3B', 'MED', 'Dallas pausing — noticing something in the tall grass'),
      sr('3C', 'CLOSE', 'Oscillator needle reacting — then dropping to zero'),
      sr('3D', 'POV', 'Looking into dense reeds — darkness and stillness'),
      sr('3E', 'MED', 'Dallas stepping back, pulling out recorder — quietly documenting'),
    ].join('\n')),
  ].join('\n')),

  2: shotSection([
    scene('S02', 'SIERRA\'S BOX', [
      sl('INT. DALLAS KITCHEN — SUNSET'),
      sr('1A', 'WIDE', 'Dallas looking around new kitchen surroundings, peering through window'),
      sr('1B', 'CLOSE', 'Oscillator needle reacting to faint hum — then stops'),
      sr('1C', 'MED', 'Dallas eating frozen pizza, TV glaring in background'),
      sr('1D', 'INSERT', 'TV screen — weatherman talking about tropical storm season'),
      sl('EXT. DALLAS DRIVEWAY'),
      sr('1E', 'WIDE', 'Dallas outside staring at edge of property in silence'),
      sr('1F', 'MED', 'Dallas walking down street, nearly in a daze — hum merges'),
      sr('1G', 'MED', 'Dallas stopping, taking out portable audio recorder'),
      sl('INT. DALLAS NEW HOUSE — ATTIC / NIGHT'),
      sr('1H', 'WIDE', 'Dallas surveying new space, approaching scattered moving boxes'),
      sr('1I', 'CLOSE', 'Dallas opening "Field Notes — Branford" box — butterfly / angel sketches'),
      sr('1J', 'INSERT', 'Pages of sketches — butterflies morphing into winged creatures'),
      sr('1K', 'CLOSE', 'Dallas finding ruby-red headphones and cassette player buried under cables'),
      sr('1L', 'INSERT', 'Photo sticker on back of cassette player — Dallas and woman laughing in field'),
      sr('1M', 'CLOSE', 'Dallas\'s thumb rushing over her face in the photo'),
      sr('1N', 'MED', 'Dallas setting up equipment on desk — oscillator, recorders'),
      sl('INT. DALLAS DOWNSTAIRS — NIGHT'),
      sr('1O', 'MED', 'Dallas rushing downstairs toward window with recorder as hum grows louder'),
      sr('1P', 'INSERT', 'Recorder needle spiking; waveform on screen — pulsing pattern'),
      sr('1Q', 'CLOSE', 'Dallas timing the hum on his watch — 1 sec, 5 sec, 3 sec'),
      sr('1R', 'CLOSE', 'Battery dying — Dallas slams back of recorder in frustration'),
      sl('EXT. DALLAS HOUSE — NIGHT'),
      sr('1S', 'WIDE', 'Dallas alone watching tall grass sway against salt breeze — coyotes in distance'),
      sr('1T', 'CLOSE', 'Faint golden glow pulsing in the grass — 1x, 2x, 5x, 3x'),
      sr('1U', 'WIDE', 'Thunderstorm brewing in distance behind Dallas'),
    ].join('\n')),
    scene('S08', 'THE TRAILCAM', [
      sl('EXT. LONG ISLAND SOUND / BRANFORD ROCKS'),
      sr('2A', 'WIDE', 'Long Island Sound — waves crashing against Branford rocks'),
      sr('2B', 'WIDE', 'Dallas and Howie walking along neighborhood edge toward marsh'),
      sl('EXT. MARSH TRAIL BOARDWALK'),
      sr('2C', 'MED', 'Dallas stepping off boardwalk onto narrow dirt path through reeds'),
      sr('2D', 'CLOSE', 'Oscillator needle fluttering'),
      sr('2E', 'MED', 'Howie stopping — ears perking up and swiveling toward dark reeds'),
      sr('2F', 'WIDE', 'Coyotes barking in distance — wind picks up, Dallas and Howie march forward'),
      sr('2G', 'MED', 'Dallas tying Howie to tree — dog straining, eyes fixed on reeds'),
      sl('INT. DEEP MARSH'),
      sr('2H', 'WIDE', 'Dallas walking alone into the marsh'),
      sr('2I', 'CLOSE', 'Makeshift wooden trap — oily black rot circle, dead brittle grass'),
      sr('2J', 'CLOSE', 'Trailcam — cracked lens, faint dying red "Record" light blinking'),
      sr('2K', 'WIDE', 'Heavy thud hits mud 30 feet away — Dallas freezes'),
      sr('2L', 'MED', 'Dallas ripping trailcam from mounting, fingers fumbling with straps'),
      sr('2M', 'WIDE', 'Dallas and Howie scrambling back toward boardwalk'),
    ].join('\n')),
    scene('S08B', 'THE RESEARCH BEAT', [
      sl('INT. DALLAS WORKSHOP — DESK / NIGHT'),
      sr('3A', 'WIDE', 'House quiet — Dallas sitting alone in dark workshop'),
      sr('3B', 'MED', 'Dallas plugging trailcam into laptop — screen flickers with infrared footage'),
      sr('3C', 'INSERT', 'Laptop screen — four Golden Creatures huddling, pulsing with harmonic light'),
      sr('3D', 'INSERT', 'On screen: massive shadow drops in — Red Eye touches golden creature, which disintegrates into black rot'),
      sr('3E', 'CLOSE', 'Dallas\'s face — pale, watching an execution'),
      sr('3F', 'INSERT', 'Field notes page — "Response at 115.3 MHz" / crude ladder waveform sketch'),
      sr('3G', 'MED', 'Dallas slowly dialing oscillator to 115.3'),
      sr('3H', 'CLOSE', 'Oscillator needle locking — pure steady tone resonating'),
      sr('3I', 'WIDE', 'From living room — Howie begins to howl. Dallas cuts the power.'),
      sl('INT. MAKAYLA\'S BEDROOM — SAME TIME'),
      sr('3J', 'WIDE', 'Messy desk covered in birding guides — translucent crystal in petri dish'),
      sr('3K', 'CLOSE', 'Crystal suddenly flaring — bright predatory gold light from center'),
      sr('3L', 'CLOSE', 'Black ring scorching into wooden desk'),
      sr('3M', 'CLOSE', 'Makayla\'s hand reaching toward crystal, pulling back from heat'),
    ].join('\n')),
  ].join('\n')),

  3: shotSection([
    scene('S09', 'THE INJURED ONE', [
      sl('EXT. DALLAS HOUSE / MARSH EDGE'),
      sr('1A', 'WIDE', 'Dallas taking Howie outside — walking down neighborhood toward marsh'),
      sr('1B', 'WIDE', 'Dallas arriving at edge of marsh — tying up Howie near bamboo grass'),
      sr('1C', 'CLOSE', 'Oscillator going crazy'),
      sl('INT. DEEP MARSH'),
      sr('1D', 'WIDE', 'Dallas pushing through dense curtain of reeds'),
      sr('1E', 'MED', 'Dust motes dancing — sunset refracting into jagged prisms on Dallas\'s face'),
      sr('1F', 'WIDE', 'Inside marsh — all reeds blowing in whirlwind of light and color'),
      sr('1G', 'MED', 'Dallas spotting gnarled tree standing alone among reeds — approaching'),
      sr('1H', 'CLOSE', 'Small bioluminescent creature curled inside the gnarl — injured'),
      sr('1I', 'CLOSE', 'Dallas\'s hand trembling, reaching out — touching creature\'s back'),
      sr('1J', 'CLOSE', 'Creature uncoiling tentacle, wrapping around Dallas\'s finger then hand'),
      sr('1K', 'CLOSE', 'Dallas closing his eyes — in a vision'),
      sr('1L', 'MED', 'Dallas picking up creature and nestling it into chest'),
      sr('1M', 'WIDE', 'Violent gust of wind — shadows filling sky above Dallas'),
      sr('1N', 'WIDE', 'Dallas turning and walking away without looking back'),
    ].join('\n')),
    scene('S10', 'THE CHASE', [
      sl('EXT. TALL GRASS — CONTINUOUS'),
      sr('2A', 'WIDE', 'Dallas walking out of tall grass — sense of something following'),
      sr('2B', 'WIDE', 'Massive crushing sound — something rocketing through reeds toward Dallas'),
      sr('2C', 'POV', 'Red eyes circulating around Dallas, pulsing and closing in'),
      sr('2D', 'WIDE', 'Dallas breaking into a sprint toward cedar tree'),
      sr('2E', 'MED', 'Howie in panic, barking at wall of grass — Dallas grabbing leash'),
      sr('2F', 'WIDE', 'Dallas and Howie running — marsh falling far behind'),
      sl('EXT. BRANFORD NEIGHBORHOOD'),
      sr('2G', 'WIDE', 'Branford montage — Dallas walking briskly past same neighborhood route'),
      sr('2H', 'MED', 'Dallas at edge of driveway — finally stopping, gasping'),
      sr('2I', 'CLOSE', 'Creature motionless in his coat — neck glow fading amber'),
    ].join('\n')),
  ].join('\n')),

  4: shotSection([
    scene('S03', 'THE HUM (MEET THE NEIGHBORS)', [
      sl('EXT. DALLAS HOUSE — MORNING'),
      sr('1A', 'WIDE', 'Dallas walking to edge of property — tall grass swaying in wind'),
      sr('1B', 'MED', 'Dallas dazing at the grass, audio recorder in hand'),
      sr('1C', 'MED', 'Dominic approaching from sidewalk in salmon button-down'),
      sr('1D', 'TWO SHOT', 'Dallas and Dominic — first meeting conversation'),
      sl('EXT. BRANFORD NEIGHBORHOOD / TOWN MONTAGE'),
      sr('1E', 'WIDE', 'Dallas and Dominic walking down coastal sidewalks toward town'),
      sr('1F', 'WIDE', 'Walking through neighborhood — marsh fences, coastal streets'),
      sr('1G', 'MED', 'Dallas secretly recording tall grass while Dominic isn\'t looking'),
      sl('EXT. TOWN CENTER / INT. HARDWARE STORE'),
      sr('1H', 'WIDE', 'Exterior: small hardware store on town center street'),
      sr('1I', 'MED', 'INT: Dominic leading Dallas to battery section; Dallas grabbing batteries and cassettes'),
      sl('EXT. BRANFORD GREEN / INT. DOMINIC\'S CAR'),
      sr('1J', 'WIDE', 'Branford Green — neon orange parking ticket on windshield'),
      sr('1K', 'MED', 'Dominic crumpling ticket, taking inhaler, getting key from under car'),
      sr('1L', 'INT', 'Dominic\'s sister\'s car — conversation about fellowship lunch'),
    ].join('\n')),
    scene('S05', 'THE MERLIN APP', [
      sl('EXT. MARSH TRAIL BOARDWALK — SUNSET'),
      sr('2A', 'WIDE', 'Marsh trail boardwalk at dipping sun — Dominic and Dallas walking through golden reeds'),
      sr('2B', 'TWO SHOT', 'Dominic and Dallas walking quietly side by side'),
      sr('2C', 'WIDE', 'Distant cry from the reeds — Dallas and Dominic look at each other'),
      sr('2D', 'CLOSE', 'Dominic pulling out phone, tapping the Merlin bird ID app'),
      sr('2E', 'MED', 'Dominic pacing, struggling to get app to work'),
      sr('2F', 'MED', 'Dominic taking deep hit of inhaler — philosophical monologue'),
      sr('2G', 'WIDE', 'Dallas looking empathically out at the tall grass'),
    ].join('\n')),
    scene('S15A', 'THE FAILED TEST', [
      sl('EXT. OPEN FIELD — AFTERNOON'),
      sr('3A', 'MED', '[Scene details TBD — fill in shot list]'),
      sr('3B', '', '[Shot TBD]'),
      sr('3C', '', '[Shot TBD]'),
    ].join('\n')),
    scene('S15B', 'MAKAYLA\'S TRACKING BOX', [
      sl('EXT. NEIGHBORHOOD WALK → OPEN FIELD'),
      sr('4A', 'WIDE', 'Crew walking through neighborhood — golden hour woodland'),
      sr('4B', 'WIDE', 'Open field with tall trees at the far end'),
      sr('4C', 'MED', 'Crew stepping into field — spotting wooden chest hidden in tall grass'),
      sr('4D', 'WIDE', 'Approaching small wooden structure hidden by fallen trees and branches'),
      sr('4E', 'MED', 'Makayla opening wooden box — trail cameras, recording equipment inside'),
      sr('4F', 'CLOSE', 'Cables and wires connected to small translucent crystal at bottom of box'),
      sr('4G', 'MED', 'Makayla turning device on — it lights up'),
      sr('4H', 'MED', 'Makayla handing Dallas a small wooden box with the crystal'),
      sr('4I', 'CLOSE', 'Dallas holding the crystal — fascinated'),
    ].join('\n')),
    scene('S15C', 'DOMINIC\'S CONFESSION', [
      sl('EXT. OPEN FIELD — CONTINUOUS'),
      sr('5A', 'MED', 'Makayla placing crystal on bay device — nudging Dallas to grip metal rods'),
      sr('5B', 'CLOSE', 'Dallas gripping the metal rods'),
      sr('5C', 'MED', 'Dallas having a wild vision / trip'),
      sr('5D', 'MED', 'Dallas waking up — Makayla watching'),
      sr('5E', 'WIDE', 'Distant howls getting louder — Makayla and Dallas standing still in fear'),
      sr('5F', 'CLOSE', 'Dallas recording on pocket recorder'),
      sr('5G', 'WIDE', 'Makayla and Dallas standing in silence — then heading back'),
    ].join('\n')),
  ].join('\n')),

  5: shotSection([
    scene('S01', 'ARRIVAL &amp; DISCOVERY', [
      sl('EXT. DALLAS HOUSE EXTERIOR — DAY'),
      sr('1A', 'WIDE', 'Dallas staring at tall grass as he unloads boxes from big pile'),
      sr('1B', 'WIDE', 'Dallas scanning new backyard — rusty lawn furniture, old picnic table'),
      sr('1C', 'MED', 'Dallas at edge of reeds — discovering jagged dead circle of black rot'),
      sr('1D', 'CLOSE', 'Broken wooden stake driven into center of rot — top half snapped off'),
      sr('1E', 'WIDE', 'Makayla, 22, and Asher, 14, approaching on bikes — watching Dallas'),
      sr('1F', 'MED', 'Dallas pulling military-grade oscillator from box'),
      sr('1G', 'MED', 'Makayla watching Dallas, whispering to Asher'),
      sr('1H', 'TWO SHOT', 'Makayla and Dallas — conversation about oscillator'),
      sr('1I', 'CLOSE', 'Asher tapping morse-code pattern on fingers — not looking up'),
      sr('1J', 'WIDE', 'Makayla and Asher pedaling away with oscillator'),
      sr('1K', 'MED', 'Dallas watching them go, then peering at the swinging tall grass'),
    ].join('\n')),
    scene('S13', 'THE CONFRONTATION', [
      sl('EXT. DALLAS BACKYARD / DOORWAY'),
      sr('2A', 'WIDE', 'Dallas\'s backyard — Dominic checking tire pressure; Makayla and Asher at edge of property'),
      sr('2B', 'MED', 'Makayla spotting blinking trailcam behind gate; Asher removing SD card'),
      sr('2C', 'CLOSE', 'Makayla pocketing SD card; static electricity pulling her hair toward the stone'),
      sr('2D', 'MED', 'Dominic walking up to Dallas\'s doorway and knocking'),
      sr('2E', 'MED', 'Dallas emerging — Dominic asking Dallas to watch Howie'),
      sr('2F', 'WIDE', 'Makayla rushing past Dallas into kitchen — oscillator spiking toward ceiling'),
      sr('2G', 'WIDE', 'Makayla rushing up stairs toward attic; Asher and Dallas exchanging a look'),
      sl('INT. DALLAS ATTIC'),
      sr('2H', 'WIDE', 'Dallas and Makayla hovering over makeshift aquarium'),
      sr('2I', 'CLOSE', 'Asher putting on ruby-red headphones — listening to the recording'),
      sr('2J', 'CLOSE', 'Creature breathing through its back — Makayla inspecting through viewfinder'),
      sr('2K', 'CLOSE', 'Makayla touching creature — oscillator sparks'),
      sl('EXT. PICNIC BENCH'),
      sr('2L', 'TWO SHOT', 'Dallas and Makayla at picnic bench — how and where was the creature found'),
      sr('2M', 'MED', 'Dallas with heat lamp examining creature; Asher standing off in distance, afraid'),
    ].join('\n')),
    scene('S14', 'THE CONNECTION', [
      sl('EXT. DALLAS BACKYARD PORCH'),
      sr('3A', 'WIDE', 'Dallas backyard porch — Makayla and Dallas sitting, Howie sleeping at Dallas\'s feet'),
      sr('3B', 'MED', 'Asher alone a few feet away, threading beads on string'),
      sr('3C', 'TWO SHOT', 'Makayla and Dallas — conversation about Sierra, epistemology'),
      sr('3D', 'CLOSE', 'Dallas looking at sky, then ground, then the burn marks at edge of property'),
      sl('INT. DALLAS ATTIC / KITCHEN'),
      sr('3E', 'WIDE', 'INT. Dallas attic — crew huddled over machinery; Asher heading downstairs'),
      sr('3F', 'WIDE', 'INT. Dallas kitchen — Asher alone wiring makeshift computer'),
      sr('3G', 'CLOSE', 'Asher\'s finger tracing same pattern on leg, over and over'),
      sr('3H', 'CLOSE', 'Faint red light outside window — appears and pulses away'),
      sr('3I', 'MED', 'Asher\'s head shaking — crashing to ground'),
      sr('3J', 'MED', 'Makayla holding Asher as he shakes — swaying and humming him calm'),
      sr('3K', 'CLOSE', 'Creature sleeping peacefully under heat lamp'),
      sr('3L', 'MED', 'Makayla demonstrating amplifier — creature starts to wiggle'),
      sr('3M', 'INSERT', 'Oscilloscope — jagged second signal riding beneath creature\'s sine wave'),
    ].join('\n')),
    scene('S14B', 'THE FIELD JOURNAL', [
      sl('EXT. BACKYARD PICNIC TABLE'),
      sr('4A', 'WIDE', 'Backyard picnic table — Dallas, Makayla, Asher in silence; Asher threading beads'),
      sr('4B', 'MED', 'Makayla holding water-warped field journal in lap, rubber band around it'),
      sr('4C', 'CLOSE', 'Dallas opening journal — woman\'s handwriting, pencil marsh sketches, frequency entries'),
      sr('4D', 'INSERT', 'Journal page — Golden creature drawing in margin, recognizable'),
      sr('4E', 'INSERT', 'Journal page — handwriting shifts: young Makayla\'s, then Asher\'s geometric doodles'),
      sr('4F', 'INSERT', 'Journal spread — Golden creature (peaceful) / same body but wrong: transparent fur, black veins, red eyes'),
      sr('4G', 'INSERT', 'Arrow between the two drawings — no words'),
      sr('4H', 'CLOSE', 'Dallas\'s thumb tracing the arrow'),
      sr('4I', 'MED', 'Asher stopping threading — listening, not looking up'),
      sr('4J', 'WIDE', 'Gust of wind through tall grass — Asher\'s head turning just slightly'),
      sr('4K', 'MED', 'Dallas closing the journal carefully; Makayla sliding it back into her pack'),
    ].join('\n')),
    scene('S14C', 'THE ALMOST DISCOVERY', [
      sl('INT. DALLAS KITCHEN — LATE AFTERNOON'),
      sr('5A', 'WIDE', 'Kitchen — late afternoon light through blinds; creature hidden under towel; soft hum bleeds in'),
      sr('5B', 'MED', 'Makayla at counter tightening cable; Asher cross-legged on floor threading beads'),
      sr('5C', 'CLOSE', 'Knock at door — all three freeze'),
      sr('5D', 'MED', 'Dallas opening door — Dominic with Howie\'s leash; Howie straining, ears flat, tail stiff'),
      sr('5E', 'TWO SHOT', 'Dallas and Dominic — doorway conversation about gutter, weather, storm'),
      sr('5F', 'CLOSE', 'Water glass rippling on counter from the hum'),
      sr('5G', 'MED', 'Dominic stepping inside — Makayla sliding casually between him and enclosure'),
      sr('5H', 'CLOSE', 'Asher\'s bead string slipping, clattering to floor'),
      sr('5I', 'CLOSE', 'Dominic stepping toward the towel — oscillators flickering GOLD for half a second'),
      sr('5J', 'MED', 'Makayla slamming power switch — darkness and silence'),
      sr('5K', 'MED', 'Dominic at doorway pausing — "If you ever need help…" — then leaving'),
      sr('5L', 'CLOSE', 'Faint golden glow bleeding through the towel — Makayla staring at it'),
    ].join('\n')),
    scene('S08D', 'THE RETURN', [
      sl('EXT. LONG ISLAND SOUND — NIGHT'),
      sr('6A', 'WIDE', 'Dallas at edge of Long Island Sound — night — deep breath, looking at the coast'),
      sr('6B', 'MED', 'Dallas taking out Sierra\'s recorder — loading a new tape'),
      sr('6C', 'CLOSE', 'Recording the hum — oscillator needle spiking back and forth'),
      sl('INT. DALLAS HOUSE — CONTINUOUS'),
      sr('6D', 'WIDE', 'INT. Dallas house — Dallas at computer; earmarking peaks on the recording'),
      sr('6E', 'CLOSE', 'Phone ringing — Dallas answering; Dominic\'s voice (V.O.) about Asher\'s hospital visit'),
      sr('6F', 'MED', 'Dallas taking Howie upstairs — dog settling in to sleep'),
      sr('6G', 'WIDE', 'Dallas back at work, Howie asleep — then Howie begins to cry'),
    ].join('\n')),
  ].join('\n')),

  6: shotSection([
    scene('S11', 'KITCHEN TRIAGE', [
      sl('INT. DALLAS KITCHEN — NIGHT'),
      sr('1A', 'WIDE', 'Dallas carrying creature through back door, cradling it gently'),
      sr('1B', 'MED', 'Creature on kitchen counter — soft bioluminescent glow pulsing weakly'),
      sr('1C', 'CLOSE', 'Dallas\'s hands gently wrapping creature in dish towel'),
      sr('1D', 'WIDE', 'Makayla and Asher arriving — Makayla kneeling to creature\'s level'),
      sr('1E', 'CLOSE', 'Asher frozen in doorway — watching wide-eyed from a distance'),
      sr('1F', 'MED', 'Makayla checking creature\'s back with penlight — searching for injuries'),
      sl('INT. DALLAS ATTIC — NIGHT'),
      sr('1G', 'WIDE', 'Dallas and Makayla constructing makeshift habitat from fish tank and old towels'),
      sr('1H', 'MED', 'Makayla threading small speaker wires into enclosure — plugging in Sierra\'s tape'),
      sr('1I', 'CLOSE', 'Cassette player playing — creature\'s back slowly rising in response'),
      sr('1J', 'WIDE', 'Headlights outside window — a car pulling up slowly to the curb'),
      sr('1K', 'MED', 'Makayla handing Dallas a cover story; pulling tarp over enclosure'),
      sr('1L', 'WIDE', 'Dominic at doorbell — Dallas heading downstairs'),
    ].join('\n')),
    scene('S12', 'THE BURN MARK', [
      sl('INT. DALLAS ATTIC — EARLY MORNING'),
      sr('2A', 'WIDE', 'Dallas asleep slumped against the wall next to the tank'),
      sr('2B', 'CLOSE', 'Creature curled under heat lamp — a ring of scorched black spreading beneath it'),
      sr('2C', 'CLOSE', 'The burn mark — a near-perfect circle of char on the wooden floor'),
      sr('2D', 'MED', 'Dallas stirring — reaching toward the burn mark and pulling back'),
      sr('2E', 'INSERT', 'Small crystalline fragment lodged where the circle meets the tank wall'),
      sl('EXT. DALLAS HOUSE — MORNING'),
      sr('2F', 'WIDE', 'Through window — Dominic\'s minivan parked on street, Dominic watching the house'),
    ].join('\n')),
    scene('S08C', 'THE THRESHOLD', [
      sl('EXT. DALLAS PORCH — NIGHT'),
      sr('3A', 'WIDE', 'Dallas sitting alone on back porch — glass of water in hand, staring at marsh edge'),
      sr('3B', 'MED', 'The tall grass barely moving — Dallas listening'),
      sr('3C', 'CLOSE', 'Dallas\'s jaw setting — a decision forming'),
      sr('3D', 'WIDE', 'Dallas standing, picking up oscillator — stepping off porch toward the grass'),
    ].join('\n')),
  ].join('\n')),

  7: noScenes('No scenes scheduled — check production notes for Day 7 activities.'),

  8: noScenes('No principal scenes assigned — see sourceNote: s07 + s08 may be rescheduled here. Confirm with production.'),

  9: shotSection([
    scene('S06', 'NEWS VANS', [
      sl('EXT. BRANFORD NEIGHBORHOOD — DAY'),
      sr('1A', 'WIDE', 'News vans lining the street — reporters setting up outside Dominic\'s house'),
      sr('1B', 'MED', 'Pat Clendenen on camera — reporting outside with mic'),
      sr('1C', 'WIDE', 'Neighbors watching from porches and sidewalks'),
      sr('1D', 'MED', 'Dallas watching from behind a fence — staying out of frame'),
      sl('EXT. DOMINIC\'S HOUSE — DRIVEWAY'),
      sr('1E', 'WIDE', 'Dominic\'s driveway — burn marks clearly visible in asphalt'),
      sr('1F', 'CLOSE', 'Burn marks in asphalt — oily black rot ring, dead grass at edges'),
      sr('1G', 'MED', 'Dominic addressing neighbors from front porch — measured and calm'),
      sr('1H', 'CLOSE', 'Neighbor\'s phone recording the scene; social media moment'),
    ].join('\n')),
    scene('S17', 'RESONANCE', [
      sl('INT. DALLAS BASEMENT — NIGHT'),
      sr('2A', 'WIDE', 'Dallas in the basement — creature in sealed glass case, crystal suspended above it'),
      sr('2B', 'MED', 'Crystal resonating — pulsing in time with creature\'s bioluminescent glow'),
      sr('2C', 'CLOSE', 'Dallas leaning in — needle on oscilloscope tracing a perfect sine wave'),
      sr('2D', 'INSERT', 'Crystal and creature — both locked in synchronized frequency'),
      sr('2E', 'MED', 'Creature suddenly pressing against glass — eyes wide and urgent'),
      sr('2F', 'WIDE', 'Glass case shattering — creature flowing upward through dark stairwell'),
      sr('2G', 'WIDE', 'Dallas chasing up stairs — front door swinging open, creature gone'),
      sl('EXT. DALLAS HOUSE — NIGHT'),
      sr('2H', 'WIDE', 'Dallas on front porch — darkness and silence; only the wind in the grass'),
    ].join('\n')),
  ].join('\n')),

  9.5: noScenes('Father\'s Day — No principal photography scheduled. Additional coverage or pickup shots may be assigned.'),

  10: shotSection([
    scene('S00', 'BRANFORD MONTAGE (ADDITIONAL COVERAGE)', [
      sl('EXT. TOWN GREEN — AFTERNOON'),
      sr('1A', 'WIDE', 'Town Green — families, gazebo, Sunday afternoon light'),
      sr('1B', 'WIDE', 'Main Street storefronts — long lens, distant character presence'),
      sr('1C', 'WIDE', 'Coastal residential street — parked cars, American flags, summer stillness'),
      sl('EXT. BRANFORD NEIGHBORHOOD — GOLDEN HOUR'),
      sr('1D', 'WIDE', 'Coastal homes approaching the marsh — golden reeds in background'),
      sr('1E', 'WIDE', 'Marsh edge from neighborhood sidewalk — the tall grass line'),
      sr('1F', 'SLOW WIDE', 'Low push toward the tall grass — lens compressing the distance'),
      sr('1G', 'WIDE', 'Long Island Sound — late day light on the water; horizon empty'),
    ].join('\n')),
  ].join('\n')),

  11: shotSection([
    scene('S18', 'LIFE GROUP ARRIVES', [
      sl('INT. DOMINIC\'S KITCHEN — EVENING'),
      sr('1A', 'WIDE', 'Life group filing in — Mary, Paul, Janice, others; covered dishes and folding chairs'),
      sr('1B', 'MED', 'Dominic greeting group; nervous but holding it together'),
      sr('1C', 'TWO SHOT', 'Mary and Janice exchanging a look — sensing something off'),
      sl('INT. DOMINIC\'S BASEMENT — EVENING'),
      sr('1D', 'WIDE', 'Dallas and Makayla below — creature in enclosure under tarp; sugar cube test rig'),
      sr('1E', 'CLOSE', 'Creature eating sugar cubes from Makayla\'s palm — soft gold glow'),
      sr('1F', 'WIDE', 'Floorboards above creaking — footsteps getting closer'),
      sr('1G', 'WIDE', 'Mr. Mike appears at top of stairs — looks down into basement'),
      sr('1H', 'CLOSE', 'Mr. Mike\'s face — eyes wide, backing away slowly'),
    ].join('\n')),
    scene('S19', 'THE HYMN', [
      sl('INT. DOMINIC\'S BASEMENT — CONTINUOUS'),
      sr('2A', 'WIDE', 'Creature\'s bioluminescence rising — responding to the singing upstairs'),
      sr('2B', 'MED', 'Makayla and Dallas watching creature — the hum blending with hymn melody'),
      sr('2C', 'CLOSE', 'Creature extending its neck — frequency locking onto vocal harmonics'),
      sl('INT. DOMINIC\'S LIVING ROOM — SAME TIME'),
      sr('2D', 'WIDE', 'Life group in mid-hymn — voices blending, unaware of what\'s below'),
      sr('2E', 'MED', 'Janice suddenly stopping — hand going to her chest; sensing something'),
      sr('2F', 'MED', 'Dominic watching Janice; sweat on his brow'),
      sr('2G', 'CLOSE', 'Basement door — a faint golden light seeping beneath it'),
    ].join('\n')),
    scene('S20', 'THE SECRET IS OUT', [
      sl('INT. DOMINIC\'S BASEMENT → LIVING ROOM — CONTINUOUS'),
      sr('3A', 'WIDE', 'Creature rising — enclosure door drifting open'),
      sr('3B', 'MED', 'Makayla reaching to close it — creature flowing past her hand'),
      sr('3C', 'WIDE', 'Creature ascending the staircase — golden light pouring upward'),
      sr('3D', 'WIDE', 'Creature emerging — life group freezing mid-hymn'),
      sr('3E', 'CLOSE', 'Dominic covering his face'),
      sr('3F', 'MED', 'Creature scanning the room — then a burst of its acoustic tone'),
      sr('3G', 'WIDE', 'Red Eyes massing at every window — encircling the house'),
      sl('EXT. DOMINIC\'S BACKYARD — CONTINUOUS'),
      sr('3H', 'WIDE', 'Dallas at back door — Red Eyes at the tree line — a standoff'),
    ].join('\n')),
    scene('S28', 'FULL CIRCLE', [
      sl('EXT. MAKAYLA\'S WOODLAND LAIR — NIGHT'),
      sr('4A', 'WIDE', 'Makayla methodically dismantling the hidden structure — packing her gear'),
      sr('4B', 'MED', 'Makayla picking up Asher\'s bead string — running it through her fingers'),
      sr('4C', 'CLOSE', 'One last look at the wooden chest before closing and locking it'),
      sl('INT. DALLAS BEDROOM — SAME TIME'),
      sr('4D', 'WIDE', 'Dallas lying in bed, eyes open — listening to the hum outside'),
      sr('4E', 'CLOSE', 'Dallas\'s hand moving to Sierra\'s recorder on the nightstand'),
      sl('EXT. DALLAS DRIVEWAY → CREEK BEND — DAWN'),
      sr('4F', 'WIDE', 'Dallas on driveway — looking at the marsh edge in first light'),
      sr('4G', 'WIDE', 'Dallas at creek bend — Howie off-leash wading ahead'),
      sr('4H', 'CLOSE', 'Dallas\'s hand trailing in the current — eyes soft'),
    ].join('\n')),
  ].join('\n')),

  12: shotSection([
    scene('S04', 'THE FELLOWSHIP', [
      sl('EXT. CHURCH FELLOWSHIP LAWN — AFTERNOON'),
      sr('1A', 'WIDE', 'Fellowship picnic in progress — paper plates, folding tables, kids running'),
      sr('1B', 'MED', 'Mary introducing Dallas to Paul — warm, effortful smiles'),
      sr('1C', 'MED', 'Makayla and Asher at edge of group — recording equipment concealed in bag'),
      sr('1D', 'CLOSE', 'Makayla pointing small microphone toward edge of woods; phone app graphs the frequency'),
      sr('1E', 'TWO SHOT', 'Dallas and Janice — first exchange; she studies him carefully'),
      sr('1F', 'WIDE', 'A shared glance between Makayla and Asher — the hum is spiking'),
    ].join('\n')),
    scene('S07', 'THE COORDINATES', [
      sl('INT. DOMINIC\'S BASEMENT — NIGHT'),
      sr('2A', 'WIDE', 'Dallas descending stairs — Makayla\'s maps everywhere, cables, recording rigs'),
      sr('2B', 'MED', 'Makayla pointing to frequency map — range of numbers, coordinates pinned'),
      sr('2C', 'INSERT', 'Map detail — "115.3" circled in red ink, star beside it'),
      sr('2D', 'TWO SHOT', 'Makayla and Dallas — what do the coordinates mean'),
      sr('2E', 'MED', 'Mr. Mike in corner rocking chair — watching without speaking'),
      sr('2F', 'CLOSE', 'Mr. Mike\'s knuckles white on armrest'),
    ].join('\n')),
    scene('S07B', 'MR. MIKE\'S WARNING', [
      sl('INT. DOMINIC\'S BASEMENT — CONTINUOUS'),
      sr('3A', 'MED', 'Mr. Mike slowly rising from his chair; Makayla and Dallas turn'),
      sr('3B', 'CLOSE', 'Mr. Mike leaning close to Dallas — "You leave it"'),
      sr('3C', 'MED', 'Dallas holding his ground, voice steady — "We\'re not leaving it"'),
      sr('3D', 'CLOSE', 'Mr. Mike\'s eyes; something behind them that isn\'t warning — it\'s grief'),
      sr('3E', 'WIDE', 'Mr. Mike returning to his chair without another word'),
    ].join('\n')),
    scene('S16', 'BACK HOME', [
      sl('EXT. BRANFORD STREETS — DUSK'),
      sr('4A', 'WIDE', 'Dallas, Dominic, Makayla, Asher emerging from woodland trail'),
      sr('4B', 'MED', 'Asher suddenly stumbling — holding his head, disoriented'),
      sr('4C', 'WIDE', 'Asher collapsing on the sidewalk — group rushing toward him'),
      sr('4D', 'CLOSE', 'Asher\'s hand gripping pavement — bead string looped in his fist'),
      sl('EXT. DALLAS STREET — MOMENTS LATER'),
      sr('4E', 'WIDE', 'Janice\'s minivan pulling up fast — she gets out before it stops'),
      sr('4F', 'TWO SHOT', 'Janice and Makayla — Makayla explaining; Janice\'s expression hardening'),
      sr('4G', 'MED', 'Asher in Janice\'s arms — eyes opening; a quiet reassurance'),
    ].join('\n')),
    scene('S17B', 'NORMAL DAY', [
      sl('INT. GROCERY STORE / COSTCO — DAY (CROSS-CUT)'),
      sr('5A', 'WIDE', 'Dominic pushing cart down fluorescent aisles — completely ordinary'),
      sr('5B', 'MED', 'Dominic picking up two kinds of cereal — comparing'),
      sr('5C', 'MED', 'Dominic on phone — voice low, urgent; hand shielding mouth'),
      sl('INT. DALLAS ATTIC — SAME TIME'),
      sr('5D', 'WIDE', 'Dallas at desk — maps, graphs, equations covering the walls'),
      sr('5E', 'CLOSE', 'Dallas\'s finger tracing a frequency line — it\'s going up'),
      sl('INT. MAKAYLA\'S LAIR — SAME TIME'),
      sr('5F', 'WIDE', 'Makayla and Asher surrounded by pinned maps and tangled cables'),
      sr('5G', 'INSERT', 'Makayla\'s map — a ring of pins converging toward the marsh center'),
    ].join('\n')),
    scene('S17C', 'MUTE DRIVE', [
      sl('INT. JANICE\'S MINIVAN — DAY'),
      sr('6A', 'INT WIDE', 'Janice driving — Makayla and Asher in back seat; no one speaking'),
      sr('6B', 'MED', 'Makayla watching Janice\'s hands on the wheel'),
      sr('6C', 'CLOSE', 'Asher looking out the window — the burn marks passing'),
      sl('EXT. BRANFORD DOWNTOWN — MOVING SHOT'),
      sr('6D', 'WIDE', 'Minivan rolling slowly past Town Hall — burn marks scorched into the steps'),
      sr('6E', 'CLOSE', 'Janice\'s hand tightening on the wheel'),
      sr('6F', 'MED', 'Janice finally speaking — "Your mother knew, didn\'t she."'),
    ].join('\n')),
  ].join('\n')),

  13: shotSection([
    scene('S26', 'THE MORNING AFTER', [
      sl('INT. DOMINIC\'S HOUSE — EARLY MORNING'),
      sr('1A', 'WIDE', 'Dawn light through blinds — bodies asleep on couches, floor, chairs'),
      sr('1B', 'CLOSE', 'Mary\'s hand clutching her Bible, still asleep'),
      sr('1C', 'MED', 'Paul sleeping in recliner — head back, snoring softly'),
      sr('1D', 'WIDE', 'Dallas asleep at the kitchen table — head on arms, oscillator still running'),
      sr('1E', 'MED', 'Makayla on the floor against the wall — Asher\'s head in her lap'),
      sr('1F', 'WIDE', 'The living room from the doorway — perfect stillness; aftermath of a siege'),
      sl('EXT. DOMINIC\'S HOUSE — MORNING'),
      sr('1G', 'WIDE', 'Janice\'s minivan pulling into the driveway'),
      sr('1H', 'CLOSE', 'Janice at the door — not knocking, just standing; watching through the glass'),
    ].join('\n')),
  ].join('\n')),

  14: shotSection([
    scene('S21', 'THE BURN MARKS', [
      sl('EXT. DALLAS BACKYARD — AFTERNOON'),
      sr('1A', 'WIDE', 'Dallas walking to the edge of property — scan of the tall grass perimeter'),
      sr('1B', 'CLOSE', 'A new burn mark — fresh, within the last 24 hours'),
      sr('1C', 'MED', 'Dallas crouching, examining — no creature here, something passed through'),
      sl('EXT. TALL GRASS — CONTINUOUS'),
      sr('1D', 'WIDE', 'Makayla sprinting — tracker device clutched in both hands — heading straight for the grass'),
      sr('1E', 'MED', 'Dallas calling after her — Makayla not slowing down'),
      sr('1F', 'POV', 'Inside the grass edge — tall reeds closing in on both sides'),
      sr('1G', 'WIDE', 'The two of them disappearing into the tall grass line'),
    ].join('\n')),
    scene('S22', 'THE LOAD-OUT', [
      sl('EXT. DEEP MARSH — CONTINUOUS'),
      sr('2A', 'WIDE', 'Makayla navigating marsh with tracker — mud pulling at her boots'),
      sr('2B', 'CLOSE', 'Tracker pinging — device pointing deeper in'),
      sr('2C', 'WIDE', 'Dallas behind her — breathless, watching the reeds for Red Eyes'),
      sr('2D', 'MED', 'Makayla stopping — a sound just ahead; low and harmonic'),
      sr('2E', 'WIDE', 'Through dense reeds — the creature is visible, stationary'),
      sr('2F', 'CLOSE', 'Makayla\'s face — relief, grief, and something like wonder'),
      sr('2G', 'WIDE', 'Dallas and Makayla standing 10 feet from the creature — all three still'),
    ].join('\n')),
  ].join('\n')),

  15: shotSection([
    scene('S23', 'THE TRENCH RUN', [
      sl('EXT. TALL GRASS — NIGHT'),
      sr('1A', 'WIDE', 'Dallas, Dominic, Makayla, Asher moving single-file through tall grass — backs low'),
      sr('1B', 'WIDE', 'Massive speaker rigs on wheeled carts being dragged through mud'),
      sr('1C', 'CLOSE', 'Asher gripping the sound controller — eyes focused, breathing steady'),
      sr('1D', 'WIDE', 'Red Eye circling overhead — shadow cutting across the group'),
      sl('INT. DALLAS HOUSE — CROSS-CUT'),
      sr('1E', 'MED', 'Asher\'s POV device — Mr. Mike in the kitchen; safe and unaware'),
      sr('1F', 'MED', 'Asher tapping rhythm on the controller — sending a sonic lure burst'),
      sl('EXT. TALL GRASS — CONTINUOUS'),
      sr('1G', 'WIDE', 'Red Eye banking hard toward the lure — angling away from the group'),
      sr('1H', 'WIDE', 'The group pushing deeper — speakers grinding forward'),
    ].join('\n')),
    scene('S24', 'THE SANCTUARY &amp; THE SIEGE', [
      sl('EXT. CENTER OF MARSH — NIGHT'),
      sr('2A', 'WIDE', 'Opening into the clearing — a geometric ring of flattened grass, 40 feet across'),
      sr('2B', 'WIDE', 'Golden Elders present — the original creatures; glowing steady, calm'),
      sr('2C', 'MED', 'Dallas\'s face in the golden light — a sudden recognition'),
      sr('2D', 'WIDE', 'The group setting up speakers around the perimeter of the ring'),
      sr('2E', 'CLOSE', 'Crystal being placed at center — Makayla\'s hands trembling'),
      sr('2F', 'WIDE', 'Red Eyes massing at the tree line — dozens of red pinpricks in the dark'),
      sr('2G', 'WIDE', 'Golden Elders moving to formation — a response to the Red Eyes'),
      sr('2H', 'MED', 'Dallas\'s hand on Makayla\'s shoulder — "Now."'),
    ].join('\n')),
  ].join('\n')),

  16: shotSection([
    scene('S25', 'THE FINAL BLAST', [
      sl('EXT. CENTER OF MARSH — NIGHT'),
      sr('1A', 'WIDE', 'Makayla wiring crystal to speaker array — hands shaking; nose bleeding'),
      sr('1B', 'MED', 'Dallas at the control board — watching the oscilloscope'),
      sr('1C', 'WIDE', 'Red Eyes advancing — the ring tightening around the clearing'),
      sr('1D', 'CLOSE', 'Crystal lighting up — pure golden frequency ascending'),
      sr('1E', 'WIDE', 'Makayla throwing the switch — the BOOM; a wave of golden light expanding outward'),
      sr('1F', 'WIDE', 'Red Eyes vaporizing — one by one — black veins retreating'),
      sr('1G', 'WIDE', 'The clearing — silence; all Red Eyes gone'),
      sr('1H', 'CLOSE', 'Makayla\'s hands — the crystal cracked clean through'),
    ].join('\n')),
    scene('S15S', 'TBD SEQUENCE', [
      sl('LOCATION TBD'),
      sr('2A', '', '[Scene details TBD — fill in shot list]'),
      sr('2B', '', '[Shot TBD]'),
    ].join('\n')),
    scene('S27', 'AFTERMATH', [
      sl('EXT. BRANFORD TOWN — AFTERNOON'),
      sr('3A', 'WIDE', 'Town going on as normal — no damage, no evidence'),
      sr('3B', 'WIDE', 'Pat Clendenen outside Town Hall — reporting; burn marks on steps are gone'),
      sl('EXT. CENTER OF MARSH — AFTERNOON'),
      sr('3C', 'WIDE', 'Dallas and crew back in the clearing — collecting speaker rigs and equipment'),
      sr('3D', 'MED', 'Makayla picking up the cracked crystal — pocketing it quietly'),
      sl('EXT. CHURCH GROUNDS — AFTERNOON'),
      sr('3E', 'WIDE', 'A small picnic on the church lawn — Dominic, Mary, Paul, Janice; normal laughter'),
      sl('INT. DALLAS WORKSHOP — EVENING'),
      sr('3F', 'WIDE', 'Dallas at his desk — new notebooks open, equipment cleaned and organized'),
      sr('3G', 'CLOSE', 'Dallas pressing his hand to the oscillator — it reads zero; perfect silence'),
    ].join('\n')),
  ].join('\n')),
};

// ─── Location details per day ──────────────────────────────────────────────────

const LOCATIONS = {
  4: '<div>1. Dallas\'s House [Exterior — 72 Lake St, Hamden CT]</div><div>2. Branford Neighborhood / Town Center [Coastal Streets &amp; Hardware Store]</div><div>3. Marsh Trail Boardwalk [Branford Marsh]</div><div>4. Open Field / Makayla\'s Hidden Structure [Woodland — TBD]</div>',
  5: '<div>1. Dallas\'s House [72 Lake St, Hamden CT — Exterior, Backyard, Kitchen, Attic]</div><div>2. Long Island Sound [Branford Coastal Edge]</div>',
  6: '<div>1. Dallas\'s House [72 Lake St, Hamden CT — Kitchen, Attic, Porch]</div>',
  7: '<div style="color:#999; font-style:italic;">1. Location TBD — No Scenes Scheduled</div>',
  8: '<div style="color:#999; font-style:italic;">1. Dominic\'s House [Basement — TBD]</div><div style="color:#999; font-style:italic;">2. Marsh Trail / East Haven Nursery [Trailcam Site — Confirm]</div>',
  9: '<div>1. Branford Neighborhood [News Coverage Streets]</div><div>2. Dominic\'s House [Exterior, Driveway]</div><div>3. Dallas\'s House [72 Lake St, Hamden CT — Basement]</div>',
  9.5: '<div style="color:#999; font-style:italic;">1. TBD [Father\'s Day — Special Coverage / Pickups]</div>',
  10: '<div>1. Town Green [1011 Main St, Branford]</div><div>2. Branford Coastal Neighborhood [Various Exteriors]</div><div>3. Marsh Edge / Tall Grass [Branford Marsh]</div>',
  11: '<div>1. Dominic\'s House [Interior — Kitchen, Living Room, Basement]</div><div>2. Dallas\'s House [72 Lake St, Hamden CT — Interior &amp; Driveway]</div><div>3. Makayla\'s Woodland Lair [Exterior — TBD]</div>',
  12: '<div>1. Church Fellowship Grounds [TBD]</div><div>2. Dominic\'s House [Basement]</div><div>3. Dallas\'s House / Branford Streets [72 Lake St &amp; Neighborhood]</div><div>4. Grocery Store / Costco [TBD]</div><div>5. Town Hall / Branford Downtown [Branford, CT]</div>',
  13: '<div>1. Dominic\'s House [Interior — Morning After]</div>',
  14: '<div>1. Dallas\'s Backyard [72 Lake St, Hamden CT]</div><div>2. Tall Grass / Deep Marsh [East Haven Nursery]</div>',
  15: '<div>1. Tall Grass / Marsh [East Haven Nursery]</div><div>2. Center of Marsh — Sanctuary Site [East Haven Nursery]</div>',
  16: '<div>1. Center of Marsh [East Haven Nursery — Climax Site]</div><div>2. Branford Town [Various Exteriors]</div><div>3. Church Grounds [Post-Battle Picnic]</div><div>4. Dallas\'s Workshop [72 Lake St, Hamden CT]</div>',
};

// ─── EQUIPMENT section anchor ──────────────────────────────────────────────────

const EQUIP_ANCHOR = `            <section style="margin-top:30px;">
                <h3 style="margin:20px 0 10px 0; border-bottom:1px solid black;">EQUIPMENT</h3>`;

// Old shot list patterns to remove from days 1-5
const OLD_SHOTLIST_START = `            <section style="margin-top:30px;">
                <h3 style="margin:20px 0 10px 0; border-bottom:1px solid black;">SHOT LIST</h3>`;

// Location placeholder pattern
const LOC_PLACEHOLDER = `<div style="color:#999; font-style:italic;">1. Location [Address]</div>`;

// ─── Main processing ───────────────────────────────────────────────────────────

const DAY_FILES = {
  1: '1.html', 2: '2.html', 3: '3.html', 4: '4.html', 5: '5.html',
  6: '6.html', 7: '7.html', 8: '8.html', 9: '9.html', 9.5: '9.5.html',
  10: '10.html', 11: '11.html', 12: '12.html', 13: '13.html',
  14: '14.html', 15: '15.html', 16: '16.html'
};

for (const [dayKey, filename] of Object.entries(DAY_FILES)) {
  const day = parseFloat(dayKey);
  const filepath = path.join(DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // 1. Update location details (days 4-16 and 9.5)
  if (LOCATIONS[day]) {
    const locContent = `<div style="font-size:0.9rem;">${LOCATIONS[day]}</div>`;
    html = html.replace(
      `<div style="font-size:0.9rem;"><div style="color:#999; font-style:italic;">1. Location [Address]</div></div>`,
      locContent
    );
  }

  // 2. Handle shot list
  const newShotList = SHOT_LISTS[day];
  if (!newShotList) {
    console.log(`Day ${day}: no shot list defined, skipping`);
    continue;
  }

  if (day <= 5) {
    // Remove old shot list section and insert new one before EQUIPMENT
    const startIdx = html.indexOf(OLD_SHOTLIST_START);
    const equipIdx = html.indexOf(EQUIP_ANCHOR);
    if (startIdx === -1 || equipIdx === -1) {
      console.warn(`Day ${day}: could not find old shot list or EQUIPMENT anchor`);
    } else {
      // Remove everything from old shot list start up to (but not including) EQUIPMENT anchor
      html = html.slice(0, startIdx) + newShotList + html.slice(equipIdx);
    }
  } else {
    // Insert new shot list before EQUIPMENT anchor
    const equipIdx = html.indexOf(EQUIP_ANCHOR);
    if (equipIdx === -1) {
      // Day 9.5 and 10 might not have EQUIPMENT — check for footer
      const footerAnchor = `            <footer style="margin-top:50px;`;
      const footerIdx = html.indexOf(footerAnchor);
      if (footerIdx === -1) {
        console.warn(`Day ${day}: could not find EQUIPMENT or footer anchor`);
      } else {
        html = html.slice(0, footerIdx) + newShotList + html.slice(footerIdx);
      }
    } else {
      html = html.slice(0, equipIdx) + newShotList + html.slice(equipIdx);
    }
  }

  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`Day ${day}: updated`);
}

console.log('\nDone. All call sheets updated.');
