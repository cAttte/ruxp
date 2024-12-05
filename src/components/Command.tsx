import { FunctionComponent, memo, useContext, useEffect } from "react"
import { PluginContext } from "./Plugin"
import { NoContextError } from "../errors"
import * as events from "../events"

/**
 * This component registers a command entry point within the parent plug-in. Its only feature is the `onInvoke` event handler.
 * @example
 * ```tsx
 * const MyPlugin = () => {
 *     <Plugin>
 *         <Command id="do-stuff" onInvoke={() => alert("done!")} />
 *     </Plugin>
 * }
 * ```
 */
export const Command: FunctionComponent<{
    /** The unique command identifier, as specified in the manifest file. */
    id: string
    /** A handler to execute when the command is invoked. */
    onInvoke: () => void
}> = memo(({ id, onInvoke }) => {
    const setup = useContext(PluginContext)
    if (!setup) throw new NoContextError("Command", id, "Plugin")

    useEffect(() => {
        const handler = (cmd: string) => cmd === id && onInvoke()
        events.commands.on("invoke", handler)
        return () => void events.commands.off("invoke", handler)
    }, [onInvoke])

    return null
})
