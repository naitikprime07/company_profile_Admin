import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBlog, searchAdminBlogs } from "../services/adminService";
import adminStyles from "../pages/AdminPage.module.css";
import styles from "./AdminBlogManager.module.css";

const filters = [
  ["all", "All"],
  ["published", "Published"],
  ["draft", "Draft"],
];

const paginationItems = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, "end-gap", total];
  if (current >= total - 2)
    return [1, "start-gap", total - 3, total - 2, total - 1, total];
  return [1, "start-gap", current - 1, current, current + 1, "end-gap", total];
};

export default function AdminBlogManager({ confirmDelete }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
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
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          setData(await searchAdminBlogs(query, status, page, 10));
        } catch (requestError) {
          setError(requestError.message);
        } finally {
          setLoading(false);
        }
      },
      query ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [query, status, page, refresh]);

  return (
    <div className={adminStyles.inquiryWorkspace}>
      <section className={`${adminStyles.panel} ${styles.blogPanel}`}>
        <div className={adminStyles.panelHead}>
          <div>
            <h2>Blog library</h2>
            <p>Create, publish, edit, and remove company articles.</p>
          </div>
          <span>{data.pagination.total} records</span>
        </div>

        <div className={adminStyles.inquiryTools}>
          <label>
            <Search size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search title, author or category..."
            />
            {query && (
              <button
                type="button"
                className={adminStyles.clearSearch}
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <div className={adminStyles.inquiryStatusFilters}>
            {filters.map(([value, label]) => (
              <button
                type="button"
                className={status === value ? adminStyles.filterActive : ""}
                key={value}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className={adminStyles.managementCreateButton}
              onClick={() => navigate("/blogs/new")}
            >
              <FilePlus2 size={14} /> New article
            </button>
          </div>
        </div>

        <div className={adminStyles.resultSummary}>
          <span>
            Showing <strong>{data.items.length}</strong> of{" "}
            {data.pagination.total} matching articles
          </span>
          {query && (
            <span>
              Search: <strong>{query}</strong>
            </span>
          )}
        </div>

        {error ? (
          <p className={adminStyles.empty}>{error}</p>
        ) : loading ? (
          <p className={adminStyles.empty}>Searching articles...</p>
        ) : data.items.length === 0 ? (
          <p className={adminStyles.empty}>
            {data.pagination.total
              ? "No articles match your search or filter."
              : "No blog articles created yet."}
          </p>
        ) : (
          <div
            className={`${adminStyles.inquiryTableWrap} ${styles.blogTableWrap}`}
          >
            <table className={adminStyles.inquiryTable}>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <div className={styles.titleCell}>
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" />
                        ) : (
                          <span />
                        )}
                        <div>
                          <strong>{post.title}</strong>
                          <p>{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span>{post.category}</span>
                    </td>
                    <td>
                      <strong>{post.author}</strong>
                    </td>
                    <td>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <b
                        className={
                          post.isPublished ? styles.published : styles.draft
                        }
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </b>
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        {post.isPublished && (
                          <button
                            type="button"
                            title="View article"
                            aria-label={`View ${post.title}`}
                            onClick={() =>
                              window.open(`/blog/${post.slug}`, "_blank")
                            }
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Edit article"
                          aria-label={`Edit ${post.title}`}
                          onClick={() =>
                            navigate(`/blogs/${post._id}/edit`)
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete article"
                          aria-label={`Delete ${post.title}`}
                          onClick={async () => {
                            if (
                              !(await confirmDelete({
                                title: "Delete this blog post?",
                                itemName: post.title,
                              }))
                            )
                              return;
                            await deleteBlog(post._id);
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

        <nav className={adminStyles.pagination} aria-label="Blog pagination">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={13} /> Previous
            </button>
            {paginationItems(
              data.pagination.page,
              data.pagination.totalPages,
            ).map((item) =>
              typeof item === "string" ? (
                <i key={item}>...</i>
              ) : (
                <button
                  type="button"
                  className={
                    item === data.pagination.page ? adminStyles.currentPage : ""
                  }
                  key={item}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </nav>
      </section>
    </div>
  );
}
