import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Files,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteApplication,
  getApplication,
  setApplicationStatus,
} from "../services/adminService";
import styles from "./AdminApplicationDetailsPage.module.css";
import useConfirmDelete from "../hooks/useConfirmDelete";

const STATUSES = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <small>{label}</small>
      <strong>{children || "Not provided"}</strong>
    </div>
  );
}

export default function AdminApplicationDetailsPage() {
  const { confirmDelete, deleteDialog } = useConfirmDelete();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("adminToken")) {
      navigate("/", { replace: true });
      return;
    }
    getApplication(applicationId)
      .then(setApplication)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [applicationId, navigate]);

  const updateStatus = async (status) => {
    setWorking(true);
    setError("");
    try {
      setApplication(await setApplicationStatus(applicationId, status));
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(false);
    }
  };
  const remove = async () => {
    if (
      !(await confirmDelete({
        title: "Delete this application?",
        itemName: application
          ? `${application.firstName} ${application.lastName}`
          : "Application record",
      }))
    )
      return;
    setWorking(true);
    setError("");
    try {
      await deleteApplication(applicationId);
      navigate("/#applications", { replace: true });
    } catch (e) {
      setError(e.message);
      setWorking(false);
    }
  };

  if (loading)
    return <main className={styles.state}>Loading application…</main>;
  if (error && !application)
    return (
      <main className={styles.state}>
        <p>{error}</p>
        <Link to="/">Back to admin</Link>
      </main>
    );
  const name = `${application.firstName} ${application.lastName}`;
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Building2 size={18} />
          <span>Prime Softech</span>
        </div>
        <Link to="/#applications">
          <ArrowLeft size={15} /> Applications
        </Link>
      </header>
      <div className={styles.content}>
        {error && <p className={styles.error}>{error}</p>}
        <section className={styles.profileHead}>
          <span>
            {application.firstName?.[0]}
            {application.lastName?.[0]}
          </span>
          <div>
            <small>APPLICATION DETAILS</small>
            <h1>{name}</h1>
            <p>
              <BriefcaseBusiness size={14} />
              {application.openingTitle} · {application.opportunityType}
            </p>
          </div>
          <div className={styles.actions}>
            <select
              disabled={working}
              value={application.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {Object.entries(STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={working}
              onClick={remove}
              aria-label="Delete application"
              title="Delete application"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </section>
        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <section className={styles.card}>
              <h2>Personal information</h2>
              <div className={styles.grid}>
                <Field label="FULL NAME">{name}</Field>
                <Field label="LOCATION">{application.location}</Field>
                <Field label="EMAIL">{application.email}</Field>
                <Field label="PHONE">{application.phone}</Field>
              </div>
            </section>
            <section className={styles.card}>
              <h2>Professional details</h2>
              <div className={styles.grid}>
                <Field label="CURRENT COMPANY">
                  {application.currentCompany}
                </Field>
                <Field label="CURRENT ROLE">{application.currentRole}</Field>
                <Field label="EXPERIENCE">
                  {application.experienceYears || 0} years,{" "}
                  {application.experienceMonths || 0} months
                </Field>
                <Field label="NOTICE PERIOD">{application.noticePeriod}</Field>
                <Field label="CURRENT CTC">
                  {application.currentCtc
                    ? `${application.currentCtc} LPA`
                    : "Not provided"}
                </Field>
                <Field label="EXPECTED CTC">
                  {application.expectedCtc
                    ? `${application.expectedCtc} LPA`
                    : "Not provided"}
                </Field>
              </div>
            </section>
            <section className={styles.card}>
              <h2>Cover letter</h2>
              <p className={styles.cover}>
                {application.coverLetter || "No cover letter provided."}
              </p>
            </section>
          </div>
          <aside className={styles.sideColumn}>
            <section className={styles.card}>
              <h2>Resume</h2>
              {application.resumeUrl ? (
                <button
                  type="button"
                  className={styles.resume}
                  onClick={() => window.open(application.resumeUrl, "_blank", "noopener,noreferrer")}
                >
                  <Files size={18} />
                  <span>
                    <strong>View resume</strong>
                    <small>View uploaded document</small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ) : (
                <p>No resume uploaded.</p>
              )}
            </section>
            <section className={styles.card}>
              <h2>Professional links</h2>
              <div className={styles.links}>
                {[
                  ["LinkedIn", application.linkedInUrl],
                  ["Portfolio", application.portfolioUrl],
                  ["GitHub", application.githubUrl],
                ].map(
                  ([label, url]) =>
                    url && (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {label}
                        <ArrowUpRight size={13} />
                      </a>
                    ),
                )}
              </div>
            </section>
            <section className={styles.card}>
              <h2>Application record</h2>
              <Field label="APPLIED ON">
                {new Date(application.createdAt).toLocaleString()}
              </Field>
              <Field label="LAST UPDATED">
                {new Date(application.updatedAt).toLocaleString()}
              </Field>
              <Field label="APPLICATION ID">{application._id}</Field>
            </section>
          </aside>
        </div>
      </div>
      {deleteDialog}
    </main>
  );
}
