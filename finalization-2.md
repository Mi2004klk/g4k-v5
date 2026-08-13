# finalization-2.md — Complete Font Awesome Icon-System Replacement Plan

> Replace **all** lucide-react icons across the entire app with **Font Awesome**, via a single centralized
> icon system (registry + `<AppIcon>` component) so sizing, color, spacing, and hierarchy are consistent
> everywhere. Built from an exhaustive audit: **123 unique lucide icons / ~90 files / 105 imports**, **24 UI
> primitives** that bake in ~40 icons, 8 desktop + 5 mobile nav icons, and 2 icon-as-prop type surfaces.
> **Doc only — no implementation this turn.**
>
> Stack: Next.js 16 + React 19 + Tailwind v4 (`apps/web`) + shared UI (`packages/ui`).

---

## PART 0 — SCOPE & INVENTORY (from audit)

- **Sole icon library today:** `lucide-react` (no other). Version split: app `^0.468.0`, ui peer `^0.470.0`, ui devDeps `^1.31.0` → duplicate glyphs under old/new names (`Loader2`/`LoaderCircle`, `AlertTriangle`/`TriangleAlert`, `CheckCircle2`/`CircleCheck`). Dedupe in the FA map.
- **Sizing:** 100% Tailwind `w-*/h-*` classes (zero `size`/`strokeWidth` props). Dominant `w-4 h-4` (231 uses), `w-3 h-3` (61), `w-3.5 h-3.5` (52), `w-5/6/7/8/12`.
- **Color:** `text-*` utilities on the icon (icons use `currentColor`). Neutrals dominate (`text-neutral-400/500` ~336 uses) — this is the "all grey" problem the brief wants fixed. Semantic colors exist (`rose/red` destructive, `amber` warning, `emerald` success, `blue` info). Nav uses a separate `accentClasses` palette (blue/green/indigo/pink/amber/cyan/teal/rose/violet/orange/…).
- **24 `packages/ui` primitives** bake in ~40 icons (Select, Combobox, Dialog, Sheet, Command, Calendar, DropdownMenu, ContextMenu, Breadcrumb, Pagination, Accordion, PasswordInput, RadioGroup, Sonner, DataTable, InlineEdit, EmptyState, ErrorBoundary, OfflineBanner, FilterBar, FileUploadPopup, Checkbox). Swapping these once fixes every consumer.
- **Nav:** desktop `navGroups` (`dashboard/layout.tsx:69-84`) — 8 items, 7 unique icons (`Users` reused), icon stored as a component ref rendered `<item.icon/>`; each has an accent color. Mobile bottom-nav — 5 items with explicit active colors (center FAB is solid emerald).
- **Type surfaces:** `metric-widget.tsx` declares `icon: LucideIcon` (a type); `navGroups` + several stat-card arrays store `icon` as a component reference.
- **Special:** `Loader2 animate-spin` is THE spinner (44 sites); `DotLoader` (CSS dots in `button.tsx` + auth pages) is NOT lucide — keep; **no inline `<svg>` anywhere**; a few emoji used as icons (📊 🗓 ✓) to replace for consistency; brand logos via Next `<Image>` are NOT icons (keep).

---

## PART 1 — ARCHITECTURE: one central icon system

### 1.1 Package choice (official React SVG components — tree-shakeable, idiomatic)
Install (in `apps/web` AND `packages/ui`):
```bash
pnpm --filter web add @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome \
  @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons
# (add @fortawesome/free-brands-svg-icons only if a brand glyph is ever needed — none today)
```
**Do NOT** use the CSS/webfont `fontawesome-free` package (heavier, not tree-shakeable, not idiomatic for React/Next). Keep `core`'s auto-CSS-add disabled (the React component injects what it needs).

### 1.2 The Icon registry + `<AppIcon>` component (the "single professionally designed system")
Centralize so sizing/color/spacing/hierarchy are enforced once, and a future library swap is a one-file change.

