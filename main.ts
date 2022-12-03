import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { GlobalTagSetting } from 'src/attribute';
import { css } from 'src/css';
import { TagSetting } from 'src/tag';
import { insertCss } from 'src/utils';

// Remember to rename these classes and interfaces!

interface ColorfulTagSettings {
	TagSettings: TagSetting[];
	GlobalTagSetting: GlobalTagSetting;
}

const DEFAULT_SETTINGS: ColorfulTagSettings = {
	TagSettings: new Array<TagSetting>(),
	GlobalTagSetting: new GlobalTagSetting()
}

export default class ColorfulTag extends Plugin {
	settings: ColorfulTagSettings;
	settingTab: ColorfulTagSettingTab;

	async onload() {
		await this.loadSettings();
		let settingTab = new ColorfulTagSettingTab(this.app, this);
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.settingTab = settingTab
		this.addSettingTab(settingTab);
	}

	onunload() {

	}

	async refresh() {
		let tags = this.settings.TagSettings;
		let cssTotal = css.defaultCss;
		tags.forEach((tag_) => {
			let tag = new TagSetting()
			Object.assign(tag, tag_)
			cssTotal += tag.generateCss(this)
		})
		insertCss(cssTotal)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		for (let i = 0; i < this.settings.TagSettings.length; i++) {
			let tmp = new TagSetting()
			Object.assign(tmp, this.settings.TagSettings[i])
			tmp.opened = false
			let map = new Map<string, string | null>(Object.entries(tmp.attributes))
			tmp.attributes = map
			this.settings.TagSettings[i] = tmp
		}
		let tmp = new GlobalTagSetting()
		Object.assign(tmp, this.settings.GlobalTagSetting)
		tmp.opened = false
		let map = new Map<string, string | null>(Object.entries(tmp.attributes))
		let bmap = new Map<string, boolean>(Object.entries(tmp.enableList_))
		tmp.attributes = map
		tmp.enableList_ = bmap
		this.settings.GlobalTagSetting = tmp
	}

	saveSettings() {
		let tmp = []
		let globalTmp = null
		
		for (let i = 0; i < this.settings.TagSettings.length; i++) {
			tmp.push(this.settings.TagSettings[i].attributes)
			let obj = Object.create(null)
			let attr = this.settings.TagSettings[i].attributes as Map<string, string | null>
			for (let [k, v] of attr) {
				obj[k] = v
			}
			this.settings.TagSettings[i].attributes = obj
		}
		// global
		globalTmp = this.settings.GlobalTagSetting.attributes
		let globalBTmp = this.settings.GlobalTagSetting.enableList_
		let obj = Object.create(null)
		let attr = this.settings.GlobalTagSetting.attributes as Map<string, string | null>
		for (let [k, v] of attr) {
			obj[k] = v
		}
		let bobj = Object.create(null)
		let enableList_ = this.settings.GlobalTagSetting.enableList_ as Map<string, boolean>
		for (let [k, v] of enableList_) {
			bobj[k] = v
		}
		this.settings.GlobalTagSetting.attributes = obj
		this.settings.GlobalTagSetting.enableList_ = bobj
		this.saveData(this.settings);

		for (let i = 0; i < this.settings.TagSettings.length; i++) {
			this.settings.TagSettings[i].attributes = tmp[i]
		}
		this.settings.GlobalTagSetting.attributes = globalTmp
		this.settings.GlobalTagSetting.enableList_ = globalBTmp
	}
}

class ColorfulTagSettingTab extends PluginSettingTab {
	plugin: ColorfulTag;

	constructor(app: App, plugin: ColorfulTag) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		let addBtn = containerEl.createEl('button', { text: "Add" });
		addBtn.onClickEvent(() => {
			let newTag = new TagSetting();
			newTag.opened = true
			this.plugin.settings.TagSettings.push(newTag);
			this.plugin.saveSettings();
			newTag.generateDOM(containerEl, this.plugin, this.plugin.settings.TagSettings.length-1)
		})

		this.plugin.settings.GlobalTagSetting.generateDOM(containerEl, this.plugin)
		this.plugin.settings.TagSettings.forEach((tag, i) => {
			tag.generateDOM(containerEl, this.plugin, i)
		})
		this.plugin.refresh()
	}
}