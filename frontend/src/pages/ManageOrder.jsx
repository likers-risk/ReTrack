import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("Unauthorized access. Please log in again.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/orders", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch orders.");
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message || "Server Error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // ✅ Update Order Status
  const updateOrderStatus = async (orderId, newStatus) => {
    const authToken = localStorage.getItem("authToken");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/orders/${orderId}/update-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status.");

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ❌ Cancel Order
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const authToken = localStorage.getItem("authToken");
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/orders/${orderId}/cancel`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to cancel order.");

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
    } catch (err) {
      setError(err.message);
    }
  };

  // 📥 Export Orders as PDF
  const generateOrdersPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("📋 Orders Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [["Order ID", "Customer", "Total", "Status", "Date"]],
      body: orders.map((o) => [
        o.id,
        o.customer_name,
        `₱${o.total}`,
        o.status,
        new Date(o.created_at).toLocaleDateString(),
      ]),
    });

    doc.save("orders_report.pdf");
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-dark" onClick={() => navigate("/dashboard")}>
          <i className="fa fa-arrow-left"></i> Back
        </button>
        <button className="btn btn-success" onClick={generateOrdersPDF}>
          <i className="fa fa-download"></i> Export PDF
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <h3 className="fw-bold mb-3">📋 Manage Orders</h3>

      <div className="table-responsive">
        <table className="table table-striped shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>₱{order.total}</td>
                  <td>
                    <select
                      className="form-select"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => cancelOrder(order.id)}
                    >
                      <i className="fa fa-times"></i> Cancel
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageOrders;
