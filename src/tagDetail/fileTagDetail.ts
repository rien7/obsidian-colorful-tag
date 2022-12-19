import ColorfulTag from "main";
import { TFile, parseYaml, stringifyYaml, CachedMetadata } from "obsidian";
import { TagDetailUtils } from "./tagDetailUtils";

export class FileTagDetail {
    kvss: (Map<string, string | null> | null)[] = []
    private plugin: ColorfulTag
    private file: TFile | null;
    private content: string | null;
    private yaml: any | null;

    static shadowText: Array<[string, string]> = new Array()

    getTagData(i: number): Map<string, string | null> | null {
        let len = this.kvss.length;
        if (i >= len) {
            for (let j = len; j < i; j++) {
                this.kvss.push(null)
            }
            this.kvss.push(null)
        }
        console.log("get tag data")
        console.log(this.kvss)
        console.log(this.kvss[i])
        return this.kvss[i]
    }

    setTagData(i: number, data: Map<string, string | null>) {
        let len = this.kvss.length;
        if (i >= len) {
            for (let j = len; j < i; j++) {
                this.kvss.push(null)
            }
        }
        this.kvss[i] = data
    }

    addTagData(i: number) {
        let len = this.kvss.length;
        if (i >= len) {
            for (let j = len; j < i; j++) {
                this.kvss.push(null)
            }
        }
        this.kvss[i]  = new Map()
        console.log("add tag data")
        console.log(this.kvss)
    }

    constructor(plugin: ColorfulTag) {
        this.plugin = plugin
        this.file = this.plugin.app.workspace.getActiveFile()!
    }

    private async readFile() {
        if (this.file == null) this.file = this.plugin.app.workspace.getActiveFile()!
        this.content = await this.plugin.app.vault.read(this.file);
    }

    async getFrontmatter() {
        if (this.content == null) await this.readFile()
        if (this.plugin.settings.StoreTagDetailInYaml == "plugin") {
            let dataMap = this.plugin.settings.TagDetailData as Map<string, Array<Map<string, string | null>>>
            let data = dataMap.get(this.file!.path)
            if (data == undefined) {
                this.kvss = new Array()
            } else {
                this.kvss = data
            }
            return;
        }
        const match = this.content?.match(/^---\s+([\w\W]+?)\s+---/);
        if (match) {
            const frontmatterRaw = match[1];
            const yaml = parseYaml(frontmatterRaw);
            this.yaml = yaml
        }
        this.yaml2map()
    }

    async writeFrontmatter() {
        console.log("write frontmatter")
        if (this.plugin.settings.StoreTagDetailInYaml == "plugin") {
            let dataMap = this.plugin.settings.TagDetailData as Map<string, Array<Map<string, string | null>>>
            let arr = new Array<Map<string, string | null>>()
            this.kvss.forEach((v) => {
                if (v == null) {
                    arr.push(new Map())
                } else {
                    arr.push(v)
                }
            })
            dataMap.set(this.file!.path, arr)
            this.plugin.settings.TagDetailData = dataMap
            this.plugin.saveSettings()
            return
        };
        this.map2yaml()
        if (this.content?.match(/^---\s+([\w\W]+?)\s+---/)) {
            this.content = this.content.replace(/^---\s+([\w\W]+?)\s+---/, `---\n${stringifyYaml(this.yaml)}---`)
        } else {
            this.content = `---\n${stringifyYaml(this.yaml)}---\n${this.content}`
        }
        await this.plugin.app.vault.modify(this.file!, this.content || "")
    }

    private yaml2map() {
        if (this.yaml == null) {
            this.yaml = {}
            return
        }
        let tagDetails = this.yaml["colorful-tag"]
        if (tagDetails == undefined) return
        for (let name in tagDetails) {
            let m = new Map<string, string | null>()
            for (let k in tagDetails[name]) {
                m.set(k, tagDetails[name][k])
            }
            this.kvss.push(m)
        }
    }

    private map2yaml() {
        this.yaml["colorful-tag"] = this.kvss
    }

    static async handleMetadataChange(file: TFile, data: string, cache: CachedMetadata, plugin: ColorfulTag) {
        let activeFile = plugin.app.workspace.getActiveFile()
        if (activeFile == null || file != activeFile) return
        let tags = cache.tags
        if (tags == undefined) tags = []

        TagDetailUtils.fileTagDetail = new FileTagDetail(plugin)
        await TagDetailUtils.fileTagDetail.getFrontmatter()

        let metaFileTagDetail = plugin.settings.MetaFileTagDetails! as Map<string, string[]>
        let tagsMeta = metaFileTagDetail.get(file.path) || []

        if (tagsMeta.length == tags.length) {
            let dirty = false
            tags.forEach((v, i) => {
                let s = v.position.start
                if (tagsMeta[i] != `${v.tag}-${s.line}-${s.col}-${s.offset}`) {
                    dirty = true
                    tagsMeta[i] =  `${v.tag}-${s.line}-${s.col}-${s.offset}`
                }
            })
            if (!dirty) return
        } else if (tagsMeta.length < tags.length) {
            let j = tags.length - tagsMeta.length
            for (let i = 0; i < tags.length; i++) {
                let s = tags[i].position.start
                // unchange part
                if (tagsMeta[i] && tagsMeta[i] == `${tags[i].tag}-${s.line}-${s.col}-${s.offset}`)
                    continue
                // insert new tag
                tagsMeta.splice(i, 0, `${s.line}-${s.col}-${s.offset}`)
                TagDetailUtils.fileTagDetail.kvss.splice(i, 0, null)
                FileTagDetail.shadowText.splice(i, 0, ["", ""])
                j--
                if (j == 0) break
            }
            // TagDetailUtils.removeListener()
            // await TagDetailUtils.hoverTagPopupListener(plugin)
        } else {
            let j = tagsMeta.length - tags.length
            for (let i = 0, k = 0; i < tagsMeta.length; i++, k++) {
                if (i < tags.length) {
                    // unchange part
                    let s = tags[i].position.start
                    if (tagsMeta[i] && tagsMeta[i] == `${tags[i].tag}-${s.line}-${s.col}-${s.offset}`)
                        continue
                }
                // delete tag
                tagsMeta.splice(k, 1)
                TagDetailUtils.fileTagDetail.kvss.splice(k, 1)
                FileTagDetail.shadowText.splice(k, 1)
                k--
                j--
                if (j == 0) break
            }
            // TagDetailUtils.removeListener()
            // await TagDetailUtils.hoverTagPopupListener(plugin)
        }
        if (tagsMeta.length != tags.length) {
            await TagDetailUtils.fileTagDetail.writeFrontmatter()
        }
        metaFileTagDetail.set(file.path, tagsMeta)
        TagDetailUtils.removeListener()
        await TagDetailUtils.hoverTagPopupListener(plugin)
        plugin.settings.MetaFileTagDetails = metaFileTagDetail
        await plugin.saveSettings()
    }
}