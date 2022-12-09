import { EditorView, Decoration } from "@codemirror/view"
import { syntaxTree } from "@codemirror/language"
import { WidgetType } from "@codemirror/view"
import { Range } from "@codemirror/state"
import * as crypto from "crypto"


class ShadowTextWidget extends WidgetType {
    constructor(readonly text: string, readonly tagName: string) { super() }

    eq(other: ShadowTextWidget) { return other.text == this.text }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.setAttribute("aria-hidden", "true")
        wrap.className = "colorful-tag-shadow-text"
        wrap.setText(this.text)
        let hash = crypto.createHash("sha256")
        hash.update(this.tagName)
        let tag_id = hash.digest("hex").substring(0, 6)
        wrap.addClass(`shadow-text-${tag_id}`)
        return wrap
    }

    ignoreEvent() { return false }
}

function shadowText(view: EditorView) {
    let widgets: Range<Decoration>[] = []
    let i = 0
    for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from, to,
            enter: (node) => {
                if (node.name.startsWith("hashtag_hashtag-end_meta_tag-")) {
                    let shadowText = FileTagDetail.shadowText[i] || ""
                    if (shadowText != "") {
                        let deco = Decoration.widget({
                            widget: new ShadowTextWidget(shadowText, node.name.substring(29)),
                            side: 1
                        })
                        widgets.push(deco.range(node.to))
                    }
                    i++
                }
            }
        })
    }
    return Decoration.set(widgets)
}

import { ViewUpdate, ViewPlugin, DecorationSet } from "@codemirror/view"
import { FileTagDetail } from "src/tagDetail/fileTagDetail"

export const shadowTextPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
        this.decorations = shadowText(view)
    }

    update(update: ViewUpdate) {
        this.decorations = shadowText(update.view)
    }
}, {
    decorations: v => v.decorations,

    eventHandlers: {
    }
})