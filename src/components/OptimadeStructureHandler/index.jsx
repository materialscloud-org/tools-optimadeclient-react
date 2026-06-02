import StructureVisualizer from "mc-react-structure-visualizer";
import { StructureDownload } from "../common/StructureDownload";

import { textError } from "../../styles/textStyles";
import { containerStyle } from "../../styles/containerStyles";
import { fromOptimade, toCIF } from "matsci-parse";

export function StructureViewerWithDownload({ OptimadeStructure }) {
  let structure = null;
  let cifText = "";
  let hasError = false;

  try {
    if (OptimadeStructure) {
      structure = fromOptimade(OptimadeStructure);
      cifText = structure ? toCIF(structure) : "";
    } else {
      hasError = true;
    }
  } catch (err) {
    console.error("Failed to parse OptimadeStructure:", err);
    hasError = true;
  }

  if (hasError || !OptimadeStructure?.attributes?.cartesian_site_positions) {
    return (
      <div
        className={`${containerStyle} min-h-[450px] flex items-center justify-center`}
      >
        <div className={textError}>
          <p>Unexpected or malformed data format found.</p>
          <p>--</p>
          <p>Crystal structure rendering skipped...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[450px]">
      <div className="w-full h-[450px]">
        <StructureVisualizer key={cifText} cifText={cifText} />
      </div>

      <div className="absolute top-2 right-2 z-10">
        <StructureDownload
          structure={structure}
          OptimadeStructure={OptimadeStructure}
        />
      </div>
    </div>
  );
}