**`packages/ui/src/components/icon/registry.ts`** — semantic name → FA definition + defaults:
```ts
import { faHouse, faGaugeHigh, faCalendarCheck, faClock, faUsers, faMessage,
  faGear, faBell, faMagnifyingGlass, faPlus, faTrashCan, faPenToSquare, faTriangleExclamation,
  faCircleCheck, faCircleInfo, faCircleExclamation, faCircleNotch, faDownload, faUpload,
  faChevronRight, faChevronLeft, faChevronDown, faChevronUp, faChevronsUpDown, faXmark,
  faEye, faEyeSlash, faCheck, faMinus, faCircle, faArrowRight, faArrowLeft, faArrowUp, faArrowDown,
  faArrowUpRight, faArrowDownRight, faArrowDownAZ, faArrowUpAZ, faPlay, faPause, faStop, faSquare,
  faBuilding, faBriefcase, faIdCard, faUser, faUserCheck, faUserXmark, faUserShield, faUserPen,
  faPaperPlane, faPaperclip, faEnvelope, faPhone, faLocationDot, faKey, faShieldHalved,
  faFileLines, faFile, faClipboardList, faClipboardCheck, faListCheck, faListUl, faDiagramProject,
  faChartLine, faChartBar, faFilter, faSliders, faEllipsisVertical, faEllipsis, faBars,
  faStar, faBookmark, faAward, faFlag, faRotateRight, faWifi, faGlobe, faMoon, faSun,
  faLaptop, faComputer, faTabletScreenButton, faMugHot, faStopwatch, faSend, faInbox,
  faExternalLink, faCopy, faFloppyDisk, faThumbtack, faCalendarDays, faCalendarXmark,
  faPlane, faUmbrellaBeach, faArchive, faBoxArchive, faBoxArchiveArrowUp, faExpand,
  faTableColumns, faBorderAll, faCalculator, faCreditCard, faMap, faFaceSmile,
  faCircleQuestion, faLock, faUnlock, faBell as faBellAlt
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconName = keyof typeof iconRegistry;
type Tone = "neutral" | "brand" | "primary" | "success" | "warning" | "danger" | "info";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "hero";

export interface IconEntry { icon: IconDefinition; tone?: Tone; }
export const iconRegistry = {
  // nav / modules
  dashboard:       { icon: faGaugeHigh,  tone: "brand" },
  attendance:      { icon: faCalendarCheck, tone: "success" },
  projects:        { icon: faDiagramProject, tone: "info" },
  tasks:           { icon: faListCheck, tone: "success" },
  chat:            { icon: faMessage, tone: "primary" },
  directory:       { icon: faUsers, tone: "warning" },
  employees:       { icon: faIdCard, tone: "info" },
  teamAttendance:  { icon: faClock, tone: "success" },
  settings:        { icon: faGear, tone: "neutral" },
  audit:           { icon: faShieldHalved, tone: "danger" },
  profile:         { icon: faUser, tone: "neutral" },
  // actions
  plus: { icon: faPlus }, edit: { icon: faPenToSquare }, trash: { icon: faTrashCan, tone: "danger" },
  save: { icon: faFloppyDisk }, download: { icon: faDownload }, upload: { icon: faUpload },
  send: { icon: faPaperPlane, tone: "primary" }, search: { icon: faMagnifyingGlass },
  filter: { icon: faFilter }, sliders: { icon: faSliders }, refresh: { icon: faRotateRight },
  copy: { icon: faCopy }, externalLink: { icon: faExternalLink }, more: { icon: faEllipsisVertical },
  moreH: { icon: faEllipsis }, menu: { icon: faBars }, close: { icon: faXmark },
  check: { icon: faCheck }, minus: { icon: faMinus }, expand: { icon: faExpand },
  // status / feedback
  success: { icon: faCircleCheck, tone: "success" }, error: { icon: faCircleExclamation, tone: "danger" },
  warning: { icon: faTriangleExclamation, tone: "warning" }, info: { icon: faCircleInfo, tone: "info" },
  loading: { icon: faCircleNotch, tone: "neutral" }, question: { icon: faCircleQuestion, tone: "neutral" },
  // chevrons / arrows
  chevronRight: { icon: faChevronRight }, chevronLeft: { icon: faChevronLeft },
  chevronDown: { icon: faChevronDown }, chevronUp: { icon: faChevronUp },
  chevronsUpDown: { icon: faChevronsUpDown }, arrowRight: { icon: faArrowRight },
  arrowLeft: { icon: faArrowLeft }, arrowUp: { icon: faArrowUp }, arrowDown: { icon: faArrowDown },
  arrowUpRight: { icon: faArrowUpRight }, arrowDownRight: { icon: faArrowDownRight },
  sortAsc: { icon: faArrowDownAZ }, sortDesc: { icon: faArrowUpAZ },
  // attendance / time
  clock: { icon: faClock }, timer: { icon: faStopwatch }, play: { icon: faPlay, tone: "success" },
  pause: { icon: faPause, tone: "warning" }, stop: { icon: faStop, tone: "danger" },
  break: { icon: faMugHot, tone: "warning" }, calendar: { icon: faCalendarDays },
  calendarX: { icon: faCalendarXmark, tone: "danger" },
  // people / org
  userCheck: { icon: faUserCheck, tone: "success" }, userX: { icon: faUserXmark, tone: "danger" },
  userShield: { icon: faUserShield }, building: { icon: faBuilding }, briefcase: { icon: faBriefcase },
  // comms
  bell: { icon: faBell }, mail: { icon: faEnvelope }, phone: { icon: faPhone },
  pin: { icon: faThumbtack }, paperclip: { icon: faPaperclip }, inbox: { icon: faInbox },
  // files / data
  file: { icon: faFile }, fileText: { icon: faFileLines }, clipboard: { icon: faClipboardList },
  clipboardCheck: { icon: faClipboardCheck, tone: "success" }, spreadsheet: { icon: faTableColumns },
  // leave
  leave: { icon: faUmbrellaBeach, tone: "info" }, plane: { icon: faPlane },
  // misc / views
  star: { icon: faStar, tone: "warning" }, award: { icon: faAward, tone: "warning" },
  flag: { icon: faFlag, tone: "danger" }, chart: { icon: faChartBar }, activity: { icon: faChartLine },
  globe: { icon: faGlobe }, sun: { icon: faSun }, moon: { icon: faMoon },
  laptop: { icon: faLaptop }, computer: { icon: faComputer }, devices: { icon: faTabletScreenButton },
  shield: { icon: faShieldHalved }, key: { icon: faKey }, location: { icon: faLocationDot },
  archive: { icon: faBoxArchive }, archiveRestore: { icon: faBoxArchiveArrowUp },
  list: { icon: faListUl }, grid: { icon: faBorderAll }, kanban: { icon: faDiagramProject },
  eye: { icon: faEye }, eyeOff: { icon: faEyeSlash }, wifiOff: { icon: faWifi, },
} as const satisfies Record<string, IconEntry>;
```
> This registry is the **single source of truth**. Every call site uses a semantic name, never a raw FA import.

