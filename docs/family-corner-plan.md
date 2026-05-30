# Plan: the hidden "family corner"

> **Status: ✅ implemented (Phases 1 + 2).** Encrypted `.family` corner is live:
> a visible 🔒 folder on the desktop → passcode dialog → "family mode" decrypts
> a multi-page corner (Welcome + Gifts). Content is AES-GCM encrypted at build
> time; only ciphertext ships. Per-entry `hidden` flag added to all collections
> (unlisted from gallery/projects/blog + sitemap + RSS). See **[What got built &
> how to use it](#what-got-built--how-to-use-it)** at the bottom.
>
> Decisions made:
>
> 1. **Security:** build-time **encryption** (option B).
> 2. **Unlock:** one passcode turns on **"family mode"** (reveals all hidden
>    pages *and* decrypts the gifts list for the session).
> 3. **Entry point:** **double-click the `.family` folder**.
> 4. **Scope:** **multi-page corner** (gifts list now + room for more family
>    pages from the start).
>
> **Refinement from decision 3:** because the `.family` folder *is* the way you
> unlock, it can't be hidden itself (chicken-and-egg). So `.family` is a
> **visible-but-locked door** on the desktop — a folder icon with a 🔒 padlock
> badge. Double-click → passcode dialog → on success, family mode turns on: the
> folder opens into the corner (gifts decrypted) **and** every *other*
> `hidden: true` page becomes visible for the session. One obvious locked door;
> everything else stays invisible until you're in.

## What you asked for

1. A **hidden passcode** that unlocks a private **"Gifts I Want" list** for
   friends & family.
2. The ability to **show / hide pages** generally.
3. A **`.FOLDER`** (dotfile) flavour to it all.

These map cleanly onto one idea everyone already understands: **hidden files**.
On a real desktop, `.`-prefixed files exist but don't show up until you turn on
"Show hidden files." We lean into exactly that.

---

## The unifying metaphor: dotfiles + "Show hidden files"

- Any page/folder can be marked **hidden** (a `.`-prefixed display name like
  `.family`). Hidden items are left out of the desktop, Start menu, listings,
  the sitemap, and RSS.
- A **"Show hidden files"** toggle (lives in a Win95-style *Folder Options*
  dialog, or is flipped automatically when you enter the passcode) reveals the
  hidden `.folder` icons for the rest of your session.
- One hidden folder — `.family` — is special: its **Gifts list is passcode-
  locked** so that even revealing it isn't enough; you also need the code.

So there are **two layers**, and it's important to be clear they protect
different amounts:

| Layer | Mechanism | Protects against | Honest security |
|---|---|---|---|
| **Hidden** (show/hide) | left out of nav + listings | casual browsing | **Obscurity only** — page still exists at its URL |
| **Locked** (passcode) | content encrypted at build | anyone without the code | **Real** — ciphertext only, see below |

---

## The honest bit: "secrets" on a static site

This site is **100% static** (no server, deployed to Cloudflare Pages). That
matters: a normal "password check" in JavaScript is **not** security — the
password and the hidden content both ship in the page source, so anyone who
opens dev tools can read them. For a gift list that's "hidden for the surprise,"
that may be fine — but you should choose with eyes open. Three real options:

| Approach | How it works | Security | Static-friendly | Effort |
|---|---|---|---|---|
| **A. Obscurity** | JS compares the typed code to a value; reveals hidden HTML | Low — content + code visible in source | ✅ yes | Low |
| **B. Build-time encryption** *(recommended)* | Gift list is **AES-GCM encrypted at build** with a key derived from the passcode; only ciphertext ships; the browser decrypts when you type the code | Strong — without the code there's nothing readable, even in source | ✅ yes | Medium |
| **C. Cloudflare Access** | Cloudflare gates the route; family sign in with an email one-time PIN | Strongest (real identity auth) | ✅ (Cloudflare feature) | Medium, dashboard setup, changes UX from "passcode" to "email login" |

**Recommendation: B.** It keeps the playful "type the secret code" UX, needs no
backend, stays a static deploy, and actually delivers the "secret" promise — the
gift list is genuinely unreadable without the passcode. (We can layer C on later
if you ever want true per-person access.)

### How B works, concretely (commit-the-ciphertext workflow)

Chosen because it's safe even if the GitHub repo is **public**: plaintext and
passcode never leave your machine — only the encrypted blob is ever committed or
deployed.

1. You edit the gift list as normal content (`src/content/.family/gifts.md`),
   plaintext. This file is **git-ignored** — it never gets committed.
2. You run **`npm run encrypt`** locally. The script
   (`scripts/encrypt-secrets.mjs`) derives a key from your passcode (typed at the
   prompt, or read from a local `.env` `FAMILY_PASSCODE`) via PBKDF2 and writes
   **`src/generated/family.enc.json`** — the ciphertext. **This file IS
   committed.**
3. `git push`. Cloudflare builds the static site, which ships only the ciphertext
   + a small decrypt island. No passcode, no plaintext, no build secret.
4. Family double-clicks `.family`, types the code → the browser runs PBKDF2 +
   AES-GCM (Web Crypto) → decrypts → renders the list. The passcode never leaves
   their browser.

Edit flow becomes: *edit gifts → `npm run encrypt` → commit → push.* (We can add
a tiny guard so a forgotten re-encrypt is obvious.) Changing the passcode = edit
once, re-encrypt, push.

> **Alternative (private repo):** if your repo is private, you can skip the
> git-ignore and instead encrypt at build using a Cloudflare build secret — then
> editing is just "save and push." Tell me your repo is private and I'll wire it
> that way instead. The default below assumes the safer commit-ciphertext flow.

---

## Recommended design (assuming option B)

### Unlock = "family mode"

Entering the passcode once flips a **session flag** (`sessionStorage`) that does
two things at once:
- **Reveals** all hidden `.folders` (turns on "Show hidden files" for you).
- **Decrypts** the locked Gifts list.

One code, the whole corner opens. Closing the browser re-hides everything.

### Where you type the code (pick the vibe in Q4)

- **Start → Run…** — a Win95 "Run" dialog where you type the code like a secret
  command (`gifts`, or the passcode itself). Maximally on-theme.
- **Double-click `.family`** — the folder prompts for the code via a Dialog.
- Both can coexist.

### What's hidden vs locked

- `.family` folder (hidden) → contains the **Gifts list (locked)** + room for
  other family-only pages later (photos, notes, "where we're registered", etc.).
- Any *other* page can be flagged `hidden: true` to tuck it away (show/hide)
  without locking it — e.g. a draft gallery, an inside-joke page.

---

## How it fits the existing project

Reuses a lot of what's already here:

- **`Dialog.astro`** → the passcode prompt and the *Folder Options* dialog.
- **`DesktopIcon.astro`** → the `.family` desktop icon (rendered but
  `display:none` until family mode is on).
- **Start menu / `MenuBar.astro`** → add the "Run…" entry and/or a
  *View → Show hidden files* item.
- **Content collections** → add a `hidden` flag to existing schemas (artwork /
  projects / blog) so any entry can be hidden, and a new `secret`/`.family`
  area for the locked content.
- **Keystatic** → edit the gift list and toggle `hidden`/`featured` in the local
  editor as usual; encryption happens at build, after you save.
- **Sitemap/RSS** → add filters so hidden + locked routes are excluded; add
  `noindex` to those pages so search engines skip them.

## New pieces to build

```
src/content/.family/gifts.md        # plaintext source (git-ignored / private)
scripts/encrypt-secrets.mjs         # build-time AES-GCM encryptor
src/generated/family.enc.json       # ciphertext output (git-ignored)
src/lib/family-mode.ts              # session flag + show/hidden helpers
src/components/Run.astro            # "Start → Run…" secret-command dialog
src/components/FolderOptions.astro  # "Show hidden files" toggle dialog
src/components/LockedContent.astro  # ciphertext + Web Crypto decrypt island
src/pages/.family/index.astro       # the corner (gifts list, family pages)
```

Plus small edits: `consts.ts` (hidden nav items), schema `hidden` flags,
`astro.config.mjs` sitemap filter, `rss.xml.ts` filter, `package.json` prebuild
script, `.gitignore` (secrets), `.env.example` (`FAMILY_PASSCODE`).

## Security notes & limitations (please read)

- **Don't put anything truly sensitive here** (no addresses you'd be harmed by
  leaking, no financial info). It's a gift list for family, not a vault.
