import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserProfile from "../assets/userprofile.png";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const storedRole = localStorage.getItem("role");
      setUserRole(storedRole);

      if (!authToken || !userId) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/user-profile/${userId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user data.");

        const data = await response.json();
        setUser(data.user);
        setUsername(data.user.username || "");
        setEmail(data.user.email || "");
        setRole(data.user.role || "");
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, [navigate]);

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
      setSaving(true);

      const response = await fetch("http://127.0.0.1:8000/api/edit-profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Profile update failed.");
      }

      setSuccess(true);
      setError("");

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fw-semibold">Saving changes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fw-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#1f2937" }}>
            My Profile
          </h2>
          <p className="text-muted mb-0">
            Manage your account settings and preferences
          </p>
        </div>
        <Link
          to="/dashboard"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          style={{ borderRadius: "8px" }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back to Dashboard
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="fa-solid fa-circle-check me-2"></i>
          Profile updated successfully!
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess(false)}
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column - Profile Card */}
        <div className="col-lg-4">
          <div
            className="card shadow-sm border-0"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body text-center p-4">
              {/* Profile Image */}
              <div className="position-relative d-inline-block mb-3">
                <img
                  src={
                    image
                      ? URL.createObjectURL(image)
                      : user.image
                      ? `http://127.0.0.1:8000/storage/${user.image}`
                      : UserProfile
                  }
                  alt="Profile"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #4f46e5",
                  }}
                />
                <label
                  htmlFor="imageUpload"
                  className="position-absolute bottom-0 end-0 btn btn-primary btn-sm rounded-circle"
                  style={{ width: "36px", height: "36px", padding: "0" }}
                  title="Change photo"
                >
                  <i className="fa-solid fa-camera"></i>
                </label>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              <h4 className="fw-bold mb-1">{username}</h4>
              <span
                className="badge mb-3"
                style={{
                  backgroundColor: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: "14px",
                  padding: "6px 16px",
                  borderRadius: "20px",
                }}
              >
                {role}
              </span>

              {/* Quick Info */}
              <div className="text-start mt-4">
                <div
                  className="d-flex align-items-center mb-2 p-2"
                  style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-envelope text-muted me-3"></i>
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <span className="fw-semibold">{email}</span>
                  </div>
                </div>
                <div
                  className="d-flex align-items-center mb-2 p-2"
                  style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                >
                  <i className="fa-solid fa-calendar-days text-muted me-3"></i>
                  <div>
                    <small className="text-muted d-block">Joined</small>
                    <span className="fw-semibold">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {user.last_login && (
                  <div
                    className="d-flex align-items-center p-2"
                    style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                  >
                    <i className="fa-solid fa-clock text-muted me-3"></i>
                    <div>
                      <small className="text-muted d-block">Last Login</small>
                      <span className="fw-semibold">
                        {new Date(user.last_login).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions for Admin */}
              {userRole === "Admin" && (
                <div className="mt-4">
                  <Link
                    to="/register"
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: "8px", padding: "12px" }}
                  >
                    <i className="fa-solid fa-user-plus"></i>
                    Register New User
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="col-lg-8">
          <div
            className="card shadow-sm border-0"
            style={{ borderRadius: "12px" }}
          >
            <div className="card-body p-4">
              {/* Tabs */}
              <ul className="nav nav-pills mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "profile" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("profile")}
                    style={{
                      borderRadius: "8px",
                      backgroundColor:
                        activeTab === "profile" ? "#4f46e5" : "transparent",
                      color: activeTab === "profile" ? "white" : "#6b7280",
                      fontWeight: "500",
                    }}
                  >
                    <i className="fa-solid fa-user me-2"></i>
                    Profile Information
                  </button>
                </li>
                <li className="nav-item ms-2" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "security" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("security")}
                    style={{
                      borderRadius: "8px",
                      backgroundColor:
                        activeTab === "security" ? "#4f46e5" : "transparent",
                      color: activeTab === "security" ? "white" : "#6b7280",
                      fontWeight: "500",
                    }}
                  >
                    <i className="fa-solid fa-lock me-2"></i>
                    Security
                  </button>
                </li>
              </ul>

              <form onSubmit={handleUpdateProfile}>
                {/* Profile Information Tab */}
                {activeTab === "profile" && (
                  <div>
                    <h5 className="fw-bold mb-3" style={{ color: "#1f2937" }}>
                      Edit Profile Information
                    </h5>

                    {/* Username */}
                    <div className="mb-4">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#374151" }}
                      >
                        <i className="fa-solid fa-user me-2 text-muted"></i>
                        Username
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ borderRadius: "8px", padding: "12px" }}
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#374151" }}
                      >
                        <i className="fa-solid fa-envelope me-2 text-muted"></i>
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ borderRadius: "8px", padding: "12px" }}
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Role */}
                    <div className="mb-4">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#374151" }}
                      >
                        <i className="fa-solid fa-briefcase me-2 text-muted"></i>
                        Role
                      </label>
                      <select
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ borderRadius: "8px", padding: "12px" }}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                        <option value="Super_Admin">Super Admin</option>
                        <option value="Owner">Owner</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div>
                    <h5 className="fw-bold mb-3" style={{ color: "#1f2937" }}>
                      Change Password
                    </h5>
                    <p className="text-muted mb-4">
                      Update your password to keep your account secure
                    </p>

                    {/* New Password */}
                    <div className="mb-4">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#374151" }}
                      >
                        <i className="fa-solid fa-key me-2 text-muted"></i>
                        New Password
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{
                            borderRadius: "8px 0 0 8px",
                            padding: "12px",
                          }}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ borderRadius: "0 8px 8px 0" }}
                        >
                          <i
                            className={`fa-solid ${
                              showPassword ? "fa-eye-slash" : "fa-eye"
                            }`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#374151" }}
                      >
                        <i className="fa-solid fa-lock me-2 text-muted"></i>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ borderRadius: "8px", padding: "12px" }}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      borderRadius: "8px",
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setUsername(user.username);
                      setEmail(user.email);
                      setRole(user.role);
                      setPassword("");
                      setConfirmPassword("");
                      setImage(null);
                    }}
                    style={{
                      borderRadius: "8px",
                      padding: "12px",
                      minWidth: "100px",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