**`packages/ui/src/components/icon/AppIcon.tsx`:**
```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconRegistry, IconName } from "./registry";
import { cn } from "../../utils/cn";

const SIZE_CLASS: Record<string,string> = {
  xs:"w-3 h-3", sm:"w-3.5 h-3.5", md:"w-4 h-4", lg:"w-5 h-5",
  xl:"w-6 h-6", "2xl":"w-8 h-8", hero:"w-12 h-12",
};
const TONE_CLASS: Record<string,string> = {
  neutral:"text-current", brand:"text-primary", primary:"text-brand-tangerine",
  success:"text-success", warning:"text-warning", danger:"text-danger", info:"text-info",
};

export function AppIcon({
  name, size="md", tone, spin, className,
}: { name: IconName; size?: keyof typeof SIZE_CLASS; tone?: keyof typeof TONE_CLASS;
     spin?: boolean; className?: string; }) {
  const entry = iconRegistry[name];
  const resolvedTone = tone ?? entry.tone ?? "neutral";
  return (
    <FontAwesomeIcon
      icon={entry.icon}
      spin={spin ?? (name === "loading")}
      className={cn(SIZE_CLASS[size], TONE_CLASS[resolvedTone], "shrink-0", className)}
    />
  );
}
```
- [ ] **1.2a** Create `registry.ts` + `AppIcon.tsx` in `packages/ui/src/components/icon/`.
- [ ] **1.2b** Export `AppIcon` + `IconName` type from `packages/ui/src/components/index.ts`.

