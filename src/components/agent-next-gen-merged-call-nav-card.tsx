// MergedCallNavCard — the LeftNav's combined tile for two (or more)
// Interactions bridged via "Merge Calls" (see `Interaction.
// mergedInteractionIds`'s own doc comment, agent-next-gen-interaction-
// dashboard.tsx). Distinct from `InteractionNavItem`'s own existing
// `additionalParticipants`/`isConferenceCall` props — those describe
// internal colleagues merged into ONE customer's own thread (Consult/
// Conference); this card instead represents several fully separate,
// independently-dialed customer Interactions now sharing one call, each
// still its own record/thread/transcript. Kept local to this app rather
// than added to lyra-ui — a new, bespoke composite, not an incremental
// extension of an existing design-system component (see this repo's
// CLAUDE.md "new self-contained feature gets its own file" rule).
//
// Rendered in place of the normal per-interaction `InteractionNavCard` for
// every member of a merge group except the first (sort-order) one — see
// each page's own nav-render-loop grouping, just above its
// `sortAssignments(...).map(...)` call.
import * as React from "react";
import { ListItem, ActionIconButton } from "@nicecxone/lyra-ui";
import { Users, Split, PhoneOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MergedCallNavCardMember {
  id: string;
  name: string;
}

export interface MergedCallNavCardProps {
  /** Every Interaction in this merge group (2+), in display order. */
  members: MergedCallNavCardMember[];
  /** Whichever interaction the rest of the page is currently focused on —
   *  highlights that member's own row, and gives the whole card the same
   *  "active" elevated treatment `InteractionNavItem` gives a normal active
   *  card. */
  activeInteractionId: string | null;
  /** Clicking a member's name — the caller's own `switchActiveInteraction`,
   *  same mechanism a normal nav-card click already uses. */
  onSelectMember: (interactionId: string) => void;
  /** Splits this group back into fully independent calls. */
  onUnmerge: () => void;
  /** Ends every member's voice call at once — gated behind its own inline
   *  confirm (same "Drop {name}?" pattern `ParticipantChip`, agent-next-gen-
   *  voice-call-controls.tsx, already uses), since this is irreversible and
   *  affects more than whichever interaction is currently in view. */
  onEndAllCalls: () => void;
  className?: string;
}

export function MergedCallNavCard({
  members,
  activeInteractionId,
  onSelectMember,
  onUnmerge,
  onEndAllCalls,
  className,
}: MergedCallNavCardProps) {
  const isActive = members.some((m) => m.id === activeInteractionId);
  const [confirmingEndAll, setConfirmingEndAll] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-lyra-sm border bg-lyra-bg-surface-base text-left transition-colors",
        isActive ? "border-lyra-border-active shadow-md" : "border-lyra-border-subtle",
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-lyra-border-subtle px-3 py-2">
        <Users className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
        <span className="lyra-label text-lyra-fg-default">Merged Call</span>
      </div>
      <div className="flex flex-col">
        {members.map((member, index) => {
          const memberActive = member.id === activeInteractionId;
          return (
            <ListItem
              key={member.id}
              title={member.name}
              onClick={() => onSelectMember(member.id)}
              divider={index < members.length - 1}
              className={cn("px-3 py-2", memberActive && "bg-lyra-status-info-subtle")}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1 border-t border-lyra-border-subtle px-2 py-1.5">
        <ActionIconButton
          size="xs"
          title="Un-merge calls"
          aria-label="Un-merge calls"
          onClick={onUnmerge}
        >
          <Split className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ActionIconButton>
        {confirmingEndAll ? (
          <span className="flex items-center gap-1">
            <span className="lyra-body-xs text-lyra-fg-secondary whitespace-nowrap">End all?</span>
            <ActionIconButton
              size="xs"
              aria-label="Confirm end all calls"
              className="text-lyra-status-critical-strong"
              onClick={() => {
                onEndAllCalls();
                setConfirmingEndAll(false);
              }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            </ActionIconButton>
            <ActionIconButton size="xs" aria-label="Cancel" onClick={() => setConfirmingEndAll(false)}>
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </ActionIconButton>
          </span>
        ) : (
          <ActionIconButton
            size="xs"
            title="End all calls"
            aria-label="End all calls"
            className="text-lyra-status-critical-strong"
            onClick={() => setConfirmingEndAll(true)}
          >
            <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          </ActionIconButton>
        )}
      </div>
    </div>
  );
}
