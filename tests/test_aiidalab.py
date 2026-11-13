import pytest

pytest.importorskip("ase")

from optimadewidget.aiidalab import OptimadeStructureImporter, optimade_to_ase

SI = {
    "id": "si",
    "type": "structures",
    "attributes": {
        "lattice_vectors": [[0, 2.7, 2.7], [2.7, 0, 2.7], [2.7, 2.7, 0]],
        "cartesian_site_positions": [[0, 0, 0], [1.35, 1.35, 1.35]],
        "species_at_sites": ["Si1", "Si2"],
        "species": [
            {"name": "Si1", "chemical_symbols": ["Si"], "concentration": [1.0]},
            {"name": "Si2", "chemical_symbols": ["Si"], "concentration": [1.0]},
        ],
        "dimension_types": [1, 1, 1],
    },
}


def test_periodic_conversion():
    atoms = optimade_to_ase(SI)
    assert atoms.get_chemical_formula() == "Si2"
    assert all(atoms.pbc)
    assert atoms.cell[0][1] == pytest.approx(2.7)
    assert atoms.info["optimade_id"] == "si"


def test_molecule_with_null_lattice():
    entry = {
        "id": "co",
        "attributes": {
            "lattice_vectors": [[None] * 3] * 3,
            "cartesian_site_positions": [[0, 0, 0], [0, 0, 1.13]],
            "species_at_sites": ["C", "O"],
            "nperiodic_dimensions": 0,
        },
    }
    atoms = optimade_to_ase(entry)
    assert not any(atoms.pbc)
    assert atoms.get_chemical_symbols() == ["C", "O"]


@pytest.mark.parametrize(
    "species",
    [
        [{"name": "A", "chemical_symbols": ["Fe", "Ni"], "concentration": [0.5, 0.5]}],
        [{"name": "A", "chemical_symbols": ["Fe"], "concentration": [0.9]}],
        [{"name": "A", "chemical_symbols": ["X"], "concentration": [1.0]}],
    ],
)
def test_unsupported_species(species):
    entry = {
        "id": "bad",
        "attributes": {
            "lattice_vectors": [[3, 0, 0], [0, 3, 0], [0, 0, 3]],
            "cartesian_site_positions": [[0, 0, 0]],
            "species_at_sites": ["A"],
            "species": species,
        },
    }
    with pytest.raises(ValueError):
        optimade_to_ase(entry)


def test_missing_positions():
    with pytest.raises(ValueError, match="cartesian_site_positions"):
        optimade_to_ase({"id": "x", "attributes": {"species_at_sites": ["Si"]}})


def test_importer_structure_trait():
    importer = OptimadeStructureImporter(title="OPTIMADE", provider="mcloud")
    assert importer.title == "OPTIMADE"
    assert importer.querier.provider == "mcloud"
    assert importer.structure is None

    importer.querier.selected_result = SI
    assert importer.structure.get_chemical_formula() == "Si2"

    importer.querier.selected_result = {"id": "bad", "attributes": {}}
    assert importer.structure is None
    assert "Cannot import" in importer._message.value

    importer.querier.selected_result = {}
    assert importer.structure is None
    assert importer._message.value == ""
