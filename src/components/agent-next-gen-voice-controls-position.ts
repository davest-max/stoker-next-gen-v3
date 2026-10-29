// Persisted user preference: where the voice-call-controls bar renders —
// `"bottom"` (the long-standing default, docked at the bottom of the
// interaction content column), `"aboveAssignments"` (a second, compact
// icon-only instance pinned above the left nav's own assignment list
// instead), or `"withinTile"` (embedded inside the active call's own
// assignment tile in that same list, as the tail end of that one card —
// see the Settings page's "Voice Controls Position" control,
// agent-next-gen-voice-controls-position-setting.tsx). Exactly one of the
// three ever renders for a given call (see each page's own `VoiceCallControls`
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
export type VoiceControlsPosition = "bottom" | "aboveAssignments" | "withinTile";

const STORAGE_KEY = "agent-next-gen:voice-controls-position:v1";
const DEFAULT_POSITION: VoiceControlsPosition = "bottom";

let cache: VoiceControlsPosition | null = null;

export function getVoiceControlsPosition(): VoiceControlsPosition {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache =
      raw === "bottom" || raw === "aboveAssignments" || raw === "withinTile" ? raw : DEFAULT_POSITION;
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

// Per explicit request ("I need to show each voice control settings
// variation to different testers. One variation for each tester. Each
// with a unique URL"): reads `?voiceControls=<value>` from the page's own
// query string — e.g. `?voiceControls=withinTile#/agent-premium` — so a
// tester's link alone decides which variation they land on, without
// anyone having to walk them through Settings first. Returns `null` (not
// a fallback to the default) when the param is absent or isn't one of the
// three real values, so a caller can tell "no override, use whatever's
// already persisted" apart from "override to the default" — those aren't
// the same thing once a value is ALSO being persisted (below). Read via
// `location.search` specifically (not the `#/...` hash this app's own
// routing lives in) — query strings sit before the hash in a URL and are
// always available through `location.search` regardless of how the hash
// itself gets parsed for page routing, so this needs no coordination with
// that routing at all.
export function getVoiceControlsPositionOverrideFromUrl(): VoiceControlsPosition | null {
  try {
    const raw = new URLSearchParams(window.location.search).get("voiceControls");
    return raw === "bottom" || raw === "aboveAssignments" || raw === "withinTile" ? raw : null;
  } catch {
    return null;
  }
}
