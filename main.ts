import { App, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface ColorfulTagSetting {
	global_enable: Map<string, boolean>;
	global: Map<string, any>;
	attrList: Array<string>;
	styleList: Array<Map<string, any>>;
}

const DEFAULT_SETTINGS: ColorfulTagSetting = {
	global_enable: new Map(),
	global: new Map([['radius', 4]]),
	attrList: ["radius", "prefix", "suffix", "background color", "text color", "text size"],
	styleList: new Array()
}

export default class ColorfulTag extends Plugin {
	settings: ColorfulTagSetting;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ColorfulTagSettingTab(this.app, this));
	}

	onunload() {
		
	}

	async refresh() {
		let head = document.querySelector("head")!;
		let del = head.querySelectorAll("[colorful-tag-plugin]");
		let styles = this.settings.styleList;
		let global = this.settings.global;
		let global_enable = this.settings.global_enable;
		console.log(global)
		let sele = "";
		for (let i in styles) {
			let m = new Map(Object.entries(styles[i]));
			let tag = m.get("tag");
			// replace \ to \\, because \ is a special character in css
			tag = tag.replace(/\\/g, "\\\\");
			// replace / to \/, because / is a special character in css
			tag = tag.replace(/\//g, "\\/");
			if (!m.get("enable")) { continue; }
			sele += `.cm-tag-${tag}, `;
		}
		let css = "";
		let el = head.createEl("style", { "type": "text/css", "attr": { "colorful-tag-plugin": "" } });
		// editing view
		css += `body:not(.annotation-tags-off) .cm-s-obsidian .cm-line .cm-hashtag-begin:is(${sele}) { border: none; font-family: var(--font-text); white-space: nowrap; padding-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }`;
		// css += `body:not(.annotation-tags-off) .cm-s-obsidian .cm-line span:is(${sele}) { font-weight: 900; font-style: normal; white-space: nowrap; color: #000000; padding-left: 6px; padding-right: 6px; border-radius: ${global[`radius`]}; }`;
		css += `body:not(.annotation-tags-off) .cm-s-obsidian .cm-line .cm-hashtag-end:is(${sele}) { border: none; font-family: var(--font-text); white-space: nowrap; padding-left: 0; border-bottom-left-radius: 0; border-top-left-radius: 0; }`;

		for (let i in styles) {
			let m = new Map(Object.entries(styles[i]));
			if (!m.get("enable")) { continue; }
			let tag = m.get("tag");
			// replace \ to \\, because \ is a special character in css
			tag = tag.replace(/\\/g, "\\\\");
			// replace / to \/, because / is a special character in css
			tag = tag.replace(/\//g, "\\/");
			let background_color = m.get("background-color");
			if (global_enable["background-color"]) {
				background_color = global["background-color"];
			}
			let text_color = m.get("text-color");
			if (global_enable["text-color"]) {
				text_color = global["text-color"];
			}
			let prefix = m.get("prefix");
			if (global_enable["prefix"]) {
				prefix = global["prefix"];
			}
			let suffix = m.get("suffix");
			if (global_enable["suffix"]) {
				suffix = global["suffix"];
			}
			let radius = m.get("radius");
			if (global_enable["radius"]) {
				radius = global["radius"];
			}
			let text_size = m.get("text-size");
			if (global_enable["text-size"]) {
				text_size = global["text-size"];
			}
			css += `body:not(.annotation-tags-off) :is(.cm-tag-${tag},.tag[href="#${tag}"]) { font-size: ${text_size}; background-color: ${background_color} !important; font-weight: 900; font-style: normal; white-space: nowrap; color: #000000; padding-left: 6px; padding-right: 6px; border-radius: ${radius}; }`;
			css += `body:not(.annotation-tags-off) .cm-s-obsidian .cm-line span:is(.cm-tag-${tag}) { color: ${text_color}; }`;
			if (prefix != "") {
				css += `body:not(.annotation-tags-off) .cm-s-obsidian .cm-line .cm-hashtag-end:is(cm-tag-${tag}) { padding-left: 6px; }`;
				css += `body:not(.annotation-tags-off) :is(.cm-hashtag-begin.cm-tag-${tag},.tag[href="#${tag}"])::before { content: "${prefix} "; }`;
			}
			if (suffix != "") {
				css += `body:not(.annotation-tags-off) :is(.cm-hashtag-end.cm-tag-${tag},.tag[href="#${tag}"])::after { content: " ${suffix}"; }`;
			}
		}
		// plugin setting
		css += `.colorful-tag-rule.is-collapsed > .cm-s-obsidian > .setting-item { display: none; }`;
		css += `.colorful-tag-rule { margin-top: 15px; }`;
		css += `.colorful-tag-collapse-indicator.is-collapsed > svg { transform: rotate(-90deg); }`;
		css += `.colorful-tag-collapse-indicator > svg { height: 9px; width: 9px; margin-right: 8px; }`
		css += `.colorful-tag-setting-title { font-weight: 900; font-style: normal; white-space: nowrap; color: #000000; padding-right: 6px; padding-left: 6px; border-radius: 4px; }`
		css += `.colorful-tag-setting-title.cm-hashtag-begin { white-space: nowrap; padding-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }`
		css += `.colorful-tag-setting-title.cm-hashtag-end { font-family: var(--font-text); padding-left: 0; border-bottom-left-radius: 0; border-top-left-radius: 0; }`
		css += `.colorful-tag-setting-title.setting-title { line-height: 1.8em; font-size: 1.8em; width: 300px; height: 50px; margin: 0 auto; background-color: #ffdc5180; }`
		css += `.colorful-tag-setting-title.setting-title::before { content: "🎨 "; }`
		// invisible setting items while the global setting is enable
		for (let attr of this.settings.attrList) {
			let attr_alt = attr.replace(/ /g, "-");
			if (global_enable[attr_alt]) {
				css += `.setting-${attr_alt} { display: none; }`;
			}
		}
		el.innerHTML = css;
		del.forEach((e) => { e.remove() });
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.refresh();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		await this.refresh();
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ColorfulTagSettingTab extends PluginSettingTab {
	plugin: ColorfulTag;

	constructor(app: App, plugin: ColorfulTag) {
		super(app, plugin);
		this.plugin = plugin;
	}
	refreshHeader(hashtag: HTMLSpanElement, content: HTMLSpanElement, tag: string) {
		hashtag.classList.add("cm-tag-" + tag);
		content.classList.add("cm-tag-" + tag);
		content.setText(tag);
	}

	asetting(i: number, add: boolean = false) {
		const { containerEl } = this;
		let thisSetting = this.plugin.settings;
		let styles = thisSetting.styleList;
		let global = thisSetting.global;
		let global_enable = thisSetting.global_enable;
		let div = containerEl.createDiv("colorful-tag-rule is-collapsed");
		let inner = div.createDiv("cm-s-obsidian");
		let header = inner.createDiv("cm-line");
		let title = new Setting(header)
			.addToggle(tg => tg
				.setValue(styles[i]["enable"])
				.onChange(v => {
					styles[i]["enable"] = v;
					thisSetting.styleList = styles;
					this.plugin.saveSettings();
				}))
		let ctl = title.nameEl.createEl("span", "colorful-tag-collapse-indicator is-collapsed");
		if (add) {
			div.className = "colorful-tag-rule";
			ctl.className = "colorful-tag-collapse-indicator";
		}
		ctl.innerHTML = '<svg viewBox="0 0 100 100" class="right-triangle" width="16" height="16"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>';
		ctl.onClickEvent(() => {
			if (ctl.className == "colorful-tag-collapse-indicator is-collapsed") {
				div.className = "colorful-tag-rule";
				ctl.className = "colorful-tag-collapse-indicator"
			} else {
				div.className = "colorful-tag-rule is-collapsed";
				ctl.className = "colorful-tag-collapse-indicator is-collapsed"
			}
		})
		let hashtag = title.nameEl.createEl("span", "cm-hashtag-begin cm-tag-" + styles[i]["tag"]);
		hashtag.setText("#")
		let content = title.nameEl.createEl("span", "cm-hashtag-end cm-tag-" + styles[i]["tag"]);
		content.setText(styles[i]["tag"])
		new Setting(inner)
			.setName("tag")
			.addText(text => text
				.setValue(styles[i]["tag"])
				.onChange(async (value) => {
					styles[i]["tag"] = value;
					this.refreshHeader(hashtag, content, styles[i]["tag"]);
					thisSetting.styleList = styles;
					this.plugin.saveSettings();
				}))
			.setDesc("Enter a tag (without #)")

		for (let attr of thisSetting.attrList) {
			// after 1.0.4, "color" in styleList change to "background color"
			if (attr == "background color" && styles[i]["color"]) {
				styles[i]["background-color"] = styles[i]["color"];
				delete styles[i]["color"];
				thisSetting.styleList = styles;
				this.plugin.saveSettings();
			}
			// replace " " to "-"
			let attr_alt = attr.replace(/ /g, "-");
			if (global_enable[attr_alt]) { continue }
			
			new Setting(inner)
			.setName(attr)
			.addText(text => text
				.setValue(styles[i][attr_alt])
				.onChange(async (value) => {
					styles[i][attr_alt] = value;
					this.refreshHeader(hashtag, content, styles[i]["tag"]);
					this.plugin.settings.styleList = styles;
					this.plugin.saveSettings();
				}))
			.setClass(`setting-${attr_alt}`)
		}
		new Setting(inner)
			.addButton(btn => btn
				.setButtonText("Remove")
				.onClick(() => {
					styles.remove(styles[i]);
					div.remove();
					this.plugin.settings.styleList = styles;
					this.plugin.saveSettings();
				}))
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// plugin setting page title
		let thisSetting = this.plugin.settings;

		let global_title = containerEl.createDiv("colorful-tag-setting-title setting-title");
		let hashtag = global_title.createEl("span", "colorful-tag-setting-title cm-hashtag-begin");
		hashtag.setText("#")
		let content = global_title.createEl("span", "colorful-tag-setting-title cm-hashtag-end");
		content.setText("Colorful-Tag")

		// add button
		let styles = thisSetting.styleList;
		let btn = containerEl.createEl('button', { text: "Add" });

		// global setting
		let globalDiv = containerEl.createDiv("colorful-tag-rule is-collapsed");
		let globalInner = globalDiv.createDiv("cm-s-obsidian");
		let globalHeader = globalInner.createDiv("cm-line");

		let globalCtl = globalHeader.createEl("span", "colorful-tag-collapse-indicator is-collapsed");
		let globalTitle = globalHeader.createEl("span", "");
		globalTitle.setText("Global Setting");
		globalCtl.innerHTML = '<svg viewBox="0 0 100 100" class="right-triangle" width="16" height="16"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>';
		globalCtl.onClickEvent(() => {
			if (globalCtl.className == "colorful-tag-collapse-indicator is-collapsed") {
				globalDiv.className = "colorful-tag-rule";
				globalCtl.className = "colorful-tag-collapse-indicator"
			} else {
				globalDiv.className = "colorful-tag-rule is-collapsed";
				globalCtl.className = "colorful-tag-collapse-indicator is-collapsed"
			}
		})
		// create setting for every attr in attrList
		let global = thisSetting.global;
		let global_enable = thisSetting.global_enable;
		for (let attr of thisSetting.attrList) {
			// replace " " to "-"
			let attr_alt = attr.replace(/ /g, "-");
			let setting = new Setting(globalInner)
				.setName(attr)
				.addText(text => text
					.setValue(global[attr_alt])
					.setDisabled(!global_enable[attr_alt])
					.onChange(async (value) => {
						global[attr_alt] = value;
						this.plugin.settings.global = global;
						this.plugin.saveSettings();
					}))
				.addToggle(toggle => toggle
					.setValue(global_enable[attr_alt] || false)
					.onChange(v => {
						global_enable[attr_alt] = v;
						this.plugin.settings.global_enable = global_enable;
						setting.components[0].setDisabled(!v);
						this.plugin.saveSettings();
					}))
		}
		this.plugin.registerDomEvent(btn, 'click', (evt: MouseEvent) => {
			let m = new Map<string, any>();
			styles.push(m);
			let i = styles.length - 1;
			styles[i]["tag"] = "";
			styles[i]["prefix"] = "";
			styles[i]["suffix"] = "";
			styles[i]["background-color"] = "";
			styles[i]["text-color"] = "";
			styles[i]["text-size"] = "";
			styles[i]["radius"] = "";
			styles[i]["enable"] = true;
			this.asetting(i, true);
		});

		for (let k = 0; k < styles.length; k++) {
			let i = k;
			this.asetting(i);
		}
	}
}
