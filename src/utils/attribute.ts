import { AttributeType } from "./attributeType";

export class Attribute {
    readonly name: string;
    readonly displayName: string;
    readonly description: string | null;
    readonly type: AttributeType;
    readonly cssName: string | null;
    readonly important: boolean;
    constructor(name: string, type: AttributeType, cssName: string | null, displayName: string, description: string | null = null, important: boolean = false) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.type = type;
        this.cssName = cssName;
        this.important = important;
    }
    static AttributeList: Map<string, Attribute> = new Map<string, Attribute>([
        ["prefix", new Attribute("prefix", AttributeType.Text, "content", "Prefix")],
        ["suffix", new Attribute("suffix", AttributeType.Text, "content", "Suffix")],
        ["background-color", new Attribute("background-color", AttributeType.Color, "background-color", "Background Color")],
        ["text-color", new Attribute("text-color", AttributeType.Color, "color", "Text Color")],
        ["text-size", new Attribute("text-size", AttributeType.Size, "font-size", "Text Size")],
        ["font-weight", new Attribute("font-weight", AttributeType.Number, "font-weight", "Font Weight")],
        ["border", new Attribute("border", AttributeType.Any, "border", "Border")],
        ["radius", new Attribute("radius", AttributeType.Size, "radius", "Radius")],
        ["nest-tag", new Attribute("nest-tag", AttributeType.Boolean, null, "Enable Nest Tag")],
        ["remove-hash", new Attribute("remove-hash", AttributeType.Boolean, null, "Remove Hash", "Set true to remove '#' of the tag.\nFor example: '😎#Nice' => '😎Nice'")],
        ["remove-tag-name", new Attribute("remove-tag-name", AttributeType.Boolean, null, "Remove Tag Name", "Set true to remove the 'tag name'.\nFor example: '😎#Nice' => '😎#'")]
    ])
}
