import { useState, useEffect } from "react";

export function SimpleDropDown({
  options = [],
  value,
  onChange,
  loading = false,
  placeholder = "-- Select --",
  width = "w-72",
}) {
  const [selectedValue, setSelectedValue] = useState(
    value || options[0]?.value || ""
  );

  // Update selected value when options change
  useEffect(() => {
    if (options.length > 0 && !value) {
      setSelectedValue(options[0].value);
      if (onChange) onChange(options[0]);
    }
  }, [options, value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setSelectedValue(val);
    const chosen = options.find((o) => o.value === val);
    if (onChange && chosen) onChange(chosen);
  };

  return (
    <div className={`relative ${width}`}>
      <select
        value={selectedValue}
        onChange={handleChange}
        disabled={loading || options.length === 0}
        className="w-full border-2 border-slate-300 bg-slate-200 py-2 px-3 rounded shadow hover:cursor-pointer hover:bg-slate-300"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-t-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
