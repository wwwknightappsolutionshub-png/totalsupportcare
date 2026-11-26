import { Navigate, useOutletContext } from "react-router-dom";

export function OwnerOnly({ children }) {
  const { user } = useOutletContext();
  if (!user || user.role !== "owner") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}