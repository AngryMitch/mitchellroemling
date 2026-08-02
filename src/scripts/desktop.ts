/**
 * The desktop shell: the whole site lives in one document.
 *
 * Every page still builds as an ordinary static page, so direct links, crawlers
 * and no-JS visitors get real HTML. On the client we simply never do a document
 * navigation: link clicks are intercepted, the target page is fetched, and only
 * its <section class="window"> is lifted out and dropped onto the desktop.
 *
 * That is the whole trick behind the music. The player's iframe is part of the
 * shell and is never removed, re-inserted or reparented, so its audio is never
 * interrupted. (Reparenting an iframe discards its browsing context, which is
 * why Astro's transition:persist could only ever get us so far.)
 *
 * Desktop: many windows at once, dragged by their title bar, click to raise,
 * one taskbar button each.
 * Phones: exactly one window at a time, full width, no dragging — same as before.
 */

interface Win {
  el: HTMLElement;
  btn: HTMLButtonElement;
  path: string;
  title: string;
  icon: string;
  minimized: boolean;
}

const DESKTOP_MIN = 768;
const CASCADE_STEP = 32;
const EDGE_MARGIN = 12;
/** Width reserved down the left edge for the desktop icons. */
const ICON_COLUMN = 124;

const isDesktop = () => window.innerWidth >= DESKTOP_MIN;

const host = document.getElementById('window-host');
const taskButtons = document.getElementById('task-buttons');
const siteName = document.body.dataset.siteName || 'Desktop';

const windows = new Map<string, Win>();
let topZ = 10;
let openedCount = 0;
let focused: Win | null = null;

/** `/gallery/`, `/gallery` and `/gallery?x=1` are all the same window. */
function normalize(url: string): string {
  const u = new URL(url, location.origin);
  let p = u.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

const sameOrigin = (url: string) => new URL(url, location.origin).origin === location.origin;

/**
 * Move a window vertically. The offset is mirrored into `--win-top` because the
 * CSS max-height is expressed relative to it — that way the cap stays correct
 * when the viewport resizes, instead of being frozen at whatever the height was
 * when the window happened to open.
 */
function setTop(el: HTMLElement, px: number) {
  el.style.top = `${Math.round(px)}px`;
  el.style.setProperty('--win-top', `${Math.round(px)}px`);
}

/* ---------------------------------------------------------------- scripts */
/* A fetched page carries the shell's scripts as well as its own. The shell's are
   identical on every page and already running, so we track what we've seen and
   only add what's genuinely new — e.g. the gallery's filter script the first
   time the gallery is opened.
 *
 * Production inlines these scripts; `astro dev` serves them as external modules.
 * Both shapes have to be handled, keyed by source text and by URL respectively.
 * Re-adding a module URL is harmless: the browser only ever evaluates it once. */
const seenInline = new Set<string>();
const seenSrc = new Set<string>();
for (const s of Array.from(document.querySelectorAll('script'))) {
  const src = s.getAttribute('src');
  if (src) seenSrc.add(new URL(src, location.href).href);
  else seenInline.add(s.textContent ?? '');
}

/** Must run *after* the window is in the DOM, or the page's init finds nothing. */
function runNewScripts(doc: Document) {
  for (const old of Array.from(doc.querySelectorAll('script'))) {
    const rawSrc = old.getAttribute('src');
    const type = old.getAttribute('type');
    const s = document.createElement('script');
    if (type) s.type = type;

    if (rawSrc) {
      const abs = new URL(rawSrc, location.href).href;
      if (seenSrc.has(abs)) continue;
      seenSrc.add(abs);
      s.src = abs;
    } else {
      const code = old.textContent ?? '';
      if (!code.trim() || seenInline.has(code)) continue;
      seenInline.add(code);
      s.textContent = code;
    }
    document.head.appendChild(s);
  }
}

/* Page scripts already re-bind themselves on this event, and each guards with a
   `data-*Ready` flag, so firing it after every injection is safe and idempotent. */
const announce = () => document.dispatchEvent(new CustomEvent('mr:window-ready'));

/* ------------------------------------------------------------------ chrome */
function titleOf(el: HTMLElement): string {
  return el.querySelector('.title-text')?.textContent?.trim() || 'Window';
}

function iconOf(el: HTMLElement): string {
  return el.querySelector<HTMLImageElement>('.title-icon')?.getAttribute('src') || '/icons/computer.svg';
}

function makeTaskButton(win: Win) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'task-btn';
  btn.dataset.path = win.path;
  btn.title = `${win.title} — click to minimise or restore`;
  const img = document.createElement('img');
  img.src = win.icon;
  img.alt = '';
  img.className = 'pixelated';
  img.width = 18;
  img.height = 18;
  const label = document.createElement('span');
  label.className = 'task-label';
  label.textContent = win.title;
  btn.append(img, label);
  btn.addEventListener('click', () => {
    if (win.minimized || focused !== win) restore(win);
    else minimize(win);
  });
  taskButtons?.appendChild(btn);
  return btn;
}

