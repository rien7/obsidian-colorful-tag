import { App, Modal, Plugin, PluginSettingTab, Setting, TextComponent } from 'obsidian';

interface ColorfulTagSetting {
	global_enable: Object;
	global: Object;
	attrList: Array<string>;
	defaultStyle: Map<string, any>;
	styleList: Array<Object>;
}

const DEFAULT_SETTINGS: ColorfulTagSetting = {
	global_enable: new Map(),
	global: new Map(),
	attrList: ["radius", "prefix", "suffix", "background color", "text color", "text size"],
	defaultStyle: new Map<string, any>([['radius', "4px"], ['prefix', ''], ['suffix', ''], ['background -color', ''], ['text-color', '#000'], ['text-size', '16px']]),
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
		let global = new Map(Object.entries(this.settings.global));
		let global_enable = new Map(Object.entries(this.settings.global_enable));
		let default_style = new Map(this.settings.defaultStyle);

		let css = "";
		let el = head.createEl("style", { "type": "text/css", "attr": { "colorful-tag-plugin": "" } });

		for (let i in styles) {
			let m = new Map(Object.entries(styles[i]));
			if (!m.get("enable")) { continue; }
			let tag = m.get("tag");
			// replace \ to \\, because \ is a special character in css
			tag = tag.replace(/\\/g, "\\\\");
			// replace / to \/, because / is a special character in css
			tag = tag.replace(/\//g, "\\/");
			let background_color = global.get("background-color") || m.get("background-color") || default_style.get("background-color");
			let text_color = global.get("text-color") || m.get("text-color") || default_style.get("text-color");
			let prefix = global.get("prefix") || m.get("prefix") || default_style.get("prefix");
			let suffix = global.get("suffix") || m.get("suffix") || default_style.get("suffix");
			let radius = global.get("radius") || m.get("radius") || default_style.get("radius");
			let text_size = global.get("text-size") || m.get("text-size") || default_style.get("text-size");

			// reading view: body a.tag[href="#${tag}"] => font-weight, background-color, text-color, text-size, [radius, prefix, suffix, padding], white-space, border
			// edit view: body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag} => font-weight, background-color, text-color, text-size, white-space, border
			//                                .cm-hashtag-begin => prefix, radius, padding
			//						          .cm-hashtag-end => suffix, radius, padding
			// reading view && edit view
			css += `body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag} { font-weight: 900; background-color: ${background_color}; color: ${text_color}; font-size: ${text_size}; white-space: nowrap; border: none; }`;
			// only reading view
			css += `body a.tag[href="#${tag}"] { border-radius: ${radius}; padding-left: 6px; padding-right: 6px; }`;
			// edit view begin
			css += `body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag}.cm-hashtag-begin { border-top-right-radius: 0; border-bottom-right-radius: 0; padding-right: 0px; border-top-left-radius: ${radius}; border-bottom-left-radius: ${radius}; padding-left: 6px; }`;
			// edit view end
			css += `body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag}.cm-hashtag-end { border-bottom-left-radius: 0; border-top-left-radius: 0; padding-left: 0px; border-top-right-radius: ${radius}; border-bottom-right-radius: ${radius}; padding-right: 6px; }`;
			if (prefix != "") {
				css += `:is(body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag}.cm-hashtag-begin)::before { content: "${prefix} "; }`;
			}
			if (suffix != "") {
				css += `:is(body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag}.cm-hashtag-end)::after { content: " ${suffix}"; }`;
			}
		}
		// invisible setting items while the global setting is enable
		for (let attr of this.settings.attrList) {
			let attr_alt = attr.replace(/ /g, "-");
			if (global_enable.get(attr_alt)) {
				css += `.setting-${attr_alt} { display: none; }`;
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

		el.innerHTML = css;
		del.forEach((e) => { e.remove() });
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.attrList = DEFAULT_SETTINGS.attrList;
		this.settings.defaultStyle = DEFAULT_SETTINGS.defaultStyle;
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
		let hashlist = hashtag.classList;
		let contlist = content.classList;
		if (hashlist.length > 3) {
			hashtag.classList.remove(hashlist[2]);
			content.classList.remove(contlist[2]);
		}
		hashtag.classList.add("cm-tag-" + tag);
		content.classList.add("cm-tag-" + tag);
		content.setText(tag);
	}

	asetting(i: number, add: boolean = false) {
		const { containerEl } = this;
		let thisSetting = this.plugin.settings;
		let styles = thisSetting.styleList;
		let global = thisSetting.global;
		let global_enable = new Map(Object.entries(thisSetting.global_enable));

		let m = new Map(Object.entries(styles[i]));
		let tag_name = m.get("tag");
		let div = containerEl.createDiv("colorful-tag-rule is-collapsed");
		let inner = div.createDiv("cm-s-obsidian");
		let header = inner.createDiv("cm-line");
		let title = new Setting(header)
			.addToggle(tg => tg
				.setValue(m.get("enable"))
				.onChange(v => {
					m.set("enable", v);
					thisSetting.styleList[i] = Object.fromEntries(m);
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
		let hashtag = title.nameEl.createEl("span", "cm-hashtag cm-hashtag-begin cm-tag-" + tag_name);
		hashtag.setText("#")
		let content = title.nameEl.createEl("span", "cm-hashtag cm-hashtag-end cm-tag-" + tag_name);
		content.setText(tag_name)
		new Setting(inner)
			.setName("tag")
			.addText(text => text
				.setValue(tag_name)
				.onChange(async (value) => {
					m.set("tag", value);
					thisSetting.styleList[i] = Object.fromEntries(m);
					this.refreshHeader(hashtag, content, m.get("tag"));

					this.plugin.saveSettings();
				}))
			.setDesc("Enter a tag (without #)")

		for (let attr of thisSetting.attrList) {
			// after 1.0.4, "color" in styleList change to "background color"
			if (attr == "background color" && m.get("color")) {
				m.set("background color", m.get("color"));
				m.delete("color");
				thisSetting.styleList[i] = Object.fromEntries(m);
				this.plugin.saveSettings();
			}
			// replace " " to "-"
			let attr_alt = attr.replace(/ /g, "-");
			if (global_enable.get(attr_alt)) { continue }

			new Setting(inner)
				.setName(attr)
				.addText(text => text
					.setValue(m.get(attr_alt))
					.onChange(async (value) => {
						m.set(attr_alt, value);
						thisSetting.styleList[i] = Object.fromEntries(m);
						this.refreshHeader(hashtag, content, m.get("tag"));
						this.plugin.saveSettings();
					}))
				.setClass(`setting-${attr_alt}`)
		}
		new Setting(inner)
			.addButton(btn => btn
				.setButtonText("Remove")
				.onClick(() => {
					div.remove();
					thisSetting.styleList.splice(i, 1);
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
		let global = new Map(Object.entries(thisSetting.global));
		let global_enable = new Map(Object.entries(thisSetting.global_enable));
		for (let attr of thisSetting.attrList) {
			// replace " " to "-"
			let attr_alt = attr.replace(/ /g, "-");
			let setting = new Setting(globalInner)
				.setName(attr)
				.addText(text => text
					.setValue(global.get(attr_alt))
					.setDisabled(!global_enable.get(attr_alt))
					.onChange(async (value) => {
						global.set(attr_alt, value);
						this.plugin.settings.global = Object.fromEntries(global);
						this.plugin.saveSettings();
					}))
				.addToggle(toggle => toggle
					.setValue(global_enable.get(attr_alt) || false)
					.onChange(v => {
						global_enable.set(attr_alt, v);
						this.plugin.settings.global_enable = Object.fromEntries(global_enable);
						let text = setting.components[0] as TextComponent;
						text.setDisabled(!v);
						if (!v) {
							text.setValue("");
							global.delete(attr_alt);
							this.plugin.settings.global = Object.fromEntries(global);
						}
						this.plugin.saveSettings();
					}))
		}
		this.plugin.registerDomEvent(btn, 'click', (evt: MouseEvent) => {
			let m = new Map<string, any>();
			for (let attr of thisSetting.attrList) {
				// replace " " to "-"
				let attr_alt = attr.replace(/ /g, "-");
				m.set(attr_alt, "");
			}
			m.set("tag", "");
			m.set("enable", true);
			styles.push(Object.fromEntries(m));
			let i = styles.length - 1;
			this.asetting(i, true);
		});

		for (let k = 0; k < styles.length; k++) {
			this.asetting(k);
		}
	}
}
