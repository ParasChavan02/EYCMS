import React from "react";
import { Link } from "react-router-dom";

function Breadcrumb({ items = [], className = "" }) {
  return (
    <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={`breadcrumb-item ${isLast ? "active" : ""}`}>
              {!isLast && item.path ? (
                <>
                  <Link to={item.path}>{item.label}</Link>
                  <span className="breadcrumb-separator">/</span>
                </>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
