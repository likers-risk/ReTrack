import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import UserProfile from "../assets/userprofile.png";

const Profile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!authToken || !userId) {
        setError("Authentication token or user ID not found.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/user-profile/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user credentials.");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Fetch user error:", err);
        setError(err.message);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  const handleSignOut = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("No authentication token found.");
        navigate("/");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        navigate("/");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Logout failed.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to connect to the server for logout. Please try again.");
    }
  };

  const handleNotification = () => navigate("notification");
  const handleReport = () => navigate("total-sales");
  const handleAdminInfo = () => navigate("admin-information");

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="d-flex flex-row gap-5">
      <div
        className="d-flex flex-column justify-content-between p-3"
        style={{ height: "82vh", backgroundColor: "#F3F2EC" }}
      >
        <div className="d-flex flex-column" onClick={handleAdminInfo}>
          {user.image ? (
            <img
              src={`http://127.0.0.1:8000/storage/${user.image}`}
              alt="User profile"
              style={{ height: "50px", width: "50px", borderRadius: "50px" }}
            />
          ) : (
            <img
              src={UserProfile}
              alt="Default user profile"
              style={{ height: "50px", width: "50px", borderRadius: "20px" }}
            />
          )}
          <p className="fw-semibold">{user.username}</p>
          <p className="fw-bold">{user.role}</p>
          <p className="fw-semibold">{user.email}</p>
        </div>

        <div className="d-flex flex-column gap-2">
          <div>
            <button className="btn d-flex align-items-center profile-button">
              <i className="fa fa-check-circle"></i>Status
            </button>
          </div>
          <div className="d-flex">
            <button
              className="btn d-flex align-items-center profile-button"
              onClick={handleReport}
            >
              <i className="fa fa-file-alt"></i>Reports
            </button>
          </div>
          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleNotification}
          >
            <i className="fa-solid fa-bell text-black me-2"></i>
            Notification
          </button>
          <div>
            <button
              type="button"
              className="btn d-flex align-items-center profile-button"
              onClick={handleSignOut}
            >
              <i className="fa-solid fa-sign-out-alt me-2"></i>Logout
            </button>
          </div>
        </div>
      </div>
      <div className="flex-grow-1 p-3 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Profile;
