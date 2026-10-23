// Persisted user preference: where the voice-call-controls bar renders —
// `"bottom"` (the long-standing default, docked at the bottom of the
// interaction content column) or `"aboveAssignments"` (a second, compact
// icon-only instance pinned above the left nav's own assignment list
// instead — see the Settings page's "Voice Controls Position" control,
// agent-next-gen-voice-controls-position-setting.tsx). Exactly one of the
// two ever renders for a given call (see each page's own `VoiceCallControls`
// call sites) — this is a relocation, not a duplication.
//
// Follows this app's existing module-level-cache `localStorage` pattern
// (see agent-next-gen-case-database.ts's identical shape: lazy-read cache,
// eager write-through, try/catch around both for a disabled/unavailable
// storage) rather than a new React hook — there's no established hook
// precedent in this app yet, and this is a single plain value, not enough
// logic to justify introducing one. `:v1` suffix matches that same file's
// versioned-key convention, so a future breaking change to this value's
// shape can bump the key and start fresh instead of migrating/guessing at
// old data.
export type VoiceControlsPosition = "bottom" | "aboveAssignments";

const STORAGE_KEY = "agent-next-gen:voice-controls-position:v1";
const DEFAULT_POSITION: VoiceControlsPosition = "bottom";

let cache: VoiceControlsPosition | null = null;

export function getVoiceControlsPosition(): VoiceControlsPosition {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw === "bottom" || raw === "aboveAssignments" ? raw : DEFAULT_POSITION;
  } catch {
    // Storage disabled/unavailable — fall back to the default for this
    // session; every read still goes through this same function, so the
    // whole app stays internally consistent even without persistence.
    cache = DEFAULT_POSITION;
  }
  return cache;
}

export function setVoiceControlsPosition(next: VoiceControlsPosition): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // In-memory cache is still correct for the rest of this session; it
    // just won't survive a reload.
  }
}
