// Dense, curated micro-break cards. No medical claims; gentle cues.
// Cards are used to build routines of ~3–5 minutes.

window.SLOTH_ROUTINES = {
  presets: [
    { id: 'eyes', name: 'Eyes + jaw reset', minutes: 3, tags:['eyes','jaw','screen'], cards: ['20-20-20','palms','jaw-drop','blink-bath','neck-nod'] },
    { id: 'wrists', name: 'Wrists + shoulders', minutes: 4, tags:['wrists','shoulders','desk'], cards: ['wrist-prayer','wrist-ext','shakeout','shoulder-roll','scap-squeeze','doorway-chest'] },
    { id: 'full', name: 'Full-body gentle', minutes: 5, tags:['full','gentle'], cards: ['breath-box','neck-side','cat-cow','hip-hinge','calf-rock','gratitude'] }
  ],

  cards: [
    {
      id:'20-20-20', area:'Eyes', seconds:30,
      title:'20-20-20 (soft focus)',
      body:'Look at something ~20 feet away for 20 seconds. Let your eyes un-clench. Blink like you mean it.'
    },
    {
      id:'palms', area:'Eyes', seconds:25,
      title:'Palming (no pressure)',
      body:'Warm your hands and cup them over your eyes without pressing. Breathe slowly for 5 breaths.'
    },
    {
      id:'blink-bath', area:'Eyes', seconds:20,
      title:'Blink bath',
      body:'Blink deliberately: 10 slow blinks, then close your eyes for 5 seconds. Repeat once.'
    },
    {
      id:'jaw-drop', area:'Jaw', seconds:25,
      title:'Jaw drop + tongue rest',
      body:'Let your jaw hang slightly. Place your tongue softly on the roof of your mouth. Exhale long.'
    },
    {
      id:'neck-nod', area:'Neck', seconds:30,
      title:'Yes/no nods',
      body:'Tiny nod “yes” 5x. Then tiny shake “no” 5x. Keep it micro. The goal is “unstick,” not “stretch hard.”'
    },
    {
      id:'neck-side', area:'Neck', seconds:35,
      title:'Side tilt (gentle)',
      body:'Tilt right ear toward right shoulder (no shrug). Hold 10s. Switch. Then do a 5s “look to armpit” if it feels good.'
    },
    {
      id:'shoulder-roll', area:'Shoulders', seconds:30,
      title:'Shoulder rolls',
      body:'Roll shoulders up/back/down 5x, then reverse 5x. Slow enough that you could narrate it.'
    },
    {
      id:'scap-squeeze', area:'Upper back', seconds:30,
      title:'Scapular squeeze',
      body:'Pull shoulder blades gently toward each other, then release. 8 reps. Keep ribs down; no superhero posture.'
    },
    {
      id:'doorway-chest', area:'Chest', seconds:35,
      title:'Doorway chest open (optional)',
      body:'Forearm on a door frame, step through slightly until you feel a mild chest stretch. 15s each side. Skip if it pinches.'
    },
    {
      id:'wrist-prayer', area:'Wrists', seconds:30,
      title:'Prayer stretch',
      body:'Palms together at chest. Lower hands until you feel a mild stretch. Keep shoulders relaxed. 15s.'
    },
    {
      id:'wrist-ext', area:'Wrists', seconds:30,
      title:'Wrist extensor (soft)',
      body:'Arm straight, palm down. With other hand, gently pull fingers toward you. 12–15s per side.'
    },
    {
      id:'shakeout', area:'Arms', seconds:20,
      title:'Shakeout',
      body:'Shake hands and arms loosely for 10–20s. Imagine you’re flicking off urgency. It’s not invited.'
    },
    {
      id:'breath-box', area:'Breath', seconds:45,
      title:'Box breath (mini)',
      body:'In 4… hold 4… out 4… hold 4. Do 3 rounds. If that feels like too much, do in 3 / hold 3 / out 3 / hold 3.'
    },
    {
      id:'cat-cow', area:'Spine', seconds:45,
      title:'Seated cat–cow',
      body:'Hands on knees. Round spine gently (exhale), then arch lightly (inhale). 6 slow reps. Keep it comfortable.'
    },
    {
      id:'hip-hinge', area:'Hips', seconds:35,
      title:'Seated hip hinge',
      body:'Hands on thighs. Hinge forward from hips with a long spine, then return. 6 reps. This is “wake up,” not “work out.”'
    },
    {
      id:'calf-rock', area:'Lower legs', seconds:35,
      title:'Calf rock',
      body:'Stand and rock gently from heels to toes 10x. If standing isn’t it, do ankle circles 8x each direction.'
    },
    {
      id:'gratitude', area:'Mind', seconds:25,
      title:'Tiny gratitude (non-cheesy)',
      body:'Name one thing that is okay right now. That’s the whole exercise. Sloth-approved.'
    }
  ]
};
