const icons={
 back:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>`,
 home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/></svg>`,
 chart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></svg>`,
 history:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>`,
 user:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
 spark:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>`,
 check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>`,
 play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>`,
 timer:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>`,
 settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1-1.8 3.1-.2-.1a2 2 0 0 0-2 .1l-.4.2a2 2 0 0 0-1 1.7v.2H10v-.2a2 2 0 0 0-1-1.7l-.4-.2a2 2 0 0 0-2-.1l-.2.1-1.8-3.1.1-.1a2 2 0 0 0 .8-1.7v-.5a2 2 0 0 0-.8-1.7l-.1-.1 1.8-3.1.2.1a2 2 0 0 0 2-.1l.4-.2a2 2 0 0 0 1-1.7v-.2h4.1v.2a2 2 0 0 0 1 1.7l.4.2a2 2 0 0 0 2 .1l.2-.1 1.8 3.1-.1.1a2 2 0 0 0-.8 1.7v.5a2 2 0 0 0 .8 1.7Z"/></svg>`
};

const goals=[['Lose Weight','Burn calories and get lean','⌁'],['Gain Muscle','Build muscle and size','ϟ'],['Gain Strength','Improve power and strength','◉'],['Look Bigger','Bodybuilding & hypertrophy','◌']];
const equipment=['Bodyweight & No Equipment','Free Weights','Resistance Bands','Yoga Mat','Exercise Mat','Foam Roller','Massage Ball','Stretching Strap'];

// The generated workout. Every total shown in the UI is derived from this, so
// the plan, the exercise flow and the completion summary cannot drift apart.
const workout={
 name:'Upper Armor Builder',
 title:'Upper Armor Builder: Press–Pull Power',
 focus:'Push • Pull • Chest • Arms',
 blurb:'Stronger presses, thicker back, and more defined shoulders — without wasting time or overloading joints.',
 minutes:60,
 exercises:[
  {name:'Warmup: Foam Roller Thoracic Extensions',muscles:'Thoracic spine • Mobility',reps:['5 min'],rest:30,weight:'Bodyweight',warmup:true},
  {name:'Incline Chest Press Machine',muscles:'Upper chest • Front delts • Triceps',reps:[12,10,8,6],rest:60,weight:'20 kg'},
  {name:'Lat Pulldown',muscles:'Lats • Mid back • Biceps',reps:[12,10,10,8],rest:60,weight:'35 kg'},
  {name:'Dumbbell Shoulder Press',muscles:'Front delts • Side delts • Triceps',reps:[12,10,8,8],rest:60,weight:'12 kg'},
  {name:'Resistance Band Pull-Aparts',muscles:'Rear delts • Upper back',reps:[15,15,15,15],rest:45,weight:'Medium band'},
  {name:'Triceps Rope Pushdown',muscles:'Triceps • Elbow stability',reps:[12,12,10,10],rest:45,weight:'25 kg'}
 ]
};
const totalSets=workout.exercises.reduce((n,e)=>n+e.reps.length,0);

const defaults={goal:'Gain Muscle',equipment:['Bodyweight & No Equipment'],anon:true,progress:72,completed:4,streak:5,minutes:248,onboarded:false,
 history:[{name:'Full Body Foundation',when:'Mar 22',minutes:48},{name:'Leg Strength Builder',when:'Mar 21',minutes:60},{name:'Upper Armor Builder',when:'Mar 20',minutes:48}]};
const state=Object.assign({screen:'target',session:null},JSON.parse(JSON.stringify(defaults)));

// Only the fields below are persisted; `screen` and `session` stay in memory so
// a reload never drops the user back into a half-finished set.
const PERSISTED=['goal','equipment','anon','progress','completed','streak','minutes','onboarded','history'];
function persist(){const data={};PERSISTED.forEach(k=>data[k]=state[k]);return Store.save(data)}

// store.js should have defined this. If it failed to load, fall back to an
// in-memory stub so the app degrades to "forgetful but working" instead of blank.
if(typeof Store==='undefined'){
 window.Store={init:async()=>'none',load:async()=>null,save:async()=>false,reset:async()=>{},mode:'none',status:'Storage unavailable'};
}

