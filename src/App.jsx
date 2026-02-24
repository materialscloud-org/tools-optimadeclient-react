import { useState } from "react";
import MaterialsCloudHeader from "mc-react-header";

import { OptimadeClient } from "./components/OptimadeClient";

import "./index.css";

// current known bad providers.
const badProviders = [
  "exmpl", // example provider shouldnt be shown.
  "aflow", // returns a 500 error.
  "matcloud", // child endpoint doesnt work or return properly?
  "mpds", // behind a paywall
  "mpod", // url seems to be down at the moment - skip.
  "optimake", // not an actual provider
  "optimade", // not an actual provider
];

function App() {
  return (
    <>
      <MaterialsCloudHeader
        className="header"
        activeSection="work"
        breadcrumbsPath={[
          { name: "Work", link: "https://www.materialscloud.org/work" },
          { name: "Tools", link: "https://www.materialscloud.org/work/tools" },
          { name: "OPTIMADE-Client", link: null },
        ]}
      />
      <OptimadeClient hideProviderList={badProviders} />
    </>
  );
}

export default App;
