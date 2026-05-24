import { useState } from "react";

function Users() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "COORDINATOR" });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addUser = () => {
    if (!form.name || !form.email) {
      setMessage("Name and email are required.");
      return;
    }

    setUsers((current) => [
      ...current,
      { id: current.length + 1, name: form.name, email: form.email, role: form.role, active: true },
    ]);
    setForm({ name: "", email: "", password: "", role: "COORDINATOR" });
    setMessage("User added successfully.");
  };

  return (
    <main className="page page-users">
      <section className="card">
        <h2>Users</h2>
        <div className="grid2">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
          <select name="role" value={form.role} onChange={handleChange}>
            <option>COORDINATOR</option>
            <option>FINANCE</option>
            <option>FELLOW</option>
            <option>AUDITOR</option>
          </select>
        </div>
        <div className="row">
          <button type="button" onClick={addUser}>Add User</button>
          <button type="button" onClick={() => setUsers([])}>Clear Users</button>
        </div>
        {message && <div className="form-note">{message}</div>}
      </section>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Users;
