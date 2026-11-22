import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const navigateDashboard = () => navigate("/dashboard");

  useEffect(() => {
    const fetchNotifications = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("Unauthorized. Please login again.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load notifications (${response.status})`);
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setError(err.message || "Error fetching notifications.");
      }
    };

    fetchNotifications();
  }, [navigate]);

  const toggleRead = async (id, readStatus) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}/toggle-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ read: !readStatus }),
        }
      );

      if (!response.ok)
        throw new Error("Failed to update notification status.");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !readStatus } : n))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotification = async (id) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete notification.");

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const clearAll = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/clear-all`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to clear notifications.");

      setNotifications([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="container mt-3 p-2 rounded"
      style={{ backgroundColor: "#50589C" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-dark fw-semibold"
          style={{ borderRadius: "5px" }}
          onClick={navigateDashboard}
        >
          <i className="fa fa-arrow-left"></i> Back
        </button>

        {notifications.length > 0 && (
          <button className="btn btn-danger" onClick={clearAll}>
            <i className="fa fa-trash"></i> Clear All
          </button>
        )}
      </div>

      {error && <p className="text-danger">{error}</p>}

      <>
        <h4 className="fw-bold mb-3">
          🔔 Notifications{" "}
          <span className="badge bg-primary">
            {notifications.filter((n) => !n.read).length} Unread
          </span>
        </h4>

        <div className="list-group">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`list-group-item d-flex justify-content-between align-items-start ${
                  n.read ? "bg-light" : "bg-white fw-bold"
                }`}
              >
                <div>
                  <h6>{n.title}</h6>
                  <p className="mb-1">{n.message}</p>
                  <small className="text-muted">
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
                <div className="d-flex flex-column gap-1">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => toggleRead(n.id, n.read)}
                  >
                    {n.read ? "Mark Unread" : "Mark Read"}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteNotification(n.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No notifications available.</p>
          )}
        </div>
      </>
    </div>
  );
};

export default Notification;
