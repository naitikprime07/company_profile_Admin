import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Files } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getGeneralApplication,
  setGeneralApplicationStatus,
} from "../services/adminService";
import styles from "./AdminInquiryDetailsPage.module.css";
const labels = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  archived: "Archived",
};
const Field = ({ label, children }) => (
  <div className={styles.field}>
    <small>{label}</small>
    <strong>{children || "Not provided"}</strong>
  </div>
);
export default function AdminIntroductionDetailsPage() {
  const { id } = useParams(),
    navigate = useNavigate();
  const [item, setItem] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!sessionStorage.getItem("adminToken")) {
      navigate("/", { replace: true });
      return;
    }
    getGeneralApplication(id)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id, navigate]);
  if (!item)
    return (
      <main className={styles.state}>{error || "Loading introduction…"}</main>
    );
  return (
    <main className={styles.page}>
      <header>
        <div>Prime Softech</div>
        <Link to="/">
          <ArrowLeft size={15} /> Introductions
        </Link>
      </header>
      <div className={styles.content}>
        <section className={styles.hero}>
          <span>
            {item.firstName?.[0]}
            {item.lastName?.[0]}
          </span>
          <div>
            <small>OPEN INTRODUCTION</small>
            <h1>
              {item.firstName} {item.lastName}
            </h1>
            <p>{item.desiredRole}</p>
          </div>
          <label>
            Status
            <select
              value={item.status}
              onChange={async (e) =>
                setItem(await setGeneralApplicationStatus(id, e.target.value))
              }
            >
              {Object.entries(labels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </section>
        <div className={styles.layout}>
          <section className={styles.card}>
            <h2>Contact</h2>
            <div className={styles.grid}>
              <Field label="EMAIL">{item.email}</Field>
              <Field label="PHONE">{item.phone}</Field>
              <Field label="LOCATION">{item.location}</Field>
              <Field label="EXPERIENCE">{item.experience}</Field>
            </div>
          </section>
          <section className={styles.card}>
            <h2>Career direction</h2>
            <div className={styles.grid}>
              <Field label="DESIRED ROLE">{item.desiredRole}</Field>
              <Field label="SKILLS">{item.skills}</Field>
              <Field label="INTERESTS">{item.interests}</Field>
              <Field label="DATE">
                {new Date(item.createdAt).toLocaleString()}
              </Field>
            </div>
          </section>
          <section className={`${styles.card} ${styles.message}`}>
            <h2>Introduction</h2>
            <p>{item.message}</p>
            {item.resumeUrl && (
              <button
                type="button"
                className={styles.resumeButton}
                onClick={() =>
                  window.open(item.resumeUrl, "_blank", "noopener,noreferrer")
                }
              >
                <Files size={15} />
                <span>View resume</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
