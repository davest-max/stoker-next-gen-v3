// Email Focus card — a rough, debate-stage mockup swapped in for Contact
// History on the Home dashboard (see AgentWorkspace2WithDeskPage.tsx's own
// `showEmailFocusCard`/`SHOW_CONTACT_HISTORY_CARD` toggle) for a proposed
// new scenario: an agent whose work is almost entirely email, juggling a
// dozen-ish "Pending" (already replied to once, waiting on the customer)
// interactions at a time, plus whatever auto-routing assigned them while
// they were logged out, plus the odd inbound email to their general skill
// that looks urgent enough to jump the line.
//
// This is "Concept B" from that debate (stacked sections, one scroll,
// nothing behind a tab click) — three sections in one card, top to bottom:
//   1. New Since Login   — auto-assigned, not yet opened. A flagged one
//      (`priority: true`) gets its own "Priority" pill so it can't blend
//      into routine volume.
//   2. Replied — Respond Now — a customer responded to a Pending email;
//      highlighted (info-subtle background, matching the "selected row"
//      treatment `ContactHistoryCard`/`ChannelRow` already use elsewhere in
//      this app) so it can't be mistaken for the quiet list below it.
//   3. Pending — the rest of the dozen, quiet/muted, sorted oldest-wait-
//      first — nothing new here, just what the agent is still waiting on.
//
// Deliberately NOT wired to any real interaction/routing state yet — same
// "purely decorative, fake it with a toast" convention this app's other
// not-yet-real prototype controls already follow (Consult/Transfer, Add
// Participant, etc.) — `onSelectItem` is optional and, when provided, is
// expected to just surface a toast for now rather than actually reopening
// anything. This file's data (`EMAIL_FOCUS_NEW_SINCE_LOGIN`/
// `EMAIL_FOCUS_REPLIED`/`EMAIL_FOCUS_PENDING`) is hand-authored mock
// content for the debate, the same way `CONTACT_HISTORY` is in
// agent-next-gen-contact-history.tsx — not derived from any real customer
// database.
import { useState, useMemo } from "react";
import {
  DashboardCard,
  Icon,
  Tag,
  Badge,
  Button,
  SearchInput,
} from "@nicecxone/lyra-ui";
import { cn } from "@/lib/utils";
import { Mail, Flame, Reply, Clock, Inbox } from "lucide-react";
import type { ContactHistoryEntry } from "./agent-next-gen-contact-history";

/** Which of the card's three sections a row/click came from — the row
 *  itself (`EmailFocusItem`) carries no such marker, so this is threaded
 *  through separately by whichever section's `.map()` renders it (see the
 *  three call sites below), the only place that actually knows. */
export type EmailFocusSection = "new" | "replied" | "pending";

export interface EmailFocusItem {
  id: string;
  customerName: string;
  /** Email subject line, or a one-line snippet of the relevant message —
   *  whichever reads more usefully for that section (subject for a new,
   *  unopened email; the customer's own reply snippet once one lands). */
  subject: string;
  skillName: string;
  /** Right-aligned time label — the clock time (e.g. "9:52 AM") a new
   *  arrival came in or a customer replied, for New Since Login/Replied;
   *  "3d 4h" for how long a Pending item has been waiting (a duration, not
   *  a point in time, so it keeps its own format). Pre-formatted, same
   *  convention `ContactHistoryEntry.timeAgo` already uses, rather than a
   *  raw timestamp this component would need to format itself. */
  timeLabel: string;
  /** New-Since-Login items only: flags an inbound email that looks like it
   *  needs to jump the queue (e.g. urgent language, a VIP account) — per
   *  the debate's third requirement ("notified if there is a new email
   *  coming in ... that looks like it needs to be prioritized"). Renders a
   *  "Priority" pill instead of the plain skill-routed treatment. */
  priority?: boolean;
}

