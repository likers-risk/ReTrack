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

  
  useEffect(() => {
    const fetchSales = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("Unauthorized. Please login.");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/sales", {
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
        (s) => new Date(s.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString()
      )
    : sales;

 
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

  return (
    <div className="container mt-3" style={{backgroundColor:"white"}}>
      <h3 className="mb-3">💰 Sales Dashboard</h3>

      {loading && <p>Loading sales...</p>}
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
                ₱ {sales
                  .filter(
                    (s) =>
                      new Date(s.date).toLocaleDateString() ===
                      new Date().toLocaleDateString()
                  )
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="card p-3 flex-fill bg-warning text-dark">
              <h5>Number of Orders</h5>
              <p className="fs-4">{sales.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-3 d-flex align-items-center gap-2">
            <label htmlFor="filterDate">Filter by date:</label>
            <input
              type="date"
              id="filterDate"
              className="form-control w-auto"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={() => setFilterDate("")}>
              Reset
            </button>
            <button className="btn btn-outline-success ms-auto" onClick={exportCSV}>
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
                    backgroundColor: "rgba(75,192,192,0.2)",
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

          {/* Sales table */}
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
                {filteredSales.length > 0 ? (
                  filteredSales.map((s) => (
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
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
