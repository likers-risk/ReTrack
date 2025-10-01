import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserProfile from "../assets/userprofile.png";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");

      if (!authToken || !userId) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/user-profile/${userId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data.");
        const data = await response.json();
        setUser(data.user);
        setUsername(data.user.username);
        setEmail(data.user.email);
        setRole(data.user.role);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Unauthorized. Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("role", role);
    if (image) formData.append("image", image);
    if (password) formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/edit-profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Profile update failed.");
      }

      setSuccess(true);
      setError("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="container mt-4">
      <h3 className="fw-bold mb-3">Edit Profile</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">Profile updated successfully!</div>}

      <form onSubmit={handleUpdateProfile} className="bg-white p-4 shadow rounded">
        {/* Profile Image */}
        <div className="mb-3 d-flex align-items-center gap-3">
          <img
            src={image ? URL.createObjectURL(image) : user.image ? `http://127.0.0.1:8000/storage/${user.image}` : UserProfile}
            alt="Profile"
            style={{ width: "80px", height: "80px", borderRadius: "50%" }}
          />
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        {/* Username */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Role */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Role</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Super_Admin">Super Admin</option>
          </select>
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold">New Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary w-100 fw-semibold">
          Save Changes
        </button>
      </form>

      {/* Last Login / Status */}
      <div className="mt-4 p-3 bg-light rounded shadow-sm">
        <p><strong>Last Login:</strong> {user.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}</p>
        <p><strong>Status:</strong> {user.is_active ? "Active ✅" : "Inactive ❌"}</p>
      </div>
    </div>
  );
};

export default EditProfile;
