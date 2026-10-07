import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Building2, Save } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createOpening,
  getAdminOpening,
  updateOpening,
} from "../services/adminService";
import styles from "./AdminOpeningFormPage.module.css";

export default function AdminOpeningFormPage() {
  const { openingId } = useParams();
  const editing = Boolean(openingId);
  const navigate = useNavigate();
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("adminToken")) {
      navigate("/", { replace: true });
      return;
    }
    if (editing)
      getAdminOpening(openingId)
        .then(setOpening)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [editing, navigate, openingId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const payload = {
      ...values,
      vacancies: Number(values.vacancies),
      isActive: form.elements.isActive.checked,
    };
    try {
      if (editing) await updateOpening(openingId, payload);
      else await createOpening(payload);
      navigate("/#openings", { replace: true });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };
  if (loading) return <main className={styles.state}>Loading opening…</main>;
  return (
    <main className={styles.page}>
      <header>
        <div>
          <Building2 size={18} /> Prime Softech
        </div>
        <Link to="/#openings">
          <ArrowLeft size={15} /> Career openings
        </Link>
      </header>
      <div className={styles.content}>
        <section className={styles.heading}>
          <span>
            <BriefcaseBusiness size={21} />
          </span>
          <div>
            <small>{editing ? "EDIT OPENING" : "NEW OPENING"}</small>
            <h1>
              {editing ? "Update career opening" : "Create a career opening"}
            </h1>
            <p>
              Manage the information shown to candidates on the public careers
              page.
            </p>
          </div>
        </section>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={submit}>
          <section>
            <h2>Position information</h2>
            <label>
              Position title
              <input
                name="title"
                defaultValue={opening?.title}
                maxLength="120"
                placeholder="Senior React Developer"
                required
              />
            </label>
            <div className={styles.two}>
              <label>
                Opportunity type
                <select
                  name="type"
                  defaultValue={opening?.type || "experienced"}
                >
                  <option value="experienced">Experienced opportunity</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <label>
                Commitment
                <select
                  name="commitment"
                  defaultValue={opening?.commitment || "Full-time"}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship program</option>
                </select>
              </label>
            </div>
            <div className={styles.two}>
              <label>
                Location
                <input
                  name="location"
                  defaultValue={opening?.location}
                  maxLength="120"
                  placeholder="Surat, Gujarat / Remote"
                  required
                />
              </label>
              <label>
                Experience required
                <input
                  name="experience"
                  defaultValue={opening?.experience}
                  maxLength="100"
                  placeholder="2–4 years / Fresher"
                  required
                />
              </label>
            </div>
            <label>
              Number of openings
              <input
                name="vacancies"
                type="number"
                min="1"
                max="500"
                defaultValue={opening?.vacancies || 1}
                required
              />
            </label>
          </section>
          <section>
            <h2>Role content</h2>
            <label>
              Short summary
              <textarea
                name="description"
                rows="3"
                maxLength="1000"
                defaultValue={opening?.description}
                required
              />
            </label>
            <label>
              Role overview
              <textarea
                name="roleOverview"
                rows="7"
                maxLength="3000"
                defaultValue={opening?.roleOverview}
                required
              />
            </label>
            <label>
              Key requirements
              <textarea
                name="keyRequirements"
                rows="8"
                maxLength="4000"
                defaultValue={opening?.keyRequirements}
                placeholder="Add one requirement per line"
                required
              />
            </label>
            <label className={styles.toggle}>
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={opening?.isActive ?? true}
              />
              <span />
              <div>
                <strong>Active opening</strong>
                <small>Visible on the public careers page</small>
              </div>
            </label>
          </section>
          <footer>
            <Link to="/#openings">Cancel</Link>
            <button disabled={saving}>
              <Save size={16} />
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Publish opening"}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}