function iconCircle(symbol){return `<div class="option-icon"><b style="font-size:19px">${symbol}</b></div>`}
function repLabel(v){return typeof v==='number'?v+' reps':v}
function clock(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}

function bottomNav(active='home'){return `<nav class="bottom-nav">
<button class="${active==='home'?'active':''}" onclick="go('dashboard')">${icons.home}<span>Home</span></button>
<button class="${active==='progress'?'active':''}" onclick="go('progress')">${icons.chart}<span>Progress</span></button>
<button class="${active==='history'?'active':''}" onclick="go('history')">${icons.history}<span>History</span></button>
<button class="${active==='profile'?'active':''}" onclick="go('profile')">${icons.user}<span>Profile</span></button></nav>`}
function shell(content,nav=''){return `<div class="phone-wrap"><div class="phone">${content}${nav}</div></div>`}
function topBar(title,back=true){return `<div class="topbar">${back?`<button class="icon-btn" onclick="goBack()">${icons.back}</button>`:'<span></span>'}<div style="font:800 15px Manrope">${title}</div><button class="icon-btn" onclick="toast('More options coming soon')">${icons.settings}</button></div>`}

function targetScreen(){return shell(`<div class="safe-top"></div><div class="screen" style="padding-top:20px"><div class="progress-top"><span style="width:25%"></span></div><div style="margin-top:34px"><div class="eyebrow">Step 1 of 4</div><h1 class="h1">What is your target?</h1><p class="sub">Select your primary fitness goal</p></div><div class="stack" style="margin-top:23px">${goals.map(([t,m,s])=>`<button class="option ${state.goal===t?'selected':''}" onclick="setGoal('${t}')">${iconCircle(s)}<div class="option-copy"><div class="option-title">${t}</div><div class="option-meta">${m}</div></div><div class="check">${state.goal===t?icons.check:''}</div></button>`).join('')}</div></div><div class="bottom-cta"><button class="primary" onclick="go('equipment')">Next</button></div>`)}

function equipmentScreen(){return shell(`${topBar('Equipment Available')}<div class="screen"><div class="progress-top"><span style="width:50%"></span></div><p class="sub" style="margin-top:14px">Select all the equipment you have access to. We'll create workouts tailored to your gear.</p><div class="search">⌕<input placeholder="Search equipment..." oninput="filterEquipment(this.value)"></div><div class="filter-row" style="margin:9px 0 12px"><button class="chip active" onclick="selectQuick()">ϟ Quick Start</button><button class="chip" onclick="clearEquipment()">Clear All</button><button class="chip" onclick="toast('Manual equipment editor')">✎ Add Manually</button><button class="chip" onclick="toast('AI photo scanner demo')">▣ AI Photo</button></div><div class="pill" style="margin-bottom:9px">${state.equipment.length} equipment selected</div><div id="equipment-list" class="stack">${equipment.map((e,i)=>`<button data-name="${e.toLowerCase()}" class="option ${state.equipment.includes(e)?'selected':''}" onclick="toggleEquip('${e}')">${iconCircle(i<3?'◆':'○')}<div class="option-copy"><div class="option-title">${e}</div><div class="option-meta">${i===0?'35+ exercises':i===1?'50+ exercises':'12 exercises'}</div></div><div class="check">${state.equipment.includes(e)?icons.check:''}</div></button>`).join('')}</div></div><div class="bottom-cta"><button class="primary" onclick="generate()">Get Started →</button></div>`)}

