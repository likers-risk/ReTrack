import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import BarcodeScanner from "./BarcodeScanner";
import ImagePicker from "./ImagePicker";
import { apiFetch, peso } from "../api";

const AddItems = () => {
  const [product_name, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [category_name, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [autoPrice, setAutoPrice] = useState(false);
  const [markup, setMarkup] = useState(null);
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

  // Pricing formula from Settings, for the suggested price.
  useEffect(() => {
    apiFetch("/settings")
      .then(({ ok, data }) => ok && setMarkup(Number(data.settings.markup_percent)))
      .catch(() => {});
  }, []);

  const suggestedPrice =
    markup !== null && cost !== "" ? Math.round(Number(cost) * (1 + markup / 100) * 100) / 100 : null;

  const handleCameraScan = useCallback((code) => {
    setBarcode(code);
    setShowScanner(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("product_name", product_name);
    formData.append("barcode", barcode.trim());
    formData.append("category_name", category_name);
    formData.append("description", description);
    formData.append("supplier", supplier.trim());
    formData.append("auto_price", autoPrice ? "1" : "0");
    if (!autoPrice) formData.append("price", price);
    formData.append("cost", cost);
    formData.append("quantity", quantity);
    formData.append("expiration_date", expiration_date);
    if (image) formData.append("image", image);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (response.ok) {
        setIsVisible(true);
        setProductName("");
        setBarcode("");
        setCategory("");
        setDescription("");
        setSupplier("");
        setAutoPrice(false);
        setPrice("");
        setCost("");
        setQuantity("");
        setExpiration("");
        setImage(null);
        setClick(true);

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const errorData = await response.json();
        setError(
          (errorData.errors &&
            Object.values(errorData.errors).flat().join(" ")) ||
            errorData.message ||
            "Failed to add product."
        );
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
                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-barcode"></i>
                    </span>
                    <input
                      type="text"
                      id="barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        // A USB scanner types the code then presses Enter.
                        // Don't submit the form; jump to the next box instead.
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document.getElementById("product_name")?.focus();
                        }
                      }}
                      placeholder="Barcode (scan or type, optional)"
                      className="form-control text-center"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowScanner(true)}
                      title="Scan with camera"
                    >
                      <i className="fa-solid fa-camera"></i>
                    </button>
                  </div>
                </div>
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
                  <input
                    type="text"
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Supplier (optional)"
                    className="form-control text-center"
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

                <div className="col-sm-6 col-md-3 d-flex flex-column justify-content-end">
                  <label htmlFor="cost" className="form-label small fw-semibold mb-1">
                    Cost (₱)
                  </label>
                  <input
                    type="number"
                    id="cost"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Cost"
                    className="form-control text-center"
                    required
                  />
                </div>

                <div className="col-sm-6 col-md-3 d-flex flex-column justify-content-end">
                  <label htmlFor="price" className="form-label small fw-semibold mb-1">
                    Selling price (₱)
                  </label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    value={autoPrice ? suggestedPrice ?? "" : price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Selling price"
                    className="form-control text-center"
                    disabled={autoPrice}
                    required={!autoPrice}
                  />
                </div>

                <div className="col-sm-6 col-md-3 d-flex flex-column justify-content-end">
                  <label htmlFor="quantity" className="form-label small fw-semibold mb-1">
                    Quantity
                  </label>
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

                <div className="col-sm-6 col-md-3 d-flex flex-column justify-content-end">
                  <label htmlFor="expiration_date" className="form-label small fw-semibold mb-1">
                    Expiration date (optional)
                  </label>
                  <input
                    type="date"
                    id="expiration_date"
                    title="Leave empty if the product doesn't expire"
                    value={expiration_date}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="form-control text-center"
                  />
                </div>

                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="auto_price"
                      checked={autoPrice}
                      onChange={(e) => setAutoPrice(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="auto_price">
                      Automatic price (cost + {markup ?? "…"}% markup from Settings)
                    </label>
                  </div>
                  {suggestedPrice !== null && (
                    <small className="text-muted d-flex align-items-center gap-2">
                      Suggested retail price: <strong>{peso(suggestedPrice)}</strong>
                      {!autoPrice && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => setPrice(String(suggestedPrice))}
                        >
                          Use it
                        </button>
                      )}
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Product Photo (optional):
                  </label>
                  <ImagePicker value={image} onChange={setImage} />
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
            {showScanner && (
              <BarcodeScanner
                onDetected={handleCameraScan}
                onClose={() => setShowScanner(false)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItems;
