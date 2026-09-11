/* Zaman Fitness — built-in catalogue and workout generator.
 *
 * These are the defaults the app ships with. Once an admin seeds the library
 * they live in Firestore and become editable; until then (and whenever
 * Firestore is unreachable) the app falls back to exactly this data, so the
 * product always works.
 */

const GOALS = [
  { id: 'lose',     name: 'Lose Weight',   blurb: 'Burn calories and get lean',     mark: '⌁' },
  { id: 'muscle',   name: 'Gain Muscle',   blurb: 'Build muscle and size',          mark: 'ϟ' },
  { id: 'strength', name: 'Gain Strength', blurb: 'Improve power and strength',     mark: '◉' },
  { id: 'bigger',   name: 'Look Bigger',   blurb: 'Bodybuilding & hypertrophy',     mark: '◌' }
];

const EQUIPMENT = [
  { tag: 'bodyweight',  name: 'Bodyweight & No Equipment' },
  { tag: 'freeweights', name: 'Free Weights' },
  { tag: 'bands',       name: 'Resistance Bands' },
  { tag: 'pullup',      name: 'Pull-up Bar' },
  { tag: 'kettlebell',  name: 'Kettlebell' },
  { tag: 'bench',       name: 'Bench' },
  { tag: 'mat',         name: 'Yoga / Exercise Mat' },
  { tag: 'foamroller',  name: 'Foam Roller' },
  { tag: 'ball',        name: 'Massage Ball' },
  { tag: 'strap',       name: 'Stretching Strap' }
];

// Per-goal prescription. `secs` is used when an exercise is a timed hold.
const SCHEMES = {
  lose:     { label: 'Conditioning', reps: [15, 15, 15],       secs: [40, 40, 40],         rest: 35 },
  muscle:   { label: 'Hypertrophy',  reps: [12, 10, 8, 8],     secs: [45, 40, 35, 30],     rest: 75 },
  strength: { label: 'Strength',     reps: [5, 5, 3, 3, 3],    secs: [30, 30, 25, 25, 20], rest: 150 },
  bigger:   { label: 'Hypertrophy',  reps: [12, 12, 10, 10],   secs: [45, 45, 40, 40],     rest: 70 }
};

/* id       — stable key, also the Firestore document id
 * needs    — [] means bodyweight (always available); otherwise ANY one tag
 * unit     — 'reps' or 'time'
 * video    — admin-supplied tutorial URL; blank falls back to a YouTube search */
