import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInfo } from "../../api";
import { containerStyleDropdown } from "../../styles/containerStyles";

const tableTitleclassName = "font-semibold border-b [&>th]:px-2";
const tableRowclassName =
  "border-b border-slate-300 *:py-0.5 *:pl-2 pr-8 *:break-words";

export default function OptimadeProviderInfo({ queryUrl }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["provider-info", queryUrl],
    queryFn: () => getInfo({ providerUrl: queryUrl }),
    enabled: !!queryUrl,
    staleTime: Infinity,
  });

  const urlInfo = data?.customProps ?? {};
  const urlInfoErrors = isError ? [error] : [];

  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isOpen, urlInfo, urlInfoErrors, isLoading]);

  if (!queryUrl || (urlInfoErrors.length > 0 && !isLoading)) return null;

  return (
    <div className={containerStyleDropdown}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between p-3 bg-slate-100 hover:bg-slate-200 hover:cursor-pointer transition"
      >
        <span className="font-semibold">
          Custom attributes in selected database
        </span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible content */}
      <div
        ref={contentRef}
        style={{ maxHeight: height }}
        className="transition-[max-height] duration-300 ease-in-out"
      >
        <div className="pt-2 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-t-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mr-2"></div>
              <span className="text-gray-500">Loading provider info…</span>
            </div>
          )}

          {urlInfo && !isLoading && (
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className={tableTitleclassName}>
                  <th>Field</th>
                  <th>Description</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(urlInfo).map(([key, info]) => (
                  <tr key={key} className={tableRowclassName}>
                    <td>{key}</td>
                    <td>{info.description || "-"}</td>
                    <td>{info.unit || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