- Option B protects the **content**; it does not hide that a `.family` page
  *exists* if someone digs (the encrypted blob is visible, just unreadable).
- A weak passcode can be brute-forced offline against the ciphertext. PBKDF2
  with a high iteration count slows this; still, pick a non-trivial code.
- Hidden-but-unlocked pages (the show/hide layer) are **obscurity only** — fine
  for tucking things away, not for secrets.

## Phased rollout

- **Phase 1 — Show/Hide.** The `hidden` flag + "Show hidden files" toggle +
  exclusion from nav/listings/sitemap/RSS. No crypto yet. (~1 hr)
- **Phase 2 — Locked gifts list.** The encrypt build step, the `.family` page,
  the passcode Run/Dialog unlock, the decrypt island. (~2 hrs)
- **Phase 3 — Polish.** Multiple family pages, a nicer unlocked "Explorer" view
  of the corner, optional Cloudflare Access if you want real per-person logins.

---

## Open questions (for you)

1. **Security model** — obscurity (A), build-time encryption (B, recommended),
   or Cloudflare Access (C)?
2. **Passcode scope** — one shared family code, or different codes per person?
3. **Unlock behaviour** — should one passcode unlock *everything* ("family
   mode"), or should "show hidden files" be freely available while only the
   gifts list needs the code?
4. **Entry point vibe** — Start → Run… secret command, double-click the
   `.family` folder, or both?
5. **Scope of the corner** — just the gifts list for now, or set it up to hold
   several family-only pages from the start?

*(All five answered — see the status banner up top.)*

---

## What got built & how to use it

**Files (actual implementation — simpler than the sketch above):**

```
.family/welcome.md  .family/gifts.md      # PLAINTEXT, git-ignored — edit these
scripts/encrypt-secrets.mjs               # `npm run encrypt` → ciphertext
scripts/check-secrets.mjs                 # warns (never blocks) if you forgot to re-encrypt
src/generated/family.enc.json             # ciphertext — COMMIT this one
src/pages/family.astro                    # the corner: locked gate + decrypt island
public/icons/family-locked.svg            # the 🔒 desktop folder
.env.example                              # FAMILY_PASSCODE
```

Edits: `content.config.ts` + `keystatic.config.ts` (`hidden` flag/checkbox),
all three listing pages + their `[slug]` pages + `rss.xml.ts` (`!hidden`),
`astro.config.mjs` (sitemap excludes `/family`), `BaseLayout.astro` (`noindex`
prop + early family-mode class), `index.astro` (the `.family` desktop icon),
`package.json` (`encrypt` script + `dev` runs the guard), `.gitignore`.

### Your workflow for the gift list

1. Edit `.family/gifts.md` (and/or add more `.family/*.md` pages — the first
   `# Heading` becomes the document title).
2. Set your real passcode once: copy `.env.example` → `.env` and change
   `FAMILY_PASSCODE` (the `.env` is git-ignored). *Or* pass it inline.
3. `npm run encrypt` → rewrites `src/generated/family.enc.json`.
4. Commit (the ciphertext + page) and push. Plaintext + passcode never leave
   your machine.

> The committed ciphertext currently uses the placeholder passcode **`changeme`**
> — run step 2–3 with your own code before sharing the site with family.

### How it behaves

- The `.family` folder is always visible on the desktop (the locked door).
  Double-click → passcode prompt. Correct code → the window decrypts in-browser
  (PBKDF2 + AES-GCM via Web Crypto) and shows a mini-Explorer of the pages.
- Unlocking sets a session flag (`mr:family`) = **family mode** for the tab:
  it persists across navigation and re-opens the corner without re-typing.
  "Lock again" (or closing the tab) clears it.
- `hidden: true` on any artwork/projects/blog entry drops it from its listing,
  the sitemap, and RSS (toggle it in Keystatic too).

### Phase 3 candidates (for your review)

- A **"Show hidden files"** Folder-Options dialog + revealing `hidden` entries
  inside listings when family mode is on (currently they're simply unlisted).
- A **Start → Run…** secret-command entry point as an alternative door.
- Per-person passcodes / **Cloudflare Access** if you ever want real logins.
- A `npm run encrypt` reminder wired into a pre-commit hook.
