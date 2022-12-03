import { AttributeType } from "./attributeType";
import { TSMap } from "typescript-map";

export class TagDetail {
    private dataType: TSMap<string, AttributeType>
    private defaultValue: TSMap<string, string | null>

    addItem(name: string, type: AttributeType) {
        this.dataType.set(name, type);
        this.defaultValue.set(name, null);
    }

    addDefaultValue(name: string, value: string | null) {
        this.defaultValue.set(name, value);
    }

    deleteItem(name: string) {
        this.dataType.delete(name);
        this.defaultValue.delete(name);
    }
}

export class TagDetailItem {
    readonly parent: TagDetail;

    constructor(parent: TagDetail) {
        this.parent = parent
    }
}