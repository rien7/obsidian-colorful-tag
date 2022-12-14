import { EditorView, Decoration } from "@codemirror/view"
import { syntaxTree } from "@codemirror/language"
import { WidgetType } from "@codemirror/view"
import { Range } from "@codemirror/state"


class ShadowTextWidget extends WidgetType {
    constructor(readonly text: string, readonly start: boolean) { super() }

    eq(other: ShadowTextWidget) { return other.text == this.text }

    toDOM() {
        let wrap = document.createElement("span")
        wrap.setAttribute("aria-hidden", "true")
        wrap.className = "colorful-tag-shadow-text"
        wrap.setText(this.text)
        if (this.start) {
            wrap.addClass("shadow-text-start")
        } else {
            wrap.addClass("shadow-text-end")
        }
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
                let shadowText = FileTagDetail.shadowText[i] || ""
                if (node.name.startsWith("formatting_formatting-hashtag_hashtag_hashtag-begin")) {
                    if (shadowText && shadowText[0] != "") {
                        let deco = Decoration.widget({
                            widget: new ShadowTextWidget(shadowText[0], true),
                            side: 0
                        })
                        widgets.push(deco.range(node.from))
                    }
                }
                if (node.name.startsWith("hashtag_hashtag-end")) {
                    if (shadowText && shadowText[1] != "") {
                        let deco = Decoration.widget({
                            widget: new ShadowTextWidget(shadowText[1], false),
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
        if (!(update.docChanged || update.focusChanged)) return
        this.decorations = shadowText(update.view)
    }
}, {
    decorations: v => v.decorations,

    eventHandlers: {

    }
})