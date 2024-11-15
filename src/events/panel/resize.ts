import { panelRoots } from "../../setup"
import * as events from ".."

export function setup() {
    for (const [id, root] of panelRoots.entries()) {
        root.addEventListener("resize", () =>
            events.panels[id].emit("resize", { width: root.clientWidth, height: root.clientHeight })
        )
    }
}

// we don't need a state here, as we do in ./visibilityChange, because the size *is* stored in the DOM.
// so the usePanelSize() hook can just get it from there.
