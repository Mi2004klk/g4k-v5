import { faHouse, faGaugeHigh, faCalendarCheck, faClock, faUsers, faMessage,
  faGear, faBell, faMagnifyingGlass, faPlus, faTrashCan, faPenToSquare, faTriangleExclamation,
  faCircleCheck, faCircleInfo, faCircleExclamation, faCircleNotch, faDownload, faUpload,
  faChevronRight, faChevronLeft, faChevronDown, faChevronUp, faSort, faXmark,
  faEye, faEyeSlash, faCheck, faMinus, faCircle, faArrowRight, faArrowLeft, faArrowUp, faArrowDown,
  faPlay, faPause, faStop, faSquare,
  faBuilding, faBriefcase, faIdCard, faUser, faUserCheck, faUserXmark, faUserShield, faUserPen,
  faPaperPlane, faPaperclip, faEnvelope, faPhone, faLocationDot, faKey, faShieldHalved,
  faFileLines, faFile, faClipboardList, faClipboardCheck, faListCheck, faListUl, faDiagramProject,
  faChartLine, faChartBar, faFilter, faSliders, faEllipsisVertical, faEllipsis, faBars,
  faStar, faBookmark, faAward, faFlag, faRotateRight, faWifi, faGlobe, faMoon, faSun,
  faLaptop, faComputer, faTablet, faMugHot, faStopwatch, faInbox,
  faExternalLink, faCopy, faFloppyDisk, faThumbtack, faCalendarDays, faCalendarXmark,
  faPlane, faUmbrellaBeach, faArchive, faBoxArchive, faBoxOpen, faExpand,
  faTableColumns, faBorderAll, faCalculator, faCreditCard, faMap, faFaceSmile,
  faCircleQuestion, faLock, faUnlock, faBell as faBellAlt,
  faArrowTrendUp, faClockRotateLeft, faEnvelopeOpen, faCheckDouble, faHashtag,
  faTableList, faKeyboard, faBullhorn, faRightToBracket, faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconName = keyof typeof iconRegistry;
export type Tone = "neutral" | "brand" | "primary" | "success" | "warning" | "danger" | "info";
export type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "hero";

/**
 * Tone -> Color Token Mapping:
 * - neutral: Inherits current text color (text-current)
 * - brand: App primary brand color (text-primary)
 * - primary: Distinct action color (text-brand-tangerine)
 * - success: Positive/success status (text-success / green)
 * - warning: Warning status (text-warning / amber)
 * - danger: Error/destructive status (text-danger / rose)
 * - info: Informational status (text-info / blue)
 */
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
  chevronsUpDown: { icon: faSort }, arrowRight: { icon: faArrowRight },
  arrowLeft: { icon: faArrowLeft }, arrowUp: { icon: faArrowUp }, arrowDown: { icon: faArrowDown },
  arrowUpRight: { icon: faArrowRight }, arrowDownRight: { icon: faArrowRight },
  sortAsc: { icon: faSort }, sortDesc: { icon: faSort },
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
  laptop: { icon: faLaptop }, computer: { icon: faComputer }, devices: { icon: faTablet },
  shield: { icon: faShieldHalved }, shieldCheck: { icon: faShieldHalved }, key: { icon: faKey }, location: { icon: faLocationDot },
  archive: { icon: faBoxArchive }, archiveRestore: { icon: faBoxOpen },
  list: { icon: faListUl }, grid: { icon: faBorderAll }, kanban: { icon: faDiagramProject },
  eye: { icon: faEye }, eyeOff: { icon: faEyeSlash }, wifiOff: { icon: faWifi, tone: "danger" },
  home: { icon: faHouse }, trendingUp: { icon: faArrowTrendUp }, history: { icon: faClockRotateLeft },
  mailOpen: { icon: faEnvelopeOpen }, read: { icon: faCheckDouble }, hash: { icon: faHashtag },
  density: { icon: faTableList }, command: { icon: faKeyboard }, announcement: { icon: faBullhorn },
  login: { icon: faRightToBracket }, logout: { icon: faRightFromBracket }
} as const satisfies Record<string, IconEntry>;
