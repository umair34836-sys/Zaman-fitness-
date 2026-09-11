# Zaman Fitness

A workout app that builds each session around the user's goal and the equipment
they actually own, walks them through it set by set, and tracks the weight they
lift. Static HTML, CSS and vanilla JavaScript — no build step — with Firebase
for accounts and the admin-managed catalogue.

## How a visitor moves through it

1. **Visitor page** — everything about the app: what it does, how it works, and
   a FAQ. Nothing is stored and no account exists yet.
2. **Create an account, or continue as a guest.** There is no silent or
   anonymous sign-in: a visitor is only ever a registered user or an explicit
   guest, by their own choice.
3. **Onboarding** — pick a goal, tick the equipment you own.
4. **Train** — build a session or pick a published plan, then follow it set by
   set with rest timers, tutorial videos and weight logging.

### Accounts vs guest

| | Account | Guest |
| --- | --- | --- |
| Where data lives | Firestore, under your uid | `localStorage`, this device only |
| Works on another device | Yes | No |
| Survives clearing the browser | Yes | No |
| Needed to use the app | No | — |

A guest who later registers keeps everything: `Store.adoptLocalInto()` copies
the local record into the new account before clearing it.

## Admin panel

Open at `#admin`, or from Profile → Admin when your account has access.

- **Exercises** — add, edit and delete; each carries its own **tutorial video
  link**, used everywhere that exercise appears. Left blank, the app links to a
  YouTube search for the exercise instead of a dead link.
- **Workouts** — create new plans and edit the built-in ones. Pick the goal,
  write a description, add exercises, set the reps and rest per exercise,
  reorder them, and publish or hide the plan.
- **Admins** — grant and revoke admin access by user ID.

Admin status is a document in the `admins` collection keyed by uid. The
Firestore rules check the same thing, so hiding the button is convenience, not
security — a non-admin cannot write to the catalogue even if they reach the URL.

## Firebase setup

The app is wired to the `zaman-fitness` project in `firebase-config.js`. In the
Firebase console:

1. **Authentication → Sign-in method** — enable **Email/Password** and
   **Google**. (Anonymous is deliberately *not* used.)
2. **Authentication → Settings → Authorized domains** — add
   `umair34836-sys.github.io`, or sign-in is rejected on the live site.
3. **Firestore Database** — create a database.
4. **Firestore → Rules** — paste [`firestore.rules`](firestore.rules).

### Making yourself the first admin

The rules let admins manage admins, so the first one is created by hand:

1. Sign in to the app with the account you want to be the admin.
2. Go to **Profile → Account** and copy **Your user ID**.
3. In the Firebase console, open **Firestore → Start collection**, name it
   `admins`, and create a document whose **Document ID is that user ID**. Add a
   field `email` (string) with your email address.
4. Reload the app. Profile now shows **Open admin panel**.

After that you can add other admins from the panel itself.

### Getting the catalogue into Firestore

The app ships with its full library built in, so it works before Firestore has
anything in it. To make that library editable, open the admin panel and press
**Import built-in catalogue** on the Overview tab. It writes the exercises and
workouts as documents and never overwrites an existing one, so it is safe to
run again.

## Data model

| Collection | Document | Who can read | Who can write |
| --- | --- | --- | --- |
| `users` | one per uid: goal, equipment, history, lastWeights | that user | that user |
| `exercises` | name, muscles, pattern, needs[], unit, load, **video** | everyone | admins |
| `workouts` | name, goal, description, published, items[] | everyone | admins |
| `admins` | keyed by uid, holds email | that uid, or any admin | admins |

The catalogue is world-readable on purpose, so guests and signed-out visitors
still see published plans.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Shell, PWA metadata, and a boot error handler that reports a failure on screen instead of a blank page |
| `styles.css` | Design system |
| `data.js` | Built-in exercises, workouts, goals, schemes and the generator |
| `backend.js` | Firebase: auth, Firestore, admin check |
| `store.js` | User data — routes to the account or to this device |
| `app.js` | Screens, router and the workout session |
| `admin.js` | Admin panel |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app and offline support |
| `firestore.rules` | Security rules |

## How sessions are built

Each goal sets the reps and rest:

| Goal | Sets × reps | Rest |
| --- | --- | --- |
| Lose Weight | 3 × 15 | 35s |
| Gain Muscle | 12/10/8/8 | 75s |
| Gain Strength | 5/5/3/3/3 | 150s |
| Look Bigger | 12/12/10/10 | 70s |

The generator fills a push / pull / legs / core rotation from exercises the user
has equipment for, never repeats an exercise within a session, prefers loaded
work over bodyweight when the gear is there, and gives strength sessions fewer
movements so the long rests still fit in an hour.

## Running locally

```sh
python3 -m http.server 8000
```

Use a server rather than opening the file directly — Firebase and service
workers need a real HTTP origin. With no network the app still runs; accounts
are disabled and guest mode is offered instead.

## Deployment

`.github/workflows/pages.yml` publishes the repository root to GitHub Pages on
every push. Enable it once under **Settings → Pages → Source → GitHub Actions**.
Bump `VERSION` in `sw.js` when shipping changes so installed clients update.

## What is not built

There is no fleet-wide reporting across all users — the admin Overview counts
the catalogue, not the user base. Aggregating that needs a backend query layer
(Cloud Functions), which would require the paid Firebase plan.
