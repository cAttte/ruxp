import { useContext, useEffect, useState } from "react"
import { PanelContext } from "../components/Panel"
import { NoContextError } from "../errors"
import { panelRoots } from "../setup"
import * as events from "../events"

/**
 * Get the size of a given panel. If no ID is provided, the parent panel context is used.
 */
export function usePanelSize(id?: string): { width: number; height: number } {
    const panel = useContext(PanelContext)
    if (!panel && !id) throw new NoContextError("usePanelSize", "Panel")
    if (!id) id = panel!.id
    const root = panelRoots.get(id)

    const [size, setSize] = useState({ width: root!.clientWidth, height: root!.clientHeight })
    useEffect(() => {
        events.panels[id].on("resize", setSize)
        return () => void events.panels[id].off("resize", setSize)
    }, [setSize])

    return size
}
