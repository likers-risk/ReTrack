import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOrder, setIsOrder] = useState(false);

  useEffect(() => {
    setError("");
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      console.warn("No authentication. Redirecting to login.");
      navigate("/");
    }

    setIsLoading(false);
  }, [navigate]);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const toggleOrder = () => setIsOrder((prev) => !prev);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-500">
        <h4 className="text-center text-lg">Loading...</h4>
      </div>
    );
  }

  return (
    <div className="d-flex flex-row" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        className="card d-flex flex-column p-3 sticky-top gap-5"
        style={{
          height: "82vh",
          width: isCollapsed ? "70px" : "180px",
          transition: "width 0.3s ease",
        }}
      >
        <button
          className="mb-3"
          style={{ border: "none", background: "transparent" }}
          onClick={toggleSidebar}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <Link
          to="home"
          className="d-flex align-items-center fw-semibold text-decoration-none text-dark fs-5"
        >
          <i className="fa-solid fa-house me-2" style={{ fontSize: "24px" }} />
          {!isCollapsed && <span>Home</span>}
        </Link>

        <Link
          to="shopping"
          className="d-flex align-items-center fw-semibold text-decoration-none text-dark fs-5"
        >
          <i className="fa-solid fa-cart-shopping me-2" style={{ fontSize: "24px" }} />
          {!isCollapsed && <span>Shop</span>}
        </Link>

        <Link
          to="add-item"
          className="d-flex align-items-center fw-semibold text-decoration-none text-dark fs-5"
        >
          <i className="fa-solid fa-clipboard-check me-2" style={{ fontSize: "24px" }} />
          {!isCollapsed && <span>Add Item</span>}
        </Link>

        <Link
          to="sales"
          className="d-flex align-items-center fw-semibold text-decoration-none text-dark fs-5"
        >
          <i className="fa-solid fa-chart-bar me-2" style={{ fontSize: "24px" }} />
          {!isCollapsed && <span>Sales</span>}
        </Link>

        <Link
          to="/profile"
          className="d-flex align-items-center fw-semibold text-decoration-none text-dark fs-5"
        >
          <i className="fa fa-user me-2" style={{ fontSize: "24px" }} />
          {!isCollapsed && <span>Profile</span>}
        </Link>

        {error && <div className="text-danger mt-2">{error}</div>}
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-3 overflow-auto">
        <Outlet />
        <button
          className="btn btn-outline-primary mt-3"
          onClick={toggleOrder}
        >
          {isOrder ? "Close Orders" : "Open Orders"}
        </button>
      </div>

      {/* Order Sidebar */}
      <div
        className="d-flex flex-column bg-white shadow-sm rounded"
        style={{
          height: "82vh",
          width: isOrder ? "200px" : "0px",
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}
      >
        {/* You can put your order details here */}
        {isOrder && (
          <div className="p-3">
            <h5 className="fw-bold">Orders</h5>
            <p>Order details will appear here...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
