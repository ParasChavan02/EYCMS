import { useState } from "react";

function Reconciliation() {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [statements, setStatements] = useState([]);
  const [preview, setPreview] = useState("");
  const [rawRows, setRawRows] = useState('[{"statement_date":"2026-01-01","description":"Sample debit","debit":100,"credit":0,"closing_balance":900}]');

  const addBank = () => {
    if (!bankName || !accountNumber) return;
    setPreview(`Bank added: ${bankName} (${accountNumber})`);
  };

  const importStatementRows = () => {
    try {
      const rows = JSON.parse(rawRows);
      setStatements(rows.map((row, index) => ({ id: index + 1, ...row, reconciled: false })));
      setPreview(`Imported ${rows.length} rows`);
    } catch (error) {
      setPreview("Invalid JSON statement data.");
    }
  };

  return (
    <main className="page page-reconciliation">
      <section className="card">
        <h2>Bank Reconciliation</h2>
        <div className="row">
          <input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank name" />
          <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Masked account number" />
          <button type="button" onClick={addBank}>Add Bank</button>
        </div>

        <div className="row">
          <textarea value={rawRows} onChange={(event) => setRawRows(event.target.value)} rows={4} />
          <button type="button" onClick={importStatementRows}>Import Statement JSON</button>
        </div>

        <div className="row">
          <input type="file" disabled />
          <select>
            <option value="auto">Auto detect</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="mt940">MT940</option>
            <option value="camt053">CAMT.053 XML</option>
          </select>
          <button type="button" disabled>Preview Parsed Rows</button>
          <button type="button" disabled>Import Parsed Rows</button>
        </div>

        <div className="form-note">{preview}</div>
      </section>

      <section className="card">
        <h3>Statement rows</h3>
        <table>
          <thead>
            <tr>
              <th>Line ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Reconciled</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.statement_date}</td>
                <td>{row.description}</td>
                <td>{row.debit}</td>
                <td>{row.credit}</td>
                <td>{row.reconciled ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Reconciliation;
