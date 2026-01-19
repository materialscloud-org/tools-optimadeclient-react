import { useState, useEffect } from "react";
import { getProviderLinks } from "../../../api";
import { longSlateDropdown } from "../../../styles/dropdownStyles";
import { baseButtonStyle } from "../../../styles/buttonStyles";

export default function ChildProviderDropdown({
  selectedProvider,
  selectedChild,
  onSelectChild,
}) {
  const [childEntries, setChildEntries] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [customInput, setCustomInput] = useState(selectedChild?.base_url || "");

  useEffect(() => {
    if (!selectedProvider || selectedProvider.id === "__custom__") {
      setChildEntries([]);
      if (selectedProvider?.id === "__custom__") {
        onSelectChild({
          id: "__custom__",
          name: "Custom Endpoint",
          base_url: customInput,
        });
      } else {
        onSelectChild(null);
      }
      return;
    }

    async function fetchChildren() {
      try {
        setLoadingChildren(true);
        const { children } = await getProviderLinks(
          selectedProvider.attributes.base_url,
        );
        const entries = children.map((c) => ({
          id: c.id,
          ...(c.attributes ?? {}),
        }));
        setChildEntries(entries);

        // auto-select if only one child
        if (entries.length === 1) onSelectChild(entries[0]);
        else onSelectChild(null);
      } catch (err) {
        console.error(err);
        setChildEntries([]);
        onSelectChild(null);
      } finally {
        setLoadingChildren(false);
      }
    }

    fetchChildren();
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
