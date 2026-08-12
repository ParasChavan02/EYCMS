import { useState } from "react";

function Transactions() {
  const [mode, setMode] = useState("guided");
  const [filters, setFilters] = useState({ project: "", head: "", fromDate: "", toDate: "" });
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("Sample transaction");
  const [lines, setLines] = useState([
    { account: "101", project: "", head: "", entry: "DEBIT", amount: 0 },
    { account: "201", project: "", head: "", entry: "CREDIT", amount: 0 },
  ]);
  const [transactions, setTransactions] = useState([]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const addLine = () => {
    setLines((current) => [...current, { account: "", project: "", head: "", entry: "DEBIT", amount: 0 }]);
  };

  const updateLine = (index, field, value) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const saveTransaction = () => {
    setTransactions((current) => [
      ...current,
      { id: current.length + 1, date: txnDate, narration, reference: `REF-${current.length + 1}` },
    ]);
  };

  return (
    <main className="page page-transactions">
      <section className="card">
        <h2>Transactions</h2>
        <div className="row filter-row">
          <select name="project" value={filters.project} onChange={handleFilterChange}>
            <option value="">All Projects</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <select name="head" value={filters.head} onChange={handleFilterChange}>
            <option value="">All Heads</option>
            <option value="10">10</option>
          </select>
          <input name="fromDate" type="date" value={filters.fromDate} onChange={handleFilterChange} />
          <input name="toDate" type="date" value={filters.toDate} onChange={handleFilterChange} />
          <button type="button" onClick={() => {}}>Apply Filters</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Narration</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td>{txn.id}</td>
                <td>{txn.date}</td>
                <td>{txn.narration}</td>
                <td>{txn.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="row tabs-row">
          <button type="button" className={mode === "guided" ? "active" : ""} onClick={() => setMode("guided")}>Guided</button>
          <button type="button" className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual Journal Entry</button>
        </div>

        <div className="row">
          <input type="date" value={txnDate} onChange={(event) => setTxnDate(event.target.value)} />
          <input value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Narration" />
        </div>

        {mode === "guided" ? (
          <div className="subview">
            <div className="grid2">
              <select>
                <option value="">Select transaction type</option>
                <option value="type1">Type 1</option>
              </select>
              <input type="number" placeholder="Amount" />
              <input type="number" placeholder="Project ID (optional)" />
              <input type="number" placeholder="Budget Head ID (optional)" />
            </div>
          </div>
        ) : (
          <div className="subview">
            <table>
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Project ID</th>
                  <th>Budget Head ID</th>
                  <th>Entry</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td><input value={line.account} onChange={(event) => updateLine(index, "account", event.target.value)} /></td>
                    <td><input value={line.project} onChange={(event) => updateLine(index, "project", event.target.value)} /></td>
                    <td><input value={line.head} onChange={(event) => updateLine(index, "head", event.target.value)} /></td>
                    <td>
                      <select value={line.entry} onChange={(event) => updateLine(index, "entry", event.target.value)}>
                        <option>DEBIT</option>
                        <option>CREDIT</option>
                      </select>
                    </td>
                    <td><input type="number" value={line.amount} onChange={(event) => updateLine(index, "amount", Number(event.target.value))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={addLine}>Add Line</button>
          </div>
        )}

        <div className="row actions-row">
          <button type="button" onClick={() => {}}>Check Budget Warning</button>
          <button type="button" onClick={saveTransaction}>Post Transaction</button>
        </div>
      </section>
    </main>
  );
}

export default Transactions;
