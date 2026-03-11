import { useMemo } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { StructureViewerWithDownload } from "../OptimadeStructureHandler";
import QEInputButton from "../common/QEInputButton";

import { containerStyleHalf } from "../../styles/containerStyles";

import { optimadeToCrystalStructure } from "../../utils";
import { structureToCif } from "matsci-parse";

import { SmilesViewer } from "../OptimadeSmilesHandler";

function getSmiles(attributes) {
  if (!attributes) return null;

  const key = Object.keys(attributes).find((k) =>
    k.toLowerCase().includes("smiles"),
  );

  if (key) return attributes[key];
  return null;
}

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

  const crystalPositions = selectedResult?.attributes?.cartesian_site_positions;
  const smiles = getSmiles(selectedResult?.attributes);

  const shouldRenderCrystal = structureData && crystalPositions;
  const shouldRenderSmiles = !shouldRenderCrystal && smiles;

  return (
    <div className="w-full flex flex-col">
      {selectedResult ? (
        <div>
          <div className="@container w-full flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="w-full md:w-1/2">
              {shouldRenderCrystal ? (
                <StructureViewerWithDownload
                  OptimadeStructure={selectedResult}
                />
              ) : shouldRenderSmiles ? (
                <SmilesViewer smilesStr={smiles} width={450} height={450} />
              ) : (
                <div className="text-center text-red-600">
                  No crystal structure or SMILES available
                </div>
              )}
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
          <div className="mt-2 md:mt-4 flex justify-center">
            <QEInputButton cifText={cifText} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
