import { Setting, setIcon } from "obsidian";

export function insertCss(css: string) {
    let head = document.querySelector("head")!
    let del = head.querySelectorAll(`[colorful-tag-style]`)
    del.forEach((d) => { d.remove() })
    head.createEl("style", { "type": "text/css", "attr": { "colorful-tag-style": "" } })
    .setText(css);
}

export function convertTag(tag1: string): string[]{
    let tag2 = tag1;
    tag1 = tag1.replace(/\//g, "\\/");
    tag2 = tag2.replace(/\//g, "");
    return [tag1, tag2]
}

