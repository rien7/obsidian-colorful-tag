import { AttributeType } from "./attributeType";
import * as crypto from "crypto"

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

export function stringToAttributeType(name: string): AttributeType | null {
    for (let [s, t] of Object.entries(AttributeType)) {
        if (name == s) {
            return t
        }
    }
    return null
}

export function getHash(str: string): string {
    let hash = crypto.createHash("sha256")
    hash.update(str)
    return hash.digest("hex")
}