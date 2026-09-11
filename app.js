const icons={
 back:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>`,
 home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/></svg>`,
 chart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></svg>`,
 history:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>`,
 user:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
 spark:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>`,
 check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>`,
 play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z"/></svg>`,
 timer:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>`
};

// store.js should have defined this. If it failed to load, fall back to an
// in-memory stub so the app degrades to "forgetful but working" instead of blank.
if(typeof Store==='undefined'){
 window.Store={init:async()=>'none',load:async()=>null,save:async()=>false,reset:async()=>{},mode:'none',status:'Storage unavailable'};
}

const equipmentNames=EQUIPMENT.map(e=>e.name);
const WEEKLY_TARGET=5;
const STATE_VERSION=3;

// A new account starts genuinely empty - every number on screen is earned.
const defaults={goal:'Gain Muscle',equipment:['Bodyweight & No Equipment'],anon:true,onboarded:false,history:[],workout:null};
const state=Object.assign({screen:'target',session:null,lastResult:null},JSON.parse(JSON.stringify(defaults)));

const PERSISTED=['goal','equipment','anon','onboarded','history','workout'];
function persist(){const data={v:STATE_VERSION};PERSISTED.forEach(k=>data[k]=state[k]);return Store.save(data)}

/* ---- derived statistics ----------------------------------------------
   Nothing below is stored; it is all recomputed from `history`, so the
   dashboard can never drift out of sync with what the user actually did. */

function dayKey(d){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function startOfWeek(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}

function streak(){
 const days=new Set(state.history.map(h=>dayKey(h.at)));
 const d=new Date();
 if(!days.has(dayKey(d)))d.setDate(d.getDate()-1);  // today not trained yet - the run can still be alive
 let n=0;
 while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1)}
 return n;
}
function totalMinutes(){return state.history.reduce((n,h)=>n+(h.minutes||0),0)}
function totalSetsDone(){return state.history.reduce((n,h)=>n+(h.sets||0),0)}
function thisWeek(){const s=startOfWeek();return state.history.filter(h=>new Date(h.at)>=s)}
function thisMonthCount(){const now=new Date();return state.history.filter(h=>{const t=new Date(h.at);return t.getMonth()===now.getMonth()&&t.getFullYear()===now.getFullYear()}).length}
function weeklyPct(){return Math.min(100,Math.round(thisWeek().length/WEEKLY_TARGET*100))}
function weeklyMinutes(){
 const start=startOfWeek(),out=[0,0,0,0,0,0,0];
 state.history.forEach(h=>{const i=Math.floor((new Date(h.at)-start)/86400000);if(i>=0&&i<7)out[i]+=h.minutes||0});
 return out;
}
function whenLabel(iso){
 const k=dayKey(iso),y=new Date();y.setDate(y.getDate()-1);
 if(k===dayKey(new Date()))return 'Today';
 if(k===dayKey(y))return 'Yesterday';
 return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

function iconCircle(symbol){return `<div class="option-icon"><b style="font-size:19px">${symbol}</b></div>`}
function repLabel(v){return typeof v==='number'?v+' reps':v}
function clock(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function plan(){return state.workout}
function planSets(){return plan()?plan().exercises.reduce((n,e)=>n+e.reps.length,0):0}

function bottomNav(active='home'){return `<nav class="bottom-nav">
<button class="${active==='home'?'active':''}" onclick="go('dashboard')">${icons.home}<span>Home</span></button>
<button class="${active==='progress'?'active':''}" onclick="go('progress')">${icons.chart}<span>Progress</span></button>
<button class="${active==='history'?'active':''}" onclick="go('history')">${icons.history}<span>History</span></button>
<button class="${active==='profile'?'active':''}" onclick="go('profile')">${icons.user}<span>Profile</span></button></nav>`}
function shell(content,nav=''){return `<div class="phone-wrap"><div class="phone">${content}${nav}</div></div>`}
function topBar(title,back=true){return `<div class="topbar">${back?`<button class="icon-btn" onclick="goBack()">${icons.back}</button>`:'<span style="width:38px"></span>'}<div style="font:800 15px Manrope">${title}</div><span style="width:38px"></span></div>`}
function empty(icon,title,body,cta=''){return `<div class="generate" style="margin-top:16px"><div class="spark">${icon}</div><h3>${title}</h3><p>${body}</p>${cta}</div>`}

function targetScreen(){return shell(`<div class="safe-top"></div><div class="screen" style="padding-top:20px"><div class="progress-top"><span style="width:33%"></span></div><div style="margin-top:34px"><div class="eyebrow">Step 1 of 3</div><h1 class="h1">What is your target?</h1><p class="sub">Select your primary fitness goal</p></div><div class="stack" style="margin-top:23px">${GOALS.map(([t,m,s])=>`<button class="option ${state.goal===t?'selected':''}" onclick="setGoal('${t}')">${iconCircle(s)}<div class="option-copy"><div class="option-title">${t}</div><div class="option-meta">${m}</div></div><div class="check">${state.goal===t?icons.check:''}</div></button>`).join('')}</div></div><div class="bottom-cta"><button class="primary" onclick="go('equipment')">Next</button></div>`)}

function countFor(name){
 const tag=(EQUIPMENT.find(e=>e.name===name)||{}).tag;
 return EXERCISES.filter(x=>tag==='bodyweight'?x.needs.length===0:x.needs.includes(tag)).length;
}

function equipmentScreen(){
 const none=state.equipment.length===0;
 return shell(`${topBar('Equipment Available')}<div class="screen"><div class="progress-top"><span style="width:66%"></span></div><p class="sub" style="margin-top:14px">Select everything you can train with. We only build workouts from gear you actually have.</p><div class="search">⌕<input placeholder="Search equipment..." oninput="filterEquipment(this.value)"></div><div class="filter-row" style="margin:9px 0 12px"><button class="chip active" onclick="selectQuick()">ϟ Bodyweight only</button><button class="chip" onclick="clearEquipment()">Clear All</button></div><div class="pill" style="margin-bottom:9px">${state.equipment.length} selected</div><div id="equipment-list" class="stack">${equipmentNames.map(e=>`<button data-name="${e.toLowerCase()}" class="option ${state.equipment.includes(e)?'selected':''}" onclick="toggleEquip('${e}')">${iconCircle('◆')}<div class="option-copy"><div class="option-title">${e}</div><div class="option-meta">${countFor(e)} exercises unlocked</div></div><div class="check">${state.equipment.includes(e)?icons.check:''}</div></button>`).join('')}</div></div><div class="bottom-cta"><button class="primary" ${none?'disabled style="opacity:.5"':''} onclick="${none?'':'generate()'}">${none?'Select at least one':'Build my workout →'}</button></div>`)}

function dashboardScreen(){
 const w=plan(),s=streak(),hour=new Date().getHours();
 const greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 return shell(`${topBar('Zaman Fitness',false)}<div class="screen"><div class="hero"><small>${greet} 💪</small><h2>${state.history.length?'Welcome back':'Let\'s get started'}</h2><div class="row"><div class="mini">🔥 ${state.history.length} workout${state.history.length===1?'':'s'}</div><div class="mini">● ${weeklyPct()}% weekly goal</div></div></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Streak</span><strong>${s}</strong><span>day${s===1?'':'s'}</span></div><div class="stat"><span>Workouts</span><strong>${thisMonthCount()}</strong><span>this month</span></div><div class="stat"><span>Minutes</span><strong>${totalMinutes()}</strong><span>total</span></div></div>${w?`<div class="section-head"><h2 class="h2">Your Workout</h2><a onclick="generate()">Regenerate</a></div><div class="workout-card"><div class="workout-top"><div class="workout-art">${icons.spark}</div><div class="workout-info"><h3>${w.name}</h3><p>${w.focus}</p></div><span class="pill">${w.scheme}</span></div><div class="metrics"><div class="metric"><strong>${w.exercises.length}</strong><span>Exercises</span></div><div class="metric"><strong>${planSets()}</strong><span>Total Sets</span></div><div class="metric"><strong>${w.minutes}</strong><span>Minutes</span></div></div><button class="primary" style="margin-top:13px" onclick="go('detail')">${state.session?'Resume Workout':'Start Workout'}</button></div>`:empty(icons.spark,'No workout yet','Build a session around your goal and the equipment you own.','<button class="primary" onclick="generate()">Generate Workout</button>')}<div class="section-head"><h2 class="h2">Build Another</h2></div><div class="generate"><div class="spark">${icons.spark}</div><h3>${state.goal}</h3><p>Fresh session from your ${state.equipment.length} selected equipment option${state.equipment.length===1?'':'s'}.</p><button class="primary" onclick="generate()">${icons.spark} Generate Workout</button></div></div>${bottomNav('home')}`)}

function generatingScreen(){return shell(`${topBar('Building Workout')}<div class="screen" style="display:grid;place-items:center;min-height:65vh"><div class="generate" style="width:100%"><div class="spark">${icons.spark}</div><h3>Building your workout</h3><p>Matching your ${state.goal.toLowerCase()} goal to your equipment.</p><div class="loader"><span></span></div><div class="sub">Selecting exercises • sets • reps • rest</div></div></div>`)}

function detailScreen(){
 const w=plan();
 if(!w)return dashboardScreen();
 const s=state.session,done=s?s.setsDone:0,total=planSets();
 return shell(`${topBar('Workout Details')}<div class="screen"><div class="detail-hero"><span class="pill" style="background:rgba(255,255,255,.15);color:#fff">${w.scheme} · ${w.goal}</span><h1>${w.title}</h1><p>${w.blurb}</p><div class="detail-stats"><div class="detail-stat"><strong>${w.exercises.length}</strong><span>Exercises</span></div><div class="detail-stat"><strong>${total}</strong><span>Total Sets</span></div><div class="detail-stat"><strong>${w.minutes}</strong><span>Minutes</span></div></div></div><div class="section-head"><h2 class="h2">Progress</h2><span class="pill">${done} / ${total} sets done</span></div><div class="workout-card"><div class="progress-top" style="margin-bottom:6px"><span style="width:${total?Math.round(done/total*100):0}%"></span></div>${w.exercises.map((e,i)=>{
  const complete=s&&i<s.exIndex,current=s&&i===s.exIndex;
  return `<div class="exercise-row${complete?' done':''}"><div class="num-circle${complete?' filled':''}">${complete?icons.check:i+1}</div><div class="exercise-copy"><strong>${e.name}</strong><small>${e.reps.length} × ${repLabel(e.reps[0])} · ${e.warmup?'Warmup':e.rest+'s rest'}</small></div><span style="color:#9ca394">${current?'●':'›'}</span></div>`}).join('')}<button class="primary" style="margin-top:14px" onclick="startSession()">${icons.play} ${s?'Resume Workout':'Start Workout'}</button></div></div>`)}

function exerciseScreen(){
 if(!state.session)return detailScreen();
 const s=state.session,w=plan(),ex=w.exercises[s.exIndex],reps=ex.reps[s.setIndex];
 const header=topBar(`Exercise ${s.exIndex+1} of ${w.exercises.length}`);
 const dots=ex.reps.map((r,i)=>`<span class="set-dot${i<s.setIndex?' done':i===s.setIndex?' active':''}">${i+1}</span>`).join('');

 if(s.phase==='rest')
  return shell(`${header}<div class="screen"><div class="timer-card"><div class="spark">${icons.timer}</div><div class="eyebrow">Rest</div><div class="timer">${clock(s.restLeft)}</div><div class="progress-top"><span id="rest-bar" style="width:100%"></span></div><p class="sub" style="margin-top:12px">Up next — ${s.nextLabel}</p></div><button class="secondary" style="margin-top:14px" onclick="skipRest()">Skip rest →</button></div>`);

 if(s.phase==='work')
  return shell(`${header}<div class="screen"><div class="eyebrow">Set ${s.setIndex+1} of ${ex.reps.length} — in progress</div><h1 class="h1">${ex.name}</h1><p class="sub">${ex.muscles}</p><div class="set-dots">${dots}</div><div class="timer-card" style="margin-top:14px"><div class="eyebrow">Target</div><div class="timer">${repLabel(reps)}</div><p class="sub">${ex.weight} · then ${ex.rest}s rest</p></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Sets done</span><strong>${s.setsDone}</strong><span>of ${planSets()}</span></div><div class="stat"><span>Reps</span><strong>${s.repsDone}</strong><span>total</span></div><div class="stat"><span>Elapsed</span><strong>${elapsedMinutes()}</strong><span>min</span></div></div></div><div class="bottom-cta"><button class="primary" onclick="completeSet()">${icons.check} Complete Set ${s.setIndex+1}</button></div>`);

 return shell(`${header}<div class="screen"><div class="exercise-illustration"><svg viewBox="0 0 200 150" fill="none"><rect x="28" y="114" width="145" height="7" rx="3" fill="#9bb45d"/><path d="M60 113 82 68h37l22 45" stroke="#557817" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="48" r="15" fill="#c9d7a2"/><path d="M92 64 82 91m18-24 24 14m-34-7-20 22m40-12 15 29" stroke="#557817" stroke-width="7" stroke-linecap="round"/><path d="M42 77h115" stroke="#557817" stroke-width="6" stroke-linecap="round"/><path d="M38 67v20m124-20v20" stroke="#9aaf54" stroke-width="8" stroke-linecap="round"/></svg></div><div class="eyebrow">${ex.warmup?'Warm up':'Get ready'}</div><h1 class="h1">${ex.name}</h1><p class="sub">${ex.muscles}</p><div class="set-dots">${dots}</div><div class="option" style="margin-top:14px;background:#fff7e8;border-color:#f3d69c">${iconCircle('↗')}<div class="option-copy"><div class="option-title">Load</div><div class="option-meta">Stop 1–2 reps short of failure with clean form.</div></div><b style="color:#d28d1f">${ex.weight}</b></div><div class="stat-grid" style="margin-top:10px"><div class="stat"><span>Sets</span><strong>${ex.reps.length}</strong></div><div class="stat"><span>Target</span><strong>${repLabel(ex.reps[0])}</strong></div><div class="stat"><span>Rest</span><strong>${ex.rest}s</strong></div></div></div><div class="bottom-cta"><button class="primary" onclick="beginSet()">${icons.play} Start Set ${s.setIndex+1}</button></div>`)}

function completeScreen(){
 const r=state.lastResult||{minutes:0,sets:0,reps:0,calories:0,stamp:'—',name:''};
 const total=planSets()||r.sets;
 return shell(`${topBar('Workout Complete')}<div class="screen"><div class="complete"><div class="trophy">🏆</div><span class="pill" style="background:rgba(255,255,255,.16);color:#fff">✓ Workout complete</span><h1 style="font:800 22px Manrope;margin:10px 0 5px">Nice work — that's logged.</h1><p style="font-size:11px;opacity:.8;margin:0">${r.name} · ${r.stamp}</p></div><div class="completion-grid"><div class="completion-stat"><small>🔥 Calories</small><strong>${r.calories}</strong></div><div class="completion-stat"><small>⏱ Minutes</small><strong>${r.minutes}</strong></div><div class="completion-stat"><small>▣ Total Reps</small><strong>${r.reps}</strong></div><div class="completion-stat"><small>✓ Completed</small><strong style="color:#5c9d55">${total?Math.round(r.sets/total*100):0}%</strong></div></div><div class="section-head"><h2 class="h2">Streak</h2><span class="pill">🔥 ${streak()} days</span></div><div class="workout-card"><div class="progress-top"><span style="width:${total?Math.round(r.sets/total*100):0}%"></span></div><button class="primary" style="margin-top:13px" onclick="go('dashboard')">Back to Dashboard</button></div></div>`)}

function progressScreen(){
 const mins=weeklyMinutes(),max=Math.max(1,...mins),pct=weeklyPct();
 return shell(`${topBar('Your Progress',false)}<div class="screen"><div class="section-head"><div><div class="eyebrow">This week</div><h1 class="h1">${state.history.length?'Keep it going':'Log your first session'}</h1></div><span class="pill">🔥 ${streak()} days</span></div><div class="workout-card"><div class="progress-ring" style="background:conic-gradient(var(--green) 0 ${pct}%,#e5eadb ${pct}% 100%)"><div><strong>${pct}%</strong><span>weekly goal</span></div></div><div class="stat-grid"><div class="stat"><span>Workouts</span><strong>${thisWeek().length}</strong><span>/ ${WEEKLY_TARGET} goal</span></div><div class="stat"><span>Minutes</span><strong>${mins.reduce((a,b)=>a+b,0)}</strong><span>this week</span></div><div class="stat"><span>Sets</span><strong>${totalSetsDone()}</strong><span>all time</span></div></div></div><div class="section-head"><h2 class="h2">Weekly activity</h2></div><div class="workout-card"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:7px;align-items:end;height:130px">${mins.map((v,i)=>`<div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;text-align:center"><div style="height:${Math.round(v/max*100)}%;min-height:4px;background:${v?'var(--green)':'#dfe5d4'};border-radius:8px 8px 4px 4px"></div><small style="font-size:9px;color:#999">${['M','T','W','T','F','S','S'][i]}</small></div>`).join('')}</div><p class="sub" style="margin:10px 0 0;text-align:center">Minutes trained per day</p></div></div>${bottomNav('progress')}`)}

function historyScreen(){
 const h=state.history;
 return shell(`${topBar('Workout History',false)}<div class="screen">${h.length?`<div class="pill" style="margin-bottom:10px">${h.length} session${h.length===1?'':'s'} · ${totalMinutes()} minutes</div><div class="stack">${h.map(x=>`<div class="workout-card"><div class="workout-top"><div class="workout-art">${icons.check}</div><div class="workout-info"><h3>${x.name}</h3><p>${whenLabel(x.at)} · ${x.minutes} min · ${x.sets} sets</p></div><span class="pill">Done</span></div></div>`).join('')}</div>`:empty(icons.history,'No sessions yet','Finish a workout and it will show up here with your time and sets.','<button class="primary" onclick="go(\'dashboard\')">Go to dashboard</button>')}</div>${bottomNav('history')}`)}

function profileScreen(){return shell(`${topBar('Profile',false)}<div class="screen"><div class="workout-card" style="display:flex;gap:13px;align-items:center"><div class="option-icon" style="width:54px;height:54px;border-radius:17px">${icons.user}</div><div style="flex:1"><h2 class="h2">${state.anon?'Guest Athlete':'My Profile'}</h2><p class="sub" style="margin:3px 0">${state.history.length} workout${state.history.length===1?'':'s'} · ${totalMinutes()} minutes</p></div></div><div class="section-head"><h2 class="h2">Preferences</h2></div><div class="stack"><button class="option" onclick="go('target')">${iconCircle('◎')}<div class="option-copy"><div class="option-title">Fitness goal</div><div class="option-meta">${state.goal}</div></div>›</button><button class="option" onclick="go('equipment')">${iconCircle('◆')}<div class="option-copy"><div class="option-title">Equipment</div><div class="option-meta">${state.equipment.length} selected</div></div>›</button></div><div class="section-head"><h2 class="h2">Storage</h2></div><div class="option"><div class="option-icon" style="color:${Store.mode==='firebase'?'var(--green)':'#9aa08f'}">${icons.spark}</div><div class="option-copy"><div class="option-title">${Store.mode==='firebase'?'Synced to your account':'Saved on this device'}</div><div class="option-meta">${Store.status}</div></div></div><div class="section-head"><h2 class="h2">Account</h2></div><div class="stack"><button class="secondary" onclick="resetProgress()">Reset all data</button></div><p class="sub" style="margin-top:14px;text-align:center">Zaman Fitness</p></div>${bottomNav('profile')}`)}

function adminScreen(){const h=state.history;return `<div class="desktop-shell"><aside class="desktop-nav"><div class="brand"><div class="brand-mark">Z</div>Zaman Fitness</div><div class="nav-group"><div class="nav-label">Overview</div><button class="nav-btn active">${icons.chart} Dashboard</button></div><div class="nav-group"><div class="nav-label">System</div><button class="nav-btn" onclick="closeAdmin()">← Back to App</button></div></aside><main class="desktop-main"><div class="admin-title"><div><button class="chip admin-back" onclick="closeAdmin()">← Back to App</button><div class="eyebrow">Admin Console</div><h1>This account</h1><p class="sub">Real data for the signed-in user. Fleet-wide admin needs a backend query layer, which is not built yet.</p></div></div><div class="admin-grid"><div class="admin-card"><div class="eyebrow">Workouts</div><div class="num">${h.length}</div><span class="sub">all time</span></div><div class="admin-card"><div class="eyebrow">Minutes</div><div class="num">${totalMinutes()}</div><span class="sub">all time</span></div><div class="admin-card"><div class="eyebrow">Sets</div><div class="num">${totalSetsDone()}</div><span class="sub">all time</span></div><div class="admin-card"><div class="eyebrow">Streak</div><div class="num">${streak()}</div><span class="sub">days</span></div></div><div class="admin-table"><div style="padding:18px"><h2 class="h2">Exercise library</h2><p class="sub">${EXERCISES.length} exercises across ${EQUIPMENT.length} equipment types.</p></div><table><thead><tr><th>Exercise</th><th>Muscles</th><th>Pattern</th><th>Requires</th></tr></thead><tbody>${EXERCISES.map(e=>`<tr><td><b>${e.n}</b></td><td>${e.m}</td><td>${e.p}</td><td>${e.needs.length?e.needs.join(', '):'bodyweight'}</td></tr>`).join('')}</tbody></table></div><p class="admin-mobile-note sub">Tip: open this page on desktop for the full admin layout.</p></main></div>`}

const screens={target:targetScreen,equipment:equipmentScreen,generating:generatingScreen,dashboard:dashboardScreen,detail:detailScreen,exercise:exerciseScreen,complete:completeScreen,progress:progressScreen,history:historyScreen,profile:profileScreen,admin:adminScreen};
function render(){const view=screens[state.screen]||dashboardScreen;document.getElementById('app').innerHTML=view()}
function go(s){if(s!=='exercise')stopRest();state.screen=s;render();window.scrollTo(0,0)}
function goBack(){const map={equipment:'target',target:state.onboarded?'profile':'target',detail:'dashboard',exercise:'detail',complete:'dashboard',progress:'dashboard',history:'dashboard',profile:'dashboard'};go(map[state.screen]||'dashboard')}

function setGoal(g){state.goal=g;persist();render()}
function toggleEquip(e){state.equipment=state.equipment.includes(e)?state.equipment.filter(x=>x!==e):[...state.equipment,e];persist();render()}
function clearEquipment(){state.equipment=[];persist();render()}
function selectQuick(){state.equipment=['Bodyweight & No Equipment'];persist();render()}
function filterEquipment(v){document.querySelectorAll('#equipment-list .option').forEach(x=>x.style.display=x.dataset.name.includes(v.toLowerCase())?'flex':'none')}

function generate(){
 if(!state.equipment.length){toast('Select at least one equipment option');return}
 state.onboarded=true;
 state.session=null;
 go('generating');
 setTimeout(()=>{state.workout=generateWorkout(state.goal,state.equipment);persist();go('dashboard')},900);
}
function closeAdmin(){location.hash='';go('dashboard')}
function toast(msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}

/* ---- workout session ------------------------------------------------- */

let restTimer=null;
function elapsedMinutes(){return state.session?Math.max(0,Math.round((Date.now()-state.session.startedAt)/60000)):0}
function stopRest(){if(restTimer){clearInterval(restTimer);restTimer=null}}

function startSession(){
 if(!plan())return;
 if(!state.session)state.session={exIndex:0,setIndex:0,setsDone:0,repsDone:0,phase:'ready',startedAt:Date.now(),restLeft:0,restTotal:0,nextLabel:''};
 go('exercise');
}
function beginSet(){state.session.phase='work';render()}

function completeSet(){
 const s=state.session,w=plan(),ex=w.exercises[s.exIndex],reps=ex.reps[s.setIndex];
 s.setsDone++;
 if(typeof reps==='number')s.repsDone+=reps;
 const lastSet=s.setIndex+1>=ex.reps.length,lastExercise=s.exIndex+1>=w.exercises.length;
 if(lastSet&&lastExercise){finishWorkout();return}
 s.nextLabel=lastSet?w.exercises[s.exIndex+1].name:`Set ${s.setIndex+2} of ${ex.reps.length}`;
 startRest(ex.rest);
}

function startRest(seconds){
 const s=state.session;
 stopRest();
 s.phase='rest';s.restLeft=seconds;s.restTotal=seconds;
 render();
 restTimer=setInterval(()=>{
  s.restLeft--;
  if(s.restLeft<=0){stopRest();advance();return}
  const t=document.querySelector('.timer');if(t)t.textContent=clock(s.restLeft);
  const bar=document.getElementById('rest-bar');if(bar)bar.style.width=Math.round(s.restLeft/s.restTotal*100)+'%';
 },1000);
}
function skipRest(){stopRest();advance()}

function advance(){
 const s=state.session,w=plan();
 if(s.setIndex+1<w.exercises[s.exIndex].reps.length)s.setIndex++;
 else{s.exIndex++;s.setIndex=0}
 s.phase='ready';
 render();
}

function finishWorkout(){
 const s=state.session,w=plan();
 stopRest();
 const minutes=Math.max(1,Math.round((Date.now()-s.startedAt)/60000));
 state.lastResult={name:w.name,minutes,sets:s.setsDone,reps:s.repsDone,calories:Math.round(minutes*7.5),
  stamp:new Date().toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})};
 state.history.unshift({name:w.name,at:new Date().toISOString(),minutes,sets:s.setsDone,reps:s.repsDone,goal:w.goal});
 state.session=null;
 persist();
 go('complete');
}

async function resetProgress(){
 stopRest();
 await Store.reset();
 Object.assign(state,JSON.parse(JSON.stringify(defaults)),{session:null,lastResult:null});
 toast('All data cleared');
 go('target');
}

/* ---- boot ------------------------------------------------------------- */

async function boot(){
 render();
 try{
  await Store.init();
  const saved=await Store.load();
  if(saved&&saved.v===STATE_VERSION)PERSISTED.forEach(k=>{if(saved[k]!==undefined)state[k]=saved[k]});
  state.screen=location.hash==='#admin'?'admin':(state.onboarded?'dashboard':'target');
  render();
 }catch(err){
  console.warn('[Zaman Fitness] Continuing without saved state:',err&&err.message);
 }
}
boot();
