import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import retrackLogo from "../assets/Retrack.png";
import "../CSS/Dashboard.css";
import SyncBar from "./SyncBar";
import { clearLogin } from "../api";
import { getQueue } from "../offline";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setError("");
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      console.warn("No authentication. Redirecting to login.");
      navigate("/");
    }

    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-dropdown-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  const handleLogout = () => {
    const waiting = getQueue().length;
    if (
      waiting > 0 &&
      !window.confirm(
        `${waiting} offline item(s) haven't been synced yet. They stay saved on this device, but sync them before switching devices. Log out anyway?`
      )
    ) {
      return;
    }
    clearLogin();
    navigate("/");
  };

  const FullScreenLoader = ({ message = "Loading..." }) => {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: isDarkMode ? "#1f2937" : "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          zIndex: 9999,
        }}
      >
        <div
          className="spinner-border"
          role="status"
          style={{ width: "3rem", height: "3rem", color: "#4f46e5" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p
          className="mt-3 fs-5 fw-semibold"
          style={{ color: isDarkMode ? "#f9fafb" : "#4f46e5" }}
        >
          {message}
        </p>
      </div>
    );
  };

  if (isLoading) return <FullScreenLoader message="Loading dashboard..." />;

  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: "100vh",
        backgroundColor: isDarkMode ? "#1f2937" : "#f8f9fa",
        color: isDarkMode ? "#f9fafb" : "#1f2937",
      }}
    >
      {/* Modern Header */}
      <header
        className="d-flex justify-content-between align-items-center shadow-sm px-4 py-3"
        style={{
          backgroundColor: isDarkMode ? "#374151" : "white",
          borderBottom: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              backgroundColor: isDarkMode ? "white" : "transparent",
              borderRadius: "8px",
              padding: isDarkMode ? "6px" : "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={retrackLogo}
              alt="Retrack Logo"
              className="img-fluid"
              style={{ maxWidth: "50px" }}
            />
          </div>
          <div>
            <h4 className="m-0 fw-bold">
              <span style={{ color: "#F5C542" }}>Re</span>
              <span style={{ color: "#3C5A99" }}>Tra</span>
              <span style={{ color: "#E63946" }}>ck</span>
            </h4>
            <p
              className="m-0 small"
              style={{ color: isDarkMode ? "#d1d5db" : "#6b7280" }}
            >
              Inventory System
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: "40px",
              height: "40px",
              padding: "0",
              border: `2px solid ${isDarkMode ? "#6b7280" : "#e5e7eb"}`,
              backgroundColor: isDarkMode ? "#4b5563" : "#f9fafb",
              color: isDarkMode ? "#fbbf24" : "#374151",
              transition: "all 0.2s ease",
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i
              className={`fa-solid ${isDarkMode ? "fa-sun" : "fa-moon"}`}
              style={{ fontSize: "18px" }}
            ></i>
          </button>

          {/* User Dropdown */}
          <div className="position-relative user-dropdown-container">
            <button
              className="btn d-flex align-items-center gap-2"
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                padding: "4px 8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? "#4b5563"
                  : "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                className="small fw-semibold d-none d-md-inline"
                style={{ color: isDarkMode ? "#e5e7eb" : "#374151" }}
              >
                {localStorage.getItem("username")}
              </span>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {localStorage.getItem("username")?.charAt(0).toUpperCase()}
              </div>
              <i
                className={`fa-solid fa-chevron-${
                  showUserMenu ? "up" : "down"
                }`}
                style={{
                  fontSize: "12px",
                  color: isDarkMode ? "#e5e7eb" : "#374151",
                }}
              ></i>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className="position-absolute shadow-lg"
                style={{
                  backgroundColor: isDarkMode ? "#374151" : "white",
                  border: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
                  borderRadius: "12px",
                  padding: "8px",
                  minWidth: "220px",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 1000,
                  animation: "fadeInDown 0.2s ease",
                }}
              >
                {/* User Info */}
                <div
                  className="px-3 py-2 mb-2"
                  style={{
                    borderBottom: `1px solid ${
                      isDarkMode ? "#4b5563" : "#e5e7eb"
                    }`,
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      {localStorage
                        .getItem("username")
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p
                        className="mb-0 fw-semibold"
                        style={{
                          color: isDarkMode ? "#f9fafb" : "#1f2937",
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {localStorage.getItem("username")}
                      </p>
                      <p
                        className="mb-0"
                        style={{
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        {localStorage.getItem("role")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#4b5563"
                      : "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i className="fa-solid fa-user" style={{ width: "16px" }}></i>
                  My Profile
                </Link>

                <hr
                  style={{
                    borderColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                    margin: "8px 0",
                  }}
                />

                {/* Logout */}
                <button
                  className="d-flex align-items-center gap-2"
                  onClick={handleLogout}
                  style={{
                    color: "#dc2626",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    border: "none",
                    backgroundColor: "transparent",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fee2e2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <i
                    className="fa-solid fa-arrow-right-from-bracket"
                    style={{ width: "16px" }}
                  ></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="d-flex flex-row flex-grow-1">
        {/* Modern Sidebar */}
        <div
          className="d-flex flex-column p-3 sidebar-container"
          style={{
            minHeight: "calc(100vh - 80px)",
            width: isCollapsed ? "90px" : "280px",
            backgroundColor: isDarkMode ? "#374151" : "white",
            borderRight: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
            transition: "width 0.3s ease",
          }}
        >
          <button
            className="toggle-btn mb-4 btn d-flex align-items-center justify-content-center"
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              border: `1px solid ${isDarkMode ? "#6b7280" : "#d1d5db"}`,
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
              color: isDarkMode ? "#e5e7eb" : "#374151",
              transition: "all 0.2s ease",
            }}
          >
            <i
              className={`fa-solid ${
                isCollapsed ? "fa-chevron-right" : "fa-chevron-left"
              }`}
            ></i>
          </button>

          <nav className="d-flex flex-column gap-2">
            <SidebarLink
              to="home"
              icon="fa-house"
              label="Home"
              collapsed={isCollapsed}
              isDarkMode={isDarkMode}
            />
            <SidebarLink
              to="shopping"
              icon="fa-cart-shopping"
              label="Shopping"
              collapsed={isCollapsed}
              isDarkMode={isDarkMode}
            />
            {localStorage.getItem("role") === "Admin" && (
              <SidebarLink
                to="add-item"
                icon="fa-clipboard-check"
                label="Add Item"
                collapsed={isCollapsed}
                isDarkMode={isDarkMode}
              />
            )}
            <SidebarLink
              to="sales"
              icon="fa-chart-bar"
              label="Sales"
              collapsed={isCollapsed}
              isDarkMode={isDarkMode}
            />
          </nav>

          {error && (
            <div className="alert alert-danger mt-auto small">{error}</div>
          )}
        </div>

        {/* Main Content Area */}
        <div
          className="flex-grow-1 p-4 overflow-auto"
          style={{
            backgroundColor: isDarkMode ? "#1f2937" : "#f8f9fa",
            color: isDarkMode ? "#f9fafb" : "#1f2937",
          }}
        >
          <SyncBar />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, icon, label, collapsed, isDarkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      className="sidebar-link d-flex align-items-center text-decoration-none rounded-3 px-3 py-3"
      title={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        color: isHovered
          ? isDarkMode
            ? "#818cf8"
            : "#4f46e5"
          : isDarkMode
          ? "#e5e7eb"
          : "#6b7280",
        backgroundColor: isHovered
          ? isDarkMode
            ? "#4b5563"
            : "#eef2ff"
          : "transparent",
        transition: "all 0.2s ease",
        fontWeight: isHovered ? "600" : "500",
        fontSize: "15px",
      }}
    >
      <i
        className={`fa-solid ${icon}`}
        style={{
          fontSize: "22px",
          minWidth: "30px",
          marginRight: collapsed ? "0" : "16px",
          color: isHovered
            ? isDarkMode
              ? "#818cf8"
              : "#4f46e5"
            : isDarkMode
            ? "#e5e7eb"
            : "#6b7280",
          transition: "all 0.2s ease",
        }}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export default Dashboard;