### 1.3 Sizing / spacing / alignment tokens (enforced via `AppIcon`)
- **Size scale** (mapped to the existing Tailwind usage): `xs`=12px, `sm`=14px, `md`=16px (default), `lg`=20px, `xl`=24px, `2xl`=32px, `hero`=48px.
- **`shrink-0`** always applied (prevents flex squash → fixes overlap/cramping).
- **Icon+label spacing:** buttons/menu items/nav → `gap-2`; dense rows/badges → `gap-1.5`.
- **Icon-button containers:** keep the existing tile sizes (`w-7/8/9 h-7/8/9` rounded) with the icon at `size="sm"`/`"md"` centered (`flex items-center justify-center`).
- **Vertical alignment:** icons inside text rows use `inline-flex items-center` on the wrapper (not baseline alignment) so the icon centers with the cap height.
- **Never** let an icon size exceed its container; never use `w-full`/`h-full` on an icon.

### 1.4 Color treatment (meaningful, not all-grey)
- **Default tones by meaning** (in the registry): status icons carry semantic colors (success/warning/danger/info); primary actions `brand`/`primary`; nav icons inherit their module accent color (passed via `tone`/`className` from `nav-group.tsx` using the existing `accentClasses`).
- **Override per context:** `<AppIcon name="clock" tone="success" />` or `<AppIcon name="trash" className="text-rose-600" />`.
- **Contrast:** keep ≥3:1 against backgrounds (WCAG non-text). For dark surfaces use the light variant.
- [ ] Document the tone→color token table in the registry file header so contributors pick the right tone.

---

## PART 2 — LUCIDE → FONT AWESOME SEMANTIC MAP (all 123; deduped)

> Style: **Solid** for everything unless noted. Choose by **meaning**, not visual similarity.

### Navigation / modules (highest visibility)
| lucide | FA (`registry` name) | notes |
|---|---|---|
| `LayoutDashboard` | `faGaugeHigh` (`dashboard`) | or `faHouse`; gauge reads "analytics dashboard" |
| `CalendarCheck` | `faCalendarCheck` (`attendance`) | |
| `FolderKanban` | `faDiagramProject` (`projects`) | project/board meaning |
| `MessageSquare` | `faMessage` (`chat`) | |
| `Users` | `faUsers` (`directory`/`employees`) | keep `Users` for both; differentiate by accent color |
| `Clock` | `faClock` (`teamAttendance`) | |
| `Settings` | `faGear` (`settings`) | |
| `ShieldAlert` | `faShieldHalved` (`audit`) | |
| `UserCircle` | `faUser` (`profile`) mobile uses `faIdCard` to differentiate | |
| `Home` | `faHouse` | |