export interface EmailFocusCardProps {
  newSinceLogin: EmailFocusItem[];
  replied: EmailFocusItem[];
  pending: EmailFocusItem[];
  /** Fired by clicking any row, in any section — a New Since Login/Replied
   *  row opens straight into a live left-rail assignment (this is already-
   *  arrived or already-answered mail, nothing left to peek at first);
   *  Pending's own click instead means "show me a preview" (it's still
   *  waiting on the customer, so a full takeover isn't the point yet) —
   *  see `section`, which is the only way to tell those apart, since
   *  `EmailFocusItem` itself carries no such marker. Omit to render every
   *  row as plain, non-interactive content. */
  onSelectItem?: (item: EmailFocusItem, section: EmailFocusSection) => void;
  /** Same "All Contacts" header button `ContactHistoryCard` already has
   *  (that card's own doc comment has the full history) — per explicit
   *  request, this card needs the same jump-to-the-full-table escape
   *  hatch. Labeled "Search App" here (not "All Contacts") — matches that
   *  destination page's own renamed title/breadcrumb (`"Search App"`,
   *  AgentWorkspace2WithDeskPage.tsx) per a later explicit follow-up
   *  ("Search Page" was this card's first pass at the rename, before the
   *  page title itself was also changed) — same destination/handler
   *  either way, just this card's own copy for it. Omit to render the
   *  header with no such button, same as `ContactHistoryCard`'s own
   *  default. */
  onOpenAllContacts?: () => void;
}

function EmailFocusRow({
  item,
  section,
  onSelectItem,
  variant = "default",
  isFirst,
}: {
  item: EmailFocusItem;
  section: EmailFocusSection;
  onSelectItem?: (item: EmailFocusItem, section: EmailFocusSection) => void;
  /** Suppresses the row's own top divider — see `ContactHistoryCard`'s
   *  identical `i > 0 && "border-t border-lyra-border-subtle"` convention
   *  (agent-next-gen-contact-history.tsx), matched here so a section's
   *  first row doesn't get a stray line against its own bordered box. */
  isFirst?: boolean;
  /** "highlighted" — a green accent for the "Replied" section (not the
   *  row-selection blue `ContactHistoryCard`'s/`ChannelRow`'s own
   *  `highlighted` state uses elsewhere — picked so this section's own
   *  color identity, badge/row accent/the "Replied" pill below, never has
   *  to compete with New Since Login's blue "just arrived" identity). Per
   *  explicit follow-up ("opposite of that, swap colors in the replied
   *  section" — reversing an immediately-prior request that had put the
   *  full fill on the HEADER and a left accent bar on the rows): this row
   *  now carries the left accent bar (`border-l-4`, no full background
   *  fill), while `EmailFocusSectionHeader`'s own "highlighted" variant
   *  carries the full `bg-lyra-status-success-subtle` fill — the two
   *  swapped which element gets which treatment, see that component's own
   *  doc comment for the same history. */
  variant?: "default" | "highlighted";
}) {
  return (
    <div
      role={onSelectItem ? "button" : undefined}
      tabIndex={onSelectItem ? 0 : undefined}
      onClick={() => onSelectItem?.(item, section)}
      onKeyDown={(e) => {
        if (onSelectItem && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelectItem(item, section);
        }
      }}
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3 transition-colors",
        variant === "highlighted"
          ? "border-l-4 border-lyra-status-success-strong hover:bg-lyra-state-hover"
          : "hover:bg-lyra-state-hover",
        onSelectItem && "cursor-pointer",
        !isFirst && "border-t border-lyra-border-subtle"
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="lyra-body-md-emphasis text-lyra-fg-default">{item.customerName}</span>
          {item.priority && (
            <Tag
              label="Priority"
              variant="critical"
              shape="pill"
              icon={<Flame className="h-3 w-3" strokeWidth={1.5} />}
            />
          )}
          {variant === "highlighted" && (
            <Tag
              label="Replied"
              variant="success"
              shape="pill"
              icon={<Reply className="h-3 w-3" strokeWidth={1.5} />}
            />
          )}
        </div>
        <span className="lyra-body-md text-lyra-fg-secondary truncate">{item.subject}</span>
        <span className="lyra-body-sm text-lyra-fg-secondary">{item.skillName}</span>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="inline-flex items-center gap-1 lyra-body-sm text-lyra-fg-secondary whitespace-nowrap">
          <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
          {item.timeLabel}
        </span>
      </div>
    </div>
  );
}

