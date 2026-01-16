import { useMemo } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { StructureViewerWithDownload } from "../OptimadeStructureHandler";
import QEInputButton from "../common/QEInputButton";

import { generateCIFfromMatrix } from "../../utils";

import { containerStyleHalf } from "../../styles/containerStyles";

// TODO, switdch jsonview library

export function ResultViewer({ selectedResult }) {
  const lattice = selectedResult?.attributes?.lattice_vectors ?? [];
  const sitesRaw = selectedResult?.attributes?.cartesian_site_positions ?? [];
  const species = selectedResult?.attributes?.species_at_sites ?? [];

  const sites = sitesRaw.map((pos, i) => ({
    element: species[i],
    x: pos[0],
    y: pos[1],
    z: pos[2],
  }));

  const structureData = useMemo(() => ({ lattice, sites }), [lattice, sites]);
  const cifText = useMemo(
    () => generateCIFfromMatrix(structureData),
    [structureData]
  );

  return (
    <div className="w-full flex flex-col">
      {/* Result details */}
      {selectedResult && (
        <div className="@container w-full flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="w-full md:w-1/2">
            <StructureViewerWithDownload
              OptimadeStructure={selectedResult}
              cifText={cifText}
            />
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
      )}

      <div className="mt-2 md:mt-4 flex justify-center">
        <QEInputButton cifText={cifText} />
      </div>
    </div>
  );
}