function dashboardScreen(){return shell(`${topBar('Zaman Fitness',false)}<div class="screen"><div class="hero"><small>Good afternoon 💪</small><h2>${state.anon?'Welcome back':'Welcome, Jeet'}</h2><div class="row"><div class="mini">🔥 ${state.completed} workouts</div><div class="mini">● ${state.progress}% weekly goal</div></div></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Streak</span><strong>${state.streak}</strong><span>days</span></div><div class="stat"><span>Workouts</span><strong>${state.completed}</strong><span>this month</span></div><div class="stat"><span>Minutes</span><strong>${state.minutes}</strong><span>total</span></div></div><div class="section-head"><h2 class="h2">Today's Workout</h2><a onclick="go('history')">View history</a></div><div class="workout-card"><div class="workout-top"><div class="workout-art">${icons.spark}</div><div class="workout-info"><h3>${workout.name}</h3><p>${workout.focus}</p></div><span class="pill">AI Demo</span></div><div class="metrics"><div class="metric"><strong>${workout.exercises.length}</strong><span>Exercises</span></div><div class="metric"><strong>${totalSets}</strong><span>Total Sets</span></div><div class="metric"><strong>${workout.minutes}</strong><span>Minutes</span></div></div><button class="primary" style="margin-top:13px" onclick="go('detail')">Start Workout</button></div><div class="section-head"><h2 class="h2">Create Your Workout</h2></div><div class="generate"><div class="spark">${icons.spark}</div><h3>Personalized training</h3><p>Build a workout around your goal and available equipment.</p><button class="primary" onclick="generate()">${icons.spark} Generate Workout</button></div></div>${bottomNav('home')}`)}

function generatingScreen(){return shell(`${topBar('Creating Workout')}<div class="screen" style="display:grid;place-items:center;min-height:65vh"><div class="generate" style="width:100%"><div class="spark">${icons.spark}</div><h3>Creating your workout</h3><p>Using your ${state.goal.toLowerCase()} goal and selected equipment.</p><div class="loader"><span></span></div><div class="sub">Personalizing exercises • sets • reps • rest</div></div></div>`)}

function detailScreen(){
 const s=state.session;
 const done=s?s.setsDone:0;
 return shell(`${topBar('Workout Details')}<div class="screen"><div class="detail-hero"><span class="pill" style="background:rgba(255,255,255,.15);color:#fff">✦ AI Generated</span><h1>${workout.title}</h1><p>${workout.blurb}</p><div class="detail-stats"><div class="detail-stat"><strong>${workout.exercises.length}</strong><span>Exercises</span></div><div class="detail-stat"><strong>${totalSets}</strong><span>Total Sets</span></div><div class="detail-stat"><strong>${workout.minutes}</strong><span>Minutes</span></div></div></div><div class="section-head"><h2 class="h2">Progress</h2><span class="pill">${done} / ${totalSets} sets done</span></div><div class="workout-card"><div class="progress-top" style="margin-bottom:6px"><span style="width:${Math.round(done/totalSets*100)}%"></span></div>${workout.exercises.map((e,i)=>{
  const complete=s&&i<s.exIndex, current=s&&i===s.exIndex;
  return `<div class="exercise-row${complete?' done':''}"><div class="num-circle${complete?' filled':''}">${complete?icons.check:i+1}</div><div class="exercise-copy"><strong>${e.name}</strong><small>${e.reps.length} × ${repLabel(e.reps[0])} · ${e.warmup?'Warmup':e.rest+'s rest'}</small></div><span style="color:#9ca394">${current?'●':'›'}</span></div>`}).join('')}<button class="primary" style="margin-top:14px" onclick="startSession()">${icons.play} ${s?'Resume Workout':'Start Workout'}</button></div></div>`)}

