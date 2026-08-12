function SearchFilterBar({ onSearch, onFilter, searchPlaceholder = "Search..." }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderRadius: "12px",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        placeholder={searchPlaceholder}
        onChange={(e) => onSearch && onSearch(e.target.value)}
        style={{
          flex: 1,
          minWidth: "200px",
          padding: "10px 14px",
          border: "1px solid #dbe2ea",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      />
      <select
        onChange={(e) => onFilter && onFilter(e.target.value)}
        style={{
          padding: "10px 14px",
          border: "1px solid #dbe2ea",
          borderRadius: "8px",
          backgroundColor: "white",
          cursor: "pointer",
          fontSize: "14px",
          minWidth: "150px",
        }}
      >
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  );
}

export default SearchFilterBar;
