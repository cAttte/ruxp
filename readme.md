# Reactive UXP

**ruxp** is a light wrapper over [Adobe UXP](https://developer.adobe.com/photoshop/)'s [setup()](https://developer.adobe.com/indesign/uxp/plugins/tutorials/adding-command-entrypoints/) API that lets you define your plug-in's entry points using React components, rather than a clunky, static object and [disgusting helper classes](https://github.com/AdobeDocs/uxp-photoshop-plugin-samples/blob/1928d832d9351627a319de6e341e3cfad0ef9ced/ui-react-starter/src/controllers/PanelController.jsx). A simple set-up looks like this:

```tsx
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Plugin, Panel, Item, Command } from "ruxp"

const MyPlugin = () => {
    const [good, setGood] = useState(true)
    const doGood = () => setGood(true)
    const doBad = () => setGood(false)

    return (
        <Plugin>
            <Panel id="nicePanel">
                <NicePanel good={good} />
                <Item label="Do something...">
                    <Item label="...good" checked={good} onInvoke={doGood} />
                    <Item label="...bad" checked={!good} onInvoke={doBad} />
                </Item>
            </Panel>
            <Command id="doGood" onInvoke={doGood} />
            <Command id="doBad" onInvoke={doBad} />
        </Plugin>
    )
}

// (you could just put your state and menu items down here)
const NicePanel = ({ good }) => <p>i'm {good ? "good" : "bad"}</p>

createRoot(document.querySelector("#root")).render(<MyPlugin />)
```

<details>
    <summary>Compare it to the equivalent vanilla code</summary>

```tsx
import { entrypoints } from "uxp"
import { createRoot } from "react-dom/client"
import { useState, useEffect, useSyncExternalStore } from "react"

entrypoints.setup({
    panels: {
        nicePanel: {
            create(root) {
                createRoot(root).render(<NicePanel />)
            },
            menuItems: [
                {
                    id: "doSomething",
                    label: "Do something...",
                    submenu: [
                        { id: "doSomethingGood", label: "...good", checked: true },
                        { id: "doSomethingBad", label: "...bad" }
                    ]
                }
            ],
            invokeMenu(id) {
                if (id == "doSomethingGood") goodness.doGood()
                else if (id == "doSomethingBad") goodness.doBad()
            }
        }
    },
    commands: {
        doGood: {
            run: () => goodness.doGood()
        },
        doBad: {
            run: () => goodness.doBad()
        }
    }
})

const goodness = {
    state: true,
    doGood: () => ((this.state = true), this.update?.()),
    doBad: () => ((this.state = false), this.update?.())
}

function NicePanel() {
    const good = useSyncExternalStore(
        cb => {
            goodness.update = cb
            return () => delete goodness.update
        },
        () => goodness.state
    )

    useEffect(() => {
        const getItem = id => entrypoints.getPanel("nicePanel").menuItems.getItem(id)
        getItem("doSomethingGood").checked = good
        getItem("doSomethingBad").checked = !good
    }, [good])

    return <p>i'm {good ? "good" : "bad"}</p>
}
```

(At this point, you'd want to use a global state management library). In this case, you don't actually need the `useEffect` because the state lives outside, but it helps to illustrate what it would look like if you needed to derive UXP state from existing React state.

<hr/>

</details>

This not only lets you use the nicer-looking JSX for configuration, but it also makes mutating properties reactively and providing event handlers a breeze through a declarative API, all while sharing a common React root and its corollaries, such as contexts and state.

## Installation

```
npm i ruxp
```

## Usage

ruxp only exposes a few React components, which you can use to configure and manage your plug-in.

-   [Plugin](#Plugin)
-   [Panel](#Panel)
-   [Item](#Item)
-   [Command](#Command)

### Plugin

This is the root component that defines your plug-in and should only contain entry point components ([Panel](#Panel) / [Command](#Command)) and root-level mark-up. It should generally be at the top of your component tree.

```tsx
const MyPlugin = () => (
    <Plugin>
        <div className="h-full text-[white]">
            <Panel {...} />
        </div>
        <Command {...} />
    </Plugin>
)
```

### Panel

This component registers a panel entry point within your plug-in. It contains everything that should be rendered inside of the panel.

-   **id** `string`: The unique panel identifier, as specified in the manifest file.
-   **children** `ReactNode`: The contents of this panel, plus any menu items.
-   **render** `FunctionComponent`: A function that renders the contents of this panel. Generally, you should pass children directly; this prop is only useful if you want to separate your DOM rendering logic from your menu rendering logic.

```tsx
<Panel id="nicePanel">
    <Item label="hey" />
    <p>this is a nice panel for sure</p>
</Panel>
```

```tsx
<Panel id="myPanel" render={MyPanel} />
```

### Item

This component displays a menu item within the parent menu, which can either be a Panel's fly-out menu or another Item's sub-menu; items can be nested.

-   **label** `string`: The label this menu item will display.
-   **checked?** `boolean`: Displays a checkmark next to the menu item.
-   **disabled?** `boolean`: Displays the item grayed out.
-   **onInvoke?** `() => void`: A handler to execute when the menu item is invoked.

or, for sub-menu parent items:

-   **label** `string`: The label that this sub-menu will display.
-   **children** `ReactNode`: The items inside this sub-menu.

or, for item separators:

-   **separator** `true`: Marks this item as a separator; a thin horizontal line useful to group items together.

```tsx
const MyPanel = () => (
    <Panel id="myPanel">
        <Item label="nice item" onInvoke={() => console.log("yea")} />
        <Item label="nice sub-menu">
            <Item label="i agree" checked onInvoke={...} />
            <Item separator />
            <Item label="i don't" disabled />
        </Item>
    </Panel>
)
```

### Command

This component registers a command entry point within the parent plug-in. Its only feature is an event handler.

-   **id** `string`: The unique command identifier, as specified in the manifest file.
-   **onInvoke** `() => void`: A handler to execute when the command is invoked.

```tsx
const MyPlugin = () => (
    <Plugin>
        <Command id="myCommand" onInvoke={() => console.log("my command invoked!")} />
    </Plugin>
)
```

## License

This project is under the [MIT License](./license).
