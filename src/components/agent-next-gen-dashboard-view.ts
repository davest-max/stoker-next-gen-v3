// Persisted user preference: which card renders in the home dashboard's
// own "recent activity" slot — `"myEmails"` (an email-heavy-workload card,
// `EmailFocusCard`) or `"contactHistory"` (`ContactHistoryCard`, what the
// agent just finished) — see the Settings page's "Dashboard View" control
// (agent-next-gen-dashboard-view-setting.tsx). Exactly one of the two ever
// renders in that slot (see `AgentWorkspace2WithDeskPage.tsx`'s own call
// site) — a relocation of which card shows, not a duplication.
//
// Mirrors `agent-next-gen-voice-controls-position.ts`'s identical shape
// (lazy-read module cache, eager write-through, try/catch around both for
// a disabled/unavailable storage) — the established pattern for this exact
// kind of single-value persisted preference in this app, not a new one.
// `:v1` suffix matches that same file's versioned-key convention.
export type DashboardView = "myEmails" | "contactHistory";

const STORAGE_KEY = "agent-next-gen:dashboard-view:v1";
// Was "myEmails" — switched to "contactHistory" per explicit request ("set
// the default dashboard setting to Contact History").
const DEFAULT_VIEW: DashboardView = "contactHistory";

let cache: DashboardView | null = null;

export function getDashboardView(): DashboardView {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw === "myEmails" || raw === "contactHistory" ? raw : DEFAULT_VIEW;
  } catch {
    // Storage disabled/unavailable — fall back to the default for this
    // session; every read still goes through this same function, so the
    // whole app stays internally consistent even without persistence.
    cache = DEFAULT_VIEW;
  }
  return cache;
}

export function setDashboardView(next: DashboardView): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // In-memory cache is still correct for the rest of this session; it
    // just won't survive a reload.
  }
}
