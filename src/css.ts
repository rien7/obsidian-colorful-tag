export class css {
    static defaultCss = `
    .small-input > .setting-item-control > input {
        width: 60px;
    }
    .small-button {
        padding-left: 8px;
        padding-right: 8px;
    }
    .vertical-tab-content {
        overflow-y: overlay;
    }
    .setting-item:first-child {
        padding-top: 0.75em;
    }
    .colorful-tag-setting-header > div > div > .setting-item {
        border-bottom: 1px solid var(--background-modifier-border);
    }
    .colorful-tag-collapse-indicator > svg {
        height: 10px;
        width: 10px;
        margin-right: 8px;
        transform: rotate(90deg);
    }
    .colorful-tag-collapse-indicator.is-collapsed > svg {
        transform: rotate(0deg);
    }
    .colorful-tag-setting-header.is-collapsed > .colorful-tag-setting-body {
        display: none;
    }
    `.replace(/[ \t\n]/g, "")
}