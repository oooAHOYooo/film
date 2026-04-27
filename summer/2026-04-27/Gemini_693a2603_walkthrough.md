# Final Character Arc Polish

The final adjustments for Makayla and Janice's character arcs have been fully implemented and integrated into the script system. These changes specifically address the narrative mechanics of **control** (Makayla) and **denial** (Janice).

## What Was Added/Changed

### 1. Janice's Pivot (Scene 17c)
I created a brand new scene, `s17c.md`, set immediately after the grocery store sequence in Act 2. 
- **The Setup:** Janice is driving Makayla through Branford. Janice tries to enforce normalcy by delivering an emotional, "proud aunt" speech about resilience and family.
- **The Conflict:** Makayla remains completely mute, refusing the emotional buffer. Instead, she stares intently at the creeping anomalies in town (pulsing lights, black rot on the Town Hall).
- **The Choice:** The unbearable silence breaks Janice's facade. She pulls the minivan over, follows Makayla's gaze, and explicitly chooses to face the fear. She asks Makayla, "What is coming?" and when Makayla answers, Janice accepts the truth without asking for proof, deciding to go home and lock the doors.

### 2. Makayla Relinquishing Control (Scene 28)
I completely rewrote the final beat for Makayla in `s28.md`.
- **The Setup:** Instead of building a massive new Lair to keep tracking the creatures (which showed she hadn't let go of her obsession), Makayla and Asher are now *dismantling* the equipment.
- **The Conflict:** Makayla connects her crystal one last time and sees a massive red spike on the screen. She instantly panics, her old instinct to control the threat surging back.
- **The Resolution:** Asher calmly points out that it's just the wind in the reeds passing over the sensors. Makayla listens, realizes she misread the situation, and accepts the correction. She smiles, lets out a breath, and physically unplugs the machine—relinquishing her need for control. 

## Verification & Compilation
- Ran `node compile.js` which automatically detected the new `s17c.md` file.
- `manifest.json` updated successfully to include the new sequence.
- All final outputs (`full_script.md`, `full_script.html`, and `index.html` Gallery) have been generated with the new story beats flawlessly integrated.

> [!TIP]
> You can preview the finalized sequence and its flow in the `full_script.html` or by browsing the updated Storyboard Hub gallery!
