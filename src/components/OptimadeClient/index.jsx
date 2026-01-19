import { useState, useEffect, useCallback } from "react";
import { getProvidersList, getStructures } from "../../api";
import OptimadeHeader from "./OptimadeHeader";
import OptimadeFilters from "./OptimadeFilters";
import OptimadeFAQs from "./OptimadeFAQs";
import { ResultViewer } from "./ResultViewer";
import ResultsDropdown from "./ResultsDropdown";
import OptimadeProviderInfo from "./OptimadeProviderInfo";
import { PaginationHandler } from "./PaginationHandler";
import { AnimatePresence, motion } from "framer-motion";
import OptimadeNoResults from "./OptimadeNoResults";
import MaterialsCloudHeader from "mc-react-header";
import OptimadeChildInfo from "./OptimadeChildInfo";
import OptimadeParentInfo from "./OptimadeParentInfo";
import { containerStyle } from "../../styles/containerStyles";

import ParentProviderDropdown from "./DropdownSelectors/parentProviderDropdown";
import ChildProviderDropdown from "./DropdownSelectors/childProviderDropdown";
import { useSearchParams } from "react-router-dom";

export function OptimadeClient({ hideProviderList = ["exmpl", "matcloud"] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);

  const customUrl = searchParams.get("custom_url");

  // set selectedProvider when URL search params is in the custom state
  const [selectedProvider, setSelectedProvider] = useState(
    customUrl ? { id: "__custom__", base_url: "" } : null,
  );

  // set selectedChild when URL search params is in the custom state
  const [selectedChild, setSelectedChild] = useState(
    customUrl ? { id: "__custom__", base_url: customUrl } : null,
  );

  // remove search params when selected child is not in the custom state
  useEffect(() => {
    if (!selectedProvider || selectedProvider.id !== "__custom__") {
      if (searchParams.has("custom_url")) {
        const next = new URLSearchParams(searchParams);
        next.delete("custom_url");
        setSearchParams(next, { replace: true });
      }
    }
  }, [selectedProvider]);

  // add URL search params when selectedChild is in the custom state
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (selectedChild?.id === "__custom__" && selectedChild.base_url) {
      next.set("custom_url", selectedChild.base_url);
    } else {
      next.delete("custom_url");
    }

    setSearchParams(next, { replace: true });
  }, [selectedChild]);

  // filter and pages useStates
  const [currentFilter, setCurrentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState({
    data_returned: 0,
    data_available: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const provObj = await getProvidersList(undefined, hideProviderList);
        setProviders(provObj.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProviders();
  }, []);

  const fetchResults = useCallback(async () => {
    if (!selectedChild?.base_url) return;

    setLoading(true);
    try {
      const data = await getStructures({
        providerUrl: selectedChild?.base_url,
        filter: currentFilter,
        page: currentPage,
      });
      setResults(data);

      const meta = data?.meta ?? { data_returned: 0, data_available: 0 };
      setMetaData(meta);
      setTotalPages(
        meta.data_returned != null
          ? Math.max(1, Math.ceil(meta.data_returned / 20))
          : "N/A",
      );

      setCurrentResult(data?.data[0] || null);
    } catch (err) {
      console.error(err);
      setCurrentResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, currentFilter, currentPage]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

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
            {selectedChild?.base_url && (
              <AnimatePresence>
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={containerStyle}
                >
                  <OptimadeFilters
                    queryUrl={selectedChild?.base_url}
                    onSubmit={(filter) => {
                      setCurrentFilter(filter);
                      setCurrentPage(1);
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="p-2 w-full">
            <OptimadeProviderInfo queryUrl={selectedChild?.base_url} />
          </div>

          {/* Results */}
          {selectedChild?.base_url && (
            <div className="px-2 md:px-4 w-full">
              {loading && (
                <div className="flex justify-center items-center h-[610px]">
                  <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              <div className="border-b border-slate-300 py-2"></div>

              {!loading && !currentResult && currentFilter && (
                <div className="p-2">
                  <OptimadeNoResults
                    queryUrl={selectedChild?.base_url}
                    currentFilter={currentFilter}
                  />
                </div>
              )}

              {!loading && results && currentResult && (
                <div className="py-1 md:py-2">
                  <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                    <div className="flex-1">
                      <ResultsDropdown
                        results={results}
                        resultsLoading={loading}
                        selectedResult={currentResult}
                        setSelectedResult={setCurrentResult}
                      />
                    </div>
                    <div>
                      <PaginationHandler
                        currentPage={currentPage}
                        totalPages={totalPages}
                        resultsLoading={loading}
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
