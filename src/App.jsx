import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./tokens.css";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminApplicationDetailsPage = lazy(
  () => import("./pages/AdminApplicationDetailsPage"),
);
const AdminInquiryDetailsPage = lazy(
  () => import("./pages/AdminInquiryDetailsPage"),
);
const AdminIntroductionDetailsPage = lazy(
  () => import("./pages/AdminIntroductionDetailsPage"),
);
const AdminOpeningFormPage = lazy(() => import("./pages/AdminOpeningFormPage"));
const AdminBlogFormPage = lazy(() => import("./pages/AdminBlogFormPage"));
const AdminPortfolioFormPage = lazy(() => import("./pages/AdminPortfolioFormPage"));

function App() {
  return (
    <div className="site-shell admin-shell">
      <Suspense
        fallback={
          <main className="route-loading" aria-live="polite">
            Loading…
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route
            path="/applications/:applicationId"
            element={<AdminApplicationDetailsPage />}
          />
          <Route
            path="/inquiries/:inquiryId"
            element={<AdminInquiryDetailsPage />}
          />
          <Route path="/introductions/:id" element={<AdminIntroductionDetailsPage />} />
          <Route path="/openings/new" element={<AdminOpeningFormPage />} />
          <Route
            path="/openings/:openingId/edit"
            element={<AdminOpeningFormPage />}
          />
          <Route path="/blogs/new" element={<AdminBlogFormPage />} />
          <Route path="/blogs/:blogId/edit" element={<AdminBlogFormPage />} />
          <Route path="/portfolio/new" element={<AdminPortfolioFormPage />} />
          <Route
            path="/portfolio/:portfolioId/edit"
            element={<AdminPortfolioFormPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
