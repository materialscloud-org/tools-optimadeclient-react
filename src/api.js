import { corsProxies } from "./corsProxies.js";

import { elements } from "./components/OptimadeClient/OptimadeFilters/OptimadePTable/elements.js";

// --- Providers list ---
export async function getProvidersList(
  providersUrl = "https://raw.githubusercontent.com/Materials-Consortia/providers/refs/heads/master/src/links/v1/providers.json",
  excludeIds = [],
) {
  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  let json;
  try {
    json = await fetchJson(providersUrl);
  } catch (err) {
    console.warn(
      "Remote fetch failed, falling back to cachedProviders.json:",
      err,
    );
    try {
      json = await fetchJson("cachedProviders.json");
    } catch (fallbackErr) {
      console.error("Both remote and local fetches failed:", fallbackErr);
      throw fallbackErr;
    }
  }

  const filteredData = json.data.filter((p) => !excludeIds.includes(p.id));
  return { ...json, data: filteredData };
}

// --- Provider links ---
export async function getProviderLinks(baseUrl) {
  const extractChildren = (json) =>
    (json.data || []).filter((d) => d.attributes?.link_type === "child");

  const attempts = [
    { name: "direct", url: `${baseUrl}/v1/links` },
    ...corsProxies.map((proxy) => ({
      name: proxy.name,
      url: proxy.urlRule(`${baseUrl}/v1/links`),
    })),
  ];

  for (const { url, name } of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      return { children: extractChildren(json), error: null };
    } catch {
      continue;
    }
  }

  return { children: [], error: new Error("All fetch attempts failed") };
}

// --- Custom info fetch subdatabase info ---
export async function getCustomInfo({ baseUrl }) {
  const attempts = [
    { name: "direct", url: `${baseUrl}/info/` },
    ...corsProxies.map((proxy) => ({
      name: proxy.name,
      url: proxy.urlRule(`${baseUrl}/info/`),
    })),
  ];

  for (const { url, name } of attempts) {
    try {
      console.log("fetching via url", url);
      const res = await fetch(url);
      if (!res.ok) continue;

      const json = await res.json();

      return { meta: json.meta ?? {} };
    } catch {
      continue;
    }
  }
}

// --- Provider structure info ---
export async function getInfo({ providerUrl }) {
  const attempts = [
    { name: "direct", url: `${providerUrl}/v1/info/structures` },
  ];

  for (const { url, name } of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const json = await res.json();
      const filteredProps = Object.fromEntries(
        Object.entries(json.data.properties || {}).filter(([key]) =>
          key.startsWith("_"),
        ),
      );

      return {
        customProps: filteredProps,
        error: null,
        allProps: json.data.properties,
      };
    } catch {
      continue;
    }
  }

  return { customProps: {}, error: new Error("All fetch attempts failed") };
}

// --- Provider structures ---
export async function getStructures({
  providerUrl,
  filter = "",
  page = 1,
  pageSize = 20,
}) {
  if (!providerUrl) throw new Error("Provider URL is required");

  // We refetch the info here even though its already been fetched. This is a very clear area of inefficiency
  let allFields = [];
  try {
    const { customProps, error, allProps } = await getInfo({ providerUrl });
    if (error) console.warn("Could not fetch custom fields:", error);
    if (allProps) allFields = Object.keys(allProps);
  } catch (err) {
    console.warn("Error fetching custom fields:", err);
  }

  const preferredFields = [
    "cartesian_site_positions",
    "species_at_sites",
    "lattice_vectors",
    "chemical_formula_descriptive",
    "chemical_formula_hill",
  ];

  const mergedFields = Array.from(new Set([...preferredFields, ...allFields]));

  const offset = (page - 1) * pageSize;
  const queryString = filter
    ? `?filter=${encodeURIComponent(filter)}&page_offset=${offset}`
    : `?page_offset=${offset}`;

  // 4. Build URL with dynamic response_fields
  const urlWithFields = `${providerUrl}/v1/structures${queryString}&response_fields=${mergedFields.join(
    ",",
  )}`;

  const attempts = [
    { name: "direct", url: urlWithFields },
    ...corsProxies.map((proxy) => ({
      name: proxy.name,
      url: proxy.urlRule(urlWithFields),
    })),
  ];

  for (const { url } of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }

  throw new Error("All fetch attempts failed for getStructures");
}

