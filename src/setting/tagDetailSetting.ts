import { randomUUID } from "crypto";
import ColorfulTag from "main";
import { DropdownComponent, Setting } from "obsidian";
import { BaseTagSetting } from "../setting/baseTagSetting";
import { AttributeType } from "../utils/attributeType";
import { stringToAttributeType } from "../utils/utils";

const typeSelect: AttributeType[] = [
    AttributeType.Text,
    AttributeType.Boolean,
    AttributeType.Color,
    AttributeType.Number,
    AttributeType.Date,
    AttributeType.Dropdown,
    AttributeType.ReadOnly
]

export class TagDetailSetting extends BaseTagSetting {
    itemType: Map<string, [string | null, AttributeType | null, string | null]> | Object = new Map();
    tagIndex: number
    shadowTextTemplate: string

    constructor(tagIndex: number) {
        super()
        this.tagIndex = tagIndex
    }

    addComponent2(value: [string | null, AttributeType | null, string | null], name: string, settingItem: Setting, plugin: ColorfulTag, refresh: () => void) {
        let itemType = this.itemType as Map<string, [string | null, AttributeType | null, string | null]>

        let components = settingItem.controlEl.childNodes
        let deleted = []
        for (let i = 0; i < components.length; i++) {
            if (i < 2) continue;
            deleted.push(components[i])
        }
        deleted.forEach((v) => v.remove())

        let dropdownOption = ""

        if (value[1] == AttributeType.Dropdown) {
            settingItem.addText((cp) => {
                cp.setValue(value[2] || "")
                .setPlaceholder("Dropdown Items(split by ',')")
                .onChange((v) => {
                    value[2] = v
                    itemType.set(name, value)
                    this.itemType = itemType
                    plugin.settings.TagSettings[this.tagIndex].tagDetail = this
                    plugin.saveSettings()

                    let dropdownComponent = settingItem.components[3] as DropdownComponent
                    let deleted: ChildNode[] = []
                    let selectEl = dropdownComponent.selectEl
                    if (!selectEl) {
                        selectEl = settingItem.controlEl.childNodes[3] as HTMLSelectElement
                    }
                    selectEl.childNodes.forEach((v) => deleted.push(v))
                    deleted.forEach((v) => v.remove())
                    
                    let options = v.split(",")
                    options.forEach((v) => {
                        selectEl.createEl("option", {value: v}).setText(v)
                    })
                    selectEl.createEl("option").setAttrs({selected: "", disabled: "", hidden: ""})
                })
                cp.inputEl.style.marginRight = "auto"
            })
            dropdownOption = value[2] || ""
        }

        this.addComponent(name, (value[1] || AttributeType.Any), settingItem, () => {
            plugin.settings.TagSettings[this.tagIndex].tagDetail = this
            plugin.saveSettings()
        }, dropdownOption)

        settingItem.addButton((cp) => {
            cp.setIcon("trash")
            .setClass("small-button")
            .setWarning()
            .onClick(() => {
                itemType.delete(name)
                plugin.settings.TagSettings[this.tagIndex].tagDetail = this
                plugin.saveSettings()
                refresh()
            })
        })
    }

    generateItem(body: HTMLElement, k: string, value: [string | null, AttributeType | null, string | null], plugin: ColorfulTag) {
        let itemType = this.itemType as Map<string, [string | null, AttributeType | null, string | null]>
        let settingItem = new Setting(body)

        settingItem.infoEl.remove()
        settingItem.controlEl.style.justifyContent = "flex-start"

        settingItem.addText((cp) => {
            cp.setValue(value[0] || "")
            .setPlaceholder("Item Name")
            .onChange((v) => {
                let res: string | null = v;
                if (v == "") res = null
                value[0] = res
                itemType.set(k, value)
                this.itemType = itemType
                plugin.settings.TagSettings[this.tagIndex].tagDetail = this
                plugin.saveSettings()
            }).inputEl.style.width = "100px"
        })
        settingItem.addDropdown((cp) => {
            typeSelect.forEach((v) => {
                cp.addOption(v, v)
            })
            cp.setValue(value[1] || "")
            cp.onChange((v) => {
                value[1] = stringToAttributeType(v)
                this.addComponent2(value, k, settingItem, plugin, () => {
                    settingItem.setClass("deleted")
                    document.querySelectorAll(".deleted").forEach((v) => v.remove())
                })
                itemType.set(k, value)
                this.itemType = itemType
                plugin.settings.TagSettings[this.tagIndex].tagDetail = this
                plugin.saveSettings()
            })
            if (value[1] != AttributeType.Dropdown) {
                cp.selectEl.style.marginRight = "auto"
            }
        })
        this.addComponent2(value, k, settingItem, plugin, () => {
            settingItem.setClass("deleted")
            document.querySelectorAll(".deleted").forEach((v) => v.remove())
        })
    }

    generateDOM(parent: HTMLElement, plugin: ColorfulTag) {
        let setting = parent.createDiv("colorful-tag-setting-header is-collapsed");
        let header = setting.createDiv()
        let title = this.generateTitle(header, setting, true)
        title.nameEl.createSpan().setText("Tag Detail Setting")

        let body = setting.createDiv("colorful-tag-setting-body");
        let tagItems = body.createDiv();

        let itemType = this.itemType as Map<string, [string | null, AttributeType | null, string | null]>
        
        itemType.forEach((value, k) => {
            this.generateItem(tagItems, k, value, plugin)
        })

        let tagTemplate = body.createDiv()
        new Setting(tagTemplate).setName("Shadow Text Template")
        .addTextArea((cp) => {
            cp.setValue(this.shadowTextTemplate)
            .onChange((v) => {
                this.shadowTextTemplate = v
                plugin.settings.TagSettings[this.tagIndex].tagDetail = this
                plugin.saveSettings()
            })
        })

        new Setting(body).addButton((cp) => {
            cp.setButtonText("Add Item")
            .onClick(() => {
                let key = randomUUID().substring(0, 6)
                itemType.set(key, [null, null, null])
                this.generateItem(tagItems, key, [null, null, null], plugin)
            })
        })
    }
}