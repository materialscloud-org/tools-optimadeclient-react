import anywidget
import traitlets


class OptimadeQuerierWidget(anywidget.AnyWidget):
    _esm = "widget-dist/optimade_widget.js"
    _css = "widget-dist/optimade_widget.css"

    # synced state between Python ↔ JS
    base_url = traitlets.Unicode("").tag(sync=True)
    db = traitlets.Unicode("").tag(sync=True)

    selected_result = traitlets.Dict({}).tag(sync=True)
