// VoiceCallControls — the fixed-to-the-bottom-of-the-content-area call
// toolbar for an active VOICE channel (Hold/Mute/Mask/Record/Keypad/Add
// video/Hang Up), per explicit request/reference screenshot. Sits in
// the exact spot `InteractionComposer` occupies for a chat channel — a
// `shrink-0` sibling directly below `InteractionTranscript`, in each of the
// three page components' own "voice has no composer" branch (see that
// branch's own doc comment, AgentNextGenPage.tsx/AgentWorkspace2WithDeskPage
// .tsx/AgentWorkspaceAdvancedPage.tsx) — so a live voice call gets this bar
// in that exact slot instead of nothing.
//
// Every button here except Hang Up is purely decorative/local-state (Hold/
// Mute/Mask/Record/Add video each just toggle their own icon and fire a
// toast; Keypad opens a small popover dialpad) — there's no real telephony
// backing any of this in the prototype, same "fake it with a toast"
// convention every other placeholder control in this app already follows
// (Send Transcript/Download Transcript/Translate Messages, etc.). Hang Up
// is the one exception: it's wired to a real `onHangUp` callback (the
// caller closes this channel, same as picking "Closed" from the status
// popover) since ending the call is the one action here an agent actually
// depends on to move on to logging an outcome.
//
// This bar used to carry THREE renderings — a WIDE two-row centered card, a
// COMPACT icon-only row, and a `stretch` single-row variant of the wide
// buttons for Phase 1/Phase 2 — auto-toggling between wide/compact via a
// `ResizeObserver` self-measuring this bar's own rendered width against a
// 768px breakpoint (a pattern `InteractionTranscript`'s own
// `transcriptNarrow`/`transcriptBubbleFullWidth`, agent-next-gen-
// transcript.tsx, and `ScheduleToolbar`'s own `containerRef`/`isWide`/
// `isCompact`, SchedulePanel.tsx, also use). Per an explicit bug report
// ("opened the details panel with the left nav closed, opened the left
// nav, then closing the details panel again didn't resize the bar back")
// and the explicit follow-up fix request that replaced trying to chase that
// bug further ("just take the existing compact version — stretch it the
// full width of the container and remove media queries"): all of that
// responsive machinery — the `ResizeObserver`/`isCompact` state, the wide
// two-row card, and the `stretch` single-row card — is gone. This bar now
// always renders what used to be the COMPACT (icon-only) JSX, unconditionally,
// stretched to fill whatever width its container gives it (`w-full` on the
// card below AND on the outer full-bleed wrapper — see that wrapper's own
// doc comment for why both levels need it explicitly rather than leaning on
// ambient flex stretch — no `max-w`/`mx-auto` cap) instead of only kicking
// in below a measured breakpoint. Below, every main control still drops its
// visible label for a hover/focus `Tooltip` (`CompactCallControlButton`),
// the timer still shows its "MM:SS" digits next to a Clock icon, and
// Volume/Transcript still trail in their own leading/trailing flex slots —
// none of that content changed, only the "which rendering, and how wide"
// logic around it. `stretch` stays as an accepted prop (default `false`)
// purely so Phase 1/Phase 2's existing call sites don't need to change
// their JSX — it no longer affects anything rendered here.
//
// Per a later explicit follow-up request/reference screenshot ("make the
// voice controls larger and label the buttons again"), every main control
// (Hold/Mask/Record/Keypad/Transcript/Volume/Mute/Add video) switched back
// from that icon-only `CompactCallControlButton` treatment to a labeled
// icon-over-text button instead — bigger tap target, and the label is now
// always-visible text again rather than only surfacing on hover/focus via
// `Tooltip`. This ISN'T a return to the old three-way wide/compact/stretch
// responsive split this file just spent the paragraph above removing —
// there's still exactly one rendering, it's just the LABELED one now
// instead of the icon-only one, still unconditionally stretched to its
// container's width. `WideCallControlButton` (below) — defined back when
// this file had that old wide rendering, but unused since it was removed —
// is what got reactivated for this, reworked to compose as a `Tooltip`/
// `Popover` trigger the same way `CompactCallControlButton` already does
// (see its own doc comment for why that requires `forwardRef`+`...rest`
// rather than a plain named-prop function). `CompactCallControlButton`
// itself is left defined but unused below — nothing left in this file
// calls it now that every control uses the labeled button instead — kept
// rather than deleted in case a genuinely narrow/compact rendering is ever
// wanted again later. Hang Up is the one control excluded from this
// change, per explicit request ("keep the End Call button filled red") —
// it stays the same solid-red `Button` it already was (see that render
// site's own doc comment), just bumped from `size="default"` to `size="lg"`
// so it still reads as proportionate next to the now-taller labeled
// buttons beside it.
//
// Per a later explicit follow-up request/reference screenshot ("make the
// end call button the same height as the mute and add video buttons and add
// the customer avatar. Add the name / number/email above the timer"): the
// trailing dark cluster (Mute/Add video/End Call) switched from
// `items-center` to `items-stretch` and End Call's fixed `size="lg"` height
// (h-9) got overridden to `h-auto`, so it now stretches to match whichever
// of Mute/Add video is tallest (their own `WideCallControlButton` shape is
// already `h-auto`, sized by content) instead of sitting short and centered
// next to them — no hardcoded pixel height to keep in sync if either of
// those buttons' own height ever changes. Separately, the leading slot
// gained an optional avatar chip + identity line (`customerLabel`/
// `customerInitials`, see their own doc comments on `VoiceCallControlsProps`
// below) stacked above the existing elapsed timer, per the reference
// screenshot's small purple circle + phone number/name sitting above the
// call duration. The avatar's purple background reuses this app's own
// existing "Voice channel = purple" accent convention (see
// `CHANNEL_TYPE_TAG_VARIANT`/`CHANNEL_TYPE_ICON_COLOR_CLASS`,
// agent-next-gen-contact-history.tsx and channel-row.tsx, both already
// purple for Voice) rather than inventing a new color. Its glyph is a
// generic `Plus` fallback (this design system's `interaction-nav-item.tsx`
// already falls back to a generic icon — there just a person outline —
// when there's no real contact match; `Plus` reads closer to the reference
// screenshot's unmatched-quickdial-number case, see `Interaction.id`'s own
// `quickdial:<number>` doc comment) shown in white — an explicit follow-up
// clarified this should be white, not the icon's original black/dark
// tone — with real initials (`customerInitials`) taking over instead once a
// caller has a genuine contact match, same "initials over generic icon
// once known" split that avatar convention already uses.
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Button,
  Popover,
  Slider,
  Spinner,
  Tooltip,
  TabList,
  Tab,
  ListItem,
  ActionIconButton,
  Tag,
} from "@nicecxone/lyra-ui";
import { CREATE_NEW_AGENTS } from "@nicecxone/lyra-ui/agents-data";
import {
  Pause,
  Play,
  Mic,
  MicOff,
  AudioLines,
  AudioLinesOff,
  Circle,
  Grid3x3,
  Video,
  VideoOff,
  PhoneOff,
  Clock,
  Volume2,
  VolumeX,
  FileText,
  User,
  Check,
  X,
  Phone,
  MessageSquare,
  Headset,
  ChevronRight,
  Users,
  Split,
  Merge,
} from "lucide-react";
import { formatElapsedTime, initialsFor } from "@/components/agent-next-gen-shared-utils";
import { TransferIcon } from "@/components/agent-next-gen-transcript";

/** One column: icon on top, visible label underneath — the main control
 *  shape this bar now uses everywhere (see this file's own top doc comment
 *  for the "why now again" history). Was originally used only by a since-
 *  removed wide rendering, unused for a while after that (only tooltip-only
 *  `CompactCallControlButton` remained), then reactivated and reworked
 *  here per a later explicit follow-up request.
 *
 *  Built with `React.forwardRef` and a `...rest` spread — same reasoning as
 *  `CompactCallControlButton`'s own doc comment just below gives for why
 *  that one needs it: this button has to compose correctly as either a
 *  `Popover`'s trigger child (Keypad/Volume both clone their own
 *  click/ref/aria-* props onto their immediate child via Radix's
 *  `asChild`/`Slot`) or a plain button with native attributes
 *  (`disabled` on Record) — a fixed named-prop list would silently drop
 *  whichever of those it didn't explicitly declare. `label` itself no
 *  longer needs to reach a `Tooltip` the way it used to (that's now this
 *  button's own always-visible text, not hover-only content), so unlike
 *  `CompactCallControlButton`, most call sites below no longer wrap this in
 *  one at all — see each call site's own comment for the one exception
 *  (Record, which still has genuinely EXTRA hover content beyond its
 *  label: why it's disabled). */
const WideCallControlButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    label: string;
    /** Tints icon+label the same blue "selected" treatment lyra-ui's own
     *  active states already use, once this control is toggled on (Hold/
     *  Mute/Mask/Record/Add video). Omit/`false` for the plain gray look. */
    active?: boolean;
    /** Hang Up doesn't use this component at all (see this file's own top
     *  doc comment for why it's excluded) — kept for parity with
     *  `CompactCallControlButton`'s own identical prop in case a future
     *  critical-styled control besides Hang Up ever needs this shape. */
    critical?: boolean;
    /** Same darker-at-rest treatment as `CompactCallControlButton`'s own
     *  `strong` prop — Mute/Add video pass this, matching the reference
     *  screenshot's visibly darker icons for that pair. */
    strong?: boolean;
    /** Same `ghost`/`outline` swap as `CompactCallControlButton`'s own
     *  `variant` prop — Mute/Add video pass `"outline"`, every other
     *  control keeps the default plain `ghost` look. */
    variant?: "ghost" | "outline";
  }
>(({ icon, label, active, critical, strong, variant = "ghost", className, ...rest }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        // Per explicit follow-up request/reference screenshot ("make the
        // voice controls larger"): `h-auto w-20` (unchanged from this
        // component's original wide-rendering sizing) plus `gap-1.5`/
        // `py-2` (was `gap-1`/`py-1.5`) for a bit more breathing room
        // around the now-larger icon (`h-5 w-5` at each call site below,
        // was `h-4 w-4` to match `CompactCallControlButton`'s icon-only
        // sizing) and the visible label text beneath it.
        "h-auto w-20 shrink-0 flex-col gap-1.5 rounded-lyra-sm px-1 py-2",
        critical
          ? "text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
          : active
          ? "text-lyra-fg-active-strong bg-lyra-bg-active-subtle hover:text-lyra-fg-active-strong"
          : strong
          ? "text-lyra-fg-default hover:text-lyra-fg-default"
          : "text-lyra-fg-secondary hover:text-lyra-fg-default",
        className
      )}
      {...rest}
    >
      {icon}
      <span className="lyra-body-xs w-full truncate text-center">{label}</span>
    </Button>
  );
});
WideCallControlButton.displayName = "WideCallControlButton";

/** Plain 40×40px icon-only button — the icon-only
 *  rendering of Hold/Mask/Record/Keypad/Transcript/Volume/Mute/Add video/
 *  End Call once this bar's own measured width drops below the relevant
 *  breakpoint (`controlsCompact`/`controlsIconOnly`, this file's own top
 *  doc comment). `label` is still required on most call sites, it's just
 *  surfaced via a `Tooltip` at the call site instead of rendered directly
 *  here (Keypad's call site wraps `Tooltip` around the whole `Popover`
 *  instead, per that render site's own comment, since Keypad also needs to
 *  be a `Popover` trigger).
 *
 *  Was briefly UNUSED (every call site had switched to the labeled
 *  `WideCallControlButton` per an earlier follow-up request) — reactivated
 *  per the later request that added the two width-driven breakpoints
 *  above, at a bumped 40px box (was 32px/`h-8 w-8`) matching that
 *  request's own explicit sizing ask.
 *
 *  Built with `React.forwardRef` and a `...rest` spread (rather than a
 *  fixed named-prop list) specifically so it composes correctly as either a
 *  `Tooltip`'s or a `Popover`'s trigger child: both clone extra props
 *  (event handlers, a `ref` for position measurement, `aria-*` state) onto
 *  their immediate child via Radix's `asChild`/`Slot` mechanism, which only
 *  reaches the real DOM `<button>` if this component actually forwards a
 *  `ref` and spreads through whatever it's handed — a plain, non-forwardRef
 *  function component only works for `onClick` because that name happens
 *  to already be a named prop; a hover-only prop like `onPointerEnter`
 *  (which `Tooltip` needs) would be silently dropped the same way a `ref`
 *  would. */
const CompactCallControlButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    active?: boolean;
    critical?: boolean;
    /**
     * Per explicit request ("make the mute and video icons darker"): swaps
     * this button's own DEFAULT (non-active, non-critical) resting color
     * from `fg-secondary` (60% opacity — this bar's usual resting-state
     * gray, still used by every other control here) to `fg-default` (80%
     * opacity) — the SAME token every one of these buttons already promotes
     * to on hover/focus (see the plain `else` branch below), just applied
     * at rest instead of only on interaction. Both are existing lyra-ui
     * neutral-text tiers (see lyra-tokens.css), not one-off colors, so this
     * stays inside the request's own "keep the same styling for lyra-ui"
     * instruction. Ignored once `active`/`critical` is true — those already
     * render in their own (even stronger) blue/red, so there's nothing left
     * for this to darken further. Mute and Video are the two call sites
     * that pass this below; every other control keeps the plain resting
     * `secondary` gray unchanged.
     */
    strong?: boolean;
    /**
     * Per explicit request ("make the mute / video buttons outline icon
     * buttons"): lets Mute/Video opt into `Button`'s real `"outline"`
     * variant (a bordered, `bg-lyra-bg-control` surface) instead of this
     * component's own default `"ghost"` (transparent until hover) — every
     * other control here (Hold/Mask/Record/Keypad/Transcript) omits this
     * and keeps the existing plain `ghost` look unchanged. The `active`/
     * `critical`/`strong` tint classes above are unaffected either way —
     * they already override `outline`'s own default `bg`/`text` tokens via
     * `cn()`'s tailwind-merge the same way they already override `ghost`'s.
     */
    variant?: "ghost" | "outline";
  }
