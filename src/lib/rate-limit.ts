const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

type State = { fails: number; lockedUntil: number };

function key(scope: string) {
  return `tks19-rl-${scope}`;
}

function read(scope: string): State {
  if (typeof window === "undefined") return { fails: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(key(scope));
    if (!raw) return { fails: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as State;
    return { fails: parsed.fails ?? 0, lockedUntil: parsed.lockedUntil ?? 0 };
  } catch {
    return { fails: 0, lockedUntil: 0 };
  }
}

function write(scope: string, state: State) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(scope), JSON.stringify(state));
}

/** Remaining lock time in ms (0 when not locked). */
export function lockRemaining(scope: string): number {
  const { lockedUntil } = read(scope);
  return Math.max(0, lockedUntil - Date.now());
}

/** Registers a failed attempt and returns the lock time remaining afterwards. */
export function registerFailure(scope: string): number {
  const state = read(scope);
  const fails = state.fails + 1;
  const lockedUntil = fails >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
  write(scope, { fails: lockedUntil ? 0 : fails, lockedUntil });
  return Math.max(0, lockedUntil - Date.now());
}

export function clearFailures(scope: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(scope));
}

export function attemptsLeft(scope: string): number {
  return Math.max(0, MAX_ATTEMPTS - read(scope).fails);
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
