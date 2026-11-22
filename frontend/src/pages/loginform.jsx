import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/Retrack.png";
import { API_URL } from "../config";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [Token, setToken] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.Token);
        localStorage.setItem("username", data.User.username);
        localStorage.setItem("userId", data.User.id);
        localStorage.setItem("role", data.User.role);
        setToken(data.Token);
        setUsername(data.User.username);
        setMessage(data.message || "Login Successfully.");
        navigate("/dashboard");
      } else {
        const errorMessage =
          (data.errors && Object.values(data.errors).flat().join(" ")) ||
          data.message ||
          "An Unknown Error Occurred.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server. Please Try again.");
    }
  };

  return (
    <div
      className="d-flex"
      style={{ backgroundColor: "#3C467B", height: "100vh" }}
    >
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <img src={logo} alt="" className="img-fluid w-25" />
                  <h2
                    className="card-title text-uppercase fw-bold"
                    style={{ color: "darkblue" }}
                  >
                    LOGIN
                  </h2>
                </div>
                <form onSubmit={handleLogin}>
                  {error && (
                    <div
                      className="alert alert-danger text-center"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}
                  {message && (
                    <div
                      className="alert alert-success text-center"
                      role="alert"
                    >
                      {message}
                    </div>
                  )}
                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-user"></i>
                    </span>
                    <input
                      type="text"
                      id="username"
                      className="form-control"
                      value={username}
                      placeholder="Username"
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="mb-3 input-group">
                    <span className="input-group-text">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      value={password}
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-lg text-white"
                      style={{ background: "#263d81" }}
                    >
                      Login
                    </button>
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    <Link to="/retrieve">
                      <p>Forget Password?</p>
                    </Link>
                  </div>
                  <div className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup">Create one</Link>
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
