import { useContext, useEffect, useState } from "react"
import { PanelContext } from "../components/Panel"
import { NoContextError } from "../errors"
import { visibilityState } from "../events/panel/visibilityChange"
import * as events from "../events"

/**
 * **Photoshop only**. Get the visibility state of a given panel. If no ID is provided, the parent panel context is used.
 * @returns undefined when outside of Photoshop.
 */
export function usePanelVisible(id?: string): boolean | undefined {
    const panel = useContext(PanelContext)
    if (!panel && !id) throw new NoContextError("usePanelVisible", "Panel")
    if (!id) id = panel!.id

    const [visible, setVisible] = useState(visibilityState[id])
    useEffect(() => {
        events.panels[id].on("visibilityChange", setVisible)
        return () => void events.panels[id].off("visibilityChange", setVisible)
    }, [setVisible])

    return visible
}
