function DataTable({ columns, data, actions = null, onAction = null }) {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "14px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#475569",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th
                style={{
                  padding: "14px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#475569",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #f1f5f9",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "14px",
                      color: "#1f2937",
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && onAction && (
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => onAction(action.key, row)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #dbe2ea",
                            backgroundColor: "white",
                            color: "#0f5aff",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#e0e7ff";
                            e.target.style.borderColor = "#c7d2fe";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "white";
                            e.target.style.borderColor = "#dbe2ea";
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontWeight: "500",
                }}
              >
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
