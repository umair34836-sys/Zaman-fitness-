/* Zaman Fitness — admin panel.
 *
 * Only reachable by a user whose uid exists in the `admins` collection; the
 * Firestore rules enforce the same thing server-side, so hiding the button is
 * convenience, not security.
 */
const AdminPanel = (function () {
  let tab = 'overview';
  let draft = null;        // the item currently open in the editor
  let draftKind = '';      // 'exercise' | 'workout'
  let admins = [];
  let busy = false;

  function open() {
    S.screen = 'admin';
    tab = 'overview';
    repaint();          // render() only builds the markup; this paints it
    refreshAdmins();
  }

  async function refreshAdmins() {
    try { admins = await Backend.listAdmins(); } catch (e) { admins = []; }
    if (S.screen === 'admin' && tab === 'admins') repaint();
  }

  /* ---- shell ---- */

  function render() {
    const item = (id, icon, label) =>
      `<button class="${tab === id ? 'on' : ''}" onclick="admTab('${id}')">${icon}<span>${label}</span></button>`;
    const body = tab === 'exercises' ? exercisesView()
               : tab === 'workouts'  ? workoutsView()
               : tab === 'admins'    ? adminsView()
               : overviewView();

    return `<div class="admin">
      <aside class="admin-side">
        <div class="brand"><span class="brand-mark">Z</span>Zaman Fitness</div>
        <div class="admin-nav">
          ${item('overview', ICON.chart, 'Overview')}
          ${item('exercises', ICON.dumbbell, 'Exercises')}
          ${item('workouts', ICON.spark, 'Workouts')}
          ${item('admins', ICON.shield, 'Admins')}
        </div>
        <div class="admin-nav" style="margin-top:22px">
          <button onclick="admExit()">${ICON.back}<span>Back to app</span></button>
        </div>
      </aside>
      <main class="admin-main">${body}</main>
    </div>${draft ? editorModal() : ''}`;
  }

  /* ---- overview ---- */

  function overviewView() {
    const withVideo = S.exercises.filter(e => e.video).length;
    const live = S.workouts.filter(w => w.published !== false).length;
    const cloud = S.exercises.length && S.exercises !== DEFAULT_EXERCISES;
    return `<div class="admin-head">
        <div><div class="eyebrow">Admin</div><h1>Overview</h1>
        <p class="sub">Signed in as ${esc(Backend.user ? Backend.user.email : '')}</p></div>
      </div>
      ${!cloudReady() ? `<div class="card" style="border-color:#e2d3ac;background:var(--amber-soft);margin-bottom:18px">
        <h3 class="h3">The catalogue is not in the database yet</h3>
        <p class="sub" style="margin:6px 0 12px">The app is running on its built-in list. Import it into Firestore once and every exercise and workout becomes editable — including tutorial video links. Existing documents are never overwritten, so this is safe to run again.</p>
        <button class="btn btn-primary" style="width:auto" onclick="admSeed()" ${busy ? 'disabled' : ''}>${busy ? 'Importing…' : 'Import built-in catalogue'}</button>
      </div>` : ''}
      <div class="admin-cards">
        <div class="card"><div class="eyebrow">Exercises</div><b>${S.exercises.length}</b><span class="sub">in the library</span></div>
        <div class="card"><div class="eyebrow">With video</div><b>${withVideo}</b><span class="sub">of ${S.exercises.length} have a link</span></div>
        <div class="card"><div class="eyebrow">Workouts</div><b>${S.workouts.length}</b><span class="sub">${live} published</span></div>
        <div class="card"><div class="eyebrow">Admins</div><b>${admins.length || '—'}</b><span class="sub">with panel access</span></div>
      </div>
      <div class="table-wrap">
        <div class="head"><h2 class="h2">Exercises still missing a tutorial</h2><span class="tag">${S.exercises.length - withVideo} left</span></div>
        <table><thead><tr><th>Exercise</th><th>Pattern</th><th>Equipment</th><th></th></tr></thead><tbody>
        ${S.exercises.filter(e => !e.video).slice(0, 12).map(e => `<tr>
          <td><b>${esc(e.name)}</b></td><td>${esc(e.pattern)}</td>
          <td>${esc((e.needs && e.needs.length) ? e.needs.join(', ') : 'bodyweight')}</td>
          <td><div class="row-actions"><button class="btn btn-secondary" onclick="admEditExercise('${attr(e.id)}')">Add video</button></div></td>
        </tr>`).join('') || '<tr><td colspan="4" class="sub">Every exercise has a tutorial link. Nice.</td></tr>'}
        </tbody></table>
      </div>`;
  }

  function cloudReady() {
    // True once the catalogue is coming from Firestore rather than the bundle.
    return Backend.online && S.exercises.some(e => e.builtIn !== undefined || e.fromCloud);
  }

  /* ---- exercises ---- */

  function exercisesView() {
    return `<div class="admin-head">
        <div><div class="eyebrow">Library</div><h1>Exercises</h1>
        <p class="sub">Each exercise carries its own tutorial link, used everywhere it appears.</p></div>
        <button class="btn btn-primary" onclick="admNewExercise()">+ New exercise</button>
      </div>
      <div class="table-wrap">
        <div class="head"><h2 class="h2">${S.exercises.length} exercises</h2>
          <input class="input" style="max-width:240px" id="adm-ex-search" placeholder="Search…" oninput="admFilter('adm-ex-rows',this.value)"></div>
        <table><thead><tr><th>Name</th><th>Muscles</th><th>Pattern</th><th>Equipment</th><th>Tutorial</th><th></th></tr></thead>
        <tbody id="adm-ex-rows">
        ${S.exercises.map(e => `<tr data-search="${attr((e.name + ' ' + e.muscles + ' ' + e.pattern).toLowerCase())}">
          <td><b>${esc(e.name)}</b></td>
          <td class="sub">${esc(e.muscles)}</td>
          <td>${esc(e.pattern)}</td>
          <td>${esc((e.needs && e.needs.length) ? e.needs.join(', ') : 'bodyweight')}</td>
          <td>${e.video ? '<span class="tag video">linked</span>' : '<span class="tag novideo">none</span>'}</td>
          <td><div class="row-actions">
            <button class="btn btn-secondary" onclick="admEditExercise('${attr(e.id)}')">Edit</button>
            <button class="btn btn-danger" onclick="admDelete('exercises','${attr(e.id)}','${attr(e.name)}')">Delete</button>
          </div></td>
        </tr>`).join('')}
        </tbody></table>
      </div>`;
  }

  /* ---- workouts ---- */

  function workoutsView() {
    return `<div class="admin-head">
        <div><div class="eyebrow">Plans</div><h1>Workouts</h1>
        <p class="sub">Published workouts appear to every user. Unpublished ones are saved but hidden.</p></div>
        <button class="btn btn-primary" onclick="admNewWorkout()">+ New workout</button>
      </div>
      <div class="table-wrap">
        <div class="head"><h2 class="h2">${S.workouts.length} workouts</h2></div>
        <table><thead><tr><th>Name</th><th>Goal</th><th>Exercises</th><th>Sets</th><th>Length</th><th>Status</th><th></th></tr></thead><tbody>
        ${S.workouts.map(w => `<tr>
          <td><b>${esc(w.name)}</b>${w.builtIn ? ' <span class="tag">built-in</span>' : ''}</td>
          <td>${esc(goalName(w.goal))}</td>
          <td>${w.items.length}</td>
          <td>${countSets(w.items)}</td>
          <td>${estimateMinutes(w.items)} min</td>
          <td>${w.published !== false ? '<span class="tag live">published</span>' : '<span class="tag">hidden</span>'}</td>
          <td><div class="row-actions">
            <button class="btn btn-secondary" onclick="admEditWorkout('${attr(w.id)}')">Edit</button>
            <button class="btn btn-danger" onclick="admDelete('workouts','${attr(w.id)}','${attr(w.name)}')">Delete</button>
          </div></td>
        </tr>`).join('') || '<tr><td colspan="7" class="sub">No workouts yet.</td></tr>'}
        </tbody></table>
      </div>`;
  }

  /* ---- admins ---- */

  function adminsView() {
    return `<div class="admin-head">
        <div><div class="eyebrow">Access</div><h1>Admins</h1>
        <p class="sub">Anyone listed here can open this panel and edit the catalogue.</p></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <h3 class="h3">Add an admin</h3>
        <p class="sub" style="margin:6px 0 12px">Ask them to sign in, open Profile and copy the user ID shown there, then paste it below.</p>
        <label class="field"><span>User ID</span><input class="input" id="adm-uid" placeholder="e.g. 8fK2pQ…"></label>
        <label class="field"><span>Email (for your reference)</span><input class="input" id="adm-email" type="email" placeholder="them@example.com"></label>
        <button class="btn btn-primary" style="width:auto" onclick="admAddAdmin()">Grant admin access</button>
      </div>
      <div class="table-wrap">
        <div class="head"><h2 class="h2">${admins.length} admin${admins.length === 1 ? '' : 's'}</h2></div>
        <table><thead><tr><th>Email</th><th>User ID</th><th>Added</th><th></th></tr></thead><tbody>
        ${admins.map(a => `<tr>
          <td><b>${esc(a.email || '—')}</b>${a.id === Backend.uid ? ' <span class="tag live">you</span>' : ''}</td>
          <td class="sub" style="word-break:break-all">${esc(a.id)}</td>
          <td class="sub">${esc(a.addedAt ? new Date(a.addedAt).toLocaleDateString() : '—')}</td>
          <td><div class="row-actions">${a.id === Backend.uid ? '<span class="sub">—</span>'
            : `<button class="btn btn-danger" onclick="admRemoveAdmin('${attr(a.id)}','${attr(a.email || a.id)}')">Remove</button>`}</div></td>
        </tr>`).join('') || '<tr><td colspan="4" class="sub">No admin records readable. Check your Firestore rules.</td></tr>'}
        </tbody></table>
      </div>`;
  }

  /* ---- editor ---- */

  function editorModal() {
    return `<div class="modal" onclick="if(event.target===this)admCloseEditor()">
      <div class="modal-card">
        <div class="modal-head"><h3>${draftKind === 'exercise' ? 'Exercise' : 'Workout'}</h3>
          <button class="icon-btn" onclick="admCloseEditor()">✕</button></div>
        ${draftKind === 'exercise' ? exerciseForm() : workoutForm()}
        <div class="error" id="adm-error"></div>
        <div class="btn-row" style="margin-top:6px">
          <button class="btn btn-secondary" onclick="admCloseEditor()">Cancel</button>
          <button class="btn btn-primary" onclick="admSave()" ${busy ? 'disabled' : ''}>${busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div></div>`;
  }

  function exerciseForm() {
    const patterns = ['mobility', 'push', 'pull', 'legs', 'core'];
    return `
      <label class="field"><span>Name</span><input class="input" id="d-name" value="${attr(draft.name)}"></label>
      <label class="field"><span>Muscles worked</span><input class="input" id="d-muscles" value="${attr(draft.muscles)}" placeholder="Chest • Triceps"></label>
      <label class="field"><span>Movement pattern</span><select class="input" id="d-pattern">
        ${patterns.map(p => `<option value="${p}" ${draft.pattern === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select></label>
      <label class="field"><span>Measured in</span><select class="input" id="d-unit">
        <option value="reps" ${draft.unit === 'reps' ? 'selected' : ''}>Reps</option>
        <option value="time" ${draft.unit === 'time' ? 'selected' : ''}>Time (a hold)</option>
      </select></label>
      <label class="field"><span>Load guidance</span><input class="input" id="d-load" value="${attr(draft.load)}" placeholder="Bodyweight / Moderate / Light band"></label>
      <div class="field"><span>Equipment needed (none ticked = bodyweight)</span>
        <div class="stack" style="gap:6px">
          ${EQUIPMENT.filter(e => e.tag !== 'bodyweight').map(e => `<label class="option" style="padding:9px 12px">
            <input type="checkbox" class="d-need" value="${attr(e.tag)}" ${(draft.needs || []).includes(e.tag) ? 'checked' : ''}>
            <span class="option-copy"><span class="option-title">${esc(e.name)}</span></span></label>`).join('')}
        </div>
      </div>
      <label class="field"><span>Tutorial video link</span><input class="input" id="d-video" type="url" value="${attr(draft.video || '')}" placeholder="https://www.youtube.com/watch?v=…"></label>
      <p class="hint">Left blank, the app sends users to a YouTube search for this exercise instead of a dead link.</p>`;
  }

  function workoutForm() {
    const options = S.exercises.slice().sort((a, b) => a.name.localeCompare(b.name));
    return `
      <label class="field"><span>Name</span><input class="input" id="d-name" value="${attr(draft.name)}"></label>
      <label class="field"><span>Goal</span><select class="input" id="d-goal">
        ${GOALS.map(g => `<option value="${g.id}" ${draft.goal === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
      </select></label>
      <label class="field"><span>Description</span><textarea class="input" id="d-desc">${esc(draft.description || '')}</textarea></label>
      <label class="option" style="margin-bottom:12px">
        <input type="checkbox" id="d-published" ${draft.published !== false ? 'checked' : ''}>
        <span class="option-copy"><span class="option-title">Published</span>
        <span class="option-meta">Visible to every user in the app</span></span></label>

      <div class="field"><span>Exercises (${draft.items.length})</span></div>
      <div class="stack" style="gap:8px;margin-bottom:12px">
        ${draft.items.map((it, i) => {
          const ex = exerciseById(it.exerciseId);
          return `<div class="card" style="padding:11px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <b style="flex:1;font-size:13px">${i + 1}. ${esc(ex.name)}</b>
              <button class="chip" onclick="admMoveItem(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button class="chip" onclick="admMoveItem(${i},1)" ${i === draft.items.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="chip" onclick="admRemoveItem(${i})">✕</button>
            </div>
            <div class="btn-row">
              <label class="field" style="flex:2;margin:0"><span>Sets / reps</span>
                <input class="input" data-item="${i}" data-key="reps" value="${attr(it.reps.join(', '))}" placeholder="12, 10, 8"></label>
              <label class="field" style="flex:1;margin:0"><span>Rest (s)</span>
                <input class="input" type="number" min="0" data-item="${i}" data-key="rest" value="${attr(it.rest)}"></label>
            </div>
            <p class="hint">Use numbers for reps, or add s for a hold: 45s, 45s</p>
          </div>`;
        }).join('') || '<p class="sub">No exercises yet — add one below.</p>'}
      </div>
      <label class="field"><span>Add an exercise</span>
        <select class="input" id="d-add" onchange="admAddItem(this.value);this.value=''">
          <option value="">Choose…</option>
          ${options.map(e => `<option value="${attr(e.id)}">${esc(e.name)}</option>`).join('')}
        </select></label>`;
  }

  /* ---- reading the editor back ---- */

  function captureItems() {
    if (draftKind !== 'workout') return;
    document.querySelectorAll('[data-item]').forEach(input => {
      const i = Number(input.dataset.item), key = input.dataset.key;
      if (!draft.items[i]) return;
      if (key === 'rest') draft.items[i].rest = Math.max(0, parseInt(input.value, 10) || 0);
      if (key === 'reps') {
        draft.items[i].reps = input.value.split(',').map(p => p.trim()).filter(Boolean)
          .map(p => /^\d+$/.test(p) ? Number(p) : p);
      }
    });
  }

  function captureTop() {
    if (draftKind === 'exercise') {
      draft.name = val('d-name');
      draft.muscles = val('d-muscles');
      draft.pattern = (el('d-pattern') || {}).value || 'push';
      draft.unit = (el('d-unit') || {}).value || 'reps';
      draft.load = val('d-load') || 'Bodyweight';
      draft.video = val('d-video');
      draft.needs = [...document.querySelectorAll('.d-need')].filter(c => c.checked).map(c => c.value);
    } else {
      draft.name = val('d-name');
      draft.goal = (el('d-goal') || {}).value || 'muscle';
      draft.description = (el('d-desc') || {}).value.trim();
      draft.published = Boolean((el('d-published') || {}).checked);
      captureItems();
    }
  }

  function repaint() { const root = el('app'); if (root) root.innerHTML = render(); }

  return {
    open, render, repaint,
    get tab() { return tab; },
    setTab(t) { tab = t; repaint(); if (t === 'admins') refreshAdmins(); },
    get draft() { return draft; },
    startDraft(kind, data) { draftKind = kind; draft = data; repaint(); },
    closeDraft() { draft = null; draftKind = ''; repaint(); },
    get kind() { return draftKind; },
    captureTop, captureItems,
    setBusy(v) { busy = v; },
    get busy() { return busy; },
    refreshAdmins
  };
})();

/* ---- global handlers used by the markup ---- */

function admTab(t) { AdminPanel.setTab(t); }
function admExit() { location.hash = ''; go(Store.mode === 'none' ? 'landing' : 'dashboard'); }
function admError(msg) { const e = el('adm-error'); if (e) e.textContent = msg || ''; else if (msg) toast(msg); }
function admCloseEditor() { AdminPanel.closeDraft(); }

function admFilter(tbodyId, term) {
  const q = term.trim().toLowerCase();
  document.querySelectorAll('#' + tbodyId + ' tr').forEach(tr => {
    tr.style.display = !q || (tr.dataset.search || '').includes(q) ? '' : 'none';
  });
}

function admNewExercise() {
  AdminPanel.startDraft('exercise', { id: '', name: '', muscles: '', pattern: 'push', needs: [], unit: 'reps', load: 'Bodyweight', video: '' });
}
function admEditExercise(id) {
  const ex = S.exercises.find(e => e.id === id);
  if (!ex) return;
  AdminPanel.startDraft('exercise', JSON.parse(JSON.stringify(ex)));
}
function admNewWorkout() {
  AdminPanel.startDraft('workout', { id: '', name: '', goal: u().goal || 'muscle', description: '', published: true, items: [] });
}
function admEditWorkout(id) {
  const w = S.workouts.find(x => x.id === id);
  if (!w) return;
  AdminPanel.startDraft('workout', JSON.parse(JSON.stringify(w)));
}

function admAddItem(exerciseId) {
  if (!exerciseId) return;
  AdminPanel.captureTop();
  const ex = exerciseById(exerciseId);
  const reps = ex.unit === 'time' ? ['40s', '40s', '40s'] : [12, 10, 10];
  AdminPanel.draft.items.push({ exerciseId, reps, rest: 60 });
  AdminPanel.repaint();
}
function admRemoveItem(i) {
  AdminPanel.captureTop();
  AdminPanel.draft.items.splice(i, 1);
  AdminPanel.repaint();
}
function admMoveItem(i, dir) {
  AdminPanel.captureTop();
  const items = AdminPanel.draft.items, j = i + dir;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  AdminPanel.repaint();
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || ('item-' + Date.now());
}

async function admSave() {
  AdminPanel.captureTop();
  const d = AdminPanel.draft;
  const kind = AdminPanel.kind;
  if (!d.name) { admError('Give it a name.'); return; }
  if (kind === 'workout' && !d.items.length) { admError('Add at least one exercise.'); return; }
  if (kind === 'workout' && d.items.some(i => !i.reps.length)) { admError('Every exercise needs at least one set.'); return; }

  AdminPanel.setBusy(true); AdminPanel.repaint();
  try {
    const collection = kind === 'exercise' ? 'exercises' : 'workouts';
    const id = d.id || slugify(d.name);
    const payload = Object.assign({}, d);
    delete payload.id;
    await Backend.saveDocument(collection, id, payload);
    await loadCatalogue();
    AdminPanel.setBusy(false);
    AdminPanel.closeDraft();
    toast('Saved');
  } catch (err) {
    AdminPanel.setBusy(false);
    AdminPanel.repaint();
    admError(Backend.readable(err));
  }
}

async function admDelete(collection, id, name) {
  if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await Backend.removeDocument(collection, id);
    await loadCatalogue();
    AdminPanel.repaint();
    toast('Deleted');
  } catch (err) { toast(Backend.readable(err)); }
}

async function admSeed() {
  AdminPanel.setBusy(true); AdminPanel.repaint();
  try {
    const n = await Backend.seedCatalogue(DEFAULT_EXERCISES, DEFAULT_WORKOUTS);
    await loadCatalogue();
    toast(n ? `Imported ${n} items` : 'Already imported');
  } catch (err) { toast(Backend.readable(err)); }
  AdminPanel.setBusy(false);
  AdminPanel.repaint();
}

async function admAddAdmin() {
  const uid = val('adm-uid'), email = val('adm-email');
  if (!uid) { toast('Paste the user ID first'); return; }
  try {
    await Backend.addAdmin(uid, email);
    await AdminPanel.refreshAdmins();
    AdminPanel.repaint();
    toast('Admin added');
  } catch (err) { toast(Backend.readable(err)); }
}

async function admRemoveAdmin(uid, label) {
  if (!window.confirm(`Remove admin access for ${label}?`)) return;
  try {
    await Backend.removeAdmin(uid);
    await AdminPanel.refreshAdmins();
    AdminPanel.repaint();
    toast('Admin removed');
  } catch (err) { toast(Backend.readable(err)); }
}
