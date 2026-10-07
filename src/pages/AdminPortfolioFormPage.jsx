import { ArrowLeft, BriefcaseBusiness, Globe2, ImagePlus, Save, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortfolioItem, deletePortfolioImageField, deleteUnattachedPortfolioImage, getAdminPortfolioItem, updatePortfolioItem, uploadPortfolioImage } from "../services/adminService";
import styles from "./AdminBlogFormPage.module.css";

const emptyForm = { title: "", type: "web", category: "", excerpt: "", image: "", detailImages: ["", ""], appLink: "", webLink: "", platforms: "", technologies: "", metric: "", metricLabel: "", sortOrder: 0, isPublished: true, isFeatured: false };

export default function AdminPortfolioFormPage() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [persistedImages, setPersistedImages] = useState({ image: "", detailImages: ["", ""] });
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [uploadErrors, setUploadErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!portfolioId) return;
    getAdminPortfolioItem(portfolioId).then((item) => {
      const detailImages = [item.detailImages?.[0] || "", item.detailImages?.[1] || ""];
      setPersistedImages({ image: item.image || "", detailImages });
      setForm({ ...emptyForm, ...item, detailImages, platforms: item.platforms?.join(", ") || "", technologies: item.technologies?.join(", ") || "" });
    }).catch((error) => { setMessageTone("error"); setMessage(error.message); });
  }, [portfolioId]);

  const change = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const list = (value) => String(value).split(",").map((item) => item.trim()).filter(Boolean);
  const requiredImageSize = (field) => field === "image" || form.type === "web"
    ? { width: 1600, height: 900, label: "1600 × 900 px (16:9)" }
    : { width: 1080, height: 1920, label: "1080 × 1920 px (9:16)" };
  const readImageSize = (file) => new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(source);
    };
    image.onerror = () => {
      reject(new Error("Unable to read this image."));
      URL.revokeObjectURL(source);
    };
    image.src = source;
  });
  const uploadImage = async (event, field = "image", index = 0) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const errorKey = field === "image" ? "poster" : `detail-${index}`;
    const uploadField = event.currentTarget.closest("[data-upload-field]");
    setUploadErrors((current) => ({ ...current, [errorKey]: "" }));
    setSaving(true);
    setMessageTone("info");
    setMessage("Uploading project image...");
    try {
      const expected = requiredImageSize(field);
      const actual = await readImageSize(file);
      if (actual.width !== expected.width || actual.height !== expected.height)
        throw new Error(`Required image size is ${expected.label}. Your selected image is ${actual.width} × ${actual.height} px.`);
      const previousImage = field === "image" ? form.image : form.detailImages[index];
      const image = await uploadPortfolioImage(file, previousImage);
      setForm((current) => field === "image"
        ? { ...current, image }
        : { ...current, detailImages: current.detailImages.map((item, itemIndex) => itemIndex === index ? image : item) });
      setUploadErrors((current) => ({ ...current, [errorKey]: "" }));
      setMessageTone("info");
      setMessage("Project image uploaded.");
    } catch (error) {
      const errorMessage = error.message || "Image upload failed. Please try again.";
      setMessage("");
      setMessageTone("error");
      setUploadErrors((current) => ({ ...current, [errorKey]: errorMessage }));
      requestAnimationFrame(() => uploadField?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };
  const removeImage = async (field = "image", index = 0) => {
    const imageUrl = field === "image" ? form.image : form.detailImages[index];
    if (!imageUrl) return;
    setSaving(true);
    setMessage("Removing project image...");
    try {
      const wasPersisted = field === "image" ? persistedImages.image : persistedImages.detailImages[index];
      if (portfolioId && wasPersisted) await deletePortfolioImageField(portfolioId, field === "image" ? "poster" : `detail-${index}`);
      else await deleteUnattachedPortfolioImage(imageUrl);
      setPersistedImages((current) => field === "image"
        ? { ...current, image: "" }
        : { ...current, detailImages: current.detailImages.map((item, itemIndex) => itemIndex === index ? "" : item) });
      setForm((current) => field === "image"
        ? { ...current, image: "" }
        : { ...current, detailImages: current.detailImages.map((item, itemIndex) => itemIndex === index ? "" : item) });
      setMessage("Project image removed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = { ...form, appLink: form.type === "app" ? form.appLink : "", webLink: form.type === "web" ? form.webLink : "", detailImages: form.detailImages.slice(0, 2), sortOrder: Number(form.sortOrder) || 0, platforms: list(form.platforms).slice(0, 10), technologies: list(form.technologies).slice(0, 15) };
    delete payload._id; delete payload.createdAt; delete payload.updatedAt;
    try {
      if (portfolioId) await updatePortfolioItem(portfolioId, payload); else await createPortfolioItem(payload);
      navigate("/#portfolio");
    } catch (error) { setMessageTone("error"); setMessage(error.message); } finally { setSaving(false); }
  };

  return <main className={styles.page}>
    <header><div><BriefcaseBusiness size={18} /><span>Prime Softech</span></div><button type="button" onClick={() => navigate("/#portfolio")}><ArrowLeft size={15} /> Back to portfolio</button></header>
    <div className={styles.content}>
      <section className={styles.heading}><span><BriefcaseBusiness size={21} /></span><div><small>ADMIN CONSOLE / PORTFOLIO</small><h1>{portfolioId ? "Edit project" : "Add portfolio project"}</h1><p>Manage an App or Web project displayed publicly.</p></div></section>
      <form className={styles.portfolioForm} onSubmit={submit}>{message && <p className={`${styles.message} ${messageTone === "error" ? styles.errorMessage : ""}`} role={messageTone === "error" ? "alert" : "status"}>{message}</p>}<section className={styles.editor}><div className={styles.fields}>
        <div className={styles.formSectionTitle}><span>01</span><div><h2>Project details</h2><p>Core identity, content, platforms, and measurable outcome.</p></div></div>
        <label>Project title *<input name="title" value={form.title} onChange={change} maxLength="120" required /></label>
        <label>Project type *<select name="type" value={form.type} onChange={change}><option value="app">App</option><option value="web">Web</option></select></label>
        <label>Category *<input name="category" value={form.category} onChange={change} maxLength="80" required /></label>
        <label>Display order<input name="sortOrder" type="number" min="0" max="9999" value={form.sortOrder} onChange={change} /></label>
        <label className={styles.full}>Short description * <small>{form.excerpt.length}/300</small><textarea name="excerpt" value={form.excerpt} onChange={change} maxLength="300" required /></label>
        <div className={styles.formSectionTitle}><span>02</span><div><h2>Technology and results</h2><p>Explain where it runs, how it was built, and the outcome.</p></div></div>
        <label>Platforms <small>Comma separated</small><input name="platforms" value={form.platforms} onChange={change} placeholder="iOS, Android" /></label>
        <label>Technologies <small>Comma separated</small><input name="technologies" value={form.technologies} onChange={change} placeholder="React, Node.js" /></label>
        <label>Result value<input name="metric" value={form.metric} onChange={change} maxLength="30" placeholder="42%" /></label>
        <label>Result label<input name="metricLabel" value={form.metricLabel} onChange={change} maxLength="80" placeholder="faster checkout" /></label>
        <div className={styles.formSectionTitle}><span>03</span><div><h2>Media and visibility</h2><p>Add the project visual, destination, and publishing settings.</p></div></div>
        <div className={styles.portfolioMediaGrid}>
          <div className={styles.portfolioImageFields}>
            <div className={`${styles.portfolioImageField} ${styles.posterImageField}`} data-upload-field>
              <span>Poster image <em>Required: 1600 × 900 px</em></span>
              <div className={`${styles.portfolioImageBox} ${styles.posterImageBox}`}>
                {form.image ? <img src={form.image} alt="Project poster preview" /> : <div className={styles.portfolioImageEmpty}><ImagePlus size={25} /><b>Add project poster</b><small>Used on portfolio cards</small></div>}
                <label className={styles.portfolioImagePicker} aria-label={form.image ? "Change poster image" : "Upload poster image"}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadImage(event, "image")} disabled={saving} /></label>
                {form.image && <button type="button" onClick={() => removeImage("image")} disabled={saving} title="Remove poster"><Trash2 size={14} /></button>}
              </div>
              {uploadErrors.poster && <p className={styles.uploadError} role="alert">{uploadErrors.poster}</p>}
              <small>JPG, PNG or WEBP · Exact size 1600 × 900 px (16:9) · Maximum 5 MB.</small>
            </div>
            {[0, 1].map((index) => <div className={styles.portfolioImageField} key={index} data-upload-field>
              <span>Detail image {index + 1} <em>Required: {form.type === "app" ? "1080 × 1920 px" : "1600 × 900 px"}</em></span>
              <div className={`${styles.portfolioImageBox} ${styles.detailImageBox} ${form.type === "app" ? styles.appDetailImageBox : styles.webDetailImageBox}`}>
                {form.detailImages[index] ? <img src={form.detailImages[index]} alt={`Project detail ${index + 1}`} /> : <div className={styles.portfolioImageEmpty}><ImagePlus size={21} /><b>Add detail visual</b></div>}
                <label className={styles.portfolioImagePicker} aria-label={form.detailImages[index] ? `Change detail image ${index + 1}` : `Upload detail image ${index + 1}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadImage(event, "detailImages", index)} disabled={saving} /></label>
                {form.detailImages[index] && <button type="button" onClick={() => removeImage("detailImages", index)} disabled={saving} title={`Remove detail image ${index + 1}`}><Trash2 size={14} /></button>}
              </div>
              {uploadErrors[`detail-${index}`] && <p className={styles.uploadError} role="alert">{uploadErrors[`detail-${index}`]}</p>}
              <small>{form.type === "app" ? "Portrait 9:16 · Exact size 1080 × 1920 px" : "Landscape 16:9 · Exact size 1600 × 900 px"}</small>
            </div>)}
          </div>
          <div className={styles.portfolioMediaSettings}>
            {form.type === "app" ? <label>App link<input name="appLink" type="url" value={form.appLink} onChange={change} placeholder="https://play.google.com/store/apps/..." /></label> : <label>Website link<input name="webLink" type="url" value={form.webLink} onChange={change} placeholder="https://example.com" /></label>}
            <div className={styles.switches}>
              <label><input name="isPublished" type="checkbox" checked={form.isPublished} onChange={change} /> <span><b>Published</b><small>Visible on the public portfolio</small></span></label>
              <label><input name="isFeatured" type="checkbox" checked={form.isFeatured} onChange={change} /> <span><b>Featured</b><small>Highlight this project first</small></span></label>
            </div>
          </div>
        </div>
      </div><aside className={styles.portfolioPreview}>
        <small>LIVE PREVIEW</small>
        <div className={styles.portfolioPreviewMedia}>
          {form.image ? <img src={form.image} alt="" /> : form.type === "app" ? <Smartphone size={32} /> : <Globe2 size={32} />}
          <span>{form.type === "app" ? "APP" : "WEB"}</span>
        </div>
        <h2>{form.title || "Project title"}</h2>
        <p>{form.excerpt || "Your short project description will appear here."}</p>
        <dl>
          <div><dt>Category</dt><dd>{form.category || "Not set"}</dd></div>
          <div><dt>Platforms</dt><dd>{form.platforms || "Not set"}</dd></div>
          <div><dt>Result</dt><dd>{form.metric ? form.metric + " " + form.metricLabel : "Not set"}</dd></div>
        </dl>
        <span className={form.isPublished ? styles.previewPublished : styles.previewDraft}>{form.isPublished ? "Published" : "Draft"}</span>
      </aside></section><footer className={styles.actions}><button className={styles.cancelAction} type="button" onClick={() => navigate("/#portfolio")}>Cancel</button><button className={styles.createAction} type="submit" disabled={saving}><Save size={15} /> {saving ? "Saving..." : portfolioId ? "Save changes" : "Create project"}</button></footer></form>
    </div>
  </main>;
}
