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
w = OptimadeQuerierWidget()
w

```

---
