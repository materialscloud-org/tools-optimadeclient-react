import { useState, useEffect, useCallback } from "react";
import { getProvidersList, getStructures } from "../../api";
import OptimadeHeader from "./OptimadeHeader";
import OptimadeFilters from "./OptimadeFilters";
import OptimadeFAQs from "./OptimadeFAQs";
import { ResultViewer } from "./ResultViewer";
import ResultsDropdown from "./ResultsDropdown";
import OptimadeProviderInfo from "./OptimadeProviderInfo";
import { PaginationHandler } from "./PaginationHandler";
import { motion } from "framer-motion";
import OptimadeNoResults from "./OptimadeNoResults";
import MaterialsCloudHeader from "mc-react-header";
import OptimadeChildInfo from "./OptimadeChildInfo";
import OptimadeParentInfo from "./OptimadeParentInfo";
import { containerStyle } from "../../styles/containerStyles";

import ParentProviderDropdown from "./DropdownSelectors/parentProviderDropdown";
import ChildProviderDropdown from "./DropdownSelectors/childProviderDropdown";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export function OptimadeClient({ hideProviderList = ["exmpl", "matcloud"] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const customUrl = searchParams.get("base_url");

  const [selectedProvider, setSelectedProvider] = useState(
    customUrl ? { id: "__custom__", base_url: "" } : null,
  );
  const [selectedChild, setSelectedChild] = useState(
    customUrl ? { id: "__custom__", base_url: customUrl } : null,
  );

  const [currentFilter, setCurrentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResult, setCurrentResult] = useState(null);

  // Handle URL search params for custom endpoints
  useEffect(() => {
    if (!selectedProvider || selectedProvider.id !== "__custom__") {
      if (searchParams.has("base_url")) {
        const next = new URLSearchParams(searchParams);
        next.delete("base_url");
        setSearchParams(next, { replace: true });
      }
    }
  }, [selectedProvider]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (selectedChild?.id === "__custom__" && selectedChild.base_url) {
      next.set("base_url", selectedChild.base_url);
    } else {
      next.delete("base_url");
    }

    setSearchParams(next, { replace: true });
  }, [selectedChild]);

  // Reset page to 1 whenever child changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChild]);

  // --- Providers list via TanStack Query ---
  const { data: providersData } = useQuery({
    queryKey: ["providers", hideProviderList],
    queryFn: () => getProvidersList(undefined, hideProviderList),
    staleTime: Infinity,
  });

  const providers = providersData?.data ?? [];

  // --- Structures / results via TanStack Query ---
  const { data: resultsData, isLoading: isLoading } = useQuery({
    queryKey: [
      "structures",
      selectedChild?.base_url,
      currentFilter,
      currentPage,
    ],
    queryFn: () =>
      getStructures({
        providerUrl: selectedChild?.base_url,
        filter: currentFilter,
        page: currentPage,
      }),
    enabled: !!selectedChild?.base_url,
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true, // keeps previous page visible while fetching new page
  });

  const results = resultsData?.data ?? [];
  const metaData = resultsData?.meta ?? { data_returned: 0, data_available: 0 };
  const totalPages =
    metaData.data_returned != null
      ? Math.max(1, Math.ceil(metaData.data_returned / 20))
      : 1;

  // Reset selectedResult when results change
  useEffect(() => {
    setCurrentResult(results[0] ?? null);
  }, [results]);

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

      <div className="min-h-screen max-w-5xl mx-auto bg-white mb-4 shadow-md rounded-xs">
        <div className="flex flex-col items-center w-full px-2 md:px-4 py-2">
          <OptimadeHeader />
          <div className="p-2 w-full">
            <OptimadeFAQs />
          </div>

          {/* Parent + Child Dropdowns */}
          <div className="pt-4 p-2 w-full flex flex-col gap-2 max-w-[650px]">
            <ParentProviderDropdown
              providers={providers}
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
            />
            <ChildProviderDropdown
              selectedProvider={selectedProvider}
              selectedChild={selectedChild}
              onSelectChild={setSelectedChild}
            />
          </div>

          {/* Info panels */}
          <div className="flex flex-col md:flex-row w-full max-w-5xl px-2 md:px-4 py-2 gap-4">
            <div className="md:w-1/2 w-full">
              <OptimadeParentInfo
                provider={selectedProvider}
                providers={providers}
              />
            </div>
            <div className="md:w-1/2 w-full">
              <OptimadeChildInfo child={selectedChild} />
            </div>
          </div>

          {/* Filters */}
          <div className="p-2 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: selectedChild?.base_url ? 1 : 0,
                y: selectedChild?.base_url ? 0 : 20,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${containerStyle} ${!selectedChild?.base_url ? "pointer-events-none" : ""}`}
            >
              <OptimadeFilters
                queryUrl={selectedChild?.base_url || ""}
                onSubmit={(filter) => {
                  setCurrentFilter(filter);
                  setCurrentPage(1);
                }}
              />
            </motion.div>
          </div>

          <div className="p-2 w-full">
            <OptimadeProviderInfo queryUrl={selectedChild?.base_url} />
          </div>

          {/* Results */}
          {selectedChild?.base_url && (
            <div className="px-2 md:px-4 w-full min-h-[726px] md:min-h-[621px] relative">
              <div className="border-b border-slate-300 py-2" />

              {/* No results message */}
              {!isLoading && !currentResult && currentFilter && (
                <div className="p-2">
                  <OptimadeNoResults
                    queryUrl={selectedChild?.base_url}
                    currentFilter={currentFilter}
                  />
                </div>
              )}

              {/* Spinner overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-white/70 z-1000">
                  <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {/* Results + dropdown + pagination */}
              {results.length > 0 && currentResult && (
                <div className="relative py-1 md:py-2">
                  <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                    <div className="flex-1">
                      <ResultsDropdown
                        results={results}
                        selectedResult={currentResult}
                        setSelectedResult={setCurrentResult}
                      />
                    </div>
                    <div>
                      <PaginationHandler
                        currentPage={currentPage}
                        totalPages={totalPages}
                        metaData={metaData}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>

                  <div className="py-4">
                    <ResultViewer selectedResult={currentResult} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
