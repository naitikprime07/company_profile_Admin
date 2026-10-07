import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getContact, setContactStatus } from "../services/adminService";
import styles from "./AdminInquiryDetailsPage.module.css";

const statuses = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};
const Field = ({ label, children }) => (
  <div className={styles.field}>
    <small>{label}</small>
    <strong>{children || "Not provided"}</strong>
  </div>
);
export default function AdminInquiryDetailsPage() {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!sessionStorage.getItem("adminToken")) {
      navigate("/", { replace: true });
      return;
    }
    getContact(inquiryId)
      .then(setItem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [inquiryId, navigate]);
  const changeStatus = async (status) => {
    setSaving(true);
    setError("");
    try {
      setItem(await setContactStatus(inquiryId, status));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <main className={styles.state}>Loading inquiry…</main>;
  if (!item)
    return (
      <main className={styles.state}>
        <p>{error || "Inquiry not found."}</p>
        <Link to="/#inquiries">Back to inquiries</Link>
      </main>
    );
  return (
    <main className={styles.page}>
      <header>
        <div>
          <Building2 size={18} /> Prime Softech
        </div>
        <Link to="/#inquiries">
          <ArrowLeft size={15} /> Inquiries
        </Link>
      </header>
      <div className={styles.content}>
        {error && <p className={styles.error}>{error}</p>}
        <section className={styles.hero}>
          <span>{item.name?.slice(0, 2).toUpperCase()}</span>
          <div>
            <small>INQUIRY DETAILS</small>
            <h1>{item.name}</h1>
            <p>
              {item.company || "Independent"} · Received{" "}
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <label>
            Status
            <select
              disabled={saving}
              value={item.status}
              onChange={(e) => changeStatus(e.target.value)}
            >
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>
        <div className={styles.layout}>
          <section className={styles.card}>
            <h2>Contact information</h2>
            <div className={styles.grid}>
              <Field label="NAME">{item.name}</Field>
              <Field label="COMPANY">{item.company || "Independent"}</Field>
              <Field label="EMAIL">{item.email}</Field>
              <Field label="PHONE">{item.phone}</Field>
            </div>
          </section>
          <section className={styles.card}>
            <h2>Project information</h2>
            <div className={styles.grid}>
              <Field label="SERVICE">{item.service}</Field>
              <Field label="BUDGET">{item.budget}</Field>
              <Field label="CREATED">
                {new Date(item.createdAt).toLocaleString()}
              </Field>
              <Field label="LAST UPDATED">
                {new Date(item.updatedAt).toLocaleString()}
              </Field>
            </div>
          </section>
          <section className={`${styles.card} ${styles.message}`}>
            <h2>Message</h2>
            <p>{item.message}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
