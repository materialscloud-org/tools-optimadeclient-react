import { useState } from "react";
import MaterialsCloudHeader from "mc-react-header";

import { OptimadeClient } from "./components/OptimadeClient";

import "./index.css";

// current known bad providers.
const badProviders = [
  "exmpl", // example provider shouldnt be shown.
  "aiida", // base_url is null...
  "aflow", // returns a 500 error.
  "ccdc", // base_url is null...
  "ccpnc", // base_url is null...
  //"cmr",  - is fine but has weird data.
  "httk", // base_url is null...
  "matcloud", // child endpoint doesnt work or return properly?
  "mpds", // behind a paywall - should skip i guess.
  "mpod", // url seems to be down at the moment - skip.
  "optimake", // not an actual provider
  "optimade", // not an actual provider
  "pcod", // base_url is null...
  "psdi", // base_url is null...
];

function App() {
  return (
    <>
      <MaterialsCloudHeader
        className="header"
        activeSection="work"
        breadcrumbsPath={[
          { name: "Work", link: "https://www.materialscloud.org/work" },
          { name: "OPTIMADE-Client", link: null },
        ]}
      />
      <OptimadeClient hideProviderList={badProviders} />
    </>
  );
}

export default App;
