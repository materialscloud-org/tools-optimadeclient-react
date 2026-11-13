from importlib.resources import files

import anywidget
import traitlets


class OptimadeQuerierWidget(anywidget.AnyWidget):
    _esm = str(files("optimadewidget") / "widget-dist/optimade_widget.js")
    _css = str(files("optimadewidget") / "widget-dist/optimade_widget.css")

    # synced state between Python <-> JS
    # Initial target; leave empty to let the user pick from the providers list.
    base_url = traitlets.Unicode("").tag(sync=True)  # custom OPTIMADE endpoint
    provider = traitlets.Unicode("").tag(sync=True)  # provider id, e.g. "mcloud"
    db = traitlets.Unicode("").tag(sync=True)  # child database id of `provider`

    # The currently selected OPTIMADE structure entry (raw JSON:API resource),
    # or {} when nothing is selected.
    selected_result = traitlets.Dict({}).tag(sync=True)
