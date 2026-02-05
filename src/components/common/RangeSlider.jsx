import { Range } from "react-range";
import React, { useState, useEffect } from "react";

import { textNormal, textSmall } from "../../styles/textStyles";

// needed to make input look like normal text. may look awful on old browsers
const inputOverride = `w-12 text-center bg-transparent border-none outline-none p-0
             [&::-webkit-inner-spin-button]:appearance-none
             [&::-webkit-outer-spin-button]:appearance-none
             [-moz-appearance:textfield]`;

// slider settings
const sliderBgStyle = "flex-1 h-2 bg-gray-300 rounded relative";
const sliderFgStyle = "absolute h-2 bg-blue-500 rounded";
const sliderThumbStyle =
  "w-4.5 h-4.5 bg-slate-100 border-2 border-slate-400 rounded-full transition-transform transform origin-center hover:scale-125";

export default function RangeSlider({ title, value, onChange, min, max }) {
  const [tempValue, setTempValue] = useState(value.map(String));

  useEffect(() => {
    setTempValue(value.map(String));
  }, [value]);

  const handleInputChange = (index, val) => {
    setTempValue((prev) => {
      const newVal = [...prev];
      newVal[index] = val; // keep as string
      return newVal;
    });

    const numeric = parseFloat(val);
    if (!isNaN(numeric)) {
      let newValue = [...value];
      if (index === 0) {
        newValue[0] = Math.min(Math.max(numeric, min), value[1]);
      } else {
        newValue[1] = Math.max(Math.min(numeric, max), value[0]);
      }
      onChange(newValue);
    }
  };

  const handleInputBlur = (index) => {
    const numeric = parseFloat(tempValue[index]);
    if (isNaN(numeric)) {
      // Reset to current slider value if entry is invalid
      setTempValue((prev) => {
        const newVal = [...prev];
        newVal[index] = String(value[index]);
        return newVal;
      });
    }
  };

  return (
    <div className={`${textNormal} p-2  pt-4`}>
      <label className="block">{title}</label>
      <div className="flex space-x-2.5 items-center">
        <input
          type="number"
          value={tempValue[0]}
          placeholder={min}
          min={min}
          max={value[1]}
          onChange={(e) => handleInputChange(0, e.target.value)}
          onBlur={() => handleInputBlur(0)}
          className={inputOverride}
        />
        <Range
          step={1}
          min={min}
          max={max}
          values={value}
          onChange={onChange}
          renderTrack={({ props, children }) => {
            const { key, ...rest } = props;
            return (
              <div key={key} {...rest} className={sliderBgStyle}>
                <div
                  className={sliderFgStyle}
                  style={{
                    left: `${((value[0] - min) / (max - min)) * 100}%`,
                    width: `${((value[1] - value[0]) / (max - min)) * 100}%`,
                  }}
                />
                {children}
              </div>
            );
          }}
          renderThumb={({ props }) => {
            const { key, ...rest } = props;
            return (
              <div
                key={key}
                {...rest}
                className="relative w-5 h-5 flex items-center"
              >
                <div className={sliderThumbStyle} />
              </div>
            );
          }}
        />
        <input
          type="number"
          value={tempValue[1]}
          placeholder={max}
          min={value[0]}
          max={max}
          onChange={(e) => handleInputChange(1, e.target.value)}
          onBlur={() => handleInputBlur(1)}
          className={`${inputOverride} ${textSmall}`}
        />
      </div>
    </div>
  );
}
