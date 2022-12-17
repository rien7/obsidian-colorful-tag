import ColorfulTag, { DEFAULT_SETTINGS } from "main";
import { stringifyYaml } from "obsidian";
import { PerTagSetting } from "src/setting/perTagSetting";

interface ColorfulTagSettingOld {
	firstTime: boolean;
	global_enable: Object;
	global: Object;
	attrList: Array<string>;
	defaultStyle: Map<string, any>;
	defaultGlobal: Map<string, boolean>;
	styleList: Array<Object>;
	useTagDetail: boolean;
	// {filename:{file_size:0,tag_num:0,#tag-offset:{_i:idx,_l:line,_c:col,item:any,...}},...}
	tagDetail: Object;
	tagItem: Object;
}

const DEFAULT_SETTINGS_OLD: ColorfulTagSettingOld = {
	firstTime: true,
	global_enable: new Map(),
	global: new Map(),
	attrList: ["nest tag", "remove hash", "remove tag name", "radius", "prefix", "suffix", "background color", "text color", "text size", "border", "font weight"],
	defaultStyle: new Map<string, any>([['nest-tag', "false"], ['remove-hash', "false"], ['remove-tag-name', "false"], ['radius', '4px'], ['prefix', ''], ['suffix', ''], ['background-color', '#fff'], ['text-color', '#000'], ['text-size', '12px'], ['border', 'none'], ['font-weight', '900']]),
	defaultGlobal: new Map<string, boolean>([['nest-tag', false], ['remove-hash', false], ['remove-tag-name', false], ['radius', false], ['prefix', false], ['suffix', false], ['background-color', false], ['text-color', false], ['text-size', false], ['border', true], ['font-weight', true]]),
	styleList: new Array(),
	useTagDetail: false,
	tagDetail: new Map(),
	tagItem: new Map(),
}

export class Convert {
    private plugin: ColorfulTag

    constructor(plugin: ColorfulTag) {
        this.plugin = plugin;
    }

    public async backup() {
        let config = this.plugin.app.vault.configDir;
        let dataJson = config + "/plugins/obsidian-colorful-tag/data.json";
        // if backup exist, delete it
        if (await this.plugin.app.vault.adapter.exists(dataJson + ".bak")) {
            await this.plugin.app.vault.adapter.remove(dataJson + ".bak");
        }
        await this.plugin.app.vault.adapter.copy(dataJson, dataJson + ".bak");
        console.log("backup done");
    }

    public async convert() {
        let oldSetting = Object.assign({}, DEFAULT_SETTINGS_OLD, await this.plugin.loadData());
        let newSetting = Object.assign({}, DEFAULT_SETTINGS);
        newSetting.TagSettings = [];
        let enableList = new Map<string, boolean>();
        for (let [attr, _] of Object.entries(oldSetting.global_enable)) {
            enableList.set(attr, oldSetting.global_enable[attr]);
        }
        newSetting.GlobalTagSetting.enableList_ = enableList;
        let global = new Map<string, any>();
        for (let [attr, _] of Object.entries(oldSetting.global)) {
            global.set(attr, oldSetting.global[attr]);
        }
        newSetting.GlobalTagSetting.attributes = global;
        for (let style of oldSetting.styleList) {
            let tag = new PerTagSetting();
            tag.name = style.tag;
            tag.enable = style.enable;
            let attributes = new Map<string, any>();
            for (let [attr, _] of Object.entries(style)) {
                if (attr != "tag" && attr != "enable") {
                    attributes.set(attr, style[attr]);
                }
            }
            tag.attributes = attributes;
            let tagItem = oldSetting.tagItem["#"+style.tag];
            if (tagItem) {
                let tagDetail = new Map<string, any>();
                let defaultMap = new Map<string, any>();
                for (let [detail, _] of Object.entries(tagItem)) {
                    if (detail.startsWith("default")) {
                        let key = detail.substring(7);
                        defaultMap.set(key, tagItem[detail]);
                    };
                    let arr = [tagItem[detail], "Text", null];
                    tagDetail.set(detail, arr);
                }
                tag.tagDetail.attributes = defaultMap;
                tag.tagDetail.itemType = tagDetail;
            }
            newSetting.TagSettings.push(tag);
        }
        for (let [path, ] of Object.entries(oldSetting.tagDetail)) {
            let value = oldSetting.tagDetail[path];
            let content = await this.plugin.app.vault.adapter.read(path);
            // get frontmatter
            let frontmatterMap = new Map<string, any>();
            let tagList = new Array<Map<string, any>>();
            let i = 0;
            for (let [tag, _] of Object.entries(value)) {
                let m = new Map<string, any>();
                if (value[tag]["_i"] != i) {
                    i++
                    tagList.push(m);
                    continue
                }
                i++
                for (let [item, _] of Object.entries(value[tag])) {
                    if (item.startsWith("_")) continue;
                    m.set(item, value[tag][item]);
                }
                tagList.push(m);
            }
            frontmatterMap.set("colorful-tag", tagList);
            const match = content.match(/^---\s+([\w\W]+?)\s+---/);
            if (match) {
                let yaml = match[1] + "\n" + stringifyYaml(frontmatterMap);
                content = content.replace(/^---\s+([\w\W]+?)\s+---/, `---\n${yaml}---`)
            } else {
                let yaml = stringifyYaml(frontmatterMap);
                content = `---\n${yaml}---\n${content}`
            }
            await this.plugin.app.vault.adapter.write(path, content);
        }
        this.plugin.settings = newSetting;
        this.plugin.saveSettings();
        console.log("convert done");
    }

    public async check(): Promise<boolean> {
        let oldSetting = Object.assign({}, await this.plugin.loadData());

        if (oldSetting.global_enable) {
            return true;
        }
        return false
    }
}