import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createHomeStat,
  deleteHomeStat,
  getAdminHomeStats,
  updateHomeStat,
} from "../services/adminService";
import adminStyles from "../pages/AdminPage.module.css";
import styles from "./AdminHomeStatsManager.module.css";

const EMPTY_FORM = {
  value: "",
  suffix: "",
  label: "",
  order: "",
  isActive: true,
};

export default function AdminHomeStatsManager({ confirmDelete }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await getAdminHomeStats());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  const startEdit = (stat) => {
    setEditingId(stat._id);
    setFormError("");
    setForm({
      value: String(stat.value ?? ""),
      suffix: stat.suffix || "",
      label: stat.label || "",
      order: String(stat.order ?? 0),
      isActive: stat.isActive !== false,
    });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const payloadFromForm = () => ({
    value: Number(form.value),
    suffix: form.suffix.trim(),
    label: form.label.trim(),
    order: Number(form.order) || 0,
    isActive: form.isActive,
  });

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!Number.isFinite(Number(form.value)) || form.value === "") {
      setFormError("Enter a numeric value (e.g. 12).");
      return;
    }
    if (form.label.trim().length < 2) {
      setFormError("Enter a descriptive label.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) await updateHomeStat(editingId, payloadFromForm());
      else await createHomeStat(payloadFromForm());
      resetForm();
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (stat) => {
    if (
      !(await confirmDelete({
        title: "Delete this homepage stat?",
        itemName: `${stat.value}${stat.suffix || ""} ${stat.label}`,
      }))
    )
      return;
    try {
      await deleteHomeStat(stat._id);
      if (editingId === stat._id) resetForm();
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleActive = async (stat) => {
    try {
      await updateHomeStat(stat._id, {
        value: stat.value,
        suffix: stat.suffix || "",
        label: stat.label,
        order: stat.order ?? 0,
        isActive: stat.isActive === false,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const DEFAULT_SET = [
    { value: 12, suffix: "+", label: "Years creating digital products", order: 0 },
    { value: 80, suffix: "+", label: "Products shipped with care", order: 1 },
    { value: 24, suffix: "", label: "Senior specialists on our team", order: 2 },
    { value: 9, suffix: "", label: "Countries our clients call home", order: 3 },
  ];

  const seedDefaults = async () => {
    setSaving(true);
    setError("");
    try {
      for (const stat of DEFAULT_SET) await createHomeStat({ ...stat, isActive: true });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.workspace}>
      <section className={adminStyles.panel}>
        <div className={adminStyles.panelHead}>
          <div>
            <h2>Homepage stats</h2>
            <p>
              These counters appear on the public home page. Add, edit, reorder
              (lower shows first) or hide any stat.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label htmlFor="statValue">Value</label>
            <input
              id="statValue"
              type="number"
              min="0"
              step="1"
              value={form.value}
              onChange={updateField("value")}
              placeholder="12"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="statSuffix">Suffix</label>
            <input
              id="statSuffix"
              type="text"
              maxLength={8}
              value={form.suffix}
              onChange={updateField("suffix")}
              placeholder="+"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="statOrder">Order</label>
            <input
              id="statOrder"
              type="number"
              min="0"
              step="1"
              value={form.order}
              onChange={updateField("order")}
              placeholder="0"
            />
          </div>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="statLabel">Label</label>
            <input
              id="statLabel"
              type="text"
              maxLength={120}
              value={form.label}
              onChange={updateField("label")}
              placeholder="Years creating digital products"
            />
          </div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={updateField("isActive")}
            />
            Show on home page
          </label>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.submit} disabled={saving}>
              {editingId ? "Save changes" : "Add stat"}
            </button>
            {editingId && (
              <button
                type="button"
                className={styles.cancel}
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className={adminStyles.panel}>
        {error && <p className={adminStyles.empty}>{error}</p>}
        {loading ? (
          <p className={adminStyles.empty}>Loading stats...</p>
        ) : stats.length === 0 ? (
          <div className={styles.muted}>
            <p>No stats yet. Import the current homepage numbers or add your first stat above.</p>
            <button
              type="button"
              className={styles.submit}
              onClick={seedDefaults}
              disabled={saving}
            >
              Load current defaults
            </button>
          </div>
        ) : (
          <div className={adminStyles.inquiryTableWrap}>
            <table className={adminStyles.inquiryTable}>
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr
                    key={stat._id}
                    className={stat.isActive === false ? styles.rowInactive : ""}
                  >
                    <td>
                      <span className={styles.statValue}>
                        {stat.value}
                        {stat.suffix}
                      </span>{" "}
                      — {stat.label}
                    </td>
                    <td>{stat.order ?? 0}</td>
                    <td>
                      <b
                        className={`${styles.badge} ${
                          stat.isActive === false ? styles.off : styles.on
                        }`}
                      >
                        {stat.isActive === false ? "Hidden" : "Live"}
                      </b>
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        <button
                          type="button"
                          title="Edit stat"
                          onClick={() => startEdit(stat)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title={
                            stat.isActive === false ? "Show stat" : "Hide stat"
                          }
                          onClick={() => toggleActive(stat)}
                        >
                          {stat.isActive === false ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Delete stat"
                          onClick={() => remove(stat)}
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
      </section>
    </div>
  );
}
