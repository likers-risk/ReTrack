import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProductView = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockMessages, setLowStockMessages] = useState([]);

  const [isVisible, setIsVisible] = useState(false);

  const navigate = useNavigate();

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const fetchProducts = async () => {
    try {
      const authToken = localStorage.getItem("authToken");

      const response = await fetch("http://127.0.0.1:8000/api/products", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async (term) => {
    const authToken = localStorage.getItem("authToken");
    if (!term.trim()) {
      fetchProducts();
      return;
    }

    try {
      setIsSearching(true);
      setError("");
      const response = await fetch(
        `http://127.0.0.1:8000/api/search-product?query=${encodeURIComponent(
          term
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to search products");

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    term.trim() ? searchProducts(term) : fetchProducts();
  };

  const handleAddToCart = (product) => {
    setCartItems((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const deleteProduct = async (productId) => {
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete product");

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const buyProductsInCart = async () => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      setError("Authentication token missing. Please log in.");
      navigate("/");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const payload = {
      cart_items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to purchase products.");
      }

      setIsSuccess(true);
      setError("");
      setCartItems([]);
      fetchProducts();

      if (data.low_stock_notifications?.length) {
        setLowStockMessages(data.low_stock_notifications);
        setShowLowStockModal(true);
      }

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const newQuantity = Math.max(1, parseInt(value) || 1);
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevCart) =>
      prevCart.filter((item) => item.id !== productId)
    );
  };

  const updateProduct = async (product) => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      setError("Authentication required.");
      navigate("/");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("product_name", product.product_name || "");
      formData.append("category_name", product.category_name || "");
      formData.append("description", product.description || "");
      formData.append("price", product.price || 0);
      formData.append("cost", product.cost || 0);
      formData.append("stocks[quantity]", product.stocks?.quantity || 0);
      formData.append("expiration_date", product.expiration_date || "");

      if (product.imageFile) {
        formData.append("image", product.imageFile);
      }

      formData.append("_method", "PUT");

      const response = await fetch(
        `http://127.0.0.1:8000/api/products/${product.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update product");
      }

      const updatedData = await response.json();

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? updatedData.product ?? updatedData : p
        )
      );

      setIsSuccess(true);
      setError("");
      setIsLoading(false);
      setIsVisible(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVisible(false);
      setShowUpdateModal(false);
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const FullScreenLoader = ({ message = "Loading..." }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#fff",
        backdropFilter: "blur(5px)",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="spinner-border text-light"
        role="status"
        style={{ width: "4rem", height: "4rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 fw-semibold">{message}</p>
    </div>
  );

  if (isLoading) return <FullScreenLoader message="Loading products.." />;

  return (
    <div className="container-fluid py-4 bg-white rounded">
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
      {isSuccess && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="successTitle"
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
                <p id="successDesc">Successfully Purchase.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLowStockModal && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title fw-bold text-dark">
                  ⚠️ Low Stock Notice
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLowStockModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ul>
                  {lowStockMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLowStockModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-9">
          <h2 className="mb-4 text-center">Products</h2>
          <div className="mb-5" style={{ width: "400px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {(isLoading || isSearching) && (
            <div className="flex justify-center items-center py-5 text-lg text-blue-500">
              <h4 className="text-center">Loading....</h4>
            </div>
          )}

          {!isLoading && !isSearching && products.length === 0 && !error && (
            <div className="text-center py-5">
              <h4>No products found</h4>
            </div>
          )}

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {products.map((p) => (
              <div className="col" key={p.id}>
                <div
                  className="card h-100 shadow-sm border-0 rounded-3 cursor-pointer"
                  onClick={() => handleAddToCart(p)}
                  style={{ cursor: "pointer" }}
                >
                  {p.image ? (
                    <img
                      src={`http://127.0.0.1:8000/storage/${p.image}`}
                      className="card-img-top"
                      alt={p.product_name}
                      style={{ height: "160px", objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: "160px" }}
                    >
                      No image
                    </div>
                  )}

                  <div className="card-body text-center">
                    <h6 className="card-title fw-bold">{p.product_name}</h6>
                    <p className="text-muted small mb-1">{p.description}</p>
                    <p className="fw-semibold">₱{p.price}</p>
                    <p className="text-muted small">
                      Stock: {p.stocks?.quantity}
                    </p>
                    <p className="text-muted small mb-1">
                      Expiration Date: {p.expiration_date}
                    </p>
                  </div>

                  <div className="card-footer d-flex justify-content-between align-items-center bg-white">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                        setShowUpdateModal(true);
                      }}
                    >
                      Update
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(p.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-3 border-start">
          <h4>🛒 Cart ({cartItems.length})</h4>
          {cartItems.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <ul className="list-group mb-3">
              {cartItems.map((item) => (
                <li key={item.id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span>{item.product_name}</span>
                    <span>₱{item.price * item.quantity}</span>
                  </div>
                  <div className="d-flex align-items-center mt-2">
                    <span className="me-2">Quantity:</span>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm me-2"
                      style={{ width: "60px" }}
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                    />
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {cartItems.length > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Total:</h5>
                <h5 className="mb-0 text-black fw-bold">
                  ₱{totalPrice.toFixed(2)}
                </h5>
              </div>
              <button
                className="btn btn-primary w-100"
                onClick={buyProductsInCart}
              >
                Buy Now
              </button>
            </>
          )}
        </div>
      </div>

      {showUpdateModal && selectedProduct && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Product</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUpdateModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Product Name"
                  value={selectedProduct.product_name || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                />

                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Category"
                  value={selectedProduct.category_name || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      category_name: e.target.value,
                    }))
                  }
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={selectedProduct.description || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Price"
                  value={selectedProduct.price ?? ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Cost"
                  value={selectedProduct.cost ?? ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      cost: Number(e.target.value),
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Quantity"
                  value={selectedProduct.stocks?.quantity ?? 0}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      stocks: {
                        ...prev.stocks,
                        quantity: Number(e.target.value),
                      },
                    }))
                  }
                />

                <input
                  type="date"
                  className="form-control mb-2"
                  value={selectedProduct.expiration_date || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      expiration_date: e.target.value,
                    }))
                  }
                />

                <input
                  type="file"
                  className="form-control mb-2"
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      imageFile: e.target.files[0],
                    }))
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateProduct(selectedProduct)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;
