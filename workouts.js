// Zaman Fitness — exercise library and workout generator.
//
// Builds a balanced session from the user's goal and the equipment they
// actually own. Kept separate from app.js so the catalogue can grow (or move
// to Firestore) without touching the UI.

// Equipment offered at onboarding, mapped to the tags exercises require.
const EQUIPMENT = [
  { name: 'Bodyweight & No Equipment', tag: 'bodyweight' },
  { name: 'Free Weights',              tag: 'freeweights' },
  { name: 'Resistance Bands',          tag: 'bands' },
  { name: 'Pull-up Bar',               tag: 'pullup' },
  { name: 'Kettlebell',                tag: 'kettlebell' },
  { name: 'Bench',                     tag: 'bench' },
  { name: 'Yoga Mat',                  tag: 'mat' },
  { name: 'Exercise Mat',              tag: 'mat' },
  { name: 'Foam Roller',               tag: 'foamroller' },
  { name: 'Massage Ball',              tag: 'ball' },
  { name: 'Stretching Strap',          tag: 'strap' }
];

const GOALS = [
  ['Lose Weight',   'Burn calories and get lean',  '⌁'],
  ['Gain Muscle',   'Build muscle and size',       'ϟ'],
  ['Gain Strength', 'Improve power and strength',  '◉'],
  ['Look Bigger',   'Bodybuilding & hypertrophy',  '◌']
];

// Set/rep/rest prescription per goal. `secs` is used for timed holds.
const SCHEMES = {
  'Lose Weight':   { reps: [15, 15, 15],        secs: [40, 40, 40],     rest: 35,  tag: 'Conditioning' },
  'Gain Muscle':   { reps: [12, 10, 8, 8],      secs: [45, 40, 35, 30], rest: 75,  tag: 'Hypertrophy' },
  'Gain Strength': { reps: [5, 5, 3, 3, 3],     secs: [30, 30, 25, 25, 20], rest: 150, tag: 'Strength' },
  'Look Bigger':   { reps: [12, 12, 10, 10],    secs: [45, 45, 40, 40], rest: 70,  tag: 'Hypertrophy' }
};

