import fs from "fs";
import path from "path";
import {
  getProvidersList,
  getProviderLinks,
  getPTablePopulation,
} from "../src/api.js";

const OUTPUT_PATH = path.resolve("./public/cachedPTable.json");

const MAX_CONCURRENT_PROVIDERS = 8;

// Load previous cache
function loadCache() {
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));

      const data = raw.data ?? raw;

      const map = {};
      for (const entry of data) {
        map[entry.providerUrl] = entry.ptable;
      }

      return map;
    } catch (err) {
      console.warn("Failed to parse cache:", err);
      return {};
    }
  }
  return {};
}

function saveCache(resultMap) {
  const array = Object.entries(resultMap).map(([providerUrl, value]) => ({
    providerUrl,
    ...value,
  }));

  const payload = {
    lastUpdated: new Date().toISOString(),
    data: array,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
}

async function processProvider(provider, prevCache, resultMap) {
  const baseUrl = provider.attributes.base_url;
  if (!baseUrl || !baseUrl.startsWith("http")) return;

  let links;
  try {
    links = await getProviderLinks(baseUrl);
  } catch (err) {
    console.warn(`Failed to get provider links for ${provider.id}`, err);
    return;
  }

  if (links.error) {
    console.warn(`Provider ${provider.id} has no reachable children.`);
    return;
  }

  for (const child of links.children) {
    const url = child.attributes.base_url;
    if (!url || !url.startsWith("http")) continue;

    const existingCache = prevCache[url] || {};
    const batchSize = 32;

    let ptable;
    try {
      ptable = await getPTablePopulation({
        providerUrl: url,
        batchSize,
        existingCache,
      });
    } catch (err) {
      console.warn(`Failed to query PTable for ${url}`, err);
      continue;
    }

    const elementsOnly = Object.fromEntries(
      Object.entries(ptable).filter(([key]) => key !== "timing"),
    );

    const entry = Object.values(elementsOnly).every((v) => v === false)
      ? { all: false }
      : elementsOnly;

    resultMap[url] = {
      ptable: entry,
      avgTimePerRequest: ptable.timing,
    };

    saveCache(resultMap);
  }
}

async function main() {
  const prevCache = loadCache();
  const resultMap = { ...prevCache };

  const { data: providers } = await getProvidersList();
  const queue = [...providers];

  const workers = Array(MAX_CONCURRENT_PROVIDERS)
    .fill(0)
    .map(async () => {
      while (queue.length) {
        const provider = queue.shift();
        if (!provider) break;
        await processProvider(provider, prevCache, resultMap);
      }
    });

  await Promise.all(workers);

  console.log("\nAll providers processed. Final write complete:");
  console.log("cachedPTable.json:", OUTPUT_PATH);
}

main().catch((err) => {
  console.error("Fatal error in build script:", err);
  process.exit(1);
});
