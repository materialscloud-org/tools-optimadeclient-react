## OPTIMADE Client React App

A fully serverless single page app for interactively browsing optimade clients (as per https://www.optimade.org/providers-dashboard/).

Intended to be a lightweight and more maintainable solution to:
https://github.com/aiidalab/ipyoptimade

---

### Installation and running locally.

```sh
npm install
npm run dev
http://localhost:5173/mc-react-optimade-client/
```

### python anywidget

The querier is also exported as an AnyWidget that can be used in a Jupyter enviroment.

```sh
pip install widget-optimade-client
```

Usage:

```py
from optimadewidget.optimade_widget import OptimadeQuerierWidget
w = OptimadeQuerierWidget()            # or provider="mcloud", db="mc3d-pbesol-v2", or base_url="https://..."
w
w.selected_result                     # raw OPTIMADE entry of the selected structure
```

#### AiiDAlab

`pip install "widget-optimade-client[aiidalab]"` provides a structure importer for
`aiidalab_widgets_base.StructureManagerWidget` (exposes `title` and an `ase.Atoms` `structure` trait):

```py
from optimadewidget.aiidalab import OptimadeStructureImporter
from aiidalab_widgets_base import StructureManagerWidget

StructureManagerWidget(importers=[OptimadeStructureImporter(title="OPTIMADE")])
```

Disordered structures (partial occupancies, alloys, vacancies) cannot be imported and show an error message.

#### Building the widget

```sh
pnpm install
pnpm build:widget        # writes optimadewidget/widget-dist/, which the wheel must include
pip install -e ".[aiidalab]"
pytest tests
```

---
