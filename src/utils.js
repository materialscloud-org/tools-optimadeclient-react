import { Site, CrystalStructure } from "matsci-parse";

export function optimadeToCrystalStructure(optimade) {
  if (!optimade || !optimade.attributes) {
    throw new Error("Invalid OPTIMADE object");
  }

  const lattice = optimade.attributes.lattice_vectors;
  const positions = optimade.attributes.cartesian_site_positions;
  const speciesAtSites = optimade.attributes.species_at_sites;

  if (!lattice || !positions || !speciesAtSites) {
    throw new Error("Malformed OPTIMADE structure");
  }

  // Build unique species list
  const species = [];
  const speciesIndexMap = new Map();

  speciesAtSites.forEach((el) => {
    if (!speciesIndexMap.has(el)) {
      speciesIndexMap.set(el, species.length);
      species.push(el);
    }
  });

  const sites = positions.map((pos, i) => {
    const el = speciesAtSites[i];
    const speciesIndex = speciesIndexMap.get(el);

    return new Site(
      speciesIndex,
      [pos[0], pos[1], pos[2]],
      {}, // props optional
    );
  });

  return new CrystalStructure({
    lattice,
    species,
    sites,
  });
}
