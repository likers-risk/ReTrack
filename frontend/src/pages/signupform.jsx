import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Retrack.png";
import { API_URL } from "../config";


export default function Signup() {
  const [storeName, setStoreName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          store_name: storeName,
          username,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setStoreName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        if (data.can_login) setTimeout(() => navigate("/"), 1500);
      } else {
        setError(
          (data.errors && Object.values(data.errors).flat().join(" ")) ||
            data.message ||
            "Sign-up failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex"
      style={{ backgroundColor: "#3C467B", minHeight: "100vh" }}
    >
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <img src={logo} alt="ReTrack" className="img-fluid w-25" />
                  <h2
                    className="card-title text-uppercase fw-bold"
                    style={{ color: "darkblue" }}
                  >
                    Create Your Store
                  </h2>
                  <small className="text-muted">
                    You'll be the Admin. Add your staff after logging in.
                  </small>
                </div>

                {error && (
                  <div className="alert alert-danger text-center" role="alert">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="alert alert-success text-center" role="alert">
                    {message}
                  </div>
                )}

                <form onSubmit={handleSignup}>
                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-store"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Store name (e.g. Prince Store)"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-user"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password (at least 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-lg text-white"
                      style={{ background: "#263d81" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    Already have an account? <Link to="/">Log in</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
