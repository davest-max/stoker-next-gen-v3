// Content rendered inside the record header's "Transfer History" accordion
// (CustomerContextOverview's `transferHistoryContent`, lyra-ui) for the
// Agent-to-Agent Transfer Handoff demo scenario
// (agent-next-gen-transfer-handoff-scenario.ts). Kept local to this app —
// the accordion CONTAINER itself is the reusable lyra-ui piece; this is the
// app-specific demo content that fills it, same split
// `nextBestActionContent` already established for Marcus Webb's own cards.
//
// Own `p-4` padding to match every other bespoke section body in
// `contact-overview.tsx` (`customerProfileBody`/the Autosummary body both
// use `flex flex-col gap-2.5 p-4`) — the shared accordion wrapper renders
// `transferHistoryContent` with no padding of its own.
import { cn } from "@/lib/utils";
import type { TransferHandoffPriorAgent } from "@/components/agent-next-gen-transfer-handoff-scenario";

export interface TransferHistoryCardProps {
  summary: string;
  priorAgents: TransferHandoffPriorAgent[];
}

export function TransferHistoryCard({ summary, priorAgents }: TransferHistoryCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="lyra-body-md text-lyra-fg-default">{summary}</p>
      <div className="flex flex-col gap-3">
        {priorAgents.map((agent, index) => (
          <div key={`${agent.agentName}-${index}`} className="flex items-start gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full lyra-label",
                agent.avatarClassName
              )}
              aria-hidden="true"
            >
              {agent.agentInitials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="lyra-body-sm-emphasis text-lyra-fg-default truncate">{agent.agentName}</span>
                <span className="lyra-body-xs text-lyra-fg-secondary shrink-0">{agent.durationLabel}</span>
              </div>
              <span className="lyra-body-sm text-lyra-fg-secondary">{agent.summary}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
