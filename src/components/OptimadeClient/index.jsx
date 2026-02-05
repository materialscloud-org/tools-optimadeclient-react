import { useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import OptimadeHeader from "./OptimadeHeader";
import OptimadeFAQs from "./OptimadeFAQs";
import { ResultViewer } from "./ResultViewer";
import { OptimadeQuerier } from "./OptimadeQuerier";

export function OptimadeClient({ hideProviderList }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastAppliedRef = useRef("");

  // --- Read params ---
  const customUrl = searchParams.get("base_url");
  const providerParam = searchParams.get("provider");
  const dbParam = searchParams.get("db");
  // ---

  const updateUrlParams = useCallback(
    ({ base_url, provider, db }) => {
      const next = new URLSearchParams(searchParams);

      // clear OPTIMADE params
      next.delete("base_url");
      next.delete("provider");
      next.delete("db");

      // mutually exclusive modes
      if (provider) {
        next.set("provider", provider);
        if (db) next.set("db", db);
      } else if (base_url) {
        next.set("base_url", base_url);
      }

      next.sort();
      const nextString = next.toString();
      const currentString = searchParams.toString();

      if (
        nextString !== currentString &&
        nextString !== lastAppliedRef.current
      ) {
        lastAppliedRef.current = nextString;
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const [selectedResult, setSelectedResult] = useState(null);

  return (
    <div className="min-h-screen max-w-5xl mx-auto bg-white mb-4 shadow-md rounded-xs">
      <div className="flex flex-col items-center w-full px-2 md:px-4 py-2">
        <OptimadeHeader />
        <div className="p-2 w-full">
          <OptimadeFAQs />
        </div>

        <OptimadeQuerier
          selectedResult={selectedResult}
          setSelectedResult={setSelectedResult}
          hideProviderList={hideProviderList}
          customUrl={customUrl}
          providerParam={providerParam}
          dbParam={dbParam}
          updateUrlParams={updateUrlParams}
        />

        <ResultViewer selectedResult={selectedResult} />
      </div>
    </div>
  );
}
