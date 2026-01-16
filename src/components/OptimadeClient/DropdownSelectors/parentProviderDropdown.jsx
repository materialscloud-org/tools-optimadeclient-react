import { longSlateDropdown } from "../../../styles/dropdownStyles";

export default function ParentProviderDropdown({
  providers,
  selectedProvider,
  onSelectProvider,
}) {
  // derive the select value
  const selectValue = selectedProvider
    ? selectedProvider.id === "__custom__"
      ? "__custom__"
      : selectedProvider.attributes.base_url
    : "__none__";

  return (
    <select
      className={longSlateDropdown}
      value={selectValue}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "__custom__") {
          onSelectProvider({ id: "__custom__", attributes: { base_url: "" } });
        } else {
          const selected = providers.find(
            (p) => p.attributes?.base_url === val
          );
          onSelectProvider(selected || null);
        }
      }}
    >
      <option value="__none__" disabled>
        Select a provider…
      </option>
      {providers.map((p) => (
        <option
          key={p.attributes?.id ?? p.id ?? p.attributes?.base_url}
          value={p.attributes?.base_url || ""}
        >
          {`${p.id}: ${p.attributes?.name}`}
        </option>
      ))}
      <option value="__custom__">Custom endpoint…</option>
    </select>
  );
}
