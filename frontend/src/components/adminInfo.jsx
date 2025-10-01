import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const AdminInformation = () => {
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleImageSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      setError("Please select an image to upload.");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication token not found. Redirecting to login...");
      setTimeout(() => navigate("/"), 1500);
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/edit-profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Image upload failed.");
      }

      await response.json();
      setError("");
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2500);
    } catch (err) {
      setError(err.message || "An error occurred during upload.");
      setSuccess(false);
    }
  };

  return (
    <div className="d-flex flex-column bg-white p-3 rounded shadow-sm">
      {/* ✅ Success Modal */}
      {success && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="successTitle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header justify-content-center border-0">
                <h5 className="modal-title fs-4 fw-bold text-success">
                  ✅ Success!
                </h5>
              </div>
              <div className="modal-body text-center">
                <p>Updated Profile Successfully.</p>
                <button
                  className="btn btn-outline-success"
                  onClick={() => setSuccess(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ❌ Error Message */}
      {error && <p className="text-danger text-center mt-2">{error}</p>}

      {/* 📤 Upload Profile Image */}
      <form onSubmit={handleImageSubmit} className="mt-2">
        <label className="fw-bold">Upload Admin Profile Image</label>
        <input
          type="file"
          id="image"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
          className="form-control mb-3"
        />
        <button type="submit" className="btn btn-primary w-100">
          Upload Image
        </button>
      </form>

      {/* 📊 Store Inventory Quick Actions (Only Reports + Orders) */}
      <div className="mt-4">
        <h5 className="fw-bold">Inventory Management</h5>
        <div className="d-grid gap-2 mt-2">
          <Link to="/dashboard/orders" className="btn btn-secondary">
            🛒 Manage Orders
          </Link>
        </div>
      </div>

      {/* ➕ Register New Admin/Staff */}
      <div className="d-grid gap-2 mt-4">
        <Link to="/register" className="btn btn-lg text-white" style={{ background: "darkblue" }}>
          👤 Register New Admin/Staff
        </Link>
      </div>
    </div>
  );
};

export default AdminInformation;
