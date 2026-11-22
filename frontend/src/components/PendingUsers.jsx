import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function PendingUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  });

  const loadPending = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/users/pending`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load sign-ups.");
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (id, action) => {
    if (action === "reject" && !window.confirm("Reject and delete this sign-up?")) {
      return;
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/users/${id}/${action}`, {
        method: action === "approve" ? "PUT" : "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong.");
      setMessage(data.message);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container py-3">
      <h4 className="fw-bold mb-3">
        <i className="fa fa-user-clock me-2"></i>Pending Sign-ups
      </h4>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {isLoading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-muted">No one is waiting for approval.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Signed up</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleString()}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleAction(u.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleAction(u.id, "reject")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
