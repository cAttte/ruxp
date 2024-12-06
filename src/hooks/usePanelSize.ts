import { useContext, useEffect, useState } from "react"
import { PanelContext } from "../components/Panel"
import { NoContextError } from "../errors"
import { panelRoots } from "../setup"
import * as events from "../events"

/**
 * Get the size of a given panel. If no ID is provided, the parent panel context is used.
 * @example
 * ```tsx
 * const MyPanel = () => {
 *     const { width, height } = usePanelSize()
 *     return <p>Size: {width}x{height}</p>
 * }
 * ```
 */
export function usePanelSize(id?: string): { width: number; height: number } {
    const panel = useContext(PanelContext)
    if (!panel && !id) throw new NoContextError("usePanelSize", "Panel")
    if (!id) id = panel!.id
    const root = panelRoots.get(id)

    const getCurrentSize = () => ({ width: root!.clientWidth, height: root!.clientHeight })
    const [size, setSize] = useState(getCurrentSize())

    // for some reason it initially reports 0x0, so we should "immediately" update it. thanks UXP!
    // let's pray this is enough of a workaround.
    useEffect(() => {
        const id = setTimeout(() => {
            const curSize = getCurrentSize()
            if (curSize.width !== size.width || curSize.height !== size.height) setSize(curSize)
        }, 100)

        return () => clearTimeout(id)
    }, [])

    useEffect(() => {
        events.panels[id].on("resize", setSize)
        return () => void events.panels[id].off("resize", setSize)
    }, [setSize])

    return size
}
