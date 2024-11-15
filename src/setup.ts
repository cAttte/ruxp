import { entrypoints } from "uxp"
import * as events from "./events"

// UXP bug forces you to call entrypoints.setup() within ~20ms, but mounting takes ~500ms
// <https://developer.adobe.com/xd/uxp/uxp/known-issues/#general-issues>
export function setup() {
    // @ts-expect-error: internal (but shouldn't be)
    const manifest = entrypoints._pluginInfo.manifest as Record<"panels" | "commands", { id: string }[]>
    const setup = { panels: {}, commands: {} } as entrypoints.Entrypoints

    if (manifest.commands)
        for (const { id } of Object.values(manifest.commands))
            setup.commands![id] = {
                // @ts-expect-error: shit typings
                run: () => events.commands.emit("invoke", id)
            }

    if (manifest.panels)
        for (const { id } of Object.values(manifest.panels)) {
            createPanelRoot(id)
            setup.panels![id] = {
                menuItems: [],
                // @ts-expect-error: shit typings
                invokeMenu: item => events.items.emit("invoke", item),
                // @ts-expect-error: shit typings
                show: () => {}
                // TODO: does MV4 have any bearing on this? ^ // TODO: ???
            }
        }

    entrypoints.setup(setup)
}

// UXP must hold a particular DOM node from which to display each panel (the root),
// but since we're configuring entry points before React gets to render these nodes, we
// need to create root elements for each panel and later insert them in the React tree.
// (the <uxp-panel panelid="" /> format allows these to get automatically picked up by UXP)
export const panelRoots = new Map<string, HTMLUnknownElement>()
function createPanelRoot(id: string) {
    const root = document.createElement("uxp-panel")
    root.setAttribute("panelid", id)
    document.body.appendChild(root)
    panelRoots.set(id, root)
}
