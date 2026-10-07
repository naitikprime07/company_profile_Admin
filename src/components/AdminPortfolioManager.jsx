import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deletePortfolioItem,
  searchAdminPortfolio,
} from "../services/adminService";
import adminStyles from "../pages/AdminPage.module.css";
import styles from "./AdminBlogManager.module.css";

export default function AdminPortfolioManager({ confirmDelete }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    items: [],
    pagination: { page: 1, total: 0, totalPages: 1 },
  });

  useEffect(() => {
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          setData(await searchAdminPortfolio(query, type, status, page, 10));
        } catch (requestError) {
          setError(requestError.message);
        } finally {
          setLoading(false);
        }
      },
      query ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [page, query, refresh, status, type]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className={adminStyles.inquiryWorkspace}>
      <section className={`${adminStyles.panel} ${styles.blogPanel}`}>
        <div className={adminStyles.panelHead}>
          <div>
            <h2>Portfolio library</h2>
            <p>
              Manage the App and Web work shown on the public Portfolio page.
            </p>
          </div>
          <div className={styles.portfolioHeadActions}>
            {/* <span>{data.pagination.total} records</span> */}
            <button
              type="button"
              className={adminStyles.managementCreateButton}
              onClick={() => navigate("/portfolio/new")}
            >
              <FilePlus2 size={14} /> Add project
            </button>
          </div>
        </div>
        <div className={adminStyles.inquiryTools}>
          <label>
            <Search size={15} />
            <input
              type="search"
              value={query}
              placeholder="Search title, category or technology..."
              onChange={(event) => changeFilter(setQuery, event.target.value)}
            />
            {query && (
              <button
                type="button"
                className={adminStyles.clearSearch}
                onClick={() => changeFilter(setQuery, "")}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className={adminStyles.inquiryStatusFilters}>
            {["all", "app", "web"].map((value) => (
              <button
                type="button"
                key={value}
                className={type === value ? adminStyles.filterActive : ""}
                onClick={() => changeFilter(setType, value)}
              >
                {value === "all"
                  ? "All types"
                  : value === "app"
                    ? "Apps"
                    : "Web"}
              </button>
            ))}
            {["published", "draft"].map((value) => (
              <button
                type="button"
                key={value}
                className={status === value ? adminStyles.filterActive : ""}
                onClick={() =>
                  changeFilter(setStatus, status === value ? "all" : value)
                }
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className={adminStyles.resultSummary}>
          <span>
            Showing <strong>{data.items.length}</strong> of{" "}
            {data.pagination.total} matching projects
          </span>
        </div>

        {error ? (
          <p className={adminStyles.empty}>{error}</p>
        ) : loading ? (
          <p className={adminStyles.empty}>Loading portfolio...</p>
        ) : data.items.length === 0 ? (
          <p className={adminStyles.empty}>
            No portfolio projects match this view.
          </p>
        ) : (
          <div
            className={`${adminStyles.inquiryTableWrap} ${styles.blogTableWrap}`}
          >
            <table className={adminStyles.inquiryTable}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Technologies</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className={styles.titleCell}>
                        {item.image ? (
                          <img src={item.image} alt="" />
                        ) : (
                          <span />
                        )}
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{item.type === "app" ? "App" : "Web"}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.technologies?.slice(0, 3).join(", ") || "—"}</td>
                    <td>
                      <b
                        className={
                          item.isPublished ? styles.published : styles.draft
                        }
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </b>
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        <button
                          type="button"
                          title="Edit project"
                          onClick={() =>
                            navigate(`/portfolio/${item._id}/edit`)
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete project"
                          onClick={async () => {
                            if (
                              !(await confirmDelete({
                                title: "Delete this portfolio project?",
                                itemName: item.title,
                              }))
                            )
                              return;
                            await deletePortfolioItem(item._id);
                            setRefresh((value) => value + 1);
                          }}
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
        )}
        <nav
          className={adminStyles.pagination}
          aria-label="Portfolio pagination"
        >
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </nav>
      </section>
    </div>
  );
}
