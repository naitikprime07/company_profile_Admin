// Minimal environment config for the standalone admin app.
// The admin talks to the SAME backend as the public site - only the API base
// URL is required here (public-only contact/office/animation config lives in the
// marketing FE and is intentionally not carried into the admin bundle).
const readEnvironmentValue = (name, fallback) => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export const ENVIRONMENT = Object.freeze({
  apiBaseUrl: readEnvironmentValue(
    "VITE_API_BASE_URL",
    "http://localhost:5000/api",
  ).replace(/\/$/, ""),
});
