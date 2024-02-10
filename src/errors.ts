export class NoContextError extends TypeError {
    constructor(child: string, id: string | null, provider: string) {
        super(`<${child}${id ? ` id="${id}"` : ""}> must be a descendant of <${provider}>.`)
    }
}
