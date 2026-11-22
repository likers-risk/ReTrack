import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import UserProfile from "../assets/userprofile.png";
import "../CSS/User.css";
import "../CSS/Profile.css";
import { API_URL } from "../config";

const Profile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!authToken || !userId) {
        setError("Authentication token or user ID not found.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/user-profile/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user credentials.");

        const data = await response.json();
        setUser(data.user);
        setIsLoading(false);
      } catch (err) {
        console.error("Fetch user error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("No authentication token found.");
        navigate("/");
        return;
      }

      const response = await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        setTimeout(() => navigate("/"), 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Logout failed.");
        setIsLoggingOut(false);
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to connect to the server for logout.");
      setIsLoggingOut(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    document.body.style.backgroundColor = !darkMode ? "#2d2d2d" : "#fff";
    document.body.style.color = !darkMode ? "#fff" : "#000";
  };

  const handleNavigate = (path) => navigate(path);

  const FullScreenLoader = ({ message }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#263d81",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#aedef1",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="spinner-border text-light"
        role="status"
        style={{ width: "3rem", height: "3rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 fw-semibold">{message}</p>
    </div>
  );

  if (error)
    return <div className="text-danger text-center mt-5">Error: {error}</div>;
  if (isLoading) return <FullScreenLoader message="Loading profile..." />;
  if (isLoggingOut) return <FullScreenLoader message="Signing out..." />;

  return (
    <div
      className={`d-flex flex-column flex-md-row ${
        darkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
      style={{ minHeight: "100vh" }}
    >
      <nav
        className="d-flex d-md-none justify-content-between align-items-center p-3 bg-primary text-white"
        style={{ position: "sticky", top: 0, zIndex: 1000 }}
      >
        <span className="fw-bold fs-5">Profile</span>
        <button
          className="btn btn-outline-light"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <i className="fa fa-bars"></i>
        </button>
      </nav>

      <div
        className={`sidebar bg-white shadow p-3 d-flex flex-column justify-content-between ${
          isSidebarOpen ? "d-flex" : "d-none d-md-flex"
        }`}
        style={{
          width: "100%",
          maxWidth: "260px",
          position: isSidebarOpen ? "absolute" : "relative",
          height: "100vh",
          top: isSidebarOpen ? "60px" : "0",
          zIndex: 999,
        }}
      >
        <div className="d-flex flex-column align-items-center text-center mb-4">
          <img
            src={
              user.image
                ? `${API_URL}/storage/${user.image}`
                : UserProfile
            }
            alt="User profile"
            className="rounded-circle mb-2"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
          <h6 className="fw-semibold mb-0">{user.username}</h6>
          <small className="text-muted">
            {user.role}
            {user.store?.name ? ` · ${user.store.name}` : ""}
          </small>
          <small>{user.email}</small>
        </div>

        <div className="d-flex flex-column gap-2">
          <button
            className="btn btn-outline-primary text-start"
            onClick={() => handleNavigate("edit-profile")}
          >
            <i className="fa fa-user-edit me-2"></i>Edit Profile
          </button>
          <button
            className="btn btn-outline-primary text-start"
            onClick={() => handleNavigate("total-sales")}
          >
            <i className="fa fa-file-alt me-2"></i>Reports
          </button>
          <button
            className="btn btn-outline-primary text-start"
            onClick={() => handleNavigate("notification")}
          >
            <i className="fa fa-bell me-2"></i>Notifications
          </button>
          {user.role === "Admin" && (
            <>
              <small className="text-muted text-uppercase mt-2">Admin</small>
              <button
                className="btn btn-outline-primary text-start"
                onClick={() => handleNavigate("sales-report")}
              >
                <i className="fa-solid fa-chart-column me-2"></i>Sales Report
              </button>
              <button
                className="btn btn-outline-primary text-start"
                onClick={() => handleNavigate("inventory-log")}
              >
                <i className="fa-solid fa-clipboard-list me-2"></i>Inventory Log
              </button>
              <button
                className="btn btn-outline-primary text-start"
                onClick={() => handleNavigate("/register")}
              >
                <i className="fa fa-user-plus me-2"></i>Add Staff
              </button>
              <button
                className="btn btn-outline-primary text-start"
                onClick={() => handleNavigate("approvals")}
              >
                <i className="fa fa-user-check me-2"></i>Pending Sign-ups
              </button>
              <button
                className="btn btn-outline-primary text-start"
                onClick={() => handleNavigate("settings")}
              >
                <i className="fa-solid fa-gear me-2"></i>Settings
              </button>
            </>
          )}
          <button
            className="btn btn-outline-secondary text-start"
            onClick={toggleTheme}
          >
            <i className="fa fa-adjust me-2"></i>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            className="btn btn-outline-danger text-start"
            onClick={handleSignOut}
          >
            <i className="fa fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1 p-3 overflow-auto"
        style={{
          backgroundColor: darkMode ? "#2d2d2d" : "#f5f6fa",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Profile;