function exerciseScreen(){
 if(!state.session)return detailScreen();   // no session to show — fall back to the plan
 const s=state.session, ex=workout.exercises[s.exIndex], reps=ex.reps[s.setIndex];
 const header=topBar(`Exercise ${s.exIndex+1} of ${workout.exercises.length}`);
 const dots=ex.reps.map((r,i)=>`<span class="set-dot${i<s.setIndex?' done':i===s.setIndex?' active':''}">${i+1}</span>`).join('');

 if(s.phase==='rest'){
  return shell(`${header}<div class="screen"><div class="timer-card"><div class="spark">${icons.timer}</div><div class="eyebrow">Rest</div><div class="timer">${clock(s.restLeft)}</div><div class="progress-top"><span id="rest-bar" style="width:100%"></span></div><p class="sub" style="margin-top:12px">Up next — ${s.nextLabel}</p></div><button class="secondary" style="margin-top:14px" onclick="skipRest()">Skip rest →</button></div>`)}

 if(s.phase==='work'){
  return shell(`${header}<div class="screen"><div class="eyebrow">Set ${s.setIndex+1} of ${ex.reps.length} — in progress</div><h1 class="h1">${ex.name}</h1><p class="sub">${ex.muscles}</p><div class="set-dots">${dots}</div><div class="timer-card" style="margin-top:14px"><div class="eyebrow">Target</div><div class="timer">${repLabel(reps)}</div><p class="sub">${ex.weight} · then ${ex.rest}s rest</p></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Sets done</span><strong>${s.setsDone}</strong><span>of ${totalSets}</span></div><div class="stat"><span>Reps</span><strong>${s.repsDone}</strong><span>total</span></div><div class="stat"><span>Elapsed</span><strong>${elapsedMinutes()}</strong><span>min</span></div></div></div><div class="bottom-cta"><button class="primary" onclick="completeSet()">${icons.check} Complete Set ${s.setIndex+1}</button></div>`)}

 return shell(`${header}<div class="screen"><div class="exercise-illustration"><svg viewBox="0 0 200 150" fill="none"><rect x="28" y="114" width="145" height="7" rx="3" fill="#9bb45d"/><path d="M60 113 82 68h37l22 45" stroke="#557817" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="48" r="15" fill="#c9d7a2"/><path d="M92 64 82 91m18-24 24 14m-34-7-20 22m40-12 15 29" stroke="#557817" stroke-width="7" stroke-linecap="round"/><path d="M42 77h115" stroke="#557817" stroke-width="6" stroke-linecap="round"/><path d="M38 67v20m124-20v20" stroke="#9aaf54" stroke-width="8" stroke-linecap="round"/></svg></div><div class="eyebrow">Get ready</div><h1 class="h1">${ex.name}</h1><p class="sub">${ex.muscles}</p><div class="set-dots">${dots}</div><div class="option" style="margin-top:14px;background:#fff7e8;border-color:#f3d69c">${iconCircle('↗')}<div class="option-copy"><div class="option-title">Recommended Weight</div><div class="option-meta">Start light and increase if form stays clean.</div></div><b style="color:#d28d1f">${ex.weight}</b></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Sets</span><strong>${ex.reps.length}</strong></div><div class="stat"><span>Reps</span><strong>${ex.reps.map(r=>typeof r==='number'?r:'—').join('/')}</strong></div><div class="stat"><span>Rest</span><strong>${ex.rest}s</strong></div></div><button class="secondary" style="margin-top:12px" onclick="toast('Tutorial video placeholder')">◉ Watch Tutorial</button></div><div class="bottom-cta"><button class="primary" onclick="beginSet()">${icons.play} Start Set ${s.setIndex+1}</button></div>`)}

function completeScreen(){
 const r=state.lastResult||{minutes:0,sets:0,reps:0,calories:0,stamp:'—'};
 return shell(`${topBar('Workout Complete')}<div class="screen"><div class="complete"><div class="trophy">🏆</div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">✓ Workout complete</span><h1 style="font:800 22px Manrope;margin:10px 0 5px">That's a lot of sets! Best mode!</h1><p style="font-size:11px;opacity:.8;margin:0">${workout.name} · ${r.stamp}</p></div><div class="completion-grid"><div class="completion-stat"><small>🔥 Calories</small><strong>${r.calories}</strong></div><div class="completion-stat"><small>⏱ Minutes</small><strong>${r.minutes}</strong></div><div class="completion-stat"><small>▣ Total Reps</small><strong>${r.reps}</strong></div><div class="completion-stat"><small>✓ Completed</small><strong style="color:#5c9d55">${Math.round(r.sets/totalSets*100)}%</strong></div></div><div class="section-head"><h2 class="h2">Completion Progress</h2><span class="pill">${r.sets}/${totalSets} sets</span></div><div class="workout-card"><div class="progress-top"><span style="width:${Math.round(r.sets/totalSets*100)}%"></span></div><button class="primary" style="margin-top:13px" onclick="go('dashboard')">Back to Dashboard</button></div></div>`)}

