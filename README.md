# Zaman Fitness — Frontend Prototype

Static, GitHub Pages-friendly fitness planner inspired by the supplied reference video.

## Included
- Goal onboarding
- Equipment selection/search
- Personalized dashboard
- Workout details with live set progress
- Goal- and equipment-aware workout generation from a 42-exercise library
- Full exercise flow — every set of every exercise, with a rest timer between sets
- Workout completion screen with real session totals
- Progress, history and profile
- Anonymous mode (Firebase anonymous auth, or local-only when offline)
- Admin view (`#admin`) for this account's totals and the exercise library
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

## How workouts are built

`workouts.js` holds the exercise library (42 exercises tagged by movement
pattern and required equipment) and the generator. `generateWorkout(goal,
equipment)` filters the library to gear the user actually owns, fills a
push/pull/legs/core rotation without repeating an exercise, and applies a
set/rep/rest scheme chosen by goal:

| Goal | Scheme | Rest |
| --- | --- | --- |
| Lose Weight | 3 × 15 | 35s |
| Gain Muscle | 12/10/8/8 | 75s |
| Gain Strength | 5/5/3/3/3 | 150s |
| Look Bigger | 12/12/10/10 | 70s |

Strength sessions get fewer movements so the long rests still fit in an hour,
and loaded exercises are preferred over bodyweight ones whenever the user has
the equipment — a 3-rep set only means something you can add weight to.

## What is real, and what is not

- Real: workout generation, the exercise flow, set and rest tracking, session
  totals, history, streaks, weekly charts and persistence. Every figure on the
  dashboard is recomputed from logged history — a new account starts at zero.
- Not real: there is no fleet-wide admin. `#admin` shows the signed-in user's
  own numbers plus the exercise library; aggregate reporting across all users
  needs a backend query layer that has not been built.
