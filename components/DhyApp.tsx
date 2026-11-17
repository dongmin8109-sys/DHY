"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Database,
  Download,
  FileLock2,
  FilePlus2,
  FileText,
  Fingerprint,
  FolderClosed,
  GitBranch,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Radio,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

type User = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  clearance: number;
};
type RecordItem = {
  id: string;
  kind: string;
  recordNo: string;
  title: string;
  subtitle: string | null;
  classification: number;
  status: string;
  wanted: boolean | null;
  danger: string | null;
  photoKey: string | null;
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
};
type Dashboard = {
  counts: Record<string, number>;
  wanted: number;
  unresolved: number;
  danger: { danger: string; count: number }[];
  recent: RecordItem[];
  alerts: RecordItem[];
  reports: RecordItem[];
};
type Session = { setupRequired: boolean; user: User | null; grades: string[] };
type Detail = {
  record: RecordItem;
  editRecord?: RecordItem | null;
  revisions: { id: string; actor_id: string; created_at: number }[];
  files: {
    id: string;
    filename: string;
    content_type: string;
    size: number;
    classification: number;
    created_at: number;
  }[];
};
type Nav = {
  key: string;
  ko: string;
  en: string;
  icon: typeof Database;
  kind?: string;
  wanted?: boolean;
  admin?: boolean;
};

const nav: Nav[] = [
  { key: "dashboard", ko: "통합 상황실", en: "COMMAND CENTER", icon: Activity },
  { key: "search", ko: "통합 검색", en: "GLOBAL SEARCH", icon: Search },
  {
    key: "person",
    ko: "인물 데이터베이스",
    en: "PERSONNEL FILES",
    icon: UserRound,
    kind: "person",
  },
  {
    key: "wanted",
    ko: "국제 수배 명단",
    en: "WANTED INDEX",
    icon: ShieldAlert,
    kind: "person",
    wanted: true,
  },
  {
    key: "organization",
    ko: "범죄 조직",
    en: "ORGANIZATIONS",
    icon: Users,
    kind: "organization",
  },
  {
    key: "case",
    ko: "사건 기록",
    en: "CASE FILES",
    icon: FolderClosed,
    kind: "case",
  },
  { key: "graph", ko: "인물 관계도", en: "RELATION NETWORK", icon: GitBranch },
  {
    key: "evidence",
    ko: "증거물 보관소",
    en: "EVIDENCE",
    icon: Archive,
    kind: "evidence",
  },
  {
    key: "document",
    ko: "기밀문서",
    en: "CLASSIFIED DOCS",
    icon: FileLock2,
    kind: "document",
  },
  {
    key: "operation",
    ko: "비밀 작전",
    en: "OPERATIONS",
    icon: Radio,
    kind: "operation",
  },
  {
    key: "region",
    ko: "수사 대상 지역",
    en: "REGIONS",
    icon: Globe2,
    kind: "region",
  },
  {
    key: "investigator",
    ko: "수사관 관리",
    en: "INVESTIGATORS",
    icon: Fingerprint,
    kind: "investigator",
  },
  {
    key: "notice",
    ko: "내부 공지",
    en: "DIRECTIVES",
    icon: ClipboardList,
    kind: "notice",
  },
  {
    key: "report",
    ko: "수사 보고서",
    en: "REPORTS",
    icon: FileText,
    kind: "report",
  },
  {
    key: "alert",
    ko: "긴급 경보",
    en: "ALERTS",
    icon: AlertTriangle,
    kind: "alert",
  },
  {
    key: "audit",
    ko: "접속 기록",
    en: "ACCESS LOG",
    icon: Layers3,
    admin: true,
  },
  {
    key: "admin",
    ko: "관리자 콘솔",
    en: "ADMINISTRATOR",
    icon: Settings2,
    admin: true,
  },
];
const fieldDefs: Record<string, [string, string, "text" | "textarea"][]> = {
  person: [
    ["legalName", "본명 / LEGAL NAME", "text"],
    ["aliases", "별명 / ALIASES (줄바꿈 구분)", "textarea"],
    ["age", "나이 / AGE", "text"],
    ["physical", "신체적 특징 / PHYSICAL MARKS", "textarea"],
    ["affiliation", "소속 조직 / AFFILIATION", "text"],
    ["position", "직책 / POSITION", "text"],
    ["lastSeen", "마지막 목격 장소 / LAST SEEN", "text"],
    ["crimes", "범죄 기록 / CRIMINAL HISTORY (줄바꿈 구분)", "textarea"],
    ["behavior", "성격 및 행동 특성 / BEHAVIOR", "textarea"],
    ["abilities", "특수 능력 / ABILITIES", "textarea"],
    ["items", "주요 소지품 / POSSESSIONS (줄바꿈 구분)", "textarea"],
    ["assignee", "담당 수사관 / LEAD INVESTIGATOR", "text"],
    ["opinion", "수사관 소견 / ASSESSMENT", "textarea"],
    ["background", "배경 기록 / BACKGROUND", "textarea"],
    ["traits", "특징 / TRAITS", "textarea"],
    ["works", "저작물 / WORKS", "textarea"],
    ["coverIdentity", "위장 신분 / COVER IDENTITY", "text"],
    ["subordinates", "산하 인원 / SUBORDINATES", "textarea"],
    [
      "unclassifiedTerms",
      "미분류 명칭 / UNCLASSIFIED TERMS (줄바꿈 구분)",
      "textarea",
    ],
    ["termsNote", "명칭 관련 소견 / TERMS NOTE", "textarea"],
    ["destructionPercent", "파괴력 / DESTRUCTIVE CAPACITY (%)", "text"],
    ["riskPercent", "위험도 / RISK INDEX (%)", "text"],
    ["powerPercent", "권력 / INFLUENCE (%)", "text"],
    ["opkPercent", "OPK 지수 / OPK INDEX (%)", "text"],
  ],
  investigator: [
    ["position", "직책 / POSITION", "text"],
    ["clearance", "보안등급 / CLEARANCE", "text"],
    ["department", "부서 / DIVISION", "text"],
    ["notes", "비고 / NOTES", "textarea"],
  ],
  organization: [
    ["leader", "대표 / LEADER", "text"],
    ["region", "활동 지역 / REGION", "text"],
    ["summary", "조직 개요 / SUMMARY", "textarea"],
  ],
  case: [
    ["date", "발생일 / DATE", "text"],
    ["location", "장소 / LOCATION", "text"],
    ["assignee", "담당 수사관 / LEAD INVESTIGATOR", "text"],
    ["summary", "사건 개요 / SUMMARY", "textarea"],
  ],
  document: [
    ["date", "작성일 / DATE", "text"],
    ["author", "작성 수사관 / AUTHOR", "text"],
    ["relatedCase", "관련 사건 / RELATED CASE", "text"],
    ["summary", "문서 개요 / SUMMARY", "textarea"],
  ],
  evidence: [
    ["source", "출처 / SOURCE", "text"],
    ["storage", "보관 위치 / STORAGE", "text"],
    ["summary", "증거 설명 / DESCRIPTION", "textarea"],
  ],
  operation: [
    ["date", "작전일 / DATE", "text"],
    ["lead", "작전 책임자 / LEAD", "text"],
    ["summary", "작전 개요 / SUMMARY", "textarea"],
  ],
  region: [
    ["country", "국가 / COUNTRY", "text"],
    ["summary", "지역 정보 / DESCRIPTION", "textarea"],
  ],
  notice: [
    ["date", "게시일 / DATE", "text"],
    ["summary", "공지 내용 / BODY", "textarea"],
  ],
  report: [
    ["date", "작성일 / DATE", "text"],
    ["author", "담당 수사관 / AUTHOR", "text"],
    ["summary", "보고 내용 / BODY", "textarea"],
  ],
  alert: [
    ["date", "발령일 / DATE", "text"],
    ["summary", "경보 내용 / BODY", "textarea"],
  ],
};
const listKeys = new Set(["aliases", "crimes", "items", "unclassifiedTerms"]);
const metricDefs: [string, string][] = [
  ["destructionPercent", "파괴력"],
  ["riskPercent", "위험도"],
  ["powerPercent", "권력"],
  ["opkPercent", "OPK 지수"],
];
const metricKeys = new Set(metricDefs.map(([key]) => key));
const fmt = (timestamp: number) =>
  new Date(timestamp).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  });
