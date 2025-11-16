import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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
          "http://127.0.0.1:8000/api/notifications",
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
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const toggleRead = async (id, readStatus) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/notifications/${id}/toggle-read`,
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
        `http://127.0.0.1:8000/api/notifications/${id}`,
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
        "http://127.0.0.1:8000/api/notifications/clear-all",
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

  const FullScreenLoader = ({ message = "Loading..." }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#fff",
        backdropFilter: "blur(5px)",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="spinner-border text-light"
        role="status"
        style={{ width: "4rem", height: "4rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 fw-semibold">{message}</p>
    </div>
  );

  if (loading) return <FullScreenLoader message="Loading notifications..." />;

  return (
    <div className="container mt-3">
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

      {loading && <p>Loading notifications...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && (
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
      )}
    </div>
  );
};

export default Notification;