function progressScreen(){return shell(`${topBar('Your Progress',false)}<div class="screen"><div class="section-head"><div><div class="eyebrow">This week</div><h1 class="h1">Keep the streak alive</h1></div><span class="pill">🔥 ${state.streak} days</span></div><div class="workout-card"><div class="progress-ring" style="background:conic-gradient(var(--green) 0 ${state.progress}%,#e5eadb ${state.progress}% 100%)"><div><strong>${state.progress}%</strong><span>weekly goal</span></div></div><div class="stat-grid"><div class="stat"><span>Workouts</span><strong>${state.completed}</strong><span>/ 5 goal</span></div><div class="stat"><span>Minutes</span><strong>${state.minutes}</strong><span>this week</span></div><div class="stat"><span>Volume</span><strong>1.8k</strong><span>kg</span></div></div></div><div class="section-head"><h2 class="h2">Weekly activity</h2></div><div class="workout-card"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:7px;align-items:end;height:130px">${[48,75,35,90,64,24,18].map((v,i)=>`<div style="text-align:center"><div style="height:${v}px;background:${i<5?'var(--green)':'#dfe5d4'};border-radius:8px 8px 4px 4px"></div><small style="font-size:9px;color:#999">${['M','T','W','T','F','S','S'][i]}</small></div>`).join('')}</div></div></div>${bottomNav('progress')}`)}

function historyScreen(){return shell(`${topBar('Workout History',false)}<div class="screen"><div class="filter-row"><button class="chip active">All</button><button class="chip">This week</button><button class="chip">Strength</button></div><div class="stack" style="margin-top:12px">${state.history.map(h=>`<div class="workout-card"><div class="workout-top"><div class="workout-art">${icons.check}</div><div class="workout-info"><h3>${h.name}</h3><p>${h.when} · ${h.minutes} min</p></div><span class="pill">Completed</span></div></div>`).join('')}</div></div>${bottomNav('history')}`)}

function profileScreen(){return shell(`${topBar('Profile',false)}<div class="screen"><div class="workout-card" style="display:flex;gap:13px;align-items:center"><div class="option-icon" style="width:54px;height:54px;border-radius:17px">${icons.user}</div><div style="flex:1"><h2 class="h2">${state.anon?'Guest Athlete':'Jeet'}</h2><p class="sub" style="margin:3px 0">${state.anon?'Anonymous mode · progress synced to this device':'Fitness profile'}</p></div><span class="pill">Demo</span></div><div class="section-head"><h2 class="h2">Preferences</h2></div><div class="stack"><button class="option" onclick="toast('Goal: '+state.goal)">${iconCircle('◎')}<div class="option-copy"><div class="option-title">Fitness goal</div><div class="option-meta">${state.goal}</div></div>›</button><button class="option" onclick="go('equipment')">${iconCircle('◆')}<div class="option-copy"><div class="option-title">Equipment</div><div class="option-meta">${state.equipment.length} selected</div></div>›</button><button class="option" onclick="toggleAnon()">${iconCircle('◌')}<div class="option-copy"><div class="option-title">Anonymous mode</div><div class="option-meta">${state.anon?'Enabled':'Disabled'} — signed in anonymously</div></div><span class="pill">${state.anon?'ON':'OFF'}</span></button></div><div class="section-head"><h2 class="h2">Storage</h2></div><div class="option"><div class="option-icon" style="color:${Store.mode==='firebase'?'var(--green)':'#9aa08f'}">${icons.spark}</div><div class="option-copy"><div class="option-title">${Store.mode==='firebase'?'Firebase connected':'Offline storage'}</div><div class="option-meta">${Store.status}</div></div></div><div class="section-head"><h2 class="h2">Account</h2></div><div class="stack"><button class="secondary" onclick="openAdmin()">Admin Panel</button><button class="secondary" onclick="resetProgress()">Reset progress</button></div></div>${bottomNav('profile')}`)}

