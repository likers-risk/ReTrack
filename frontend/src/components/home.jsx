import { useEffect, useState } from "react";

export default function Home() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return setError("Unauthorized");

    const fetchData = async () => {
      try {
        const salesRes = await fetch("http://127.0.0.1:8000/api/total-sales", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const salesData = await salesRes.json();
        setTotalSales(salesData.total_sales || 0);

        const revenueRes = await fetch(
          "http://127.0.0.1:8000/api/sales-revenue",
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const revenueData = await revenueRes.json();
        setTotalRevenue(revenueData.revenue || 0);

        const productsRes = await fetch("http://127.0.0.1:8000/api/products", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      }
    };

    fetchData();
  }, []);

  const lowStockProducts = products.filter((p) => p.stocks?.quantity < 5);
  const recentProducts = products.slice(-5).reverse();

  return (
    <div
      className="rounded"
      style={{
        backgroundColor: "#F3F2EC",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {error && <p className="text-danger">{error}</p>}

      {/* Cards Section */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-primary text-white h-100"
            style={{ minWidth: "160px" }}
          >
            <h5>Total Sales</h5>
            <p className="fs-4 fw-bold mb-0">₱{totalSales}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-success text-white h-100"
            style={{ minWidth: "160px" }}
          >
            <h5>Total Revenue</h5>
            <p className="fs-4 fw-bold mb-0">₱{totalRevenue}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 text-white h-100"
            style={{ backgroundColor: "#3C467B", minWidth: "160px" }}
          >
            <h5>Total Products</h5>
            <p className="fs-4 fw-bold mb-0">{products.length}</p>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div
            className="card p-3 shadow rounded-4 bg-warning text-white h-100"
            style={{ minWidth: "160px" }}
          >
            <h5>Low Stock Items</h5>
            <p className="fs-4 fw-bold text-danger mb-0">
              {lowStockProducts.length}
            </p>
          </div>
        </div>
      </div>

      
      <div className="card p-3 shadow rounded-4 mb-4 bg-white">
        <h5 className="fw-bold mb-3">Recently Added Products</h5>
        <div className="table-responsive">
          <table className="table table-striped table-bordered mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiration</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length > 0 ? (
                recentProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.product_name}</td>
                    <td>₱{p.price}</td>
                    <td>{p.stocks?.quantity}</td>
                    <td>{p.expiration_date}</td>
                    <td>{p.category_id}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card p-3 shadow rounded-4 bg-white">
        <h5 className="fw-bold mb-3 text-danger">Low Stock Alerts</h5>
        {lowStockProducts.length > 0 ? (
          <ul className="list-group">
            {lowStockProducts.map((p) => (
              <li
                key={p.id}
                className="list-group-item d-flex justify-content-between align-items-center flex-wrap"
              >
                <span className="fw-semibold">{p.product_name}</span>
                <span className="badge bg-danger rounded-pill">
                  {p.stocks?.quantity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-success mb-0">No low stock items!</p>
        )}
      </div>
    </div>
  );
}
