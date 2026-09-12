/* Zaman Fitness — 3D exercise demonstrator.
 *
 * Builds an articulated mannequin and animates it through the movement, so a
 * user can see how an exercise is performed and drag to look at it from any
 * angle. three.js is vendored locally (vendor/three.module.min.js) rather than
 * pulled from a CDN, so this keeps working offline.
 *
 * Everything degrades: no WebGL, a failed import, or reduced-motion all leave
 * the static illustration in place instead of an empty box.
 */
const Viewer3D = (function () {
  let THREE = null;
  let loading = null;
  let live = null;          // the mounted instance, if any

  const COLOR = { skin: 0xd9e3c2, limb: 0x8fae4e, dark: 0x557817, ground: 0xe3e9d6 };

  function webglOK() {
    try {
      const c = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext &&
        (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  async function lib() {
    if (THREE) return THREE;
    if (!loading) loading = import('./vendor/three.module.min.js').then(m => (THREE = m));
    return loading;
  }

  /* ---- which animation an exercise gets ---- */

  const BY_ID = {
    squat: 'squat', 'goblet-squat': 'squat', 'split-squat': 'lunge', 'reverse-lunge': 'lunge',
    pushup: 'pushup', 'incline-pushup': 'pushup', 'diamond-pushup': 'pushup',
    'pike-pushup': 'pike', 'bench-dip': 'dip',
    'db-ohp': 'press', 'kb-press': 'press', 'db-bench': 'benchpress',
    'db-floor-press': 'benchpress', 'band-chest': 'benchpress',
    'db-row': 'row', 'band-row': 'row', 'inverted-row': 'row',
    'band-face-pull': 'facepull', 'db-reverse-fly': 'facepull', 'band-pullapart': 'facepull',
    'ytw-raise': 'superman', 'snow-angel': 'superman', superman: 'superman',
    'doorway-row': 'row', pullup: 'pullup', 'db-curl': 'curl',
    rdl: 'hinge', 'kb-swing': 'swing', 'glute-bridge': 'bridge', 'calf-raise': 'calf',
    plank: 'plank', 'hollow-hold': 'hollow', 'mountain-climb': 'climber',
    'dead-bug': 'deadbug', 'russian-twist': 'twist',
    'cat-cow': 'catcow', 'arm-leg-swings': 'swings', 'foam-thoracic': 'catcow',
    'strap-hamstring': 'hamstring', 'ball-foot': 'calf', 'band-lateral': 'lateral'
  };
  const BY_PATTERN = { push: 'pushup', pull: 'row', legs: 'squat', core: 'plank', mobility: 'swings' };

  function animationFor(ex) {
    if (!ex) return 'squat';
    if (ex.anim && POSES[ex.anim]) return ex.anim;          // admin override
    return BY_ID[ex.id] || BY_PATTERN[ex.pattern] || 'squat';
  }

  /* ---- the mannequin ---- */

  function build(T) {
    const root = new T.Group();
    const mat = c => new T.MeshStandardMaterial({ color: c, roughness: .72, metalness: .02 });
    const skin = mat(COLOR.skin), limb = mat(COLOR.limb), dark = mat(COLOR.dark);

    const limbMesh = (len, r, material) => {
      const m = new T.Mesh(new T.CapsuleGeometry(r, len - r * 2, 6, 14), material);
      m.position.y = -len / 2;
      m.castShadow = true;
      return m;
    };
    const joint = (parent, x, y, z) => {
      const g = new T.Group();
      g.position.set(x || 0, y || 0, z || 0);
      parent.add(g);
      return g;
    };

    // hips are the root of the skeleton
    const hips = joint(root, 0, 0.92, 0);
    const pelvis = new T.Mesh(new T.CapsuleGeometry(0.13, 0.06, 5, 14), dark);
    pelvis.castShadow = true; hips.add(pelvis);

    const spine = joint(hips, 0, 0.04, 0);
    const torso = new T.Mesh(new T.CapsuleGeometry(0.145, 0.28, 6, 16), limb);
    torso.position.y = 0.24; torso.castShadow = true; spine.add(torso);

    const neck = joint(spine, 0, 0.46, 0);
    const head = new T.Mesh(new T.SphereGeometry(0.115, 18, 14), skin);
    head.position.y = 0.1; head.castShadow = true; neck.add(head);

    const arm = side => {
      const shoulder = joint(spine, 0.20 * side, 0.40, 0);
      shoulder.add(limbMesh(0.30, 0.052, skin));
      const elbow = joint(shoulder, 0, -0.30, 0);
      elbow.add(limbMesh(0.27, 0.045, skin));
      const hand = joint(elbow, 0, -0.27, 0);
      const h = new T.Mesh(new T.SphereGeometry(0.052, 12, 10), skin);
      h.castShadow = true; hand.add(h);
      return { shoulder, elbow, hand };
    };
    const leg = side => {
      const hip = joint(hips, 0.105 * side, -0.05, 0);
      hip.add(limbMesh(0.43, 0.072, limb));
      const knee = joint(hip, 0, -0.43, 0);
      knee.add(limbMesh(0.41, 0.056, skin));
      const ankle = joint(knee, 0, -0.41, 0);
      const foot = new T.Mesh(new T.BoxGeometry(0.1, 0.055, 0.22), dark);
      foot.position.set(0, -0.03, 0.05); foot.castShadow = true; ankle.add(foot);
      return { hip, knee, ankle };
    };

    const rig = {
      root, hips, spine, neck,
      armL: arm(1), armR: arm(-1),
      legL: leg(1), legR: leg(-1)
    };
    rig.baseY = hips.position.y;
    return rig;
  }

  /* ---- poses ----
     Each entry receives the rig and a phase 0..1 and sets joint rotations.
     `e` is a smooth 0→1→0 ease so one call is one clean repetition. */

  function apply(j, x, y, z) { j.rotation.set(x || 0, y || 0, z || 0); }

  function reset(r) {
    apply(r.hips, 0, 0, 0); apply(r.spine, 0, 0, 0); apply(r.neck, 0, 0, 0);
    [r.armL, r.armR].forEach(a => { apply(a.shoulder, 0, 0, 0); apply(a.elbow, 0, 0, 0); });
    [r.legL, r.legR].forEach(l => { apply(l.hip, 0, 0, 0); apply(l.knee, 0, 0, 0); apply(l.ankle, 0, 0, 0); });
    r.hips.position.set(0, r.baseY, 0);
    r.root.rotation.set(0, 0, 0);
    r.root.position.set(0, 0, 0);
  }

  // Lay the figure on the floor along the X axis so the camera sees it side on.
  // The rig points +Y up and +Z forward; this maps +Y to +X and the face to
  // either -Y (face down) or +Y (face up). Once lying, the body's own "forward"
  // is world up/down, which is why these poses move joints in Z.
  function lie(r, faceDown, height) {
    r.root.rotation.set(faceDown ? Math.PI / 2 : -Math.PI / 2, 0, -Math.PI / 2);
    r.root.position.set(-0.74, height == null ? 0.30 : height, 0);
  }
  const DOWN = -Math.PI / 2;      // limb points at the floor when lying
  const OVER = -Math.PI;          // limb points past the head

  // Floor work reads best almost side on; standing work suits a 3/4 view.
  const LYING = new Set(['pushup', 'plank', 'climber', 'superman', 'benchpress',
                         'bridge', 'hollow', 'deadbug', 'hamstring', 'catcow']);

  const POSES = {
    squat(r, e) {
      r.hips.position.y = r.baseY - 0.42 * e;
      apply(r.spine, 0.38 * e, 0, 0);
      [r.legL, r.legR].forEach(l => { apply(l.hip, -1.05 * e, 0, 0); apply(l.knee, 1.85 * e, 0, 0); apply(l.ankle, -0.55 * e, 0, 0); });
      [r.armL, r.armR].forEach(a => { apply(a.shoulder, -1.45 * e, 0, 0); apply(a.elbow, -0.25 * e, 0, 0); });
    },
    lunge(r, e) {
      r.hips.position.y = r.baseY - 0.34 * e;
      apply(r.spine, 0.12 * e, 0, 0);
      apply(r.legL.hip, -0.75 * e, 0, 0); apply(r.legL.knee, 1.5 * e, 0, 0);
      apply(r.legR.hip, 0.55 * e, 0, 0); apply(r.legR.knee, 1.7 * e, 0, 0);
      apply(r.armL.shoulder, 0.4 * e, 0, 0); apply(r.armR.shoulder, -0.4 * e, 0, 0);
    },
    pushup(r, e) {
      lie(r, true, 0.40 - 0.15 * e);
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, DOWN, 0, (i ? -1 : 1) * (0.18 + 0.42 * e));
        apply(a.elbow, 1.45 * e, 0, 0);
      });
      apply(r.neck, -0.25, 0, 0);
      [r.legL, r.legR].forEach(l => apply(l.ankle, -0.6, 0, 0));
    },
    plank(r, e) {
      lie(r, true, 0.36);
      apply(r.spine, 0.02 * Math.sin(e * Math.PI * 2), 0, 0);
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, DOWN, 0, (i ? -1 : 1) * 0.16);
        apply(a.elbow, 1.5, 0, 0);
      });
      [r.legL, r.legR].forEach(l => apply(l.ankle, -0.6, 0, 0));
      apply(r.neck, -0.25, 0, 0);
    },
    climber(r, e) {
      lie(r, true, 0.44);
      [r.armL, r.armR].forEach((a, i) => { apply(a.shoulder, DOWN, 0, (i ? -1 : 1) * 0.18); });
      const s = Math.sin(e * Math.PI * 2);
      apply(r.legL.hip, -1.15 * Math.max(0, s), 0, 0); apply(r.legL.knee, 1.5 * Math.max(0, s), 0, 0);
      apply(r.legR.hip, -1.15 * Math.max(0, -s), 0, 0); apply(r.legR.knee, 1.5 * Math.max(0, -s), 0, 0);
      apply(r.neck, -0.25, 0, 0);
    },
    superman(r, e) {
      lie(r, true, 0.26);
      apply(r.spine, -0.28 * e, 0, 0);
      apply(r.neck, -0.22 * e, 0, 0);
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, OVER + 0.25 - 0.3 * e, 0, (i ? -1 : 1) * 0.24));
      [r.legL, r.legR].forEach(l => apply(l.hip, 0.4 * e, 0, 0));
    },
    benchpress(r, e) {
      lie(r, false, 0.34);
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, DOWN - 0.05 * e, 0, (i ? -1 : 1) * (0.22 + 0.4 * (1 - e)));
        apply(a.elbow, 1.3 * (1 - e), 0, 0);
      });
      [r.legL, r.legR].forEach(l => { apply(l.hip, -1.2, 0, 0); apply(l.knee, 1.6, 0, 0); });
    },
    bridge(r, e) {
      lie(r, false, 0.30);
      r.hips.position.z = 0.20 * e;
      apply(r.spine, 0.5 * e, 0, 0);
      [r.legL, r.legR].forEach(l => { apply(l.hip, -1.25 - 0.2 * e, 0, 0); apply(l.knee, 1.7, 0, 0); });
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, 0, 0, (i ? -1 : 1) * 0.3));
    },
    hollow(r, e) {
      lie(r, false, 0.30);
      apply(r.spine, 0.22 + 0.12 * e, 0, 0);
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, OVER + 0.2, 0, (i ? -1 : 1) * 0.18));
      [r.legL, r.legR].forEach(l => apply(l.hip, -0.45 - 0.15 * e, 0, 0));
    },
    deadbug(r, e) {
      lie(r, false, 0.30);
      const s = Math.sin(e * Math.PI * 2);
      apply(r.armL.shoulder, DOWN - 0.5 * s, 0, 0.12);
      apply(r.armR.shoulder, DOWN + 0.5 * s, 0, -0.12);
      apply(r.legL.hip, -1.15 + 0.6 * s, 0, 0); apply(r.legL.knee, 1.2, 0, 0);
      apply(r.legR.hip, -1.15 - 0.6 * s, 0, 0); apply(r.legR.knee, 1.2, 0, 0);
    },
    hamstring(r, e) {
      lie(r, false, 0.28);
      apply(r.legL.hip, -1.25 - 0.3 * e, 0, 0);
      apply(r.legR.hip, 0, 0, 0);
      [r.armL, r.armR].forEach((a, i) => { apply(a.shoulder, DOWN - 0.45 - 0.25 * e, 0, (i ? -1 : 1) * 0.14); apply(a.elbow, 0.45, 0, 0); });
    },
    catcow(r, e) {
      lie(r, true, 0.56);                 // hands and knees
      const s = Math.sin(e * Math.PI * 2);
      apply(r.spine, 0.28 * s, 0, 0);
      apply(r.neck, 0.35 * s, 0, 0);
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, DOWN, 0, (i ? -1 : 1) * 0.14));
      [r.legL, r.legR].forEach(l => { apply(l.hip, DOWN, 0, 0); apply(l.knee, 1.35, 0, 0); });
    },
    pike(r, e) {
      r.root.rotation.set(0, 0, 0);
      r.hips.position.y = r.baseY - 0.18;
      apply(r.spine, 1.15, 0, 0);
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, -0.95, 0, (i ? -1 : 1) * 0.22);
        apply(a.elbow, 1.45 * e, 0, 0);
      });
      [r.legL, r.legR].forEach(l => { apply(l.hip, -0.5, 0, 0); apply(l.knee, 0.25, 0, 0); });
    },
    dip(r, e) {
      r.hips.position.y = r.baseY - 0.26 - 0.22 * e;
      apply(r.spine, 0.12, 0, 0);
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, 0.5 + 0.5 * e, 0, (i ? -1 : 1) * 0.12);
        apply(a.elbow, 1.45 * e, 0, 0);
      });
      [r.legL, r.legR].forEach(l => { apply(l.hip, -1.3, 0, 0); apply(l.knee, 0.5, 0, 0); });
    },
    press(r, e) {
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, 0, 0, (i ? -1 : 1) * (2.95 - 0.75 * (1 - e)));
        apply(a.elbow, -(1.5 * (1 - e)), 0, 0);
      });
      apply(r.spine, -0.05 * e, 0, 0);
    },
    row(r, e) {
      apply(r.spine, 0.85, 0, 0);
      [r.legL, r.legR].forEach(l => { apply(l.hip, -0.55, 0, 0); apply(l.knee, 0.35, 0, 0); });
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, -0.2 * e, 0, (i ? -1 : 1) * 0.12);
        apply(a.elbow, 1.75 * e, 0, 0);
      });
    },
    facepull(r, e) {
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, -1.55, 0.35 * e * (i ? -1 : 1), (i ? -1 : 1) * (0.1 + 0.35 * e));
        apply(a.elbow, 0.3 + 1.15 * e, 0, 0);
      });
      apply(r.spine, -0.06 * e, 0, 0);
    },
    pullup(r, e) {
      r.hips.position.y = r.baseY - 0.15 + 0.42 * e;
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, 0, 0, (i ? -1 : 1) * (3.0 - 0.35 * e));
        apply(a.elbow, -(1.75 * e), 0, 0);
      });
      [r.legL, r.legR].forEach(l => apply(l.knee, 0.85, 0, 0));
    },
    curl(r, e) {
      [r.armL, r.armR].forEach((a, i) => {
        apply(a.shoulder, 0.1 * e, 0, (i ? -1 : 1) * 0.1);
        apply(a.elbow, 2.5 * e, 0, 0);
      });
    },
    hinge(r, e) {
      apply(r.spine, 1.15 * e, 0, 0);
      r.hips.position.y = r.baseY - 0.06 * e;
      [r.legL, r.legR].forEach(l => { apply(l.hip, -1.05 * e, 0, 0); apply(l.knee, 0.3 * e, 0, 0); });
      [r.armL, r.armR].forEach(a => apply(a.shoulder, -0.15 * e, 0, 0));
    },
    swing(r, e) {
      const k = Math.sin(e * Math.PI);
      apply(r.spine, 0.95 * (1 - e), 0, 0);
      r.hips.position.y = r.baseY - 0.12 * (1 - e);
      [r.legL, r.legR].forEach(l => { apply(l.hip, -0.85 * (1 - e), 0, 0); apply(l.knee, 0.45 * (1 - e), 0, 0); });
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, -0.5 - 1.05 * e - 0.3 * k, 0, (i ? -1 : 1) * 0.08));
    },
    calf(r, e) {
      r.hips.position.y = r.baseY + 0.11 * e;
      [r.legL, r.legR].forEach(l => apply(l.ankle, 0.65 * e, 0, 0));
      [r.armL, r.armR].forEach((a, i) => apply(a.shoulder, 0, 0, (i ? -1 : 1) * 0.1));
    },
    twist(r, e) {
      r.root.rotation.set(0.7, 0, 0);
      r.root.position.set(0, -0.18, 0);
      const s = Math.sin(e * Math.PI * 2);
      apply(r.spine, 0, 0.6 * s, 0);
      [r.armL, r.armR].forEach((a, i) => { apply(a.shoulder, -1.35, 0, (i ? -1 : 1) * 0.45); apply(a.elbow, 0.7, 0, 0); });
      [r.legL, r.legR].forEach(l => { apply(l.hip, -0.55, 0, 0); apply(l.knee, 1.2, 0, 0); });
    },
    swings(r, e) {
      const s = Math.sin(e * Math.PI * 2);
      apply(r.armL.shoulder, 0, 0, 1.5 + 1.4 * s);
      apply(r.armR.shoulder, 0, 0, -(1.5 + 1.4 * s));
      apply(r.legL.hip, 0.35 * s, 0, 0);
      apply(r.legR.hip, -0.35 * s, 0, 0);
      apply(r.spine, 0, 0.12 * s, 0);
    },
    lateral(r, e) {
      const s = Math.sin(e * Math.PI * 2);
      r.hips.position.y = r.baseY - 0.2;
      apply(r.legL.hip, -0.45, 0, 0.32 * Math.max(0, s));
      apply(r.legR.hip, -0.45, 0, -0.32 * Math.max(0, -s));
      apply(r.legL.knee, 0.85, 0, 0); apply(r.legR.knee, 0.85, 0, 0);
      apply(r.spine, 0.2, 0, 0);
      [r.armL, r.armR].forEach((a, i) => { apply(a.shoulder, -1.1, 0, (i ? -1 : 1) * 0.2); apply(a.elbow, 0.9, 0, 0); });
    }
  };

  /* ---- mount / teardown ---- */

  function detach() {
    if (!live) return;
    cancelAnimationFrame(live.frame);
    window.removeEventListener('resize', live.onResize);
    try {
      live.renderer.dispose();
      live.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      if (live.renderer.domElement.parentNode) live.renderer.domElement.parentNode.removeChild(live.renderer.domElement);
    } catch (e) { /* already gone */ }
    live = null;
  }

  async function mount(host, exercise) { return mountOne(host, exercise, true); }

  async function mountOne(host, exercise, track) {
    if (track) detach();
    if (!host || !webglOK()) return false;
    let T;
    try { T = await lib(); }
    catch (err) { console.warn('[Zaman Fitness] 3D unavailable:', err && err.message); return false; }
    if (!document.body.contains(host)) return false;   // navigated away while loading

    const name = animationFor(exercise);
    const pose = POSES[name] || POSES.squat;

    const scene = new T.Scene();
    const w = host.clientWidth || 320, h = host.clientHeight || 200;
    const camera = new T.PerspectiveCamera(36, w / h, 0.1, 50);
    // Framed to hold both a standing figure and a lying one without re-aiming.
    camera.position.set(0, 0.95, 2.85);
    camera.lookAt(0, 0.72, 0);

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y';
    host.textContent = '';
    host.appendChild(renderer.domElement);

    scene.add(new T.HemisphereLight(0xffffff, 0x93a877, 2.1));
    const key = new T.DirectionalLight(0xffffff, 1.5);
    key.position.set(2.5, 4, 3);
    scene.add(key);

    const floor = new T.Mesh(new T.CircleGeometry(1.35, 40), new T.MeshBasicMaterial({ color: COLOR.ground }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const pivot = new T.Group();
    scene.add(pivot);
    const rig = build(T);
    pivot.add(rig.root);
    const baseYaw = LYING.has(name) ? 0.12 : 0.5;
    pivot.rotation.y = baseYaw;

    // drag to look around
    let dragging = false, dragged = false, lastX = 0;
    const down = ev => { dragging = true; lastX = (ev.touches ? ev.touches[0] : ev).clientX; };
    const move = ev => {
      if (!dragging) return;
      const x = (ev.touches ? ev.touches[0] : ev).clientX;
      pivot.rotation.y += (x - lastX) * 0.012;
      dragged = true;
      lastX = x;
    };
    const up = () => { dragging = false; };
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);

    const onResize = () => {
      const nw = host.clientWidth || w, nh = host.clientHeight || h;
      camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };
    window.addEventListener('resize', onResize);

    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const period = 2600;   // one repetition
    const start = performance.now();
    let playing = !still;
    let frozen = 0.5;

    function tick(now) {
      inst.frame = requestAnimationFrame(tick);
      const t = playing ? ((now - start) % period) / period : frozen;
      const e = (1 - Math.cos(t * Math.PI * 2)) / 2;      // smooth out-and-back
      reset(rig);
      pose(rig, e, t);
      // A slow sway gives depth without ever rotating the figure out of view.
      // Once the user drags, their angle is kept.
      if (!dragged && playing) pivot.rotation.y = baseYaw + 0.22 * Math.sin((now - start) / 2300);
      renderer.render(scene, camera);
    }

    const inst = {
      renderer, scene, onResize, frame: 0, host,
      setPlaying(v) { playing = v; },
      isPlaying() { return playing; },
      cleanupExtra() {
        cv.removeEventListener('pointerdown', down);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
    };
    if (track) live = inst;
    inst.frame = requestAnimationFrame(tick);
    return true;
  }

  function toggle() {
    if (!live) return false;
    live.setPlaying(!live.isPlaying());
    return live.isPlaying();
  }

  // Used by the pose-review page: mount a named animation without tearing down
  // the previous one, so many can be shown side by side.
  async function mountInto(host, animName) {
    return mountOne(host, { id: '_', anim: animName, pattern: 'legs' }, false);
  }

  return { mount, detach, toggle, animationFor, mountInto,
           names: () => Object.keys(POSES), supported: webglOK };
})();
