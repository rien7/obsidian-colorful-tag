import { App, Modal, Plugin, PluginSettingTab, setIcon, Setting, TextComponent } from 'obsidian';

interface ColorfulTagSetting {
	firstTime: boolean;
	global_enable: Object;
	global: Object;
	attrList: Array<string>;
	defaultStyle: Map<string, any>;
	defaultGlobal: Map<string, boolean>;
	styleList: Array<Object>;
	tagDetail: Object;
}

const DEFAULT_SETTINGS: ColorfulTagSetting = {
	firstTime: true,
	global_enable: new Map(),
	global: new Map(),
	attrList: ["radius", "prefix", "suffix", "background color", "text color", "text size", "border", "font weight"],
	defaultStyle: new Map<string, any>([['radius', '4px'], ['prefix', ''], ['suffix', ''], ['background-color', '#fff'], ['text-color', '#000'], ['text-size', '12px'], ['border', 'none'], ['font-weight', '900']]),
	defaultGlobal: new Map<string, boolean>([['radius', false], ['prefix', false], ['suffix', false], ['background-color', false], ['text-color', false], ['text-size', false], ['border', true], ['font-weight', true]]),
	styleList: new Array(),
	tagDetail: new Map(),
}

export default class ColorfulTag extends Plugin {
	settings: ColorfulTagSetting;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ColorfulTagSettingTab(this.app, this));
		this.addListenerForFileOpen();
	}

	onunload() {
		// remove listener
		this.app.workspace.off("active-leaf-change", this.addListenerForTag);
	}

	addPopupCss(tag: string) {
		let head = document.querySelector("head")!;
		let del = head.querySelectorAll("[colorful-tag-plugin-popup]");
		del.forEach((d) => { d.remove() });
		let el = head.createEl("style", { "type": "text/css", "attr": { "colorful-tag-plugin-popup": "" } });
		let styles = this.settings.styleList;
		let global = new Map(Object.entries(this.settings.global));
		let style = new Map<string, any>();
		tag = tag.substring(1);
		for (let i in styles) {
			let m = new Map(Object.entries(styles[i]));
			if (!m.get("enable")) continue;
			if (m.get("tag") == tag) {
				style = m;
				break;
			}
		}
		let tag_lp = tag;
		// replace / to \/, because / is a special character in css
		tag = tag.replace(/\//g, "\\/");
		tag_lp = tag_lp.replace(/\//g, "");
		let background_color = style.get("background-color") || global.get("background-color") || "";
		let text_color = style.get("text-color") || global.get("text-color") || "";
		let prefix = style.get("prefix") || global.get("prefix") || "";
		let suffix = style.get("suffix") || global.get("suffix") || "";
		let radius = style.get("radius") || global.get("radius") || "";
		let text_size = style.get("text-size") || global.get("text-size") || "";
		let font_weight = style.get("font-weight") || global.get("font-weight") || "";
		let css = "";
		css += `#colorful-tag-popup { position: absolute; z-index: 100; }`;
		css += `.colorful-tag-popup-header { display: flex; padding: 5px 10px; background-color: ${background_color}; color: ${text_color}; font-size: ${text_size}; font-weight: ${font_weight}; border-radius: 10px 10px 0 0; }`;
		css += `.colorful-tag-popup-pin { margin-left: auto; }`;
		css += `.colorful-tag-popup-pin.pinned > svg { transform: rotate(45deg); }`;
		if (prefix != "") {
			css += `.colorful-tag-popup-header:before { content: "${prefix}"; }`;
		}
		if (suffix != "") {
			css += `.colorful-tag-popup-header:after { content: "${suffix}"; }`;
		}
		css += `.colorful-tag-popup-body { padding: 5px 10px; border: 4px solid ${background_color}; border-radius: 0 0 10px 10px; border-top: none; background-color: #fff; }`;
		css += `#colorful-tag-popup input[type="text"] { border: none; }`;
		css += `#colorful-tag-popup input[type="text"]:focus { border: inherit; }`;
		el.setText(css);
	}

	async refreshPopupBody(body: Setting, tag: string, filename: string, pos: string) {
		let tagDetail = new Map(Object.entries(this.settings.tagDetail));
		let tags = new Map<string, any>(Object.entries(tagDetail.get(filename)));
		let items = new Map(Object.entries(tags.get(`${tag}-${pos}`)));
		for (let [k, v] of items.entries()) {
			let item = body.addText((t) => {
				t.setValue(v as string);
				t.onChange(async (value) => {
					items.set(k, value);
					tags.set(`${tag}-${pos}`, Object.fromEntries(items));
					tagDetail.set(filename, Object.fromEntries(tags));
					this.settings.tagDetail = Object.fromEntries(tagDetail);
					await this.saveData(this.settings);
				});
			});
			item.setName(k);
		}
	}

	async addPopup(event: MouseEvent, tag: string, filename: string, pos: string) {
		// get mouse position
		let countdown = 3;
		let x = event.clientX;
		let y = event.clientY;
		
		let popup = document.createElement("div");
		this.addPopupCss(tag);
		// set id
		popup.setAttribute("id", "colorful-tag-popup");
		popup.style.left = x + 20 + "px";
		popup.style.top = y + 20 + "px";
		popup.style.minWidth = "100px";
		popup.style.minHeight = "50px";
		let header = popup.createDiv("colorful-tag-popup-header");
		header.setText(tag);
		let pin = header.createDiv("colorful-tag-popup-pin");
		setIcon(pin, "pin");
		this.registerDomEvent(pin, "click", () => {
			if (pin.classList.contains("pinned")) {
				pin.classList.remove("pinned");
				countdown = 3;
			} else {
				pin.classList.add("pinned");
				countdown = 99999;
			}
		});
		let body = new Setting(popup);
		body.setClass("colorful-tag-popup-body");
		let tagDetail = new Map(Object.entries(this.settings.tagDetail));
		let _file = tagDetail.get(filename);
		if (_file == undefined) {
			body.addButton((b) => {
				b.setButtonText("Add");
				b.onClick(async () => {
					tagDetail.set(filename, Object.fromEntries(new Map([[`${tag}-${pos}`, Object.fromEntries(new Map([["test", "testtest"]]))]])));
					this.settings.tagDetail = Object.fromEntries(tagDetail);
					this.saveSettings();
					await this.saveData(this.settings);
					body.clear();
					await this.refreshPopupBody(body, tag, filename, pos);
				});
			})
		} else {
			let _tag = new Map<string, any>(Object.entries(_file));
			let _items = _tag.get(`${tag}-${pos}`);
			if (_items == undefined) {
				body.addButton((b) => {
					b.setButtonText("Add");
					b.onClick(async () => {
						_tag.set(`${tag}-${pos}`, Object.fromEntries(new Map([["test", "testtest"]])));
						tagDetail.set(filename, Object.fromEntries(_file));
						this.settings.tagDetail = Object.fromEntries(tagDetail);
						await this.saveData(this.settings);
						body.clear();
						await this.refreshPopupBody(body, tag, filename, pos);
					});
				})
			} else {
				await this.refreshPopupBody(body, tag, filename, pos);
			}
		}
		document.body.appendChild(popup);
		this.registerDomEvent(popup, "mouseover", () => {
			countdown = 9999;
		})
		this.registerDomEvent(popup, "mouseout", () => {
			if (!pin.classList.contains("pinned")) {
				countdown = 3;
			}
		});
		// sleep 1s and decrease countdown, if countdown == 0, delete popup
		let timer = setInterval(() => {
			countdown--;
			if (countdown == 0) {
				popup.remove();
				clearInterval(timer);
			}
		}, 1000);
	}

	async addListenerForTag() {
		let _file = this.app.workspace.getActiveFile();
		if (_file == null) return;
		let file = _file!;
		let cache = this.app.metadataCache.getFileCache(file);
		if (cache?.tags == null) return;
		// query tag on this page
		let tags = document.querySelectorAll(".cm-hashtag.cm-hashtag-end");
		let i = 0;
		tags.forEach((tag) => {
			//get previous element
			let pos = cache?.tags![i].position;
			let tagname = cache?.tags![i].tag!;
			let prev = tag.previousElementSibling!;
			this.registerDomEvent(tag as HTMLElement, "mouseover", (e) => {
				// check if popup exists
				let popup = document.querySelector("#colorful-tag-popup");
				if (popup != null)
					return
				this.addPopup(e as MouseEvent, tagname, file.path, pos!.start.line + ":" + pos!.start.col);
			});
			this.registerDomEvent(prev as HTMLElement, "mouseover", (e) => {
				let popup = document.querySelector("#colorful-tag-popup");
				if (popup != null)
					return
				this.addPopup(e as MouseEvent, tagname, file.path, pos!.start.line + ":" + pos!.start.col);
			});
			i++;
		});
	}
	async addListenerForFileOpen() {
		this.app.workspace.on("active-leaf-change", async () => {
			await this.addListenerForTag();
		});
	}

	async refresh() {
		let head = document.querySelector("head")!;
		let del = head.querySelectorAll("[colorful-tag-plugin]");
		let styles = this.settings.styleList;
		let global = new Map(Object.entries(this.settings.global));
		let global_enable = new Map(Object.entries(this.settings.global_enable));

		let css = "";
		let el = head.createEl("style", { "type": "text/css", "attr": { "colorful-tag-plugin": "" } });

		for (let i in styles) {
			let m = new Map(Object.entries(styles[i]));
			if (!m.get("enable")) { continue; }
			let tag = m.get("tag");
			let tag_lp = tag;
			// replace / to \/, because / is a special character in css
			tag = tag.replace(/\//g, "\\/");
			tag_lp = tag_lp.replace(/\//g, "");
			let background_color = m.get("background-color") || global.get("background-color") || "";
			let text_color = m.get("text-color") || global.get("text-color") || "";
			let prefix = m.get("prefix") || global.get("prefix") || "";
			let suffix = m.get("suffix") || global.get("suffix") || "";
			let radius = m.get("radius") || global.get("radius") || "";
			let text_size = m.get("text-size") || global.get("text-size") || "";
			let border = m.get("border") || global.get("border") || "";
			let font_weight = m.get("font-weight") || global.get("font-weight") || "";
			let padding_size = "";

			// reading view: body a.tag[href="#${tag}"] => font-weight, background-color, text-color, text-size, [radius, prefix, suffix, padding], white-space, border
			// edit view: body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag} => font-weight, background-color, text-color, text-size, white-space, border
			//                                .cm-hashtag-begin => prefix, radius, padding
			//						          .cm-hashtag-end => suffix, radius, padding
			// reading view && edit view
			css += `body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag_lp} { font-weight: ${font_weight}; background-color: ${background_color}; color: ${text_color}; font-size: ${text_size}; white-space: nowrap; border: ${border}; }`;
			// only reading view
			css += `body a.tag[href="#${tag}"] { border-radius: ${radius}; padding-left: ${padding_size}; padding-right: ${padding_size}; }`;
			// edit view begin
			css += `body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag_lp}.cm-hashtag-begin { border-top-right-radius: 0; border-bottom-right-radius: 0; padding-right: 0px; border-top-left-radius: ${radius}; border-bottom-left-radius: ${radius}; padding-left: ${padding_size}; }`;
			// edit view end
			css += `body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag_lp}.cm-hashtag-end { border-bottom-left-radius: 0; border-top-left-radius: 0; padding-left: 0px; border-top-right-radius: ${radius}; border-bottom-right-radius: ${radius}; padding-right: ${padding_size}; }`;
			if (prefix != "") {
				css += `:is(body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag_lp}.cm-hashtag-begin)::before { content: "${prefix} "; }`;
			}
			if (suffix != "") {
				css += `:is(body a.tag[href="#${tag}"], body .cm-s-obsidian .cm-line span.cm-hashtag.cm-tag-${tag_lp}.cm-hashtag-end)::after { content: " ${suffix}"; }`;
			}
		}
		// plugin setting
		css += `.colorful-tag-rule.setting-item { margin-top: 0px }`;
		css += `.colorful-tag-rule.is-collapsed > .cm-s-obsidian > .colorful-tag-rule { display: none; }`;
		css += `.colorful-tag-rule.is-collapsed > .cm-s-obsidian > .setting-item { display: none; }`;
		css += `.colorful-tag-rule { margin-top: 15px; }`;
		css += `.colorful-tag-collapse-indicator.is-collapsed > svg { transform: rotate(-90deg); }`;
		css += `.colorful-tag-collapse-indicator > svg { height: 9px; width: 9px; margin-right: 8px; }`
		css += `.colorful-tag-setting-title { font-weight: 900; font-style: normal; white-space: nowrap; color: #000000; padding-right: 6px; padding-left: 6px; border-radius: 4px; }`
		css += `.colorful-tag-setting-title.cm-hashtag-begin { white-space: nowrap; padding-right: 0; border-top-right-radius: 0; border-bottom-right-radius: 0; }`
		css += `.colorful-tag-setting-title.cm-hashtag-end { font-family: var(--font-text); padding-left: 0; border-bottom-left-radius: 0; border-top-left-radius: 0; }`
		css += `.colorful-tag-setting-title.setting-title { line-height: 1.8em; font-size: 1.8em; width: 300px; height: 50px; margin: 0 auto; background-color: #ffdc5180; }`
		css += `.colorful-tag-setting-title.setting-title::before { content: "🎨 "; }`

		el.setText(css);
		del.forEach((e) => { e.remove() });
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.attrList = DEFAULT_SETTINGS.attrList;
		this.settings.defaultStyle = DEFAULT_SETTINGS.defaultStyle;
		this.settings.defaultGlobal = DEFAULT_SETTINGS.defaultGlobal;
		if (this.settings.firstTime) {
			this.settings.firstTime = false;
			let global_enable = new Map(Object.entries(this.settings.global_enable));
			let global = new Map(Object.entries(this.settings.global));
			for (let attr of this.settings.attrList) {
				let attr_alt = attr.replace(/ /g, "-");
				if (this.settings.defaultGlobal.get(attr_alt)) {
					global_enable.set(attr_alt, true);
					global.set(attr_alt, this.settings.defaultStyle.get(attr_alt));
				}
			}
			this.settings.global_enable = Object.fromEntries(global_enable);
			this.settings.global = Object.fromEntries(global);
		}
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
	_el: HTMLElement;

	constructor(app: App, plugin: ColorfulTag) {
		super(app, plugin);
		this.plugin = plugin;
	}

	isBefore(el1: HTMLElement, el2: HTMLElement) {
		if (el2.parentNode == el1.parentNode) {
			for (let cur = el1.previousSibling; cur && cur.nodeType !== 9; cur = cur.previousSibling) {
				if (cur == el2) {
					return true;
				}
			}
		}
		return false;
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
		let global = new Map(Object.entries(thisSetting.global));
		let global_enable = new Map(Object.entries(thisSetting.global_enable));

		let m = new Map(Object.entries(styles[i]));
		let tag_name = m.get("tag");
		let div = containerEl.createDiv("colorful-tag-rule colorful-tag-rule-outer is-collapsed");
		div.setAttr("idx", i);
		div.draggable = true;
		div.ondragover = (e) => {
			let target = e.target as HTMLElement;
			target = target.matchParent(".colorful-tag-rule-outer") as HTMLElement;
			if (target.classList.contains("colorful-tag-rule-outer")) {
				if (this.isBefore(this._el, target))
				target.parentNode?.insertBefore(this._el, target);
				else
				target.parentNode?.insertBefore(this._el, target.nextSibling);
				let tmp = this._el.getAttribute("idx");
				this._el.setAttribute("idx", target.getAttribute("idx")!);
				target.setAttribute("idx", tmp!);
				// swap styles
				let tmp2 = styles[parseInt(this._el.getAttribute("idx")!)!];
				styles[parseInt(this._el.getAttribute("idx")!)!] = styles[parseInt(target.getAttribute("idx")!)!];
				styles[parseInt(target.getAttribute("idx")!)!] = tmp2;
			}
		}
		div.ondragend = () => {
			// save styles
			thisSetting.styleList = styles;
			this.plugin.saveSettings();
		}
		div.ondragstart = (e) => {
			let target = e.target as HTMLElement;
			if (target.classList.contains("colorful-tag-rule-outer")) {
				this._el = target;
				e.dataTransfer?.setData("effectAllowed", "move");
				e.dataTransfer?.setData("text/plain", "");
			}
		}
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
		setIcon(ctl, "right-triangle");
		ctl.onClickEvent(() => {
			ctl.classList.toggle("is-collapsed");
			div.classList.toggle("is-collapsed");
		})
		let tag_lp = tag_name;
		tag_lp = tag_lp.replace(/\//g, "");
		let hashtag = title.nameEl.createEl("span", "cm-hashtag cm-hashtag-begin cm-tag-" + tag_lp);
		hashtag.setText("#")
		let content = title.nameEl.createEl("span", "cm-hashtag cm-hashtag-end cm-tag-" + tag_lp);
		content.setText(tag_name)
		let normal = inner.createDiv("colorful-tag-rule");
		let override = inner.createDiv("setting-item colorful-tag-rule is-collapsed");
		// override seting page
		let override_inner = override.createDiv("cm-s-obsidian");
		override_inner.setAttribute("style", "flex: 1;")
		let override_title = override_inner.createDiv();
		let ctl_override = override_title.createEl("span", "colorful-tag-collapse-indicator is-collapsed");
		setIcon(ctl_override, "right-triangle");
		override_title.createSpan().setText("Override global settings");
		ctl_override.onClickEvent(() => {
			if (ctl_override.className == "colorful-tag-collapse-indicator is-collapsed") {
				override.className = "setting-item colorful-tag-rule";
				ctl_override.className = "colorful-tag-collapse-indicator"
			} else {
				override.className = "setting-item colorful-tag-rule is-collapsed";
				ctl_override.className = "colorful-tag-collapse-indicator is-collapsed"
			}
		})
		new Setting(normal)
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
			let html = normal;
			if (global_enable.get(attr_alt)) {
				html = override_inner;
			}

			let setting = new Setting(html)
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
			if (global_enable.get(attr_alt)) {
				let override_text = setting.components[0] as TextComponent;
				override_text.setPlaceholder(global.get(attr_alt));
			}
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
		setIcon(globalCtl, "right-triangle");
		globalCtl.onClickEvent(() => {
			globalCtl.classList.toggle("is-collapsed");
			globalDiv.classList.toggle("is-collapsed");
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
					.setPlaceholder(thisSetting.defaultStyle.get(attr_alt))
					.onChange(async (value) => {
						global.set(attr_alt, value);
						this.plugin.settings.global = Object.fromEntries(global);
						this.plugin.saveSettings();
					}))
					.setDesc("leave blank to use default value")
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