>(({ icon, active, critical, strong, variant = "ghost", className, ...rest }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      aria-pressed={critical ? undefined : active}
      className={cn(
        // 40px (`Button`'s own "icon-xl" size token) — per explicit
        // request ("...icon only buttons and 40px").
        "h-10 w-10 shrink-0 rounded-lyra-sm",
        critical
          ? "text-lyra-status-critical-strong hover:bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong active:bg-lyra-status-critical-medium"
          : active
          ? "text-lyra-fg-active-strong bg-lyra-bg-active-subtle hover:text-lyra-fg-active-strong"
          : strong
          ? "text-lyra-fg-default hover:text-lyra-fg-default"
          : "text-lyra-fg-secondary hover:text-lyra-fg-default",
        className
      )}
      {...rest}
    >
      {icon}
    </Button>
  );
});
CompactCallControlButton.displayName = "CompactCallControlButton";

/** Plain 3x4 dialpad — Keypad's own popover body, shared by both the wide
 *  and compact renderings. Each digit press just appends to this popover's
 *  own local display (no real DTMF tone/signal to send in this prototype);
 *  `Clear` resets it. Closes on outside click/Escape like any other plain,
 *  uncontrolled `Popover`. */
function DialPad() {
  const [digits, setDigits] = useState("");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  return (
    <div className="flex flex-col gap-3 p-3 w-[220px]">
      <div className="lyra-body-md-emphasis text-lyra-fg-default text-center min-h-[24px] tracking-wider">
        {digits || <span className="text-lyra-fg-secondary">Enter digits</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-10 w-full lyra-body-md-emphasis"
            onClick={() => setDigits((d) => d + key)}
          >
            {key}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDigits("")} disabled={!digits}>
        Clear
      </Button>
    </div>
  );
}

/** A row `ConferencePicker` (just below) lists under any of its three tabs
 *  — an avatar (initials over `CREATE_NEW_AGENTS`' own real per-agent
 *  `avatarClassName`, or a flat neutral tint for a skill queue, which has
 *  no such per-record color), a name, and a subtitle (an agent's real
 *  `role`, or a fixed "Skill queue" label). Deliberately NOT the full
 *  `CreateNewOutboundContact` shape `create-new.tsx`'s own Outbound picker
 *  uses — this popover has no channel/phone/status logic to drive, just
 *  "who am I looking at, who do I tap." */
interface ConferencePickerPerson {
  id: string;
  name: string;
  subtitle: string;
  avatarClassName: string;
}

/** "Favorites" — per explicit request ("no real multi-party state"), this
 *  isn't a real favorited-contacts list (there's nowhere in this app that
 *  lets an agent actually favorite/unfavorite a colleague for THIS
 *  picker specifically — `create-new.tsx`'s own Favorites group is a
 *  separate, unrelated piece of state for the Outbound flow). Just the
 *  first few real `CREATE_NEW_AGENTS` records, standing in for "people
 *  this agent conferences in often" — same "real data, decorative
 *  wiring" convention `EMAIL_FOCUS_*` (agent-next-gen-email-focus-card.tsx)
 *  already follows for its own hand-picked mock content. */
const CONFERENCE_FAVORITES: ConferencePickerPerson[] = CREATE_NEW_AGENTS.slice(0, 4).map((agent) => ({
  id: agent.id,
  name: agent.name,
  subtitle: agent.role,
  avatarClassName: agent.avatarClassName,
}));
/** "Agents" — a wider slice of the same real roster, per explicit request
 *  ("same as the reference and our own 'Add Participant' icon"), not a
 *  disjoint invented list. Capped at 8 (not all 100) — this is a small
 *  popover, not `create-new.tsx`'s own full paginated Agents group. */
const CONFERENCE_AGENTS: ConferencePickerPerson[] = CREATE_NEW_AGENTS.slice(0, 8).map((agent) => ({
  id: agent.id,
  name: agent.name,
  subtitle: agent.role,
  avatarClassName: agent.avatarClassName,
}));
/** "Skills" — hand-authored, matching the same skill-name vocabulary
 *  already used elsewhere in this app (`EMAIL_FOCUS_*`'s own `skillName`
 *  values, `ContactHistoryEntry.skillName`) rather than a third,
 *  disconnected pool — a skill queue has no individual "agent" behind it
 *  to add by name, so `subtitle` is just a fixed "Skill queue" label and
 *  `avatarClassName` is one flat neutral tint for all of them (no
 *  per-record color the way a real agent roster has). */
