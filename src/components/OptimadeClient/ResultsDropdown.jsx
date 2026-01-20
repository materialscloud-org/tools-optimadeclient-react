import { slateDropdown } from "../../styles/dropdownStyles";

export default function ResultsDropdown({
  results,
  selectedResult,
  setSelectedResult,
}) {
  const handleChange = (e) => {
    const chosen = results?.find((r) => String(r.id) === e.target.value);
    if (chosen) setSelectedResult(chosen);
  };

  return (
    <>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select a result
      </label>
      <select
        className={`${slateDropdown} w-full`}
        value={selectedResult?.id || ""}
        onChange={handleChange}
        disabled={!results?.length}
      >
        {!results?.length ? (
          <option value="">No results for current query</option>
        ) : (
          results.map((result) => (
            <option key={result.id} value={result.id}>
              {`${
                result.attributes?.chemical_formula_descriptive ||
                result.attributes?.chemical_formula_hill ||
                "Unknown"
              } (${result.id})`}
            </option>
          ))
        )}
      </select>
    </>
  );
}
