import React, { useEffect, useState } from "react";
import { elements as allElements } from "./elements";

import HelpIcon from "../../../common/HelpIcon";

const defaultColors = {
  group1: "bg-[#d7bbbb]",
  group2: "bg-[#d7cdbb]",
  group17: "bg-[#d7d9c2]",
  group18: "bg-[#d0d5ee]",
  transition: "bg-[#c4d0d8]",
  lanthanide: "bg-[#e5cbee]",
  actinide: "bg-[#aebcee]",
  metalloid: "bg-[#cdd9c2]",
  postTransition: "bg-[#c2c8d9]",
  mainGroup: "bg-[#d9c2ce]",
  default: "bg-gray-200",
};

export default function PTable({
  providerUrl = null,
  selected = {},
  onSelectionChange,
  colors = defaultColors,
  selectedClassName = "bg-green-400 border border-green-700 text-white scale-105",
  deselectedClassName = "bg-red-400 border border-red-700 text-white scale-105",
  defaultBorderClassName = "border border-slate-700",
  hoverClassName = "transform transition-transform duration-100 hover:scale-105 hover:z-10 hover:cursor-pointer",
}) {
  const [elements, setElements] = useState(allElements);
  const [cachedPTable, setCachedPTable] = useState(null);
  const [lastModified, setLastModified] = useState(null);

  // Load cached PTable once on mount
  useEffect(() => {
    const loadCache = async () => {
      const urls = [
        "./cachedPTable.json",
        "https://raw.githubusercontent.com/materialscloud-org/tools-optimadeclient-react/main/public/cachedPTable.json",
      ];
      let json = null;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok)
            throw new Error(`Failed to load cached PTable from ${url}`);
          json = await res.json();
          console.log(`Loaded cached PTable from ${url}`);
          break;
        } catch (err) {
          console.warn(err.message);
        }
      }

      if (!json) {
        console.error("Failed to load cached PTable from all sources");
        return;
      }

      // Use lastUpdated for UI
      if (json.lastUpdated) {
        setLastModified(new Date(json.lastUpdated).toLocaleDateString());
      }

      // Convert to lookup map
      const map = {};
      json.data.forEach((entry) => {
        map[entry.providerUrl] = entry.ptable;
      });
      setCachedPTable(map);
    };

    loadCache();
  }, []);

  // Update elements when providerUrl changes
  useEffect(() => {
    if (!providerUrl || !cachedPTable) return;

    const ptable = cachedPTable[providerUrl] || {};

    const updatedElements = allElements.map((el) => ({
      ...el,
      present: el.sym in ptable ? ptable[el.sym] : undefined,
    }));

    setElements(updatedElements);
  }, [providerUrl, cachedPTable]);

  const toggle = (sym) => {
    if (!onSelectionChange) return;
    const newState = ((selected[sym] ?? 0) + 1) % 3;
    onSelectionChange({ [sym]: newState });
  };

  const getColorClass = (el) => {
    const state = selected[el.sym] ?? 0;
    const baseColor = colors[el.group] ?? colors.default;

    if (state === 1) return selectedClassName;
    if (state === 2) return deselectedClassName;

    const opacityClass = !el.present ? "opacity-30" : "";

    return `${baseColor} ${defaultBorderClassName} ${opacityClass}`;
  };

  return (
    <div className="w-full max-w-full mx-auto px-0 md:px-2">
      <div className="@container">
        <div className="flex justify-end pb-2 pr-1.5">
          <HelpIcon
            popover={`All OPTIMADE provider databases have been prefiltered, with unavailable structures greyed out. Last updated: ${lastModified}.`}
            placement="left"
            color="rgb(40,40,40)"
          />
        </div>
        <div
          className="grid @gap-0.5 @sm:gap-1 w-full"
          style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
        >
          {elements.map((el) => (
            <div
              key={el.sym}
              style={{ gridColumn: el.col, gridRow: el.row }}
              className="relative w-full"
            >
              <div className="w-full aspect-square">
                <button
                  onClick={() => toggle(el.sym)}
                  className={`flex flex-col justify-center items-center w-full h-full rounded-sm ${hoverClassName} ${getColorClass(
                    el,
                  )}`}
                >
                  <span className="text-[0px] opacity-0 @sm:text-[0.3rem] @sm:opacity-100 @md:text-[0.5rem] @lg:text-[0.7rem] text-gray-700 leading-tight">
                    {el.num}
                  </span>
                  <span
                    className="text-[0.55rem] font-medium leading-none"
                    style={{ fontSize: "clamp(0.55rem, 2.5vw, 1.25rem)" }}
                  >
                    {el.sym}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
