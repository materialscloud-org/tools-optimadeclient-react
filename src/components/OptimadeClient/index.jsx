import { useState, useEffect, useCallback, useRef } from "react";
import { getProvidersList, getProviderLinks, getStructures } from "../../api";
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
  const providerParam = searchParams.get("provider");
  const dbParam = searchParams.get("db");

  const isCustom = !!customUrl;
  const lastUrlRef = useRef("");

  const [selectedProvider, setSelectedProvider] = useState(
    isCustom ? { id: "__custom__", base_url: "" } : null,
  );
  const [selectedChild, setSelectedChild] = useState(
    isCustom ? { id: "__custom__", base_url: customUrl } : null,
  );

  const [currentFilter, setCurrentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResult, setCurrentResult] = useState(null);

  // Reset page when database changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChild]);

  // --- Providers list ---
  const { data: providersData } = useQuery({
    queryKey: ["providers", hideProviderList],
    queryFn: () => getProvidersList(undefined, hideProviderList),
    staleTime: Infinity,
  });

  const providers = providersData?.data ?? [];

  // --- Children from providers list ---
  const { data: childData, isLoading: loadingChildren } = useQuery({
    queryKey: ["provider-links", selectedProvider?.attributes?.base_url],
    queryFn: () => getProviderLinks(selectedProvider.attributes.base_url),
    enabled: !!selectedProvider?.attributes?.base_url,
    staleTime: Infinity,
  });

  const childEntries =
    childData?.children?.map((c) => ({
      id: c.id,
      ...(c.attributes ?? {}),
    })) ?? [];

  // --- 1. URL → Provider State ---
  useEffect(() => {
    if (isCustom || !providers.length || !providerParam) return;
    const provider = providers.find((p) => p.id === providerParam);
    if (provider) setSelectedProvider(provider);
  }, [providers, providerParam, isCustom]);

  useEffect(() => {
    if (isCustom || !dbParam || !childEntries.length) return;
    if (!selectedChild) {
      const child = childEntries.find((c) => c.id === dbParam);
      if (child) setSelectedChild(child);
    }
  }, [childEntries, dbParam, isCustom, !!selectedChild]);

  useEffect(() => {
    const isCurrentlyCustom = selectedProvider?.id === "__custom__";
    const nextParams = new URLSearchParams();

    if (isCurrentlyCustom) {
      const urlToSet = selectedChild?.base_url || customUrl;
      if (urlToSet) nextParams.set("base_url", urlToSet);
    } else {
      if (selectedProvider?.id) {
        nextParams.set("provider", selectedProvider.id);

        // Only set DB if it actually belongs to the selected provider
        if (selectedChild?.id && selectedChild.id !== "__custom__") {
          nextParams.set("db", selectedChild.id);
        } else if (dbParam && !selectedChild) {
          // Carry over the URL param while loading
          nextParams.set("db", dbParam);
        }
      }
    }

    nextParams.sort();
    const nextString = nextParams.toString();

    const currentString = new URLSearchParams(
      window.location.search,
    ).toString();

    if (nextString !== currentString && nextString !== lastUrlRef.current) {
      lastUrlRef.current = nextString;
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    selectedProvider?.id,
    selectedChild?.id,
    selectedChild?.base_url,
    isCustom,
  ]);

  // --- 3. Handlers for Dropdowns ---
  const handleProviderChange = (provider) => {
    if (provider?.id !== selectedProvider?.id) {
      setSelectedProvider(provider);
      setSelectedChild(null); // Clear child when provider changes

      // If switching to custom, initialize
      if (provider?.id === "__custom__") {
        setSelectedChild({ id: "__custom__", base_url: customUrl || "" });
      }
    }
  };

  const handleChildChange = (child) => {
    setSelectedChild(child);
  };

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
              onSelectProvider={handleProviderChange}
            />
            <ChildProviderDropdown
              selectedProvider={selectedProvider}
              selectedChild={selectedChild}
              onSelectChild={handleChildChange}
              childEntries={childEntries}
              loadingChildren={loadingChildren}
            />
          </div>

          {/* Info panels */}
          <div
            className={`flex flex-col md:flex-row w-full max-w-5xl px-2 md:px-4 py-2 gap-4 ${selectedProvider?.id === "__custom__" ? "justify-center" : ""}`}
          >
            {selectedProvider?.id != "__custom__" && (
              <div className="md:w-1/2 w-full">
                <OptimadeParentInfo
                  provider={selectedProvider}
                  providers={providers}
                />
              </div>
            )}
            <div
              className={`w-full ${selectedProvider?.id === "__custom__" ? "md:w-2/3 lg:w-1/2" : "md:w-1/2"}`}
            >
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
