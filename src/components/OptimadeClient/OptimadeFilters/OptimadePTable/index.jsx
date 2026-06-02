import React, { useEffect, useState, useMemo } from "react";
import { symbols, names } from "mc-periodic-table";

import HelpIcon from "../../../common/HelpIcon";
import { PTableWrapper } from "../../../common/PTableWrapper";

export default function PTable({
  providerUrl = null,
  selected = {},
  onSelectionChange,
}) {
  const [cachedPTable, setCachedPTable] = useState(null);
  const [lastModified, setLastModified] = useState(null);

  // ----------------------------
  // cache loading
  // ----------------------------
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
          if (!res.ok) throw new Error(`Failed ${url}`);
          json = await res.json();
          break;
        } catch (e) {
          console.warn(e.message);
        }
      }

      if (!json) return;

      if (json.lastUpdated) {
        setLastModified(new Date(json.lastUpdated).toLocaleDateString());
      }

      const map = {};
      json.data.forEach((entry) => {
        if (!entry.providerUrl) return;

        const key = entry.providerUrl.replace(/\/+$/, "");

        const ptable =
          entry.ptable ??
          Object.fromEntries(
            Object.entries(entry).filter(
              ([k]) => k !== "providerUrl" && k !== "lastUpdated",
            ),
          );

        map[key] = ptable;
      });

      setCachedPTable(map);
    };

    loadCache();
  }, []);

  // ----------------------------
  // convert selected symbols → atomic state
  // ----------------------------
  const selectionState = useMemo(() => {
    const atomic = {};
    for (const [sym, value] of Object.entries(selected)) {
      const idx = symbols.indexOf(sym);
      if (idx > 0) atomic[idx] = value;
    }
    return atomic;
  }, [selected]);

  // ----------------------------
  // handle updates from web component
  // ----------------------------
  const handleChange = (atomicState) => {
    const mapped = {};

    for (const [atomic, value] of Object.entries(atomicState)) {
      const sym = symbols[Number(atomic)];
      if (!sym) continue;
      mapped[sym] = value;
    }

    onSelectionChange?.(mapped);
  };

  // ----------------------------
  // noHighlight from cache (IMPORTANT FIX)
  // ----------------------------
  const noHighlightArray = useMemo(() => {
    if (!providerUrl || !cachedPTable) return [];

    const ptable = cachedPTable[providerUrl];
    if (!ptable) return [];

    const out = [];

    for (let i = 1; i < symbols.length; i++) {
      const sym = symbols[i];
      if (ptable[sym] === false) out.push(i);
    }

    return out;
  }, [providerUrl, cachedPTable]);

  const noInteractArray = [];

  // ----------------------------
  // render
  // ----------------------------
  return (
    <div className="@container">
      <div className="flex justify-end pb-2 pr-2.5">
        <HelpIcon
          popover={`All OPTIMADE provider databases have been prefiltered. Last updated: ${lastModified}.`}
          placement="left"
          color="rgb(40,40,40)"
        />
      </div>

      <PTableWrapper
        noInteractArray={noInteractArray}
        noHighlightArray={noHighlightArray}
        selected={selectionState}
        onChange={handleChange}
        zoomLevel={1050}
      />
    </div>
  );
}
