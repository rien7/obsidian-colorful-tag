import ColorfulTag from "main";
import { setIcon, Setting } from "obsidian";
import { Attribute } from "../utils/attribute";
import { AttributeType } from "../utils/attributeType";
import { TagDetailSetting } from "./tagDetailSetting";
import { convertTag, getHash, isBefore } from "../utils/utils";
import { BaseTagSetting } from "./baseTagSetting";
import { GlobalTagSetting } from "./globalTagSetting";

export class PerTagSetting extends BaseTagSetting {
    private name_: string | null;
    enable: boolean = true;
    tagDetail: TagDetailSetting = new TagDetailSetting(-1);

    get name() {
        if (this.name_ == null) {
            return ""
        }
        return this.name_!;
    }
    set name(name: string) {
        this.name_ = name;
    }

    attrCss(name: string, plugin: ColorfulTag) {
        let global = plugin.settings.GlobalTagSetting.attributes as Map<string, string | null>
        let local = this.attributes as Map<string, string | null>
        let value = local.get(name) || global.get(name) || ""
        let attribute = Attribute.AttributeList.get(name)!
        let cssName = attribute.cssName
        let important = attribute.important
        if (value == null) { return ""; }
        if (important) { return `${cssName}: ${value} !important;` }
        return `${cssName}: ${value};`
    }

