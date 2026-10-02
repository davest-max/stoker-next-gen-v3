// Agent-to-Agent Transfer Handoff — a pre-seeded, scripted demo scenario
// (same "press a key to launch it" convention Marcus Webb already
// established, see agent-next-gen-marcus-webb-scenario.ts) for demoing the
// RECEIVING side of a warm voice transfer: an agent opens this interaction
// already mid-call, having just had a live voice call bridged to them after
// it already passed through 2-3 other agents. The record header's own
// "Transfer History" card (CustomerContextOverview's `transferHistoryContent`,
// lyra-ui) is what catches the receiving agent up on who already handled the
// call and what happened on each leg, so the customer doesn't have to repeat
// themselves. Sourced from the FigJam board's own research notes ("handoff
// summary for any transfer, warm, cold, voice or digital"; "transfer history
// — who has talked to customer to this point").
//
// Scope, per explicit user confirmation (3 scoping questions, all answered
// with the recommended option): a pre-seeded scenario (not a live, build-
// your-own-chain feature off the existing Merge Calls/Consult machinery),
// surfaced in the record header area alongside the existing Autosummary/Next
// Best Action cards, and warm-transfer-only (a straightforward A→B→C chain —
// conference/consult-merge paths are out of scope here).
//
// Deliberately much simpler than Marcus Webb's own scenario file — no
// Copilot decision tree, no step tracker, no localStorage persistence: just
// one static `Interaction` to drop into the left nav. Triggered by "T" (not
// "L" — that key is Marcus Webb's own) in both page files.
import type { Interaction, Thread } from "@/components/agent-next-gen-interaction-dashboard";
import { CREATE_NEW_AGENTS } from "@nicecxone/lyra-ui/agents-data";
import { initialsFor } from "@/components/agent-next-gen-shared-utils";

export const TRANSFER_HANDOFF_ID = "transfer-handoff-scenario";
/** Deliberately NOT a `CREATE_NEW_CUSTOMERS` id — same "separate from the
 *  customer database" reasoning Marcus Webb's own scenario documents (see
 *  that file's own top-of-file comment). */
export const TRANSFER_HANDOFF_CUSTOMER_ID = "TH-DEMO-0001";
export const TRANSFER_HANDOFF_CUSTOMER_NAME = "Darius Cole";
/** This scenario only ever has the one channel — the voice call that was
 *  bridged to the current agent. */
export const TRANSFER_HANDOFF_CHANNEL_ID = "voice";

export interface TransferHandoffPriorAgent {
  agentName: string;
  agentInitials: string;
  avatarClassName: string;
  summary: string;
  durationLabel: string;
}

/** Real agent directory records (`CREATE_NEW_AGENTS`), not one-off invented
 *  names/colors — same avatar initials+color treatment every other agent
 *  reference in this app already uses. Oldest-first: index 0 is who Darius
 *  originally reached. */
const [FIRST_PRIOR_AGENT, SECOND_PRIOR_AGENT, THIRD_PRIOR_AGENT] = CREATE_NEW_AGENTS;

export const TRANSFER_HANDOFF_PRIOR_AGENTS: TransferHandoffPriorAgent[] = [
  {
    agentName: FIRST_PRIOR_AGENT.name,
    agentInitials: initialsFor(FIRST_PRIOR_AGENT.name),
    avatarClassName: FIRST_PRIOR_AGENT.avatarClassName,
    summary:
      "Took the initial call — Darius reported a billing charge he didn't recognize. Verified identity and pulled up the account.",
    durationLabel: "3m 40s",
  },
  {
    agentName: SECOND_PRIOR_AGENT.name,
    agentInitials: initialsFor(SECOND_PRIOR_AGENT.name),
    avatarClassName: SECOND_PRIOR_AGENT.avatarClassName,
    summary:
      "Billing specialist — confirmed the charge was a duplicate transaction and started a refund, but Darius also had a device malfunction to report.",
    durationLabel: "5m 12s",
  },
  {
    agentName: THIRD_PRIOR_AGENT.name,
    agentInitials: initialsFor(THIRD_PRIOR_AGENT.name),
    avatarClassName: THIRD_PRIOR_AGENT.avatarClassName,
    summary:
      "Technical support — walked through initial troubleshooting for the device issue, then transferred for deeper diagnostics.",
    durationLabel: "6m 55s",
  },
];

/** Shown at the top of the Transfer History card, above the per-agent rows —
 *  the "catch me up" summary a receiving agent needs in the first few
 *  seconds of the call. */
export const TRANSFER_HANDOFF_SUMMARY =
  "Refund for a duplicate charge is already in progress. Darius's device is still malfunctioning after a factory reset attempt — needs advanced troubleshooting.";

/** Builds this scenario's `Interaction` from scratch — called once, by the
 *  key-press trigger. `clockTick` is the same shared 1s counter every other
 *  interaction-creation handler stamps onto a fresh `Thread.startTick` with.
 *  No `startedFresh` (on the `Interaction` OR the `Thread`) — same reasoning
 *  as Marcus Webb's own builder: this represents an already-in-progress
 *  call arriving pre-populated (mid-transfer), not a blank-slate agent-
 *  initiated launch. Voice has no message-by-message transcript concept in
 *  this app (see `agent-next-gen-transcript.tsx`'s own "Coming Soon Voice
 *  Content" placeholder, rule #27 in CLAUDE.md), so this needs no
 *  `liveMessages` seeding at all — the Transfer History card is what carries
 *  this scenario's real content instead. */
export function buildTransferHandoffInteraction(clockTick: number): Interaction {
  const channel: Thread = {
    id: TRANSFER_HANDOFF_CHANNEL_ID,
    type: "voice",
    startTick: clockTick,
    contactId: `TH-CONTACT-${Date.now()}`,
    // Same field every other channel's own routed-in skill uses
    // (`Thread.preview`) — surfaces as the Session Details/record-header
    // "Skill" field. This call was bridged in already under Tech Support.
    preview: "Technical Support",
    // The customer originally reached in, not this agent — a transfer
    // doesn't change that fact, so this stays "inbound" the whole way
    // through the chain.
    direction: "inbound",
  };
  return {
    id: TRANSFER_HANDOFF_ID,
    interactionId: `TH-INTERACTION-${Date.now()}`,
    customerName: TRANSFER_HANDOFF_CUSTOMER_NAME,
    customerId: TRANSFER_HANDOFF_CUSTOMER_ID,
    threads: [channel],
    currentThreadId: channel.id,
    threadStatuses: { [TRANSFER_HANDOFF_CHANNEL_ID]: "Open" },
    transferHistory: TRANSFER_HANDOFF_PRIOR_AGENTS,
  };
}
