import { useState, useEffect, useCallback, useRef } from "react";
import { getProvidersList, getProviderLinks, getStructures } from "../../api";
import OptimadeFilters from "./OptimadeFilters";
import ResultsDropdown from "./ResultsDropdown";
import OptimadeProviderInfo from "./OptimadeProviderInfo";
import { PaginationHandler } from "./PaginationHandler";
import { motion } from "framer-motion";
import OptimadeNoResults from "./OptimadeNoResults";
import OptimadeChildInfo from "./OptimadeChildInfo";
import OptimadeParentInfo from "./OptimadeParentInfo";
import { containerStyle } from "../../styles/containerStyles";

import ParentProviderDropdown from "./DropdownSelectors/parentProviderDropdown";
import ChildProviderDropdown from "./DropdownSelectors/childProviderDropdown";
import { useQuery } from "@tanstack/react-query";

export function OptimadeQuerier({
  selectedResult,
  setSelectedResult,
  hideProviderList = ["exmpl", "matcloud"],
  customUrl = null,
  providerParam = null,
  dbParam = null,
  updateUrlParams = null,
}) {
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isCustom = !!customUrl;

  const [selectedProvider, setSelectedProvider] = useState(
    isCustom ? { id: "__custom__", base_url: "" } : null,
  );
  const [selectedChild, setSelectedChild] = useState(
    isCustom ? { id: "__custom__", base_url: customUrl } : null,
  );

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
    if (!updateUrlParams) return;

    // Custom mode
    if (selectedProvider?.id === "__custom__") {
      const base_url = selectedChild?.base_url ?? customUrl ?? "";
      updateUrlParams({ base_url: base_url || null, provider: null, db: null });
      return;
    }

    // Provider mode
    if (selectedProvider?.id) {
      const dbToWrite =
        selectedChild?.id && selectedChild.id !== "__custom__"
          ? selectedChild.id
          : selectedChild == null
            ? dbParam || null
            : null;

      updateUrlParams({
        base_url: null,
        provider: selectedProvider.id,
        db: dbToWrite,
      });
      return;
    }

    updateUrlParams({ base_url: null, provider: null, db: null });
  }, [
    updateUrlParams,
    selectedProvider?.id,
    selectedChild?.id,
    selectedChild,
    selectedChild?.base_url,
    customUrl,
    dbParam,
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
    setSelectedResult(results[0] ?? null);
  }, [results]);

  return (
    <>
      <div className="pt-4 p-2 w-full flex flex-col gap-2 mx-auto max-w-[650px]">
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
        <div className="px-2 md:px-4 w-full relative">
          <div className="border-b border-slate-300 py-2" />

          {/* No results message */}
          {!isLoading && !selectedResult && currentFilter && (
            <div className="p-2">
              <OptimadeNoResults
                queryUrl={selectedChild?.base_url}
                currentFilter={currentFilter}
              />
            </div>
          )}

          {/* Spinner overlay */}
          {isLoading && (
            <div className="inset-0 p-10 flex justify-center items-center bg-white/70 z-1000">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Results + dropdown + pagination */}
          {results.length > 0 && selectedResult && (
            <div className="relative py-1 md:py-2">
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                <div className="flex-1">
                  <ResultsDropdown
                    results={results}
                    selectedResult={selectedResult}
                    setSelectedResult={setSelectedResult}
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
            </div>
          )}
        </div>
      )}
    </>
  );
}
