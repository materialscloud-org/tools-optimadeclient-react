"""AiiDAlab integration for the OPTIMADE querier widget.

AiiDAlab structure importers (as consumed by
``aiidalab_widgets_base.StructureManagerWidget``) are widgets that expose a
``title`` attribute and a ``structure`` trait holding an ``ase.Atoms`` object.
:class:`OptimadeStructureImporter` wraps :class:`OptimadeQuerierWidget` to
provide exactly that, converting the selected OPTIMADE entry on the fly.

Requires ``ase`` (``pip install widget-optimade-client[aiidalab]``).
"""

from __future__ import annotations

import html
import math

import ase
import ipywidgets as ipw
import numpy as np
import traitlets
from ase.data import atomic_numbers

from .optimade_widget import OptimadeQuerierWidget

__all__ = ["OptimadeStructureImporter", "optimade_to_ase"]


def optimade_to_ase(entry: dict) -> ase.Atoms:
    """Convert an OPTIMADE structure entry (JSON:API resource) to ``ase.Atoms``.

    Raises ``ValueError`` if the entry lacks the required fields or describes a
    structure ASE cannot represent (partial occupancies, alloys, vacancies,
    unknown species).
    """
    attributes = entry.get("attributes") or {}

    positions = attributes.get("cartesian_site_positions")
    species_at_sites = attributes.get("species_at_sites")
    if not positions or not species_at_sites:
        raise ValueError(
            "The provider did not return 'cartesian_site_positions' and "
            "'species_at_sites' for this entry, so it cannot be imported."
        )
    if len(positions) != len(species_at_sites):
        raise ValueError(
            "Inconsistent entry: number of positions and species differ."
        )

    # Map species name -> chemical symbol
    species = attributes.get("species")
    if species:
        symbol_of = {}
        for spec in species:
            symbols = spec.get("chemical_symbols") or []
            concentration = spec.get("concentration") or [1.0]
            if (
                len(symbols) != 1
                or len(concentration) != 1
                or not math.isclose(concentration[0], 1.0)
            ):
                raise ValueError(
                    f"Species '{spec.get('name')}' is disordered "
                    f"({symbols} with concentrations {concentration}); "
                    "disordered structures are not supported."
                )
            symbol_of[spec["name"]] = symbols[0]
    else:
        # Without `species`, site species names must be element symbols.
        symbol_of = {name: name for name in species_at_sites}

    try:
        symbols = [symbol_of[name] for name in species_at_sites]
    except KeyError as exc:
        raise ValueError(f"Site species {exc} is not defined in 'species'.") from exc

    # "X" (unknown) is in ASE's table as Z=0 but is not a real element.
    unsupported = sorted({s for s in symbols if s not in atomic_numbers or s == "X"})
    if unsupported:
        raise ValueError(f"Unsupported chemical symbol(s): {', '.join(unsupported)}.")

    # Periodicity
    dimension_types = attributes.get("dimension_types")
    if dimension_types is None:
        nperiodic = attributes.get("nperiodic_dimensions")
        if nperiodic is None:
            periodic = 1 if attributes.get("lattice_vectors") else 0
            dimension_types = [periodic] * 3
        else:
            dimension_types = [1] * nperiodic + [0] * (3 - nperiodic)
    pbc = [bool(d) for d in dimension_types]

    # Lattice: non-periodic directions may be given as nulls.
    lattice = attributes.get("lattice_vectors")
    cell = np.zeros((3, 3))
    if lattice:
        for i, vector in enumerate(lattice):
            if vector is not None and all(x is not None for x in vector):
                cell[i] = vector
    for i, periodic in enumerate(pbc):
        if periodic and not np.any(cell[i]):
            raise ValueError(
                f"Lattice vector {i + 1} is missing for a periodic direction."
            )

    atoms = ase.Atoms(symbols=symbols, positions=positions, cell=cell, pbc=pbc)
    atoms.info["optimade_id"] = entry.get("id")
    return atoms


class OptimadeStructureImporter(ipw.VBox):
    """OPTIMADE structure importer compatible with AiiDAlab's
    ``StructureManagerWidget``.

    Any keyword arguments besides ``title`` and ``layout`` are forwarded to
    :class:`OptimadeQuerierWidget` (e.g. ``provider="mcloud"``, ``db="mc3d"``
    or ``base_url=...``).
    """

    structure = traitlets.Instance(ase.Atoms, allow_none=True)

    def __init__(self, title: str = "OPTIMADE", layout=None, **querier_kwargs):
        self.title = title
        self.querier = OptimadeQuerierWidget(**querier_kwargs)
        self._message = ipw.HTML()
        super().__init__(
            children=[self.querier, self._message],
            layout=layout or ipw.Layout(width="100%"),
        )
        self.querier.observe(self._on_selected_result, "selected_result")
        self._on_selected_result({"new": self.querier.selected_result})

    def _on_selected_result(self, change):
        entry = change["new"]
        self._message.value = ""
        if not entry:
            self.structure = None
            return
        try:
            self.structure = optimade_to_ase(entry)
        except ValueError as exc:
            self.structure = None
            self._message.value = (
                "<div style='color: #b91c1c; padding: 4px 8px;'>"
                f"Cannot import <code>{html.escape(str(entry.get('id', '')))}</code>: "
                f"{html.escape(str(exc))}</div>"
            )