    generateCss(plugin: ColorfulTag): string {
        let global = plugin.settings.GlobalTagSetting.attributes as Map<string, string | null>
        let local = this.attributes as Map<string, string | null>

        // TODO: refactor
        let background_color = local.get("background-color") || global.get("background-color") || "";
        let text_color = local.get("text-color") || global.get("text-color") || "";
        let prefix = local.get("prefix") || global.get("prefix") || "";
        let suffix = local.get("suffix") || global.get("suffix") || "";
        let radius = local.get("radius") || global.get("radius") || "";
        let text_size = local.get("text-size") || global.get("text-size") || "";
        let border = local.get("border") || global.get("border") || "";
        let font_weight = local.get("font-weight") || global.get("font-weight") || "";
        let nest_tag = local.get("nest-tag") || global.get("nest-tag") || "";
        let remove_hash = local.get("remove-hash") || global.get("remove-hash") || "";
        let remove_tag_name = local.get("remove-tag-name") || global.get("remove-tag-name") || "";

        let padding_size = "";

        let [tag1, tag2] = convertTag(this.name)
        let reading_selector = `href="#${tag1}"`;
        let editing_selector = `span.cm-tag-${tag2}`;
        if (nest_tag.toLowerCase() == "true") {
            reading_selector = `href^="#${tag1}"`;
            editing_selector = `span[class*="cm-tag-${tag2}"]`;
        }

        let style1 = `font-weight: ${font_weight}; background-color: ${background_color}; color: ${text_color}; font-size: ${text_size}; white-space: nowrap; border: ${border};`
        let style2 = `border-radius: ${radius}; padding-left: ${padding_size}; padding-right: ${padding_size};`
        let style3 = `border-top-right-radius: 0; border-bottom-right-radius: 0; padding-right: 0px; border-top-left-radius: ${radius}; border-bottom-left-radius: ${radius}; padding-left: ${padding_size};`
        let style4 = `border-bottom-left-radius: 0; border-top-left-radius: 0; padding-left: 0px; border-top-right-radius: ${radius}; border-bottom-right-radius: ${radius}; padding-right: ${padding_size};`

        let css = ""
        if (!this.enable) return css
        css += `[class*="popup-${tag2}"] > .colorful-tag-popup-header { display: flex; padding: 5px 10px; background-color: ${background_color}; color: ${text_color}; font-size: ${text_size}; font-weight: ${font_weight}; border-radius: 10px 10px 0 0; }`;
        css += `[class*="popup-${tag2}"] > .colorful-tag-popup-body { padding: 0 10px; border: 4px solid ${background_color}; border-radius: 0 0 10px 10px; border-top: none;}`;

        css += `body a.tag[${reading_selector}], body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag { ${style1} }`;
        // only reading view
        css += `body a.tag[${reading_selector}] { ${style2} }`;
        // edit view begin
        css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin { ${style3} }`;
        // edit view end
        css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end { ${style4} }`;

        if (remove_hash.toLowerCase() == "true" && remove_tag_name.toLowerCase() == "true") {
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin { font-size: 0px; }`;
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end { font-size: 0px; }`;
            if (suffix == "" && prefix != "") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin::before { padding-right: var(--tag-padding-x) !important; border-top-right-radius: ${radius} !important; border-bottom-right-radius: ${radius} !important; }`
            } else if (prefix == "" && suffix != "") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end::after { padding-left: var(--tag-padding-x) !important; border-top-left-radius: ${radius} !important; border-bottom-left-radius: ${radius} !important; }`
            }
        } else if (remove_hash.toLowerCase() == "true") {
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin { font-size: 0px; }`;
            if (prefix == "") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end { padding-left: var(--tag-padding-x); border-top-left-radius: ${radius} !important; border-bottom-left-radius: ${radius} !important; }`;
            }
        } else if (remove_tag_name.toLowerCase() == "true") {
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end { font-size: 0px; }`;
            if (suffix == "") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin { padding-right: var(--tag-padding-x); border-top-right-radius: ${radius} !important; border-bottom-right-radius: ${radius} !important; }`;
            }
        }

        if (prefix != "") {
            css += `body a.tag[${reading_selector}]::before { content: "${prefix} "; }`;
            css += `[class*="popup-${tag2}"] > .colorful-tag-popup-header:before { content: "${prefix}"; }`;
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin::before { content: "${prefix} "; ${style1} }`;
            css += `body a.tag[${reading_selector}]::before { ${style2}; }`;
            if (remove_hash.toLowerCase() == "true") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-begin::before { ${style3}; padding-top: var(--tag-padding-y); padding-bottom: var(--tag-padding-y); padding-left: var(--tag-padding-x); }`;
            }
        }
        if (suffix != "") {
            css += `body a.tag[${reading_selector}]::after { content: " ${suffix}"; }`;
            css += `[class*="popup-${tag2}"] > .colorful-tag-popup-header:after { content: "${suffix}"; }`;
            css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end::after { content: " ${suffix}"; ${style1} }`;
            css += `body a.tag[${reading_selector}]::after { ${style2}; }`;
            if (remove_tag_name.toLowerCase() == "true") {
                css += `body .cm-s-obsidian .cm-line ${editing_selector}.cm-hashtag.cm-hashtag-end::after { ${style4}; padding-top: var(--tag-padding-y); padding-bottom: var(--tag-padding-y); padding-right: var(--tag-padding-x); }`;
            }
        }
        return css
    }

    private refreshHeader(name: string | null, nameEl: HTMLElement) {
        let [tag1, tag2] = convertTag(name || "")
        if (nameEl.querySelectorAll(`.cm-tag-${tag2}`).length > 0) return
        let hashtag = nameEl.createSpan(`cm-hashtag cm-hashtag-begin cm-tag-${tag2}`)
        hashtag.setText("#")
        let content = nameEl.createSpan(`cm-hashtag cm-hashtag-end cm-tag-${tag2}`)
        content.setText(tag1)
        let old = nameEl.querySelectorAll(`:not(.cm-tag-${tag2})`)
        old.forEach((o) => o.remove())
    }

    drag(title: Setting, setting: HTMLElement, index: number, plugin: ColorfulTag) {
        let dropHandle = title.controlEl.createEl("span")
        dropHandle.addClass("colorful-tag-handler")
        setIcon(dropHandle, "align-justify")
        setting.setAttr("index", index)

        dropHandle.draggable = true
        dropHandle.ondragover = (e) => {
            let to = e.target as HTMLElement
            to = to.closest(".colorful-tag-setting-outer") as HTMLElement
            if (GlobalTagSetting.from == null) return
            if (to == GlobalTagSetting.from) return
            if (isBefore(GlobalTagSetting.from, to))
            to.parentNode?.insertBefore(GlobalTagSetting.from, to)
            else
            to.parentNode?.insertBefore(GlobalTagSetting.from, to.nextSibling)
            let idx = GlobalTagSetting.from.getAttr("index")
            GlobalTagSetting.from.setAttr("index", to.getAttr("index"))
            to.setAttr("index", idx)
            let tmpSetting = plugin.settings.TagSettings[parseInt(GlobalTagSetting.from.getAttr("index")!)]
            plugin.settings.TagSettings[parseInt(GlobalTagSetting.from.getAttr("index")!)] = plugin.settings.TagSettings[parseInt(to.getAttr("index")!)]
            plugin.settings.TagSettings[parseInt(to.getAttr("index")!)] = tmpSetting
        }
        dropHandle.ondragend = () => {
            GlobalTagSetting.from = null
            plugin.saveSettings()
        }
        dropHandle.ondragstart = (e) => {
            let from = e.target as HTMLElement
            from = from.closest(".colorful-tag-setting-outer") as HTMLElement
            GlobalTagSetting.from = from
        }
    }

    generateDOM(parent: HTMLElement, plugin: ColorfulTag, index: number) {
        let setting = parent.createDiv("colorful-tag-setting-header is-collapsed colorful-tag-setting-outer");
        let inner = setting.createDiv("cm-s-obsidian")
        let header = inner.createDiv("cm-line")
        
        let body = setting.createDiv("colorful-tag-setting-body");
        let normal = body.createDiv();
        let override = body.createDiv("colorful-tag-setting-header is-collapsed");
        let overrideHeader = override.createDiv()
        let overrideTitle = this.generateTitle(overrideHeader, override, true)
        overrideTitle.nameEl.createSpan().setText("Override Global Setting")

        let overrideBody = override.createDiv("colorful-tag-setting-body");

        let title = this.generateTitle(header, setting)
            .addToggle((cp) => {
                cp.setValue(this.enable)
                    .onChange((v) => {
                        this.enable = v
                        plugin.settings.TagSettings[index] = this
                        plugin.saveSettings()
                        plugin.refresh()
                        setting.classList.toggle("is-collapsed", v)
                        header.querySelector(".colorful-tag-collapse-indicator")!.classList.toggle("is-collapsed", v)
                    })
            });

        let title_text = title.nameEl.createEl("span");
        this.refreshHeader(this.name_, title_text)

        this.drag(title, setting, index, plugin)

        let attr = this.attributes as Map<string, string | null>
        let globalEnable = plugin.settings.GlobalTagSetting.enableList_ as Map<string, boolean>

        // TagName
        new Setting(normal).setName("Tag Name").addText((cp) => {
            cp.setValue(this.name_ || "")
            cp.setPlaceholder("Colorful-Tag")
            cp.onChange((v) => {
                // TODO: TypeCheck
                let res: string | null = v;
                if (v == "") res = null;
                else res.replace(" ", "");
                this.name_ = res;
                // TODO: Refresh Title Tag
                plugin.settings.TagSettings[index] = this
                plugin.saveSettings()
                plugin.refresh()
                this.refreshHeader(this.name_, title_text)
            })
        }).setDesc("Enter the tag name without '#'.")
        Attribute.AttributeList.forEach((attribute, name) => {
            let value = attr.get(name)
            let globalValue = globalEnable.get(name)
            let node = normal;
            if (!value && globalValue) { node = overrideBody }
            let settingItem = new Setting(node)

            // Name and Desc
            settingItem.setName(attribute.displayName)
            if (attribute.description != null) settingItem.setDesc(attribute.description)
            // Value
            this.addComponent(name, attribute.type, settingItem, () => {
                plugin.settings.TagSettings[index] = this
                plugin.saveSettings()
                if (attribute.type == AttributeType.Boolean || attribute.type == AttributeType.Color) {
                    plugin.settingTab.display()
                } else {
                    plugin.refresh()
                }
            })
        })

        if (this.tagDetail == null) {
            this.tagDetail = new TagDetailSetting(index)
        }

        this.tagDetail.tagIndex = index
        this.tagDetail.generateDOM(body, plugin)

        new Setting(body).addButton((cp) => {
            cp.setIcon("trash")
            .setButtonText("Remove")
            .setWarning()
            .onClick(() => {
                plugin.settings.TagSettings.splice(index, 1)
                plugin.saveSettings()
                plugin.settingTab.display()
            })
        })
        parent.appendChild(setting)
    }
}