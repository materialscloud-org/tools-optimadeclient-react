import { useState, useRef, useEffect } from "react";
import { DownloadIcon } from "./Icons";

const defaultFormats = [
  { format: "jsonOM", label: "JSON" },
  // { format: "jsonMSP", label: "matsci-parse" },
  { format: "cif", label: "CIF" },
  { format: "xyz", label: "XYZ" },
  { format: "xsf", label: "XSF" },
  { format: "poscar", label: "VASP" },
];

import { baseButtonStyle } from "../../styles/buttonStyles";
import { textSmall } from "../../styles/textStyles";
import { toCIF, toPOSCAR, toXSF, toXYZ, toJSON } from "matsci-parse";

// === Download Helper ===
function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === React Component ===
export function StructureDownload({
  structure,
  OptimadeStructure,
  download_formats,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const downloadFormats = download_formats || defaultFormats;

  const handleDownload = (format) => {
    let content = "";
    let filename = "structure";

    if (format === "cif") {
      content = toCIF(structure);
      filename += ".cif";
    } else if (format === "xyz") {
      content = toXYZ(structure);
      filename += ".xyz";
    } else if (format === "poscar") {
      content = toPOSCAR(structure);
      filename += ".vasp";
    } else if (format === "xsf") {
      content = toXSF(structure);
      filename += ".xsf";
      // dump it as an optimade string
    } else if (format === "jsonOM") {
      content = JSON.stringify(OptimadeStructure, null, 2);
      filename += "_OPTIMADE.json";
    } else if (format === "jsonMSP") {
      content = JSON.stringify(toJSON(structure), null, 2);
      filename += "_matsciparse.json";
    }

    if (content) downloadFile(content, filename);
    setOpen(false);
  };

  // === outside click handler ===
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        className={`${baseButtonStyle} ${textSmall} py-2! px-2!`}
        title="Download"
      >
        <DownloadIcon />
      </div>
      {open && (
        <div className="absolute right-0 mt-0.5 bg-white rounded-sm shadow-sm ring-1 ring-slate-500 z-100">
          <ul>
            {downloadFormats.map(({ format, label }) => (
              <li key={format}>
                <button
                  onClick={() => handleDownload(format)}
                  className={`${textSmall} w-full text-left px-3 py-1.25 text-slate-700 hover:bg-gray-100 hover:cursor-pointer`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
