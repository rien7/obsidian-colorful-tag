import ColorfulTag from "main";
import { setIcon, Setting } from "obsidian";
import { PerTagSetting } from "../setting/perTagSetting";

import { AttributeType, BooleanType } from "../utils/attributeType";
import { FileTagDetail } from "./fileTagDetail";

enum popupState {
    VISIBLE,
    ENTER
}

export class perTagDetail {
    plugin: ColorfulTag
    private timer: NodeJS.Timer | undefined
    private timer1: NodeJS.Timer | undefined
    private tagSetting: PerTagSetting
    private state: popupState = popupState.ENTER
    private fileTagDetail: FileTagDetail;
    private index: number
    private popuped: boolean

    constructor(plugin: ColorfulTag, tagSetting: PerTagSetting, fileTagDetail: FileTagDetail, i: number) {
        this.plugin = plugin
        this.tagSetting = tagSetting
        this.fileTagDetail = fileTagDetail
        this.index = i
        this.popuped = false
        this.updateShadowText()
    }

    updateShadowText() {
        let template = this.tagSetting.tagDetail.shadowTextTemplate
        if (!template || template == "") return
        let value = this.fileTagDetail.getTagData(this.index)
        if (value == null) return
        let defaultValue = this.tagSetting.tagDetail.attributes as Map<string, string | null>
        let items = this.tagSetting.tagDetail.itemType as Map<string, [string | null, AttributeType | null, string | null]>
        defaultValue.forEach((dValue, k) => {
            let item = items.get(k)!
            let key = item[0] || ""
            let v = value!.get(key) || dValue || ""
            template = template.replace(`{{${key}}}`,v)
        })
        let temps = template.split("{{TAG}}")
        if (temps.length != 2) return
        let pair: [string, string] = [temps[0], temps[1]]
        FileTagDetail.shadowText[this.index] = pair
    }

    popupBody(body: HTMLElement) {
        let defaultValue = this.tagSetting.tagDetail.attributes as Map<string, string | null>
        let items = this.tagSetting.tagDetail.itemType as Map<string, [string | null, AttributeType | null, string | null]>
        let storeData = this.fileTagDetail.getTagData(this.index)
        if (storeData == null) {
            new Setting(body)
            .addButton(async (cp) => {
                cp.setButtonText("Add")
                .onClick(async () => {
                    this.fileTagDetail.addTagData(this.index)
                    await this.fileTagDetail.writeFrontmatter()
                    body.childNodes.forEach((v) => v.remove())
                    this.popupBody(body)
                })
            })
            return
        }
        defaultValue.forEach((dValue, k) => {
            let item = items.get(k)!
            let setting = new Setting(body)
            if (!item[0]) return
            let key = item[0]
            setting.setName(key)
            switch(item[1]) {
                case AttributeType.Boolean: {
                    setting.addDropdown((cp) => {
                        cp.addOption(BooleanType.True, "True")
                        .addOption(BooleanType.False, "False")
                        .setValue(storeData!.get(key) || dValue || "")
                        .onChange(async (v) => {
                            storeData!.set(key, v)
                            this.fileTagDetail.setTagData(this.index, storeData!)
                            this.updateShadowText()
                            await this.fileTagDetail.writeFrontmatter()
                        })
                    })
                    break
                }
                case AttributeType.Dropdown: {
                    let data_ = item[2] || ""
                    let options = data_.split(",")
                    setting.addDropdown((cp) => {
                        options.forEach((v) => {
                            cp.addOption(v, v)
                        })
                        cp.setValue(storeData!.get(key) || dValue || "")
                        .onChange(async (v) => {
                            storeData?.set(key, v)
                            this.fileTagDetail.setTagData(this.index, storeData!)
                            this.updateShadowText()
                            await this.fileTagDetail.writeFrontmatter()
                        })
                    })
                    break
                }
                case AttributeType.Color: {
                    setting.addColorPicker((cp) => {
                        cp.setValue(storeData!.get(key) || dValue || "#000000")
                        .onChange(async (v) => {
                            storeData?.set(key, v)
                            this.fileTagDetail.setTagData(this.index, storeData!)
                            this.updateShadowText()
                            await this.fileTagDetail.writeFrontmatter()
                        })
                    })
                    break
                }
                case AttributeType.ReadOnly: {
                    setting.addTextArea((cp) => {
                        cp.setValue(dValue || "").setDisabled(true)
                        .inputEl.addClass("readonly")
                    })
                    break
                }
                default: {
                    setting.addTextArea((cp) => {
                        cp.setValue(storeData!.get(key) || dValue || "")
                        .onChange(async (v) => {
                            storeData?.set(key, v)
                            this.fileTagDetail.setTagData(this.index, storeData!)
                            this.updateShadowText()
                            await this.fileTagDetail.writeFrontmatter()
                        })
                    })
                }
            }
        })
    }

    popupHTML(tagDom: Element, other: Element) {
        // if (document.querySelector(`.popup-${this.id}`)) return        
        if (this.popuped) return
        this.popuped = true
        let rect = tagDom.getBoundingClientRect()
        let popup = document.createElement("div")
        popup.addClass("colorful-tag-popup")
        popup.addClass(`popup-${this.tagSetting.name}`)
        popup.style.left = `${rect.right + 20}px`
        popup.style.top = `${rect.bottom + 20}px`
        let header = popup.createDiv("colorful-tag-popup-header");
        header.createSpan().setText(`#${this.tagSetting.name}`)
        let pin = header.createDiv("colorful-tag-popup-pin");
        setIcon(pin, "filled-pin")
        pin.onClickEvent(() => {
            pin.classList.toggle("pinned")
            if (pin.classList.contains("pinned")) {
                this.state = popupState.ENTER
            } else {
                this.state = popupState.VISIBLE
            }
        })

        let body = popup.createDiv("colorful-tag-popup-body");
        this.popupBody(body)

        document.body.appendChild(popup)

        let enter = () => {
            this.state = popupState.ENTER
            if (this.timer) {
                clearTimeout(this.timer)
                this.timer = undefined
            }
            this.popuped = true
        }
        let leave = () => {
            this.state = popupState.VISIBLE
            if (this.timer) {
                clearTimeout(this.timer)
                this.timer = undefined
            }
            this.timer = setTimeout(() => {
                if (this.state == popupState.VISIBLE && !pin.classList.contains("pinned")) {
                    if (popup != null) {
                        popup.addClass("hidden")
                        if (this.timer) {
                            clearTimeout(this.timer1)
                            this.timer1 = undefined
                        }
                        this.timer1 = setTimeout(() => {
                            popup.remove()
                            this.popuped = false
                        }, 200)
                    }
                }
            }, 1500);
        }
        
        popup.addEventListener("mouseenter", enter)
        popup.addEventListener("mouseleave", leave)

        tagDom.addEventListener("mouseenter", enter)
        tagDom.addEventListener("mouseleave", leave)

        other.addEventListener("mouseenter", enter)
        other.addEventListener("mouseleave", leave)
    }
}

