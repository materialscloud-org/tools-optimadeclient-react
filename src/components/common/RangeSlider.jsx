import Slider from "@mui/material/Slider";

import { textNormal, textSmall } from "../../styles/textStyles";

const inputOverride = `w-12 text-center bg-transparent border-none outline-none p-0
  [&::-webkit-inner-spin-button]:appearance-none
  [&::-webkit-outer-spin-button]:appearance-none
  [-moz-appearance:textfield]`;

export default function RangeSlider({ title, value, onChange, min, max }) {
  const handleSliderChange = (_, newValue) => {
    onChange(newValue);
  };

  const handleInputChange = (index, raw) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;

    const next = [...value];

    if (index === 0) {
      next[0] = Math.min(Math.max(num, min), next[1]);
    } else {
      next[1] = Math.max(Math.min(num, max), next[0]);
    }

    onChange(next);
  };

  return (
    <div className={`${textNormal} p-2 pt-4`}>
      <label className="block mb-2">{title}</label>

      <div className="flex items-center space-x-3">
        <input
          type="number"
          value={value[0]}
          onChange={(e) => handleInputChange(0, e.target.value)}
          min={min}
          max={value[1]}
          className={inputOverride}
        />

        <Slider
          value={value}
          min={min}
          max={max}
          step={1}
          onChange={handleSliderChange}
          sx={{
            flex: 1,
            "& .MuiSlider-track": {
              backgroundColor: "#3b82f6", // blue-500
              border: "none",
              height: 8,
            },
          }}
        />

        <input
          type="number"
          value={value[1]}
          onChange={(e) => handleInputChange(1, e.target.value)}
          min={value[0]}
          max={max}
          className={`${inputOverride}`}
        />
      </div>
    </div>
  );
}
