import React from "react";

// Standard vendor credit shown on auth screens across all Banoyah products.
export default function PoweredBy({ className = "" }) {
  return (
    <p className={`text-center text-xs text-faint ${className}`}>
      Powered by <span className="font-semibold text-muted">Banoyah Technologies</span> © {new Date().getFullYear()}
    </p>
  );
}
