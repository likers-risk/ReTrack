import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config";
import { apiFetch } from "../api";

export default function Home() {
  const { isDarkMode } = useTheme();
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [expiring, setExpiring] = useState([]);
  const [expiryDays, setExpiryDays] = useState(30);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return setError("Unauthorized");

    const fetchData = async () => {
      try {
        const salesRes = await fetch(`${API_URL}/api/total-sales`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const salesData = await salesRes.json();
        setTotalSales(salesData.total_sales || 0);

        const revenueRes = await fetch(
          `${API_URL}/api/sales-revenue`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const revenueData = await revenueRes.json();
        setTotalRevenue(revenueData.revenue || 0);

        const productsRes = await fetch(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      }
    };

    fetchData();

    // Thresholds from Settings + products that are expired or expiring soon
    apiFetch("/settings")
      .then(({ ok, data }) => ok && setLowStockThreshold(Number(data.settings.low_stock_threshold)))
      .catch(() => {});
    apiFetch("/expiring")
      .then(({ ok, data }) => {
        if (ok) {
          setExpiring(data.expiring);
          setExpiryDays(data.days);
        }
      })
      .catch(() => {});
  }, []);

  const lowStockProducts = products.filter(
    (p) => (p.stocks?.quantity ?? 0) <= lowStockThreshold
  );
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div
      className="rounded"
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "#F3F2EC",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {error && <p className="text-danger">{error}</p>}

      {/* Cards Section */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-primary text-white h-100 text-center"
            style={{ minWidth: "160px" }}
          >
            <h5>Total Sales</h5>
            <p className="fs-4 fw-bold mb-0">₱{totalSales}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-success text-white h-100 text-center"
            style={{ minWidth: "160px" }}
          >
            <h5>Total Revenue</h5>
            <p className="fs-4 fw-bold mb-0">₱{totalRevenue}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 text-white h-100 text-center"
            style={{ backgroundColor: "#3C467B", minWidth: "160px" }}
          >
            <h5>Total Products</h5>
            <p className="fs-4 fw-bold mb-0">{products.length}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-danger text-white h-100 text-center"
            style={{ minWidth: "160px" }}
          >
            <h5 className="">Low Stock Items</h5>
            <p className="fs-4 fw-bold text-white mb-0">
              {lowStockProducts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Recently Added Products */}
      <div
        className="card p-3 shadow rounded-4 mb-4"
        style={{
          backgroundColor: isDarkMode ? "#374151" : "white",
          border: isDarkMode ? "1px solid #4b5563" : "none",
        }}
      >
        <h5
          className="fw-bold mb-3"
          style={{ color: isDarkMode ? "#f9fafb" : "#1f2937" }}
        >
          Recently Added Products
        </h5>
        <div className="table-responsive">
          <table className="table mb-0" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Price
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Expiration
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#212529",
                    color: "white",
                    padding: "12px",
                    fontWeight: "600",
                    border: "1px solid #dee2e6",
                  }}
                >
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length > 0 ? (
                recentProducts.map((p, index) => (
                  <tr key={p.id}>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {p.product_name}
                      {p.barcode && (
                        <small className="d-block text-muted">
                          <i className="fa-solid fa-barcode me-1"></i>
                          {p.barcode}
                        </small>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      ₱{p.price}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {p.stocks?.quantity}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {p.expiration_date}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {p.category_name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      {p.cost}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center"
                    style={{
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      backgroundColor: isDarkMode ? "#374151" : "white",
                      padding: "2rem",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring Soon */}
      <div className="card p-3 shadow rounded-4 mb-4" style={{ backgroundColor: "#fff7e6", border: "1px solid #ffc107" }}>
        <h5 className="fw-bold mb-3" style={{ color: "#8a5a00" }}>
          <i className="fa-solid fa-hourglass-half me-2"></i>
          Expiring Soon <small className="fw-normal">(within {expiryDays} days)</small>
        </h5>
        {expiring.length === 0 ? (
          <p className="mb-0" style={{ color: "#8a5a00" }}>Nothing is expiring soon.</p>
        ) : (
          <ul className="list-group">
            {expiring.map((p) => (
              <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>
                  <span className="fw-semibold">{p.name}</span>{" "}
                  <small className="text-muted">({p.quantity} in stock)</small>
                </span>
                <span className={`badge rounded-pill ${p.expired ? "bg-danger" : p.days_left <= 7 ? "bg-warning text-dark" : "bg-secondary"}`}>
                  {p.expired
                    ? `Expired ${Math.abs(p.days_left)} day(s) ago`
                    : p.days_left === 0
                    ? "Expires today"
                    : `${p.days_left} day(s) left · ${p.expiration_date}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Low Stock Alerts */}
      <div
        className="card p-3 shadow rounded-4 bg-danger"
        style={{
          backgroundColor: isDarkMode ? "#374151" : "none",
          border: isDarkMode ? "1px solid #4b5563" : "none",
        }}
      >
        <h5 className="fw-bold mb-3 text-white">Low Stock Alerts</h5>
        {lowStockProducts.length > 0 ? (
          <ul className="list-group">
            {lowStockProducts.map((p) => (
              <li
                key={p.id}
                className="list-group-item d-flex justify-content-between align-items-center flex-wrap"
                style={{
                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                  color: isDarkMode ? "#f9fafb" : "#1f2937",
                  borderColor: isDarkMode ? "#6b7280" : "#6b7280",
                }}
              >
                <span className="fw-semibold">{p.product_name}</span>
                <span className="badge bg-danger rounded-pill">
                  {p.stocks?.quantity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mb-0"
            style={{ color: "white" }}
          >
            No low stock items!
          </p>
        )}
      </div>
    </div>
  );
}
