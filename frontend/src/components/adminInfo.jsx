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
      setError("Authentication token not found. Redirecting to login.");
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

      const data = await response.json();
      console.log("Image uploaded successfully:", data);
      setError("");
      setSuccess(true); 

      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 3000);

    } catch (err) {
      setError(err.message || "An error occurred during upload.");
      setSuccess(false);
    }
  };

  return (
    <div className="d-flex flex-column bg-white p-2">
      {success && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="successTitle"
          aria-hidden={!success}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <h5
                  className="modal-title fs-4 fw-bold text-success"
                  id="successTitle"
                >
                  Success!
                </h5>
              </div>
              <div className="modal-body text-center pt-2">
                <p id="successDesc">Updated Profile Successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {error && <p className="text-danger text-center mt-3">{error}</p>}

      <div className="form">
        <form onSubmit={handleImageSubmit}>
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
      </div>

      <div className="d-grid gap-2 mt-4">
        <button
          className="btn btn-lg text-white"
          style={{ background: "darkblue" }}
        >
          {/* Link should be outside the button element */}
          <Link to="/register" className="text-decoration-none text-white">
            Register
          </Link>
        </button>
      </div>
    </div>
  );
};

export default AdminInformation;