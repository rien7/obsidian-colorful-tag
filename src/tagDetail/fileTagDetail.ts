import ColorfulTag from "main";
import { TFile, parseYaml, stringifyYaml, CachedMetadata } from "obsidian";
import { TagDetailUtils } from "./tagDetailUtils";

export class FileTagDetail {
    kvss: Map<string, string | null>[] = []
    private plugin: ColorfulTag
    private file: TFile | null;
    private content: string | null;
    private yaml: any | null;

    static shadowText: Array<string> = new Array()

    getTagData(i: number): Map<string, string | null> | null {
        if (this.kvss.length == 0) {
            return null
        }
        return this.kvss[i]
    }

    setTagData(i: number, data: Map<string, string | null>) {
        this.kvss[i] = data
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
        const match = this.content?.match(/^---\s+([\w\W]+?)\s+---/);
        if (match) {
            const frontmatterRaw = match[1];
            const yaml = parseYaml(frontmatterRaw);
            this.yaml = yaml
        }
        this.yaml2map()
    }

    async writeFrontmatter() {
        this.map2yaml()
        console.log(this.yaml)
        if (this.content?.match(/^---\s+([\w\W]+?)\s+---/)) {
            this.content = this.content.replace(/^---\s+([\w\W]+?)\s+---/, `---\n${stringifyYaml(this.yaml)}---`)
        } else {
            this.content = `---\n${stringifyYaml(this.yaml)}---\n${this.content}`
        }
        console.log(this.content)
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
        if (tags == undefined) return

        TagDetailUtils.fileTagDetail = new FileTagDetail(plugin)
        await TagDetailUtils.fileTagDetail.getFrontmatter()

        let metaFileTagDetail = plugin.settings.MetaFileTagDetails as Map<string, string[]>
        let tagsMeta = metaFileTagDetail.get(file.path) || []
        if (tagsMeta.length == tags.length) {
            let dirty = false
            tags.forEach((v, i) => {
                let s = v.position.start
                if (tagsMeta[i] != `${s.line}-${s.col}-${s.offset}`) {
                    dirty = true
                    tagsMeta[i] =  `${s.line}-${s.col}-${s.offset}`
                }
            })
            if (!dirty) return
        } else if (tagsMeta.length < tags.length) {
            let j = tags.length - tagsMeta.length
            for (let i = 0; i < tags.length; i++) {
                let s = tags[i].position.start
                // unchange part
                if (tagsMeta[i] && tagsMeta[i] == `${s.line}-${s.col}-${s.offset}`)
                    continue
                // insert new tag
                console.log(i)
                tagsMeta.splice(i, 0, `${s.line}-${s.col}-${s.offset}`)
                TagDetailUtils.fileTagDetail.kvss.splice(i, 0, new Map())
                j--
                if (j == 0) break
            }
            // TagDetailUtils.removeListener()
            // await TagDetailUtils.hoverTagPopupListener(plugin)
        } else {
            let j = tagsMeta.length - tags.length
            for (let i = 0; i < tagsMeta.length; i++) {
                if (i < tags.length) {
                    let s = tags[i].position.start
                    // unchange part
                    if (tagsMeta[i] && tagsMeta[i] == `${s.line}-${s.col}-${s.offset}`)
                        continue
                }
                console.log(i)
                // delete tag
                tagsMeta.splice(i, 1)
                TagDetailUtils.fileTagDetail.kvss.splice(i, 1)
                FileTagDetail.shadowText.splice(i, 1)
                j--
                if (j == 0) break
            }
            // TagDetailUtils.removeListener()
            // await TagDetailUtils.hoverTagPopupListener(plugin)
        }
        await TagDetailUtils.fileTagDetail.writeFrontmatter()
        metaFileTagDetail.set(file.path, tagsMeta)
        TagDetailUtils.removeListener()
        await TagDetailUtils.hoverTagPopupListener(plugin)
        plugin.settings.MetaFileTagDetails = metaFileTagDetail
        await plugin.saveSettings()
    }
}