import ColorfulTag from "main";
import { ColorComponent, DropdownComponent, setIcon, Setting, ToggleComponent } from "obsidian";
import { AttributeType, BooleanType, SizeType } from "./attributeType";

export class Attribute {
    readonly name: string;
    readonly displayName: string;
    readonly description: string | null;
    readonly type: AttributeType;
    readonly cssName: string | null;
    readonly important: boolean;
    constructor(name: string, type: AttributeType, cssName: string | null, displayName: string, description: string | null = null, important: boolean = false) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.type = type;
        this.cssName = cssName;
        this.important = important;
    }
    static AttributeList: Map<string, Attribute> = new Map<string, Attribute>([
        ["prefix", new Attribute("prefix", AttributeType.Text, "content", "Prefix")],
        ["suffix", new Attribute("suffix", AttributeType.Text, "content", "Suffix")],
        ["background-color", new Attribute("background-color", AttributeType.Color, "background-color", "Background Color")],
        ["text-color", new Attribute("text-color", AttributeType.Color, "color", "Text Color")],
        ["text-size", new Attribute("text-size", AttributeType.Size, "font-size", "Text Size")],
        ["font-weight", new Attribute("font-weight", AttributeType.Number, "font-weight", "Font Weight")],
        ["border", new Attribute("border", AttributeType.Any, "border", "Border")],
        ["radius", new Attribute("radius", AttributeType.Size, "radius", "Radius")],
        ["nest-tag", new Attribute("nest-tag", AttributeType.Boolean, null, "Enable Nest Tag")],
        ["remove-hash", new Attribute("remove-hash", AttributeType.Boolean, null, "Remove Hash", "Set true to remove '#' of the tag.\nFor example: '😎#Nice' => '😎Nice'")],
        ["remove-tag-name", new Attribute("remove-tag-name", AttributeType.Boolean, null, "Remove Tag Name", "Set true to remove the 'tag name'.\nFor example: '😎#Nice' => '😎#'")]
    ])
}

export class TagSettingBase {
    attributes: Map<string, string | null> | Object = new Map();
    opened: boolean = false;
    
    generateTitle(header: HTMLElement, setting: HTMLElement, child: boolean = false): Setting {
        let title = new Setting(header)
        
        let title_ctl = title.nameEl.createEl("span", "colorful-tag-collapse-indicator is-collapsed")
        setIcon(title_ctl, "right-arrow")
        if (this.opened && !child) {
            setting.removeClass("is-collapsed")
            title_ctl.removeClass("is-collapsed")
        }
        header.onClickEvent(() => {
            setting.classList.toggle("is-collapsed")
            title_ctl.classList.toggle("is-collapsed")
            if (!child) {
                this.opened = !this.opened
            }
        })
        return title
    }

    addComponent(name: string, attribute: Attribute, settingItem: Setting, save: () => void) {
        let attr = this.attributes as Map<string, string | null>
        let value = attr.get(name)
        switch (attribute.type) {
            case AttributeType.Boolean: {
                let dropdown = settingItem.addDropdown((cp) => {
                    cp.addOption(BooleanType.True, "True")
                    .addOption(BooleanType.False, "False")
                    .setValue(value || "")
                    .onChange((v) => {
                        attr.set(name, v)
                        this.attributes = attr
                        save()
                    })
                })
                settingItem.addButton((cp) => {
                    cp.setIcon("reset")
                    .setClass("small-button")
                    .onClick(() => {
                        let dropdownComponent = dropdown.components[0] as DropdownComponent
                        dropdownComponent.setValue("")
                        attr.set(name, null)
                        this.attributes = attr
                        save()
                    })
                })
                break
            }
            case AttributeType.Color: {
                let colorPicker = settingItem.addColorPicker((cp) => {
                    cp.setValue(value || "#000000")
                    .onChange((v) => {
                        attr.set(name, v)
                        this.attributes = attr
                        save()
                    })
                })
                settingItem.addButton((cp) => {
                    cp.setIcon("reset")
                    .setClass("small-button")
                    .onClick(() => {
                        let colorComponent = colorPicker.components[0] as ColorComponent
                        colorComponent.setValue("#000000")
                        attr.set(name, null)
                        this.attributes = attr
                        save()
                    })
                })
                break
            }
            case AttributeType.Size: {
                let regex = /([\d.]+)(.*)/gm.exec(value || "")
                let text = ""
                let unit = "px"
                if (regex != null) {
                    text = regex[1]
                    unit = regex[2]
                }
                settingItem.addText((cp) => {
                    cp.setValue(text)
                    .onChange((v) => {
                        let res: string | null = `${v}${unit}`
                        if (res == "") res = null
                        text = v
                        attr.set(name, res)
                        this.attributes = attr
                        save()
                    })
                }).setClass("small-input")
                settingItem.addDropdown((cp) => {
                    for (let [_, v] of Object.entries(SizeType)) {
                        cp.addOption(v, v)
                    }
                    cp.setValue(unit)
                    .onChange((v) => {
                        unit = v
                        attr.set(name, `${text}${unit}`)
                        this.attributes = attr
                        save()
                    })
                })
                break
            }
            default: {
                settingItem.addText((cp) => {
                    cp.setValue(value || "")
                    .onChange((v) => {
                        // TODO: TypeCheck
                        let res: string | null = v;
                        if (v == "") res = null;
                        attr.set(name, res);
                        this.attributes = attr
                        save()
                    })
                })
            }
        }
    }
}

export class GlobalTagSetting extends TagSettingBase {
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
            this.addComponent(name, attribute, settingItem, () => {
                plugin.settings.GlobalTagSetting = this
                plugin.saveSettings()
                plugin.settingTab.display()
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