function syncTaskButton(win: Win) {
  win.btn.classList.toggle('is-minimized', win.minimized);
  win.btn.classList.toggle('is-focused', focused === win && !win.minimized);
  win.btn.setAttribute('aria-pressed', String(!win.minimized));
}

/* ----------------------------------------------------------------- layout */
/**
 * Size and stagger a newly opened window.
 *
 * Height is deliberately left to the content, capped by max-height, so the
 * Welcome note is a small note and the gallery is a tall browser — rather than
 * every window being the same half-empty rectangle. The body scrolls once the
 * cap is hit.
 */
function place(el: HTMLElement) {
  if (!isDesktop() || !host) return;
  const area = host.getBoundingClientRect();
  const gutter = ICON_COLUMN + EDGE_MARGIN;
  const w = Math.round(Math.min(920, Math.max(340, area.width - gutter - EDGE_MARGIN * 2)));

  const step = openedCount % 6;
  const left = Math.min(gutter + step * CASCADE_STEP, Math.max(gutter, area.width - w - EDGE_MARGIN));
  const top = Math.min(EDGE_MARGIN + step * CASCADE_STEP, Math.max(EDGE_MARGIN, area.height - 200));

  el.style.width = `${w}px`;
  el.style.height = '';
  el.style.left = `${Math.round(left)}px`;
  setTop(el, top);
  openedCount++;
}

/** Keep a window's title bar reachable after a drag or a viewport resize. */
function clampIntoView(el: HTMLElement) {
  if (!isDesktop() || !host) return;
  const area = host.getBoundingClientRect();
  const w = el.offsetWidth;
  const left = parseFloat(el.style.left || '0');
  const top = parseFloat(el.style.top || '0');
  el.style.left = `${Math.round(Math.min(Math.max(left, EDGE_MARGIN - w + 120), area.width - 120))}px`;
  setTop(el, Math.min(Math.max(top, 0), Math.max(0, area.height - 48)));
}

function focus(win: Win, { updateUrl = true } = {}) {
  if (focused && focused !== win) {
    focused.el.classList.remove('is-focused');
    focused.el.querySelector('.title-bar')?.classList.remove('active');
    syncTaskButton(focused);
  }
  focused = win;
  win.el.classList.add('is-focused');
  win.el.querySelector('.title-bar')?.classList.add('active');
  if (isDesktop()) win.el.style.zIndex = String(++topZ);
  document.title = win.title === siteName ? siteName : `${win.title} - ${siteName}`;
  // Phones only show the desktop icons under the home window (as before).
  document.body.classList.toggle('is-home', win.path === '/');
  syncTaskButton(win);
  if (updateUrl && normalize(location.pathname) !== win.path) {
    history.replaceState({ path: win.path }, '', win.path);
  }
}

function minimize(win: Win) {
  win.minimized = true;
  win.el.classList.add('is-minimized');
  if (focused === win) focused = null;
  syncTaskButton(win);
  // Hand focus to whatever is still visible, so the URL keeps meaning something.
  const next = [...windows.values()].filter((w) => !w.minimized).pop();
  if (next) focus(next);
}

function restore(win: Win) {
  win.minimized = false;
  win.el.classList.remove('is-minimized');
  focus(win);
}

function close(win: Win) {
  win.el.remove();
  win.btn.remove();
  windows.delete(win.path);
  if (focused === win) focused = null;
  const next = [...windows.values()].filter((w) => !w.minimized).pop();
  if (next) focus(next);
  else {
    document.body.classList.add('desktop-empty');
    document.body.classList.add('is-home');
    history.replaceState({ path: '/' }, '', '/');
    document.title = siteName;
  }
}

/* ------------------------------------------------------------------- drag */
function makeDraggable(win: Win) {
  const bar = win.el.querySelector<HTMLElement>('.title-bar');
  if (!bar) return;
  bar.addEventListener('pointerdown', (e) => {
    // Let the minimise/maximise/close buttons do their own thing.
    if ((e.target as HTMLElement).closest('.ctrl')) return;
    if (!isDesktop() || win.el.classList.contains('is-maximised')) return;
    e.preventDefault();
    focus(win);
    const startX = e.clientX;
    const startY = e.clientY;
    const originLeft = parseFloat(win.el.style.left || '0');
    const originTop = parseFloat(win.el.style.top || '0');
    win.el.classList.add('is-dragging');
    bar.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      win.el.style.left = `${originLeft + (ev.clientX - startX)}px`;
      setTop(win.el, originTop + (ev.clientY - startY));
    };
    const end = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
      win.el.classList.remove('is-dragging');
      clampIntoView(win.el);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });
}

