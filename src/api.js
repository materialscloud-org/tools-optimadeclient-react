import { corsProxies } from "./corsProxies.js";

import { elements } from "./components/OptimadeClient/OptimadeFilters/OptimadePTable/elements.js";

async function fetchWithCorsFallback(url) {
  const attempts = [
    { name: "direct", url },
    ...corsProxies.map((proxy) => ({
      name: proxy.name,
      url: proxy.urlRule(url),
    })),
  ];

  for (const { url: attemptUrl } of attempts) {
    try {
      const res = await fetch(attemptUrl);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }

  throw new Error("All fetch attempts failed");
}

// --- Providers list ---
// go to optimade url, if that fails use the fallback here.
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
  try {
    const json = await fetchWithCorsFallback(`${baseUrl}/v1/links`);

    const children = (json.data || []).filter(
      (d) => d.attributes?.link_type === "child",
    );

    return { children, error: null };
  } catch (err) {
    return { children: [], error: err };
  }
}

// --- Custom info fetch subdatabase info ---
export async function getCustomInfo({ baseUrl }) {
  try {
    const json = await fetchWithCorsFallback(`${baseUrl}/info/`);
    return { meta: json.meta ?? {} };
  } catch {
    return { meta: {} };
  }
}

// --- Provider structure info ---
export async function getInfo({ providerUrl }) {
  try {
    const json = await fetchWithCorsFallback(`${providerUrl}/info/structures`);

    const allProps = json.data?.properties ?? {};
    const customProps = Object.fromEntries(
      Object.entries(allProps).filter(([key]) => key.startsWith("_")),
    );

    return { customProps, allProps, error: null };
  } catch (err) {
    return { customProps: {}, allProps: {}, error: err };
  }
}

/* --- Provider structures ---
  Does some clever determination of what fields are missing and fetches those and merges in a second query.
*/
export async function getStructures({
  providerUrl,
  filter = "",
  page = 1,
  pageSize = 20,
}) {
  if (!providerUrl) throw new Error("Provider URL is required");

  await new Promise((r) => setTimeout(r, 1000)); // sleep 1 second

  const preferredFields = [
    "cartesian_site_positions",
    "species_at_sites",
    "lattice_vectors",
    "chemical_formula_descriptive",
    "chemical_formula_hill",
  ];

  const offset = (page - 1) * pageSize;

  const baseQuery = filter
    ? `?filter=${encodeURIComponent(filter)}&page_offset=${offset}`
    : `?page_offset=${offset}`;

  const baseUrl = `${providerUrl}/v1/structures${baseQuery}`;

  // --- 1. base fetch (no response_fields) ---
  let baseData;
  try {
    baseData = await fetchWithCorsFallback(baseUrl, corsProxies);
  } catch (err) {
    throw new Error("Failed to fetch base structures");
  }

  const structures = baseData?.data ?? [];
  if (!structures.length) return baseData;

  // --- 2. detect missing preferred fields ---
  const sampleAttrs = structures[0].attributes ?? {};
  const availableFields = new Set(Object.keys(sampleAttrs));

  const missingFields = preferredFields.filter((f) => !availableFields.has(f));

  if (!missingFields.length) {
    return baseData;
  }

  // --- 3. fetch missing fields only ---
  const fieldsUrl =
    `${providerUrl}/v1/structures` +
    `${baseQuery}&response_fields=${missingFields.join(",")}`;

  let fieldsData;
  try {
    fieldsData = await fetchWithCorsFallback(fieldsUrl, corsProxies);
  } catch (err) {
    console.warn("Failed to fetch missing fields, returning base response");
    return baseData;
  }

  // --- 4. merge by id ---
  const extraById = new Map(
    (fieldsData.data ?? []).map((s) => [s.id, s.attributes ?? {}]),
  );

  return {
    ...baseData,
    data: structures.map((s) => ({
      ...s,
      attributes: {
        ...s.attributes,
        ...(extraById.get(s.id) ?? {}),
      },
    })),
  };
}

// the following are only invoked as scripts and thus do not need cors.
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
