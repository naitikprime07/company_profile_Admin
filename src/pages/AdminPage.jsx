import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Inbox,
  Files,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Network,
  Newspaper,
  PanelsTopLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Pencil,
  Plus,
  Search,
  X,
  Trash2,
  Users,
} from "lucide-react";
import {
  createOpening,
  deleteContact,
  deleteOpening,
  getDashboard,
  getAdminSidebarCounts,
  getAdminSessionExpiry,
  getAdminOpenings,
  loginAdmin,
  searchContacts,
  searchApplications,
  searchGeneralApplications,
  searchAdminOpenings,
  deleteGeneralApplication,
  deleteApplication,
  expireAdminSession,
} from "../services/adminService";
import styles from "./AdminPage.module.css";
import InquiryDateFilter from "../components/AdminDateRangeFilter";
import ServerAdminRecordsTable from "../components/ServerAdminRecordsTable";
import useConfirmDelete from "../hooks/useConfirmDelete";
import AdminLeadershipManager from "../components/AdminLeadershipManager";
import AdminBlogManager from "../components/AdminBlogManager";
import AdminPortfolioManager from "../components/AdminPortfolioManager";
import AdminHomeStatsManager from "../components/AdminHomeStatsManager";

const STATUS_LABELS = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};
const APPLICATION_STATUS = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};
const VIEW_TITLES = {
  dashboard: "Workspace overview",
  inquiries: "Incoming inquiries",
  applications: "Job applications",
  openings: "Career openings",
  introductions: "Open introductions",
  leadership: "People hierarchy",
  blogs: "Blog management",
  portfolio: "Portfolio management",
  stats: "Homepage stats",
};
const OPENINGS_PER_PAGE = 6;
function AdminPage() {
  const { confirmDelete, deleteDialog } = useConfirmDelete();
  const navigate = useNavigate();
  const [token, setToken] = useState(sessionStorage.getItem("adminToken"));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("adminSidebarCollapsed") === "true",
  );
  const [activeView, setActiveView] = useState(
    [
      "#inquiries",
      "#applications",
      "#openings",
      "#introductions",
      "#leadership",
      "#blogs",
      "#portfolio",
    ].includes(window.location.hash)
      ? window.location.hash.slice(1)
      : sessionStorage.getItem("adminActiveView") || "dashboard",
  );
  const [contacts, setContacts] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [introductionTotal, setIntroductionTotal] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    counts: {},
    applicationPipeline: {},
    recentContacts: [],
  });
  const [sidebarCounts, setSidebarCounts] = useState({
    inquiries: 0,
    applications: 0,
    introductions: 0,
  });
  const [sidebarCountRefresh, setSidebarCountRefresh] = useState(0);
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).get("session") === "expired"
      ? "Your session expired. Please sign in again."
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [inquiryFromDate, setInquiryFromDate] = useState("");
  const [inquiryToDate, setInquiryToDate] = useState("");
  const [openingFilter, setOpeningFilter] = useState("all");
  const [openingSearch, setOpeningSearch] = useState("");
  const [openingFromDate, setOpeningFromDate] = useState("");
  const [openingToDate, setOpeningToDate] = useState("");
  const [openingPage, setOpeningPage] = useState(1);
  const [openingPagination, setOpeningPagination] = useState({
    page: 1,
    limit: OPENINGS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [searchingOpenings, setSearchingOpenings] = useState(false);
  const [deletingInquiry, setDeletingInquiry] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryPagination, setInquiryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [inquiryRefresh, setInquiryRefresh] = useState(0);
  const [searchingInquiries, setSearchingInquiries] = useState(false);
  const [inquiryStatusCounts, setInquiryStatusCounts] = useState({});

  useEffect(() => {
    if (!token) return undefined;

    const handleExpiredSession = () => setToken(null);
    window.addEventListener("admin-session-expired", handleExpiredSession);

    const expiresAt = getAdminSessionExpiry(token);
    let expiryTimer;
    if (expiresAt) {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        expireAdminSession();
      } else {
        expiryTimer = window.setTimeout(expireAdminSession, remaining);
      }
    }

    return () => {
      window.removeEventListener("admin-session-expired", handleExpiredSession);
      if (expiryTimer) window.clearTimeout(expiryTimer);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let current = true;

    getAdminSidebarCounts()
      .then((counts) => {
        if (current) setSidebarCounts(counts);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message);
      });

    return () => {
      current = false;
    };
  }, [sidebarCountRefresh, token]);
  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboard();
      setDashboardData(data);
      setContacts(data.recentContacts || []);
      setApplicationTotal(data.counts?.totalApplications || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeView === "dashboard") {
      loadDashboard();
    }
  }, [activeView, token]);

  const changeView = (view) => {
    if (view === activeView) return;
    if (view === "inquiries") {
      setInquirySearch("");
      setInquiryFilter("all");
      setInquiryFromDate("");
      setInquiryToDate("");
      setInquiryPage(1);
      setFilteredContacts([]);
      setSearchingInquiries(true);
    }
    if (view === "openings") {
      setOpeningFilter("all");
      setOpeningSearch("");
      setOpeningFromDate("");
      setOpeningToDate("");
      setOpeningPage(1);
    }
    sessionStorage.setItem("adminActiveView", view);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}#${view}`,
    );
    setActiveView(view);
  };

  const stats = useMemo(
    () => ({
      total: dashboardData.counts?.totalInquiries || 0,
      new: dashboardData.counts?.newInquiries || 0,
      active: dashboardData.counts?.activeInquiries || 0,
      openings: dashboardData.counts?.openVacancies || 0,
      applications: dashboardData.counts?.totalApplications || 0,
    }),
    [dashboardData],
  );
  const openingTotalPages = openingPagination.totalPages;
  const paginatedOpenings = openings;

  useEffect(() => {
    if (openingPage > openingTotalPages) setOpeningPage(openingTotalPages);
  }, [openingPage, openingTotalPages]);

  useEffect(() => {
    if (!token || activeView !== "openings") return undefined;
    let current = true;
    setSearchingOpenings(true);
    const timer = window.setTimeout(() => {
      searchAdminOpenings(
        openingSearch,
        openingFilter,
        openingPage,
        OPENINGS_PER_PAGE,
        openingFromDate,
        openingToDate,
      )
        .then((result) => {
          if (!current) return;
          setOpenings(result.items);
          setOpeningPagination(result.pagination);
        })
        .catch((requestError) => current && setError(requestError.message))
        .finally(() => current && setSearchingOpenings(false));
    }, 300);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [
    activeView,
    openingFilter,
    openingFromDate,
    openingPage,
    openingSearch,
    openingToDate,
    token,
  ]);

  useEffect(() => {
    if (!token || activeView !== "inquiries") return undefined;
    let current = true;
    const timer = window.setTimeout(async () => {
      setSearchingInquiries(true);
      try {
        const result = await searchContacts(
          inquirySearch,
          inquiryFilter,
          inquiryPage,
          10,
          "all",
          inquiryFromDate,
          inquiryToDate,
        );
        if (current) {
          setFilteredContacts(result.items);
          setInquiryPagination(result.pagination);
          setInquiryStatusCounts(result.statusCounts || {});
        }
      } catch (requestError) {
        if (current) setError(requestError.message);
      } finally {
        if (current) setSearchingInquiries(false);
      }
    }, 300);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [
    activeView,
    inquiryFromDate,
    inquiryFilter,
    inquiryPage,
    inquiryRefresh,
    inquirySearch,
    inquiryToDate,
    token,
  ]);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const form = new FormData(event.currentTarget);
      const data = await loginAdmin(form.get("email"), form.get("password"));
      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminActiveView", "dashboard");
      setActiveView("dashboard");
      window.history.replaceState(null, "", window.location.pathname);
      setError("");
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token)
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginPanel}>
          <div className={styles.brandMark}>
            <img src="/Prime Softech logo icon.png" alt="Prime Softech" />
          </div>
          <p className={styles.kicker}>PRIME SOFTECH · ADMIN</p>
          <h1>Welcome back</h1>
          <p className={styles.loginCopy}>
            Sign in to manage inquiries and career opportunities.
          </p>
          <form onSubmit={login}>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@company.com"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>
            <button disabled={loading}>
              {loading ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <small>Protected administrative access</small>
        </section>
        <div className={styles.loginVisual}>
          <img
            className={styles.loginImage}
            src="/loginPage.png"
            alt="Prime Softech admin workspace"
          />
          <div className={styles.loginVisualCopy}>
            <span>Manage your business</span>
            <h2>One workspace for every new opportunity.</h2>
          </div>
        </div>
      </main>
    );

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminActiveView");
    window.history.replaceState(null, "", "/");
    setToken(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("adminSidebarCollapsed", String(next));
      return next;
    });
  };
  const addOpening = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(form));
      await createOpening({ ...payload, isActive: true });
      form.reset();
      const openingData = await getAdminOpenings();
      setOpenings(openingData);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const removeInquiry = async (contact) => {
    if (
      !(await confirmDelete({
        title: "Delete this inquiry?",
        itemName: contact.name,
      }))
    )
      return;
    setError("");
    setDeletingInquiry(contact._id);
    try {
      await deleteContact(contact._id);
      setContacts((items) => items.filter((item) => item._id !== contact._id));
      setFilteredContacts((items) =>
        items.filter((item) => item._id !== contact._id),
      );
      setInquiryPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        totalPages: Math.max(
          1,
          Math.ceil(Math.max(0, current.total - 1) / current.limit),
        ),
      }));
      setSidebarCountRefresh((value) => value + 1);
      if (filteredContacts.length === 1 && inquiryPage > 1)
        setInquiryPage((page) => page - 1);
      else setInquiryRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingInquiry("");
    }
  };
  return (
    <main
      className={`${styles.dashboard} ${sidebarCollapsed ? styles.sidebarCollapsed : ""} ${activeView === "inquiries" ? styles.inquiriesDashboard : ""}`}
    >
      <aside
        className={styles.sidebar}
        data-collapsed={sidebarCollapsed}
        aria-label="Admin navigation"
      >
        <button
          className={styles.sidebarToggle}
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
        </button>
        <div className={styles.brand}>
          <span>
            <img src="/Prime Softech logo icon.png" alt="" />
          </span>
          <div className={styles.brandText}>
            <strong>Prime Softech</strong>
            <small>Admin workspace</small>
          </div>
        </div>
        <nav>
          <small className={styles.navLabel}>WORKSPACE</small>
          <button
            className={activeView === "dashboard" ? styles.navActive : ""}
            onClick={() => changeView("dashboard")}
            title="Dashboard"
          >
            <LayoutDashboard size={18} />
            <span className={styles.navText}>Dashboard</span>
          </button>
          <small className={styles.navLabel}>MANAGEMENT</small>
          <button
            className={activeView === "inquiries" ? styles.navActive : ""}
            onClick={() => changeView("inquiries")}
            title="Inquiries"
          >
            <Inbox size={18} />
            <span className={styles.navText}>Inquiries</span>
            {sidebarCounts.inquiries > 0 && <b>{sidebarCounts.inquiries}</b>}
          </button>
          <button
            className={activeView === "applications" ? styles.navActive : ""}
            onClick={() => changeView("applications")}
            title="Applications"
          >
            <Files size={18} />
            <span className={styles.navText}>Applications</span>
            {sidebarCounts.applications > 0 && (
              <b>{sidebarCounts.applications}</b>
            )}
          </button>
          <button
            className={activeView === "introductions" ? styles.navActive : ""}
            onClick={() => changeView("introductions")}
            title="Talent introductions"
          >
            <Users size={18} />
            <span className={styles.navText}>Talent introductions</span>
            {sidebarCounts.introductions > 0 && (
              <b>{sidebarCounts.introductions}</b>
            )}
          </button>
          <button
            className={activeView === "openings" ? styles.navActive : ""}
            onClick={() => changeView("openings")}
            title="Career openings"
          >
            <BriefcaseBusiness size={18} />
            <span className={styles.navText}>Career openings</span>
          </button>
          <button
            className={activeView === "leadership" ? styles.navActive : ""}
            onClick={() => changeView("leadership")}
            title="People hierarchy"
          >
            <Network size={18} />
            <span className={styles.navText}>People hierarchy</span>
          </button>
          <button
            className={activeView === "portfolio" ? styles.navActive : ""}
            onClick={() => changeView("portfolio")}
            title="Portfolio"
          >
            <PanelsTopLeft size={18} />
            <span className={styles.navText}>Portfolio</span>
          </button>
          <button
            className={activeView === "blogs" ? styles.navActive : ""}
            onClick={() => changeView("blogs")}
            title="Blogs"
          >
            <Newspaper size={18} />
            <span className={styles.navText}>Blogs</span>
          </button>
          <button
            className={activeView === "stats" ? styles.navActive : ""}
            onClick={() => changeView("stats")}
            title="Homepage stats"
          >
            <Activity size={18} />
            <span className={styles.navText}>Homepage stats</span>
          </button>
        </nav>
        <footer className={styles.sidebarFooter}>
          <button className={styles.logout} onClick={logout} title="Log out">
            <LogOut size={18} />
            <span className={styles.navText}>Log out</span>
          </button>
        </footer>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p>ADMIN CONSOLE / {activeView.toUpperCase()}</p>
            <h1>{VIEW_TITLES[activeView]}</h1>
          </div>
          <div className={styles.headerTools}>
            <span>
              <i /> SYSTEM ONLINE
            </span>
            <div className={styles.avatar}>AD</div>
          </div>
        </header>
        {error && (
          <p className={styles.banner} role="alert">
            {error}
          </p>
        )}

        {activeView === "dashboard" && (
          <section className={styles.stats}>
            <article>
              <span>
                <Users size={20} />
              </span>
              <div>
                <small>Total inquiries</small>
                <strong>{stats.total}</strong>
              </div>
            </article>
            <article>
              <span>
                <Inbox size={20} />
              </span>
              <div>
                <small>New requests</small>
                <strong>{stats.new}</strong>
              </div>
            </article>
            <article>
              <span>
                <Files size={20} />
              </span>
              <div>
                <small>Applications</small>
                <strong>{stats.applications}</strong>
              </div>
            </article>
            <article>
              <span>
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <small>Open positions</small>
                <strong>{stats.openings}</strong>
              </div>
            </article>
          </section>
        )}
        {activeView === "dashboard" ? (
          <section className={styles.dashboardHome}>
            <div className={styles.activityPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Recent inquiries</h2>
                  <p>The latest conversations waiting for your team.</p>
                </div>
                <button onClick={() => changeView("inquiries")}>
                  View all <ArrowUpRight size={15} />
                </button>
              </div>
              <div className={styles.activityList}>
                {contacts.length === 0 ? (
                  <p className={styles.empty}>No inquiries received yet.</p>
                ) : (
                  contacts.slice(0, 5).map((contact) => (
                    <article key={contact._id}>
                      <span className={styles.personInitial}>
                        {contact.name?.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{contact.name}</strong>
                        <small>
                          {contact.company || "Independent"} · {contact.service}
                        </small>
                      </div>
                      <time>
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </time>
                      <b className={styles[contact.status]}>
                        {STATUS_LABELS[contact.status]}
                      </b>
                    </article>
                  ))
                )}
              </div>
            </div>
            <aside className={styles.dashboardSide}>
              <section className={styles.healthCard}>
                <header>
                  <span>
                    <Activity size={17} />
                  </span>
                  <div>
                    <small>WORKSPACE HEALTH</small>
                    <strong>Everything is on track</strong>
                  </div>
                </header>
                <div>
                  <span>
                    <i
                      style={{
                        width: `${stats.total ? Math.round((stats.new / stats.total) * 100) : 0}%`,
                      }}
                    />
                  </span>
                  <p>
                    <b>{stats.new}</b> new inquiries
                  </p>
                </div>
                <div>
                  <span>
                    <i
                      style={{
                        width: `${stats.applications ? Math.round(((dashboardData.counts?.reviewedApplications || 0) / stats.applications) * 100) : 0}%`,
                      }}
                    />
                  </span>
                  <p>
                    <b>{dashboardData.counts?.reviewedApplications || 0}</b>{" "}
                    applications reviewed
                  </p>
                </div>
              </section>
              <section className={styles.quickCard}>
                <small>QUICK ACTIONS</small>
                <button onClick={() => changeView("openings")}>
                  <span>
                    <Plus size={16} />
                  </span>
                  <div>
                    <strong>Publish opening</strong>
                    <small>Create a new career opportunity</small>
                  </div>
                  <ArrowUpRight size={15} />
                </button>
                <button onClick={() => changeView("applications")}>
                  <span>
                    <Files size={16} />
                  </span>
                  <div>
                    <strong>Review candidates</strong>
                    <small>
                      {dashboardData.counts?.newApplications || 0} awaiting
                      review
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </button>
              </section>
            </aside>
            <div className={styles.hiringPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Hiring pipeline</h2>
                  <p>A live view of candidate progress.</p>
                </div>
                <span>{stats.applications} candidates</span>
              </div>
              <div className={styles.pipelineGrid}>
                {Object.entries(APPLICATION_STATUS).map(([status, label]) => (
                  <article key={status}>
                    <span className={styles[status]}>{label}</span>
                    <strong>
                      {dashboardData.applicationPipeline?.[status] || 0}
                    </strong>
                    <small>candidates</small>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : activeView === "inquiries" ? (
          <div className={styles.inquiryWorkspace}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Contact requests</h2>
                  <p>Review and follow up with prospective clients.</p>
                </div>
                <span>{inquiryPagination.total} records</span>
              </div>
              <div className={styles.inquiryTools}>
                <label>
                  <Search size={15} />
                  <input
                    type="search"
                    value={inquirySearch}
                    onChange={(event) => {
                      setInquirySearch(event.target.value);
                      setInquiryPage(1);
                    }}
                    placeholder="Search name, company, email or number…"
                  />
                  {inquirySearch && (
                    <button
                      type="button"
                      className={styles.clearSearch}
                      aria-label="Clear search"
                      onClick={() => {
                        setInquirySearch("");
                        setInquiryPage(1);
                      }}
                    >
                      ×
                    </button>
                  )}
                </label>
                <InquiryDateFilter
                  fromDate={inquiryFromDate}
                  toDate={inquiryToDate}
                  onApply={(from, to) => {
                    setInquiryFromDate(from);
                    setInquiryToDate(to);
                    setInquiryPage(1);
                  }}
                />
                <div className={styles.inquiryStatusFilters}>
                  {[
                    ["all", "All"],
                    ["new", "New"],
                    ["in_progress", "In progress"],
                    ["resolved", "Resolved"],
                  ].map(([value, label]) => {
                    return (
                      <button
                        className={
                          inquiryFilter === value ? styles.filterActive : ""
                        }
                        onClick={() => {
                          setInquiryFilter(value);
                          setInquiryPage(1);
                        }}
                        key={value}
                      >
                        {label}
                        {value !== "all" && (
                          <b>{inquiryStatusCounts[value] || 0}</b>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.resultSummary}>
                <span>
                  Showing <strong>{filteredContacts.length}</strong> of{" "}
                  {inquiryPagination.total} matching inquiries
                </span>
                {inquirySearch && (
                  <span>
                    Search: <strong>“{inquirySearch}”</strong>
                  </span>
                )}
              </div>
              {loading || searchingInquiries ? (
                <p className={styles.empty}>Searching inquiries…</p>
              ) : filteredContacts.length === 0 ? (
                <p className={styles.empty}>
                  {inquiryPagination.total
                    ? "No inquiries match your search or filter."
                    : "No inquiries received yet."}
                </p>
              ) : (
                <>
                  <div className={styles.inquiryTableWrap}>
                    <table className={styles.inquiryTable}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Number</th>
                          <th>Company</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => (
                          <tr key={contact._id}>
                            <td>
                              <strong>{contact.name}</strong>
                            </td>
                            <td>
                              <strong>{contact.email}</strong>
                            </td>
                            <td>
                              <strong>{contact.phone}</strong>
                            </td>
                            <td>
                              <span>{contact.company || "Independent"}</span>
                            </td>
                            <td>
                              <span>
                                {new Date(
                                  contact.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              <b className={styles[contact.status]}>
                                {STATUS_LABELS[contact.status]}
                              </b>
                            </td>
                            <td>
                              <div className={styles.tableActions}>
                                <button
                                  type="button"
                                  title="View inquiry"
                                  aria-label={`View inquiry from ${contact.name}`}
                                  onClick={() =>
                                    navigate(`/inquiries/${contact._id}`)
                                  }
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete inquiry"
                                  aria-label={`Delete inquiry from ${contact.name}`}
                                  disabled={deletingInquiry === contact._id}
                                  onClick={() => removeInquiry(contact)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <nav
                    className={styles.pagination}
                    aria-label="Inquiry pagination"
                  >
                    <span>
                      Page {inquiryPagination.page} of{" "}
                      {inquiryPagination.totalPages}
                    </span>
                    <div>
                      <button
                        type="button"
                        disabled={inquiryPagination.page <= 1}
                        onClick={() => setInquiryPage((page) => page - 1)}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      {Array.from(
                        { length: inquiryPagination.totalPages },
                        (_, index) => index + 1,
                      )
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === inquiryPagination.totalPages ||
                            Math.abs(page - inquiryPagination.page) <= 1,
                        )
                        .map((page, index, pages) => (
                          <span key={page}>
                            {index > 0 && page - pages[index - 1] > 1 && (
                              <i>…</i>
                            )}
                            <button
                              type="button"
                              className={
                                page === inquiryPagination.page
                                  ? styles.currentPage
                                  : ""
                              }
                              onClick={() => setInquiryPage(page)}
                            >
                              {page}
                            </button>
                          </span>
                        ))}
                      <button
                        type="button"
                        disabled={
                          inquiryPagination.page >= inquiryPagination.totalPages
                        }
                        onClick={() => setInquiryPage((page) => page + 1)}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </nav>
                </>
              )}
            </section>
          </div>
        ) : activeView === "applications" ? (
          <section className={`${styles.panel} ${styles.recordsPanel}`}>
            <div className={styles.panelHead}>
              <div>
                <h2>Candidate applications</h2>
                <p>
                  Review applicants, download resumes, and manage hiring
                  progress.
                </p>
              </div>
              <span>{applicationTotal} records</span>
            </div>
            <ServerAdminRecordsTable
              key="job-applications-table"
              fetchPage={searchApplications}
              statuses={APPLICATION_STATUS}
              roleLabel="Opening"
              roleValue={(item) => item.openingTitle}
              onTotalChange={setApplicationTotal}
              onView={(item) => navigate(`/applications/${item._id}`)}
              onDelete={async (item) => {
                if (
                  !(await confirmDelete({
                    title: "Delete this application?",
                    itemName: `${item.firstName} ${item.lastName}`,
                  }))
                )
                  return;
                await deleteApplication(item._id);
                setSidebarCountRefresh((value) => value + 1);
              }}
            />
          </section>
        ) : activeView === "introductions" ? (
          <section className={`${styles.panel} ${styles.recordsPanel}`}>
            <div className={styles.panelHead}>
              <div>
                <h2>Talent introductions</h2>
                <p>
                  People interested in joining even when no exact role is
                  listed.
                </p>
              </div>
              <span>{introductionTotal} records</span>
            </div>
            <ServerAdminRecordsTable
              key="open-introductions-table"
              fetchPage={searchGeneralApplications}
              statuses={{
                new: "New",
                reviewing: "Reviewing",
                contacted: "Contacted",
                archived: "Archived",
              }}
              roleLabel="Interested role"
              roleValue={(item) => item.desiredRole}
              onTotalChange={setIntroductionTotal}
              onView={(item) => navigate(`/introductions/${item._id}`)}
              onDelete={async (item) => {
                if (
                  !(await confirmDelete({
                    title: "Delete this introduction?",
                    itemName: `${item.firstName} ${item.lastName}`,
                  }))
                )
                  return;
                await deleteGeneralApplication(item._id);
                setSidebarCountRefresh((value) => value + 1);
              }}
            />
          </section>
        ) : activeView === "portfolio" ? (
          <AdminPortfolioManager confirmDelete={confirmDelete} />
        ) : activeView === "blogs" ? (
          <AdminBlogManager confirmDelete={confirmDelete} />
        ) : activeView === "leadership" ? (
          <AdminLeadershipManager confirmDelete={confirmDelete} />
        ) : activeView === "stats" ? (
          <AdminHomeStatsManager confirmDelete={confirmDelete} />
        ) : (
          <div className={styles.openingLayout}>
            <div className={styles.openingControlsPanel}>
              <div className={styles.openingManagerBar}>
                <div>
                  <strong>Manage openings</strong>
                  <span>
                    Filter, edit, or remove published career opportunities.
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.managementCreateButton}
                  onClick={() => navigate("/openings/new")}
                >
                  <Plus size={15} /> Create opening
                </button>
              </div>
              <div className={styles.openingSearchTools}>
                <label>
                  <Search size={14} />
                  <input
                    type="search"
                    value={openingSearch}
                    onChange={(event) => {
                      setOpeningSearch(event.target.value);
                      setOpeningPage(1);
                    }}
                    placeholder="Search title, location, experience or commitment…"
                  />
                  {openingSearch && (
                    <button
                      type="button"
                      aria-label="Clear opening search"
                      onClick={() => {
                        setOpeningSearch("");
                        setOpeningPage(1);
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </label>
                <InquiryDateFilter
                  fromDate={openingFromDate}
                  toDate={openingToDate}
                  onApply={(from, to) => {
                    setOpeningFromDate(from);
                    setOpeningToDate(to);
                    setOpeningPage(1);
                  }}
                />
              </div>
              <div className={styles.openingFilters}>
                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                  ["experienced", "Experienced"],
                  ["internship", "Internships"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    className={
                      openingFilter === value ? styles.filterActive : ""
                    }
                    key={value}
                    onClick={() => {
                      setOpeningFilter(value);
                      setOpeningPage(1);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <section className={`${styles.panel} ${styles.legacyOpeningForm}`}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Publish an opening</h2>
                  <p>Add a position to the public Career page.</p>
                </div>
                <Plus size={20} />
              </div>
              <form className={styles.openingForm} onSubmit={addOpening}>
                <label>
                  Position title
                  <input
                    name="title"
                    placeholder="e.g. Senior React Developer"
                    required
                  />
                </label>
                <div>
                  <label>
                    Opportunity type
                    <select name="type">
                      <option value="internship">Internship</option>
                      <option value="experienced">
                        Experienced opportunity
                      </option>
                    </select>
                  </label>
                  <label>
                    Location
                    <input
                      name="location"
                      placeholder="Surat, Gujarat / Remote"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Experience required
                    <input
                      name="experience"
                      maxLength="100"
                      placeholder="e.g. 2–4 years / Fresher"
                      required
                    />
                  </label>
                  <label>
                    Commitment
                    <select name="commitment" required>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship program">
                        Internship program
                      </option>
                    </select>
                  </label>
                </div>
                <label>
                  Number of openings
                  <input
                    name="vacancies"
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    defaultValue="1"
                    required
                  />
                </label>
                <label>
                  Short summary
                  <textarea
                    name="description"
                    rows="3"
                    maxLength="1000"
                    placeholder="A concise summary shown on the opening card…"
                    required
                  />
                </label>
                <label>
                  Role overview
                  <textarea
                    name="roleOverview"
                    rows="6"
                    maxLength="3000"
                    placeholder="Explain the role, responsibilities, team context, and expected impact…"
                    required
                  />
                </label>
                <label>
                  Key requirements
                  <textarea
                    name="keyRequirements"
                    rows="7"
                    maxLength="4000"
                    placeholder={
                      "Add one requirement per line, for example:\n3+ years of React experience\nStrong JavaScript fundamentals\nClear communication skills"
                    }
                    required
                  />
                </label>
                <button>
                  <Plus size={17} /> Publish opening
                </button>
              </form>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Published openings</h2>
                  <p>Currently managed positions.</p>
                </div>
                <span>
                  {openings.length} shown · {openingPagination.total} total
                </span>
              </div>
              <div className={styles.openingList}>
                {searchingOpenings ? (
                  <p className={styles.empty}>Loading openings…</p>
                ) : openings.length === 0 ? (
                  <p className={styles.empty}>
                    {openingSearch || openingFilter !== "all" || openingFromDate
                      ? "No openings match these filters."
                      : "No openings published."}
                  </p>
                ) : (
                  paginatedOpenings.map((opening) => (
                    <article key={opening._id}>
                      <div>
                        <div className={styles.openingBadges}>
                          <small>{opening.type}</small>
                          <small
                            className={
                              opening.isActive
                                ? styles.activeOpening
                                : styles.inactiveOpening
                            }
                          >
                            {opening.isActive ? "Active" : "Inactive"}
                          </small>
                        </div>
                        <h3>{opening.title}</h3>
                        <span className={styles.openingDatum}>
                          <small>LOCATION</small>
                          <MapPin size={14} />
                          {opening.location}
                        </span>
                        <span className={styles.openingDatum}>
                          <small>EXPERIENCE</small>
                          {opening.experience ||
                            "Experience not specified"} ·{" "}
                          {opening.commitment || "Full-time"}
                        </span>
                        <span className={styles.openingDatum}>
                          <small>AVAILABILITY</small>
                          {Number(opening.vacancies) || 1}{" "}
                          {(Number(opening.vacancies) || 1) === 1
                            ? "vacancy"
                            : "vacancies"}
                        </span>
                        <p>{opening.description}</p>
                      </div>
                      <div className={styles.openingActions}>
                        <button
                          type="button"
                          aria-label={`Edit ${opening.title}`}
                          title="Edit opening"
                          onClick={() =>
                            navigate(`/openings/${opening._id}/edit`)
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${opening.title}`}
                          title="Delete opening"
                          onClick={async () => {
                            if (
                              !(await confirmDelete({
                                title: "Delete this opening?",
                                itemName: opening.title,
                              }))
                            )
                              return;
                            await deleteOpening(opening._id);
                            setOpenings((items) =>
                              items.filter((item) => item._id !== opening._id),
                            );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {openings.length > 0 && (
                <nav
                  className={styles.pagination}
                  aria-label="Openings pagination"
                >
                  <span>
                    Page {openingPage} of {openingTotalPages}
                  </span>
                  <div>
                    <button
                      type="button"
                      disabled={openingPage <= 1}
                      onClick={() => setOpeningPage((page) => page - 1)}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from(
                      { length: openingTotalPages },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        type="button"
                        className={
                          page === openingPage ? styles.currentPage : ""
                        }
                        key={page}
                        onClick={() => setOpeningPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={openingPage >= openingTotalPages}
                      onClick={() => setOpeningPage((page) => page + 1)}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </nav>
              )}
            </section>
          </div>
        )}
      </div>
      {deleteDialog}
    </main>
  );
}

export default AdminPage;
