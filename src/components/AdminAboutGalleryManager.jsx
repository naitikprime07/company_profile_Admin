import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, Upload } from "lucide-react";
import {
  createAboutGalleryImage,
  deleteAboutGalleryImage,
  deleteUnattachedAboutGalleryImage,
  getAdminAboutGallery,
  updateAboutGalleryImage,
  uploadAboutGalleryImage,
} from "../services/adminService";
import adminStyles from "../pages/AdminPage.module.css";
import styles from "./AdminAboutGalleryManager.module.css";

const EMPTY_FORM = { image: "", alt: "", order: "", isActive: true };
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AdminAboutGalleryManager({ confirmDelete }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Uploaded but not yet saved to a record — dropped when the form is reset.
  const unattachedRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setImages(await getAdminAboutGallery());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dropUnattached = () => {
    if (!unattachedRef.current) return;
    deleteUnattachedAboutGalleryImage(unattachedRef.current).catch(() => {});
    unattachedRef.current = null;
  };

  const resetForm = () => {
    dropUnattached();
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => () => dropUnattached(), []);

  const startEdit = (item) => {
    dropUnattached();
    setEditingId(item._id);
    setFormError("");
    setForm({
      image: item.image || "",
      alt: item.alt || "",
      order: String(item.order ?? 0),
      isActive: item.isActive !== false,
    });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFormError("Only JPG, PNG, and WEBP images are accepted.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setFormError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const previousInForm = form.image;
      const fileUrl = await uploadAboutGalleryImage(file);
      // The freshly uploaded URL is unattached until the record is saved.
      if (previousInForm !== unattachedRef.current) dropUnattached();
      unattachedRef.current = fileUrl;
      setForm((prev) => ({ ...prev, image: fileUrl }));
    } catch (uploadError) {
      setFormError(uploadError.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.image) {
      setFormError("Choose an image to upload first.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        image: form.image,
        alt: form.alt.trim(),
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };
      if (editingId) await updateAboutGalleryImage(editingId, payload);
      else await createAboutGalleryImage(payload);
      unattachedRef.current = null;
      resetForm();
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (
      !(await confirmDelete({
        title: "Delete this company image?",
        itemName: item.alt || "Untitled image",
      }))
    )
      return;
    try {
      await deleteAboutGalleryImage(item._id);
      if (editingId === item._id) resetForm();
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateAboutGalleryImage(item._id, {
        image: item.image,
        alt: item.alt || "",
        order: item.order ?? 0,
        isActive: item.isActive === false,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className={styles.workspace}>
      <section className={adminStyles.panel}>
        <div className={adminStyles.panelHead}>
          <div>
            <h2>Company images</h2>
            <p>
              These photos scroll across the About page under{" "}
              <strong>&ldquo;Meet the People Behind the Vision&rdquo;</strong>.
              The strip stays hidden until at least one image is added and
              visible.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="galleryAlt">Caption (optional)</label>
            <input
              id="galleryAlt"
              type="text"
              maxLength={120}
              value={form.alt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, alt: event.target.value }))
              }
              placeholder="Team brainstorming at the office"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="galleryOrder">Order</label>
            <input
              id="galleryOrder"
              type="number"
              min="0"
              step="1"
              value={form.order}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, order: event.target.value }))
              }
              placeholder="0"
            />
          </div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Show on About page
          </label>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="galleryFile">Image (JPG / PNG / WEBP, max 5 MB)</label>
            <div className={styles.fileRow}>
              <input
                id="galleryFile"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileSelected}
                disabled={uploading}
              />
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={15} />
                {uploading ? "Uploading..." : "Upload image"}
              </button>
            </div>
            {form.image && (
              <div className={styles.preview}>
                <img src={form.image} alt="Selected preview" />
                <span>Preview — saved records keep this image.</span>
              </div>
            )}
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submit}
              disabled={saving || uploading}
            >
              {editingId ? "Save changes" : "Add image"}
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
          <p className={adminStyles.empty}>Loading images...</p>
        ) : images.length === 0 ? (
          <p className={styles.muted}>
            No images yet. Upload your first company photo above — the About
            page strip appears automatically once images exist.
          </p>
        ) : (
          <div className={adminStyles.inquiryTableWrap}>
            <table className={adminStyles.inquiryTable}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Caption</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {images.map((item) => (
                  <tr
                    key={item._id}
                    className={
                      item.isActive === false ? styles.rowInactive : ""
                    }
                  >
                    <td>
                      <img
                        className={styles.thumb}
                        src={item.image}
                        alt={item.alt || "Company image"}
                        loading="lazy"
                      />
                    </td>
                    <td>{item.alt || "—"}</td>
                    <td>{item.order ?? 0}</td>
                    <td>
                      <b
                        className={`${styles.badge} ${
                          item.isActive === false ? styles.off : styles.on
                        }`}
                      >
                        {item.isActive === false ? "Hidden" : "Live"}
                      </b>
                    </td>
                    <td>
                      <div className={adminStyles.tableActions}>
                        <button
                          type="button"
                          title="Edit image"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title={
                            item.isActive === false
                              ? "Show image"
                              : "Hide image"
                          }
                          onClick={() => toggleActive(item)}
                        >
                          {item.isActive === false ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Delete image"
                          onClick={() => remove(item)}
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
