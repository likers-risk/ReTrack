import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { API_URL } from "../config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [graphData, setGraphData] = useState({ labels: [], data: [] });

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("Unauthorized. Please login.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/sales`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch sales.");

        const data = await response.json();
        setSales(data.sales || []);
        prepareGraph(data.sales || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const prepareGraph = (salesData) => {
    const sorted = [...salesData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const labels = sorted.map((s) => new Date(s.date).toLocaleDateString());
    const data = sorted.map((s) => s.amount);

    setGraphData({ labels, data });
  };

  const filteredSales = filterDate
    ? sales.filter(
        (s) =>
          new Date(s.date).toLocaleDateString() ===
          new Date(filterDate).toLocaleDateString()
      )
    : sales;

  const displayedSales = showAll ? filteredSales : filteredSales.slice(0, 10);

  const exportCSV = () => {
    const csv = [
      ["ID", "Product", "Amount", "Date"],
      ...filteredSales.map((s) => [s.id, s.product, s.amount, s.date]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sales.csv";
    link.click();
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

  if (loading) return <FullScreenLoader message="Loading sales..." />;
  return (
    <div
      className="container mt-3 rounded"
      style={{ backgroundColor: "white" }}
    >
      <h3 className="mb-3">Sales Dashboard</h3>

      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          <div className="d-flex gap-3 mb-3 flex-wrap">
            <div className="card p-3 flex-fill bg-primary text-white">
              <h5>Total Sales</h5>
              <p className="fs-4">
                ₱ {sales.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="card p-3 flex-fill bg-success text-white">
              <h5>Today's Sales</h5>
              <p className="fs-4">
                ₱{" "}
                {sales
                  .filter(
                    (s) =>
                      new Date(s.date).toLocaleDateString() ===
                      new Date().toLocaleDateString()
                  )
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="card p-3 flex-fill bg-warning text-white">
              <h5>Item purchase</h5>
              <p className="fs-4">{sales.length}</p>
            </div>
          </div>

          <div className="mb-3 d-flex align-items-center gap-2">
            <label htmlFor="filterDate">Filter by date:</label>
            <input
              type="date"
              id="filterDate"
              className="form-control w-auto"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={() => setFilterDate("")}
            >
              Reset
            </button>
            <button
              className="btn btn-outline-success ms-auto"
              onClick={exportCSV}
            >
              Export CSV
            </button>
          </div>

          <div className="mb-4">
            <Line
              data={{
                labels: graphData.labels,
                datasets: [
                  {
                    label: "Sales Amount",
                    data: graphData.data,
                    borderColor: "rgba(75,192,192,1)",
                    backgroundColor: "rgba(33, 108, 194, 0.2)",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Sales Over Time" },
                },
              }}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayedSales.length > 0 ? (
                  displayedSales.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.product}</td>
                      <td>₱ {s.amount.toLocaleString()}</td>
                      <td>{new Date(s.date).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredSales.length > 10 && (
              <div className="text-center mt-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "See Less" : "See More"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
