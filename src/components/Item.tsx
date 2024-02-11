import { ReactNode, useCallback, useContext, useEffect, useRef } from "react"
import { MenuContext, PanelContext } from "./Panel"
import { handlers } from "../setup"
import { NoContextError } from "../errors"

export type ItemData = { checked: boolean; enabled: boolean; label: string; id: string; submenu?: ItemData[] }
export type BaseItemProps = {
    /** The label this menu item will display. */
    label: string
}
export type ParentItemProps = BaseItemProps & {
    /** The items inside this sub-menu. */
    children?: ReactNode
}
export type ChildItemProps = BaseItemProps & {
    /** Displays a checkmark next to the menu item. */
    checked?: boolean
    /** Displays the item grayed out. */
    disabled?: boolean
    /** A handler to execute when the menu item is invoked. */
    onInvoke?: () => void
}
export type SeparatorProps = {
    /** Marks this item as a separator; a thin horizontal line useful to group items together. */
    separator: true
}
export type ItemProps = ParentItemProps | ChildItemProps | SeparatorProps
let currentID = 0

/**
 * This component displays a menu item inside of a panel menu, or inside of a sub-menu if it is nested.
 */
export const Item = (props: ItemProps) => {
    const menu = useContext(MenuContext)
    const panel = useContext(PanelContext)
    const idRef = useRef<string>()
    if (!idRef.current) idRef.current = `__ruxp_auto_${currentID++}__`
    const id = idRef.current

    const { label = "-", children = [], checked = false, disabled = false, onInvoke = () => {} } = { ...props }
    if (!menu) throw new NoContextError("Item", null, "Panel/Item")
    if (!panel) throw new NoContextError("Item", null, "Panel")

    const subitems = useRef<Map<string, ItemData>>(new Map())
    const insertSubitem = useCallback((item: ItemData) => subitems.current.set(item.id, item), [])
    const removeSubitem = useCallback((itemID: string) => {
        subitems.current.delete(itemID)
        panel.menuItems.getItem(itemID).remove()
    }, [])

    useEffect(() => {
        const submenu = subitems.current.size ? Array.from(subitems.current.values()) : undefined
        menu.insert({ id, label, checked, enabled: !disabled, submenu })
        return () => menu.remove(id)
    })

    // TODO: do this instead of re-registering on every render
    // (this would break menu mutation, so keep the current behavior as a prop)
    // useEffect(() => {
    //     const self = panel.menuItems.getItem(id)
    //     if (!self) return
    //     self.checked = checked
    //     self.enabled = !disabled
    //     self.label = label
    // }, [checked, disabled, label])

    useEffect(() => {
        handlers.itemInvoke.set(id, onInvoke)
        return () => void handlers.itemInvoke.delete(id)
    }, [onInvoke])

    return children ? (
        <MenuContext.Provider value={{ insert: insertSubitem, remove: removeSubitem }}>{children}</MenuContext.Provider>
    ) : null
}