// needs: [] means bodyweight — always available. Otherwise ANY one tag suffices.
const EXERCISES = [
  // mobility / warmup
  { n: 'Foam Roller Thoracic Extensions', m: 'Thoracic spine • Mobility', p: 'mobility', needs: ['foamroller'], unit: 'time', load: 'Bodyweight' },
  { n: 'Massage Ball Foot Release',       m: 'Feet • Calves',             p: 'mobility', needs: ['ball'],       unit: 'time', load: 'Bodyweight' },
  { n: 'Hamstring Strap Stretch',         m: 'Hamstrings • Hips',         p: 'mobility', needs: ['strap'],      unit: 'time', load: 'Bodyweight' },
  { n: 'Cat-Cow Flow',                    m: 'Spine • Core',              p: 'mobility', needs: [],            unit: 'time', load: 'Bodyweight' },
  { n: 'Arm Circles & Leg Swings',        m: 'Shoulders • Hips',          p: 'mobility', needs: [],            unit: 'time', load: 'Bodyweight' },
  { n: 'Band Pull-Aparts',                m: 'Rear delts • Upper back',   p: 'mobility', needs: ['bands'],     unit: 'reps', load: 'Light band' },

  // push
  { n: 'Push-Up',                   m: 'Chest • Triceps • Shoulders', p: 'push', needs: [],              unit: 'reps', load: 'Bodyweight' },
  { n: 'Incline Push-Up',           m: 'Upper chest • Triceps',       p: 'push', needs: [],              unit: 'reps', load: 'Bodyweight' },
  { n: 'Diamond Push-Up',           m: 'Triceps • Inner chest',       p: 'push', needs: [],              unit: 'reps', load: 'Bodyweight' },
  { n: 'Pike Push-Up',              m: 'Shoulders • Triceps',         p: 'push', needs: [],              unit: 'reps', load: 'Bodyweight' },
  { n: 'Dumbbell Bench Press',      m: 'Chest • Triceps',             p: 'push', needs: ['bench'],       unit: 'reps', load: 'Moderate' },
  { n: 'Dumbbell Floor Press',      m: 'Chest • Triceps',             p: 'push', needs: ['freeweights'], unit: 'reps', load: 'Moderate' },
  { n: 'Overhead Dumbbell Press',   m: 'Shoulders • Triceps',         p: 'push', needs: ['freeweights'], unit: 'reps', load: 'Moderate' },
  { n: 'Kettlebell Overhead Press', m: 'Shoulders • Core',            p: 'push', needs: ['kettlebell'],  unit: 'reps', load: 'Moderate' },
  { n: 'Band Chest Press',          m: 'Chest • Triceps',             p: 'push', needs: ['bands'],       unit: 'reps', load: 'Medium band' },
  { n: 'Bench Dip',                 m: 'Triceps • Chest',             p: 'push', needs: [],              unit: 'reps', load: 'Bodyweight' },

  // pull
  { n: 'Pull-Up',                m: 'Lats • Biceps',              p: 'pull', needs: ['pullup'],      unit: 'reps', load: 'Bodyweight' },
  { n: 'Inverted Row',           m: 'Mid back • Biceps',          p: 'pull', needs: ['pullup'],      unit: 'reps', load: 'Bodyweight' },
  { n: 'Dumbbell Row',           m: 'Lats • Mid back • Biceps',   p: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Moderate' },
  { n: 'Dumbbell Reverse Fly',   m: 'Rear delts • Upper back',    p: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Light' },
  { n: 'Band Row',               m: 'Mid back • Biceps',          p: 'pull', needs: ['bands'],       unit: 'reps', load: 'Medium band' },
  { n: 'Band Face Pull',         m: 'Rear delts • Rotator cuff',  p: 'pull', needs: ['bands'],       unit: 'reps', load: 'Light band' },
  { n: 'Kettlebell Swing',       m: 'Glutes • Hamstrings • Back', p: 'pull', needs: ['kettlebell'],  unit: 'reps', load: 'Moderate' },
  { n: 'Dumbbell Curl',          m: 'Biceps • Forearms',          p: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Light' },
  { n: 'Superman Hold',          m: 'Lower back • Glutes',        p: 'pull', needs: [], unit: 'time', load: 'Bodyweight' },
  { n: 'Prone Y-T-W Raise',      m: 'Upper back • Rear delts',    p: 'pull', needs: [], unit: 'reps', load: 'Bodyweight' },
  { n: 'Reverse Snow Angel',     m: 'Upper back • Shoulders',     p: 'pull', needs: [], unit: 'reps', load: 'Bodyweight' },
  { n: 'Doorway Isometric Row',  m: 'Mid back • Biceps',          p: 'pull', needs: [], unit: 'time', load: 'Bodyweight' },

  // legs
  { n: 'Bodyweight Squat',      m: 'Quads • Glutes',            p: 'legs', needs: [],                             unit: 'reps', load: 'Bodyweight' },
  { n: 'Reverse Lunge',         m: 'Quads • Glutes • Balance',  p: 'legs', needs: [],                             unit: 'reps', load: 'Bodyweight' },
  { n: 'Bulgarian Split Squat', m: 'Quads • Glutes',            p: 'legs', needs: [],                             unit: 'reps', load: 'Bodyweight' },
  { n: 'Glute Bridge',          m: 'Glutes • Hamstrings',       p: 'legs', needs: [],                             unit: 'reps', load: 'Bodyweight' },
  { n: 'Calf Raise',            m: 'Calves',                    p: 'legs', needs: [],                             unit: 'reps', load: 'Bodyweight' },
  { n: 'Goblet Squat',          m: 'Quads • Glutes • Core',     p: 'legs', needs: ['freeweights', 'kettlebell'],  unit: 'reps', load: 'Moderate' },
  { n: 'Romanian Deadlift',     m: 'Hamstrings • Glutes',       p: 'legs', needs: ['freeweights', 'kettlebell'],  unit: 'reps', load: 'Moderate' },
  { n: 'Band Lateral Walk',     m: 'Glute medius • Hips',       p: 'legs', needs: ['bands'],                      unit: 'reps', load: 'Medium band' },

  // core
  { n: 'Plank',             m: 'Core • Shoulders',      p: 'core', needs: [], unit: 'time', load: 'Bodyweight' },
  { n: 'Hollow Hold',       m: 'Deep core',             p: 'core', needs: [], unit: 'time', load: 'Bodyweight' },
  { n: 'Mountain Climbers', m: 'Core • Conditioning',   p: 'core', needs: [], unit: 'time', load: 'Bodyweight' },
  { n: 'Dead Bug',          m: 'Deep core • Stability', p: 'core', needs: [], unit: 'reps', load: 'Bodyweight' },
  { n: 'Russian Twist',     m: 'Obliques • Core',       p: 'core', needs: [], unit: 'reps', load: 'Bodyweight' }
];

function tagsFor(selected) {
  const set = new Set();
  EQUIPMENT.forEach(e => { if (selected.includes(e.name)) set.add(e.tag); });
  return set;
}

function isAvailable(ex, tags) {
  return ex.needs.length === 0 || ex.needs.some(t => tags.has(t));
}

// preferLoaded: for strength and hypertrophy goals, a low-rep prescription only
// makes sense on an exercise you can actually load, so pick equipment-based work
// whenever the user owns the gear for it.
function pick(pool, used, preferLoaded) {
  // Try loaded work first, then the whole pool. Only ever return something not
  // already in this session — repeating an exercise is worse than a shorter one.
  const loaded = preferLoaded ? pool.filter(e => e.needs.length > 0) : [];
  const tiers = loaded.length ? [loaded, pool] : [pool];
  for (const tier of tiers) {
    const fresh = tier.filter(e => !used.has(e.n));
    if (fresh.length) {
      const chosen = fresh[Math.floor(Math.random() * fresh.length)];
      used.add(chosen.n);
      return chosen;
    }
  }
  return null;
}

// One warmup plus a balanced set of main lifts, scaled by goal.
function generateWorkout(goal, selectedEquipment) {
  const tags = tagsFor(selectedEquipment || []);
  const scheme = SCHEMES[goal] || SCHEMES['Gain Muscle'];
  const usable = EXERCISES.filter(e => isAvailable(e, tags));
  const byPattern = p => usable.filter(e => e.p === p);
  const used = new Set();

  const chosen = [];
  const warmup = pick(byPattern('mobility'), used);
  if (warmup) chosen.push({ ex: warmup, warmup: true });

  // Rotate through movement patterns so no session is all-push or all-legs.
  // Strength work uses long rests, so it gets fewer movements to keep the
  // session inside a realistic hour.
  const patterns = goal === 'Gain Strength'
    ? ['push', 'pull', 'legs', 'core']
    : ['push', 'pull', 'legs', 'push', 'pull', 'core'];
  const preferLoaded = goal !== 'Lose Weight';
  patterns.forEach(p => {
    const e = pick(byPattern(p), used, preferLoaded);
    if (e) chosen.push({ ex: e, warmup: false });
  });

  const exercises = chosen.map(({ ex, warmup }) => {
    const reps = warmup
      ? ['60s']
      : (ex.unit === 'time' ? scheme.secs.map(s => s + 's') : scheme.reps.slice());
    return {
      name: ex.n,
      muscles: ex.m,
      reps,
      rest: warmup ? 30 : scheme.rest,
      weight: ex.load,
      warmup
    };
  });

  // Rough session length: ~40s of work per set, plus the prescribed rest.
  const totalSets = exercises.reduce((n, e) => n + e.reps.length, 0);
  const seconds = exercises.reduce((n, e) => n + e.reps.length * (40 + e.rest), 0);

  return {
    name: titleFor(goal),
    title: titleFor(goal) + ': ' + scheme.tag,
    focus: exercises.filter(e => !e.warmup).map(e => e.muscles.split(' • ')[0]).join(' • '),
    blurb: blurbFor(goal),
    minutes: Math.max(10, Math.round(seconds / 60)),
    totalSets,
    goal,
    scheme: scheme.tag,
    createdAt: new Date().toISOString(),
    exercises
  };
}

function titleFor(goal) {
  return {
    'Lose Weight': 'Lean Burn Circuit',
    'Gain Muscle': 'Muscle Builder',
    'Gain Strength': 'Strength Session',
    'Look Bigger': 'Size & Shape'
  }[goal] || 'Training Session';
}

function blurbFor(goal) {
  return {
    'Lose Weight': 'Higher reps and short rests to keep your heart rate up and burn more in less time.',
    'Gain Muscle': 'Moderate reps close to failure, with enough rest to move real weight each set.',
    'Gain Strength': 'Low reps and long rests so every set is heavy, sharp and well recovered.',
    'Look Bigger': 'Volume across every angle to build width and thickness without wrecking your joints.'
  }[goal] || 'A balanced session built around your goal.';
}
