import { Navigate } from "react-router-dom";

// Shows the page only to Admins. Staff are sent back to the dashboard home.
export default function AdminOnly({ children }) {
  const role = localStorage.getItem("role");
  if (role !== "Admin") {
    return <Navigate to="/dashboard/home" replace />;
  }
  return children;
}
