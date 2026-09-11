# Zaman Fitness — Frontend Prototype

Static, GitHub Pages-friendly fitness planner inspired by the supplied reference video.

## Included
- Goal onboarding
- Equipment selection/search
- Demo workout generation flow
- Personalized dashboard
- Workout details with live set progress
- Full exercise flow — every set of every exercise, with a rest timer between sets
- Workout completion screen with real session totals
- Progress, history and profile
- Anonymous mode (Firebase anonymous auth, or local-only when offline)
- Responsive admin console for users, exercises, workouts, goals and equipment
- Inline SVG icons and illustration assets — no paid/stock assets required
- Reduced-motion support and responsive layouts

## Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Firebase (Auth + Firestore), loaded from the CDN as ES modules
- Google Fonts (DM Sans + Manrope)
- No React / Next.js / build step

## Run
Open `index.html` directly, or serve the folder with any static server:

```sh
python3 -m http.server 8000
```

Firebase needs a real HTTP origin, so prefer the static server over opening the
file from disk. With no server and no network the app still runs — it just falls
back to local storage.

## Persistence

`store.js` picks a backend at runtime:

| Condition | Backend |
| --- | --- |
| `firebase-config.js` filled in and reachable | Firestore, signed in anonymously |
| Config blank, offline, or the SDK is blocked | `localStorage` |

Either way the app keeps working — the profile screen shows which backend is
live. State is stored per user at `users/{uid}`: goal, equipment, anonymous
flag, streak, workouts completed, total minutes, weekly progress and history.
The in-progress workout session is deliberately **not** persisted, so a reload
never drops you back into a half-finished set.

### Firebase setup

The project is already wired to the `zaman-fitness` Firebase project in
`firebase-config.js`. To finish the setup in the Firebase console:

1. **Authentication → Sign-in method →** enable **Anonymous**.
2. **Firestore Database →** create a database.
3. **Firestore → Rules →** paste the contents of [`firestore.rules`](firestore.rules).
4. **Authentication → Settings → Authorized domains →** add the GitHub Pages
   host (`umair34836-sys.github.io`) and any custom domain, or anonymous
   sign-in will be rejected on the deployed site.

The values in `firebase-config.js` are public project identifiers, not secrets.
Firebase web apps are designed to ship them in client code; access is controlled
by the security rules above, which is why step 3 matters.

## Deployment

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on
every push. Enable it once under **Settings → Pages → Source → GitHub Actions**.

## Design reference
The visual direction follows the supplied mobile video: compact 384px-style mobile composition, light neutral canvas, olive fitness green, rounded cards, progress bars/rings, workout metrics, exercise flow and completion state. The provided UI/UX Pro Max source was used as the design-system reference; the fitness category recommends progress tracking, workout plans, achievements and motivational interactions.

## Prototype scope

Honest about what is and isn't real:

- The workout itself is a fixed plan in `app.js` (6 exercises, 21 sets). "Generate
  Workout" replays a short loading state rather than calling a model.
- The exercise flow, set/rest tracking, session totals and persistence are real.
- Admin console figures are placeholder data; its buttons open a demo modal.
