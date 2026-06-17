import { useMemo } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { StructureViewerWithDownload } from "../OptimadeStructureHandler";
import QEInputButton from "../common/QEInputButton";

import { lazy, Suspense } from "react";

import { containerStyleHalf } from "../../styles/containerStyles";

import { fromOptimade, toCIF } from "matsci-parse";

// lazy load Smiles Viewer for efficiency
const SmilesViewer = lazy(() =>
  import("../OptimadeSmilesHandler").then((mod) => ({
    default: mod.SmilesViewer,
  })),
);

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
      const structure = fromOptimade(selectedResult);
      const cif = structure ? toCIF(structure) : "";
      return { structureData: structure, cifText: cif };
    } catch (err) {
      console.error("Failed to convert selectedResult:", err);
      console.error(
        "Perhaps this provider does not define the neccessary fields",
        err,
      );

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
                <Suspense fallback={<div>Loading molecule viewer...</div>}>
                  <SmilesViewer smilesStr={smiles} width={450} height={450} />
                </Suspense>
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
