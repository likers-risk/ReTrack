import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import UserProfile from "../assets/userprofile.png";
import '../CSS/User.css';
import '../CSS/Profile.css'


const Profile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
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
  const handleAdminInfo = () => navigate("profile");
  const handleEditProfile = () => navigate("profile");
 
  const handleAddProduct = () => navigate("/dashboard/add-item");
  const handleViewStock = () => navigate("/dashboard/shopping");

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    document.body.style.backgroundColor = !darkMode ? "#2d2d2d" : "#fff";
    document.body.style.color = !darkMode ? "#fff" : "#000";
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="d-flex flex-row gap-5">
      <div
        className="d-flex flex-column justify-content-between p-3 sticky-top shadow"
        style={{ height: "100vh" }}
      >
        
        <div className="d-flex flex-column user-info p-2" onClick={handleAdminInfo}>
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
          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleEditProfile}
          >
            <i className="fa fa-user-edit me-2"></i>Edit Profile
          </button>

          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleReport}
          >
            <i className="fa fa-file-alt me-2"></i>Reports
          </button>

          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleNotification}
          >
            <i className="fa-solid fa-bell text-black me-2"></i>Notification
          </button>

          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleAddProduct}
          >
            <i className="fa fa-plus-circle me-2"></i>Add Product
          </button>

          <button
            className="btn d-flex align-items-center profile-button"
            onClick={handleViewStock}
          >
            <i className="fa fa-boxes me-2"></i>View Stock
          </button>

          <button
            className="btn d-flex align-items-center profile-button"
            onClick={toggleTheme}
          >
            <i className="fa fa-adjust me-2"></i>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            type="button"
            className="btn d-flex align-items-center profile-button text-danger"
            onClick={handleSignOut}
          >
            <i className="fa-solid fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </div>

      <div
        className="flex-grow-1 p-3 overflow-auto"
        style={{ backgroundColor: "#3C467B" }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Profile;
