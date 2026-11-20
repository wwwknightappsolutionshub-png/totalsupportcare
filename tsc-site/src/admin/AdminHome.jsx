import { useOutletContext } from "react-router-dom";
import AdminOverview from "./AdminOverview";
import HrHome from "../hr/HrHome";

/** Index route: owners see CMS overview; HR sees HR home. */
export default function AdminHome() {
  const { user } = useOutletContext();
  if (user?.role === "hr") return <HrHome />;
  return <AdminOverview />;
}
