// this is a very custom documentation generator that tries to represent the few of ruxp's typings in a compact and sensible way—
// especially component props which would otherwise be abstracted away into a mess of interfaces.
// this isn't very maintainable but i got tired of copy-pasting from doc comments

import fs from "fs/promises"
import * as typedoc from "typedoc"

const app = await typedoc.Application.bootstrap({ entryPoints: ["src/index.ts"] })

const project = (await app.convert())!

const render = () => {
    let output = ""
    // specify a custom component order. no typedoc option for this (or for export order), which complicates Everything
    const comps = ["Plugin", "Panel", "Item", "Command"]
    const hooks = project.children!.filter(ch => ch.name.startsWith("use")).map(ch => ch.name)

    for (const name of [...comps, ...hooks]) {
        const thing = project.children!.find(ch => ch.name === name)!
        output += `\n### ${thing.name}\n\n`

        const isComponent = thing.name[0].toUpperCase() == thing.name[0]
        const isHook = thing.name.startsWith("use")

        const comment = (isHook ? thing.signatures![0] : thing).comment!
        const summary = flattenMarkdown(comment.summary)
        if (summary) output += summary

        if (isComponent) {
            const propsParam = thing.signatures?.[0].parameters?.[0]
            if (propsParam?.name == "props") output += "\n" + renderPropsType(thing.name + "Props")
        } else if (isHook) {
            const sig = thing.signatures![0]
            sig.parameters?.map(renderParamOrProperty).join("\n")
        }

        const examples = comment.blockTags.filter(({ tag }) => tag === "@example").map(x => x.content)
        if (examples.length) output += "\n\n" + examples.map(flattenMarkdown).join("\n\n") + "\n"
    }

    const toc = (list: string[]) => list.map(x => `-   [${x}](#${x})`).join("\n")

    return `
ruxp only exposes a few React components, which you can use to configure and manage your plug-in.

${toc(comps)}

It also exposes a few React hooks, which are useful for inspecting UXP state.

${toc(hooks)}

${output.trim()}`
}

const renderParamOrProperty = (thing: typedoc.ParameterReflection | typedoc.DeclarationReflection) => {
    const name = thing.name + (thing.flags.isOptional ? "?" : "")
    const desc = flattenMarkdown(thing.comment?.summary)
    const type = (thing.type! as typedoc.ReferenceType | typedoc.IntrinsicType).name
    return `-   **${name}** \`${type}\`${desc ? ": " + desc : ""}`
}

const renderPropsType = (name: string): string => {
    const props = project.children!.find(ch => ch.name === name)?.type

    if (props instanceof typedoc.ReflectionType) {
        return "\n" + props.declaration.children!.map(renderParamOrProperty).join("\n")
    } else if (props instanceof typedoc.UnionType) {
        // this is tailored to Item and its ItemProps union type
        return props.types
            .map((member, i) => {
                const name = (member as typedoc.ReferenceType).name
                const label = name.replace(/Props$/, "").replace(/[A-Z]/g, x => " " + x.toLowerCase())
                return (i > 0 ? `or, for${label}s:\n` : "") + renderPropsType(name)
            })
            .join("\n\n")
    } else {
        return ""
    }
}

const flattenMarkdown = (src: typedoc.CommentDisplayPart[] = []) =>
    src
        .filter(part => part.kind === "text" || part.kind === "code")
        .map(part => part.text)
        .join("")

const [open, close] = ["<!-- #region doc-gen -->\n", "\n<!-- #endregion -->"]

const output = render()
const readmeInput = await fs.readFile("./readme.md", "utf-8")
const readmeOutput = readmeInput.replace(new RegExp(open + ".+?" + close, "s"), open + output + close)
await fs.writeFile("./readme.md", readmeOutput)