export async function getElementsCount({ providerUrl }) {
  const start = performance.now();

  const minUrl = `${providerUrl}/v1/structures?sort=nelements&response_format=json&response_fields=nelements&page_limit=1`;
  const maxUrl = `${providerUrl}/v1/structures?sort=-nelements&response_format=json&response_fields=nelements&page_limit=1`;

  async function fetchValue(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const json = await res.json();
      const value = json?.data?.[0]?.attributes?.nelements;

      return typeof value === "number" ? value : null;
    } catch {
      return null;
    }
  }

  const min = await fetchValue(minUrl);
  const max = await fetchValue(maxUrl);

  const durationMs = performance.now() - start;

  return { min, max, durationMs };
}

export async function getSitesCount({ providerUrl }) {
  const start = performance.now();

  const minUrl = `${providerUrl}/v1/structures?sort=nsites&response_format=json&response_fields=nsites&page_limit=1`;
  const maxUrl = `${providerUrl}/v1/structures?sort=-nsites&response_format=json&response_fields=nsites&page_limit=1`;

  async function fetchValue(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const json = await res.json();
      const value = json?.data?.[0]?.attributes?.nsites;

      return typeof value === "number" ? value : null;
    } catch {
      return null;
    }
  }

  const min = await fetchValue(minUrl);
  const max = await fetchValue(maxUrl);

  const durationMs = performance.now() - start;

  return { min, max, durationMs };
}

// very messy divide and conquer strategy for returning the elements that exist in the PT.
// this strategy is very bad for very broad providers...
// Divide-and-conquer strategy for determining elements present in the provider
export async function getPTablePopulation({
  providerUrl,
  batchSize = 1,
  existingCache = {},
}) {
  const presentElements = new Set();
  const missingElements = [];

  let totalRequests = 0;
  let totalElementsQueried = 0;
  const startTime = performance.now();

  // Determine which elements we actually need to query
  // Check if existingCache indicates "all missing"
  if (
    !existingCache ||
    Object.keys(existingCache).length === 0 ||
    existingCache.all === false
  ) {
    // Everything is missing, so all elements should be queried
    missingElements.push(...elements);
  } else {
    for (const el of elements) {
      if (existingCache[el.sym] === false) {
        missingElements.push(el);
      } else {
        presentElements.add(el.sym);
      }
    }
  }

  async function queryBatch(batch) {
    if (batch.length === 0) return false;

    const syms = batch.map((b) => b.sym);
    const filter = `elements HAS ANY "${syms.join('", "')}"`;
    const queryString = `?filter=${encodeURIComponent(filter)}`;
    const url = `${providerUrl}/v1/structures${queryString}`;

    totalRequests++;
    totalElementsQueried += batch.length;

    // console.log(`Querying batch: [${syms.join(", ")}]`);

    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const json = await res.json();
      return json.data && json.data.length > 0;
    } catch (err) {
      console.warn(
        `Batch query failed on ${providerUrl}: [${syms.join(", ")}]`,
      );
      return false;
    }
  }

  async function checkBatch(batch) {
    if (batch.length === 0) return;

    const hasData = await queryBatch(batch);

    if (!hasData) return; // nothing present, skip subdividing
    if (batch.length === 1) {
      presentElements.add(batch[0].sym);
      return;
    }

    const mid = Math.floor(batch.length / 2);
    await checkBatch(batch.slice(0, mid));
    await checkBatch(batch.slice(mid));
  }

  // Initial batching
  for (let i = 0; i < missingElements.length; i += batchSize) {
    const batch = missingElements.slice(i, i + batchSize);
    await checkBatch(batch);
  }

  const endTime = performance.now();
  console.log(
    `\n====== URL ${providerUrl} finished batch searches. ======\nTotal elements queried: ${totalElementsQueried} \nTotal requests made: ${totalRequests}\nTotal time elapsed: ${(
      (endTime - startTime) /
      1000
    ).toFixed(
      2,
    )} seconds \n====== URL ${providerUrl} finished batch searches. ======\n`,
  );

  const elementMap = elements.reduce((acc, e) => {
    acc[e.sym] = presentElements.has(e.sym);
    return acc;
  }, {});
  return {
    ...elementMap, // <- top-level symbols (legacy)
    timing: avgTimePerRequest, // <- new field
  };
}
