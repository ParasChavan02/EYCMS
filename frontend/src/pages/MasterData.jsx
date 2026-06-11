import { useState } from "react";
import "../styles/masterdata.css";

function MasterData() {
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [heads, setHeads] = useState([]);
  const [form, setForm] = useState({ accountCode: "", accountName: "", accountType: "ASSET", projectCode: "", projectName: "", headCode: "", headName: "", headProjectId: "", headAmount: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addAccount = () => {
    if (!form.accountCode || !form.accountName) return;
    setAccounts((current) => [...current, { id: current.length + 1, code: form.accountCode, name: form.accountName, type: form.accountType }]);
    setForm((current) => ({ ...current, accountCode: "", accountName: "" }));
  };

  const addProject = () => {
    if (!form.projectCode || !form.projectName) return;
    setProjects((current) => [...current, { id: current.length + 1, code: form.projectCode, name: form.projectName }]);
    setForm((current) => ({ ...current, projectCode: "", projectName: "" }));
  };

  const addHead = () => {
    if (!form.headCode || !form.headName) return;
    setHeads((current) => [...current, { id: current.length + 1, code: form.headCode, name: form.headName, project: form.headProjectId || "N/A", sanctioned: form.headAmount || 0 }]);
    setForm((current) => ({ ...current, headCode: "", headName: "", headProjectId: "", headAmount: "" }));
  };

  return (
    <main className="page page-masterdata">
      <section className="card panel-grid">
        <div className="subcard">
          <h2>Accounts</h2>
          <div className="grid2">
            <input name="accountCode" value={form.accountCode} onChange={handleChange} placeholder="Code" />
            <input name="accountName" value={form.accountName} onChange={handleChange} placeholder="Name" />
            <select name="accountType" value={form.accountType} onChange={handleChange}>
              <option>ASSET</option>
              <option>LIABILITY</option>
              <option>EQUITY</option>
              <option>INCOME</option>
              <option>EXPENSE</option>
            </select>
          </div>
          <div className="row">
            <button type="button" onClick={addAccount}>Add Account</button>
            <button type="button" onClick={() => setAccounts([])}>Clear</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>{account.code}</td>
                  <td>{account.name}</td>
                  <td>{account.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="subcard">
          <h2>Projects</h2>
          <div className="grid2">
            <input name="projectCode" value={form.projectCode} onChange={handleChange} placeholder="Code" />
            <input name="projectName" value={form.projectName} onChange={handleChange} placeholder="Name" />
          </div>
          <div className="row">
            <button type="button" onClick={addProject}>Add Project</button>
            <button type="button" onClick={() => setProjects([])}>Clear</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.id}</td>
                  <td>{project.code}</td>
                  <td>{project.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="subcard">
          <h2>Budget Heads</h2>
          <div className="grid2">
            <input name="headCode" value={form.headCode} onChange={handleChange} placeholder="Code" />
            <input name="headName" value={form.headName} onChange={handleChange} placeholder="Name" />
            <input name="headProjectId" type="number" name="headProjectId" value={form.headProjectId} onChange={handleChange} placeholder="Project ID (optional)" />
            <input name="headAmount" type="number" value={form.headAmount} onChange={handleChange} step="0.01" placeholder="Sanctioned amount" />
          </div>
          <div className="row">
            <button type="button" onClick={addHead}>Add Head</button>
            <button type="button" onClick={() => setHeads([])}>Clear</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Project</th>
                <th>Sanctioned</th>
              </tr>
            </thead>
            <tbody>
              {heads.map((head) => (
                <tr key={head.id}>
                  <td>{head.id}</td>
                  <td>{head.code}</td>
                  <td>{head.name}</td>
                  <td>{head.project}</td>
                  <td>{head.sanctioned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default MasterData;
