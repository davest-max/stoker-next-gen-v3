import * as React from "react";
import { Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@nicecxone/lyra-ui";

/**
 * PROTOTYPE — local to agent-next-gen-v3 only. NOT in lyra-ui yet. See
 * CollapsedChannelBadge.tsx's own doc comment for the same "why local"
 * convention this follows (build new things locally, promote to lyra-ui
 * only once explicitly asked).
 *
 * Depicts an interaction's own live voice call as "on hold" once the agent
 * has navigated away to a different interaction — per explicit request
 * ("if the agent goes to a different interactionNavItem the call controls
 * should go into a hold mode and be depicted as on hold in the
 * interactionNavItem"). Each page derives WHICH interaction this applies to
 * itself (an interaction has a live, not-yet-hung-up voice thread AND isn't
 * the currently active interaction — see each page's own
 * `findLiveVoiceThread` doc comment) and passes that down as
 * `InteractionNavCard`'s own `onHold` prop; this file only owns the two
 * actual renderings, since `InteractionNavItem` (lyra-ui, read-only) has no
 * built-in slot for either.
 *
 * Two renderings because `InteractionNavCard` (each page's own local wrapper
 * around `InteractionNavItem`, not this file) itself renders two
 * structurally different shapes depending on whether the LeftNav rail is
 * expanded:
 *  - `OnHoldCornerBadge` — collapsed (icon-rail) tile: an absolutely-
 *    positioned corner badge, the same "external overlay on a `relative`
 *    wrapper" technique `CollapsedChannelBadge` already uses for that same
 *    tile (that component's own doc comment has the full "why external,
 *    why `relative`" reasoning) — parked at the OPPOSITE corner
 *    (`right-0 top-0`) so it never collides with that badge's `left-0
 *    top-0`.
 *  - `OnHoldPill` — expanded (full detail) card: a small inline red label
 *    (no pill background — see this function's own doc comment) meant
 *    for `InteractionNavItem`'s own `headerAction` slot (rendered at the
 *    end of the card's header row, next to the customer name) — the only
 *    slot that component exposes for arbitrary extra content there.
 */
export function OnHoldCornerBadge({ className }: { className?: string }) {
  return (
    <Badge
      shape="circle"
      size="sm"
      aria-label="Call on hold"
      className={cn(
        // Red (critical), not amber (warning) — per explicit follow-up
        // request ("change yellow background of the hold element to a
        // light pink... Match the hold div from the voice control
        // attached"): matches the voice-controls bar's own Hold/Resume
        // button (`agent-next-gen-voice-call-controls.tsx`'s identical
        // `text-lyra-status-critical-strong bg-lyra-status-critical-subtle`
        // pair) and `ParticipantChip`'s own per-participant on-hold tint,
        // rather than a third, inconsistent color for the same "on hold"
        // concept. Icon unchanged — this badge is icon-only (no text at
        // this size), so there's nothing to remove here the way
        // `OnHoldPill` below drops its own Pause icon.
        "pointer-events-none absolute right-0 top-0 z-10 h-[18px] w-[18px] min-w-0 border border-transparent bg-lyra-status-critical-strong p-0.5 text-lyra-fg-on-primary",
        className
      )}
    >
      <Pause className="h-full w-full" strokeWidth={2.25} aria-hidden="true" />
    </Badge>
  );
}

export function OnHoldPill({
  className,
  elapsedLabel,
}: {
  className?: string;
  /** "MM:SS" duration since this call was put on hold (`Thread.
   *  heldSinceTick`'s own doc comment has the full "why scoped to explicit
   *  holds only" reasoning) — appended after "On Hold" as "On Hold · MM:SS"
   *  per explicit request ("add a hold timer ... viewed from ... the
   *  assignment tile"). Omit to render the plain "On Hold" text exactly as
   *  before (the implicit "navigated away" on-hold case, which has no
   *  well-defined duration to show). */
  elapsedLabel?: string;
}) {
  return (
    <span
      aria-label={elapsedLabel ? `Call on hold ${elapsedLabel}` : "Call on hold"}
      className={cn(
        // Plain red text, no pill background — per the later move away
        // from pill-shaped consult/conference UI entirely ("all pill-
        // shaped elements in this whole flow"): matches the equally
        // pill-less red "On Hold · MM:SS" line already added under the
        // main call-duration clock in the voice-controls bar itself
        // (`agent-next-gen-voice-call-controls.tsx`), rather than this
        // being the one remaining pill-shaped holdout. Same
        // `text-lyra-status-critical-strong` token every other "on hold"
        // surface in the app already shares.
        "inline-flex shrink-0 items-center gap-1 lyra-body-xs-emphasis text-lyra-status-critical-strong",
        className
      )}
    >
      {/* Pause icon removed outright — per the same explicit follow-up
          ("remove this hold icon from the on hold component") — this is
          just its own text, no leading glyph. */}
      On Hold
      {elapsedLabel && <span className="tabular-nums">· {elapsedLabel}</span>}
    </span>
  );
}