/* --------------------------------------------------------------- register */
/** Wire up a .window element (server-rendered or freshly fetched). */
function register(el: HTMLElement, path: string): Win {
  const win: Win = {
    el,
    path,
    title: titleOf(el),
    icon: iconOf(el),
    minimized: false,
    btn: null as unknown as HTMLButtonElement,
  };
  el.dataset.path = path;
  win.btn = makeTaskButton(win);
  windows.set(path, win);

  el.addEventListener('pointerdown', () => { if (focused !== win) focus(win); }, true);
  el.querySelector('[data-min]')?.addEventListener('click', () => minimize(win));
  el.querySelector('[data-close]')?.addEventListener('click', (e) => {
    e.preventDefault();
    close(win);
  });
  el.querySelector('[data-max]')?.addEventListener('click', () => {
    el.classList.toggle('is-maximised');
  });
  makeDraggable(win);
  document.body.classList.remove('desktop-empty');
  return win;
}

/* ------------------------------------------------------------------ fetch */
const cache = new Map<string, string>();

/** The window element plus the document it came from, so its scripts can be
 *  started once the element is actually on the page. */
async function fetchWindow(path: string): Promise<{ el: HTMLElement; doc: Document } | null> {
  let html = cache.get(path);
  if (html === undefined) {
    const res = await fetch(path, { headers: { 'X-Requested-With': 'desktop-shell' } });
    if (!res.ok && res.status !== 404) return null;
    html = await res.text();
    cache.set(path, html);
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const found = doc.querySelector<HTMLElement>('.window');
  if (!found) return null;
  return { el: document.importNode(found, true), doc };
}

/* ----------------------------------------------------------------- opening */
type OpenOpts = { push?: boolean; replaceWindow?: Win | null };

async function open(rawPath: string, { push = true, replaceWindow = null }: OpenOpts = {}) {
  const path = normalize(rawPath);
  const existing = windows.get(path);
  if (existing && !replaceWindow) {
    restore(existing);
    if (push) history.pushState({ path }, '', path);
    return;
  }

  host?.classList.add('is-loading');
  const fetched = await fetchWindow(path);
  host?.classList.remove('is-loading');
  const el = fetched?.el;
  if (!el || !fetched) {
    // Something we can't render as a window (or a network failure) — let the
    // browser handle it the old-fashioned way rather than silently doing nothing.
    location.href = path;
    return;
  }

  // A link followed from inside a window navigates that window in place, the way
  // a file manager would. Only the desktop icons and Start menu open new windows.
  if (replaceWindow) {
    windows.delete(replaceWindow.path);
    replaceWindow.el.replaceWith(el);
    replaceWindow.btn.remove();
    if (focused === replaceWindow) focused = null;
    if (isDesktop()) {
      el.style.left = replaceWindow.el.style.left;
      el.style.top = replaceWindow.el.style.top;
      el.style.width = replaceWindow.el.style.width;
      el.style.maxHeight = replaceWindow.el.style.maxHeight;
      el.style.zIndex = replaceWindow.el.style.zIndex;
    }
  } else {
    // Phones show one window at a time, exactly as the site did before.
    if (!isDesktop()) [...windows.values()].forEach(close);
    place(el);
    host?.appendChild(el);
  }

  const win = register(el, path);
  focus(win, { updateUrl: false });
  if (push) history.pushState({ path }, '', path);
  else history.replaceState({ path }, '', path);
  // Only now that the window is on the page can its scripts find their elements.
  runNewScripts(fetched.doc);
  announce();
  if (!isDesktop()) el.scrollIntoView({ block: 'start' });
}

/* ------------------------------------------------------------------ links */
document.addEventListener('click', (e) => {
  const me = e as MouseEvent;
  if (me.defaultPrevented || me.button !== 0 || me.metaKey || me.ctrlKey || me.shiftKey || me.altKey) return;
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (a.target === '_blank' || a.hasAttribute('download') || href.startsWith('#')) return;
  if (!sameOrigin(a.href) || /^(mailto|tel):/.test(href)) return;
  // The RSS feed and sitemap are real files, not windows.
  if (/\.(xml|json|txt|svg|png|jpe?g|webp|pdf)$/i.test(new URL(a.href).pathname)) return;

  e.preventDefault();
  const from = a.closest<HTMLElement>('.window');
  const owner = from?.dataset.path ? windows.get(from.dataset.path) ?? null : null;
  open(a.href, { replaceWindow: owner });
});

window.addEventListener('popstate', () => {
  const path = normalize(location.pathname);
  const existing = windows.get(path);
  if (existing) restore(existing);
  else open(path, { push: false });
});

/* Windows shouldn't strand themselves off-screen when the viewport changes. */
let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => windows.forEach((w) => clampIntoView(w.el)), 150);
});

/* ------------------------------------------------------------------- boot */
const initial = host?.querySelector<HTMLElement>('.window');
if (initial) {
  const win = register(initial, normalize(location.pathname));
  place(initial);
  focus(win, { updateUrl: false });
  history.replaceState({ path: win.path }, '', win.path);
} else {
  document.body.classList.add('desktop-empty');
}
announce();

export {};
