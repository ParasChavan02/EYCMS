import { useMemo, useState } from "react";
import "../styles/users.css";

function Users() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    role: "USER",
  });

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("ALL");

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Manas Pandya",
      email: "admin@eyuva.com",
      department: "Administration",
      role: "ADMIN",
      active: true,
    },
    {
      id: 2,
      name: "Purva Kalkute",
      email: "hr@eyuva.com",
      department: "HR",
      role: "USER",
      active: true,
    },
    {
      id: 3,
      name: "Paras Chavan",
      email: "finance@eyuva.com",
      department: "Finance",
      role: "USER",
      active: true,
    },
    {
      id: 4,
      name: "Rahul Sharma",
      email: "operations@eyuva.com",
      department: "Operations",
      role: "USER",
      active: true,
    },
  ]);

  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addUser = () => {

    setMessage("");

    if (
      !form.name ||
      !form.email ||
      !form.department
    ) {
      setMessage("Please fill all fields.");
      return;
    }

    const existingUser = users.find(
      (user) => user.email === form.email
    );

    if (existingUser) {
      setMessage("User already exists.");
      return;
    }
    const newUser = {
      id: users.length + 1,
      name: form.name,
      email: form.email,
      department: form.department,
      role: form.role,
      active: true,
    };
    setUsers((current) => [
      ...current,
      newUser,
    ]);

    setForm({
      name: "",
      email: "",
      department: "",
      role: "USER",
    });

    setMessage("User added successfully.");
  };

  const deleteUser = (id) => {

    setUsers((current) =>
      current.filter((user) => user.id !== id)
    );
  };

  const toggleStatus = (id) => {

    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              active: !user.active,
            }
          : user
      )
    );
  };

  const filteredUsers = useMemo(() => {

    return users.filter((user) => {

      const matchesSearch =
        user.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        user.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "ALL"
          ? true
          : user.role === roleFilter;

      return matchesSearch && matchesRole;

    });

  }, [users, search, roleFilter]);

  const stats = {
    total: users.length,

    active: users.filter(
      (u) => u.active
    ).length,

    admins: users.filter(
      (u) => u.role === "ADMIN"
    ).length,

    usersCount: users.filter(
      (u) => u.role === "USER"
    ).length,
  };

  return (
    <main className="page page-users">

      {/* HEADER */}

      <section className="users-header">

        <div>

          <h1>Users Management</h1>

          <p>
            Manage ERP users,
            departments, and access.
          </p>

        </div>

      </section>

      {/* STATS */}

      <section className="stats-grid">

        <div className="stats-card">
          <h3>Total Users</h3>
          <h2>{stats.total}</h2>
        </div>

        <div className="stats-card">
          <h3>Active Users</h3>
          <h2>{stats.active}</h2>
        </div>

        <div className="stats-card">
          <h3>Admins</h3>
          <h2>{stats.admins}</h2>
        </div>

        <div className="stats-card">
          <h3>Users</h3>
          <h2>{stats.usersCount}</h2>
        </div>

      </section>

      {/* ADD USER FORM */}

      <section className="card">

        <div className="section-title">
          <h2>Add New User</h2>
        </div>

        <div className="grid2">

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
          />

          {/* DEPARTMENT */}

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
          >

            <option value="">
              Select Department
            </option>

            <option value="Finance">
              Finance
            </option>

            <option value="Operations">
              Operations
            </option>

            <option value="Audit">
              Audit
            </option>

            <option value="HR">
              HR
            </option>

            <option value="Administration">
              Administration
            </option>

          </select>

          {/* ROLE */}

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >

            <option value="ADMIN">
              ADMIN
            </option>

            <option value="USER">
              USER
            </option>

          </select>

        </div>

        <div className="row">

          <button
            type="button"
            onClick={addUser}
          >
            Add User
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => setUsers([])}
          >
            Clear Users
          </button>

        </div>

        {message && (
          <div className="form-note">
            {message}
          </div>
        )}

      </section>

      {/* FILTERS */}

      <section className="card">

        <div className="table-actions">

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >

            <option value="ALL">
              All Roles
            </option>

            <option value="ADMIN">
              ADMIN
            </option>

            <option value="USER">
              USER
            </option>

          </select>

        </div>

        {/* USERS TABLE */}

        <div className="table-wrapper">

          <table className="users-table">

            <thead>

              <tr>

                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {filteredUsers.length > 0 ? (

                filteredUsers.map((user) => (

                  <tr key={user.id}>

                    <td>{user.id}</td>

                    <td>{user.name}</td>

                    <td>{user.email}</td>

                    <td>{user.department}</td>

                    <td>

                      <span className="role-badge">
                        {user.role}
                      </span>

                    </td>

                    <td>

                      <span
                        className={
                          user.active
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {user.active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>

                    <td>

                      <div className="action-buttons">

                        <button
                          className="small-btn"
                          onClick={() =>
                            toggleStatus(user.id)
                          }
                        >
                          {user.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          className="small-btn danger-btn"
                          onClick={() =>
                            deleteUser(user.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
export default Users;
