import { FC, ReactNode, createContext, memo } from "react"
import { setup } from "../setup"

setup()
export const PluginContext = createContext(false)

/**
 * This is the root component that defines your plug-in and should only contain entry point components
 * (Panel or Command) and root-level mark-up. It should generally be at the top of your component tree.
 * @example
 * ```tsx
 * const MyPlugin = () => (
 *     <Plugin>
 *         <div className="h-full text-[white]">
 *             <Panel {...} />
 *         </div>
 *         <Command {...} />
 *     </Plugin>
 * )
 * ```
 */
export const Plugin: FC<{ children: ReactNode }> = memo(({ children }) => {
    return <PluginContext.Provider value={true}>{children}</PluginContext.Provider>
})
