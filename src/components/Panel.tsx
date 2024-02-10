import {
    Dispatch,
    SetStateAction,
    createContext,
    memo,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react"
import { PluginContext } from "./Plugin"
import { ItemData } from "./Item"
import { createPortal } from "react-dom"
import { panelRoots } from "../setup"
import { NoContextError } from "../errors"
import uxp, { entrypoints } from "uxp"

export type MenuContextValue = { insert: (item: ItemData) => void; remove: (id: string) => void }
export const MenuContext = createContext<MenuContextValue | null>(null)
export const PanelContext = createContext<entrypoints.UxpPanelInfo | null>(null)

export type PanelProps = {
    /** The unique panel identifier, as specified in the manifest file. */
    id: string
    /** A function that renders the contents of this panel. Generally, you should pass children directly; this prop is only useful if you want to separate your DOM rendering logic from your menu rendering logic. */
    render?: React.FunctionComponent
    /** The contents of this panel, plus any menu items. */
    children?: React.ReactNode
}

/**
 * This component registers a panel entry point within your plug-in. It contains everything that
 * should be rendered inside of the panel.
 */
export const Panel: React.FunctionComponent<PanelProps> = ({ id, children, render: PanelComponent = () => null }) => {
    const setup = useContext(PluginContext)
    if (!setup) throw new NoContextError("Panel", id, "Plugin")
    const rootDetectorRef = useRef<HTMLDivElement>(null)

    const root = panelRoots.get(id)
    useEffect(() => void rootDetectorRef.current?.parentNode?.appendChild(root!), [])
    const panel = uxp.entrypoints.getPanel(id)

    const menu = uxp.entrypoints.getPanel(id).menuItems
    const insertItem = useCallback((item: ItemData) => menu.insertAt(menu.size, item), [])
    const removeItem = useCallback((itemID: string) => menu.getItem(itemID).remove(), [])

    const subtree = (
        <PanelContext.Provider value={panel}>
            <MenuContext.Provider value={{ insert: insertItem, remove: removeItem }}>
                {children}
                <PanelComponent />
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
