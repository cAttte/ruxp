// The other event dispatchers ({items, commands}.invoke) are implemented up in ../setup.
// But panel event dispatchers are implemented here (in ./panel/) because they're more complicated.

import { EventEmitter } from "eventemitter3"

import "./panel/resize"
import "./panel/visibilityChange"

export const panels: Record<string, PanelEventEmitter> = {}
export const items = new EventEmitter() as InvokeEventEmitter
export const commands = new EventEmitter() as InvokeEventEmitter

export type PanelEventEmitter = EventEmitter<{
    resize: (size: { width: number; height: number }) => void
    visibilityChange: (visible: boolean) => void
}>

export type InvokeEventEmitter = EventEmitter<{
    invoke: (id: string) => void
}>
