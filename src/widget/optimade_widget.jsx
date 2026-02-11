import React from "react";
import { createRoot } from "react-dom/client";
import { OptimadeQuerier } from "../components/OptimadeClient/OptimadeQuerier";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "../index.css";

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

  function update() {
    root.render(
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen max-w-5xl mx-auto bg-white mb-4">
          <OptimadeQuerier
            selectedResult={model.get("selected_result")}
            setSelectedResult={(value) => {
              model.set("selected_result", value);
              model.save_changes();
            }}
          />
        </div>
      </QueryClientProvider>,
    );
  }

  update();
  model.on("change", update);
}

export default { render };