const unknown = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0)
    ? "미확인"
    : Array.isArray(value)
      ? value.join(" · ")
      : String(value);

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.error || `요청 실패 (${response.status})`);
  return payload as T;
}
function request(method: string, data: unknown): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  };
}
function Grade({ value, grades }: { value: number; grades: string[] }) {
  return (
    <span className={`grade grade-${value >= 7 ? "high" : "normal"}`}>
      <LockKeyhole size={11} /> L{value}{" "}
      {grades[value - 1]?.split(" / ")[0] ?? "미확인"}
    </span>
  );
}
function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="empty">
      <CircleHelp size={30} />
      <strong>{title}</strong>
      <span>
        {sub ??
          "등록된 자료가 없습니다. 승인된 정보가 접수되면 이곳에 표시됩니다."}
      </span>
    </div>
  );
}

function AuthScreen({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (session.setupRequired && password !== confirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    try {
      if (session.setupRequired)
        await api(
          "auth/bootstrap",
          request("POST", { username, displayName, password }),
        );
      await api("auth/login", request("POST", { username, password }));
      onDone();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <div className="auth-rail">
        <span className="pulse-dot" /> SECURE INTERNAL NETWORK <span>•</span>{" "}
        DHY / DONGMIN HATES YOU{" "}
        <span className="auth-rail-right">AUTHORIZED ACCESS ONLY</span>
      </div>
      <div className="auth-panel">
        <div className="auth-emblem">
          <Shield size={42} strokeWidth={1.1} />
          <span>DHY</span>
        </div>
        <div className="auth-classification">TOP SECRET // 극비 전산망</div>
        <h1>
          DHY
          <br />
          <em>CLASSIFIED</em>
          <br />
          DATABASE
        </h1>
        <p className="auth-sub">
          세계적 흉악범죄 수사청 <span>·</span> INTERNAL INVESTIGATIVE SYSTEM
        </p>
        <div className="auth-rule" />
        <form onSubmit={submit} className="auth-form">
          <div className="form-heading">
            <KeyRound size={16} />
            <span>
              {session.setupRequired
                ? "최초 관리자 설정 / INITIAL SETUP"
                : "보안 인증 / IDENTITY VERIFICATION"}
            </span>
          </div>
          <label>
            접속 아이디 / USER ID
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="접속 아이디"
            />
          </label>
          {session.setupRequired && (
            <label>
              표시 이름 / DISPLAY NAME
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="관리자 표시 이름"
              />
            </label>
          )}
          <label>
            비밀번호 / PASSWORD
            <input
              type="password"
              autoComplete={
                session.setupRequired ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={session.setupRequired ? 12 : 1}
              placeholder="••••••••••••"
            />
          </label>
          {session.setupRequired && (
            <label>
              비밀번호 확인 / CONFIRM PASSWORD
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                placeholder="••••••••••••"
              />
            </label>
          )}
          {message && (
            <div className="form-error" role="alert">
              <AlertTriangle size={14} />
              {message}
            </div>
          )}
          <button className="primary-button auth-submit" disabled={busy}>
            {busy
              ? "확인 중..."
              : session.setupRequired
                ? "관리자 계정 생성 및 접속"
                : "보안망 접속"}
            <span>↗</span>
          </button>
        </form>
        <p className="auth-disclaimer">
          본 시스템의 모든 기록은 가상 DHY 세계관에 관한 것입니다.
        </p>
      </div>
      <div className="auth-side">
        <div className="side-grid" />
        <span className="vertical-label">SECURITY PROTOCOL // ACTIVE</span>
        <div className="side-block">
          <span>00 / 10</span>
          <strong>
            ACCESS
            <br />
            CONTROL
          </strong>
          <small>
            모든 접속 시도는 기록됩니다.
            <br />
            All access attempts are logged.
          </small>
        </div>
      </div>
    </div>
  );
}

export default function DhyApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dangerFilter, setDangerFilter] = useState("");
  const [filterOptions, setFilterOptions] = useState<{
    statuses: string[];
    dangers: string[];
  }>({ statuses: [], dangers: [] });
  const [selected, setSelected] = useState<Detail | null>(null);
  const [editing, setEditing] = useState<RecordItem | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const user = session?.user;
  const grades = session?.grades ?? [];
  const active = nav.find((x) => x.key === tab) ?? nav[0];

  const reloadSession = useCallback(async () => {
    try {
      setSession(await api<Session>("session"));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, []);
  useEffect(() => {
    reloadSession();
  }, [reloadSession]);
  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      setDashboard(await api<Dashboard>("dashboard"));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [user?.id]);
  const loadList = useCallback(async () => {
    if (!user || (!active.kind && tab !== "search")) return;
    setBusy(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (active.kind) params.set("kind", active.kind);
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (dangerFilter) params.set("danger", dangerFilter);
      if (active.wanted) params.set("wanted", "1");
      const result = await api<{ items: RecordItem[]; total: number }>(
        `records?${params}`,
      );
      setItems(result.items);
      setTotal(result.total);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }, [
    user?.id,
    active.kind,
    active.wanted,
    tab,
    page,
    search,
    statusFilter,
    dangerFilter,
  ]);
  useEffect(() => {
    if (user) {
      loadDashboard();
      api<{ values: Record<string, any> }>("settings")
        .then((r) => setSettings(r.values))
        .catch(() => {});
      api<{ statuses: string[]; dangers: string[] }>("filters")
        .then(setFilterOptions)
        .catch(() => {});
    }
  }, [user?.id, loadDashboard]);
  useEffect(() => {
    if (active.kind || tab === "search") loadList();
  }, [loadList, active.kind, tab]);
  useEffect(() => {
    if (!selected?.record.id) return;
  }, [selected?.record.id]);
  async function openRecord(id: string) {
    try {
      setSelected(await api<Detail>(`records/${id}`));
      setEditing(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  function navigate(key: string) {
    setTab(key);
    setPage(1);
    setSearch("");
    setStatusFilter("");
    setDangerFilter("");
    setSelected(null);
    setEditing(null);
    setMenuOpen(false);
    setError("");
  }
  async function logout() {
    try {
      await api("auth/logout", { method: "POST" });
      setSession((s) => (s ? { ...s, user: null } : null));
      setSelected(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  async function afterMutation(id?: string) {
    setEditing(null);
    await Promise.all([
      loadDashboard(),
      loadList(),
      api<{ statuses: string[]; dangers: string[] }>("filters").then(
        setFilterOptions,
      ),
    ]);
    if (id) await openRecord(id);
    else setSelected(null);
  }
  if (!session)
    return (
      <div className="boot-screen">
        <span className="spinner" /> INITIALIZING SECURE TERMINAL
      </div>
    );
  if (!user) return <AuthScreen session={session} onDone={reloadSession} />;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            {settings.logoKey ? (
              <img src="/api/logo" alt="기관 로고" />
            ) : settings.logoFileId ? (
              <img
                src={`/api/files/${settings.logoFileId}?inline=1`}
                alt="기관 로고"
              />
            ) : (
              <Shield size={25} strokeWidth={1.15} />
            )}
          </div>
          <div>
            <strong>
              DHY
              <span className="brand-line" />
              DATABASE
            </strong>
            <small>CLASSIFIED NETWORK</small>
          </div>
          <button
            className="close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="network-status">
          <span className="pulse-dot" /> SECURE CONNECTION <b>ACTIVE</b>
        </div>
        <div className="nav-caption">
          OPERATIONAL MODULES <span>01 / 03</span>
        </div>
        <nav className="nav-list" aria-label="기밀망 탐색">
          {nav.map((item, index) =>
            item.admin && user.role !== "admin" ? null : (
              <button
                key={item.key}
                className={`nav-item ${tab === item.key ? "active" : ""} ${index === 5 || index === 10 || index === 14 ? "nav-spaced" : ""}`}
                onClick={() => navigate(item.key)}
              >
                <item.icon size={16} strokeWidth={1.6} />
                <span>
                  {item.ko}
                  <small>{item.en}</small>
                </span>
                {tab === item.key && <i />}
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="classification-mark">
            <LockKeyhole size={15} />
            <span>
              DHY INTERNAL / <b>RESTRICTED</b>
            </span>
          </div>
          <small>
            가상 DHY 세계관의 수사 기록 전산망
            <br />© DHY CLASSIFIED DATABASE
          </small>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            DHY / <span>{active.en}</span>
          </div>
          <div className="topbar-right">
            <div className="header-time">
              {new Date().toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}{" "}
              KST
            </div>
            <Grade value={user.clearance} grades={grades} />
            <div className="user-badge">
              <span>{user.displayName.slice(0, 1)}</span>
              <div>
                <b>{user.displayName}</b>
                <small>
                  {user.role === "admin" ? "ADMINISTRATOR" : "INVESTIGATOR"}
                </small>
              </div>
            </div>
            <button className="icon-button" title="로그아웃" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="main-content">
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <span className="red-square" /> DHY SECURE TERMINAL{" "}
                <span className="slash">/</span> {active.en}
              </div>
              <h1>
                {active.ko}
                <span className="head-period">.</span>
              </h1>
              <p>
                {tab === "dashboard"
                  ? "현재 데이터베이스에 등록된 수사 현황을 실시간으로 표시합니다."
                  : tab === "graph"
                    ? "인물·조직·사건의 연결 관계를 탐색합니다."
                    : tab === "admin"
                      ? "계정과 데이터 설정을 관리합니다."
                      : "등록된 기록만 표시됩니다. 미등록 정보는 미확인으로 유지됩니다."}
              </p>
            </div>
            <div className="head-stamp">
              CONFIDENTIAL
              <br />
              <strong>
                DHY //{" "}
                {String(nav.findIndex((x) => x.key === tab) + 1).padStart(
                  2,
                  "0",
                )}
              </strong>
            </div>
          </div>
          {error && (
            <div className="global-error" role="alert">
              <AlertTriangle size={15} />
              {error}
              <button onClick={() => setError("")} aria-label="오류 닫기">
                <X size={14} />
              </button>
            </div>
          )}
          {tab === "dashboard" && (
            <DashboardView
              data={dashboard}
              onOpen={openRecord}
              onNavigate={navigate}
              grades={grades}
            />
          )}
          {(active.kind || tab === "search") && (
            <section className="listing">
              <div className="panel-toolbar">
                <div className="searchbox">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="이름, 관리번호, 키워드 검색 / SEARCH RECORDS"
                    aria-label="기록 검색"
                  />
                </div>
                <div className="list-filters">
                  <select
                    aria-label="상태 필터"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(1);
                      setStatusFilter(e.target.value);
                    }}
                  >
                    <option value="">전체 상태</option>
                    {filterOptions.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="위험등급 필터"
                    value={dangerFilter}
                    onChange={(e) => {
                      setPage(1);
                      setDangerFilter(e.target.value);
                    }}
                  >
                    <option value="">전체 위험등급</option>
                    {filterOptions.dangers.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="toolbar-actions">
                  <span className="count-label">
                    TOTAL <b>{total.toLocaleString()}</b>
                  </span>
                  {user.role === "admin" && active.kind && (
                    <button
                      className="primary-button"
                      onClick={() => setEditing("new")}
                    >
                      <Plus size={16} /> 기록 추가
                    </button>
                  )}
                </div>
              </div>
              <div className="table-wrap">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>관리번호 / FILE NO.</th>
                      <th>
                        {active.kind === "person"
                          ? "인물 / SUBJECT"
                          : "기록 / RECORD"}
                      </th>
                      <th>상태 / STATUS</th>
                      <th>등급 / CLEARANCE</th>
                      <th>최종 수정 / UPDATED</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} onClick={() => openRecord(item.id)}>
                        <td className="mono record-no">{item.recordNo}</td>
                        <td>
                          <div className="subject-cell">
                            <div className="subject-photo">
                              {item.photoKey ? (
                                <img
                                  src={`/api/files/${item.photoKey}?inline=1`}
                                  alt=""
                                />
                              ) : item.kind === "person" ? (
                                <span className="photo-redacted-small">
                                  기밀
                                </span>
                              ) : (
                                <UserRound size={17} />
                              )}
                            </div>
                            <div>
                              <strong>{item.title}</strong>
                              <small>
                                {item.subtitle ||
                                  item.data.position ||
                                  "정보 미확인"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {item.wanted === true ? (
                            <span className="status-wanted">● 수배 중</span>
                          ) : (
                            <span className="status-neutral">
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td>
                          <Grade value={item.classification} grades={grades} />
                        </td>
                        <td className="muted mono">{fmt(item.updatedAt)}</td>
                        <td>
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!busy && items.length === 0 && (
                  <Empty title="등록된 기록이 없습니다" />
                )}
                {busy && <div className="table-loading">기록 조회 중...</div>}
              </div>
              <div className="pagination">
                <span>
                  {total === 0 ? 0 : (page - 1) * 30 + 1}–
                  {Math.min(page * 30, total)} / {total.toLocaleString()}{" "}
                  RECORDS
                </span>
                <div>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <b>{page}</b>
                  <button
                    disabled={page * 30 >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </section>
          )}
          {tab === "graph" && <GraphView onOpen={openRecord} grades={grades} />}
          {tab === "audit" && <AuditView />}
          {tab === "admin" && (
            <AdminView
              user={user}
              grades={grades}
              settings={settings}
              onSettings={async () => {
                const r = await api<{ values: Record<string, any> }>(
                  "settings",
                );
                setSettings(r.values);
              }}
            />
          )}
        </div>
        <footer className="app-footer">
          <span>
            DHY CLASSIFIED DATABASE <i>•</i> FICTIONAL UNIVERSE
          </span>
          <span>
            AUTHORIZED PERSONNEL ONLY <i>•</i> 모든 접속은 기록됩니다.
          </span>
        </footer>
      </main>
      {selected && (
        <RecordDetail
          detail={selected}
          user={user}
          grades={grades}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(selected.editRecord ?? selected.record)}
          onDelete={async () => {
            if (!confirm("이 기록을 삭제 처리하시겠습니까?")) return;
            try {
              await api(`records/${selected.record.id}`, { method: "DELETE" });
              await afterMutation();
            } catch (cause) {
              setError((cause as Error).message);
            }
          }}
          onRefresh={() => openRecord(selected.record.id)}
          onOpenRelated={openRecord}
        />
      )}
      {editing && (
        <RecordEditor
          key={editing === "new" ? `new-${tab}` : editing.id}
          record={editing === "new" ? null : editing}
          kind={active.kind ?? "person"}
          grades={grades}
          dangerGrades={
            Array.isArray(settings.dangerGrades) ? settings.dangerGrades : []
          }
          user={user}
          onClose={() => setEditing(null)}
          onSaved={afterMutation}
        />
      )}
    </div>
  );
}

function DashboardView({
  data,
  onOpen,
  onNavigate,
  grades,
}: {
  data: Dashboard | null;
  onOpen: (id: string) => void;
  onNavigate: (key: string) => void;
  grades: string[];
}) {
  if (!data) return <div className="table-loading">상황실 연결 중...</div>;
  const cards = [
    {
      label: "등록 인물",
      en: "REGISTERED SUBJECTS",
      value: data.counts.person ?? 0,
      icon: UserRound,
      tab: "person",
    },
    {
      label: "국제 수배",
      en: "ACTIVE WARRANTS",
      value: data.wanted,
      icon: ShieldAlert,
      tab: "wanted",
    },
    {
      label: "범죄 조직",
      en: "ORGANIZATIONS",
      value: data.counts.organization ?? 0,
      icon: Users,
      tab: "organization",
    },
    {
      label: "미해결 사건",
      en: "OPEN CASES",
      value: data.unresolved,
      icon: FolderClosed,
      tab: "case",
    },
  ];
  return (
    <div className="dashboard-view">
      <div className="dashboard-banner">
        <div>
          <span className="banner-live">
            <span className="pulse-dot" /> LIVE DATABASE STATUS
          </span>
          <h2>
            수사 현황 <em>종합 브리핑</em>
          </h2>
          <p>표시된 수치는 접근 가능한 DB 기록에서 직접 산출됩니다.</p>
        </div>
        <div className="banner-rings">
          <span>
            DHY
            <br />
            SECURE
          </span>
        </div>
      </div>
      <div className="stats-grid">
        {cards.map((c) => (
          <button
            className="stat-card"
            key={c.label}
            onClick={() => onNavigate(c.tab)}
          >
            <div className="stat-top">
              <c.icon size={20} strokeWidth={1.5} />
              <span>↗</span>
            </div>
            <strong>{c.value.toLocaleString()}</strong>
            <div>
              {c.label}
              <small>{c.en}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="dash-columns">
        <section className="panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">INTELLIGENCE FEED / 01</span>
              <h3>최근 갱신 기록</h3>
            </div>
            <button onClick={() => onNavigate("person")}>
              전체 기록 보기 <ChevronRight size={15} />
            </button>
          </div>
          {data.recent.length ? (
            <div className="feed-list">
              {data.recent.map((item) => (
                <button key={item.id} onClick={() => onOpen(item.id)}>
                  <span className="feed-icon">
                    <FileText size={16} />
                  </span>
                  <span className="feed-body">
                    <strong>{item.title}</strong>
                    <small>
                      {item.recordNo} <i>·</i> {item.kind.toUpperCase()}
                    </small>
                  </span>
                  <Grade value={item.classification} grades={grades} />
                  <time>{fmt(item.updatedAt)}</time>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="최근 기록이 없습니다" />
          )}
        </section>
        <div className="right-stack">
          <section className="panel alert-panel">
            <div className="panel-title">
              <div>
                <span className="section-kicker red">
                  PRIORITY CHANNEL / 02
                </span>
                <h3>긴급 경보</h3>
              </div>
              <AlertTriangle size={17} />
            </div>
            {data.alerts.length ? (
              data.alerts.map((item) => (
                <button
                  className="alert-row"
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                >
                  <strong>{item.title}</strong>
                  <small>{fmt(item.updatedAt)}</small>
                </button>
              ))
            ) : (
              <div className="alert-empty">
                <ShieldCheck size={25} />
                <strong>현재 발령된 긴급 경보 없음</strong>
                <small>NO ACTIVE ALERTS IN DATABASE</small>
              </div>
            )}
          </section>
          <section className="panel reports-panel">
            <div className="panel-title">
              <div>
                <span className="section-kicker">FIELD REPORTS / 03</span>
                <h3>최근 수사 보고서</h3>
              </div>
              <button onClick={() => onNavigate("report")}>
                전체 보기 <ChevronRight size={15} />
              </button>
            </div>
            {data.reports.length ? (
              data.reports.map((item) => (
                <button
                  className="alert-row"
                  key={item.id}
                  onClick={() => onOpen(item.id)}
                >
                  <strong>{item.title}</strong>
                  <small>
                    {item.recordNo} · {fmt(item.updatedAt)}
                  </small>
                </button>
              ))
            ) : (
              <div className="danger-empty reports-empty">
                등록된 수사 보고서가 없습니다.
              </div>
            )}
          </section>
          <section className="panel danger-panel">
            <div className="panel-title">
              <div>
                <span className="section-kicker">RISK DISTRIBUTION / 04</span>
                <h3>위험등급 분포</h3>
              </div>
            </div>
            {data.danger.length ? (
              data.danger.map((d) => (
                <div className="danger-row" key={d.danger}>
                  <span>{d.danger}</span>
                  <div>
                    <i
                      style={{
                        width: `${Math.max(8, (d.count / Math.max(data.counts.person || 1, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <b>{d.count}</b>
                </div>
              ))
            ) : (
              <div className="danger-empty">
                위험등급 분류가 아직 등록되지 않았습니다.
              </div>
            )}
          </section>
        </div>
      </div>
      <div className="dashboard-bottom">
        <div>
          <span className="red-square" /> DATABASE INTEGRITY <b>OPERATIONAL</b>
        </div>
        <span>가상 세계관 데이터 / FICTIONAL UNIVERSE RECORDS</span>
      </div>
    </div>
  );
}

function RecordDetail({
  detail,
  user,
  grades,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
  onOpenRelated,
}: {
  detail: Detail;
  user: User;
  grades: string[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onOpenRelated: (id: string) => void;
}) {
  const { record, revisions, files } = detail;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [asPhoto, setAsPhoto] = useState(false);
  const [fileGrade, setFileGrade] = useState(record.classification);
  const [related, setRelated] = useState<
    { id: string; title: string; label: string; recordNo: string }[]
  >([]);
  useEffect(() => {
    api<{
      items: { id: string; title: string; label: string; recordNo: string }[];
    }>(`records/${record.id}/relations`)
      .then((r) => setRelated(r.items))
      .catch(() => setRelated([]));
  }, [record.id]);
  const fields = fieldDefs[record.kind] ?? [
    ["summary", "내용 / DETAILS", "textarea"],
  ];
  const extraFields = Object.keys(record.data)
    .filter(
      (key) =>
        !fields.some((field) => field[0] === key) &&
        !["secretPage", "sections"].includes(key) &&
        !metricKeys.has(key),
    )
    .map((key) => [key, key, "text"] as [string, string, "text"]);
  const detailFields = [...fields, ...extraFields];
  const metrics =
    record.kind === "person"
      ? metricDefs.filter(
          ([key]) => record.data[key] !== undefined && record.data[key] !== "",
        )
      : [];
  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.set("recordId", record.id);
      form.set("file", file);
      form.set("classification", String(fileGrade));
      form.set("asPhoto", String(asPhoto));
      await api("files", { method: "POST", body: form });
      setFile(null);
      setAsPhoto(false);
      onRefresh();
    } catch (cause) {
      setUploadError((cause as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="detail-drawer" aria-label={`${record.title} 수사 기록`}>
        <div className="drawer-top">
          <div>
            <span className="section-kicker">
              CLASSIFIED RECORD / 수사 기록
            </span>
            <strong>{record.recordNo}</strong>
          </div>
          <button onClick={onClose} aria-label="기록 닫기">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-scroll">
          <div className="file-hero">
            <div className="file-photo">
              {record.photoKey ? (
                <img
                  src={`/api/files/${record.photoKey}?inline=1`}
                  alt={`${record.title} 사진`}
                />
              ) : record.kind === "person" ? (
                <div className="photo-redacted-large">
                  <LockKeyhole size={24} strokeWidth={1.3} />
                  <span>사진 기밀</span>
                  <small>IMAGE CLASSIFIED</small>
                </div>
              ) : (
                <UserRound size={48} strokeWidth={1} />
              )}
            </div>
            <div>
              <span className="file-kind">
                {record.kind.toUpperCase()} / DOSSIER
              </span>
              <h2>{record.title}</h2>
              <p>{record.subtitle || "등록된 부가 이름 없음"}</p>
              <Grade value={record.classification} grades={grades} />
            </div>
          </div>
          <div className="file-status">
            <div>
              <small>수배 여부 / WANTED</small>
              <strong className={record.wanted ? "danger-text" : ""}>
                {record.wanted === null
                  ? "미확인"
                  : record.wanted
                    ? "수배 중"
                    : "수배 대상 아님"}
              </strong>
            </div>
            <div>
              <small>현재 상태 / STATUS</small>
              <strong>{unknown(record.status)}</strong>
            </div>
            <div>
              <small>위험등급 / RISK</small>
              <strong>{unknown(record.danger)}</strong>
            </div>
          </div>
          {metrics.length > 0 && (
            <div className="metric-panel">
              <div className="metric-title">
                전투 지표 <span>SUBJECT METRICS</span>
              </div>
              <div className="metric-grid">
                {metrics.map(([key, label]) => (
                  <div key={key}>
                    <div>
                      <span>{label}</span>
                      <strong>{record.data[key]}%</strong>
                    </div>
                    <i>
                      <b
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(record.data[key]) || 0))}%`,
                        }}
                      />
                    </i>
                  </div>
                ))}
              </div>
              <small>
                OPK 지수: 한 사람을 죽이는 데 필요한 전체 소모 가능 에너지의
                비율
              </small>
            </div>
          )}
          <div className="detail-section">
            <div className="detail-section-title">
              <span>01</span>
              <h3>기본 수사 정보</h3>
              <small>PRIMARY INTELLIGENCE</small>
            </div>
            <div className="field-grid">
              {detailFields
                .filter(([key]) => !metricKeys.has(key))
                .map(([key, label]) => (
                  <div className="data-field" key={key}>
                    <small>{label}</small>
                    <div className={record.data[key] ? "" : "unknown"}>
                      {unknown(record.data[key])}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {record.data.secretPage && user.clearance >= 7 && (
            <div className="secret-section">
              <div className="detail-section-title">
                <span>!</span>
                <h3>비밀 페이지</h3>
                <small>LEVEL 7+ ONLY</small>
              </div>
              <div className="secret-stamp">
                RESTRICTED ACCESS // 열람 기록 대상
              </div>
              <h4>{record.data.secretPage.title}</h4>
              <p>{unknown(record.data.secretPage.content)}</p>
            </div>
          )}
          {Array.isArray(record.data.sections) && (
            <div className="detail-section">
              <div className="detail-section-title">
                <span>02</span>
                <h3>문서 본문</h3>
                <small>DOCUMENT BODY</small>
              </div>
              {record.data.sections.map((s: any, i: number) => (
                <div className="doc-section" key={i}>
                  <small>
                    SECTION {String(i + 1).padStart(2, "0")} · L
                    {s.classification ?? 1}
                  </small>
                  <p
                    className={
                      String(s.text).includes("[REDACTED") ? "redacted" : ""
                    }
                  >
                    {unknown(s.text)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="detail-section">
            <div className="detail-section-title">
              <span>03</span>
              <h3>관련 기록</h3>
              <small>LINKED RECORDS</small>
            </div>
            {related.length ? (
              <div className="related-list">
                {related.map((r) => (
                  <button key={r.id} onClick={() => onOpenRelated(r.id)}>
                    <GitBranch size={15} />
                    <span>
                      <strong>{r.title}</strong>
                      <small>
                        {r.label} · {r.recordNo}
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted detail-note">등록된 관계가 없습니다.</p>
            )}
          </div>
          <div className="detail-section">
            <div className="detail-section-title">
              <span>04</span>
              <h3>첨부자료</h3>
              <small>ATTACHMENTS / PHOTOS</small>
            </div>
            {files.length ? (
              <div className="attachment-list">
                {files.map((f) => (
                  <div key={f.id}>
                    <FileText size={17} />
                    <span>
                      <strong>{f.filename}</strong>
                      <small>
                        {(f.size / 1024).toFixed(0)} KB · L{f.classification}
                      </small>
                    </span>
                    <a
                      href={`/api/files/${f.id}`}
                      download
                      title="파일 다운로드"
                    >
                      <Download size={16} />
                    </a>
                    {user.role === "admin" &&
                      f.content_type.startsWith("image/") && (
                        <button
                          onClick={async () => {
                            try {
                              await api(
                                "settings",
                                request("POST", {
                                  key: "logoFileId",
                                  value: f.id,
                                }),
                              );
                              alert(
                                "기관 로고로 지정했습니다. 화면을 새로고침하면 적용됩니다.",
                              );
                            } catch (cause) {
                              setUploadError((cause as Error).message);
                            }
                          }}
                          title="기관 로고로 지정"
                        >
                          <Shield size={16} />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted detail-note">첨부자료가 없습니다.</p>
            )}
            {user.role === "admin" && (
              <form className="upload-form" onSubmit={upload}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div>
                  <select
                    value={fileGrade}
                    onChange={(e) => setFileGrade(Number(e.target.value))}
                  >
                    {grades.map((g, i) => (
                      <option key={g} value={i + 1}>
                        L{i + 1} {g}
                      </option>
                    ))}
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={asPhoto}
                      onChange={(e) => setAsPhoto(e.target.checked)}
                    />{" "}
                    인물 대표 사진
                  </label>
                  <button
                    className="small-button"
                    disabled={!file || uploading}
                  >
                    <Upload size={14} /> 업로드
                  </button>
                </div>
                {uploadError && (
                  <small className="danger-text">{uploadError}</small>
                )}
              </form>
            )}
          </div>
          <div className="detail-section">
            <div className="detail-section-title">
              <span>05</span>
              <h3>수정 이력</h3>
              <small>REVISION HISTORY</small>
            </div>
            {revisions.length ? (
              <div className="revision-list">
                {revisions.map((r, i) => (
                  <div key={r.id}>
                    <b>REV {String(revisions.length - i).padStart(2, "0")}</b>
                    <span>{fmt(r.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted detail-note">수정 이력이 없습니다.</p>
            )}
          </div>
          <div className="file-meta">
            생성 {fmt(record.createdAt)} · 마지막 수정 {fmt(record.updatedAt)}
          </div>
        </div>
        {user.role === "admin" && (
          <div className="drawer-actions">
            <button className="secondary-button" onClick={onDelete}>
              <Trash2 size={16} /> 기록 삭제
            </button>
            <button className="primary-button" onClick={onEdit}>
              <FilePlus2 size={16} /> 기록 수정
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function RecordEditor({
  record,
  kind,
  grades,
  dangerGrades,
  user,
  onClose,
  onSaved,
}: {
  record: RecordItem | null;
  kind: string;
  grades: string[];
  dangerGrades: string[];
  user: User;
  onClose: () => void;
  onSaved: (id?: string) => Promise<void>;
}) {
  const actualKind = record?.kind ?? (kind === "wanted" ? "person" : kind);
  const defs = fieldDefs[actualKind] ?? [
    ["summary", "내용 / DETAILS", "textarea"],
  ];
  const [title, setTitle] = useState(record?.title ?? "");
  const [subtitle, setSubtitle] = useState(record?.subtitle ?? "");
  const [classification, setClassification] = useState(
    record?.classification ?? 1,
  );
  const [status, setStatus] = useState(record?.status ?? "미확인");
  const [wanted, setWanted] = useState(
    record?.wanted === null || record?.wanted === undefined
      ? "unknown"
      : record.wanted
        ? "yes"
        : "no",
  );
  const [danger, setDanger] = useState(record?.danger ?? "");
  const [data, setData] = useState<Record<string, any>>(record?.data ?? {});
  const [extra, setExtra] = useState<[string, string][]>(() =>
    Object.entries(record?.data ?? {})
      .filter(
        ([key]) =>
          !defs.some((d) => d[0] === key) &&
          !["secretPage", "sections"].includes(key),
      )
      .map(([k, v]) => [k, String(v)]),
  );
  const [sections, setSections] = useState<
    { text: string; classification: number; redacted: boolean }[]
  >(record?.data.sections ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canHaveSections = ["document", "report", "case", "operation"].includes(
    actualKind,
  );
  function fieldValue(key: string) {
    const val = data[key];
    return Array.isArray(val)
      ? val.join("\n")
      : val === null || val === undefined
        ? ""
        : String(val);
  }
  function updateField(key: string, val: string) {
    setData((d) => ({
      ...d,
      [key]: listKeys.has(key)
        ? val
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
        : val,
    }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const payloadData: Record<string, any> = { ...data };
    for (const [key, value] of extra)
      if (key.trim()) payloadData[key.trim()] = value;
    if (canHaveSections) payloadData.sections = sections;
    try {
      const payload = {
        kind: actualKind,
        title,
        subtitle,
        classification,
        status,
        wanted: wanted === "unknown" ? null : wanted === "yes",
        danger,
        data: payloadData,
      };
      if (record) {
        await api(`records/${record.id}`, request("PUT", payload));
        await onSaved(record.id);
      } else {
        const result = await api<{ id: string }>(
          "records",
          request("POST", payload),
        );
        await onSaved(result.id);
      }
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="editor-modal" onSubmit={save}>
        <div className="modal-head">
          <div>
            <span className="section-kicker">
              {record ? "REVISE CLASSIFIED FILE" : "OPEN NEW CASE FILE"}
            </span>
            <h2>{record ? "기록 수정" : "새 기록 등록"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="편집 닫기">
            <X size={20} />
          </button>
        </div>
        <div className="modal-scroll">
          <div className="editor-banner">
            <Shield size={18} /> 입력한 내용만 공식 DHY 기록으로 저장됩니다.
            미입력 항목은 미확인으로 표시됩니다.
          </div>
          <div className="editor-grid">
            <label className="span-2">
              이름 또는 제목 / RECORD TITLE
              <input
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공식 명칭 입력"
              />
            </label>
            <label>
              부제 또는 별칭 / SUBTITLE
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="선택 사항"
              />
            </label>
            <label>
              현재 상태 / STATUS
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="미확인"
              />
            </label>
            <label>
              보안등급 / CLASSIFICATION
              <select
                value={classification}
                onChange={(e) => setClassification(Number(e.target.value))}
              >
                {grades.map(
                  (g, i) =>
                    i + 1 <= user.clearance && (
                      <option key={g} value={i + 1}>
                        L{i + 1} {g}
                      </option>
                    ),
                )}
              </select>
            </label>
            <label>
              위험등급 / RISK CODE
              {dangerGrades.length ? (
                <select
                  value={danger}
                  onChange={(e) => setDanger(e.target.value)}
                >
                  <option value="">미확인</option>
                  {dangerGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={danger}
                  onChange={(e) => setDanger(e.target.value)}
                  placeholder="미확인 — 공식 등급 확정 후 입력"
                />
              )}
            </label>
            {actualKind === "person" && (
              <label>
                수배 여부 / WARRANT STATUS
                <select
                  value={wanted}
                  onChange={(e) => setWanted(e.target.value)}
                >
                  <option value="unknown">미확인</option>
                  <option value="yes">수배 중</option>
                  <option value="no">수배 대상 아님</option>
                </select>
              </label>
            )}
          </div>
          <div className="editor-section-title">
            상세 정보 <span>DETAILS</span>
          </div>
          <div className="editor-grid">
            {defs.map(([key, label, type]) => (
              <label key={key} className={type === "textarea" ? "span-2" : ""}>
                {label}
                {type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={fieldValue(key)}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder="미확인"
                  />
                ) : (
                  <input
                    type={metricKeys.has(key) ? "number" : "text"}
                    min={metricKeys.has(key) ? 0 : undefined}
                    max={metricKeys.has(key) ? 100 : undefined}
                    step={metricKeys.has(key) ? "any" : undefined}
                    value={fieldValue(key)}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder="미확인"
                  />
                )}
              </label>
            ))}
          </div>
          {data.secretPage && user.clearance >= 7 && (
            <>
              <div className="editor-section-title">
                비밀 페이지 <span>LEVEL 7+ ONLY</span>
              </div>
              <div className="editor-grid">
                <label className="span-2">
                  제목
                  <input
                    value={data.secretPage.title ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        secretPage: {
                          ...d.secretPage,
                          title: e.target.value,
                          classification: 7,
                        },
                      }))
                    }
                  />
                </label>
                <label className="span-2">
                  내용
                  <textarea
                    rows={4}
                    value={
                      data.secretPage.content === "미확인"
                        ? ""
                        : (data.secretPage.content ?? "")
                    }
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        secretPage: {
                          ...d.secretPage,
                          content: e.target.value || "미확인",
                          classification: 7,
                        },
                      }))
                    }
                    placeholder="미확인"
                  />
                </label>
              </div>
            </>
          )}
          {canHaveSections && (
            <>
              <div className="editor-section-title">
                문서 본문 <span>SECTIONS & REDACTION</span>
              </div>
              <div className="sections-editor">
                {sections.map((section, index) => (
                  <div className="section-editor" key={index}>
                    <div>
                      <b>SECTION {String(index + 1).padStart(2, "0")}</b>
                      <select
                        value={section.classification}
                        onChange={(e) =>
                          setSections((list) =>
                            list.map((s, i) =>
                              i === index
                                ? {
                                    ...s,
                                    classification: Number(e.target.value),
                                  }
                                : s,
                            ),
                          )
                        }
                      >
                        {grades.map(
                          (g, i) =>
                            i + 1 <= user.clearance && (
                              <option key={g} value={i + 1}>
                                L{i + 1} {g}
                              </option>
                            ),
                        )}
                      </select>
                      <label>
                        <input
                          type="checkbox"
                          checked={section.redacted}
                          onChange={(e) =>
                            setSections((list) =>
                              list.map((s, i) =>
                                i === index
                                  ? { ...s, redacted: e.target.checked }
                                  : s,
                              ),
                            )
                          }
                        />{" "}
                        검열
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSections((list) =>
                            list.filter((_, i) => i !== index),
                          )
                        }
                        aria-label="문단 제거"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={section.text}
                      onChange={(e) =>
                        setSections((list) =>
                          list.map((s, i) =>
                            i === index ? { ...s, text: e.target.value } : s,
                          ),
                        )
                      }
                      placeholder="문서 문단 입력"
                    />
                  </div>
                ))}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setSections((list) => [
                      ...list,
                      { text: "", classification: 1, redacted: false },
                    ])
                  }
                >
                  <Plus size={15} /> 문단 추가
                </button>
              </div>
            </>
          )}
          <div className="editor-section-title">
            사용자 정의 항목 <span>CUSTOM FIELDS</span>
          </div>
          <div className="extra-fields">
            {extra.map(([key, value], index) => (
              <div key={index}>
                <input
                  aria-label="항목명"
                  placeholder="항목명"
                  value={key}
                  onChange={(e) =>
                    setExtra((list) =>
                      list.map((row, i) =>
                        i === index ? [e.target.value, row[1]] : row,
                      ),
                    )
                  }
                />
                <input
                  aria-label="항목 값"
                  placeholder="정보"
                  value={value}
                  onChange={(e) =>
                    setExtra((list) =>
                      list.map((row, i) =>
                        i === index ? [row[0], e.target.value] : row,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setExtra((list) => list.filter((_, i) => i !== index))
                  }
                  aria-label="항목 제거"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              className="secondary-button"
              type="button"
              onClick={() => setExtra((list) => [...list, ["", ""]])}
            >
              <Plus size={15} /> 항목 추가
            </button>
          </div>
          {message && (
            <div className="form-error" role="alert">
              <AlertTriangle size={14} />
              {message}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            취소
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? "저장 중..." : "기록 저장"}
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function GraphView({
  onOpen,
  grades,
}: {
  onOpen: (id: string) => void;
  grades: string[];
}) {
  const [nodes, setNodes] = useState<RecordItem[]>([]);
  const [edges, setEdges] = useState<
    { id: string; source_id: string; target_id: string; label: string }[]
  >([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [relationFilter, setRelationFilter] = useState("all");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [dragging, setDragging] = useState<{
    id?: string;
    x: number;
    y: number;
  } | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const canvas = useRef<SVGSVGElement>(null);
  const load = useCallback(async () => {
    try {
      const [a, session] = await Promise.all([
        api<{ nodes: RecordItem[]; edges: any[] }>(
          `graph?q=${encodeURIComponent(query)}`,
        ),
        api<Session>("session"),
      ]);
      setNodes(a.nodes);
      setEdges(a.edges);
      setIsAdmin(session.user?.role === "admin");
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }, [query]);
  useEffect(() => {
    const timer = setTimeout(() => load(), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);
  useEffect(() => {
    setPositions((current) => {
      const next = { ...current };
      nodes.forEach((n, i) => {
        if (!next[n.id]) {
          const a = i * 2.399963;
          const r = 70 + 25 * Math.sqrt(i);
          next[n.id] = { x: 450 + Math.cos(a) * r, y: 330 + Math.sin(a) * r };
        }
      });
      return next;
    });
  }, [nodes]);
  const visibleNodes = useMemo(
    () => nodes.filter((n) => filter === "all" || n.kind === filter),
    [nodes, filter],
  );
  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );
  const visibleEdges = edges.filter(
    (e) =>
      visibleIds.has(e.source_id) &&
      visibleIds.has(e.target_id) &&
      (relationFilter === "all" || e.label === relationFilter),
  );
  function point(e: React.PointerEvent<SVGElement>) {
    const rect = canvas.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 900) / rect.width,
      y: ((e.clientY - rect.top) * 660) / rect.height,
    };
  }
  function pointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    const p = point(e);
    const dx = (p.x - dragging.x) / scale,
      dy = (p.y - dragging.y) / scale;
    if (dragging.id)
      setPositions((pos) => ({
        ...pos,
        [dragging.id!]: {
          x: pos[dragging.id!].x + dx,
          y: pos[dragging.id!].y + dy,
        },
      }));
    else
      setOffset((o) => ({
        x: o.x + p.x - dragging.x,
        y: o.y + p.y - dragging.y,
      }));
    setDragging({ ...dragging, x: p.x, y: p.y });
  }
  async function addRelation(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      await api(
        "relations",
        request("POST", { sourceId, targetId, label, classification: 1 }),
      );
      setLabel("");
      await load();
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }
  return (
    <div className="graph-layout">
      <div className="graph-main">
        <div className="graph-toolbar">
          <div className="searchbox">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="노드 검색 / SEARCH NODES"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체 관계</option>
            <option value="person">인물</option>
            <option value="organization">조직</option>
            <option value="case">사건</option>
            <option value="region">지역</option>
          </select>
          <select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
          >
            <option value="all">모든 관계</option>
            {[...new Set(edges.map((e) => e.label))].map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <span>
            {visibleNodes.length} NODES / {visibleEdges.length} LINKS
          </span>
        </div>
        <div className="graph-canvas">
          <div className="graph-grid" />
          <svg
            ref={canvas}
            viewBox="0 0 900 660"
            onPointerMove={pointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
            onWheel={(e) => {
              e.preventDefault();
              setScale((v) =>
                Math.max(0.5, Math.min(2.5, v + (e.deltaY < 0 ? 0.1 : -0.1))),
              );
            }}
          >
            <rect
              x="0"
              y="0"
              width="900"
              height="660"
              fill="transparent"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const p = point(e);
                setDragging({ x: p.x, y: p.y });
              }}
            />
            <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
              {visibleEdges.map((e) => {
                const a = positions[e.source_id],
                  b = positions[e.target_id];
                if (!a || !b) return null;
                return (
                  <g key={e.id}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#627184"
                      strokeWidth="1.2"
                      strokeDasharray="5 5"
                    />
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 8}
                      textAnchor="middle"
                      fill="#9da9b7"
                      fontSize="10"
                    >
                      {e.label}
                    </text>
                  </g>
                );
              })}
              {visibleNodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${p.x} ${p.y})`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const q = point(e);
                      setDragging({ id: n.id, x: q.x, y: q.y });
                    }}
                    onDoubleClick={() => onOpen(n.id)}
                    style={{ cursor: "grab" }}
                  >
                    <circle
                      r="34"
                      fill="#151d28"
                      stroke={n.kind === "person" ? "#a43e42" : "#627184"}
                      strokeWidth="1.5"
                    />
                    <circle r="29" fill="#1e2936" />
                    {n.photoKey ? (
                      <image
                        href={`/api/files/${n.photoKey}?inline=1`}
                        x="-28"
                        y="-28"
                        width="56"
                        height="56"
                        clipPath="circle(28px at 28px 28px)"
                      />
                    ) : (
                      <text
                        y="6"
                        textAnchor="middle"
                        fill="#d7dde4"
                        fontSize="17"
                      >
                        {n.title.slice(0, 1)}
                      </text>
                    )}
                    <text
                      y="51"
                      textAnchor="middle"
                      fill="#e9edf2"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {n.title}
                    </text>
                    <text
                      y="65"
                      textAnchor="middle"
                      fill="#8794a6"
                      fontSize="8"
                    >
                      {n.recordNo}
                    </text>
                    <circle
                      cx="25"
                      cy="-25"
                      r="4"
                      fill={n.kind === "person" ? "#d05257" : "#8d9dae"}
                    />
                    <rect
                      x="-34"
                      y="-34"
                      width="68"
                      height="68"
                      fill="transparent"
                      onClick={() => onOpen(n.id)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="graph-controls">
            <button onClick={() => setScale((v) => Math.min(2.5, v + 0.2))}>
              ＋
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((v) => Math.max(0.5, v - 0.2))}>
              －
            </button>
            <button
              onClick={() => {
                setScale(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              RESET
            </button>
          </div>
          {nodes.length === 0 && (
            <div className="graph-empty">관계도에 표시할 인물이 없습니다.</div>
          )}
        </div>
        <div className="graph-hint">
          노드를 클릭하면 수사 기록이 열립니다. 노드를 끌어서 배치하고, 빈
          공간을 끌어 이동하거나 휠로 확대·축소할 수 있습니다.
        </div>
      </div>
      <aside className="graph-side">
        <div className="panel">
          <span className="section-kicker">NETWORK INDEX</span>
          <h3>연결 관계</h3>
          {visibleEdges.length ? (
            <div className="edge-list">
              {visibleEdges.map((e) => (
                <div key={e.id}>
                  <GitBranch size={14} />
                  <span>
                    {nodes.find((n) => n.id === e.source_id)?.title} <b>→</b>{" "}
                    {nodes.find((n) => n.id === e.target_id)?.title}
                    <small>{e.label}</small>
                  </span>
                  {isAdmin && (
                    <button
                      title="관계 삭제"
                      onClick={async () => {
                        if (!confirm("이 관계를 삭제할까요?")) return;
                        await api(`relations/${e.id}`, { method: "DELETE" });
                        load();
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="graph-side-empty">등록된 관계가 없습니다.</p>
          )}
        </div>
        {isAdmin && (
          <form className="panel relation-form" onSubmit={addRelation}>
            <span className="section-kicker">RELATION EDITOR</span>
            <h3>관계 설정</h3>
            <label>
              출발 기록
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">기록 선택</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              연결 기록
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">기록 선택</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              관계 유형
              <input
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="창작자가 확정한 관계"
              />
            </label>
            <button className="primary-button">
              <Plus size={15} /> 관계 등록
            </button>
            {message && <small className="danger-text">{message}</small>}
          </form>
        )}
      </aside>
    </div>
  );
}

function AuditView() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<{ items: any[] }>("audit")
      .then((r) => setRows(r.items))
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="panel audit-panel">
      <div className="panel-title">
        <div>
          <span className="section-kicker">SECURITY AUDIT TRAIL</span>
          <h3>시스템 접속 및 변경 기록</h3>
        </div>
        <span>최근 200건</span>
      </div>
      {message && <div className="form-error">{message}</div>}
      <div className="table-wrap">
        <table className="record-table">
          <thead>
            <tr>
              <th>시간 / TIME</th>
              <th>이벤트 / EVENT</th>
              <th>담당 ID / ACTOR</th>
              <th>대상 / TARGET</th>
              <th>접속 IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{fmt(r.created_at)}</td>
                <td>{r.event}</td>
                <td className="mono">
                  {r.actor_id ? r.actor_id.slice(0, 8) : "—"}
                </td>
                <td className="mono">
                  {r.entity_type
                    ? `${r.entity_type} / ${(r.entity_id ?? "").slice(0, 8)}`
                    : "—"}
                </td>
                <td className="mono muted">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty title="접속 기록이 없습니다" />}
      </div>
    </section>
  );
}

function AdminView({
  user,
  grades,
  settings,
  onSettings,
}: {
  user: User;
  grades: string[];
  settings: Record<string, any>;
  onSettings: () => Promise<void>;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investigator");
  const [clearance, setClearance] = useState(1);
  const [active, setActive] = useState(true);
  const [gradeNames, setGradeNames] = useState(grades);
  const [dangerGrades, setDangerGrades] = useState("");
  const [agencyName, setAgencyName] = useState("세계적 흉악범죄 수사청");
  const [logo, setLogo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const loadUsers = useCallback(async () => {
    try {
      const r = await api<{ items: any[] }>("users");
      setUsers(r.items);
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }, []);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    setGradeNames(grades);
  }, [grades]);
  useEffect(() => {
    setAgencyName(settings.agencyName ?? "세계적 흉악범죄 수사청");
    setDangerGrades(
      Array.isArray(settings.dangerGrades)
        ? settings.dangerGrades.join("\n")
        : "",
    );
  }, [settings]);
  function choose(u: any | null) {
    setSelected(u);
    setUsername(u?.username ?? "");
    setDisplayName(u?.display_name ?? "");
    setPassword("");
    setRole(u?.role ?? "investigator");
    setClearance(u?.clearance ?? 1);
    setActive(u ? Boolean(u.active) : true);
    setMessage("");
  }
  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (selected)
        await api(
          `users/${selected.id}`,
          request("PUT", { displayName, password, role, clearance, active }),
        );
      else
        await api(
          "users",
          request("POST", { username, displayName, password, role, clearance }),
        );
      setMessage("계정 정보가 저장되었습니다.");
      choose(null);
      await loadUsers();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveSetting(key: string, value: unknown) {
    setBusy(true);
    setMessage("");
    try {
      await api("settings", request("POST", { key, value }));
      await onSettings();
      setMessage("설정이 저장되었습니다.");
      if (key === "securityGrades") window.location.reload();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function uploadLogo() {
    if (!logo) return;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", logo);
      await api("logo", { method: "POST", body: form });
      setMessage("기관 로고가 저장되었습니다.");
      await onSettings();
      window.location.reload();
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportData() {
    setMessage("");
    try {
      const response = await fetch("/api/export", {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("내보내기에 실패했습니다.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dhy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }
  async function importData(file: File | null) {
    if (!file) return;
    setMessage("");
    try {
      const data = JSON.parse(await file.text());
      const result = await api<{
        imported: number;
        relationsImported: number;
        filesImported: number;
        settingsImported: number;
      }>("import", request("POST", data));
      setMessage(
        `기록 ${result.imported}건, 관계 ${result.relationsImported}건, 첨부 목록 ${result.filesImported}건, 설정 ${result.settingsImported}건을 가져왔습니다.`,
      );
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }
  return (
    <div className="admin-layout">
      <section className="panel admin-accounts">
        <div className="panel-title">
          <div>
            <span className="section-kicker">IDENTITY & ACCESS CONTROL</span>
            <h3>계정 관리</h3>
          </div>
          <button onClick={() => choose(null)}>
            <Plus size={15} /> 새 계정
          </button>
        </div>
        <div className="account-grid">
          <div className="account-list">
            {users.map((u) => (
              <button
                key={u.id}
                className={selected?.id === u.id ? "selected" : ""}
                onClick={() => choose(u)}
              >
                <span className="account-avatar">
                  {u.display_name.slice(0, 1)}
                </span>
                <span>
                  <strong>{u.display_name}</strong>
                  <small>
                    {u.username} ·{" "}
                    {u.role === "admin" ? "ADMIN" : "INVESTIGATOR"}
                  </small>
                </span>
                <span
                  className={u.active ? "account-active" : "account-inactive"}
                >
                  {u.active ? "ACTIVE" : "DISABLED"}
                </span>
              </button>
            ))}
          </div>
          <form onSubmit={saveUser} className="account-form">
            <h4>{selected ? "계정 수정" : "새 수사관 계정"}</h4>
            <label>
              아이디 / USER ID
              <input
                required
                disabled={!!selected}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문·숫자 3자 이상"
              />
            </label>
            <label>
              표시 이름 / DISPLAY NAME
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="표시 이름"
              />
            </label>
            <label>
              비밀번호 / PASSWORD
              <input
                type="password"
                required={!selected}
                minLength={password ? 12 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  selected ? "변경할 때만 입력 (12자 이상)" : "12자 이상"
                }
              />
            </label>
            <div className="account-form-row">
              <label>
                역할
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="investigator">일반 수사관</option>
                  <option value="admin">관리자</option>
                </select>
              </label>
              <label>
                보안등급
                <select
                  value={clearance}
                  onChange={(e) => setClearance(Number(e.target.value))}
                >
                  {grades.map(
                    (g, i) =>
                      i + 1 <= user.clearance && (
                        <option key={i} value={i + 1}>
                          L{i + 1} {g}
                        </option>
                      ),
                  )}
                </select>
              </label>
            </div>
            {selected && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />{" "}
                계정 활성화
              </label>
            )}
            <button className="primary-button" disabled={busy}>
              {selected ? "계정 변경 저장" : "계정 생성"}
              <ChevronRight size={15} />
            </button>
          </form>
        </div>
      </section>
      <div className="admin-right">
        <section className="panel">
          <span className="section-kicker">AGENCY IDENTITY</span>
          <h3>기관 표기 및 로고</h3>
          <label>
            기관명 / AGENCY NAME
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </label>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => saveSetting("agencyName", agencyName)}
          >
            기관명 저장
          </button>
          <div className="logo-upload">
            <span>기관 로고 / EMBLEM</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
            <button
              className="secondary-button"
              disabled={!logo || busy}
              onClick={uploadLogo}
            >
              <Upload size={15} /> 로고 업로드
            </button>
          </div>
        </section>
        <section className="panel">
          <span className="section-kicker">CLASSIFICATION MATRIX</span>
          <h3>보안등급 관리</h3>
          <div className="grade-settings">
            {gradeNames.map((name, index) => (
              <label key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  value={name}
                  onChange={(e) =>
                    setGradeNames((g) =>
                      g.map((v, i) => (i === index ? e.target.value : v)),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => saveSetting("securityGrades", gradeNames)}
          >
            보안등급 저장
          </button>
          <label className="danger-settings">
            위험등급 명칭 / RISK CLASSES
            <textarea
              rows={4}
              value={dangerGrades}
              onChange={(e) => setDangerGrades(e.target.value)}
              placeholder="확정된 등급을 줄바꿈으로 입력"
            />
          </label>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() =>
              saveSetting(
                "dangerGrades",
                dangerGrades
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          >
            위험등급 저장
          </button>
        </section>
        <section className="panel">
          <span className="section-kicker">DATA PORTABILITY</span>
          <h3>JSON 가져오기 · 내보내기</h3>
          <p className="admin-note">
            수사 기록, 관계, 설정과 첨부파일 목록을 JSON으로 내보냅니다. 파일
            원본은 서버 저장소에 남아 있으므로 별도 보관이 필요합니다.
          </p>
          <div className="backup-actions">
            <button className="secondary-button" onClick={exportData}>
              <Download size={15} /> JSON 내보내기
            </button>
            <label className="secondary-button file-button">
              <Upload size={15} /> JSON 가져오기
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => importData(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </section>
        {message && (
          <div className="global-error">
            <ShieldCheck size={15} />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