const DEFAULT_EXERCISES = [
  { id: 'foam-thoracic',  name: 'Foam Roller Thoracic Extensions', muscles: 'Thoracic spine • Mobility', pattern: 'mobility', needs: ['foamroller'], unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'ball-foot',      name: 'Massage Ball Foot Release',       muscles: 'Feet • Calves',             pattern: 'mobility', needs: ['ball'],       unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'strap-hamstring',name: 'Hamstring Strap Stretch',         muscles: 'Hamstrings • Hips',         pattern: 'mobility', needs: ['strap'],      unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'cat-cow',        name: 'Cat-Cow Flow',                    muscles: 'Spine • Core',              pattern: 'mobility', needs: [],             unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'arm-leg-swings', name: 'Arm Circles & Leg Swings',        muscles: 'Shoulders • Hips',          pattern: 'mobility', needs: [],             unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'band-pullapart', name: 'Band Pull-Aparts',                muscles: 'Rear delts • Upper back',   pattern: 'mobility', needs: ['bands'],      unit: 'reps', load: 'Light band', video: '' },

  { id: 'pushup',         name: 'Push-Up',                   muscles: 'Chest • Triceps • Shoulders', pattern: 'push', needs: [],             unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'incline-pushup', name: 'Incline Push-Up',           muscles: 'Upper chest • Triceps',       pattern: 'push', needs: [],             unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'diamond-pushup', name: 'Diamond Push-Up',           muscles: 'Triceps • Inner chest',       pattern: 'push', needs: [],             unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'pike-pushup',    name: 'Pike Push-Up',              muscles: 'Shoulders • Triceps',         pattern: 'push', needs: [],             unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'bench-dip',      name: 'Bench Dip',                 muscles: 'Triceps • Chest',             pattern: 'push', needs: [],             unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'db-bench',       name: 'Dumbbell Bench Press',      muscles: 'Chest • Triceps',             pattern: 'push', needs: ['bench'],      unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'db-floor-press', name: 'Dumbbell Floor Press',      muscles: 'Chest • Triceps',             pattern: 'push', needs: ['freeweights'],unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'db-ohp',         name: 'Overhead Dumbbell Press',   muscles: 'Shoulders • Triceps',         pattern: 'push', needs: ['freeweights'],unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'kb-press',       name: 'Kettlebell Overhead Press', muscles: 'Shoulders • Core',            pattern: 'push', needs: ['kettlebell'], unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'band-chest',     name: 'Band Chest Press',          muscles: 'Chest • Triceps',             pattern: 'push', needs: ['bands'],      unit: 'reps', load: 'Medium band', video: '' },

  { id: 'pullup',         name: 'Pull-Up',              muscles: 'Lats • Biceps',              pattern: 'pull', needs: ['pullup'],      unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'inverted-row',   name: 'Inverted Row',         muscles: 'Mid back • Biceps',          pattern: 'pull', needs: ['pullup'],      unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'db-row',         name: 'Dumbbell Row',         muscles: 'Lats • Mid back • Biceps',   pattern: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'db-reverse-fly', name: 'Dumbbell Reverse Fly', muscles: 'Rear delts • Upper back',    pattern: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Light',       video: '' },
  { id: 'db-curl',        name: 'Dumbbell Curl',        muscles: 'Biceps • Forearms',          pattern: 'pull', needs: ['freeweights'], unit: 'reps', load: 'Light',       video: '' },
  { id: 'band-row',       name: 'Band Row',             muscles: 'Mid back • Biceps',          pattern: 'pull', needs: ['bands'],       unit: 'reps', load: 'Medium band', video: '' },
  { id: 'band-face-pull', name: 'Band Face Pull',       muscles: 'Rear delts • Rotator cuff',  pattern: 'pull', needs: ['bands'],       unit: 'reps', load: 'Light band',  video: '' },
  { id: 'kb-swing',       name: 'Kettlebell Swing',     muscles: 'Glutes • Hamstrings • Back', pattern: 'pull', needs: ['kettlebell'],  unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'superman',       name: 'Superman Hold',        muscles: 'Lower back • Glutes',        pattern: 'pull', needs: [],              unit: 'time', load: 'Bodyweight',  video: '' },
  { id: 'ytw-raise',      name: 'Prone Y-T-W Raise',    muscles: 'Upper back • Rear delts',    pattern: 'pull', needs: [],              unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'snow-angel',     name: 'Reverse Snow Angel',   muscles: 'Upper back • Shoulders',     pattern: 'pull', needs: [],              unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'doorway-row',    name: 'Doorway Isometric Row',muscles: 'Mid back • Biceps',          pattern: 'pull', needs: [],              unit: 'time', load: 'Bodyweight',  video: '' },

  { id: 'squat',          name: 'Bodyweight Squat',      muscles: 'Quads • Glutes',           pattern: 'legs', needs: [],                            unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'reverse-lunge',  name: 'Reverse Lunge',         muscles: 'Quads • Glutes • Balance', pattern: 'legs', needs: [],                            unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'split-squat',    name: 'Bulgarian Split Squat', muscles: 'Quads • Glutes',           pattern: 'legs', needs: [],                            unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'glute-bridge',   name: 'Glute Bridge',          muscles: 'Glutes • Hamstrings',      pattern: 'legs', needs: [],                            unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'calf-raise',     name: 'Calf Raise',            muscles: 'Calves',                   pattern: 'legs', needs: [],                            unit: 'reps', load: 'Bodyweight',  video: '' },
  { id: 'goblet-squat',   name: 'Goblet Squat',          muscles: 'Quads • Glutes • Core',    pattern: 'legs', needs: ['freeweights','kettlebell'],  unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'rdl',            name: 'Romanian Deadlift',     muscles: 'Hamstrings • Glutes',      pattern: 'legs', needs: ['freeweights','kettlebell'],  unit: 'reps', load: 'Moderate',    video: '' },
  { id: 'band-lateral',   name: 'Band Lateral Walk',     muscles: 'Glute medius • Hips',      pattern: 'legs', needs: ['bands'],                     unit: 'reps', load: 'Medium band', video: '' },

  { id: 'plank',          name: 'Plank',             muscles: 'Core • Shoulders',      pattern: 'core', needs: [], unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'hollow-hold',    name: 'Hollow Hold',       muscles: 'Deep core',             pattern: 'core', needs: [], unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'mountain-climb', name: 'Mountain Climbers', muscles: 'Core • Conditioning',   pattern: 'core', needs: [], unit: 'time', load: 'Bodyweight', video: '' },
  { id: 'dead-bug',       name: 'Dead Bug',          muscles: 'Deep core • Stability', pattern: 'core', needs: [], unit: 'reps', load: 'Bodyweight', video: '' },
  { id: 'russian-twist',  name: 'Russian Twist',     muscles: 'Obliques • Core',       pattern: 'core', needs: [], unit: 'reps', load: 'Bodyweight', video: '' }
];

/* Curated plans shipped with the app. Admins can edit these and publish more.
 * `items` reference exercise ids; sets/reps/rest are stored per item so an
 * admin can prescribe something different from the goal default. */
const DEFAULT_WORKOUTS = [
  {
    id: 'full-body-starter',
    name: 'Full Body Starter',
    goal: 'muscle',
    description: 'A balanced first session you can do anywhere. No equipment, nothing complicated — learn the movements and build the habit.',
    published: true,
    items: [
      { exerciseId: 'arm-leg-swings', reps: ['60s'],            rest: 30 },
      { exerciseId: 'pushup',         reps: [10, 10, 8],        rest: 60 },
      { exerciseId: 'ytw-raise',      reps: [12, 12, 12],       rest: 60 },
      { exerciseId: 'squat',          reps: [15, 15, 12],       rest: 60 },
      { exerciseId: 'glute-bridge',   reps: [15, 15, 15],       rest: 45 },
      { exerciseId: 'plank',          reps: ['40s','40s','30s'],rest: 45 }
    ]
  },
  {
    id: 'dumbbell-upper',
    name: 'Dumbbell Upper Body',
    goal: 'bigger',
    description: 'Presses and rows for a thicker chest, back and arms. Needs a pair of dumbbells.',
    published: true,
    items: [
      { exerciseId: 'band-pullapart', reps: [15, 15],           rest: 30 },
      { exerciseId: 'db-floor-press', reps: [12, 10, 10, 8],    rest: 75 },
      { exerciseId: 'db-row',         reps: [12, 10, 10, 8],    rest: 75 },
      { exerciseId: 'db-ohp',         reps: [12, 10, 8],        rest: 75 },
      { exerciseId: 'db-curl',        reps: [12, 12, 10],       rest: 60 },
      { exerciseId: 'hollow-hold',    reps: ['40s','40s'],      rest: 45 }
    ]
  },
  {
    id: 'lean-burn',
    name: 'Lean Burn Circuit',
    goal: 'lose',
    description: 'Short rests and continuous work to keep your heart rate up. Bodyweight only, done in under half an hour.',
    published: true,
    items: [
      { exerciseId: 'cat-cow',        reps: ['60s'],                  rest: 20 },
      { exerciseId: 'squat',          reps: [20, 20, 20],             rest: 30 },
      { exerciseId: 'incline-pushup', reps: [15, 15, 15],             rest: 30 },
      { exerciseId: 'reverse-lunge',  reps: [16, 16, 16],             rest: 30 },
      { exerciseId: 'mountain-climb', reps: ['45s','45s','45s'],      rest: 30 },
      { exerciseId: 'russian-twist',  reps: [20, 20, 20],             rest: 30 }
    ]
  }
];

/* ---- helpers shared by the app and the admin panel ---- */

function goalById(id) { return GOALS.find(g => g.id === id) || GOALS[1]; }
function goalName(id) { return goalById(id).name; }

// Blank video falls back to a YouTube search, which always resolves to
// something useful rather than a dead link.
function videoLinkFor(exercise) {
  if (exercise && exercise.video) return exercise.video;
  const q = encodeURIComponent((exercise ? exercise.name : '') + ' exercise form tutorial');
  return 'https://www.youtube.com/results?search_query=' + q;
}
function hasOwnVideo(exercise) { return Boolean(exercise && exercise.video); }

function equipmentTags(selectedNames) {
  const set = new Set();
  EQUIPMENT.forEach(e => { if (selectedNames.includes(e.name)) set.add(e.tag); });
  return set;
}

function exerciseAvailable(ex, tags) {
  return !ex.needs || ex.needs.length === 0 || ex.needs.some(t => tags.has(t));
}

// Total sets in a workout, used everywhere totals are shown.
function countSets(items) { return items.reduce((n, i) => n + i.reps.length, 0); }

// Estimated duration: roughly 40s of work per set, plus the prescribed rest.
function estimateMinutes(items) {
  const secs = items.reduce((n, i) => n + i.reps.length * (40 + (i.rest || 60)), 0);
  return Math.max(5, Math.round(secs / 60));
}

/* Build a session from the user's goal and equipment, drawing on whatever
 * exercise library is currently loaded (Firestore's, or the defaults). */
function generateWorkout(goalId, selectedEquipment, library) {
  const pool = (library && library.length ? library : DEFAULT_EXERCISES);
  const tags = equipmentTags(selectedEquipment || []);
  const scheme = SCHEMES[goalId] || SCHEMES.muscle;
  const usable = pool.filter(e => exerciseAvailable(e, tags));
  const byPattern = p => usable.filter(e => e.pattern === p);
  const used = new Set();

  // Loaded work is preferred for strength and hypertrophy: a 3-rep set only
  // means something on an exercise you can actually add weight to.
  const preferLoaded = goalId !== 'lose';
  function take(pattern) {
    const group = byPattern(pattern);
    const loaded = preferLoaded ? group.filter(e => e.needs && e.needs.length) : [];
    const tiers = loaded.length ? [loaded, group] : [group];
    for (const tier of tiers) {
      const fresh = tier.filter(e => !used.has(e.id));
      if (fresh.length) {
        const chosen = fresh[Math.floor(Math.random() * fresh.length)];
        used.add(chosen.id);
        return chosen;
      }
    }
    return null;   // nothing unused left — skip rather than repeat an exercise
  }

  const items = [];
  const warm = take('mobility');
  if (warm) items.push({ exerciseId: warm.id, reps: ['60s'], rest: 30 });

  // Strength uses long rests, so it gets fewer movements to stay inside an hour.
  const patterns = goalId === 'strength'
    ? ['push', 'pull', 'legs', 'core']
    : ['push', 'pull', 'legs', 'push', 'pull', 'core'];

  patterns.forEach(p => {
    const ex = take(p);
    if (!ex) return;
    const reps = ex.unit === 'time' ? scheme.secs.map(s => s + 's') : scheme.reps.slice();
    items.push({ exerciseId: ex.id, reps, rest: scheme.rest });
  });

  return {
    id: 'generated',
    name: goalById(goalId).name + ' Session',
    goal: goalId,
    description: SCHEME_BLURB[goalId] || '',
    generated: true,
    items
  };
}

const SCHEME_BLURB = {
  lose:     'Higher reps and short rests to keep your heart rate up and burn more in less time.',
  muscle:   'Moderate reps close to failure, with enough rest to move real weight each set.',
  strength: 'Low reps and long rests so every set is heavy, sharp and well recovered.',
  bigger:   'Volume across every angle to build width and thickness without wrecking your joints.'
};
