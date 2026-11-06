import { PhoneForwarded, Sparkles } from "lucide-react";
import { Button } from "@nicecxone/lyra-ui";
import { TransferIcon } from "@/components/agent-next-gen-transcript";

/** Replaces the plain one-sentence Next Best Action for the "AI notices the
 *  conversation mentions another skill" demo scenario
 *  (`SKILL_SUGGESTION_ID`, AgentWorkspace2WithDeskPage.tsx) — per explicit
 *  request ("the transcript shows the conversation talking about getting
 *  help from another skill, AI could then offer to contact the skill to
 *  create a consult. Or to choose a cold transfer right from the next best
 *  action prompt"). Same `nextBestActionContent`/`nextBestActionBare`
 *  override mechanism (lyra-ui's `contact-overview.tsx`) the Marcus Webb
 *  Next Best Action card already established for a genuinely actionable
 *  decision instead of a static sentence — this one is deliberately much
 *  simpler than that card (no multi-option radio group, no simulated
 *  "AI working" spinner): two real actions, not a scripted conversation.
 *
 *  "Consult" fires straight into a real consult with `skillLabel` — no
 *  picker UI at all (`consultSkillRequest`, `VoiceCallControlsProps`'s own
 *  doc comment) — per a later explicit follow-up ("go straight to consult
 *  with skill"). "Cold transfer" still just opens the real Consult/
 *  Transfer picker (`setConferenceOpen(true)`, passed in by the caller):
 *  there's no equivalent "skip straight to it" entry point for a transfer
 *  yet (that action lives on a specific picker row's own icon), so this
 *  gets the agent to the right picker in one click rather than pretending
 *  to auto-complete the hand-off. `skillLabel` is shown in both buttons'
 *  own text so the suggestion stays concrete either way.
 *
 *  Per explicit follow-up ("set this consult or cold transfer choices and
 *  prompt apart better... easier to read quickly and be noticed more"):
 *  wrapped in the same tinted "Suggested Next Best Action" card
 *  `useCustomerAiSummaryPanelContent` already renders for its own inline
 *  next-best-action suggestion (agent-next-gen-ai-summary-panel.tsx) —
 *  `Sparkles` + label row over a `bg-lyra-status-info-subtle` box — rather
 *  than a bare `<p>` with no visual weight of its own. This card renders via
 *  `nextBestActionBare` (lyra-ui's `contact-overview.tsx`), which already
 *  strips the surrounding accordion's own accent header/icon specifically so
 *  this stays uncollapsed — losing THAT chrome is exactly why it needs its
 *  own here instead.
 */
export function SkillConsultTransferSuggestionCard({
  skillLabel,
  onConsult,
  onTransfer,
}: {
  skillLabel: string;
  onConsult: () => void;
  onTransfer: () => void;
}) {
  return (
    <div className="rounded-lyra-md border border-[color-mix(in_srgb,var(--lyra-color-status-info-strong)_25%,transparent)] bg-lyra-status-info-subtle p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-lyra-fg-secondary">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        <span className="lyra-body-sm-emphasis">Suggested Next Best Action</span>
      </div>
      <p className="lyra-body-md text-lyra-fg-default">
        This conversation mentions needing {skillLabel}&apos;s help. Want to loop them in?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onConsult}>
          {/* Same `TransferIcon` this app's own real "Consult" button
              already uses elsewhere (agent-next-gen-voice-call-controls.tsx)
              — per explicit request, this suggestion should read as the
              exact same action, not a different-looking one that happens
              to do the same thing. */}
          <TransferIcon />
          Consult with {skillLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onTransfer}>
          <PhoneForwarded className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Cold transfer to {skillLabel}
        </Button>
      </div>
    </div>
  );
}
