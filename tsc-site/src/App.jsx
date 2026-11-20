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
import AdminLayout, { OwnerOnly } from "./admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import AdminHome from "./admin/AdminHome";
import AdminPages from "./admin/AdminPages";
import AdminApplications from "./admin/AdminApplications";
import AdminMessages from "./admin/AdminMessages";
import AdminWhatsApp from "./admin/AdminWhatsApp";
import AdminMedia from "./admin/AdminMedia";
import AdminSettings from "./admin/AdminSettings";
import HrHome from "./hr/HrHome";
import HrStaff from "./hr/HrStaff";
import HrTraining from "./hr/HrTraining";
import HrAbsences from "./hr/HrAbsences";
import HrTasks from "./hr/HrTasks";
import HrReports from "./hr/HrReports";

function PublicRoutes() {
  const { ready } = useSite();

  if (!ready) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>Loading…</div>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route
          path="pages"
          element={
            <OwnerOnly>
              <AdminPages />
            </OwnerOnly>
          }
        />
        <Route
          path="settings"
          element={
            <OwnerOnly>
              <AdminSettings />
            </OwnerOnly>
          }
        />
        <Route
          path="media"
          element={
            <OwnerOnly>
              <AdminMedia />
            </OwnerOnly>
          }
        />
        <Route
          path="whatsapp"
          element={
            <OwnerOnly>
              <AdminWhatsApp />
            </OwnerOnly>
          }
        />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="hr" element={<HrHome />} />
        <Route path="hr/staff" element={<HrStaff />} />
        <Route path="hr/training" element={<HrTraining />} />
        <Route path="hr/absences" element={<HrAbsences />} />
        <Route path="hr/tasks" element={<HrTasks />} />
        <Route path="hr/reports" element={<HrReports />} />
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
