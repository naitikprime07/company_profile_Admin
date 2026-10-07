import { ENVIRONMENT } from "../constants/environment";
const inFlight = new Map();

let sessionRedirectStarted = false;

const decodeTokenExpiry = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    return Number(decoded.exp) > 0 ? Number(decoded.exp) * 1000 : null;
  } catch {
    return null;
  }
};

export const getAdminSessionExpiry = (token) => decodeTokenExpiry(token);

export const expireAdminSession = () => {
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminActiveView");
  inFlight.clear();

  if (sessionRedirectStarted) return;
  sessionRedirectStarted = true;

  const loginUrl = "/?session=expired";
  if (`${window.location.pathname}${window.location.search}` !== loginUrl) {
    window.location.replace(loginUrl);
  } else {
    window.dispatchEvent(new CustomEvent("admin-session-expired"));
  }
};

const executeRequest = async (path, options = {}) => {
  const token = sessionStorage.getItem("adminToken");

  const expiry = token ? decodeTokenExpiry(token) : null;
  if (path !== "/admin/login" && expiry && expiry <= Date.now()) {
    expireAdminSession();
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(`${ENVIRONMENT.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const responseText = await response.text();
  let body = {};
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    body = { message: responseText };
  }

  const authenticationFailure =
    path !== "/admin/login" &&
    Boolean(token) &&
    (response.status === 401 ||
      (response.status === 403 &&
        /token|session|auth|expired|unauthor/i.test(body.message || "")));

  if (authenticationFailure) {
    expireAdminSession();
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  if (!response.ok)
    throw new Error(body.message || `Request failed (${response.status}).`);
  return body.data;
};
const request = (path, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET") return executeRequest(path, options);
  const token = sessionStorage.getItem("adminToken") || "anonymous";
  const key = `${token}:${path}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const pending = executeRequest(path, options).finally(() =>
    inFlight.delete(key),
  );
  inFlight.set(key, pending);
  return pending;
};
const requestOnce = (key, path) => {
  if (inFlight.has(key)) return inFlight.get(key);
  const pending = request(path).finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
};
const normalizeContact = (contact) => {
  const id = contact?._id || contact?.id;
  if (!id) throw new Error("Inquiry response is missing its ID.");
  return { ...contact, _id: String(id), id: String(id) };
};
const requireContactId = (id) => {
  const value = String(id || "");
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new Error("A valid inquiry ID is required.");
  return value;
};
const requireApplicationId = (id) => {
  const value = String(id || "");
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new Error("A valid application ID is required.");
  return value;
};
export const loginAdmin = (email, password) =>
  request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const getDashboard = () => requestOnce("dashboard", "/admin/dashboard");
export const getAdminSidebarCounts = () => request("/admin/sidebar-counts");
export const searchContacts = (
  query = "",
  status = "all",
  page = 1,
  limit = 10,
  dateRange = "all",
  fromDate = "",
  toDate = "",
) =>
  request(
    `/admin/contacts/search?${new URLSearchParams({ query, status, page: String(page), limit: String(limit), dateRange, fromDate, toDate })}`,
  ).then((result) => ({
    ...result,
    items: result.items.map(normalizeContact),
  }));
export const getContact = (id) =>
  request(`/admin/contacts/${requireContactId(id)}`).then(normalizeContact);
export const setContactStatus = (id, status) =>
  request(`/admin/contacts/${requireContactId(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then(normalizeContact);
export const deleteContact = (id) =>
  request(`/admin/contacts/${requireContactId(id)}`, { method: "DELETE" });
export const getApplications = () => request("/admin/applications");
export const searchApplications = (
  query,
  status,
  page,
  limit,
  fromDate,
  toDate,
) =>
  request(
    `/admin/applications/search?${new URLSearchParams({ query, status, page: String(page), limit: String(limit), fromDate, toDate })}`,
  );
export const getApplication = (id) =>
  request(`/admin/applications/${requireApplicationId(id)}`);
export const setApplicationStatus = (id, status) =>
  request(`/admin/applications/${requireApplicationId(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const deleteApplication = (id) =>
  request(`/admin/applications/${requireApplicationId(id)}`, {
    method: "DELETE",
  });
export const getGeneralApplications = () =>
  request("/admin/general-applications");
export const searchGeneralApplications = (
  query,
  status,
  page,
  limit,
  fromDate,
  toDate,
) =>
  request(
    `/admin/general-applications/search?${new URLSearchParams({ query, status, page: String(page), limit: String(limit), fromDate, toDate })}`,
  );
export const getGeneralApplication = (id) =>
  request(`/admin/general-applications/${id}`);
export const setGeneralApplicationStatus = (id, status) =>
  request(`/admin/general-applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const deleteGeneralApplication = (id) =>
  request(`/admin/general-applications/${id}`, { method: "DELETE" });
export const getAdminOpenings = () =>
  requestOnce("openings", "/admin/openings");
export const searchAdminOpenings = (
  query = "",
  status = "all",
  page = 1,
  limit = 6,
  fromDate = "",
  toDate = "",
) =>
  request(
    `/admin/openings/search?${new URLSearchParams({ query, status, page: String(page), limit: String(limit), fromDate, toDate })}`,
  );
export const getAdminOpening = (id) => request(`/admin/openings/${id}`);
export const createOpening = (data) =>
  request("/admin/openings", { method: "POST", body: JSON.stringify(data) });
export const updateOpening = (id, data) =>
  request(`/admin/openings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteOpening = (id) =>
  request(`/admin/openings/${id}`, { method: "DELETE" });
export const searchAdminBlogs = (
  query = "",
  status = "all",
  page = 1,
  limit = 8,
) =>
  request(
    `/admin/blogs?${new URLSearchParams({ query, status, page: String(page), limit: String(limit) })}`,
  );
export const getAdminBlog = (id) => request(`/admin/blogs/${id}`);
export const createBlog = (data) =>
  request("/admin/blogs", { method: "POST", body: JSON.stringify(data) });
export const updateBlog = (id, data) =>
  request(`/admin/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteBlog = (id) =>
  request(`/admin/blogs/${id}`, { method: "DELETE" });
export const searchAdminPortfolio = (
  query = "",
  type = "all",
  status = "all",
  page = 1,
  limit = 10,
) =>
  request(
    `/admin/portfolio?${new URLSearchParams({ query, type, status, page: String(page), limit: String(limit) })}`,
  );
export const getAdminPortfolioItem = (id) => request(`/admin/portfolio/${id}`);
export const createPortfolioItem = (data) =>
  request("/admin/portfolio", { method: "POST", body: JSON.stringify(data) });
export const updatePortfolioItem = (id, data) =>
  request(`/admin/portfolio/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deletePortfolioItem = (id) =>
  request(`/admin/portfolio/${id}`, { method: "DELETE" });
export const deletePortfolioImage = (id) =>
  request(`/admin/portfolio/${id}/image`, { method: "DELETE" });
export const deletePortfolioImageField = (id, field) =>
  request(`/admin/portfolio/${id}/images/${field}`, { method: "DELETE" });
export const deleteUnattachedPortfolioImage = (imageUrl) =>
  request("/admin/portfolio/image", {
    method: "DELETE",
    body: JSON.stringify({ imageUrl }),
  });
export const uploadPortfolioImage = async (file, previousImage = "") => {
  const signed = await request("/admin/portfolio/image-upload-url", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      previousImage,
    }),
  });
  const response = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok)
    throw new Error("Project image upload failed. Check the R2 CORS configuration.");
  return signed.fileUrl;
};
export const deleteBlogImage = (id, field) =>
  request(`/admin/blogs/${id}/images/${field}`, { method: "DELETE" });
export const deleteUnattachedBlogImage = (imageUrl) =>
  request("/admin/blogs/image", {
    method: "DELETE",
    body: JSON.stringify({ imageUrl }),
  });
export const uploadBlogImage = async (file, previousImage = "") => {
  const signed = await request("/admin/blogs/image-upload-url", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      previousImage,
    }),
  });
  const response = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok)
    throw new Error(
      "Cover image upload failed. Check the R2 CORS configuration.",
    );
  return signed.fileUrl;
};

