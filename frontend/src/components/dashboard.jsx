import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import retrackLogo from "../assets/Retrack.png";
import "../CSS/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setError("");
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      console.warn("No authentication. Redirecting to login.");
      navigate("/");
    }

    setTimeout(() => setIsLoading(false), 600);
  }, [navigate]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  const FullScreenLoader = ({ message = "Loading..." }) => {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#50589C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          zIndex: 9999,
          color: "#fff",
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
  };

  if (isLoading) return <FullScreenLoader message="Loading dashboard..." />;

  return (
    <div
      className="d-flex flex-column"
      style={{ minHeight: "100vh", backgroundColor: "#3C467B" }}
    >
      <header
        className="d-flex justify-content-between align-items-center shadow-sm px-4 py-3"
        style={{ backgroundColor: "white" }}
      >
        <div>
          <img
            src={retrackLogo}
            alt="Retrack Logo"
            className="img-fluid"
            style={{ maxWidth: "120px" }}
          />
        </div>

        <div className="text-center">
          <h2
            style={{
              color: "darkblue",
              fontFamily: "Arial",
              fontWeight: "bold",
            }}
          >
            Re<span style={{ color: "orangered" }}>Tra</span>
            <span style={{ color: "yellow" }}>ck</span>
          </h2>
          <h4
            style={{
              color: "orangered",
              fontFamily: "Arial",
              fontWeight: "bold",
            }}
          >
            Inv<span style={{ color: "darkblue" }}>ent</span>
            <span style={{ color: "yellow" }}>ory</span>
          </h4>
        </div>
      </header>

      <div className="d-flex flex-row flex-grow-1">
        <div
          className="d-flex flex-column p-3 sticky-top gap-5 shadow rounded"
          style={{
            height: "80vh",
            width: isCollapsed ? "70px" : "200px",
            backgroundColor: "#f8f9fa",
            transition: "width 0.3s ease",
          }}
        >
          <button
            className="mb-2 btn btn-sm btn-outline-secondary "
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <SidebarLink
            to="home"
            icon="fa-house"
            label="Home"
            collapsed={isCollapsed}
          />
          <SidebarLink
            to="shopping"
            icon="fa-cart-shopping"
            label="Shop"
            collapsed={isCollapsed}
          />
          <SidebarLink
            to="add-item"
            icon="fa-clipboard-check"
            label="Add Item"
            collapsed={isCollapsed}
          />
          <SidebarLink
            to="sales"
            icon="fa-chart-bar"
            label="Sales"
            collapsed={isCollapsed}
          />
          <SidebarLink
            to="/profile"
            icon="fa-user"
            label="Profile"
            collapsed={isCollapsed}
          />

          {error && <div className="text-danger mt-2 small">{error}</div>}
        </div>

        <div
          className="flex-grow-1 p-4 overflow-auto"
          style={{ backgroundColor: "#3C467B" }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, icon, label, collapsed }) => (
  <Link
    to={to}
    className="sidebar-link d-flex align-items-center fw-semibold text-decoration-none text-dark fs-6 py-2 px-2 rounded"
    title={collapsed ? label : ""}
    style={{
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "all 0.3s ease",
    }}
  >
    <i
      className={`fa-solid ${icon}`}
      style={{ fontSize: "20px", minWidth: "30px" }}
    />
    {!collapsed && <span>{label}</span>}
  </Link>
);

export default Dashboard;
