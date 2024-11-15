import { ComponentType, FunctionComponent, ReactNode, createContext, useContext, useEffect, useRef } from "react"
import { PluginContext } from "./Plugin"
import { ItemData } from "./Item"
import { createPortal } from "react-dom"
import { panelRoots } from "../setup"
import { NoContextError } from "../errors"
import { entrypoints } from "uxp"

let psCore: any = (() => {
    try {
        // @ts-expect-error
        return require("photoshop").core
    } catch {}
})()

export type MenuContextValue = { insert: (item: ItemData) => void; remove: (id: string) => void }
export const MenuContext = createContext<MenuContextValue | null>(null)
export const PanelContext = createContext<entrypoints.UxpPanelInfo | null>(null)

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
    const parentDetectorRef = useRef<HTMLDivElement>(null)

    const root = panelRoots.get(id)
    const panel = entrypoints.getPanel(id)
    useEffect(() => void parentDetectorRef.current?.parentNode?.appendChild(root!), [])
    useEffect(() => void psCore?.suppressResizeGripper?.({ type: "panel", target: id, value: !gripper }), [gripper])

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
            <div ref={parentDetectorRef} className="__ruxp_internal__" style={{ display: "none !important" }} />
            {root ? createPortal(subtree, root) : subtree}
        </>
    )
}

export type PanelProps = {
    /** The unique panel identifier, as specified in the manifest file. */
    id: string
    /** A component or function to render inside of this panel. You should generally pass children directly; this prop is only for convenience. */
    render?: ComponentType
    /** The contents of this panel, plus any menu items. */
    children?: ReactNode
    /** **Since Photoshop 23.1**. Displays a [resize gripper](https://developer.adobe.com/photoshop/uxp/2022/ps_reference/media/photoshopcore/#suppressresizegripper) in the bottom-right corner of the panel. */
    gripper?: boolean
}
