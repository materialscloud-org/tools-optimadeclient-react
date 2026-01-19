import React, { useState, useEffect } from "react";

import { textNormal } from "../../../../styles/textStyles";
import { baseButtonStyle } from "../../../../styles/buttonStyles";
import { containerStyle } from "../../../../styles/containerStyles";

export function QueryTextBox({
  value,
  onChange,
  placeholder = "Enter OPTIMADE filter…",
  onSubmit,
  loading = false,
}) {
  return (
    <div className={textNormal}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${containerStyle} border-gray-300! bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 `}
        />
        <button
          type="submit"
          disabled={loading}
          className={`${baseButtonStyle} disabled:opacity-50`}
        >
          {loading ? "Loading…" : "Query"}
        </button>
      </form>
    </div>
  );
}
