import { ReactNode, useCallback, useContext, useEffect, useRef } from "react"
import { MenuContext, PanelContext } from "./Panel"
import * as events from "../events"
import { NoContextError } from "../errors"

let currentID = 0

/**
 * This component displays a menu item inside of a panel menu, or inside of a sub-menu if it is nested.
 * @example
 * ```tsx
 * const MyPanel = () => {
 *    const [sub, setSub] = useState(false)
 *    return (
 *        <Panel id="myPanel">
 *            <Item label="nice item" onInvoke={() => setSub(!sub)} />
 *            {sub && <Item label="nice sub-menu">
 *                <Item label="i agree" checked onInvoke={...} />
 *                <Item separator />
 *                <Item label="i don't" disabled />
 *            </Item>}
 *        </Panel>
 *    )
 * }
 * ```
 *
 * **Note:** when reactively mutating menu items in any way, make sure that the entire menu re-renders, so that each item has a chance to re-register in the correct order. For example:
 *
 * ```jsx
 * const MyMenu = () => (
 *     <>
 *         <Item label="First" />
 *         <CheckableItem />
 *         <Item label="Last" />
 *     </>
 * )
 *
 * const CheckableItem = () => {
 *     const [checked, setChecked] = useState(false)
 *     return <Item checked={checked} onInvoke={() => setChecked(!checked)} />
 * }
 * ```
 *
 * Once you click on the middle item, you will see that it gets moved all the way to the bottom. This is because every item re-registers itself in the parent menu _every time_ it renders, so the checkable item un-registers and re-registers, and so gets placed at the end—the items have no way of knowing _where_ they are. Instead, your entire `MyMenu` component should update, so that all of its item children re-register in order:
 *
 * ```jsx
 * const MyMenu = () => {
 *     const [checked, setChecked] = useState(false)
 *     return (
 *         <>
 *             <Item label="First" />
 *             <Item checked={checked} onInvoke={() => setChecked(!checked)} />
 *             <Item label="Last" />
 *         </>
 *     )
 * }
 * ```
 *
 * This is an annoying limitation, but it is hopefully not that bad because most panel menus and sub-menus are simple enough to be kept in one component. In the future, though, the implementation might change to only re-register when necessary (i.e. when items are added or re-ordered), and mutate in-place elsewhere.
 */
export const Item = (props: ItemProps) => {
    const menu = useContext(MenuContext)
    const panel = useContext(PanelContext)
    const idRef = useRef<string>()
    if (!idRef.current) idRef.current = `__ruxp_auto_${currentID++}__`
    const id = idRef.current

    const { label = "-", children = [], checked = false, disabled = false, onInvoke = () => {} } = props as AllItemProps
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
        const handler = (item: string) => item === id && onInvoke()
        events.items.on("invoke", handler)
        return () => void events.items.off("invoke", handler)
    }, [onInvoke])

    return children ? (
        <MenuContext.Provider value={{ insert: insertSubitem, remove: removeSubitem }}>{children}</MenuContext.Provider>
    ) : null
}

export type ItemData = { checked: boolean; enabled: boolean; label: string; id: string; submenu?: ItemData[] }

export type ParentItemProps = {
    /** The label this sub-menu will display. */
    label: string
    /** The items inside this sub-menu. */
    children?: ReactNode
}

export type ChildItemProps = {
    /** The label this menu item will display. */
    label: string
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

export type ItemProps = ChildItemProps | ParentItemProps | SeparatorProps
type AllItemProps = ChildItemProps & ParentItemProps & SeparatorProps
