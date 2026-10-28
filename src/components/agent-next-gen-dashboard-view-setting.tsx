// The Settings page's "Dashboard View" control — lets an agent choose
// which card renders in the home dashboard's own "recent activity" slot:
// "My Emails" (an email-heavy-workload card, `EmailFocusCard`) or "Contact
// History" (`ContactHistoryCard`, what the agent just finished) — per
// explicit request ("give our test user the option for a 'My Email' view
// or 'Contact History' view in the dashboard").
//
// Same shape as `VoiceControlsPositionSetting` right above it in Settings —
// a CONTROLLED component (`value`/`onValueChange`, no local state of its
// own), for the identical reason that component's own doc comment gives:
// the caller (the page) is also the thing deciding which card to actually
// render, so a second, independent copy of this value here would risk
// silently drifting out of sync with it.
import { RadioButtonGroup } from "@nicecxone/lyra-ui";
import type { DashboardView } from "@/components/agent-next-gen-dashboard-view";

const DASHBOARD_VIEW_OPTIONS: { value: DashboardView; label: string }[] = [
  { value: "myEmails", label: "My Emails" },
  { value: "contactHistory", label: "Contact History" },
];

export function DashboardViewSetting({
  value,
  onValueChange,
}: {
  value: DashboardView;
  onValueChange: (next: DashboardView) => void;
}) {
  return (
    <div className="max-w-[480px] rounded-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-4">
      <h3 className="lyra-label-md text-lyra-fg-primary">Dashboard View</h3>
      <p className="mt-1 lyra-body-sm text-lyra-fg-secondary">
        Choose which card appears on your home dashboard — your emails, or your recent contact
        history.
      </p>
      <RadioButtonGroup
        className="mt-3"
        options={DASHBOARD_VIEW_OPTIONS}
        value={value}
        onValueChange={(next: string) => onValueChange(next as DashboardView)}
      />
    </div>
  );
}