export const getAdminLeadership = () => request("/admin/leadership");
export const createLeadershipTeam = (data) =>
  request("/admin/leadership", { method: "POST", body: JSON.stringify(data) });
export const updateLeadershipTeam = (id, data) =>
  request(`/admin/leadership/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteLeadershipTeam = (id) =>
  request(`/admin/leadership/${id}`, { method: "DELETE" });
export const deleteLeadershipImage = (teamId, personId = "owner") =>
  request(`/admin/leadership/${teamId}/images/${personId}`, {
    method: "DELETE",
  });
export const deleteUnattachedTeamImage = (imageUrl) =>
  request("/admin/leadership/image", {
    method: "DELETE",
    body: JSON.stringify({ imageUrl }),
  });
export const uploadTeamImage = async (file, previousImage = "") => {
  const signed = await request("/admin/leadership/image-upload-url", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      previousImage,
    }),
  });
  const response = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok)
    throw new Error(
      "Image upload failed. Check the R2 CORS configuration and try again.",
    );
  return signed.fileUrl;
};

export const getAdminHomeStats = () => requestOnce("home-stats", "/admin/home-stats");
export const createHomeStat = (data) =>
  request("/admin/home-stats", { method: "POST", body: JSON.stringify(data) });
export const updateHomeStat = (id, data) =>
  request(`/admin/home-stats/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteHomeStat = (id) =>
  request(`/admin/home-stats/${id}`, { method: "DELETE" });
