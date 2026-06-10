import React from "react";
import Input from "../../common/components/Input";

function AdminTokenField({ value, onChange }) {
  return (
    <div className="fade-in-field">
      <Input
        label="Admin Access Token *"
        name="adminToken"
        type="password"
        value={value}
        onChange={onChange}
        placeholder="Enter admin access token"
        showPasswordToggle
      />
    </div>
  );
}

export default AdminTokenField;