const CONFERENCE_SKILLS: ConferencePickerPerson[] = [
  "General Support",
  "Billing",
  "Technical Support",
  "Sales",
  "Escalations",
].map((name) => ({
  id: `skill-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  subtitle: "Skill queue",
  avatarClassName: "bg-lyra-bg-surface-canvas text-lyra-fg-secondary",
}));

type ConferenceTabKey = "favorites" | "agents" | "skills";

/** Conference's own popover body — Favorites/Agents/Skills tabs over a row
 *  list built from the reference app's own `AgentRow`/`SkillRow`
 *  (`ConsultTransferPopover.tsx`): a `ListItem static` (no whole-row click —
 *  matches that reference exactly, right down to reusing its component)
 *  with a leading avatar, name/subtitle, and a trailing cluster of real
 *  `ActionIconButton`s — Call, Chat, Transfer — per a later explicit
 *  follow-up request ("hover in the conference popup shows call or chat
 *  icons, transfer icons ... match the stoker-agent-test conference popup
 *  flow and behavior"). Skills rows drop Chat (no individual person to
 *  message), same as `SkillRow`'s own Call/Transfer-only trailing cluster.
 *  Only Call does anything real here — it's this popover's one actual job
 *  (`onSelect`, starting the consult-then-merge flow below) — Chat/Transfer
 *  are decorative toasts, matching this app's own standing "not wired up
 *  yet" convention for every other not-yet-real action (including this
 *  app's OWN existing Transfer buttons elsewhere, agent-next-gen-
 *  transcript.tsx/channel-row.tsx) rather than inventing real behavior for
 *  either one here. `overflowMenu` on `TabList` per this repo's own
 *  standing rule (CONTRIBUTING.md — every `TabList` gets it, no
 *  exceptions) — `w-[440px]` (was `w-72`/288px, briefly `w-96`/384px) per
 *  an earlier explicit follow-up request ("make the conference popup wide
 *  enough to show all three tabs") is what actually keeps it from needing
 *  that overflow behavior in practice. `TabList`'s "N More" collapse isn't
 *  a content-fit measurement at all — it's a flat `wrapRef` width ≤400px
 *  check (`tabs.tsx`'s own `TAB_LIST_COMPACT_COLLAPSE_WIDTH`/`isNarrow`),
 *  so `w-96` (384px) still collapsed despite comfortably fitting all three
 *  labels — it was simply under the 400px line, full stop. `w-[440px]`
 *  matches the reference app's own identical fix for its Conference
 *  popover once ITS tab count changed (`LiveVoiceCallBar.tsx`'s
 *  `popoverClassName="z-[9999] w-[440px]"` — "wider than the default
 *  360px... that row still doesn't fit the default width"), not a value
 *  picked fresh here. */
function ConferencePicker({
  onSelect,
}: {
  onSelect: (person: ConferencePickerPerson) => void;
}) {
  const [tab, setTab] = useState<ConferenceTabKey>("favorites");
  const isSkillsTab = tab === "skills";
  const people =
    tab === "favorites" ? CONFERENCE_FAVORITES : tab === "agents" ? CONFERENCE_AGENTS : CONFERENCE_SKILLS;
  return (
    <div className="flex flex-col w-[440px]">
      <TabList overflowMenu className="px-2 pt-2">
        <Tab active={tab === "favorites"} onClick={() => setTab("favorites")}>Favorites</Tab>
        <Tab active={tab === "agents"} onClick={() => setTab("agents")}>Agents</Tab>
        <Tab active={tab === "skills"} onClick={() => setTab("skills")}>Skills</Tab>
      </TabList>
      {/* Dial Pad — per explicit request/reference screenshot: its own
          full-width row directly under the tabs, outside the scrollable
          Favorites/Agents/Skills list below (so it never scrolls away) and
          separated from it by `ListItem`'s own bottom divider (`divider`
          left at its default `true` here — every row inside the list below
          explicitly passes `divider={false}` instead, since those read as
          one continuous block). No `onClick` at all (was a "not wired up
          yet" toast) — per explicit follow-up request ("remove all of the
          notifications that trigger upon any action"), this and every
          other decorative control in this bar now renders with no toast
          AND no fake handler standing in for one; there's no real "dial an
          arbitrary number to consult" flow in this prototype yet, and
          nothing here pretends otherwise anymore either. */}
      <ListItem
        leading={<Grid3x3 className="h-5 w-5 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />}
        title="Dial Pad"
        trailing={<ChevronRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />}
      />
      <div className="flex flex-col max-h-64 overflow-y-auto py-1">
        {people.map((person) => (
          <ListItem
            key={person.id}
            static
            divider={false}
            className="px-3 py-2"
            leading={
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full lyra-body-sm-emphasis",
                  person.avatarClassName
                )}
                aria-hidden="true"
              >
                {initialsFor(person.name)}
              </div>
            }
            title={person.name}
            subtitle={person.subtitle}
            trailing={
              <div className="flex items-center gap-0.5">
                <ActionIconButton size="sm" title={`Consult with ${person.name}`} onClick={() => onSelect(person)}>
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                </ActionIconButton>
                {!isSkillsTab && (
                  <ActionIconButton size="sm" title={`Chat with ${person.name}`}>
                    <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                  </ActionIconButton>
                )}
                <ActionIconButton size="sm" title={`Transfer to ${person.name}`}>
                  <TransferIcon />
                </ActionIconButton>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

/** A colleague actually merged into this call — ported from the reference
 *  app's identical `CallColleague` (`LiveVoiceCallBar.tsx`), narrowed to
 *  just `id`/`name`: this bar has no real per-participant hold/transfer
 *  (still one shared Hold button for the whole call — see this file's own
 *  top doc comment on why every control here stays decorative/whole-call),
 *  so `isOnHold`/`sourceSkillName`/`isCustomer` weren't ported — nothing
 *  here would ever read them. */
export interface CallColleague {
  id: string;
  name: string;
  /** Row-level hold for JUST this one colleague — ported from the
   *  reference's identical `CallColleague.isOnHold`/`onToggleColleagueHold`.
   *  Independent of the primary customer's own hold (`onHold`/`setOnHold`
   *  below) and of every OTHER colleague's — each participant pill in the
   *  strip (`ParticipantChip`, below) holds/resumes only the one person it
   *  represents. The bar's own main Hold button still holds/resumes
   *  EVERYONE at once (see `handleHoldClick` below) — same "one bulk
   *  action, plus independent per-person overrides afterward" relationship
   *  the reference's `toggleVoiceCallHold`/`togglePrimaryOnlyHold`/
   *  `toggleVoiceCallColleagueHold` establish. */
  isOnHold: boolean;
}

/** A private, pre-merge consult in progress — ported from the reference
 *  app's identical `VoiceCallConsult`. `undefined` means "not consulting
 *  right now," same convention. Narrowed the same way `CallColleague` is
 *  above (no `sourceSkillName`/`isCustomer`/`mergeFromAssignmentId` — this
 *  bar has no skill-routed-to-a-specific-agent distinction, no customer
 *  tab in `ConferencePicker`, and no separate "Active Calls" merge source;
 *  every consult here starts the same way, from the same three tabs). */
interface VoiceCallConsult {
  id: string;
  name: string;
  /** Whether the CONSULT leg itself (not the primary customer) is
   *  currently the one on hold — per explicit follow-up request ("when
   *  consulting with another person need to provide a way to swap and hold
   *  between the consult and the customer"). Always `false` the moment a
   *  consult starts (the consult is "live"/being talked to; the customer
   *  is the one auto-held — see `ConferencePicker`'s own `onSelect`), and
   *  flips in lockstep with the customer's own `onHold` every time either
   *  party's Hold button is pressed (`handleSwapConsult`) — exactly one of
   *  the two is ever held at a time during a consult, never both/neither
   *  (this is what a design critique flagged as "either consult or live
   *  voice call can be active at once, so one or the other automatically
   *  goes on hold... if it's not merged yet" — once merged, each colleague
   *  instead holds independently, see `CallColleague.isOnHold`'s own doc
   *  comment). */
  isOnHold: boolean;
}

/** One of the two toggleable parties shown in `ConsultBanner` (the primary
 *  customer or the consult target) — per explicit follow-up request ("dim
 *  the held participant's avatar in swap. Make the swap icon simply a
 *  hold icon button"), replacing the single combined "Swap" control with
 *  one hold/resume button PER party, each showing that party's own current
 *  state directly (dimmed avatar + red Resume icon when held) instead of
 *  making the agent read a sentence to find out who's live. Reuses
 *  `ParticipantChip`'s own exact hold-button styling (icon size/color,
 *  Play/Pause swap) for visual consistency with the post-merge roster —
 *  this is the same action, just before a colleague officially exists yet. */
function ConsultBannerParty({
  label,
  onHold,
  onToggleHold,
}: {
  label: string;
  onHold: boolean;
  onToggleHold: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lyra-bg-surface-container-subtle lyra-body-xs-emphasis text-lyra-fg-secondary transition-opacity",
          onHold && "opacity-40"
        )}
        aria-hidden="true"
      >
        {initialsFor(label)}
      </span>
      <span className={cn("lyra-body-sm truncate", onHold ? "text-lyra-fg-secondary" : "text-lyra-fg-default")}>
        {label}
      </span>
      <button
        type="button"
        title={onHold ? `Resume ${label}` : `Hold ${label}`}
        aria-label={onHold ? `Resume ${label}` : `Hold ${label}`}
        onClick={onToggleHold}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-lyra-state-hover",
          onHold ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary"
        )}
      >
        {onHold ? <Play className="h-3.5 w-3.5" strokeWidth={2} /> : <Pause className="h-3.5 w-3.5" strokeWidth={2} />}
      </button>
    </div>
  );
}

/** Shown in place of this bar's normal content while a consult is in
 *  progress — ported from the reference app's identical `ConsultBanner`,
 *  then extended per explicit follow-up request ("provide a way to swap
 *  and hold between the consult and the customer"), then revised once
 *  more per a design critique + explicit follow-up ("dim the held
 *  participant's avatar in swap. Make the swap icon simply a hold icon
 *  button"): no more single combined "Swap" control or descriptive
 *  sentence to read — both parties render side by side via
 *  `ConsultBannerParty`, each with its own hold/resume button and its own
 *  dimmed-when-held avatar, so which leg is currently live is a GLANCE,
 *  not a read. Both buttons call the exact same `onToggleHold` — pressing
 *  either one is the identical action (there are only ever two states
 *  while not yet merged — see `VoiceCallConsult.isOnHold`'s own doc
 *  comment), so there's no need for two separate handlers. */
function ConsultBanner({
  customerLabel,
  customerOnHold,
  consultName,
  consultOnHold,
  onToggleHold,
  onCancel,
  onMerge,
}: {
  customerLabel: string;
  customerOnHold: boolean;
  consultName: string;
  /** See `VoiceCallConsult.isOnHold`'s own doc comment. */
  consultOnHold: boolean;
  onToggleHold: () => void;
  onCancel: () => void;
  onMerge: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base px-3 py-2">
      <ConsultBannerParty label={customerLabel} onHold={customerOnHold} onToggleHold={onToggleHold} />
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-lyra-border-subtle" />
      <ConsultBannerParty label={consultName} onHold={consultOnHold} onToggleHold={onToggleHold} />
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel consult</Button>
        <Button variant="default" size="sm" onClick={onMerge}>Merge call</Button>
      </div>
    </div>
  );
}

/** One merged colleague's pill in the participant strip (rendered once
 *  `colleagues.length > 0`) — ported from the reference app's
 *  `ParticipantChip`, narrowed to just the one action this bar actually
 *  supports per colleague: drop them from the call (no per-participant
 *  hold/transfer — see `CallColleague`'s own doc comment above for why).
 *  Same inline "Drop {name}?" Check/X confirm step the reference uses
 *  (`confirming` below) rather than dropping on a single click, and the
 *  same "stays armed until explicitly confirmed or cancelled" behavior —
 *  nothing else (moving the pointer away) dismisses it, so a stray brush
 *  of the mouse can't silently discard a drop the agent didn't mean to
 *  make yet. */
/** One pill in the participant strip — ported from the reference app's
 *  identical `ParticipantChip` (`LiveVoiceCallBar.tsx`), same three-way
 *  reuse: "You" gets none of the three optional actions below (an agent
 *  can't hold, transfer, or hang up on themselves), the primary customer
 *  gets `onToggleHold` only (ending their leg is the bar's own main Hang
 *  Up button's job, transferring/dropping THEM isn't a real concept — the
 *  whole call just ends), and a colleague gets all three. Every action
 *  here is always visible when its handler is passed (no hover-to-reveal —
 *  matches the reference's own later-explicit-follow-up final state, not
 *  its earlier hover/click-to-pin version). `isInternalAgent` swaps the
 *  avatar from initials to a headset glyph — every colleague this bar can
 *  ever produce comes from `ConferencePicker`'s Favorites/Agents/Skills
 *  tabs (never a real customer merged in — this app's picker has no
 *  Customers tab the way the reference's does), so every colleague pill
 *  passes this `true`; only the primary customer pill (never "internal")
 *  shows real initials. */
function ParticipantChip({
  label,
  isSelf,
  isInternalAgent,
  isOnHold,
  onToggleHold,
  onTransfer,
  onHangUp,
  onSelect,
  selected,
  kind,
}: {
  label: string;
  isSelf?: boolean;
  isInternalAgent?: boolean;
  isOnHold?: boolean;
  /** Presence alone gates the Hold/Resume icon — omitted for "You". */
  onToggleHold?: () => void;
  /** Presence alone gates the Transfer icon — only ever passed for a
   *  colleague. Decorative (see this file's own "not wired up yet"
   *  convention) rather than a real hand-off, same as every other Transfer
   *  control in this app. */
  onTransfer?: () => void;
  /** Presence alone gates the Hang Up (drop) icon — only ever passed for a
   *  colleague. Routed through the same inline "Drop {name}?" Check/X
   *  confirm this pill already had before gaining Hold/Transfer. */
  onHangUp?: () => void;
  /** Makes the avatar+label area itself clickable — used only by a merged-
   *  call roster pill (`VoiceCallControls`'s own `mergedInteractions`
   *  rendering) to switch which bridged customer is focused
   *  (`switchActiveInteraction` at the call site). Omitted everywhere else
   *  — a plain colleague/"You" pill isn't a separate, selectable record. */
  onSelect?: () => void;
  /** Highlights this pill as the currently-focused merged customer. Only
   *  meaningful alongside `onSelect`. */
  selected?: boolean;
  /** Which roster group this pill belongs to — tints the avatar bubble so
   *  a "Conference" colleague and a "Merge Calls" bridged customer read as
   *  two different kinds of thing at a glance, now that both can appear in
   *  the SAME consolidated strip (see the roster strip's own doc comment
   *  below for why they were merged into one). "colleague" reuses the
   *  same blue the "Conference" `Tag` already uses in the control row
   *  above; "merged" reuses the teal the new "Merged call" `Tag` uses —
   *  each pill's color matches its own badge's color, not the other
   *  group's. Omitted (plain neutral avatar) for "You"/the primary
   *  customer, which aren't part of either group. */
  kind?: "colleague" | "merged";
}) {
  const canExpand = !!onToggleHold || !!onTransfer || !!onHangUp;
  const [confirming, setConfirming] = useState(false);
  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 rounded-full bg-lyra-bg-surface-base pl-1 pr-2.5",
        selected && "bg-lyra-status-info-subtle"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full lyra-body-xs-emphasis",
          kind === "colleague"
            ? "bg-lyra-status-info-subtle text-lyra-status-info-strong"
            : kind === "merged"
              ? "bg-lyra-accent-teal-soft text-lyra-accent-teal-strong"
              : "bg-lyra-bg-surface-container-subtle text-lyra-fg-secondary",
          onSelect && "cursor-pointer"
        )}
        aria-hidden="true"
        {...(onSelect ? { onClick: onSelect } : {})}
      >
        {isSelf ? "You" : isInternalAgent ? <Headset className="h-3 w-3" strokeWidth={1.5} /> : initialsFor(label)}
      </span>
      {!isSelf &&
        (onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="lyra-body-sm text-lyra-fg-default max-w-[130px] truncate text-left hover:underline"
          >
            {label}
          </button>
        ) : (
          <span className="lyra-body-sm text-lyra-fg-default max-w-[130px] truncate">{label}</span>
        ))}
      {canExpand &&
        (confirming ? (
          <span className="flex shrink-0 items-center gap-1">
            <span className="lyra-body-xs text-lyra-fg-secondary whitespace-nowrap">Drop?</span>
            <button
              type="button"
              aria-label={`Confirm drop ${label}`}
              onClick={() => {
                onHangUp?.();
                setConfirming(false);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-lyra-status-critical-strong hover:bg-lyra-state-hover"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => setConfirming(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-lyra-fg-secondary hover:bg-lyra-state-hover"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1">
            {onToggleHold && (
              <button
                type="button"
                title={isOnHold ? `Resume ${label}` : `Hold ${label}`}
                aria-label={isOnHold ? `Resume ${label}` : `Hold ${label}`}
                onClick={onToggleHold}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full hover:bg-lyra-state-hover",
                  isOnHold ? "text-lyra-status-critical-strong" : "text-lyra-fg-secondary"
                )}
              >
                {isOnHold ? <Play className="h-3.5 w-3.5" strokeWidth={2} /> : <Pause className="h-3.5 w-3.5" strokeWidth={2} />}
              </button>
            )}
            {onTransfer && (
              <button
                type="button"
                title={`Transfer call to ${label}`}
                aria-label={`Transfer call to ${label}`}
                onClick={onTransfer}
                className="flex h-6 w-6 items-center justify-center rounded-full text-lyra-fg-secondary hover:bg-lyra-state-hover"
              >
                {/* `TransferIcon` — per explicit follow-up request ("change
                    this icon to the transfer/consult icon used
                    elsewhere"): same composite this app's record-header
                    "Consult / Transfer" button and `ConferencePicker`'s own
                    row-level Transfer action already use, instead of a
                    bare `ArrowRightLeft` glyph unique to this one spot.
                    Fixed-size (no `className` override — see that
                    component's own definition), but reads fine at this
                    button's 24px size, same as every other place it's
                    already used inside a similarly compact trigger. */}
                <TransferIcon />
              </button>
            )}
            {onHangUp && (
              <button
                type="button"
                title={`Drop ${label}`}
                aria-label={`Drop ${label}`}
                onClick={() => setConfirming(true)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-lyra-status-critical-strong hover:bg-lyra-state-hover"
              >
                <PhoneOff className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </span>
        ))}
    </span>
  );
}

/** The collapsed volume trigger — compact rendering only (see this file's
 *  own top doc comment for why the wide rendering keeps its own separate
 *  icon instead). A single icon button (the live volume glyph, same
 *  `Volume2`/`VolumeX` swap the wide trigger uses) opens a small popover
 *  holding just the volume slider.
 *
 *  Per explicit follow-up request ("take the transcript button out of the
 *  volume dropdown and put it to the left of the volume button"): this used
 *  to also fold a "Show/Hide transcript" row into this same popover
 *  (`CompactVolumeAndTranscriptButton`, see this file's own git history) —
 *  transcript is back to being its own separate `WideCallControlButton`
 *  (was `CompactCallControlButton` — see this file's own top doc comment
 *  for that later rename-in-place) at this component's own call site
 *  instead, so this trigger is volume-only again.
 *
 *  `volume`/`onVolumeChange` are lifted to the OUTER `VoiceCallControls`
 *  component rather than local state here — see this file's own top doc
 *  comment for why (the value has to survive a resize back across the
 *  breakpoint into the wide rendering's own separate volume trigger). */
function CompactVolumeButton({
  volume,
  onVolumeChange,
  disabled,
  compact,
}: {
  volume: number;
  onVolumeChange: (volume: number) => void;
  /** Per explicit request ("when end call is clicked ... disable the
   *  other buttons at the same time"): disables the trigger itself
   *  (forwarded to `WideCallControlButton` below, same as every other
   *  control in this bar) and forces the popover closed/unopenable rather
   *  than leaving an already-open volume slider live while the call is
   *  hanging up — same "force off a conflicting open state" convention
   *  the Mask/Record pair above already follows. */
  disabled?: boolean;
  /** Mirrors `VoiceCallControls`'s own `controlsCompact` (see that file's
   *  top doc comment / `CompactCallControlButton`'s) — swaps this trigger
   *  from `WideCallControlButton` to the icon-only 40px
   *  `CompactCallControlButton` below the 991px breakpoint, same as every
   *  other control in the centered cluster. Uses a native `title` rather
   *  than `Tooltip` for the same reason Keypad's own call site does — see
   *  that comment. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    // No more wrapping `Tooltip` — per later explicit follow-up request
    // ("label the buttons again"), the trigger below is now a labeled
    // `WideCallControlButton` (visible "Volume" text) rather than the old
    // hand-rolled icon-only `<button>` a hover `Tooltip` used to be the
    // only way to name, so there's nothing left for a tooltip to add here.
    // `Popover`'s trigger still clones its own click/ref/aria props onto
    // its immediate child via Radix's `asChild`/`Slot` mechanism — that's
    // exactly what `WideCallControlButton`'s own `forwardRef`+`...rest`
    // are for (see that component's own doc comment).
    <Popover
      open={open && !disabled}
      onOpenChange={(next: boolean) => {
        if (!disabled) setOpen(next);
      }}
      placement="top"
      content={
        <div className="flex items-center gap-2 p-3 w-[200px]">
          <button
            type="button"
            onClick={() => onVolumeChange(volume === 0 ? 70 : 0)}
            aria-label={volume === 0 ? "Unmute" : "Mute"}
            className="shrink-0 text-lyra-fg-secondary hover:text-lyra-fg-default"
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
          <Slider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={100}
            step={1}
            showTicks={false}
            label="Call volume"
            className="flex-1 min-w-0 [&>label]:sr-only"
          />
        </div>
      }
    >
      {compact ? (
        <CompactCallControlButton
          icon={
            volume === 0 ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            )
          }
          active={open}
          disabled={disabled}
          aria-label="Volume"
          title="Volume"
          aria-pressed={open}
        />
      ) : (
        <WideCallControlButton
          icon={
            volume === 0 ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            )
          }
          label="Volume"
          active={open}
          disabled={disabled}
          aria-label="Volume"
          aria-pressed={open}
        />
      )}
    </Popover>
  );
}

export interface VoiceCallControlsProps {
  /** Ends the call — the caller closes this channel (same as picking
   *  "Closed" from the status popover). The only real, non-decorative
   *  action in this whole bar — see this file's own top doc comment. */
  onHangUp: () => void;
  /** Seconds since this call started (`clockTick - Thread.startTick`, same
   *  tick source every other timer in this app reads off) — rendered as a
   *  running "MM:SS" (`formatElapsedTime`, same format/helper
   *  `InteractionNavItem`'s own per-channel elapsed timer uses) above the
   *  768px breakpoint, or a plain clock glyph with the same duration on a
   *  `Tooltip` below it — see this file's own top doc comment. Optional so
   *  an existing caller that hasn't wired this through yet still renders
   *  (just without the timer) instead of crashing. */
  elapsedSeconds?: number;
  /**
   * Opens/closes the call transcript `InteriorPanel` the caller renders
   * alongside the transcript/composer column (see each tier page's own
   * "Voice call controls" render site) — this bar has no panel of its own
   * to show, it just tells the caller to toggle theirs, same "this
   * component doesn't own interaction-level state" split every other real
   * (non-decorative) callback here already follows. Its own separate icon
   * both above AND below the 768px breakpoint (see `CompactVolumeButton`'s
   * own doc comment for why this is no longer folded into that trigger).
   * Omit to hide the transcript trigger entirely, e.g. for a caller that
   * hasn't wired a panel through yet.
   */
  onToggleTranscript?: () => void;
  /** Whether the caller's transcript panel is currently open — tints
   *  whichever transcript trigger is currently showing (wide or compact)
   *  the same active blue every other toggled-on control in this bar
   *  (Hold/Mute/Mask/Record) already uses. */
  transcriptOpen?: boolean;
  /**
   * Opens/closes the small draggable video window (a `DraggablePanel`) the
   * caller renders elsewhere in the page — replaces this button's old
   * decorative-only "toggle local icon + toast" behavior with a real
   * window when wired. Omit to keep that old decorative fallback (still
   * toggles the icon and fires a toast, same as every other placeholder
   * control here) for a caller that hasn't wired a video window through
   * yet.
   */
  onToggleVideo?: () => void;
  /** Whether the caller's floating video window is currently open — only
   *  read when `onToggleVideo` is provided (otherwise this button tracks
   *  its own local decorative state instead, see `onToggleVideo`'s own
   *  doc comment). */
  videoOpen?: boolean;
  /** Whether this call is currently on hold — controlled from the caller
   *  once `onHoldChange` is wired, same "read the caller's real state once
   *  wired, else track local decorative state" split `videoOpen`/
   *  `onToggleVideo` above already establishes. Per explicit request
   *  ("putting an active call on hold from the call controls should ...
   *  add an on hold chip to the interactionNavItem"): unlike every other
   *  decorative toggle in this bar (Mute/Mask/Record), Hold now needs to
   *  survive this whole bar unmounting/remounting (it only renders for
   *  whichever interaction is currently ACTIVE — see each page's own
   *  `activeInteractionVoiceThread` render site) — a plain local `useState`
   *  can't do that on its own, so the caller lifts it onto the underlying
   *  `Thread` instead. Ignored (this button falls back to its own old local
   *  state) while `onHoldChange` is omitted. */
  onHold?: boolean;
  /** Fired with the NEW hold state whenever the Hold/Resume button is
   *  pressed. Only takes effect (makes `onHold` above controlled) when
   *  provided — omit to leave this button exactly as before (a purely
   *  local, decorative toggle with no effect outside this component). */
  onHoldChange?: (onHold: boolean) => void;
  /** Same optionally-controlled pattern as `onHold`/`onHoldChange` above,
   *  for the Consult popover's own open/closed state — lets a caller open
   *  this bar's Consult picker from somewhere else entirely (e.g. the
   *  record header's own "Consult / Transfer" button,
   *  agent-next-gen-transcript.tsx, per explicit follow-up request) instead
   *  of only from this bar's own Consult button. Ignored (falls back to
   *  local state) while `onConferenceOpenChange` is omitted. */
  conferenceOpen?: boolean;
  /** Fired with the NEW open state whenever the Consult popover opens or
   *  closes (its own button, Escape, an outside click, or a completed
   *  selection). Only takes effect (makes `conferenceOpen` above
   *  controlled) when provided — omit to leave this exactly as before (a
   *  purely local popover with no effect outside this component). */
  onConferenceOpenChange?: (open: boolean) => void;
  /** Repositions the Consult popover onto an arbitrary DOM node instead of
   *  this bar's own Consult button — e.g. the record header's own
   *  "Consult / Transfer" button, living somewhere else on the page
   *  entirely — per explicit request ("show the consult popup next to
   *  that selection, so a user doesn't have to jump away from where they
   *  just clicked"). Same `Popover` `virtualAnchorRef` escape hatch the
   *  "Merge Calls" picker already uses (AgentWorkspace2WithDeskPage.tsx) —
   *  the caller sets `.current` to the clicked element right before
   *  opening, and clears it back to `null` on close so this bar's own
   *  button becomes the anchor again by default. Omit to leave the
   *  popover always anchored to this bar's own button, exactly as before. */
  consultAnchorRef?: React.RefObject<HTMLElement | null>;
  /** One-way notification (NOT a controlled value the way `onHold`/
   *  `onConferenceOpenChange` are — nothing outside this bar ever needs to
   *  SET the roster, only read it) of the current merged-colleague roster,
   *  fired whenever a merge or a drop changes it — per explicit follow-up
   *  request ("show all participant names in the assignment card also with
   *  a similar 'conference' icon"): the left-nav assignment card needs this
   *  same list (to list every participant's name and show a conference
   *  icon) from a completely different part of the component tree, same
   *  "lift it so another surface can read it" reasoning `onHold` already
   *  established. Only `id`/`name` — see `Thread.colleagues`'s own doc
   *  comment (agent-next-gen-interaction-dashboard.tsx) for why that's
   *  deliberately narrower than this bar's own internal `CallColleague`
   *  (per-colleague hold state stays purely internal, irrelevant to the
   *  nav card). Omit to just skip the notification — this bar's own
   *  roster/participant strip behave identically either way. */
  onColleaguesChange?: (colleagues: { id: string; name: string }[]) => void;
  /** The PERSISTED roster to seed this bar's own local `colleagues` state
   *  from, on mount — the exact same `Thread.colleagues` value
   *  `onColleaguesChange` writes out to (see each page's own
   *  `<VoiceCallControls>` call site: both read from and write to that one
   *  field). Only read once, as `useState`'s own lazy initializer — this
   *  bar still owns the roster locally after that (per-colleague hold
   *  state, drop confirmations, etc. all stay internal, same as before);
   *  this prop exists purely so a REMOUNT (this bar's own `key` changes
   *  whenever the underlying call it's showing changes — see that prop's
   *  own doc comment) seeds back the right starting roster instead of
   *  always defaulting to empty. Without this, switching which bridged
   *  customer is displayed (a Merge Calls roster click) silently erased
   *  the OTHER customer's own conference the instant this bar remounted
   *  for them — see `colleagues`' own state doc comment below for the full
   *  bug writeup. Omit to keep the original always-starts-empty behavior
   *  (a caller with no conference concept at all). */
  initialColleagues?: { id: string; name: string }[];
  /** Per explicit request (Agent Workspace 2.0 Phase 1 only): hides the
   *  "Add video" button entirely. This bar's own divider just before it
   *  stays either way — it still separates the call-feature cluster from
   *  Hang Up whether or not "Add video" sits between them (see that
   *  divider's own comment). Defaults `true`; every other tier/call site
   *  keeps the button exactly as before. */
  showAddVideo?: boolean;
  /**
   * No longer used — this bar dropped its wide/compact/stretch responsive
   * toggle entirely (see this file's own top doc comment: "just take the
   * existing compact version — stretch it the full width of the container
   * and remove media queries"), so there's only one rendering left and
   * nothing for this prop to switch between anymore. Kept, accepted, and
   * ignored purely so Phase 1/Phase 2's existing call sites (the only two
   * that ever passed it) don't need their own JSX touched.
   */
  stretch?: boolean;
  /** Customer's display name, phone number, or email — shown as a small
   *  identity line above the elapsed-call timer in this bar's leading slot,
   *  next to a small avatar chip, per explicit request/reference screenshot
   *  ("add the customer avatar. Add the name / number/email above the
   *  timer"). Pass whichever identifier the caller already resolved for
   *  this call (a real name when known, else the raw number/email a
   *  `Thread`'s own value holds — see this repo's `Interaction.id` doc
   *  comment for the `quickdial:<number>` id pattern used when no contact
   *  record matches a dialed number). Omit entirely to render neither the
   *  avatar nor this line — same "renders fine without it" fallback every
   *  other optional prop here already follows (see `elapsedSeconds`'s own
   *  doc comment) — for a caller that hasn't wired customer identity
   *  through yet. */
  customerLabel?: string;
  /** Initials to show inside the avatar chip instead of the generic
   *  fallback glyph, once the caller has a real contact match (the same
   *  initials a caller would derive the same way `interaction-nav-item.tsx`
   *  's own avatar already does via `getInitials`). Only meaningful while
   *  `customerLabel` is also set — without a real contact match this avatar
   *  instead shows a plain white `Plus` glyph, per the reference
   *  screenshot's unmatched-quickdial-number case (see this file's own top
   *  doc comment). */
  customerInitials?: string;
  /** Every OTHER Interaction currently bridged with this call via "Merge
   *  Calls" (resolved by the caller from `Interaction.mergedInteractionIds`
   *  — see that field's own doc comment, agent-next-gen-interaction-
   *  dashboard.tsx). Distinct from `colleagues`/`onColleaguesChange` above:
   *  a merged interaction is a fully separate, independently-dialed
   *  customer call, not an internal agent merged into this one. Presence
   *  (`length > 0`) alone gates the merged-call roster strip and disables
   *  Hold (see `onUnmergeCalls`'s own doc comment for why). */
  mergedInteractions?: {
    id: string;
    name: string;
    /** Per explicit request ("if merging an agent or skill into a
     *  customer call ... there is no selecting of the agent line"):
     *  `false` renders this row's name as plain, non-clickable text (no
     *  `onSelect` wired, same as an in-call Consult/Merge colleague's own
     *  name) instead of a focus-switching button. Default `true` — every
     *  existing customer-customer merge is unaffected. */
    selectable?: boolean;
  }[];
  /** Fired when the agent clicks a merged customer's name (in this bar's
   *  own roster strip) — the caller's own `switchActiveInteraction`, so
   *  clicking a name re-focuses the whole page (transcript, record header,
   *  Customer Info panel) onto that interaction. This bar has no notion of
   *  "which interaction is active" itself. */
  onSelectMergedInteraction?: (interactionId: string) => void;
  /** Splits every interaction in this merged call back into fully
   *  independent calls (clears `mergedInteractionIds` on all of them).
   *  Presence alone shows the Un-merge button in the roster strip. */
  onUnmergeCalls?: () => void;
  /** Ends every interaction's voice call in this merged group at once
   *  (sets `voiceCallEnded` on all of them). Presence alone shows the End
   *  All Calls button in the roster strip — gated behind its own inline
   *  confirm, same pattern as `ParticipantChip`'s "Drop {name}?" step,
   *  since this ends more than just the call currently in view. */
  onEndAllCalls?: () => void;
  className?: string;
}

export function VoiceCallControls({
  onHangUp,
  elapsedSeconds,
  onToggleTranscript,
  transcriptOpen,
  onToggleVideo,
  videoOpen,
  onHold: onHoldControlled,
  onHoldChange,
  conferenceOpen: conferenceOpenControlled,
  onConferenceOpenChange,
  consultAnchorRef,
  onColleaguesChange,
  initialColleagues,
  showAddVideo = true,
  stretch = false,
  customerLabel,
  customerInitials,
  mergedInteractions,
  onSelectMergedInteraction,
  onUnmergeCalls,
  onEndAllCalls,
  className,
}: VoiceCallControlsProps) {
  // Decorative-only fallback for a caller that hasn't wired `onHoldChange`
  // through yet — see that prop's own doc comment (same `localVideoAdded`/
  // `onToggleVideo` split just below).
  const [localOnHold, setLocalOnHold] = useState(false);
  const onHold = onHoldChange ? !!onHoldControlled : localOnHold;
  const setOnHold = onHoldChange ?? setLocalOnHold;
  const [muted, setMuted] = useState(false);
  const [masked, setMasked] = useState(false);
  const [recording, setRecording] = useState(false);
  // Decorative-only fallback for a caller that hasn't wired a real video
  // window through `onToggleVideo` yet — see that prop's own doc comment.
  const [localVideoAdded, setLocalVideoAdded] = useState(false);
  const videoAdded = onToggleVideo ? !!videoOpen : localVideoAdded;
  const [keypadOpen, setKeypadOpen] = useState(false);
  // Optionally controlled — see `onHold`'s own identical split just above
  // for the pattern. Lifted per explicit follow-up request ("the
  // consult/transfer icon in the top right will trigger the same popup as
  // the 'conference' icon button does now"): the record header's own
  // "Consult / Transfer" button (agent-next-gen-transcript.tsx) lives in a
  // completely different part of the component tree than this bar, so the
  // two can only open the exact same popover if whichever page renders
  // both lifts this one boolean to a shared piece of state and passes it
  // to both — a caller that doesn't wire `onConferenceOpenChange` through
  // still gets the original fully-local behavior for free.
  const [localConferenceOpen, setLocalConferenceOpen] = useState(false);
  const conferenceOpen = onConferenceOpenChange ? !!conferenceOpenControlled : localConferenceOpen;
  const setConferenceOpen = onConferenceOpenChange ?? setLocalConferenceOpen;
  // The real consult-then-merge conference flow — ported from the
  // reference app's identical `voiceCallColleagues`/`voiceCallConsult`
  // (AgentNextGenPage.tsx), just kept local to this component instead of
  // lifted to a page-level `Record<assignmentId, ...>`.
  //
  // CORRECTED per an explicit bug report ("when I merged another customer
  // into an existing conference, the conference call seemed to end, and
  // kicked out the conferencing agent"): this used to assume plain local
  // state was enough because "this app only ever has one live voice call
  // at a time, so this bar is never remounted per interaction" — true when
  // this was written, FALSE since "Merge Calls" shipped. This bar's own
  // `key` (the page call sites below) is deliberately
  // `${displayedVoiceCallInteraction.id}:${displayedVoiceCallThread.id}`,
  // and switching which bridged member is "displayed" (clicking a merged
  // customer's name, `onSelectMergedInteraction`) changes that key — a
  // real, intentional remount (same one that correctly gives a genuinely
  // DIFFERENT call its own fresh mute/hold/consult state). The bug: local
  // `useState([])` defaulted to empty on every one of those remounts
  // too, and the sync effect just below (`onColleaguesChange`) fires on
  // MOUNT as well as on every change — so the instant an agent switched
  // which bridged customer they were viewing, this bar wiped that OTHER
  // customer's real, persisted colleague roster back to `[]` before ever
  // learning what it actually was. Confirmed live: start a conference on
  // Call A (Consult + Merge a colleague), bridge in Call B (Merge Calls),
  // switch focus to A's own name in the merged roster — the colleague was
  // gone. `initialColleagues` (prop, below) is the fix: the SAME
  // `Thread.colleagues` field `onColleaguesChange` already writes out to,
  // now also read back in as this state's OWN seed on (re)mount — the
  // exact two-way pattern `onHold`/`heldByAgent` on this same bar already
  // established; `colleagues` was the one field that had only ever been
  // wired as write-only.
  const [colleagues, setColleagues] = useState<CallColleague[]>(
    () => initialColleagues?.map((c) => ({ id: c.id, name: c.name, isOnHold: false })) ?? []
  );
  // Notifies the caller every time the roster's actual MEMBERSHIP changes
  // (a merge or a drop) — see `onColleaguesChange`'s own doc comment.
  // Deliberately keyed on `colleagues` itself, not called inline inside
  // `handleMergeConsult`/`handleDropColleague`, so this fires correctly
  // regardless of which of those (or any future one) changed the array,
  // without each having to separately compute/pass the resulting list.
  // `onColleaguesChange` itself isn't in the dep array — a caller that
  // doesn't memoize it shouldn't re-fire this on every one of its own
  // unrelated re-renders.
  useEffect(() => {
    onColleaguesChange?.(colleagues.map((c) => ({ id: c.id, name: c.name })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colleagues]);
  const [consult, setConsult] = useState<VoiceCallConsult | undefined>(undefined);
  // Volume slider — purely local/decorative, same "no real telephony
  // backing this" convention as Hold/Mute/Mask/Record (see this file's own
  // top doc comment).
  const [volume, setVolume] = useState(70);
  const [volumeOpen, setVolumeOpen] = useState(false);

  // Per explicit request ("when end call is clicked transition the end
  // call button to a hanging up state (disabled) then disable the other
  // buttons at the same time and animate the call controls out (down)"),
  // refined by a later explicit follow-up ("wait one second after the
  // call is ended before animating out the controls"): two states, not
  // one, so the disabled "hanging up" look and the slide-out animation
  // don't happen in the same instant. `isEnding` flips immediately on
  // click and gates the disabling half — every other control below reads
  // `disabled={isEnding}` (or ORs it into a disabled expression it already
  // had, e.g. Record/masked) and the End Call button itself swaps to its
  // disabled "Hanging Up..." look right away. `isExiting` only flips a
  // full second later (`HANG_UP_HOLD_MS` below) and is what the outer
  // card's own transition classes (see that div's doc comment below)
  // actually key off of — so an agent sees the "hanging up" state hold for
  // a beat before the bar starts sliding away, instead of both happening
  // at once. The real `onHangUp` callback — the one thing here that
  // actually closes the channel (see this file's own top doc comment) —
  // is deliberately DEFERRED past both delays (the 1s hold plus the exit
  // transition's own duration) rather than fired on click: this whole bar
  // unmounts the instant the caller closes the channel (see each tier
  // page's own "voice has no composer" branch), which would cut the
  // hold/exit sequence short if `onHangUp` ran synchronously.
  const HANG_UP_HOLD_MS = 1000;
  const HANG_UP_EXIT_MS = 300;
  const [isEnding, setIsEnding] = useState(false);
  // Per a real, reported ADA/accessibility gap (found while reviewing this
  // component for a lyra-ui port): Record used to be natively `disabled`
  // while `masked` was on, which — combined with `Button`'s own shared
  // `disabled:pointer-events-none`/`disabled:opacity-40` styling and the
  // native `disabled` attribute's own focus removal — made the `Tooltip`
  // explaining WHY it's disabled ("Recording disabled while masking is
  // on") completely unreachable for everyone: a mouse user can't hover a
  // `pointer-events-none` element to trigger it, and a keyboard/screen-
  // reader user can't tab to an element the browser has removed from the
  // tab order at all. `recordDisabled` now backs an `aria-disabled`
  // instead (see the Record button's own call site below) — the button
  // stays hoverable/focusable, Radix's `Tooltip.Trigger` opens on either,
  // and this same boolean still blocks the actual click/keyboard-activate
  // behavior and paints the same dimmed look, so it reads and behaves as
  // disabled without hiding why.
  const recordDisabled = masked || isEnding;
  const [isExiting, setIsExiting] = useState(false);
  const hangUpTimeoutsRef = useRef<number[]>([]);
  useEffect(() => {
    return () => {
      hangUpTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  // Per explicit follow-up bug report ("when the call controls animate out
  // the main container drops instantly instead of animating with the
  // controls"): the slide/fade transition above only ever moved this bar
  // visually — it never shrank the actual space this bar RESERVES in the
  // caller's flex column (see this file's own top doc comment: this whole
  // component is a `shrink-0` flex sibling of `InteractionTranscript`), so
  // that space stayed put for the full exit transition and only vanished
  // the instant this component actually unmounts (once `onHangUp` fires
  // and the caller closes the channel) — a hard one-frame snap for
  // whatever sits above it, landing right as the slide/fade was still
  // finishing. Collapsing this bar's own rendered height to 0 in lock-step
  // with that same transition means the transcript column above grows
  // into the vacated space gradually, over the same 300ms, instead of
  // jumping the instant this bar disappears.
  //
  // `collapseHeight` is `null` while this bar is in its normal (or merely
  // "hanging up"/disabled) state — no inline height override, sized by its
  // own content exactly as it always was. It's only ever set once
  // `isExiting` flips: first to this bar's OWN just-measured rendered
  // height (a CSS `height` transition can't animate from `auto`, only
  // between two concrete pixel values — setting it to the height it
  // already visually has causes no jump), then, one animation frame later,
  // down to `0` — that second state change is what the outer div's own
  // `transition-all` class (below) actually animates. `overflow-hidden`
  // rides along with the collapse (see that div's own style/className) so
  // the padding/content don't visibly poke out past the shrinking box.
  const barRef = useRef<HTMLDivElement>(null);
  const [collapseHeight, setCollapseHeight] = useState<number | null>(null);

  // Per an explicit follow-up request ("when the width of the call
  // controls goes below 991px make the hold/mask/record/keypad/transcript/
  // volume icon only buttons and 40px", then "when the call controls go
  // below 768px make the mute/video/end call buttons icon buttons 40px"):
  // this bar regains a measured, self-width-driven responsive split — NOT
  // the old three-way wide/compact/stretch toggle this file's own top doc
  // comment describes removing (that one swapped the WHOLE bar between
  // renderings at a single 768px threshold and got removed over a real
  // resize bug). This is two independent, narrower thresholds layered on
  // top of the current single (labeled) rendering: Hold through Volume
  // drop to icon-only `CompactCallControlButton` + `Tooltip` first, at
  // 991px, while Mute/Add video/End Call keep their labels down to a
  // second, narrower 768px threshold — matching the reference screenshot,
  // which still shows "Mute"/"Add video"/"End Call" as visible text at a
  // width where Hold-through-Volume have already gone icon-only. Both
  // thresholds are measured off the same `ResizeObserver`, watching
  // `cardRef` (the actual bordered card below, not the outer full-bleed
  // wrapper `barRef` tracks — that wrapper carries its own `px-6` padding,
  // which would push the effective trigger width off by that inset) —
  // same "measure my own container, not the viewport" pattern
  // `ScheduleToolbar`'s own `containerRef`/`isWide`/`isCompact`
  // (SchedulePanel.tsx) already uses, and the same one this file's own
  // now-removed `isCompact` used to use before it was dropped.
  const CONTROLS_COMPACT_BREAKPOINT = 991;
  const CONTROLS_ICON_ONLY_BREAKPOINT = 768;
  const cardRef = useRef<HTMLDivElement>(null);
  // This bar's own Consult button, self-ref'd so ITS OWN click can
  // explicitly set `consultAnchorRef` to itself before opening — see that
  // button's own `onClick` below for why this turned out to be necessary
  // (relying on `consultAnchorRef.current` reverting to `null`/`children`
  // on close did not reliably re-anchor the popover back here on the next
  // open, confirmed live: the popover kept reopening at the LAST external
  // anchor's position even after the ref was correctly nulled out on
  // close). Always setting a real, explicit anchor on every open — never
  // leaning on the null-means-fall-back-to-children path at all — sidesteps
  // whatever that bug is.
  const consultButtonSelfRef = useRef<HTMLButtonElement>(null);
  const [controlsCompact, setControlsCompact] = useState(false);
  const [controlsIconOnly, setControlsIconOnly] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setControlsCompact(width < CONTROLS_COMPACT_BREAKPOINT);
      setControlsIconOnly(width < CONTROLS_ICON_ONLY_BREAKPOINT);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!isExiting) return;
    const el = barRef.current;
    if (!el) return;
    setCollapseHeight(el.getBoundingClientRect().height);
    const raf = requestAnimationFrame(() => setCollapseHeight(0));
    return () => cancelAnimationFrame(raf);
  }, [isExiting]);
  // Cancel — ported from the reference app's `startVoiceCallConsult`'s
  // cancel path: the private side-conversation is abandoned, and the
  // primary customer (auto-held the instant the consult started) resumes.
  // Leaves `colleagues` untouched — cancelling a NEW consult never affects
  // anyone already merged in from an earlier one.
  const handleCancelConsult = () => {
    setConsult(undefined);
    setOnHold(false);
  };
  // Swap — per explicit follow-up request ("provide a way to swap and
  // hold between the consult and the customer"): flips exactly which of
  // the two legs is live vs. held, in lockstep — captures the CURRENT
  // `onHold` value before either update lands, since the new consult-hold
  // state is simply the old customer-hold state (and vice versa). Only
  // meaningful while a consult is in progress; the only two things that
  // call this are the customer's and the consult's own Hold buttons in
  // `ConsultBanner` (both wired to this SAME function — see that
  // component's own doc comment for why pressing either one is identical).
  const handleSwapConsult = () => {
    if (!consult) return;
    setOnHold(!onHold);
    setConsult({ ...consult, isOnHold: onHold });
  };
  // Merge — ported from the reference app's `mergeVoiceCallConsult`: the
  // consult becomes a real `CallColleague` and the primary customer resumes
  // into what's now a three-(or-more-)way conference.
  const handleMergeConsult = () => {
    if (!consult) return;
    setColleagues((prev) => [...prev, { id: consult.id, name: consult.name, isOnHold: false }]);
    setConsult(undefined);
    setOnHold(false);
  };
  // Drop — ported from the reference app's `dropVoiceCallColleague`. Only
  // ever fired from `ParticipantChip`'s own Check/X confirm step, never
  // directly on a single click (see that component's own doc comment) —
  // this function itself doesn't need its own confirmation.
  const handleDropColleague = (colleagueId: string) => {
    setColleagues((prev) => prev.filter((c) => c.id !== colleagueId));
  };
  // Row-level hold for one specific colleague — ported from the reference
  // app's `toggleVoiceCallColleagueHold`. Independent of the primary
  // customer's own hold (`onHold`/`setOnHold`) and of every OTHER
  // colleague's — see `CallColleague.isOnHold`'s own doc comment.
  const handleToggleColleagueHold = (colleagueId: string) => {
    setColleagues((prev) => prev.map((c) => (c.id === colleagueId ? { ...c, isOnHold: !c.isOnHold } : c)));
  };
  // Decorative no-op — per explicit follow-up request ("remove all of the
  // notifications that trigger upon any action"), this used to just fire
  // a "not wired up yet" toast; there's no real transfer flow in this
  // prototype to do instead, so clicking Transfer on a merged colleague
  // now genuinely does nothing, same as `ConferencePicker`'s own
  // Chat/Transfer icons above. Kept as its own named handler (not inlined
  // at the `ParticipantChip` call site) so the control stays wired/visibly
  // present rather than silently dropped.
  const handleTransferColleague = () => {};
  // Per explicit follow-up ("look at end all icon for a merged call and the
  // end call button from the original voice controls. They seem to be
  // redundant in this scenario"): this bar's own roster strip used to carry
  // a SECOND "end" control (a small icon + inline confirm, "End all calls")
  // whenever a Merge Calls bridge was active — redundant with this button,
  // which was always visible too, just with narrower (single-call) scope.
  // That second control is gone now (see the roster strip's own comment);
  // this ONE button picks the right scope itself instead — `onEndAllCalls`
  // (ends every bridged member at once) when `mergedInteractions` is
  // non-empty, the original single-call `onHangUp` otherwise. Falls back to
  // `onHangUp` if a caller wires `mergedInteractions` without also wiring
  // `onEndAllCalls` — same "missing handler, don't crash" convention every
  // other optional callback here already follows.
  const handleHangUp = () => {
    // Guards against a double-fire (e.g. a stray extra click before the
    // button's own `disabled` re-renders) from scheduling the end callback
    // twice.
    if (isEnding) return;
    setIsEnding(true);
    // Force-close the Keypad/Conference popovers too — same "don't leave a
    // conflicting open state showing" reasoning `CompactVolumeButton`'s own
    // `disabled` prop doc comment gives for the volume popover. Any
    // in-flight consult is abandoned outright (not merged) — ending the
    // whole call takes the private side-conversation down with it, same as
    // hanging up on a real phone mid-consult would.
    setKeypadOpen(false);
    setConferenceOpen(false);
    setConsult(undefined);
    hangUpTimeoutsRef.current.push(
      window.setTimeout(() => {
        setIsExiting(true);
        hangUpTimeoutsRef.current.push(
          window.setTimeout(() => {
            if (mergedInteractions?.length && onEndAllCalls) {
              onEndAllCalls();
            } else {
              onHangUp();
            }
          }, HANG_UP_EXIT_MS)
        );
      }, HANG_UP_HOLD_MS)
    );
  };
  // Matches `handleHangUp`'s own scope decision just above — the button's
  // own label needs to say what it's ACTUALLY about to do (end one call vs.
  // every bridged member at once), not just always read "End Call" while
  // silently taking down more than that.
  const endCallLabel = mergedInteractions?.length ? "End All Calls" : "End Call";
  const endingLabel = mergedInteractions?.length ? "Ending All Calls..." : "Hanging Up...";

  return (
    // Per explicit request/reference screenshot: this bar floats as its own
    // bordered, rounded, shadowed white card rather than an edge-to-edge
    // strip — this OUTER div is a static (no conditional className of its
    // own) full-bleed wrapper that just supplies the horizontal inset the
    // card floats within and stays `shrink-0` in the composer/
    // `VoiceCallControls`-bar flex slot exactly as this whole component
    // already did. `className` (this component's own prop) lands here
    // rather than on the card below — no caller passes it today, but this
    // is the more useful target for a future one (positioning/spacing
    // overrides for the whole bar's slot, not the card's own look).
    // `w-full` explicit here (not just relied on as this flex item's own
    // implicit cross-axis stretch from a `flex-col` ancestor) — per an
    // explicit follow-up bug report/screenshot ("it's not full width")
    // after the compact-card-stretch fix above: `shrink-0` alone left this
    // wrapper's own WIDTH sized to content in practice once Phase 1/Phase
    // 2 pass their own `className="px-0 py-0 bg-transparent"` override
    // here (neutralizing this div's padding/background so the CALLER's own
    // wrapping row supplies those instead) — same "don't lean on ambient
    // stretch actually being definite" fix as `SidePanel`'s own `h-full`
    // doc comment (side-panel.tsx) describes for its pinned branch.
    <div
      ref={barRef}
      style={collapseHeight !== null ? { height: collapseHeight } : undefined}
      className={cn(
        "w-full shrink-0 bg-lyra-bg-surface-base px-6 py-3",
        // Per explicit request ("animate the call controls out (down)"),
        // refined by a later follow-up ("wait one second after the call is
        // ended before animating out the controls"): this keys off
        // `isExiting`, NOT `isEnding` — see `isEnding`'s own doc comment
        // above for why those two are separate states. `isExiting` only
        // flips a second after click, so the disabled "hanging up" look
        // holds for that beat before this transition (slide down + fade)
        // actually starts. `onHangUp` itself is deferred behind BOTH the
        // 1s hold and this transition's own duration, so it finishes
        // playing before the caller unmounts this bar entirely.
        "transition-all duration-300 ease-in-out",
        isExiting && "pointer-events-none translate-y-4 opacity-0",
        // `overflow-hidden` only once a height collapse is actually in
        // flight (`collapseHeight` non-null — see that state's own doc
        // comment above) — normal/"hanging up" rendering keeps this bar's
        // default visible overflow rather than clipping anything
        // unnecessarily the rest of the time.
        collapseHeight !== null && "overflow-hidden",
        className
      )}
    >
      {/* Consult banner — ported from the reference app's `ConsultBanner`
          (see `ConferencePicker`'s own top doc comment for the full port
          history). Sits above the normal control row, same as the
          reference; the row itself is untouched underneath it (Hold's own
          active/red styling is what shows the primary customer is on hold
          during a consult — see `ConsultBanner`'s own doc comment). */}
      {consult && (
        <ConsultBanner
          customerLabel={customerLabel ?? "Customer"}
          customerOnHold={onHold}
          consultName={consult.name}
          consultOnHold={consult.isOnHold}
          onToggleHold={handleSwapConsult}
          onCancel={handleCancelConsult}
          onMerge={handleMergeConsult}
        />
      )}
      {/* Participant strip — ONE consolidated bar for BOTH "who's merged
          into this call" mechanisms (a `colleagues` Conference and a
          `mergedInteractions` Merge-Calls bridge), not two separate stacked
          bars each repeating their own "You"/primary-customer pair. Per a
          design critique (merging two live calls, then separately
          consulting a colleague into one leg, produced two full-width
          bars sitting on top of each other — "too much to keep track of"):
          the duplicate "You"/customer chips were the actual bulk, not the
          roster content itself, so folding both groups into one strip
          — sharing a single "You"/customer pair up top — removes that
          duplication outright rather than trying to shrink either bar
          individually. A thin vertical divider (`h-5 w-px bg-lyra-border-
          subtle`) separates the "You"/customer pair from each present
          group, and separates the two groups from each other when both
          are present, so the strip still reads as distinct clusters
          despite sharing one box. Each group's pills also carry their own
          `kind` tint (`ParticipantChip`'s own doc comment) so a colleague
          and a bridged customer are visually distinguishable even without
          the divider, since the whole point of this fix is that the two
          should never look like the same kind of thing.

          Each group keeps its OWN independent gating rather than one
          blanket condition on the whole strip: the colleague group still
          hides the instant a NEW consult starts (`!consult` —
          `ConsultBanner` takes over that exact "who's on this call"
          message while a consult is being set up, same as before), but the
          merged-call group does NOT hide for an unrelated in-progress
          consult — an agent who's both on a bridged call AND mid-consult
          on one leg of it still needs to see the bridge/Un-merge/End-all
          controls, same as prior to this consolidation. `showColleagues`/
          `showMerged` below are what let the strip render with just one
          group present (the other's chips and divider simply don't
          render) without duplicating the "is there anything to show at
          all" check three times.

          Bordered/bg card (`rounded-lyra-md border border-lyra-border-
          subtle bg-lyra-bg-surface-base px-3 py-2`) — same container
          treatment `ConsultBanner` (just above) already uses for the
          identical "who's on this call" concept, per an earlier design
          critique (a merged-roster state that read as less important than
          the transient consult state it replaces, purely for lacking a
          visible container). `overflow-x-auto` so a long roster scrolls
          horizontally within this one row rather than wrapping the whole
          bar taller. "You" gets no actions (`isSelf`); the primary
          customer pill's own hold toggle is `setOnHold` DIRECTLY (not the
          main Hold button below) — same "this pill only ever holds/
          resumes the one person it represents" independence every
          colleague pill already has. */}
      {(() => {
        const showColleagues = colleagues.length > 0 && !consult;
        const showMerged = !!mergedInteractions?.length;
        if (!showColleagues && !showMerged) return null;
        return (
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto rounded-lyra-md border border-lyra-border-subtle bg-lyra-bg-surface-base px-3 py-2">
            <ParticipantChip label="You" isSelf isOnHold={false} />
            <ParticipantChip
              label={customerLabel ?? "Customer"}
              isOnHold={onHold}
              onToggleHold={() => setOnHold(!onHold)}
            />
            {showColleagues && (
              <>
                <span className="h-5 w-px shrink-0 bg-lyra-border-subtle" aria-hidden="true" />
                {colleagues.map((colleague) => (
                  <ParticipantChip
                    key={colleague.id}
                    label={colleague.name}
                    kind="colleague"
                    isInternalAgent
                    isOnHold={colleague.isOnHold}
                    onToggleHold={() => handleToggleColleagueHold(colleague.id)}
                    onTransfer={handleTransferColleague}
                    onHangUp={() => handleDropColleague(colleague.id)}
                  />
                ))}
              </>
            )}
            {showMerged && (
              <>
                <span className="h-5 w-px shrink-0 bg-lyra-border-subtle" aria-hidden="true" />
                {mergedInteractions!.map((interaction) => (
                  <ParticipantChip
                    key={interaction.id}
                    label={interaction.name}
                    kind="merged"
                    onSelect={
                      interaction.selectable !== false && onSelectMergedInteraction
                        ? () => onSelectMergedInteraction(interaction.id)
                        : undefined
                    }
                  />
                ))}
                {/* Group-level action (Un-merge only now) — per explicit
                    follow-up ("look at end all icon for a merged call and
                    the end call button from the original voice controls.
                    They seem to be redundant in this scenario"): this strip
                    used to ALSO carry its own "End all calls" icon +
                    inline confirm right here, sitting next to the main
                    bar's own big red "End Call" button below — two visible
                    controls both ultimately ending the call(s), just with
                    different (and non-obvious, icon-only) scope. Removed
                    outright rather than relabeled: the main "End Call"
                    button (below) now does its job instead — see
                    `handleHangUp`'s own doc comment for how it picks the
                    right scope (`onEndAllCalls` vs. plain `onHangUp`)
                    depending on whether a merge is actually active, so
                    there's exactly one visible "end" control regardless of
                    which state the call is in. The SAME divider style used
                    between the two roster groups above still separates
                    Un-merge from the roster itself, so it still reads as a
                    whole-call action, not an action on whichever merged
                    customer happens to sit next to it. */}
                <span className="h-5 w-px shrink-0 bg-lyra-border-subtle" aria-hidden="true" />
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {onUnmergeCalls && (
                    <button
                      type="button"
                      title="Un-merge calls"
                      aria-label="Un-merge calls"
                      onClick={onUnmergeCalls}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-lyra-fg-secondary hover:bg-lyra-state-hover"
                    >
                      <Split className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                </span>
              </>
            )}
          </div>
        );
      })()}
      {/* This card used to be one of three branches (wide two-row centered
          card / compact icon-only row / `stretch` single-row wide) picked
          by `stretch`+`isCompact` — see this file's own top doc comment
          ("just take the existing compact version — stretch it the full
          width of the container and remove media queries"). What's left is
          just the former COMPACT rendering's own look, made to fill its
          container instead of sizing to its own content: `w-full`, no
          `max-w`/`mx-auto` cap (those centered/capped this card within the
          outer full-bleed wrapper above — no longer wanted now that this is
          the only rendering), same flat 8px radius / tight padding /
          no-shadow treatment the compact branch always had. */}
      <div
        ref={cardRef}
        role="group"
        aria-label="Call controls"
        className={cn(
          // `bg-lyra-bg-surface-container-subtle` — per explicit request
          // ("make the background of the call controls the neutral
          // color"): was `bg-lyra-bg-surface-overlay` (a prior explicit
          // request to stand out from the page in dark mode — see this
          // file's own git history for that reasoning). `surface-
          // container-subtle` is this design system's actual "neutral"
          // surface token — the same one `Icon`'s own `background="neutral"`
          // variant maps to (icon.tsx) and the same one `SidePanel` uses
          // for its own panel surface (side-panel.tsx) — a plain neutral
          // gray container (`#fbfcfe` light / `#262626` dark) rather than
          // the lighter, "stands out" white/near-white treatment
          // `surface-overlay` gave it.
          "border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle",
          // `px-3 py-2` (was `px-2 py-1`) — per later explicit follow-up
          // request/reference screenshot ("make the voice controls
          // larger"): a little more breathing room around the now-taller
          // icon+label `WideCallControlButton`s (each roughly h-16 now,
          // was h-8) so they don't sit flush against this card's own
          // border.
          "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2"
        )}
      >
        {/* Three real flex slots now (timer / main buttons+volume / dark
            mute+video+End Call), replacing the former two-slot layout — per
            explicit request/reference screenshot ("update the call control
            button order to be like the attached screenshot"). The
            screenshot's own left-to-right shape is: a timer alone at the
            far left with a large gap after it, a centered cluster of
            lighter/decorative controls, a divider, a visibly DARKER
            mute+video pair, then a large red "End Call" button anchored to
            the far right. `justify-between` on this row still does the
            bookending work (leading/trailing slots `shrink-0`, middle slot
            `flex-1`+`justify-center` claims whatever space is left and
            centers its own contents within it) — same mechanism the old
            two-slot layout already used, just with a third slot added and
            the controls redistributed among all three. */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Avatar chip + identity line — added per explicit request/
              reference screenshot ("add the customer avatar. Add the name /
              number/email above the timer"). Only renders while the caller
              has passed `customerLabel` through (see that prop's own doc
              comment) — same "omit to render nothing extra" fallback the
              rest of this bar's optional props already follow, so an
              existing caller that hasn't wired customer identity through
              yet is unaffected. Purple background reuses this app's own
              existing "Voice channel = purple" accent convention (see this
              file's own top doc comment); the fallback glyph is explicitly
              `text-white` per a follow-up clarification ("keep it white
              though not black") rather than this design system's default
              (dark) icon color. */}
          {customerLabel && (
            <div
              aria-hidden="true"
              // Per a later explicit follow-up request ("update the purple
              // plus to be a primary avatar with the users initials"):
              // swapped from this app's own "Voice channel = purple" accent
              // (see this file's own top doc comment for that original
              // reasoning) to lyra-ui's actual `Button`-`"default"`-variant
              // primary token pair (`bg-lyra-bg-primary` +
              // `text-lyra-fg-on-primary`) and a generic `User` outline
              // glyph in place of `Plus` — matching `interaction-nav-item
              // .tsx`'s own no-contact-match avatar fallback (a person
              // outline, not the quickdial-specific `Plus` this bar
              // originally reused) now that a real design-system component
              // (lyra-ui's `VoiceCallControls`) exists to be consistent
              // with.
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lyra-bg-primary"
            >
              {customerInitials ? (
                <span className="lyra-label-sm text-lyra-fg-on-primary">{customerInitials}</span>
              ) : (
                <User className="h-4 w-4 text-lyra-fg-on-primary" strokeWidth={1.5} />
              )}
            </div>
          )}
          <div className="flex min-w-0 flex-col justify-center">
            {customerLabel && (
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="lyra-body-sm truncate text-lyra-fg-primary">{customerLabel}</span>
                {/* Conference indicator — per explicit follow-up request
                    ("show in the voice control bar that there is a
                    conference happening. A label and/or icon calling
                    attention that this call is in a conference"): once any
                    colleague is actually merged in. Same `Users` glyph the
                    left-nav assignment card now also shows for this exact
                    state (`InteractionNavItemProps.isConferenceCall`,
                    interaction-nav-item.tsx) — one consistent "this is a
                    conference" signal across both surfaces.

                    Per a design critique (this one "Conference" tag used to
                    ALSO cover a Merge-Calls bridge — two structurally
                    different relationships rendering as the exact same
                    chip, with no way to tell which kind of multi-party
                    state was actually active): this tag is now SCOPED to
                    `colleagues` only — an internal agent/skill merged into
                    this one customer's own thread — and a second, separate
                    "Merged call" tag (below) covers the bridged-interaction
                    case instead. Both can render at once (gap-1 between
                    them via the parent's own `gap-1.5`), reflecting that
                    they really are two independent things that can both be
                    true on the same call at the same time — collapsing
                    that reality down to a single chip is exactly what
                    created the ambiguity. */}
                {colleagues.length > 0 && (
                  <Tag
                    label="Conference"
                    variant="info"
                    shape="pill"
                    className="shrink-0"
                    icon={<Users className="h-3 w-3" strokeWidth={1.5} />}
                  />
                )}
                {/* Merged-call indicator — a Merge-Calls bridge (two fully
                    separate Interactions spliced together), distinct from
                    the internal "Conference" case above. Reuses `Merge`,
                    the SAME icon the "Merge Calls" kebab menu item already
                    uses (channel-row.tsx) — one consistent glyph for this
                    concept across the entry point and the resulting state,
                    same reasoning the Conference tag's own `Users` glyph
                    already follows for ITS concept. `teal` (one of Tag's
                    three fixed categorical-accent variants — see
                    `TagVariant`'s own doc comment, tag.tsx) rather than
                    `info` specifically so it reads as a visually distinct
                    category from the blue "Conference" tag, not a second
                    copy of the same status color. */}
                {!!mergedInteractions?.length && (
                  <Tag
                    label="Merged call"
                    variant="teal"
                    shape="pill"
                    className="shrink-0"
                    icon={<Merge className="h-3 w-3" strokeWidth={1.5} />}
                  />
                )}
              </span>
            )}
            {/* Timer — moved here from its old trailing position (see this
              bar's own git history: "move the timer to the far right after
              volume") per the reference screenshot, which shows the
              timer/status leading the WHOLE bar on the far left instead.
              Digits/width behavior unchanged (see the comment that used to
              sit here for the "why" of the fixed `w-[34px]` digit width and
              `tabular-nums`) — only its position moved, and its own
              trailing divider is dropped since it's now alone in the
              leftmost slot with nothing to its left to separate from.
              Per explicit follow-up request ("when record is enabled make
              the clock icon on the left of the timer a red badge"): the
              leading glyph now swaps from the plain `Clock` outline to a
              solid red `Circle` — the SAME icon+fill/text color pair
              (`fill-lyra-status-critical-strong text-lyra-status-critical-
              strong`) the Record button below already uses for its own
              filled/active state, so this reuses an existing "recording"
              treatment instead of inventing a new badge style — whenever
              `recording` is on, reverting to the plain clock the instant
              recording stops. Per an explicit follow-up request ("make the
              red dot next to the timer pulse or animate when recording"):
              `animate-pulse` (Tailwind's own built-in fade in/out keyframe,
              already relied on elsewhere in this app for "something's
              live" affordances) is added here so the dot itself breathes
              while recording, on top of its plain solid-red look — the
              Record button's own filled-red `Circle` (just below, in the
              decorative cluster) intentionally keeps its plain static fill:
              this pulsing is specific to the badge this request named, not
              a blanket "recording" treatment applied everywhere red shows
              up in this bar. */}
          {elapsedSeconds !== undefined && (
            <span
              className="flex items-center gap-1 lyra-body-sm text-lyra-fg-secondary"
              aria-label={`Call duration ${formatElapsedTime(elapsedSeconds)}`}
            >
              {recording ? (
                <Circle
                  className="h-4 w-4 shrink-0 fill-lyra-status-critical-strong text-lyra-status-critical-strong animate-pulse"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              ) : (
                <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              )}
              <span className="w-[34px] shrink-0 text-right tabular-nums">{formatElapsedTime(elapsedSeconds)}</span>
            </span>
          )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-stretch justify-center gap-1">
          {/* Decorative cluster — Hold/Mask/Record/Keypad/Transcript/Volume,
              unchanged in behavior/styling from before, just relocated out
              of the old leading `justify-start` slot into this slot
              (originally `justify-center`, then briefly `justify-end` per
              an explicit follow-up request — "move the middle buttons to
              the right" — so this cluster sat flush against the divider/
              dark-cluster/End Call group that follows it). Per a LATER
              explicit follow-up request/reference screenshot ("center the
              hold through volume buttons when the call controls expand and
              add separators to the left and right around these buttons"):
              back to `justify-center` — so this cluster centers within
              whatever open space the leading/trailing `shrink-0` slots
              leave it once this bar is wider than its own contents need —
              now bracketed by its own leading/trailing dividers (the first
              child below, and the one right after `CompactVolumeButton`
              further down) instead of relying on the trailing dark
              cluster's divider to read as this group's right edge. Those
              two dividers are deliberately INSIDE this centered flex item
              (not floated at the leading/trailing slot boundaries) so they
              travel with the cluster as it centers, staying flush against
              Hold/Volume at any container width rather than drifting away
              from them into the open space `justify-center` creates on
              either side. `items-stretch` (was `items-center`) is what lets
              those two divider `span`s reach this row's full height via
              their own `self-center`, same reasoning as the trailing dark
              cluster's own divider (see that slot's own comment) — every
              `WideCallControlButton` here is already `h-auto`/content-sized
              regardless of the row's own `align-items`, so this doesn't
              change their height. Mute itself is still OUT of this cluster,
              in the trailing dark group below — see that slot's own
              comment for why. */}
          {/* Left separator — see this slot's own doc comment just above
              for why it lives here (inside the centered flex item) rather
              than at the slot boundary. */}
          <span aria-hidden="true" className="h-4 w-px shrink-0 self-center bg-lyra-border-subtle" />
          {/* No more wrapping `Tooltip` on this or the next several
              controls — per later explicit follow-up request ("label the
              buttons again"), `WideCallControlButton`'s own label is now
              always-visible text, so a hover-only tooltip repeating the
              same word would be pure redundancy. The one exception is
              Record just below, which still wraps a `Tooltip` — its hover
              content is genuinely EXTRA information ("why is this
              disabled") beyond what a two-word label can hold. */}
          {controlsCompact ? (
            <Tooltip content={onHold ? "Resume" : "Hold"} placement="top">
              <CompactCallControlButton
                icon={onHold ? <Play className="h-5 w-5" strokeWidth={1.5} /> : <Pause className="h-5 w-5" strokeWidth={1.5} />}
                active={onHold}
                aria-label={onHold ? "Resume" : "Hold"}
                // Red (critical), not amber (warning) — per explicit follow-up
                // request ("change the hold color from its current color to
                // a red color") — matches `ParticipantChip`'s own per-
                // participant hold icon, which already used critical-red for
                // this exact state.
                className={
                  onHold
                    ? "text-lyra-status-critical-strong bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong"
                    : undefined
                }
                onClick={() => {
                  const next = !onHold;
                  setOnHold(next);
                  setColleagues((prev) => prev.map((c) => ({ ...c, isOnHold: next })));
                }}
                // Disabled during a consult too — `ConsultBanner`'s own
                // two per-party Hold buttons own hold-toggling for that
                // duration (they have to flip the customer's AND the
                // consult leg's hold in lockstep, which this button
                // doesn't know about), and this button's own cascade-to-
                // every-colleague behavior below would otherwise fight it.
                // Also disabled once this call is bridged into a merged
                // call (`mergedInteractions`) — holding one leg of a
                // merge has no clear meaning once two independent
                // customers are actually on the same bridge (see that
                // prop's own doc comment).
                disabled={isEnding || !!consult || !!mergedInteractions?.length}
              />
            </Tooltip>
          ) : (
            <WideCallControlButton
              icon={onHold ? <Play className="h-5 w-5" strokeWidth={1.5} /> : <Pause className="h-5 w-5" strokeWidth={1.5} />}
              label={onHold ? "Resume" : "Hold"}
              active={onHold}
              // Red (critical), not amber (warning) — see the compact
              // variant's own identical comment just above.
              className={
                onHold
                  ? "text-lyra-status-critical-strong bg-lyra-status-critical-subtle hover:text-lyra-status-critical-strong"
                  : undefined
              }
              onClick={() => {
                const next = !onHold;
                setOnHold(next);
                setColleagues((prev) => prev.map((c) => ({ ...c, isOnHold: next })));
              }}
              disabled={isEnding || !!consult || !!mergedInteractions?.length}
            />
          )}
          {controlsCompact ? (
            <Tooltip content="Mask" placement="top">
              <CompactCallControlButton
                icon={
                  masked ? (
                    <AudioLinesOff className="h-5 w-5" strokeWidth={1.5} />
                  ) : (
                    <AudioLines className="h-5 w-5" strokeWidth={1.5} />
                  )
                }
                active={masked}
                aria-label="Mask"
                onClick={() => {
                  const next = !masked;
                  setMasked(next);
                  if (next && recording) {
                    setRecording(false);
                  }
                }}
                disabled={isEnding}
              />
            </Tooltip>
          ) : (
            <WideCallControlButton
              // Per explicit request ("use audio lines and audio lines off
              // for the masking icon"): swaps between `AudioLines`/
              // `AudioLinesOff` on `masked`, mirroring the existing
              // `Mic`/`MicOff` toggle just below (`muted ? MicOff : Mic`) —
              // the slashed icon shows while the effect (masking the real
              // voice signal) is actively engaged. Requires
              // lucide-react >=1.33.0 (bumped in package.json), the first
              // published version that includes `AudioLinesOff` — it does
              // not exist in the 0.468.0 that was previously pinned.
              icon={
                masked ? (
                  <AudioLinesOff className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <AudioLines className="h-5 w-5" strokeWidth={1.5} />
                )
              }
              label="Mask"
              active={masked}
              onClick={() => {
                const next = !masked;
                setMasked(next);
                // Per explicit request ("when voice masking is on
                // recording must turn off and become disabled"): masking
                // the real voice signal and recording it are mutually
                // exclusive, so turning masking ON forces any in-progress
                // recording off — the Record button itself is disabled
                // just below for as long as masking stays on, so there's
                // no way to start a new one until masking is turned back
                // off.
                if (next && recording) {
                  setRecording(false);
                }
              }}
              // See `isEnding`'s own doc comment above.
              disabled={isEnding}
            />
          )}
          {/* Record — `Tooltip`'s `content` now covers two reasons to
              show it: the existing masked-explanation text (unchanged), OR,
              once icon-only below 991px (`controlsCompact`), the button's
              own label (there's no visible label text left to read it off
              in that rendering). `disabled` only suppresses it when
              NEITHER applies. `recordDisabled` (see its own doc comment
              above) drives BOTH renderings' actual disabled behavior now,
              via `aria-disabled` rather than native `disabled` — the ADA
              fix this whole block exists for. */}
          <Tooltip
            content={masked ? "Recording disabled while masking is on" : recording ? "Stop" : "Record"}
            placement="top"
            disabled={!masked && !controlsCompact}
          >
            {controlsCompact ? (
              <CompactCallControlButton
                icon={
                  <Circle
                    className={cn("h-5 w-5", recording && "fill-lyra-status-critical-strong text-lyra-status-critical-strong")}
                    strokeWidth={1.5}
                  />
                }
                active={recording}
                aria-label={recording ? "Stop" : "Record"}
                aria-disabled={recordDisabled}
                className={recordDisabled ? "opacity-40" : undefined}
                onClick={() => {
                  if (recordDisabled) return;
                  setRecording((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (recordDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                  }
                }}
              />
            ) : (
              <WideCallControlButton
                icon={
                  <Circle
                    className={cn("h-5 w-5", recording && "fill-lyra-status-critical-strong text-lyra-status-critical-strong")}
                    strokeWidth={1.5}
                  />
                }
                label={recording ? "Stop" : "Record"}
                active={recording}
                aria-disabled={recordDisabled}
                className={recordDisabled ? "opacity-40" : undefined}
                onClick={() => {
                  if (recordDisabled) return;
                  setRecording((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (recordDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                  }
                }}
              />
            )}
          </Tooltip>
          {/* Keypad — no more wrapping `Tooltip` (see the block comment a
              few controls up for why) — `Popover`'s own Radix trigger
              still clones its click/ref/aria props straight onto its
              immediate child, which is exactly what `WideCallControlButton`
              being `forwardRef`+`...rest` is for (see that component's own
              doc comment). `aria-label` set directly on it (flows through
              its own `...rest` spread) is now redundant with its own
              visible label text, but harmless to leave. */}
          <Popover
            open={keypadOpen && !isEnding}
            onOpenChange={(next: boolean) => {
              if (!isEnding) setKeypadOpen(next);
            }}
            placement="top"
            bodyPadding={false}
            content={<DialPad />}
          >
            {controlsCompact ? (
              // Native `title` (not `Tooltip`) — `Tooltip`'s own
              // `asChild`/`Slot` cloning and `Popover`'s do the same thing
              // to the same immediate child, so nesting one inside the
              // other here silently drops whichever one's props land on a
              // plain (non-forwardRef, non-rest-spreading) wrapper
              // component instead of the real `<button>`. A native title
              // attribute needs no such wiring and still names the button
              // for anyone hovering it.
              <CompactCallControlButton
                icon={<Grid3x3 className="h-5 w-5" strokeWidth={1.5} />}
                active={keypadOpen}
                aria-label="Keypad"
                title="Keypad"
                disabled={isEnding}
              />
            ) : (
              <WideCallControlButton
                icon={<Grid3x3 className="h-5 w-5" strokeWidth={1.5} />}
                label="Keypad"
                active={keypadOpen}
                aria-label="Keypad"
                // See `isEnding`'s own doc comment above — `handleHangUp`
                // also force-closes this popover directly (`setKeypadOpen
                // (false)`) rather than relying on this alone, since
                // `disabled` only blocks NEW opens, not one already open.
                disabled={isEnding}
              />
            )}
          </Popover>
          {/* Consult — per explicit request ("add a conference icon and
              interaction to the voice controls ... match our app's existing
              convention"), then built out further per a later explicit
              follow-up ("continue to build this conference flow out ...
              follow stoker-agent-test for the merge conference call flow"),
              then per a later explicit follow-up ("change the conference
              icon in the voice bar to the consult transfer icon. Change the
              word 'conference' to Consult") renamed/re-iconed to match the
              record header's own "Consult / Transfer" button exactly
              (`TransferIcon`, same composite `ConsultTransferIcon`
              recreates in lyra-ui's channel-row.tsx — see that function's
              own doc comment) — that header button now opens this SAME
              popover too (`conferenceOpen`/`onConferenceOpenChange` below),
              so the two read as one shared "Consult" action regardless of
              which button triggered it, not two separate features that
              happen to look alike. Picking a row in `ConferencePicker` no
              longer adds anyone directly — it starts a real consult
              (`setConsult`, `handleCancelConsult`/`handleMergeConsult`
              above), auto-holding the primary customer exactly the way the
              reference's `startVoiceCallConsult` does, with
              `ConsultBanner`/the participant strip (both rendered above
              this row, below) as the actual merge UI. `disabled` includes
              `!!consult` — only one consult can be in flight at a time,
              same as the reference (there's no second Cancel/Merge banner
              to show while one's already open); already-merged colleagues
              don't block reopening this to add another. */}
          <Popover
            open={conferenceOpen && !isEnding}
            onOpenChange={(next: boolean) => {
              if (!isEnding) setConferenceOpen(next);
            }}
            // Per explicit request ("show the consult popup next to that
            // selection, so a user doesn't have to jump away from where
            // they just clicked"): this popover used to always anchor HERE
            // (this button), even when it was actually opened from the
            // record-header's own separate "Consult / Transfer" icon
            // (agent-next-gen-transcript.tsx) — clicking that button popped
            // this SAME popover open, but visibly in the wrong place (down
            // here) regardless of where the agent actually clicked.
            // `consultAnchorRef` (lifted to the page, cleared back to
            // `null` whenever this popover closes — see each page's own
            // `onConferenceOpenChange` wrapper) repositions it onto
            // whichever element actually triggered the open instead; once
            // cleared/`null` again, `children` (this button) goes back to
            // being the anchor, same `virtualAnchorRef` escape hatch the
            // "Merge Calls" picker already uses (AgentWorkspace2WithDeskPage.tsx)
            // for the identical "opened from somewhere else entirely"
            // situation. `asAnchor` is permanent (not conditional) here,
            // since this button now drives `open` through its own explicit
            // `onClick` below instead of relying on Radix's Trigger-
            // injected click — `asAnchor` is what stops THAT injected click
            // from also firing and immediately re-toggling right back.
            asAnchor
            virtualAnchorRef={consultAnchorRef}
            placement="top"
            bodyPadding={false}
            content={
              <ConferencePicker
                onSelect={(person) => {
                  setConferenceOpen(false);
                  setConsult({ id: person.id, name: person.name, isOnHold: false });
                  setOnHold(true);
                }}
              />
            }
          >
            {controlsCompact ? (
              <CompactCallControlButton
                ref={consultButtonSelfRef}
                icon={<TransferIcon />}
                active={conferenceOpen}
                aria-label="Consult"
                title="Consult"
                disabled={isEnding || !!consult}
                // `asAnchor` above means this button no longer gets a
                // click-to-toggle for free from Radix's own Trigger wiring
                // — replaces it explicitly, same open/close toggle Radix's
                // injected handler used to perform. Explicitly (re)sets the
                // anchor to ITSELF on every open — see
                // `consultButtonSelfRef`'s own doc comment for why this
                // bar can't just lean on `consultAnchorRef` reverting to
                // `null`/`children` on close.
                onClick={() => {
                  if (isEnding || consult) return;
                  const next = !conferenceOpen;
                  if (next) consultAnchorRef && (consultAnchorRef.current = consultButtonSelfRef.current);
                  setConferenceOpen(next);
                }}
              />
            ) : (
              <WideCallControlButton
                ref={consultButtonSelfRef}
                icon={<TransferIcon />}
                label="Consult"
                active={conferenceOpen}
                aria-label="Consult"
                // See `isEnding`'s own doc comment above — `handleHangUp`
                // also force-closes this popover directly (`setConference
                // Open(false)`) rather than relying on this alone, same
                // reasoning Keypad's identical prop already gives.
                disabled={isEnding || !!consult}
                // See the compact variant's own identical comment just above.
                onClick={() => {
                  if (isEnding || consult) return;
                  const next = !conferenceOpen;
                  if (next) consultAnchorRef && (consultAnchorRef.current = consultButtonSelfRef.current);
                  setConferenceOpen(next);
                }}
              />
            )}
          </Popover>
          {/* Transcript — per an earlier explicit follow-up request ("take
              the transcript button out of the volume dropdown and put it to
              the left of the volume button"): its own plain
              `WideCallControlButton`, same as every other control in this
              centered cluster. Static "Transcript" label regardless of
              `transcriptOpen` (same convention Mask already uses — a
              static label, with `active` tinting alone signaling on/off —
              "Show transcript"/"Hide transcript" was fine as hover-only
              `Tooltip` content, but doesn't fit this button's fixed 80px
              column as a permanently-visible label without wrapping or
              truncating). `onToggleTranscript` omitted entirely still
              hides this trigger. */}
          {onToggleTranscript && (controlsCompact ? (
            <Tooltip content="Transcript" placement="top">
              <CompactCallControlButton
                icon={<FileText className="h-5 w-5" strokeWidth={1.5} />}
                active={transcriptOpen}
                aria-label="Transcript"
                onClick={onToggleTranscript}
                disabled={isEnding}
              />
            </Tooltip>
          ) : (
            <WideCallControlButton
              icon={<FileText className="h-5 w-5" strokeWidth={1.5} />}
              label="Transcript"
              active={transcriptOpen}
              onClick={onToggleTranscript}
              // See `isEnding`'s own doc comment above.
              disabled={isEnding}
            />
          ))}
          <CompactVolumeButton volume={volume} onVolumeChange={setVolume} disabled={isEnding} compact={controlsCompact} />
          {/* Right separator — see the leading one's own doc comment
              (this slot's opening `<div>`, above) for why this lives here,
              right after `CompactVolumeButton`, rather than at this slot's
              trailing boundary. */}
          <span aria-hidden="true" className="h-4 w-px shrink-0 self-center bg-lyra-border-subtle" />
        </div>
        <div className="flex shrink-0 items-stretch gap-2">
          {/* Mute — moved out of the centered cluster above and given
              `strong` (see `WideCallControlButton`'s own doc comment for
              what that darkens) per the reference screenshot, which shows
              this icon visibly darker than the rest of the bar. Behavior
              unchanged; no more wrapping `Tooltip` (see the block comment
              a few controls up for why). */}
          {controlsIconOnly ? (
            <Tooltip content={muted ? "Unmute" : "Mute"} placement="top">
              <CompactCallControlButton
                icon={muted ? <MicOff className="h-5 w-5" strokeWidth={1.5} /> : <Mic className="h-5 w-5" strokeWidth={1.5} />}
                active={muted}
                strong
                variant="outline"
                aria-label={muted ? "Unmute" : "Mute"}
                onClick={() => setMuted((m) => !m)}
                disabled={isEnding}
              />
            </Tooltip>
          ) : (
            <WideCallControlButton
              icon={muted ? <MicOff className="h-5 w-5" strokeWidth={1.5} /> : <Mic className="h-5 w-5" strokeWidth={1.5} />}
              label={muted ? "Unmute" : "Mute"}
              active={muted}
              strong
              // Per explicit request ("make the mute / video buttons
              // outline icon buttons") — see `WideCallControlButton`'s own
              // `variant` doc comment.
              variant="outline"
              onClick={() => setMuted((m) => !m)}
              // See `isEnding`'s own doc comment above.
              disabled={isEnding}
            />
          )}
          {/* Add video — same `strong` darkening as Mute per the reference
              screenshot (only visible in practice where `showAddVideo` is
              true, i.e. Phase 2 — Phase 1 hides this button entirely, see
              `showAddVideo`'s own doc comment above).
              Per an explicit bug report ("the video button state is
              backwards - a line through it indicates no video"): the
              icon swap here had the slashed/plain `VideoOff`/`Video` pair
              inverted relative to every other toggle in this bar (compare
              Mute just above: the SLASHED `MicOff` shows when muted is
              OFF-state, the plain `Mic` when it's on) — this button was
              instead showing the slashed `VideoOff` glyph while video WAS
              added (the on-state) and the plain camera while it wasn't.
              Swapped so slashed = off (no video), plain = on (video added),
              matching Mute's own convention; `active`/label/click behavior
              below are unchanged, only which icon renders for which state,
              and (per the same "label the buttons again" request as every
              other control here) a visible label instead of a hover-only
              `Tooltip`. */}
          {showAddVideo && (controlsIconOnly ? (
            <Tooltip content={videoAdded ? "Remove video" : "Add video"} placement="top">
              <CompactCallControlButton
                icon={videoAdded ? <Video className="h-5 w-5" strokeWidth={1.5} /> : <VideoOff className="h-5 w-5" strokeWidth={1.5} />}
                active={videoAdded}
                strong
                variant="outline"
                aria-label={videoAdded ? "Remove video" : "Add video"}
                onClick={() => {
                if (onToggleVideo) {
                  onToggleVideo();
                  return;
                }
                setLocalVideoAdded((prev) => !prev);
              }}
                disabled={isEnding}
              />
            </Tooltip>
          ) : (
            <WideCallControlButton
              icon={videoAdded ? <Video className="h-5 w-5" strokeWidth={1.5} /> : <VideoOff className="h-5 w-5" strokeWidth={1.5} />}
              label={videoAdded ? "Remove video" : "Add video"}
              active={videoAdded}
              strong
              // Per explicit request ("make the mute / video buttons
              // outline icon buttons") — see `WideCallControlButton`'s own
              // `variant` doc comment.
              variant="outline"
              onClick={() => {
                if (onToggleVideo) {
                  onToggleVideo();
                  return;
                }
                setLocalVideoAdded((prev) => !prev);
              }}
              // See `isEnding`'s own doc comment above.
              disabled={isEnding}
            />
          ))}
          {/* End Call — per explicit request ("make the leave button big
              and red and have it say 'end call'"): this used to be a plain
              icon-only `CompactCallControlButton` with `critical` styling
              (a small red PhoneOff glyph, label only reachable via
              `Tooltip`) same as every other control in this bar. It's now a
              real lyra-ui `Button` instead — `variant="destructive"` is
              this design system's own solid-red/filled treatment (see
              button.tsx: `bg-lyra-bg-destructive` + `text-lyra-fg-on-
              primary`, the same token pair every other destructive action
              in this app already uses). Label is now always-visible text
              ("End Call") next to the icon instead of hidden behind a hover
              `Tooltip`, so no `Tooltip` wrapper here anymore — a `Button`
              with visible text content already has its own accessible
              name. Size was originally `lg` (h-9) to read as "big" against
              the surrounding h-8 icon buttons; per an explicit follow-up
              request ("make the red button smaller") this became `default`
              (h-8) instead, matching the row's own then-h-8 icon buttons
              exactly. Bumped back to `lg` (h-9) here per a later explicit
              follow-up request/reference screenshot ("make the voice
              controls larger... keep the End Call button filled red") —
              every OTHER control in this bar just grew from a flat h-8
              icon-only button to a taller icon+label column
              (`WideCallControlButton`, `h-auto` with `py-2` — roughly h-16
              in practice), so `default` would now read as visibly SMALLER
              than its neighbors instead of matching them. Still
              `variant="destructive"` (filled red, unchanged) and still its
              own real `Button` with a visible label — only the size moved,
              exactly as asked.
              Per a later explicit follow-up request ("make the end call
              button the same height as the mute and add video buttons"):
              `size="lg"`'s own fixed `h-9` is overridden here to `h-auto`
              (via `cn()`'s tailwind-merge, same "last one wins" mechanism
              `wrap`'s own doc comment in button.tsx describes) so this
              button no longer sits at a fixed height while its neighbors
              have grown taller — instead it now stretches to match
              whichever of Mute/Add video is tallest, via this row's own
              `items-stretch` (see the divider's own comment just above for
              why it needed an explicit `self-center` once the row stopped
              using `items-center`). `size="lg"` is still passed for its
              padding/typography, just no longer for its height.
              Per explicit follow-up request ("when end call is clicked
              transition the end call button to a hanging up state
              (disabled)"): once `isEnding` is set (`handleHangUp` above),
              this button disables itself (lyra-ui's own `disabled:opacity-
              40`/`disabled:pointer-events-none`, same dimmed-and-inert look
              every other disabled control in this bar already gets — see
              button.tsx) and swaps its icon+label for an inverse `Spinner`
              + "Hanging Up..." — the one visible cue (besides the rest of
              the bar disabling alongside it) that the click registered
              while `onHangUp` itself is deferred behind the exit
              animation (see `isEnding`'s own doc comment above). */}
          {/* Below 768px (`controlsIconOnly`, this file's own top doc
              comment): same `variant="destructive"` `Button`, just
              icon-only at a fixed 40px (`h-10 w-10`, matching every other
              icon-only control at this width — `CompactCallControlButton`
              itself isn't reused here since End Call is deliberately a
              plain `Button`, not part of that shared icon-button
              component, per this block's own doc comment above) instead
              of the icon+"End Call"/"Hanging Up..." text column, with a
              `Tooltip` standing in for the now-hidden label. */}
          {controlsIconOnly ? (
            <Tooltip content={isEnding ? endingLabel : endCallLabel} placement="top">
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleHangUp}
                disabled={isEnding}
                aria-label={isEnding ? endingLabel : endCallLabel}
              >
                {isEnding ? (
                  <Spinner variant="circle" size="sm" color="inverse" label="Hanging up" />
                ) : (
                  <PhoneOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              className="h-auto shrink-0 gap-1.5"
              onClick={handleHangUp}
              disabled={isEnding}
            >
              {isEnding ? (
                <Spinner variant="circle" size="sm" color="inverse" label="Hanging up" />
              ) : (
                <PhoneOff className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              )}
              {isEnding ? endingLabel : endCallLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
