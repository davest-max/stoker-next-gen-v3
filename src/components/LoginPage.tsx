import { LoginCard } from "@nicecxone/lyra-ui";
import { HIDE_BRANDING_FOR_TESTING } from "@/components/agent-next-gen-shared-utils";

type Page = "agent-workspace" | "agent-with-desk" | "outbound" | "login";

interface LoginPageProps {
  onNavigate?: (page: Page) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-lyra-bg-surface-shell p-6 animate-in fade-in-0 duration-500">
      {/* Per explicit request: the modal header reads "Agent Workspace"
          (not lyra-ui's own default "Agent Next Gen" — that default is
          left untouched, since other consumers of `LoginCard` may still
          rely on it), and the idle-state launch button reads a plain
          "Launch" instead of repeating the app name a second time right
          below the header (`launchButtonLabel`, LoginCard's own new opt-in
          prop — see that prop's doc comment, login-card.tsx). The
          in-progress "Launching Agent Workspace…" status text is
          untouched. */}
      <LoginCard
        // Per `HIDE_BRANDING_FOR_TESTING`'s own doc comment — this also
        // changes the in-progress "Launching {appName}…" status text for
        // free, since `LoginCard` builds that string from this same prop.
        appName={HIDE_BRANDING_FOR_TESTING ? "Workspace" : "Agent Workspace"}
        // `appIcon` defaults to the shared smiley mark (`login-card.tsx`)
        // when omitted — passing a blank same-size placeholder instead
        // while the flag is on.
        appIcon={HIDE_BRANDING_FOR_TESTING ? <div className="h-5 w-5" aria-hidden="true" /> : undefined}
        launchButtonLabel="Launch"
        // Per explicit request ("remove Phase 1 ... remove the idea of
        // Phases"): this used to launch straight into the old "agent" page
        // (`AgentNextGenPage.tsx`), then later `"agent-advanced"`
        // (`AgentWorkspaceAdvancedPage.tsx`) once that became deleted
        // Phase 1's replacement — both are now gone, so this launches
        // straight into `"agent-with-desk"` (`AgentWorkspace2WithDeskPage.tsx`),
        // the one remaining Agent Workspace 2.0 page.
        onLaunch={() => onNavigate?.("agent-with-desk")}
      />
    </div>
  );
}
