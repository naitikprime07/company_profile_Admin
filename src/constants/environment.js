// Minimal environment config for the standalone admin app.
// The admin talks to the SAME backend as the public site - only the API base
// URL is required here (public-only contact/office/animation config lives in the
// marketing FE and is intentionally not carried into the admin bundle).
const readEnvironmentValue = (name, fallback) => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

// Production deploys must never talk to localhost. If VITE_API_BASE_URL is not
// baked into the build (e.g. the Vercel env var was removed or left as the
// localhost default), fall back to the deployed API so login and every admin
// request keep working on the live site.
const PRODUCTION_API_BASE_URL = "https://company-profile-be.vercel.app/api";

const resolveApiBaseUrl = () =>
  readEnvironmentValue("VITE_API_BASE_URL", "") ||
  (import.meta.env.PROD
    ? PRODUCTION_API_BASE_URL
    : "http://localhost:5000/api");

// The public marketing site runs on its OWN origin (separate from the admin).
// "View" actions that open public pages (e.g. a blog article) must target this
// base URL, not the admin origin which has no /blog/:slug route. In local dev
// the public site is served on the FE dev port (5173); on Vercel set
// VITE_PUBLIC_SITE_URL to the deployed public site origin.
const PRODUCTION_PUBLIC_SITE_URL =
  readEnvironmentValue("VITE_PUBLIC_SITE_URL", "").replace(/\/$/, "");

const resolvePublicSiteUrl = () =>
  PRODUCTION_PUBLIC_SITE_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:5173");

export const ENVIRONMENT = Object.freeze({
  apiBaseUrl: resolveApiBaseUrl().replace(/\/$/, ""),
  publicSiteUrl: resolvePublicSiteUrl(),
});
