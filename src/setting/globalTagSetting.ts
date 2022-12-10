import ColorfulTag from "main";
import { Setting } from "obsidian";
import { Attribute } from "src/utils/attribute";
import { BaseTagSetting } from "./baseTagSetting";

export class GlobalTagSetting extends BaseTagSetting {
    static from: HTMLElement | null = null
    enableList_: Map<string, boolean> | Object = new Map();
    generateDOM(parent: HTMLElement, plugin: ColorfulTag) {
        let setting = parent.createDiv("colorful-tag-setting-header is-collapsed");
        let header = setting.createDiv()
        let title = this.generateTitle(header, setting)
        title.nameEl.createSpan().setText("Global Setting")

        let body = setting.createDiv("colorful-tag-setting-body");
        
        let enableList = this.enableList_ as Map<string, boolean>
        let attr = this.attributes as Map<string, string | null>
        Attribute.AttributeList.forEach((attribute, name) => {
            let settingItem = new Setting(body)
            // Name and Desc
            settingItem.setName(attribute.displayName)
            if (attribute.description != null) settingItem.setDesc(attribute.description)
            // Value
            this.addComponent(name, attribute.type, settingItem, async () => {
                plugin.settings.GlobalTagSetting = this
                plugin.saveSettings()
                await plugin.refresh()
            })
            settingItem.addToggle((cp) => {
                cp.setValue(enableList.get(name) || false)
                .onChange((v) => {
                    enableList.set(name, v)
                    this.enableList_ = enableList
                    if (!v) attr.set(name, null)
                    plugin.settings.GlobalTagSetting = this
                    plugin.saveSettings()
                    plugin.settingTab.display()
                })
            })
        })
        parent.appendChild(setting)
    }
}