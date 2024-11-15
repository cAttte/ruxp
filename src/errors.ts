export class NoContextError extends TypeError {
    constructor(hook: `use${string}`, provider: string)
    constructor(child: string, id: string | null, provider: string)
    constructor(_thing: string, _idOrProvider: string | null, definitelyProvider?: string) {
        if (definitelyProvider) {
            const [child, id, provider] = arguments
            super(`<${child}${id ? ` id="${id}"` : ""}> must be a descendant of <${provider}>.`)
        } else {
            const [hook, provider] = arguments
            super(`${hook}() must be used in a descendant of <${provider}>.`)
        }
    }
}
