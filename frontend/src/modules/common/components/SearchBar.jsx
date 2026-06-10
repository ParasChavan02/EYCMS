import React from "react";
import { Search } from "lucide-react";

function SearchBar({ value, onChange, placeholder = "Search...", onSubmit, className = "" }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <form className={`search-form ${className}`} onSubmit={handleSubmit}>
      <Search size={16} className="search-leading-icon" />
      <input
        type="text"
        placeholder={placeholder}
        className="search-input"
        value={value}
        onChange={onChange}
      />
    </form>
  );
}

export default SearchBar;
