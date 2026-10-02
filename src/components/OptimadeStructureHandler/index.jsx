import StructureVisualizer from "mc-react-structure-visualizer";
import { StructureDownload } from "../common/StructureDownload";

import { textError } from "../../styles/textStyles";
import { containerStyle } from "../../styles/containerStyles";

export function StructureViewerWithDownload({ structure, OptimadeStructure }) {
  if (!structure?.lattice || !structure?.sites?.length) {
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
        <StructureVisualizer structure={structure} />
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
