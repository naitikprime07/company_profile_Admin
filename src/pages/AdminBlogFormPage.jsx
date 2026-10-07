import { ArrowLeft, BookOpen, ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createBlog,
  deleteBlogImage,
  deleteUnattachedBlogImage,
  getAdminBlog,
  updateBlog,
  uploadBlogImage,
} from "../services/adminService";
import RichTextEditor from "../components/RichTextEditor";
import styles from "./AdminBlogFormPage.module.css";
const empty = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  author: "",
  authorDesignation: "",
  authorBio: "",
  authorLinkedin: "",
  authorImage: "",
  category: "",
  tags: "",
  isPublished: false,
  isFeatured: false,
};
const slugify = (v) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
export default function AdminBlogFormPage() {
  const { blogId } = useParams(),
    navigate = useNavigate(),
    [form, setForm] = useState(empty),
    [persistedImages, setPersistedImages] = useState({
      cover: "",
      author: "",
    }),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (blogId)
      getAdminBlog(blogId)
        .then((d) => {
          setPersistedImages({
            cover: d.coverImage || "",
            author: d.authorDetails?.image || "",
          });
          setForm({
            ...d,
            authorDesignation: d.authorDetails?.designation || "",
            authorBio: d.authorDetails?.bio || "",
            authorLinkedin: d.authorDetails?.linkedin || "",
            authorImage: d.authorDetails?.image || "",
            tags: (d.tags || []).join(", "),
          });
        })
        .catch((e) => setMessage(e.message));
  }, [blogId]);
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((c) => ({
      ...c,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "title" && !blogId ? { slug: slugify(value) } : {}),
    }));
  };
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage("Uploading cover image…");
    try {
      const url = await uploadBlogImage(file, form.coverImage);
      setForm((c) => ({ ...c, coverImage: url }));
      setMessage("Cover image uploaded.");
    } catch (x) {
      setMessage(x.message);
    } finally {
      setSaving(false);
    }
  };
  const uploadAuthorImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage("Uploading author image...");
    try {
      const url = await uploadBlogImage(file, form.authorImage);
      setForm((current) => ({ ...current, authorImage: url }));
      setMessage("Author image uploaded.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };
  const removeImage = async (field) => {
    const isCover = field === "cover";
    const imageUrl = isCover ? form.coverImage : form.authorImage;
    if (!imageUrl) return;
    setSaving(true);
    setMessage("Removing image...");
    try {
      if (blogId && persistedImages[field])
        await deleteBlogImage(blogId, field);
      else await deleteUnattachedBlogImage(imageUrl);
      setForm((current) => ({
        ...current,
        [isCover ? "coverImage" : "authorImage"]: "",
      }));
      setPersistedImages((current) => ({ ...current, [field]: "" }));
      setMessage(
        isCover
          ? "Cover image removed permanently."
          : "Author image removed permanently.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    const plainContent = form.content
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (plainContent.length < 50) {
      setMessage("Article content must contain at least 50 characters.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      coverImage: form.coverImage || "",
      author: form.author,
      authorDetails: {
        designation: form.authorDesignation,
        bio: form.authorBio,
        linkedin: form.authorLinkedin,
        image: form.authorImage,
      },
      category: form.category,
      tags: String(form.tags || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 10),
      isPublished: Boolean(form.isPublished),
      isFeatured: Boolean(form.isFeatured),
    };
    try {
      if (blogId) await updateBlog(blogId, payload);
      else await createBlog(payload);
      navigate("/#blogs");
    } catch (x) {
      setMessage(x.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className={styles.page}>
      <header>
        <div>
          <BookOpen size={18} />
          <span>Prime Softech</span>
        </div>
        <button type="button" onClick={() => navigate("/#blogs")}>
          <ArrowLeft size={15} /> Back to blogs
        </button>
      </header>
      <div className={styles.content}>
        <section className={styles.heading}>
          <span>
            <BookOpen size={21} />
          </span>
          <div>
            <small>ADMIN CONSOLE / BLOGS</small>
            <h1>{blogId ? "Edit article" : "Create article"}</h1>
            <p>Create and manage the articles shown in Prime Perspectives.</p>
          </div>
        </section>
        <form onSubmit={submit}>
          {message && <p className={styles.message}>{message}</p>}
          <section className={styles.editor}>
            <div className={styles.fields}>
              <div className={styles.formSectionTitle}>
                <span>01</span>
                <div>
                  <h2>Article details</h2>
                  <p>
                    Content, category, cover image, and publishing settings.
                  </p>
                </div>
              </div>
              <label>
                Article title *
                <input
                  name="title"
                  value={form.title}
                  onChange={change}
                  maxLength="160"
                  required
                />
              </label>
              <label>
                URL slug *
                <input
                  name="slug"
                  value={form.slug}
                  onChange={change}
                  maxLength="180"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </label>
              <label>
                Category *
                <input
                  name="category"
                  value={form.category}
                  onChange={change}
                  maxLength="80"
                  required
                />
              </label>
              <label className={styles.full}>
                Short excerpt *<small>{form.excerpt.length}/500</small>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={change}
                  minLength="20"
                  maxLength="500"
                  required
                />
              </label>
              <div className={`${styles.full} ${styles.richField}`}>
                <span>Article content *</span>
                <small>
                  {form.content.replace(/<[^>]*>/g, "").length} characters
                </small>
                <RichTextEditor
                  value={form.content}
                  onChange={(content) =>
                    setForm((current) => ({ ...current, content }))
                  }
                />
              </div>
              <label className={styles.full}>
                Tags <small>Comma separated</small>
                <input name="tags" value={form.tags} onChange={change} />
              </label>
              <div className={styles.switches}>
                <label>
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={form.isPublished}
                    onChange={change}
                  />{" "}
                  Publish article
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={change}
                  />{" "}
                  Feature article
                </label>
              </div>
              <div className={styles.formSectionTitle}>
                <span>02</span>
                <div>
                  <h2>Author details</h2>
                  <p>Profile information shown with the published article.</p>
                </div>
              </div>
              <label>
                Author name *
                <input
                  name="author"
                  value={form.author}
                  onChange={change}
                  maxLength="100"
                  required
                />
              </label>
              <label>
                Designation
                <input
                  name="authorDesignation"
                  value={form.authorDesignation}
                  onChange={change}
                  maxLength="100"
                />
              </label>
              <label className={styles.full}>
                Bio <small>{form.authorBio.length}/600</small>
                <textarea
                  name="authorBio"
                  value={form.authorBio}
                  onChange={change}
                  maxLength="600"
                />
              </label>
              <label className={styles.full}>
                LinkedIn profile
                <input
                  type="url"
                  name="authorLinkedin"
                  value={form.authorLinkedin}
                  onChange={change}
                  maxLength="2048"
                  placeholder="https://linkedin.com/in/..."
                />
              </label>
              <div className={styles.authorImageField}>
                <span>Profile image</span>
                <div className={styles.imageUploadWrap}>
                  <label className={styles.authorImageUpload}>
                    {form.authorImage ? (
                      <img src={form.authorImage} alt="Author preview" />
                    ) : (
                      <ImagePlus size={22} />
                    )}
                    <b>{form.authorImage ? "Replace image" : "Upload image"}</b>
                    <small>JPG, PNG or WEBP. Maximum 5 MB.</small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadAuthorImage}
                    />
                  </label>
                  {form.authorImage && (
                    <button
                      type="button"
                      className={styles.removeImage}
                      title="Remove author image"
                      aria-label="Remove author image"
                      disabled={saving}
                      onClick={() => removeImage("author")}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <aside>
              <div className={styles.imageUploadWrap}>
                <label className={styles.cover}>
                  {form.coverImage ? (
                    <img src={form.coverImage} alt="" />
                  ) : (
                    <ImagePlus size={28} />
                  )}
                  <span>
                    {form.coverImage ? "Replace cover" : "Upload cover image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={upload}
                  />
                </label>
                {form.coverImage && (
                  <button
                    type="button"
                    className={styles.removeImage}
                    title="Remove cover image"
                    aria-label="Remove cover image"
                    disabled={saving}
                    onClick={() => removeImage("cover")}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p>JPG, PNG or WEBP. Maximum 5 MB.</p>
            </aside>
          </section>
          <footer>
            <button type="submit" disabled={saving}>
              <Save size={16} />{" "}
              {saving ? "Saving…" : blogId ? "Save changes" : "Create article"}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}
