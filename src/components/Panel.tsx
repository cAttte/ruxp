import { ComponentType, FunctionComponent, ReactNode, createContext, useContext, useEffect, useRef } from "react"
import { PluginContext } from "./Plugin"
import { ItemData } from "./Item"
import { createPortal } from "react-dom"
import { panelRoots } from "../setup"
import { NoContextError } from "../errors"
import { entrypoints } from "uxp"

let pscore: any = null
import("photoshop").then(ps => (pscore = ps.core)).catch(() => {})

export type MenuContextValue = { insert: (item: ItemData) => void; remove: (id: string) => void }
export const MenuContext = createContext<MenuContextValue | null>(null)
export const PanelContext = createContext<entrypoints.UxpPanelInfo | null>(null)

export type PanelProps = {
    /** The unique panel identifier, as specified in the manifest file. */
    id: string
    /** A component to render inside of this panel. Generally, you should pass children directly; this prop is only useful if you want to separate your DOM rendering logic from your menu rendering logic. */
    render?: ComponentType
    /** The contents of this panel, plus any menu items. */
    children?: ReactNode
    /** Displays a [resize gripper](https://developer.adobe.com/photoshop/uxp/2022/ps_reference/media/photoshopcore/#suppressresizegripper) in the bottom-right corner of the panel. Available from Photoshop 23.1. */
    gripper?: boolean
}

/**
 * This component registers a panel entry point within your plug-in. It contains everything that
 * should be rendered inside of the panel.
 */
export const Panel: FunctionComponent<PanelProps> = ({
    id,
    children,
    gripper = false,
    render: Children = () => null
}) => {
    const setup = useContext(PluginContext)
    if (!setup) throw new NoContextError("Panel", id, "Plugin")
    const rootDetectorRef = useRef<HTMLDivElement>(null)

    const root = panelRoots.get(id)
    const panel = entrypoints.getPanel(id)
    useEffect(() => void rootDetectorRef.current?.parentNode?.appendChild(root!), [])
    useEffect(() => void pscore?.suppressResizeGripper?.({ type: "panel", target: id, value: !gripper }), [gripper])

    const menu = entrypoints.getPanel(id).menuItems
    const insertItem = (item: ItemData) => menu.insertAt(menu.size, item)
    const removeItem = (itemID: string) => menu.getItem(itemID).remove()

    const subtree = (
        <PanelContext.Provider value={panel}>
            <MenuContext.Provider value={{ insert: insertItem, remove: removeItem }}>
                {children}
                <Children />
            </MenuContext.Provider>
        </PanelContext.Provider>
    )

    return (
        <>
            <div ref={rootDetectorRef} className="__ruxp_internal__" style={{ display: "none" }} />
            {root ? createPortal(subtree, root) : subtree}
        </>
    )
}
