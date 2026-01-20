import { useState, useEffect, useRef } from "react";
import { getProviderLinks } from "../../../api";
import { longSlateDropdown } from "../../../styles/dropdownStyles";
import { baseButtonStyle } from "../../../styles/buttonStyles";

import { useQuery } from "@tanstack/react-query";

export default function ChildProviderDropdown({
  selectedProvider,
  selectedChild,
  onSelectChild,
}) {
  const [customInput, setCustomInput] = useState(
    selectedChild?.id === "__custom__" ? selectedChild.base_url : "",
  );

  const lastSubmittedCustom = useRef(customInput);

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
    if (!selectedProvider || selectedProvider.id === "__custom__") return;
    if (loadingChildren) return;

    if (childEntries.length === 1) {
      if (!selectedChild || selectedChild.id !== childEntries[0].id) {
        onSelectChild(childEntries[0]);
      }
    } else if (childEntries.length > 1) {
      if (
        selectedChild &&
        !childEntries.find((c) => c.id === selectedChild.id)
      ) {
        onSelectChild(null);
      }
    } else {
      if (selectedChild !== null) onSelectChild(null);
    }
  }, [
    selectedProvider,
    childEntries,
    loadingChildren,
    selectedChild,
    onSelectChild,
  ]);

  // Auto-submit the last custom URL if switching back to custom
  useEffect(() => {
    if (!selectedProvider) return;

    if (selectedProvider.id === "__custom__") {
      // Only submit if selectedChild is not the current custom input
      if (
        !selectedChild ||
        selectedChild.base_url !== lastSubmittedCustom.current
      ) {
        onSelectChild({
          id: "__custom__",
          name: "Custom Endpoint",
          base_url: lastSubmittedCustom.current,
        });
        setCustomInput(lastSubmittedCustom.current);
      }
    }
  }, [selectedProvider, selectedChild, onSelectChild]);

  if (!selectedProvider) return null;

  // Render custom input with submit button
  if (selectedProvider.id === "__custom__") {
    return (
      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          const newChild = {
            id: "__custom__",
            name: "Custom Endpoint",
            base_url: customInput,
          };
          lastSubmittedCustom.current = customInput; // save submitted value
          onSelectChild(newChild);
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
