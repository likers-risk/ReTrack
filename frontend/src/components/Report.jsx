import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setRevenue] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTotalSales = async () => {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        setError("Invalid or unauthenticated user.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/total-sales", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to get total sales.");
        const data = await response.json();
        setTimeout(() => setLoading(false), 600);
        setTotalSales(data.total_sales || 0);
      } catch (err) {
        setError(err.message || "Server Error");
      }
    };

    fetchTotalSales();
  }, [navigate]);

  useEffect(() => {
    const fetchRevenue = async () => {
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/sales-revenue",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Error Fetching Revenue");
        const data = await response.json();
        setRevenue(data.revenue || 0);
      } catch (err) {
        setError(err.message || "Server Error");
      }
    };

    fetchRevenue();
  }, []);

  useEffect(() => {
    const fetchLowStock = async () => {
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await fetch("http://127.0.0.1:8000/api/low-stock", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) throw new Error("Error Fetching Low Stock Items");
        const data = await response.json();
        setLowStock(data.low_stock || []);
      } catch (err) {
        setError(err.message || "Server Error");
      }
    };

    fetchLowStock();
  }, []);

  useEffect(() => {
    const fetchTopProducts = async () => {
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await fetch("http://127.0.0.1:8000/api/top-products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) throw new Error("Error Fetching Top Products");
        const data = await response.json();
        setTopProducts(data.top_products || []);
      } catch (err) {
        setError(err.message || "Server Error");
      }
    };

    fetchTopProducts();
  }, []);

  const navigateDashboard = () => {
    navigate("/dashboard");
  };

  const FullScreenLoader = ({ message = "Loading..." }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#fff",
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

  if (loading) return <FullScreenLoader message="Loading profile..." />;

  return (
    <div
      className="d-flex flex-column p-3 rounded shadow-sm"
      style={{ backgroundColor: "#50589C" }}
    >
      <div className="mb-3">
        <button
          className="btn btn-dark fw-semibold"
          onClick={navigateDashboard}
        >
          <i className="fa fa-arrow-left"></i> Back
        </button>
      </div>

      {error && <div className="text-danger fw-bold">{error}</div>}

      <div className="d-flex flex-wrap gap-3 mb-4">
        <div className="card p-3 shadow-sm flex-fill text-center">
          <h5>Total Sales</h5>
          <p className="fw-bold fs-4 text-success">
            <i className="fa fa-cart-shopping"></i> {totalSales}
          </p>
        </div>

        <div className="card p-3 shadow-sm flex-fill text-center">
          <h5>Total Revenue</h5>
          <p className="fw-bold fs-4 text-primary">
            <i className="fa fa-peso-sign"></i> {totalRevenue}
          </p>
        </div>
      </div>

      <div className="card p-3 shadow-sm mb-4">
        <h5 className="fw-bold text-danger">⚠️ Low Stock Items</h5>
        {lowStock.length > 0 ? (
          <ul className="list-group mt-2">
            {lowStock.map((item, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {item.name}
                <span className="badge bg-danger rounded-pill">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No low stock items.</p>
        )}
      </div>

      <div className="card p-3 shadow-sm">
        <h5 className="fw-bold text-success">🔥 Top Selling Products</h5>
        {topProducts.length > 0 ? (
          <ol className="mt-2">
            {topProducts.map((product, index) => (
              <li key={index} className="fw-semibold">
                {product.name} — {product.sold} sold
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">No sales data available.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
