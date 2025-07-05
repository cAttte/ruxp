import { panels } from ".."
import { entrypoints } from "uxp"

let psAction: any = (() => {
    try {
        return require("photoshop").action
    } catch {}
})()

// there is no DOM to attach state to, so we just wing it with this ad-hoc thing. we need state in order to
// synchronously provide visibility state on start-up (rather than having to wait for the first event to fire,
// causing a short undefined state for the usePanelVisible() caller).
const state: Record<string, boolean> = {}
export const visibilityState = state as Readonly<typeof state>

export function setup() {
    update()
    document.addEventListener("uxpcommand", ({ commandId: event }: any) => {
        if (event == "uxphidepanel" || event == "uxpshowpanel") update()
    })
}

// this prefix is given to the plugin by UXP.
// @ts-expect-error: _pluginInfo is internal (but shouldn't be)
const PLUGIN_PREFIX = `panelid.dynamic.uxp/${entrypoints._pluginInfo.id}/`

function update() {
    const list = psAction?.batchPlay(
        [
            {
                _obj: "get",
                _target: [{ _property: "panelList" }, { _ref: "application", _enum: "ordinal", _value: "targetEnum" }]
            }
        ],
        { synchronousExecution: true }
    )?.[0]?.panelList as { ID?: string; visible?: boolean }[] | undefined
    if (!list) return

    for (const panel of list) {
        if (!panel?.ID?.startsWith(PLUGIN_PREFIX)) continue // skip external panels
        const id = panel.ID!.slice(PLUGIN_PREFIX.length)

        state[id] = panel.visible!
        panels[id].emit("visibilityChange", panel.visible!)
    }
}
