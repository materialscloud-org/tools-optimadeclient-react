import { useMemo } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { StructureViewerWithDownload } from "../OptimadeStructureHandler";
import QEInputButton from "../common/QEInputButton";

import { containerStyleHalf } from "../../styles/containerStyles";

import { optimadeToCrystalStructure } from "../../utils";

import { structureToCif } from "matsci-parse";

export function ResultViewer({ selectedResult }) {
  const { structureData, cifText } = useMemo(() => {
    if (!selectedResult) return { structureData: null, cifText: "" };

    try {
      const structure = optimadeToCrystalStructure(selectedResult);
      const cif = structure ? structureToCif(structure) : "";
      return { structureData: structure, cifText: cif };
    } catch (err) {
      console.error("Failed to convert selectedResult:", err);
      return { structureData: null, cifText: "" };
    }
  }, [selectedResult]);

  return (
    <div className="w-full flex flex-col">
      {selectedResult ? (
        <div className="@container w-full flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="w-full md:w-1/2">
            <StructureViewerWithDownload OptimadeStructure={selectedResult} />
          </div>
          <div className={containerStyleHalf}>
            <JsonView
              data={selectedResult}
              compactTopLevel
              shouldExpandNode={(level) => level < 2}
              style={{ backgroundColor: "" }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-2 md:mt-4 flex justify-center">
        <QEInputButton cifText={cifText} />
      </div>
    </div>
  );
}
