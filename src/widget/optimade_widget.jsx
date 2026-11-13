import React from "react";
import { createRoot } from "react-dom/client";
import { OptimadeQuerier } from "../components/OptimadeClient/OptimadeQuerier";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Widget-specific stylesheet: no global Tailwind preflight, so the host
// notebook / AiiDAlab app is not restyled.
import "./widget.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function render({ model, el }) {
  const root = createRoot(el);

  const setSelectedResult = (value) => {
    model.set("selected_result", value ?? {});
    model.save_changes();
  };

  function update() {
    const baseUrl = model.get("base_url") || null;
    const provider = model.get("provider") || null;
    const db = model.get("db") || null;
    const selected = model.get("selected_result");

    root.render(
      <QueryClientProvider client={queryClient}>
        <div className="optimade-widget max-w-5xl mx-auto bg-white mb-4">
          <OptimadeQuerier
            // Remount when the initial target changes, since the querier only
            // reads these props when it is first mounted.
            key={`${baseUrl}|${provider}|${db}`}
            customUrl={baseUrl}
            providerParam={provider}
            dbParam={db}
            selectedResult={
              selected && Object.keys(selected).length ? selected : null
            }
            setSelectedResult={setSelectedResult}
          />
        </div>
      </QueryClientProvider>,
    );
  }

  update();
  model.on("change", update);

  return () => {
    model.off("change", update);
    root.unmount();
  };
}

export default { render };