/** Tinted header bar, one per section — per explicit request ("separate
 *  each section more clearly: a little white space? a background color?"),
 *  the same "colored strip with an icon + title" treatment this same
 *  dashboard's own Customer Info (blue)/Autosummary (purple)/Next Best
 *  Action (green) mini-cards already establish, reused here instead of
 *  inventing a new separation technique. Each section gets its own
 *  distinct header color, all three as a full-width background fill: New
 *  Since Login is info/blue ("something just arrived"), Replied is
 *  success/green ("a customer responded, this is a good outcome to act
 *  on"), Pending is warning/amber ("still waiting on something"). Replied
 *  briefly used a left accent bar here instead of a full fill (with the
 *  full fill moved onto its own ROWS, `EmailFocusRow`'s `highlighted`
 *  variant) — per the immediate next explicit follow-up ("opposite of
 *  that, swap colors in the replied section"), that was reversed right
 *  back: the full fill belongs on the header again, and `EmailFocusRow`'s
 *  own `highlighted` variant is what now carries the left accent bar
 *  instead (see that component's own doc comment for the same history).
 *  Only the header bar carries each section's color by default — New
 *  Since Login's/Pending's own rows stay fully plain despite their
 *  colored headers; Replied is the one section with its own row-level
 *  treatment too (the accent bar), for extra emphasis on "respond now"
 *  urgency. Label text is plain Title Case (was `uppercase tracking-wide`)
 *  — per explicit request, matching every other widget's own header
 *  casing (`ContactHistoryCard`'s "My Contact History", the Overview tab's
 *  "Customer Info"/"Autosummary"/"Next Best Action") rather than the
 *  all-caps eyebrow treatment this card started with. */
function EmailFocusSectionHeader({
  label,
  count,
  variant = "default",
}: {
  label: string;
  count: number;
  /** "highlighted" = Replied (success/green, full fill); "pending" =
   *  Pending (warning/amber, full fill). */
  variant?: "default" | "highlighted" | "pending";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2",
        variant === "highlighted"
          ? "bg-lyra-status-success-subtle"
          : variant === "pending"
            ? "bg-lyra-status-warning-subtle"
            : "bg-lyra-status-info-subtle"
      )}
    >
      <span className="lyra-label text-lyra-fg-default">{label}</span>
      <Badge
        shape="circle"
        size="sm"
        variant={variant === "highlighted" ? "success" : variant === "pending" ? "warning" : "info"}
        count={count}
      />
    </div>
  );
}

/** Matches an item against a search query across every field an agent would
 *  actually recognize the email by — customer name, subject/snippet, and
 *  skill — same "name, case ID/subject, channel" convention `ContactHistoryCard`'s
 *  own search already follows for this app's other dashboard card. */
function emailFocusItemMatches(item: EmailFocusItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.customerName.toLowerCase().includes(q) ||
    item.subject.toLowerCase().includes(q) ||
    item.skillName.toLowerCase().includes(q)
  );
}

