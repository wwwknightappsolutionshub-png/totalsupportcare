import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { SiteProvider, useSite } from "./context/SiteContext";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import News from "./pages/News";
import Opportunities from "./pages/Opportunities";
import Services from "./pages/Services";
import DynamicCmsPage from "./pages/DynamicCmsPage";
import { OwnerOnly } from "./admin/OwnerOnly";

const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminHome = lazy(() => import("./admin/AdminHome"));
const AdminPages = lazy(() => import("./admin/AdminPages"));
const AdminApplications = lazy(() => import("./admin/AdminApplications"));
const AdminMessages = lazy(() => import("./admin/AdminMessages"));
const AdminWhatsApp = lazy(() => import("./admin/AdminWhatsApp"));
const AdminMedia = lazy(() => import("./admin/AdminMedia"));
const AdminSettings = lazy(() => import("./admin/AdminSettings"));
const HrHome = lazy(() => import("./hr/HrHome"));
const HrStaff = lazy(() => import("./hr/HrStaff"));
const HrTraining = lazy(() => import("./hr/HrTraining"));
const HrAbsences = lazy(() => import("./hr/HrAbsences"));
const HrTasks = lazy(() => import("./hr/HrTasks"));
const HrReports = lazy(() => import("./hr/HrReports"));

function AdminRouteFallback() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>Loading…</div>
  );
}

function PublicRoutes() {
  const { ready } = useSite();

  if (!ready) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>Loading…</div>
    );
  }

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<AdminRouteFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminRouteFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminHome />
            </Suspense>
          }
        />
        <Route
          path="pages"
          element={
            <OwnerOnly>
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminPages />
              </Suspense>
            </OwnerOnly>
          }
        />
        <Route
          path="settings"
          element={
            <OwnerOnly>
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminSettings />
              </Suspense>
            </OwnerOnly>
          }
        />
        <Route
          path="media"
          element={
            <OwnerOnly>
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminMedia />
              </Suspense>
            </OwnerOnly>
          }
        />
        <Route
          path="whatsapp"
          element={
            <OwnerOnly>
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminWhatsApp />
              </Suspense>
            </OwnerOnly>
          }
        />
        <Route
          path="applications"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminApplications />
            </Suspense>
          }
        />
        <Route
          path="messages"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <AdminMessages />
            </Suspense>
          }
        />
        <Route
          path="hr"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrHome />
            </Suspense>
          }
        />
        <Route
          path="hr/staff"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrStaff />
            </Suspense>
          }
        />
        <Route
          path="hr/training"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrTraining />
            </Suspense>
          }
        />
        <Route
          path="hr/absences"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrAbsences />
            </Suspense>
          }
        />
        <Route
          path="hr/tasks"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrTasks />
            </Suspense>
          }
        />
        <Route
          path="hr/reports"
          element={
            <Suspense fallback={<AdminRouteFallback />}>
              <HrReports />
            </Suspense>
          }
        />
      </Route>

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="news" element={<News />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<DynamicCmsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <SiteProvider>
          <BrowserRouter>
            <PublicRoutes />
          </BrowserRouter>
        </SiteProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}