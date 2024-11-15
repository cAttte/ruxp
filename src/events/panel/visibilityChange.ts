import { panels } from ".."
import { entrypoints } from "uxp"

let psAction: any = (() => {
    try {
        // @ts-expect-error
        return require("photoshop").action
    } catch {}
})()

// @ts-expect-error: _pluginInfo is internal (but shouldn't be). this prefix is given to the plugin by UXP
const thisPluginPrefix = `panelid.dynamic.uxp/${entrypoints._pluginInfo.id}/`

update()
document.addEventListener("uxpcommand", ({ commandId: event }: any) => {
    if (event == "uxphidepanel" || event == "uxpshowpanel") update()
})

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
        if (!panel?.ID?.startsWith(thisPluginPrefix)) continue // skip external panels
        const id = panel.ID!.slice(thisPluginPrefix.length)
        panels[id].emit("visibilityChange", panel.visible!)
    }
}