### Actions
| lucide | FA | |
|---|---|---|
| `Plus` | `faPlus` | |
| `Trash2` | `faTrashCan` (`trash`) | |
| `Edit`/`Edit2`/`Pencil`/`Pen`/`FileEdit` | `faPenToSquare` (`edit`) | unify all "edit" glyphs |
| `Save`/`SaveAll` | `faFloppyDisk` (`save`) | |
| `Download` | `faDownload` | |
| `Upload`/`UploadCloud` | `faUpload` | |
| `Send` | `faPaperPlane` (`send`) | |
| `Search` | `faMagnifyingGlass` (`search`) | |
| `Filter` | `faFilter` | |
| `SlidersHorizontal` | `faSliders` (`sliders`) | |
| `RefreshCw` | `faRotateRight` (`refresh`) | |
| `Copy` | `faCopy` | |
| `ExternalLink` | `faExternalLink` | |
| `MoreVertical` | `faEllipsisVertical` (`more`) | |
| `MoreHorizontal` | `faEllipsis` (`moreH`) | |
| `Menu` | `faBars` | |
| `Check` | `faCheck` | |
| `Minus` | `faMinus` | |
| `Pin` | `faThumbtack` (`pin`) | |
| `ArchiveRestore` | `faBoxArchiveArrowUp` (`archiveRestore`) | |
| `Archive` | `faBoxArchive` (`archive`) | |
| `Expand` | `faExpand` | |

### Status / feedback
| lucide | FA | |
|---|---|---|
| `CheckCircle2`/`CheckCircle`/`CircleCheck` | `faCircleCheck` (`success`) | **dedupe the 3 aliases** |
| `AlertCircle`/`CircleAlert` | `faCircleExclamation` (`error`) | dedupe |
| `AlertTriangle`/`TriangleAlert` | `faTriangleExclamation` (`warning`) | dedupe |
| `Info` | `faCircleInfo` (`info`) | |
| `Loader2`/`LoaderCircle` | `faCircleNotch` (`loading`) with `spin` | **dedupe; the 44 spinner sites** |
| `HelpCircle` | `faCircleQuestion` (`question`) | |
| `Star` | `faStar` (`star`) | |
| `Award` | `faAward` (`award`) | |
| `Flag` | `faFlag` (`flag`) | |
| `WifiOff` | `faWifi` rotated, or use `faWifi` with a slash overlay → simplest: `faTowerBroadcast`? **use `faWifi`** + a className strikethrough is messy → use **`faPlugCircleXmark`** or keep `faWifi` and convey "off" via color (danger). Recommend `faWifi` tone="danger". |

### Chevrons / arrows
| lucide | FA | |
|---|---|---|
| `ChevronRight/Left/Down/Up` | `faChevronRight/Left/Down/Up` | |
| `ChevronsUpDown` | `faChevronsUpDown` | |
| `ArrowRight/Left/Up/Down` | `faArrowRight/Left/Up/Down` | |
| `ArrowUpRight`/`ArrowDownRight` | `faArrowUpRight`/`faArrowDownRight` | |
| `ArrowUpAZ`/`ArrowDownAZ` | `faArrowUpAZ`/`faArrowDownAZ` (sort) | |
| `X` | `faXmark` (`close`) | |

### Attendance / time
| lucide | FA | |
|---|---|---|
| `Clock` | `faClock` | |
| `Timer`/`Stopwatch` | `faStopwatch` (`timer`) | |
| `Play` (clock-in, solid) | `faPlay` (`play`) with `fill` | |
| `Pause` | `faPause` (`pause`) | |
| `Square`/`Stop` | `faStop`/`faSquare` (`stop`) | |
| `Coffee` (break) | `faMugHot` (`break`) | |
| `Calendar`/`CalendarDays` | `faCalendarDays` (`calendar`) | unify |
| `CalendarX` | `faCalendarXmark` (`calendarX`) | |
| `CalendarCheck` | `faCalendarCheck` | |
| `LogIn` (clock-in) | `faRightToBracket` | clock-in semantics |
| `LogOut` | `faRightFromBracket` | |
| `MonitorSmartphone` | `faTabletScreenButton` (`devices`) | |
| `Monitor` | `faComputer` (`computer`) | |
| `TrendingUp` | `faArrowTrendUp` | |
| `Activity` | `faChartLine` (`activity`) | |
| `History` | `faClockRotateLeft` | |

