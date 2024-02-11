import { FC, memo, useContext, useEffect } from "react"
import { handlers } from "../setup"
import { PluginContext } from "./Plugin"
import { NoContextError } from "../errors"

/** This component registers a command entry point within the parent plug-in. Its only feature is an event handler. */
export const Command: FC<{
    /** The unique command identifier, as specified in the manifest file. */
    id: string
    /** A handler to execute when the command is invoked. */
    onInvoke: () => void
}> = memo(({ id, onInvoke }) => {
    const setup = useContext(PluginContext)
    if (!setup) throw new NoContextError("Command", id, "Plugin")

    useEffect(() => {
        handlers.commandInvoke.set(id, onInvoke)
        return () => void handlers.commandInvoke.delete(id)
    }, [onInvoke])

    return null
})
