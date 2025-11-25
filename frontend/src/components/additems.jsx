import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddItems = () => {
  const [product_name, setProductName] = useState("");
  const [category_name, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiration_date, setExpiration] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [click, setClick] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("product_name", product_name);
    formData.append("category_name", category_name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("cost", cost);
    formData.append("quantity", quantity);
    formData.append("expiration_date", expiration_date);
    if (image) formData.append("image", image);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("http://127.0.0.1:8000/api/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (response.ok) {
        setIsVisible(true);
        setProductName("");
        setCategory("");
        setDescription("");
        setPrice("");
        setCost("");
        setQuantity("");
        setExpiration("");
        setImage(null);
        setClick(true);

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add product.");
      }
    } catch {
      setError("Failed to connect to the server. Please check your network.");
    }
  };

  const FullScreenLoader = ({ message = "Loading..." }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#fff",
      }}
    >
      <div
        className="spinner-border text-light"
        role="status"
        style={{ width: "3rem", height: "3rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 fw-semibold">{message}</p>
    </div>
  );

  if (loading) return <FullScreenLoader message="Loading..." />;

  return (
    <>
      {isVisible && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <h5 className="modal-title fs-4 fw-bold text-success">
                  Success!
                </h5>
              </div>
              <div className="modal-body text-center pt-2">
                <p>Item added successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container py-4 px-3">
        <div
          className="card shadow-lg border-0 rounded-4 mx-auto"
          style={{ maxWidth: "700px" }}
        >
          <div className="card-body p-4">
            <h4 className="text-center mb-4 fw-bold">Add New Product</h4>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    id="product_name"
                    value={product_name}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Product Name"
                    className="form-control text-center"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="text"
                    id="category"
                    value={category_name}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category"
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-12">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="form-control text-center"
                    rows="2"
                  />
                </div>

                <div className="col-sm-6 col-md-3">
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price"
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-sm-6 col-md-3">
                  <input
                    type="number"
                    id="cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Cost"
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-sm-6 col-md-3">
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-sm-6 col-md-3">
                  <input
                    type="date"
                    id="expiration_date"
                    value={expiration_date}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="image" className="form-label fw-semibold">
                    Upload Image:
                  </label>
                  <input
                    type="file"
                    id="image"
                    onChange={(e) => setImage(e.target.files[0])}
                    accept="image/*"
                    className="form-control"
                  />
                </div>
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary w-100 mt-4 fw-semibold"
                disabled={click}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItems;