### People / org / comms
| lucide | FA | |
|---|---|---|
| `User` | `faUser` | |
| `UserCheck` | `faUserCheck` | |
| `UserX` | `faUserXmark` | |
| `ShieldCheck` | `faShieldHalved` | |
| `Shield` | `faShieldHalved` (`shield`) | |
| `KeyRound` | `faKey` (`key`) | |
| `Building2` | `faBuilding` (`building`) | |
| `Briefcase` | `faBriefcase` | |
| `Bell` | `faBell` | |
| `Mail`/`MailOpen` | `faEnvelope`/`faEnvelopeOpen` | |
| `Phone` | `faPhone` | |
| `MapPin` | `faLocationDot` (`location`) | |
| `Paperclip` | `faPaperclip` | |
| `CheckCheck` (read receipts) | `faCheckDouble` | |
| `Hash` | `faHashtag` | |
| `Globe` | `faGlobe` | |

### Files / data / views
| lucide | FA | |
|---|---|---|
| `File`/`FileText` | `faFile`/`faFileLines` | |
| `FileSpreadsheet` | `faFileExcel` (brands? no—use `faTableColumns`) → `faTableColumns` (`spreadsheet`) | avoid brand dep |
| `ClipboardList`/`ClipboardList` | `faClipboardList` (`clipboard`) | |
| `CheckSquare`/`ListTodo`/`CheckSquare` | `faListCheck` (`tasks`) | unify |
| `List`/`ListIcon` | `faListUl` (`list`) | unify alias |
| `Grid`/`LayoutGrid` | `faBorderAll` (`grid`) | |
| `Kanban` | `faDiagramProject` (`kanban`) | |
| `Rows2`/`Rows3` (density) | `faGripLines`/`faTableRows` → use `faTableList` | |
| `BarChart3` | `faChartBar` (`chart`) | |
| `Calculator`/`CreditCard`/`Map`/`Smile` (demo command-menu) | `faCalculator`/`faCreditCard`/`faMap`/`faFaceSmile` | demo only |
| `Command` (⌘) | `faKeyboard` or `faCommand` (brands? keep simple: `faKeyboard`) | |
| `Inbox` | `faInbox` | |
| `Eye`/`EyeOff` | `faEye`/`faEyeSlash` | |
| `Megaphone` | `faBullhorn` | announcements |
| `Plane` (leave type) | `faPlane` | |
| `Send` | `faPaperPlane` | |
| `Settings2` (column config) | `faSliders` | |
| `Coffee` | `faMugHot` | |

> Any icon not listed above is rare (1–2 uses); map each by meaning using the FA **search** (free-solid first, then free-regular). Add every new mapping to `registry.ts` — never import FA directly in app code.

---

## PART 3 — PRIMITIVE SWAPS (24 files in `packages/ui` — highest leverage)

For each, replace the lucide import + JSX with `AppIcon`. Swapping these once propagates app-wide:
`select.tsx`, `combobox.tsx`, `checkbox.tsx`, `dialog.tsx`, `sheet.tsx`, `command.tsx`,
`command-menu.tsx` (remove demo icons or re-map), `context-menu.tsx`, `dropdown-menu.tsx`,
`breadcrumb.tsx`, `pagination.tsx`, `calendar.tsx`, `accordion.tsx`, `password-input.tsx`,
`radio-group.tsx`, `sonner.tsx` (dedupe `CircleCheck`/`LoaderCircle`/`TriangleAlert`/`OctagonX`→ use `success`/`loading`/`warning`/`error` registry names), `data-table.tsx`, `inline-edit.tsx`,
`empty-state.tsx`, `error-boundary.tsx`, `offline-banner.tsx`, `filter-bar.tsx`,
`file-upload-popup.tsx`.
- [ ] **3.1** Swap each primitive's lucide icons → `<AppIcon name=…/>`. Preserve indicator semantics (Check in Checkbox/Select/RadioGroup must render as a crisp glyph at `size="xs"`).
- [ ] **3.2** For `sonner.tsx` toasts, map success→`success`, error→`error`, warning→`warning`, info→`info` (semantic tones drive color → vibrant, not grey).

---