export function EmailFocusCard({
  newSinceLogin,
  replied,
  pending,
  onSelectItem,
  onOpenAllContacts,
}: EmailFocusCardProps) {
  // Per explicit request ("add a search capability") — one query, same
  // "matches name/subject/skill" rule applied across all three sections at
  // once (there's no per-section search box; an agent typing "Priya"
  // should find her whether she's in Replied or Pending, without first
  // having to know which section she's in).
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim();
  const filteredNewSinceLogin = useMemo(
    () => (query ? newSinceLogin.filter((item) => emailFocusItemMatches(item, query)) : newSinceLogin),
    [newSinceLogin, query]
  );
  const filteredReplied = useMemo(
    () => (query ? replied.filter((item) => emailFocusItemMatches(item, query)) : replied),
    [replied, query]
  );
  const filteredPending = useMemo(
    () => (query ? pending.filter((item) => emailFocusItemMatches(item, query)) : pending),
    [pending, query]
  );

  const hasAnyData = newSinceLogin.length + replied.length + pending.length > 0;
  const hasAnyResults = filteredNewSinceLogin.length + filteredReplied.length + filteredPending.length > 0;

  return (
    <DashboardCard
      variant="neutral-subtle"
      // Same container-query boundary `ContactHistoryCard` establishes for
      // itself (`.lyra-container-header-query-boundary`, lyra-tokens.css) —
      // needed for the same reason: the search box below relocates from
      // `headerActions` (inline, ≥480px) to `headerTabs` (its own full-width
      // row below the title, <480px) via that class's own container query,
      // and that query has to be scoped to this card's root, not the
      // dashboard's shared (wider) grid boundary.
      className="lyra-container-header-query-boundary"
      // "My Emails" — per explicit request (was "Email Focus"). Still this
      // debate's own mockup card underneath, just renamed to read as the
      // agent's own worklist rather than a description of the concept.
      headerTitle="My Emails"
      headerIcon={<Icon icon={Mail} size="md" background="pink" shape="rounded" decorative />}
      // Same slot/sizing/variant `ContactHistoryCard` uses for its own "All
      // Contacts" button — see that card's own `headerTitleBadge` doc
      // comment for the full history (why it sits right after the title
      // instead of out with header actions, why `size="md"`/`variant=
      // "outline"`). Omitted entirely when the prop isn't passed, same
      // convention.
      headerTitleBadge={
        onOpenAllContacts && (
          <Button variant="outline" size="md" onClick={onOpenAllContacts}>
            Search App
          </Button>
        )
      }
      headerActionsWrap
      // Same "two real SearchInputs, one per breakpoint" split
      // `ContactHistoryCard` already uses — see that card's own
      // `headerActions`/`headerTabs` doc comments for the full reasoning
      // (only search relocates at <480px; there's nothing else in this
      // card's header to keep together with it).
      headerActions={
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search emails"
          size="sm"
          className="lyra-container-header-search-inline flex-1 min-w-[240px]"
        />
      }
      headerTabs={
        <div className="lyra-container-header-search-below px-4 pt-3 pb-3">
          <SearchInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search emails"
            size="sm"
            className="w-full"
          />
        </div>
      }
    >
      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <Mail className="h-6 w-6 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          <span className="lyra-body-md text-lyra-fg-secondary">Nothing to Display</span>
        </div>
      ) : !hasAnyResults ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <Inbox className="h-6 w-6 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          <span className="lyra-body-md text-lyra-fg-secondary">No matching emails</span>
        </div>
      ) : (
        // Per explicit request ("separate each section more clearly: a
        // little white space? a background color?"): each section is now
        // its own bordered, rounded box (`overflow-hidden` so the header
        // bar's own background respects those rounded corners) with real
        // margin between them (`mx-4` sides, `mt-3`/`mb-3` — was a single
        // flat list with only a 1px `border-b` between sections and no
        // outer inset at all) rather than one continuous list. `gap-3`
        // on this wrapper (not per-section margin) so the spacing between
        // sections and the card's own top/bottom padding stays consistent
        // regardless of which sections are actually present.
        <div className="flex flex-col gap-3 px-4 py-3">
          {filteredNewSinceLogin.length > 0 && (
            <div className="rounded-lyra-md border border-lyra-border-subtle overflow-hidden">
              <EmailFocusSectionHeader label="New Since Login" count={filteredNewSinceLogin.length} />
              {filteredNewSinceLogin.map((item, index) => (
                <EmailFocusRow key={item.id} item={item} section="new" onSelectItem={onSelectItem} isFirst={index === 0} />
              ))}
            </div>
          )}
          {filteredReplied.length > 0 && (
            <div className="rounded-lyra-md border border-lyra-border-subtle overflow-hidden">
              <EmailFocusSectionHeader
                label="Replied — Respond Now"
                count={filteredReplied.length}
                variant="highlighted"
              />
              {filteredReplied.map((item, index) => (
                <EmailFocusRow
                  key={item.id}
                  item={item}
                  section="replied"
                  onSelectItem={onSelectItem}
                  variant="highlighted"
                  isFirst={index === 0}
                />
              ))}
            </div>
          )}
          {filteredPending.length > 0 && (
            <div className="rounded-lyra-md border border-lyra-border-subtle overflow-hidden">
              <EmailFocusSectionHeader label="Pending" count={filteredPending.length} variant="pending" />
              {filteredPending.map((item, index) => (
                <EmailFocusRow key={item.id} item={item} section="pending" onSelectItem={onSelectItem} isFirst={index === 0} />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

/** Clock-time label (e.g. "9:52 AM") for an event `minutesAgo` minutes back
 *  from now — same hour12/AM-PM formatting `formatInteractionDate` already
 *  uses in agent-next-gen-interactions-table.tsx, computed fresh at module
 *  load the same way that file's own mock `createDateValue`s are (real
 *  `Date` math off `Date.now()`, not a hand-typed guess) so these stay
 *  believable relative to whenever the app actually loads. Used for New
 *  Since Login/Replied only — Pending's own labels are a wait DURATION,
 *  not a point-in-time event, so they keep their "3d 2h"-style format. */
function timeOfDayFromMinutesAgo(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60_000);
  const hour24 = d.getHours();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${hour12}:${minute} ${hour24 >= 12 ? "PM" : "AM"}`;
}

/* ── Mock data for the debate ──
   Hand-authored, same convention CONTACT_HISTORY (agent-next-gen-contact-
   history.tsx) already follows — not derived from CREATE_NEW_CUSTOMERS or
   any other real fixture, since this scenario (a dozen ongoing Pending
   emails) doesn't correspond to anything the rest of this app already
   models. */
export const EMAIL_FOCUS_NEW_SINCE_LOGIN: EmailFocusItem[] = [
  {
    id: "new-1",
    customerName: "Marcus Webb",
    subject: "Re: Account access issue — need this resolved ASAP",
    skillName: "General Support",
    timeLabel: timeOfDayFromMinutesAgo(8),
    priority: true,
  },
  {
    id: "new-2",
    customerName: "Dana Cole",
    subject: "Question about my last invoice",
    skillName: "Billing",
    timeLabel: timeOfDayFromMinutesAgo(22),
  },
  {
    id: "new-3",
    customerName: "Theo Grant",
    subject: "Interested in upgrading my plan",
    skillName: "Sales",
    timeLabel: timeOfDayFromMinutesAgo(41),
  },
];

export const EMAIL_FOCUS_REPLIED: EmailFocusItem[] = [
  {
    id: "replied-1",
    customerName: "Priya Anand",
    subject: "Thanks — that refund makes sense. One more question though...",
    skillName: "Billing",
    timeLabel: timeOfDayFromMinutesAgo(3),
  },
  {
    id: "replied-2",
    customerName: "Erwin de Vera",
    subject: "Still hasn't arrived, can you check again?",
    skillName: "Technical Support",
    timeLabel: timeOfDayFromMinutesAgo(12),
  },
];

export const EMAIL_FOCUS_PENDING: EmailFocusItem[] = [
  { id: "pending-1", customerName: "Sofia Sullivan", subject: "Awaiting response — account upgrade details sent", skillName: "Sales", timeLabel: "3d 2h" },
  { id: "pending-2", customerName: "Noah Ibrahim", subject: "Awaiting response — troubleshooting steps sent", skillName: "Technical Support", timeLabel: "1d 5h" },
  { id: "pending-3", customerName: "Liam Whitfield", subject: "Awaiting response — replacement order confirmed", skillName: "General Support", timeLabel: "5d 1h" },
  { id: "pending-4", customerName: "Isabella Delgado", subject: "Awaiting response — refund policy explained", skillName: "Billing", timeLabel: "2d 8h" },
  { id: "pending-5", customerName: "Ethan Park", subject: "Awaiting response — feature walkthrough sent", skillName: "General Support", timeLabel: "6h" },
  { id: "pending-6", customerName: "Maya Nkemelu", subject: "Awaiting response — escalation update sent", skillName: "Escalations", timeLabel: "4d 3h" },
  { id: "pending-7", customerName: "Caleb Fischer", subject: "Awaiting response — pricing options sent", skillName: "Sales", timeLabel: "1d 1h" },
  { id: "pending-8", customerName: "Zara Duarte", subject: "Awaiting response — account verified, next steps sent", skillName: "General Support", timeLabel: "2d 1h" },
  { id: "pending-9", customerName: "Owen Novello", subject: "Awaiting response — service credit applied", skillName: "Billing", timeLabel: "3d 6h" },
  { id: "pending-10", customerName: "Meera Grant", subject: "Awaiting response — case notes shared with team", skillName: "Technical Support", timeLabel: "1d 9h" },
];

/**
 * Adapts an `EmailFocusItem` into `ContactHistoryEntry`'s own shape
 * (agent-next-gen-contact-history.tsx) — same reasoning/pattern
 * `buildContactHistoryEntryFromInteractionRecord` (agent-next-gen-
 * interactions-table.tsx) already established for the All Contacts table's
 * own row-click preview: reuse the existing `ContactHistoryEntryDetail`
 * summary component for a Pending row's right-side preview slide-out,
 * rather than building a second, parallel detail view.
 *
 * Unlike that other adapter, there's no real backing record here at all —
 * `EmailFocusItem` is hand-authored mock data with no `caseId`/`status`/
 * `channelType`/`duration` of its own (see that interface's own doc
 * comment) — so most of `ContactHistoryEntry`'s fields are invented/
 * hardcoded rather than carried across: always `channelType: "email"`,
 * always `statusLabel: "Pending"` (`"warning"` variant — this row is, by
 * definition, still awaiting the customer), and `duration: "—"` (nothing
 * to measure yet). `customerId` is a deterministic synthetic id
 * (`email-focus:${item.id}`), matching `handleReopenContactHistoryEntry`'s
 * own `entry.customerId ?? \`history:${entry.caseId}\`` fallback
 * convention for a row with no real customer record behind it — this is
 * also the same id `handleOpenEmailFocusAssignment` (AgentWorkspace2With
 * DeskPage.tsx) keys the resulting left-rail card on, so opening the same
 * mock person's email twice converges on one card instead of creating a
 * duplicate each time.
 */
/** Turns a Pending item into its own "the customer just replied" Replied
 *  version — same id (so it's recognizably the same conversation, just
 *  moved sections), `timeLabel` reset to right now (`timeOfDayFromMinutesAgo(0)`,
 *  same clock-time convention every other New Since Login/Replied label
 *  already uses), and `subject` rewritten from the Pending framing
 *  ("Awaiting response — …") into a plausible reply-style line, since a
 *  customer's actual reply text isn't part of this mock data. Used by
 *  AgentWorkspace2WithDeskPage.tsx's simulated "a Pending email got a
 *  reply" toast. */
export function buildRepliedEmailFocusItemFromPending(item: EmailFocusItem): EmailFocusItem {
  return {
    ...item,
    subject: `Re: ${item.subject.replace(/^Awaiting response — /, "")}`,
    timeLabel: timeOfDayFromMinutesAgo(0),
  };
}

export function buildContactHistoryEntryFromEmailFocusItem(item: EmailFocusItem): ContactHistoryEntry {
  return {
    id: item.id,
    name: item.customerName,
    statusLabel: "Pending",
    statusVariant: "warning",
    redial: false,
    description: item.subject,
    caseId: item.id,
    skillName: item.skillName,
    channelType: "email",
    channelLabel: "Email",
    timeAgo: item.timeLabel,
    duration: "—",
    customerId: `email-focus:${item.id}`,
  };
}