function adminScreen(){return `<div class="desktop-shell"><aside class="desktop-nav"><div class="brand"><div class="brand-mark">Z</div>Zaman Fitness</div><div class="nav-group"><div class="nav-label">Overview</div><button class="nav-btn active">${icons.chart} Dashboard</button><button class="nav-btn">${icons.user} Users</button><button class="nav-btn">${icons.spark} Workouts</button><button class="nav-btn">${icons.settings} Exercises</button><button class="nav-btn">▣ Goals & Equipment</button></div><div class="nav-group"><div class="nav-label">System</div><button class="nav-btn" onclick="closeAdmin()">← Back to App</button></div></aside><main class="desktop-main"><div class="admin-title"><div><button class="chip admin-back" onclick="closeAdmin()">← Back to App</button><div class="eyebrow">Admin Console</div><h1>Zaman Fitness Dashboard</h1><p class="sub">Frontend demo — ${Store.mode==='firebase'?'Firebase connected.':'Firebase can be connected in firebase-config.js.'}</p></div><button class="primary" style="width:auto" onclick="openModal()">+ Add Exercise</button></div><div class="admin-grid"><div class="admin-card"><div class="eyebrow">Users</div><div class="num">1,284</div><span class="sub">+12.4% this month</span></div><div class="admin-card"><div class="eyebrow">Workouts</div><div class="num">6,912</div><span class="sub">4,102 completed</span></div><div class="admin-card"><div class="eyebrow">Exercises</div><div class="num">248</div><span class="sub">32 categories</span></div><div class="admin-card"><div class="eyebrow">Active today</div><div class="num">186</div><span class="sub">72 anonymous</span></div></div><div class="admin-table"><div style="padding:18px;display:flex;justify-content:space-between;align-items:center"><h2 class="h2">Recent Users</h2><span class="pill">Live demo</span></div><table><thead><tr><th>User</th><th>Goal</th><th>Workouts</th><th>Status</th><th>Action</th></tr></thead><tbody>${[['Guest #4821','Gain Muscle','8','Anonymous'],['Ayesha K.','Lose Weight','14','Active'],['Hamza R.','Gain Strength','21','Active'],['Guest #4818','Look Bigger','4','Anonymous']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="pill">${r[3]}</span></td><td><button class="chip" onclick="toast('User management demo')">Manage</button></td></tr>`).join('')}</tbody></table></div><div class="admin-table"><div style="padding:18px"><h2 class="h2">Content Management</h2><p class="sub">Admin can later manage all of these collections from Firestore.</p></div><table><thead><tr><th>Collection</th><th>Items</th><th>Purpose</th><th>Action</th></tr></thead><tbody>${[['Exercises','248','Exercise library'],['Workout Templates','46','Curated routines'],['Goals','4','User targets'],['Equipment','8','Available gear'],['App Settings','12','Global controls']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td><button class="chip" onclick="openModal('${r[0]}')">Manage</button></td></tr>`).join('')}</tbody></table></div><p class="admin-mobile-note sub">Tip: open this page on desktop for the full admin layout.</p></main></div>`}

function modal(){return `<div id="modal" class="modal" onclick="if(event.target===this)closeModal()"><div class="modal-card"><div style="display:flex;justify-content:space-between;align-items:center"><h3 id="modalTitle">Add Exercise</h3><button class="icon-btn" onclick="closeModal()">×</button></div><input class="form-input" placeholder="Exercise name" value="Incline Chest Press Machine"><input class="form-input" placeholder="Muscle group" value="Chest"><input class="form-input" placeholder="Equipment" value="Machine"><input class="form-input" placeholder="Default sets" value="4"><button class="primary" onclick="closeModal();toast('Saved locally — Firebase integration later')">Save Changes</button></div></div>`}

const screens={target:targetScreen,equipment:equipmentScreen,generating:generatingScreen,dashboard:dashboardScreen,detail:detailScreen,exercise:exerciseScreen,complete:completeScreen,progress:progressScreen,history:historyScreen,profile:profileScreen,admin:adminScreen};
function render(){
 const view=screens[state.screen]||dashboardScreen;
 document.getElementById('app').innerHTML=view()+(state.screen==='admin'?modal():'');
}
function go(s){if(s!=='exercise')stopRest();state.screen=s;render();window.scrollTo(0,0)}
function goBack(){const map={equipment:'target',detail:'dashboard',exercise:'detail',complete:'dashboard',progress:'dashboard',history:'dashboard',profile:'dashboard'};go(map[state.screen]||'dashboard')}

function setGoal(g){state.goal=g;persist();render()}
function toggleEquip(e){state.equipment=state.equipment.includes(e)?state.equipment.filter(x=>x!==e):[...state.equipment,e];persist();render()}
function clearEquipment(){state.equipment=[];persist();render()}
function selectQuick(){state.equipment=['Bodyweight & No Equipment'];persist();render()}
function filterEquipment(v){document.querySelectorAll('#equipment-list .option').forEach(x=>x.style.display=x.dataset.name.includes(v.toLowerCase())?'flex':'none')}
function generate(){state.onboarded=true;persist();go('generating');setTimeout(()=>go('dashboard'),1400)}
function toggleAnon(){state.anon=!state.anon;persist();render()}
function openAdmin(){go('admin')}
function closeAdmin(){go('dashboard')}
function openModal(title='Add Exercise'){const m=document.getElementById('modal');if(m){m.classList.add('open');document.getElementById('modalTitle').textContent=title}}
function closeModal(){document.getElementById('modal')?.classList.remove('open')}
function toast(msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}

/* ---- workout session ------------------------------------------------- */

let restTimer=null;
function elapsedMinutes(){return state.session?Math.max(0,Math.round((Date.now()-state.session.startedAt)/60000)):0}
function stopRest(){if(restTimer){clearInterval(restTimer);restTimer=null}}

function startSession(){
 if(!state.session)state.session={exIndex:0,setIndex:0,setsDone:0,repsDone:0,phase:'ready',startedAt:Date.now(),restLeft:0,nextLabel:''};
 go('exercise');
}
function beginSet(){state.session.phase='work';render()}

function completeSet(){
 const s=state.session, ex=workout.exercises[s.exIndex], reps=ex.reps[s.setIndex];
 s.setsDone++;
 if(typeof reps==='number')s.repsDone+=reps;
 const lastSet=s.setIndex+1>=ex.reps.length;
 const lastExercise=s.exIndex+1>=workout.exercises.length;
 if(lastSet&&lastExercise){finishWorkout();return}
 s.nextLabel=lastSet?workout.exercises[s.exIndex+1].name:`Set ${s.setIndex+2} of ${ex.reps.length}`;
 startRest(ex.rest);
}

function startRest(seconds){
 const s=state.session;
 stopRest();
 s.phase='rest';
 s.restLeft=seconds;
 s.restTotal=seconds;
 render();
 restTimer=setInterval(()=>{
  s.restLeft--;
  if(s.restLeft<=0){stopRest();advance();return}
  // Tick the timer text in place rather than re-rendering the whole screen.
  const t=document.querySelector('.timer'); if(t)t.textContent=clock(s.restLeft);
  const bar=document.getElementById('rest-bar'); if(bar)bar.style.width=Math.round(s.restLeft/s.restTotal*100)+'%';
 },1000);
}
function skipRest(){stopRest();advance()}

function advance(){
 const s=state.session, ex=workout.exercises[s.exIndex];
 if(s.setIndex+1<ex.reps.length){s.setIndex++}
 else{s.exIndex++;s.setIndex=0}
 s.phase='ready';
 render();
}

function finishWorkout(){
 const s=state.session;
 stopRest();
 const minutes=Math.max(1,Math.round((Date.now()-s.startedAt)/60000));
 const stamp=new Date().toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 state.lastResult={minutes,sets:s.setsDone,reps:s.repsDone,calories:Math.round(minutes*8.2),stamp};
 state.completed++;
 state.streak++;
 state.minutes+=minutes;
 state.progress=Math.min(100,state.progress+6);
 state.history.unshift({name:workout.name,when:'Today',minutes});
 state.session=null;
 persist();
 go('complete');
}

async function resetProgress(){
 stopRest();
 await Store.reset();
 Object.assign(state,JSON.parse(JSON.stringify(defaults)),{session:null,lastResult:null});
 toast('Progress reset');
 go('dashboard');
}

/* ---- boot ------------------------------------------------------------- */

async function boot(){
 render();                       // paint defaults immediately, then reconcile
 try{
  await Store.init();
  const saved=await Store.load();
  if(saved)PERSISTED.forEach(k=>{if(saved[k]!==undefined)state[k]=saved[k]});
  state.screen=state.onboarded?'dashboard':'target';
  render();
 }catch(err){
  // Storage is optional — never let it take the whole app down.
  console.warn('[Zaman Fitness] Continuing without saved state:',err&&err.message);
 }
}
boot();