## PART 4 — TYPE-SURFACE MIGRATION (icon-as-prop)

- [ ] **4.1** `metric-widget.tsx` — change `icon: LucideIcon` → `icon: IconName` and render `<AppIcon name={icon} size="lg" />` (or accept `IconDefinition`/`IconName`). Update each `MetricWidget` caller to pass a registry name.
- [ ] **4.2** `navGroups` (`dashboard/layout.tsx`) — change `icon: <LucideComponent>` to `icon: IconName`; in `nav-group.tsx:82` render `<AppIcon name={item.icon} size="md" className={accent.text}/>` (the accent color drives the nav icon color → vibrant per-module). Same for the stat-card arrays (`admin-attendance-analytics`, `hr-attendance-analytics`, `hr-activity-feed-widget`, `role-select`).

---

## PART 5 — PER-AREA MIGRATION + COLOR/HIERARCHY GUIDE

Apply per area; each `<LucideIcon className="w-4 h-4 …"/>` → `<AppIcon name="…" size="md" tone="…" className="…"/>`.
- **Sidebar nav** (`layout.tsx`, `nav-group.tsx`): icons at `size="md"`, color = module accent (`accent.text`); active state keeps accent, idle = neutral-muted. This is the biggest "vibrant, meaningful" win.
- **Mobile bottom-nav** (`layout.tsx:414-472`): `size="lg"`, active = accent color, center FAB `faClock` solid emerald (keep `bg-emerald-600 text-white`).
- **Topbar** (`layout.tsx:371-396`): `Monitor→computer`, `Rows3/Rows2→ density (faTableList)`, `Command→ faKeyboard`, `Menu→ faBars` — all `size="sm"` neutral, with hover tone.
- **Buttons** (icon-only `size="icon"`): icon `size="sm"` centered; primary actions tone `primary`/`brand`; destructive `danger`. Loading uses the existing `DotLoader` (keep) OR `<AppIcon name="loading" spin/>`.
- **Tables** (status/row actions): status icons tone = semantic; row-action kebab → `more`; edit/trash → `edit`/`trash` (`danger`). `size="sm"`.
- **Forms** (inputs, password eye, calendar): `eye`/`eyeOff` for password; date pickers use the `Calendar` primitive (already swapped in §3). `size="sm"` inside fields.
- **Dialogs/modals**: close → `close` (`faXmark`); header icons tone by context.
- **Status badges / feedback**: always semantic tone (success/warning/danger/info) — never grey.
- **Empty/error states**: hero icon `size="hero"` with semantic tone; `refresh` button.
- **Auth pages**: keep brand logos (`<Image>`); replace any lucide status icons (Info/Shield) with `info`/`shield`.
- **Attendance**: clock-in `play` (success, fill), pause `pause` (warning), stop `stop` (danger), break `break` (warning), calendar heatmap legend icons.
- **Spoken emoji-as-icons**: replace `📊`→`chart`, `🗓`→`calendar`, `✓`→`check` (status), so the icon set is uniform. (Keep user-content reactions 👍🎉.)

---

## PART 6 — CLEANUP & DEPENDENCY HYGINE

- [ ] **6.1** Remove `lucide-react` from `apps/web/package.json` and `packages/ui/package.json` (deps + peer + devDeps) once zero imports remain; run `pnpm install` to update the lockfile.
- [ ] **6.2** Remove `"lucide-react"` from `next.config.ts` `optimizePackageImports` (FA tree-shakes via per-icon imports; no entry needed — or add `@fortawesome/free-solid-svg-icons` if desired, but per-import is already optimal).
- [ ] **6.3** Delete dead/duplicate imports found in the audit (`Megaphone`, `BarChart3`, `CheckSquare`, `Star` unused in `layout.tsx`; demo icons in `command-menu.tsx` if the command-menu is not used).
- [ ] **6.4** Replace the emoji-as-icons (📊 🗓 ✓) with registry icons.
- [ ] **6.5** Resolve the version split (becomes moot once lucide is removed).
- [ ] **6.6** Keep `DotLoader` (CSS dots) for button loading — it's not an icon library dependency.

