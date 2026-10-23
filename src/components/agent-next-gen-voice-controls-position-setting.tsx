// The Settings page's "Voice Controls Position" control — lets an agent
// choose whether the voice-call-controls bar (Hold/Mute/Mask/Record/
// Keypad/Consult/Transcript/Volume/Add video/End Call, plus the customer
// identity/roster strip above them) docks at the bottom of the interaction
// content column (the long-standing default) or renders compactly above
// the left nav's own assignment list instead — per explicit request: "a
// user can define whether the voice controls appear at the bottom of the
// screen as it is now, or choose to have them appear above the assignment
// cards." A `RadioButtonGroup` (not a `Switch`) per that same request's own
// framing — this is a choice between two positions, not an on/off toggle.
//
// Shared by both `AgentWorkspace2WithDeskPage.tsx` and
// `AgentWorkspaceAdvancedPage.tsx` — their Settings page bodies were
// previously identical blank placeholders; both now render this one
// component instead of each hand-rolling their own copy of the same
// control (exactly the kind of duplication that's already bitten this app
// once — see `scroll-chevron.tsx`'s own doc comment in lyra-ui for the
// precedent this avoids).
//
// Deliberately a CONTROLLED component (`value`/`onValueChange`, no local
// state of its own) rather than owning `getVoiceControlsPosition()`
// internally — the caller (each page) is ALSO the thing deciding, on every
// render, where to actually mount `VoiceCallControls` (bottom bar vs. the
// left-nav instance), and that decision needs to react immediately if the
// agent changes this setting mid-session, not just after a reload. If this
// component read/held its own copy of the value, that would be a second,
// independent source of truth that could silently drift from the page's
// own — the exact "two things that look like one" failure mode this app's
// own `ActiveInteraction.currentStatus` fix (rule #29, CLAUDE.md) was
// written to avoid. Each page owns the single `useState`, seeded from
// `getVoiceControlsPosition()` on mount, and persists every change via
// `setVoiceControlsPosition` right alongside updating that state.
import { RadioButtonGroup } from "@nicecxone/lyra-ui";
import type { VoiceControlsPosition } from "@/components/agent-next-gen-voice-controls-position";

const VOICE_CONTROLS_POSITION_OPTIONS: { value: VoiceControlsPosition; label: string }[] = [
  { value: "bottom", label: "Bottom of the screen" },
  { value: "aboveAssignments", label: "Above the assignment list" },
];

export function VoiceControlsPositionSetting({
  value,
  onValueChange,
}: {
  value: VoiceControlsPosition;
  onValueChange: (next: VoiceControlsPosition) => void;
}) {
  return (
    <div className="max-w-[480px] rounded-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-4">
      <h3 className="lyra-label-md text-lyra-fg-primary">Voice Controls Position</h3>
      <p className="mt-1 lyra-body-sm text-lyra-fg-secondary">
        Choose where the voice call controls (Hold, Mute, Record, and the rest) appear during an
        active call.
      </p>
      <RadioButtonGroup
        className="mt-3"
        options={VOICE_CONTROLS_POSITION_OPTIONS}
        value={value}
        onValueChange={(next: string) => onValueChange(next as VoiceControlsPosition)}
      />
    </div>
  );
}
