import fs from "fs";
import path from "path";
import {
  getProvidersList,
  getProviderLinks,
  getElementsCount,
  getSitesCount,
} from "../src/api.js";

const OUTPUT_PATH = path.resolve("./public/counts.json");

async function processChild(url) {
  if (!url || !url.startsWith("http")) {
    console.log(`      Skipping invalid URL:`, url);
    return null;
  }

  console.log(`      Fetching counts for ${url}...`);

  const [elementsRes, sitesRes] = await Promise.all([
    getElementsCount({ providerUrl: url }),
    getSitesCount({ providerUrl: url }),
  ]);

  const result = {
    providerUrl: url,
    elements: { min: elementsRes.min, max: elementsRes.max },
    sites: { min: sitesRes.min, max: sitesRes.max },
  };

  console.log(
    `      Finished → Elements[min=${result.elements.min}, max=${result.elements.max}], Sites[min=${result.sites.min}, max=${result.sites.max}]`
  );

  return result;
}

async function processProvider(provider) {
  const baseUrl = provider.attributes.base_url;
  if (!baseUrl || !baseUrl.startsWith("http")) {
    console.log(
      `Skipping provider ${provider.id} (invalid base_url):`,
      baseUrl
    );
    return null;
  }

  console.log(`\n→ Provider: ${baseUrl}`);

  let links;
  try {
    links = await getProviderLinks(baseUrl);
  } catch (err) {
    console.log(`  Failed to fetch provider links:`, err.message);
    return null;
  }

  if (links.error) {
    console.log(`  Provider returned error`);
    return null;
  }

  console.log(`  Children: ${links.children.length}`);

  const childrenResults = [];
  for (const child of links.children) {
    const childData = await processChild(child.attributes.base_url);
    if (childData) childrenResults.push(childData);
  }

  return {
    providerUrl: baseUrl,
    children: childrenResults,
  };
}

async function main() {
  console.log("Loading providers list...");
  const { data: providers } = await getProvidersList();
  console.log(`Total providers: ${providers.length}`);

  const results = [];
  for (const provider of providers) {
    const providerData = await processProvider(provider);
    if (providerData) results.push(providerData);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log("\nDone. Counts written to", OUTPUT_PATH);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
