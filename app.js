/* Zaman Fitness — application shell, screens and workout session. */

const ICON = {
  back:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>',
  home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/></svg>',
  chart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></svg>',
  clock:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>',
  user:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  spark:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>',
  check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 4 4L19 6"/></svg>',
  play:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>',
  timer:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  video:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3v10l-6-3z"/></svg>',
  list:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  dumbbell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/></svg>',
  shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z"/></svg>',
  offline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.5M19 13a10 10 0 0 0-6-2.9M2 9a15 15 0 0 1 5-3.2M22 9a15 15 0 0 0-9-3.8"/><circle cx="12" cy="20" r="1"/></svg>'
};

const S = {
  screen: 'landing',
  exercises: [],
  workouts: [],
  workout: null,
  session: null,
  lastResult: null,
  authMode: 'register',
  returnTo: 'dashboard',   // where the goal/equipment flow goes back to
  error: '',
  busy: false
};

/* ---- small helpers ---- */

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function attr(v) { return esc(v); }
function el(id) { return document.getElementById(id); }
function val(id) { const e = el(id); return e ? e.value.trim() : ''; }
function u() { return Store.get(); }

function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 2400);
}

function exerciseById(id) {
  return S.exercises.find(e => e.id === id) ||
         DEFAULT_EXERCISES.find(e => e.id === id) ||
         { id, name: 'Unknown exercise', muscles: '', unit: 'reps', load: 'Bodyweight', video: '' };
}
function repLabel(v) { return typeof v === 'number' ? v + ' reps' : v; }
function clockText(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function fmtVolume(kg) { return kg >= 1000 ? (kg / 1000).toFixed(1) + 'k' : String(Math.round(kg)); }

/* ---- derived stats, always recomputed from history ---- */

function dayKey(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function startOfWeek() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
function history() { return u().history || []; }
function streak() {
  const days = new Set(history().map(h => dayKey(h.at)));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function totalMinutes() { return history().reduce((n, h) => n + (h.minutes || 0), 0); }
function totalVolume() { return history().reduce((n, h) => n + (h.volume || 0), 0); }
function thisWeek() { const s = startOfWeek(); return history().filter(h => new Date(h.at) >= s); }
function thisMonth() { const n = new Date(); return history().filter(h => { const t = new Date(h.at); return t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear(); }); }
function weeklyPct() { return Math.min(100, Math.round(thisWeek().length / (u().weeklyTarget || 5) * 100)); }
function weekMinutes() {
  const s = startOfWeek(), out = [0, 0, 0, 0, 0, 0, 0];
  history().forEach(h => { const i = Math.floor((new Date(h.at) - s) / 86400000); if (i >= 0 && i < 7) out[i] += h.minutes || 0; });
  return out;
}
function whenLabel(iso) {
  const k = dayKey(iso), y = new Date(); y.setDate(y.getDate() - 1);
  if (k === dayKey(new Date())) return 'Today';
  if (k === dayKey(y)) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ---- layout pieces ---- */

function phone(inner, nav) { return `<div class="phone-wrap"><div class="phone">${inner}${nav || ''}</div></div>`; }
function bar(title, back) {
  return `<div class="topbar">${back ? `<button class="icon-btn" onclick="${back}" aria-label="Back">${ICON.back}</button>` : '<span class="spacer"></span>'}<h1>${esc(title)}</h1><span class="spacer"></span></div>`;
}
function nav(active) {
  const item = (id, icon, label, screen) =>
    `<button class="${active === id ? 'on' : ''}" onclick="go('${screen}')">${icon}<span>${label}</span></button>`;
  return `<nav class="nav">${item('home', ICON.home, 'Home', 'dashboard')}${item('browse', ICON.list, 'Workouts', 'browse')}${item('progress', ICON.chart, 'Progress', 'progress')}${item('profile', ICON.user, 'Profile', 'profile')}</nav>`;
}
function emptyBox(icon, title, body, cta) {
  return `<div class="empty"><div class="mark">${icon}</div><h3>${esc(title)}</h3><p class="sub">${esc(body)}</p>${cta ? `<div style="margin-top:14px">${cta}</div>` : ''}</div>`;
}

/* ---- 1. visitor page ---- */

function landingScreen() {
  const features = [
    [ICON.spark, 'Workouts built for you', 'Pick your goal and tick off the equipment you own. Every session is assembled from exercises you can actually do — no gym machines you have never seen.'],
    [ICON.video, 'A tutorial for every move', 'Not sure how an exercise should look? Each one links to a video demonstration, so you can check your form before your first rep.'],
    [ICON.timer, 'Guided set by set', 'The app walks you through every set, counts your rest between them, and tells you what is coming next. Put the phone down and train.'],
    [ICON.dumbbell, 'Log what you lift', 'Record the weight on each set. Next time the app puts it back for you, so you can see when it is time to add more.'],
    [ICON.chart, 'Progress you can see', 'Streaks, weekly minutes and total volume, all worked out from sessions you actually finished. Nothing is invented.'],
    [ICON.offline, 'Works without signal', 'Install it to your home screen and it opens like an app. Basements and bad gym wifi are not a problem.']
  ];
  const steps = [
    ['Create an account or continue as a guest', 'An account keeps your training on every device you sign into. Guest mode keeps everything on this phone, and you can upgrade later without losing anything.'],
    ['Tell us your goal and your kit', 'Lose weight, gain muscle, get stronger or look bigger — then tick what you own, from nothing at all to a full home gym.'],
    ['Train', 'Start a workout and follow it set by set, with rest timers and tutorials built in.'],
    ['Watch it add up', 'Every finished session feeds your streak, your weekly goal and your total volume lifted.']
  ];
  const faqs = [
    ['Do I need any equipment?', 'No. Pick "Bodyweight & No Equipment" and the app builds sessions you can do in a bedroom. If you own bands, dumbbells or a pull-up bar, tick them and the sessions get better.'],
    ['Is it free?', 'Yes. Zaman Fitness is free to use and there are no adverts in the app.'],
    ['What is guest mode?', 'You can use the whole app without signing up. Your training is stored on that device only, so clearing your browser or changing phone loses it. Creating an account later carries everything across.'],
    ['Do I need to be experienced?', 'No. Every exercise links to a tutorial video, sets and reps are chosen for you, and the bodyweight sessions are a reasonable place to start from zero.'],
    ['Can I use it on a computer?', 'Yes. It works in any modern browser on phone, tablet or desktop, and can be installed to your home screen.']
  ];

  return `<div class="landing">
    <div class="landing-nav">
      <div class="brand"><span class="brand-mark">Z</span>Zaman Fitness</div>
      <button class="btn btn-ghost" style="width:auto" onclick="openAuth('signin')">Sign in</button>
    </div>

    <header class="hero">
      <span class="pill">Free • No adverts • Works offline</span>
      <h1>Workouts that fit your goal, your kit and your time.</h1>
      <p>Zaman Fitness builds each session around what you want to achieve and the equipment you actually own, then walks you through it set by set — with a tutorial video on every exercise and your lifted weight tracked as you go.</p>
      <div class="hero-cta">
        <button class="btn btn-primary" onclick="go('start')">Get started</button>
        <button class="btn btn-secondary" onclick="openAuth('signin')">I already have an account</button>
      </div>
      <p class="tiny" style="margin-top:12px">Free, and you can try the whole app without signing up.</p>

      <div class="hero-art">
        <div class="hero-stats">
          <div><b>${DEFAULT_EXERCISES.length}+</b><span>Exercises in the library</span></div>
          <div><b>4</b><span>Goals to train for</span></div>
          <div><b>${EQUIPMENT.length}</b><span>Equipment options</span></div>
          <div><b>0</b><span>Cost, forever</span></div>
        </div>
      </div>
    </header>

    <h2>What you get</h2>
    <div class="feature-grid">
      ${features.map(([icon, title, body]) => `<div class="feature"><div class="mark">${icon}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('')}
    </div>

    <h2>How it works</h2>
    <div class="steps">
      ${steps.map(([title, body], i) => `<div class="step-row"><span class="num">${i + 1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join('')}
    </div>

    <h2>Questions</h2>
    <div class="faq">
      ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    </div>

    <h2>Ready to start?</h2>
    <div class="card" style="text-align:center">
      <p class="sub" style="margin-bottom:14px">It takes about a minute: choose a goal, tick your equipment, and your first session is ready.</p>
      <div class="hero-cta" style="justify-content:center">
        <button class="btn btn-primary" onclick="go('start')">Get started</button>
      </div>
    </div>

    <div class="landing-foot">
      <div class="brand" style="justify-content:center;margin-bottom:8px"><span class="brand-mark">Z</span>Zaman Fitness</div>
      <p>Train with what you have. ${Backend.online ? '' : 'Currently running offline — accounts need a connection.'}</p>
    </div>
  </div>`;
}

/* ---- 2. how do you want to start? ---- */

function startScreen() {
  const offline = !Backend.online;
  return phone(`${bar('Get started', "go('landing')")}
    <div class="screen no-nav">
      <h1 class="h1" style="margin-top:6px">How would you like to start?</h1>
      <p class="sub">Either way you get the whole app — the only difference is where your training is saved.</p>

      <div class="stack" style="margin-top:18px">
        <div class="card ${offline ? '' : 'card-pick'}">
          <div class="wk-top">
            <span class="wk-art">${ICON.user}</span>
            <span class="wk-info"><h3>Create a free account</h3><p>Recommended</p></span>
          </div>
          <p class="sub" style="margin:11px 0 0">Your workouts, history and progress are saved to your account, so they follow you to any phone, tablet or computer you sign in on.</p>
          <button class="btn btn-primary" style="margin-top:12px" ${offline ? 'disabled' : ''} onclick="openAuth('register')">Create account</button>
          ${offline ? `<p class="hint">Accounts need a connection. ${esc(Backend.reason)}.</p>` : ''}
        </div>

        <div class="card">
          <div class="wk-top">
            <span class="wk-art" style="background:#f0f2ea;color:#8b9184">${ICON.offline}</span>
            <span class="wk-info"><h3>Continue as a guest</h3><p>No sign-up</p></span>
          </div>
          <p class="sub" style="margin:11px 0 0">Start straight away. Everything is kept on this device only — clearing your browser or changing phone loses it. You can create an account later and it all moves across.</p>
          <button class="btn btn-secondary" style="margin-top:12px" onclick="startGuest()">Continue as guest</button>
        </div>
      </div>

      <div class="section-head"><span class="sub">Already have an account?</span></div>
      <button class="btn btn-secondary" ${offline ? 'disabled' : ''} onclick="openAuth('signin')">Sign in</button>
    </div>`);
}

/* ---- 3. accounts ---- */

function authScreen() {
  const reg = S.authMode === 'register';
  const offline = !Backend.online;
  return phone(`${bar(reg ? 'Create account' : 'Sign in', "go('start')")}
    <div class="screen no-nav">
      ${offline ? `<div class="card" style="margin-bottom:14px"><b>Accounts are unavailable</b><p class="sub" style="margin-top:6px">${esc(Backend.reason)}. You can still use the app as a guest on this device.</p><button class="btn btn-secondary" style="margin-top:12px" onclick="startGuest()">Continue as guest</button></div>` : ''}
      <p class="sub">${reg ? 'One account keeps your workouts and progress on every device you sign into.' : 'Welcome back. Sign in to pick up where you left off.'}</p>
      <div style="margin-top:16px">
        ${reg ? `<label class="field"><span>Name</span><input class="input" id="f-name" type="text" autocomplete="name" placeholder="Your name"></label>` : ''}
        <label class="field"><span>Email</span><input class="input" id="f-email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></label>
        <label class="field"><span>Password</span><input class="input" id="f-pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'At least 6 characters' : 'Your password'}"></label>
      </div>
      <div class="error" id="f-error">${esc(S.error)}</div>
      <button class="btn btn-primary" id="f-submit" ${offline ? 'disabled' : ''} onclick="submitAuth()">${reg ? 'Create account' : 'Sign in'}</button>
      <button class="btn btn-secondary" style="margin-top:9px" ${offline ? 'disabled' : ''} onclick="googleAuth()">Continue with Google</button>
      ${!reg ? `<button class="btn btn-ghost" style="margin-top:6px" onclick="forgotPassword()">Forgot your password?</button>` : ''}
      <div class="section-head"><span class="sub">${reg ? 'Already have an account?' : 'New here?'}</span></div>
      <button class="btn btn-secondary" onclick="openAuth('${reg ? 'signin' : 'register'}')">${reg ? 'Sign in instead' : 'Create an account'}</button>
      ${Store.hasLocal() && reg ? `<p class="hint" style="text-align:center;margin-top:12px">Your guest training on this device will move into the new account.</p>` : ''}
    </div>`);
}

/* ---- 3. onboarding ---- */

function goalScreen() {
  const cur = u().goal;
  return phone(`${bar('Your goal', "go('" + (S.returnTo || 'dashboard') + "')")}
    <div class="screen no-nav">
      <div class="progress-bar"><span style="width:50%"></span></div>
      <div style="margin-top:24px"><div class="eyebrow">Step 1 of 2</div><h1 class="h1">What is your target?</h1><p class="sub">This sets how many reps and how much rest each session gives you. You can change it any time.</p></div>
      <div class="stack" style="margin-top:20px">
        ${GOALS.map(g => `<button class="option ${cur === g.id ? 'on' : ''}" onclick="pickGoal('${g.id}')"><span class="option-icon">${g.mark}</span><span class="option-copy"><span class="option-title">${esc(g.name)}</span><span class="option-meta">${esc(g.blurb)}</span></span><span class="check">${cur === g.id ? ICON.check : ''}</span></button>`).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:20px" onclick="go('equipment')">Next</button>
    </div>`);
}

function equipmentScreen() {
  const have = u().equipment || [];
  const none = have.length === 0;
  const count = tag => DEFAULT_EXERCISES.filter(e => tag === 'bodyweight' ? !e.needs.length : e.needs.includes(tag)).length;
  return phone(`${bar('Your equipment', "go('goal')")}
    <div class="screen no-nav">
      <div class="progress-bar"><span style="width:100%"></span></div>
      <div style="margin-top:20px"><div class="eyebrow">Step 2 of 2</div><h1 class="h1">What can you train with?</h1><p class="sub">Tick everything you have access to. We only build sessions from gear you own.</p></div>
      <div class="chip-row" style="margin:14px 0 10px">
        <button class="chip on" onclick="quickEquip()">Bodyweight only</button>
        <button class="chip" onclick="clearEquip()">Clear all</button>
      </div>
      <div class="pill flat" style="margin-bottom:10px">${have.length} selected</div>
      <div class="stack">
        ${EQUIPMENT.map(e => {
          const on = have.includes(e.name);
          return `<button class="option ${on ? 'on' : ''}" onclick="toggleEquip('${attr(e.name)}')"><span class="option-icon">${ICON.dumbbell}</span><span class="option-copy"><span class="option-title">${esc(e.name)}</span><span class="option-meta">${count(e.tag)} exercises</span></span><span class="check">${on ? ICON.check : ''}</span></button>`;
        }).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:20px" ${none ? 'disabled' : ''} onclick="finishOnboarding()">${none ? 'Pick at least one' : 'Save'}</button>
    </div>`);
}

/* ---- 4. dashboard ---- */

function dashboardScreen() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = u().name || (Backend.user && Backend.user.displayName) || '';
  const w = S.workout;
  const published = S.workouts.filter(x => x.published !== false);

  return phone(`${bar('Zaman Fitness', '')}
    <div class="screen">
      <div class="hero-card">
        <small style="opacity:.85">${greet}${name ? ', ' + esc(name.split(' ')[0]) : ''} 💪</small>
        <h2>${history().length ? 'Ready for the next one?' : 'Let\'s get your first session in'}</h2>
        <div class="row"><span class="mini">🔥 ${history().length} workout${history().length === 1 ? '' : 's'}</span><span class="mini">● ${weeklyPct()}% weekly goal</span></div>
      </div>

      <div class="stat-grid" style="margin-top:11px">
        <div class="stat"><span>Streak</span><b>${streak()}</b><span>day${streak() === 1 ? '' : 's'}</span></div>
        <div class="stat"><span>Workouts</span><b>${thisMonth().length}</b><span>this month</span></div>
        <div class="stat"><span>Minutes</span><b>${totalMinutes()}</b><span>total</span></div>
      </div>

      ${!u().onboarded ? `<div class="card" style="margin-top:12px;border-color:#cfe0a8;background:#f6faee">
        <div class="wk-top">
          <span class="wk-art">◎</span>
          <span class="wk-info"><h3>Set your goal and equipment</h3><p>Takes about a minute</p></span>
        </div>
        <p class="sub" style="margin:11px 0 0">Right now we assume ${esc(goalName(u().goal).toLowerCase())} with bodyweight only. Tell us what you are training for and what you own, and every session is built to match.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="openSetup('dashboard')">Set my goal</button>
      </div>` : ''}

      <div class="section-head"><h2 class="h2">${w ? 'Your next workout' : 'Get a workout'}</h2>${w ? `<a onclick="buildWorkout()">Rebuild</a>` : ''}</div>
      ${w ? workoutCard(w, true) : emptyBox(ICON.spark, 'No workout selected', 'Build one around your goal and equipment, or pick a ready-made plan.', `<button class="btn btn-primary" onclick="buildWorkout()">Build my workout</button>`)}

      <div class="section-head"><h2 class="h2">Ready-made plans</h2><a onclick="go('browse')">See all</a></div>
      ${published.length
        ? `<div class="stack">${published.slice(0, 2).map(x => workoutCard(x, false)).join('')}</div>`
        : emptyBox(ICON.list, 'No plans published yet', 'Your generated workouts still work. Published plans will appear here once an admin adds them.')}
    </div>${nav('home')}`);
}

function workoutCard(w, primary) {
  const sets = countSets(w.items), mins = estimateMinutes(w.items);
  const focus = w.items.filter((_, i) => i > 0).slice(0, 3).map(i => (exerciseById(i.exerciseId).muscles || '').split(' • ')[0]).filter(Boolean).join(' • ');
  return `<div class="card">
    <div class="wk-top">
      <span class="wk-art">${ICON.spark}</span>
      <span class="wk-info"><h3>${esc(w.name)}</h3><p>${esc(focus || goalName(w.goal))}</p></span>
      <span class="pill">${esc(w.generated ? 'For you' : goalName(w.goal))}</span>
    </div>
    <div class="metrics">
      <div class="metric"><b>${w.items.length}</b><span>Exercises</span></div>
      <div class="metric"><b>${sets}</b><span>Sets</span></div>
      <div class="metric"><b>${mins}</b><span>Minutes</span></div>
    </div>
    <button class="btn ${primary ? 'btn-primary' : 'btn-secondary'}" style="margin-top:12px" onclick="openWorkout('${attr(w.id)}')">${primary && S.session ? 'Resume workout' : 'View workout'}</button>
  </div>`;
}

function buildingScreen() {
  return phone(`${bar('Building', '')}<div class="screen no-nav"><div class="loading"><div class="spinner"></div><div><h3 class="h3">Building your workout</h3><p class="sub">Matching ${esc(goalName(u().goal).toLowerCase())} to your equipment.</p></div><div class="loader" style="width:200px"><span></span></div></div></div>`);
}

/* ---- 5. browse ---- */

function browseScreen() {
  const list = S.workouts.filter(w => w.published !== false);
  const mine = list.filter(w => w.goal === u().goal);
  const others = list.filter(w => w.goal !== u().goal);
  const card = w => `<button class="option" onclick="openWorkout('${attr(w.id)}')">
      <span class="option-icon">${ICON.spark}</span>
      <span class="option-copy"><span class="option-title">${esc(w.name)}</span>
      <span class="option-meta">${goalName(w.goal)} · ${w.items.length} exercises · ${estimateMinutes(w.items)} min</span></span>
      <span style="color:#9ca394">›</span></button>`;

  return phone(`${bar('Workouts', '')}
    <div class="screen">
      <div class="card">
        <div class="wk-top"><span class="wk-art">${ICON.spark}</span><span class="wk-info"><h3>Build one for me</h3><p>${esc(goalName(u().goal))} · ${(u().equipment || []).length} equipment</p></span></div>
        <button class="btn btn-primary" style="margin-top:12px" onclick="buildWorkout()">Build my workout</button>
      </div>
      ${mine.length ? `<div class="section-head"><h2 class="h2">For ${esc(goalName(u().goal).toLowerCase())}</h2></div><div class="stack">${mine.map(card).join('')}</div>` : ''}
      ${others.length ? `<div class="section-head"><h2 class="h2">Other plans</h2></div><div class="stack">${others.map(card).join('')}</div>` : ''}
      ${!list.length ? `<div style="margin-top:16px">${emptyBox(ICON.list, 'No published plans', 'Nothing has been published yet. Building your own works exactly the same way.')}</div>` : ''}
    </div>${nav('browse')}`);
}

/* ---- 6. workout detail ---- */

function detailScreen() {
  const w = S.workout;
  if (!w) return dashboardScreen();
  const sess = S.session && S.session.workoutId === w.id ? S.session : null;
  const done = sess ? sess.setsDone : 0;
  const total = countSets(w.items);

  return phone(`${bar('Workout', "go('dashboard')")}
    <div class="screen">
      <div class="detail-hero">
        <span class="pill" style="background:rgba(255,255,255,.16);color:#fff">${esc(goalName(w.goal))}</span>
        <h1>${esc(w.name)}</h1>
        <p>${esc(w.description || '')}</p>
        <div class="detail-stats">
          <div><b>${w.items.length}</b><span>Exercises</span></div>
          <div><b>${total}</b><span>Sets</span></div>
          <div><b>${estimateMinutes(w.items)}</b><span>Minutes</span></div>
        </div>
      </div>
      <div class="section-head"><h2 class="h2">Exercises</h2><span class="pill flat">${done} / ${total} sets</span></div>
      <div class="card">
        <div class="progress-bar" style="margin-bottom:8px"><span style="width:${total ? Math.round(done / total * 100) : 0}%"></span></div>
        ${w.items.map((item, i) => {
          const ex = exerciseById(item.exerciseId);
          const complete = sess && i < sess.exIndex;
          return `<div class="ex-row ${complete ? 'done' : ''}">
            <span class="ex-num ${complete ? 'done' : ''}">${complete ? ICON.check : i + 1}</span>
            <span class="ex-copy"><b>${esc(ex.name)}</b><small>${item.reps.length} × ${esc(repLabel(item.reps[0]))} · ${item.rest}s rest</small></span>
            <a class="chip" href="${attr(videoLinkFor(ex))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${ICON.video}</a>
          </div>`;
        }).join('')}
        <button class="btn btn-primary" style="margin-top:14px" onclick="startSession()">${ICON.play} ${sess ? 'Resume workout' : 'Start workout'}</button>
      </div>
    </div>`);
}

/* ---- 7. the session ---- */

function sessionScreen() {
  const s = S.session;
  const w = S.workout;
  if (!s || !w) return detailScreen();
  const item = w.items[s.exIndex];
  const ex = exerciseById(item.exerciseId);
  const reps = item.reps[s.setIndex];
  const head = bar(`Exercise ${s.exIndex + 1} of ${w.items.length}`, "go('detail')");
  const dots = item.reps.map((r, i) => `<span class="set-dot ${i < s.setIndex ? 'done' : i === s.setIndex ? 'now' : ''}">${i + 1}</span>`).join('');

  if (s.phase === 'rest') {
    return phone(`${head}<div class="screen no-nav">
      <div class="timer-card">
        <div class="option-icon" style="margin:0 auto 8px">${ICON.timer}</div>
        <div class="eyebrow">Rest</div>
        <div class="timer" id="rest-clock">${clockText(s.restLeft)}</div>
        <div class="progress-bar"><span id="rest-bar" style="width:100%"></span></div>
        <p class="sub" style="margin-top:12px">Up next — ${esc(s.nextLabel)}</p>
      </div>
      <button class="btn btn-secondary" style="margin-top:13px" onclick="skipRest()">Skip rest →</button>
    </div>`);
  }

  if (s.phase === 'work') {
    const numeric = typeof reps === 'number';
    return phone(`${head}<div class="screen no-nav">
      <div class="eyebrow">Set ${s.setIndex + 1} of ${item.reps.length}</div>
      <h1 class="h1">${esc(ex.name)}</h1>
      <p class="sub">${esc(ex.muscles)}</p>
      <div class="set-dots">${dots}</div>
      <div class="timer-card" style="margin-top:14px">
        <div class="eyebrow">Target</div>
        <div class="timer">${esc(repLabel(reps))}</div>
        <p class="sub">${esc(ex.load)} · then ${item.rest}s rest</p>
        ${numeric ? `<div class="weight-row">
            <button class="step" onclick="bumpWeight(-2.5)" aria-label="Less weight">−</button>
            <label class="weight-field"><input id="set-weight" type="number" inputmode="decimal" step="0.5" min="0" value="${u().lastWeights[ex.id] || 0}"><span>kg</span></label>
            <button class="step" onclick="bumpWeight(2.5)" aria-label="More weight">+</button>
          </div><p class="hint">${ex.load === 'Bodyweight' ? 'Added weight — leave at 0 for bodyweight' : 'Log what you actually lifted'}</p>` : ''}
      </div>
      <div class="stat-grid" style="margin-top:11px">
        <div class="stat"><span>Sets</span><b>${s.setsDone}</b><span>of ${countSets(w.items)}</span></div>
        <div class="stat"><span>Volume</span><b>${fmtVolume(s.volume)}</b><span>kg</span></div>
        <div class="stat"><span>Elapsed</span><b>${elapsedMinutes()}</b><span>min</span></div>
      </div>
      <div class="bottom-cta"><button class="btn btn-primary" onclick="completeSet()">${ICON.check} Complete set ${s.setIndex + 1}</button></div>
    </div>`);
  }

  // 'ready'
  return phone(`${head}<div class="screen no-nav">
    <div class="illus"><svg viewBox="0 0 200 150" fill="none"><rect x="28" y="114" width="145" height="7" rx="3" fill="#9bb45d"/><path d="M60 113 82 68h37l22 45" stroke="#557817" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="48" r="15" fill="#c9d7a2"/><path d="M92 64 82 91m18-24 24 14m-34-7-20 22m40-12 15 29" stroke="#557817" stroke-width="7" stroke-linecap="round"/><path d="M42 77h115" stroke="#557817" stroke-width="6" stroke-linecap="round"/><path d="M38 67v20m124-20v20" stroke="#9aaf54" stroke-width="8" stroke-linecap="round"/></svg></div>
    <div class="eyebrow">${item.warmup || s.exIndex === 0 ? 'Warm up' : 'Get ready'}</div>
    <h1 class="h1">${esc(ex.name)}</h1>
    <p class="sub">${esc(ex.muscles)}</p>
    <div class="set-dots">${dots}</div>
    <a class="btn btn-secondary" style="margin-top:14px" href="${attr(videoLinkFor(ex))}" target="_blank" rel="noopener noreferrer">${ICON.video} ${hasOwnVideo(ex) ? 'Watch tutorial' : 'Find a tutorial'}</a>
    <div class="option" style="margin-top:11px;background:var(--amber-soft);border-color:#f3d69c">
      <span class="option-icon" style="background:#fff;color:var(--amber)">↗</span>
      <span class="option-copy"><span class="option-title">Load</span><span class="option-meta">Stop 1–2 reps short of failure with clean form.</span></span>
      <b style="color:var(--amber)">${esc(ex.load)}</b>
    </div>
    <div class="stat-grid" style="margin-top:11px">
      <div class="stat"><span>Sets</span><b>${item.reps.length}</b></div>
      <div class="stat"><span>Target</span><b>${esc(repLabel(item.reps[0]))}</b></div>
      <div class="stat"><span>Rest</span><b>${item.rest}s</b></div>
    </div>
    <div class="bottom-cta"><button class="btn btn-primary" onclick="beginSet()">${ICON.play} Start set ${s.setIndex + 1}</button></div>
  </div>`);
}

function doneScreen() {
  const r = S.lastResult || { minutes: 0, sets: 0, reps: 0, volume: 0, name: '', stamp: '' };
  return phone(`${bar('Complete', '')}
    <div class="screen">
      <div class="done-hero">
        <div class="trophy">🏆</div>
        <span class="pill" style="background:rgba(255,255,255,.18);color:#fff">Workout logged</span>
        <h1 style="font:800 21px Manrope,sans-serif;margin:10px 0 4px">Nice work.</h1>
        <p style="font-size:11px;opacity:.85;margin:0">${esc(r.name)} · ${esc(r.stamp)}</p>
      </div>
      <div class="done-grid">
        <div><small>⏱ Minutes</small><b>${r.minutes}</b></div>
        <div><small>✓ Sets</small><b>${r.sets}</b></div>
        <div><small>▣ Volume</small><b>${r.volume ? fmtVolume(r.volume) + ' kg' : r.reps + ' reps'}</b></div>
        <div><small>🔥 Streak</small><b>${streak()}</b></div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="go('dashboard')">Back to dashboard</button>
      <button class="btn btn-secondary" style="margin-top:9px" onclick="go('history')">See history</button>
    </div>`);
}

/* ---- 8. progress, history, profile ---- */

function progressScreen() {
  const mins = weekMinutes(), max = Math.max(1, ...mins), pct = weeklyPct();
  return phone(`${bar('Progress', '')}
    <div class="screen">
      <div class="section-head"><div><div class="eyebrow">This week</div><h1 class="h1" style="margin:2px 0 0">${history().length ? 'Keep it going' : 'Nothing logged yet'}</h1></div><span class="pill">🔥 ${streak()} days</span></div>
      <div class="card">
        <div class="ring" style="background:conic-gradient(var(--green) 0 ${pct}%,#e5eadb ${pct}% 100%)"><div><b>${pct}%</b><span>weekly goal</span></div></div>
        <div class="stat-grid">
          <div class="stat"><span>Workouts</span><b>${thisWeek().length}</b><span>of ${u().weeklyTarget || 5}</span></div>
          <div class="stat"><span>Minutes</span><b>${mins.reduce((a, b) => a + b, 0)}</b><span>this week</span></div>
          <div class="stat"><span>Volume</span><b>${fmtVolume(totalVolume())}</b><span>kg all time</span></div>
        </div>
      </div>
      <div class="section-head"><h2 class="h2">Weekly activity</h2></div>
      <div class="card">
        <div class="bars">${mins.map((v, i) => `<div><i class="${v ? '' : 'off'}" style="height:${Math.round(v / max * 100)}%"></i><small>${['M','T','W','T','F','S','S'][i]}</small></div>`).join('')}</div>
        <p class="tiny" style="text-align:center;margin:9px 0 0">Minutes trained per day</p>
      </div>
    </div>${nav('progress')}`);
}

function historyScreen() {
  const h = history();
  return phone(`${bar('History', "go('dashboard')")}
    <div class="screen">
      ${h.length ? `<div class="pill flat" style="margin-bottom:11px">${h.length} session${h.length === 1 ? '' : 's'} · ${totalMinutes()} minute${totalMinutes() === 1 ? '' : 's'}</div>
        <div class="stack">${h.map(x => `<div class="card"><div class="wk-top"><span class="wk-art">${ICON.check}</span><span class="wk-info"><h3>${esc(x.name)}</h3><p>${esc(whenLabel(x.at))} · ${x.minutes} min · ${x.sets} sets${x.volume ? ' · ' + fmtVolume(x.volume) + ' kg' : ''}</p></span></div></div>`).join('')}</div>`
        : emptyBox(ICON.clock, 'No sessions yet', 'Finish a workout and it will appear here with your time, sets and volume.')}
    </div>`);
}

function profileScreen() {
  const signedIn = Boolean(Backend.user);
  const name = u().name || (Backend.user && Backend.user.displayName) || 'Athlete';
  const email = Backend.user ? Backend.user.email : '';
  return phone(`${bar('Profile', '')}
    <div class="screen">
      <div class="card" style="display:flex;gap:13px;align-items:center">
        <span class="option-icon" style="width:52px;height:52px;border-radius:17px">${ICON.user}</span>
        <span style="flex:1;min-width:0"><h2 class="h2">${esc(signedIn ? name : 'Guest')}</h2>
        <p class="sub" style="margin-top:2px">${esc(signedIn ? email : 'Training saved on this device only')}</p></span>
      </div>

      ${!signedIn ? `<div class="card" style="margin-top:12px;border-color:#e2d3ac;background:var(--amber-soft)">
        <h3 class="h3">Your progress is only on this phone</h3>
        <p class="sub" style="margin:6px 0 12px">Create a free account and everything you have logged moves across, then follows you to any device.</p>
        <button class="btn btn-primary" onclick="openAuth('register')">Create account</button>
        <button class="btn btn-secondary" style="margin-top:8px" onclick="openAuth('signin')">I already have one</button>
      </div>` : ''}

      <div class="section-head"><h2 class="h2">Training</h2></div>
      <div class="stack">
        <button class="option" onclick="openSetup('profile')"><span class="option-icon">◎</span><span class="option-copy"><span class="option-title">Goal</span><span class="option-meta">${esc(goalName(u().goal))}</span></span><span style="color:#9ca394">›</span></button>
        <button class="option" onclick="S.returnTo='profile';go('equipment')"><span class="option-icon">${ICON.dumbbell}</span><span class="option-copy"><span class="option-title">Equipment</span><span class="option-meta">${(u().equipment || []).length} selected</span></span><span style="color:#9ca394">›</span></button>
        <button class="option" onclick="go('history')"><span class="option-icon">${ICON.clock}</span><span class="option-copy"><span class="option-title">History</span><span class="option-meta">${history().length} session${history().length === 1 ? '' : 's'}</span></span><span style="color:#9ca394">›</span></button>
      </div>

      ${Backend.isAdmin ? `<div class="section-head"><h2 class="h2">Admin</h2></div>
        <button class="btn btn-secondary" onclick="openAdmin()">${ICON.shield} Open admin panel</button>` : ''}

      <div class="section-head"><h2 class="h2">Account</h2></div>
      <div class="card">
        <p class="tiny" style="margin:0 0 4px"><b>Storage</b></p>
        <p class="sub">${esc(signedIn ? 'Synced to your account' : 'This device only')} · ${esc(Backend.online ? 'server connected' : Backend.reason)}</p>
        ${signedIn ? `<p class="tiny" style="margin-top:10px"><b>Your user ID</b></p><p class="tiny" style="word-break:break-all;user-select:all">${esc(Backend.uid)}</p><p class="hint">An existing admin needs this ID to make you an admin.</p>` : ''}
      </div>
      <div class="stack" style="margin-top:11px">
        ${signedIn ? `<button class="btn btn-secondary" onclick="doSignOut()">Sign out</button>` : ''}
        <button class="btn btn-danger" onclick="confirmWipe()">Delete all my data</button>
      </div>
    </div>${nav('profile')}`);
}

/* ---- router ---- */

const SCREENS = {
  landing: landingScreen, start: startScreen, auth: authScreen, goal: goalScreen, equipment: equipmentScreen,
  dashboard: dashboardScreen, building: buildingScreen, browse: browseScreen, detail: detailScreen,
  session: sessionScreen, done: doneScreen, progress: progressScreen, history: historyScreen,
  profile: profileScreen, signingIn: signingInScreen, admin: () => AdminPanel.render()
};

function render() {
  const view = SCREENS[S.screen] || landingScreen;
  const root = el('app');
  if (root) root.innerHTML = view();
}

function go(screen) {
  if (screen !== 'session') stopRest();
  S.error = '';
  S.screen = screen;
  if (screen !== 'admin' && location.hash === '#admin') history.replaceState(null, '', location.pathname);
  render();
  window.scrollTo(0, 0);
}

/* ---- entry choices ---- */

function openAuth(mode) { S.authMode = mode; S.error = ''; go('auth'); }

function startGuest() {
  Store.useGuest();
  go('dashboard');
}

async function submitAuth() {
  const btn = el('f-submit');
  const email = val('f-email'), pass = val('f-pass'), name = val('f-name');
  if (!email || !pass) { showError('Enter your email and password.'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Please wait…'; }
  try {
    const hadLocal = Store.hasLocal();
    if (S.authMode === 'register') {
      await Backend.register(email, pass, name);
      await Store.useAccount();
      if (hadLocal) { const moved = await Store.adoptLocalInto(); if (moved) toast('Your guest training moved across'); }
      if (name) Store.set({ name });
    } else {
      await Backend.signIn(email, pass);
      await Store.useAccount();
    }
    await afterSignIn();
  } catch (err) {
    showError(Backend.readable(err));
    if (btn) { btn.disabled = false; btn.textContent = S.authMode === 'register' ? 'Create account' : 'Sign in'; }
  }
}

async function googleAuth() {
  try {
    const hadLocal = Store.hasLocal();
    await Backend.signInGoogle();
    await Store.useAccount();
    if (hadLocal) { const moved = await Store.adoptLocalInto(); if (moved) toast('Your guest training moved across'); }
    if (!u().name && Backend.user.displayName) Store.set({ name: Backend.user.displayName });
    await afterSignIn();
  } catch (err) { showError(Backend.readable(err)); }
}

async function forgotPassword() {
  const email = val('f-email');
  if (!email) { showError('Enter your email address first, then tap this again.'); return; }
  try { await Backend.sendReset(email); toast('Password reset email sent'); }
  catch (err) { showError(Backend.readable(err)); }
}

function afterSignIn() {
  go('dashboard');
  loadCatalogue();
}

function showError(msg) {
  S.error = msg;
  const e = el('f-error');
  if (e) e.textContent = msg; else render();
}

async function doSignOut() {
  stopRest();
  await Store.flush();
  await Backend.signOut();
  Store.leave();
  S.workout = null; S.session = null;
  go('landing');
}

async function confirmWipe() {
  if (!window.confirm('Delete all your workouts, history and settings? This cannot be undone.')) return;
  await Store.wipe();
  S.workout = null; S.session = null;
  toast('Everything deleted');
  go(Backend.user ? 'goal' : 'landing');
  if (!Backend.user) Store.leave();
}

/* ---- onboarding actions ---- */

function pickGoal(id) { Store.set({ goal: id }); render(); }
function toggleEquip(name) {
  const have = u().equipment || [];
  Store.set({ equipment: have.includes(name) ? have.filter(x => x !== name) : have.concat(name) });
  render();
}
function quickEquip() { Store.set({ equipment: ['Bodyweight & No Equipment'] }); render(); }
function clearEquip() { Store.set({ equipment: [] }); render(); }

// Opened from the dashboard or from Profile, and returns wherever it came from.
function openSetup(from) { S.returnTo = from || 'dashboard'; go('goal'); }

function finishOnboarding() {
  Store.set({ onboarded: true });
  toast('Training preferences saved');
  go(S.returnTo || 'dashboard');
}

/* ---- workouts ---- */

async function loadCatalogue() {
  const [ex, wk] = await Promise.all([Backend.loadExercises(), Backend.loadWorkouts()]);
  const before = S.exercises.length + S.workouts.length;
  S.exercises = (ex && ex.length) ? ex : DEFAULT_EXERCISES.slice();
  S.workouts = (wk && wk.length) ? wk : DEFAULT_WORKOUTS.slice();
  // Only repaint if the catalogue changed and the current screen shows it.
  if (before !== S.exercises.length + S.workouts.length &&
      ['dashboard', 'browse', 'detail', 'admin'].includes(S.screen)) render();
}

function buildWorkout() {
  // Generating takes under a millisecond, so there is nothing to wait for.
  S.workout = generateWorkout(u().goal, u().equipment, S.exercises);
  S.session = null;
  go('detail');
}

function openWorkout(id) {
  if (id === 'generated' && S.workout) { go('detail'); return; }
  const found = S.workouts.find(w => w.id === id);
  if (!found) { toast('That workout is no longer available'); return; }
  if (!S.workout || S.workout.id !== found.id) S.session = null;
  S.workout = found;
  go('detail');
}

/* ---- session ---- */

let restTimer = null;
function stopRest() { if (restTimer) { clearInterval(restTimer); restTimer = null; } }
function elapsedMinutes() { return S.session ? Math.max(0, Math.round((Date.now() - S.session.startedAt) / 60000)) : 0; }

function startSession() {
  const w = S.workout;
  if (!w || !w.items.length) return;
  if (!S.session || S.session.workoutId !== w.id) {
    S.session = { workoutId: w.id, exIndex: 0, setIndex: 0, setsDone: 0, repsDone: 0, volume: 0,
                  log: [], phase: 'ready', startedAt: Date.now(), restLeft: 0, restTotal: 0, nextLabel: '' };
  }
  go('session');
}

function beginSet() { S.session.phase = 'work'; render(); }

function bumpWeight(delta) {
  const f = el('set-weight');
  if (!f) return;
  f.value = Math.max(0, Math.round(((parseFloat(f.value) || 0) + delta) * 2) / 2);
}

function completeSet() {
  const s = S.session, w = S.workout;
  const item = w.items[s.exIndex];
  const ex = exerciseById(item.exerciseId);
  const reps = item.reps[s.setIndex];
  const field = el('set-weight');
  const kg = field ? Math.max(0, parseFloat(field.value) || 0) : 0;

  s.setsDone++;
  if (typeof reps === 'number') s.repsDone += reps;
  if (typeof reps === 'number' && kg > 0) s.volume += reps * kg;
  s.log.push({ exerciseId: ex.id, set: s.setIndex + 1, reps, kg });

  if (kg > 0) { const lw = Object.assign({}, u().lastWeights); lw[ex.id] = kg; Store.set({ lastWeights: lw }); }

  const lastSet = s.setIndex + 1 >= item.reps.length;
  const lastExercise = s.exIndex + 1 >= w.items.length;
  if (lastSet && lastExercise) { finishWorkout(); return; }
  s.nextLabel = lastSet ? exerciseById(w.items[s.exIndex + 1].exerciseId).name : `Set ${s.setIndex + 2} of ${item.reps.length}`;
  startRest(item.rest || 60);
}

function startRest(seconds) {
  const s = S.session;
  stopRest();
  s.phase = 'rest'; s.restLeft = seconds; s.restTotal = seconds;
  render();
  restTimer = setInterval(() => {
    s.restLeft--;
    if (s.restLeft <= 0) { stopRest(); advance(); return; }
    const c = el('rest-clock'); if (c) c.textContent = clockText(s.restLeft);
    const b = el('rest-bar'); if (b) b.style.width = Math.round(s.restLeft / s.restTotal * 100) + '%';
  }, 1000);
}
function skipRest() { stopRest(); advance(); }

function advance() {
  const s = S.session, w = S.workout;
  if (s.setIndex + 1 < w.items[s.exIndex].reps.length) s.setIndex++;
  else { s.exIndex++; s.setIndex = 0; }
  s.phase = 'ready';
  render();
}

async function finishWorkout() {
  const s = S.session, w = S.workout;
  stopRest();
  const minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
  S.lastResult = {
    name: w.name, minutes, sets: s.setsDone, reps: s.repsDone, volume: Math.round(s.volume),
    stamp: new Date().toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  };
  const entry = { name: w.name, at: new Date().toISOString(), minutes, sets: s.setsDone,
                  reps: s.repsDone, volume: Math.round(s.volume), goal: w.goal, log: s.log };
  Store.set({ history: [entry].concat(history()) });
  S.session = null;
  go('done');
  Store.flush();          // a finished workout is worth writing out straight away
}

/* ---- admin entry ---- */

function openAdmin() {
  if (!Backend.isAdmin) { toast('Admin access only'); return; }
  location.hash = '#admin';
  AdminPanel.open();
}

/* ---- boot ---- */

function signingInScreen() {
  return `<div class="loading"><div class="spinner"></div><p class="sub">Signing you in…</p></div>`;
}

async function boot() {
  // Paint before touching the network. The bundled catalogue can draw every
  // screen, so a visitor or a returning guest sees the app immediately and
  // Firebase loads behind them. Previously nothing appeared until the SDK and
  // two Firestore reads had finished, which is what made loading feel slow.
  S.exercises = DEFAULT_EXERCISES.slice();
  S.workouts = DEFAULT_WORKOUTS.slice();

  const remembered = Store.savedMode();
  const guestReady = remembered === 'guest' && Store.hasLocal();

  if (guestReady) { Store.useGuest(); go('dashboard'); }
  else if (remembered === 'account') { S.screen = 'signingIn'; render(); }
  else go('landing');

  /* --- everything below happens after that first paint --- */
  await Backend.init();

  if (Backend.user) {
    await Store.useAccount();
    if (location.hash === '#admin' && Backend.isAdmin) { AdminPanel.open(); loadCatalogue(); return; }
    go('dashboard');
  } else if (!guestReady) {
    // Either a first-time visitor, or a remembered account whose session ended.
    go('landing');
  }

  loadCatalogue();   // not awaited: the bundled catalogue is already on screen
}

Backend.onAuth(async (user) => {
  // Reacts to a session expiring or a sign-out in another tab.
  if (!user && Store.mode === 'account') { Store.leave(); go('landing'); }
});

boot();
