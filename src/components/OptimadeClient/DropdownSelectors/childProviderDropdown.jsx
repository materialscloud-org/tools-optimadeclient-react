import { useState, useEffect } from "react";

import { getProviderLinks } from "../../../api";
import { longSlateDropdown } from "../../../styles/dropdownStyles";
import { baseButtonStyle } from "../../../styles/buttonStyles";

import { useQuery } from "@tanstack/react-query";

export default function ChildProviderDropdown({
  selectedProvider,
  selectedChild,
  onSelectChild,
}) {
  const [customInput, setCustomInput] = useState(selectedChild?.base_url || "");

  const { data, isLoading: loadingChildren } = useQuery({
    queryKey: ["provider-links", selectedProvider?.attributes?.base_url],
    queryFn: () => getProviderLinks(selectedProvider.attributes.base_url),
    enabled: !!selectedProvider?.attributes?.base_url,
    staleTime: Infinity,
  });

  const childEntries =
    data?.children?.map((c) => ({
      id: c.id,
      ...(c.attributes ?? {}),
    })) ?? [];

  useEffect(() => {
    if (!selectedProvider) {
      onSelectChild(null);
      return;
    }

    if (selectedProvider.id === "__custom__") {
      onSelectChild({
        id: "__custom__",
        name: "Custom Endpoint",
        base_url: customInput,
      });
    }
  }, [selectedProvider, onSelectChild]);

  if (!selectedProvider) {
    return <></>;
  }

  // Render custom input with submit button
  if (selectedProvider.id === "__custom__") {
    return (
      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault(); // prevent page reload
          onSelectChild({
            id: "__custom__",
            name: "Custom Endpoint",
            base_url: customInput,
          });
        }}
      >
        <input
          type="text"
          placeholder="Enter custom endpoint URL"
          className="flex-1 ring-1 ring-slate-300 rounded-sm px-2 py-1"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button
          className={`${baseButtonStyle} rounded-sm md:py-1!`}
          type="submit"
        >
          Submit
        </button>
      </form>
    );
  }

  // Render normal child dropdown
  return (
    <select
      className={longSlateDropdown}
      value={selectedChild?.id || ""}
      onChange={(e) => {
        const selected = childEntries.find((c) => c.id === e.target.value);
        onSelectChild(selected || null);
      }}
      disabled={loadingChildren}
    >
      {loadingChildren ? (
        <option>Loading…</option>
      ) : (
        <>
          <option value="" disabled>
            Select a subdatabase…
          </option>
          {childEntries.map((c) => (
            <option key={c.id} value={c.id}>
              {`${c.id}: ${c.name}`}
            </option>
          ))}
        </>
      )}
    </select>
  );
}