---

## PART 7 — IMPLEMENTATION PHASES (ordered, low-risk-first)

1. **P1 — Foundation:** install FA packages; build `registry.ts` + `AppIcon.tsx`; export from `packages/ui`. (No call-site changes yet; app unchanged.)
2. **P2 — Primitives:** swap the 24 `packages/ui` components (§3). Every consumer inherits FA immediately; lucide still works elsewhere.
3. **P3 — Type surfaces + nav:** migrate `LucideIcon` type + `navGroups`/stat-card arrays + desktop & mobile nav (§4, §5 nav). Highest visibility.
4. **P4 — App call sites by area:** widgets → tables → forms → buttons → dialogs → status → auth → attendance → leave → directory → chat → settings → reports (§5). File-by-file; app green after each.
5. **P5 — Cleanup:** remove lucide-react + dead imports + emoji + optimizePackageImports (§6).
6. **P6 — Polish pass:** audit sizing/spacing/alignment/hierarchy globally; ensure `shrink-0`, `gap-*`, container sizes; verify color contrast in dark mode.
7. **P7 — Verify:** run the §8 matrix.

Each phase leaves the app fully functional; you can stop after any phase.

---

## PART 8 — VERIFICATION & ACCEPTANCE

**States (every icon must render correctly in):**
- [ ] normal, hover, active, selected, disabled, loading (`spin`), expanded/collapsed, focus, error, empty, responsive (360→1536px).
**No regressions:**
- [ ] No layout shift (FA `<svg>` accepts the same `w-*/h-*` classes); no overlap/cramping (every icon `shrink-0`); no icon oversized for its container.
- [ ] No console errors (unknown FA icon, missing import).
- [ ] No remaining `from "lucide-react"` imports (`grep -r "lucide-react" apps/web/src packages/ui/src` → empty) and the dependency removed from both `package.json` files.
**Consistency:**
- [ ] One icon system (`AppIcon` + registry) used everywhere; zero raw FA imports in app code; zero lucide.
- [ ] Semantic tones applied (status/category/action are colored, not all-grey); nav icons carry module accent colors.
- [ ] Consistent sizing scale (`xs…hero`); consistent icon+label gaps; vertical alignment centered.
- [ ] Dark-mode parity + WCAG non-text contrast (≥3:1).

---

## ROOT-CAUSE / DECISION SUMMARY

| # | Decision | Why |
|---|---|---|
| 1 | Official `@fortawesome/react-fontawesome` + free-solid/regular (SVG components) | tree-shakeable, idiomatic React/Next, no webfont bloat |
| 2 | Central `iconRegistry` + `<AppIcon>` | one source of truth for icon + size + tone; enforces consistency; future-swap is one file; directly satisfies "single professionally designed system" |
| 3 | Semantic name keys (not raw FA imports in app) | meaning-driven selection; prevents drift/duplicate configs |
| 4 | Default tones by meaning + nav accent passthrough | fixes "all grey"; vibrant, purposeful color |
| 5 | Tailwind `w-*/h-*` sizing + `shrink-0` + gap tokens | preserves current layout, prevents overlap/cramping, no layout shift |
| 6 | Swap the 24 primitives first | highest leverage — one change per primitive fixes all consumers |
| 7 | Dedupe lucide aliases (3 status aliases, 2 loader aliases) | cleaner registry, fewer entries |
| 8 | Keep `DotLoader` + brand `<Image>` logos | they aren't icon-library glyphs |

> **Scope honesty:** this is a large but mechanical migration (~90 files) made safe by the central
> `AppIcon`/registry design — Phase 1 builds the system, Phase 2 (primitives) propagates ~40 icons app-wide
> automatically, and the remaining phases are file-by-file swaps that never leave the app broken. Implement
> Phase 1 → 2 → 3 first (system + primitives + nav); that alone delivers most of the visual consistency.
