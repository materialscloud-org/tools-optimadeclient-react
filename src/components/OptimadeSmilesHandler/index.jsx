import { useEffect, useRef } from "react";
import SmilesDrawer from "smiles-drawer";

import HelpIcon from "../common/HelpIcon";

const container = `w-full h-full flex border
   border-slate-500 rounded-sm
    items-center justify-center bg-slate-50 relative`;

export function SmilesViewer({
  smilesStr,
  type = "svg",
  width = 400,
  height = 400,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!smilesStr || !containerRef.current) return;

    const sd = new SmilesDrawer.SmiDrawer({
      width,
      height,
      padding: 15,
      bondThickness: 1.2,
      fontSizeLarge: 6,
    });

    sd.draw(smilesStr, containerRef.current);
  }, [smilesStr, width, height]);

  if (type === "img") {
    return (
      <div className={container}>
        <img
          ref={containerRef}
          style={{ width, height }}
          alt="SMILES structure"
        />
      </div>
    );
  }

  return (
    // svg doesnt play that nice with the baseContainer so we hard code it here.
    <div className={container}>
      <div className="absolute top-2 right-2 z-10">
        <HelpIcon
          popover={`Smiles rendering is experimental and being done by SmilesDrawer 2.0, please report any issues you observe.`}
          placement="left"
          color="rgb(40,40,40)"
        />
      </div>
      <svg ref={containerRef} width={width} height={height} />
    </div>
  );
}
