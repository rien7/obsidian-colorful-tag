import ColorfulTag from "main";
import { perTagDetail } from "src/tagDetail/perTagDetail";
import { PerTagSetting } from "src/setting/perTagSetting";
import { FileTagDetail } from "./fileTagDetail";

export class TagDetailUtils {
    private static listener: (e: Event) => void
    static fileTagDetail: FileTagDetail

    static async hoverTagPopupListener(plugin: ColorfulTag) {
        if (!plugin.settings.UseTagDetail) return;
        
        // TODO: add listener for reading mode
        let tags_dom = document.querySelectorAll(".workspace-leaf.mod-active .cm-hashtag.cm-hashtag-end")
        if (tags_dom.length == 0) return

        let map: Map<string, PerTagSetting> = new Map()
        plugin.settings.TagSettings.forEach((v) => {
            map.set(v.name, v)
        })

        TagDetailUtils.fileTagDetail = new FileTagDetail(plugin)
        await TagDetailUtils.fileTagDetail.getFrontmatter()

        tags_dom.forEach((tagDom, i) => {
            let tag = map.get(tagDom.getText().split("/")[0])
            if (tag == undefined) return;
            if (!tag.enable) return;
            let detailAttr = tag.tagDetail.attributes as Map<string, string | null>
            if (detailAttr.size == 0) return;
            let prev = tagDom.previousElementSibling!;
            let perTag = new perTagDetail(plugin, tag!, TagDetailUtils.fileTagDetail!, i)
            this.listener = () => { perTag.popupHTML(tagDom, prev) }
            tagDom.addEventListener("mouseenter", this.listener)
            prev.addEventListener("mouseenter", this.listener)
            perTag.updateShadowText()
        })
    }

    static removeListener() {
        let tags_dom = document.querySelectorAll(".cm-hashtag.cm-hashtag-end")

        tags_dom.forEach((tagDom) => {
            let prev = tagDom.previousElementSibling!;
            tagDom.removeEventListener("mouseenter", this.listener)
            prev.removeEventListener("mouseenter", this.listener)
        })
    }
}