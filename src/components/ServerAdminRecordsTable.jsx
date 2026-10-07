import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react";
import InquiryDateFilter from "./AdminDateRangeFilter";
import styles from "./AdminRecordsTable.module.css";

export default function ServerAdminRecordsTable({
  fetchPage,
  statuses,
  onDelete,
  onView,
  roleLabel,
  roleValue,
  onTotalChange,
  inquiryStatusCounts,
}) {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [rows, setRows] = useState([]),
    [meta, setMeta] = useState({ total: 0, totalPages: 1 }),
    [reload, setReload] = useState(0),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchPage(q, status, page, 10, from, to)
        .then((r) => {
          if (live) {
            setRows(r.items);
            setMeta(r.pagination);
            onTotalChange?.(r.pagination.total);
          }
        })
        .finally(() => live && setLoading(false));
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [fetchPage, from, onTotalChange, page, q, reload, status, to]);
  const reset = (fn, value) => {
    fn(value);
    setPage(1);
  };
  return (
    <>
      <div className={styles.tools}>
        <label>
          <Search size={14} />
          <input
            type="search"
            value={q}
            onChange={(e) => reset(setQ, e.target.value)}
            placeholder="Search name, email, number or role…"
          />
          {q && (
            <button
              type="button"
              className={styles.searchClear}
              aria-label="Clear search"
              title="Clear search"
              onClick={() => reset(setQ, "")}
            >
              <X size={13} />
            </button>
          )}
        </label>
        <InquiryDateFilter
          fromDate={from}
          toDate={to}
          onApply={(a, b) => {
            setFrom(a);
            setTo(b);
            setPage(1);
          }}
        />
        <div>
          {[["all", "All"], ...Object.entries(statuses)].map(([v, l]) => (
            <button
              className={status === v ? styles.active : ""}
              onClick={() => reset(setStatus, v)}
              key={v}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.summary}>
        Showing {rows.length} of {meta.total} records
      </div>
      {loading && rows.length === 0 ? (
        <p className={styles.empty}>Loading records…</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No records match these filters.</p>
      ) : (
        <div className={styles.wrap}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Number</th>
                <th>{roleLabel}</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>
                      {item.firstName} {item.lastName}
                    </strong>
                  </td>
                  <td>
                    <strong>{item.email}</strong>
                  </td>
                  <td>
                    <strong>{item.phone}</strong>
                  </td>
                  <td>{roleValue(item)}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <b>{statuses[item.status]}</b>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        title="View details"
                        aria-label={`View ${item.firstName} ${item.lastName}`}
                        onClick={() => onView(item)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        title="Delete record"
                        aria-label={`Delete ${item.firstName} ${item.lastName}`}
                        onClick={async () => {
                          await onDelete(item);
                          if (rows.length === 1 && page > 1)
                            setPage((v) => v - 1);
                          else setReload((v) => v + 1);
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
      <nav className={styles.pagination} aria-label="Records pagination">
        <span>
          Page {page} of {meta.totalPages}
        </span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: meta.totalPages }, (_, index) => index + 1)
            .filter(
              (number) =>
                number === 1 ||
                number === meta.totalPages ||
                Math.abs(number - page) <= 1,
            )
            .map((number, index, pages) => (
              <span key={number}>
                {index > 0 && number - pages[index - 1] > 1 && <i>…</i>}
                <button
                  type="button"
                  className={number === page ? styles.current : ""}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              </span>
            ))}
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((v) => v + 1)}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </nav>
    </>
  );
}
