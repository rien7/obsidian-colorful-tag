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
    .colorful-tag-popup {
        min-width: 250px;
        min-height: 50px;
        position: absolute;
        transition-property: opacity;
        transition-duration: 0.35s;
        animation-name: fadeIn;
        animation-duration: 0.3s;
    }
    .colorful-tag-popup.hidden {
        opacity: 0;
    }
    .colorful-tag-popup-pin {
        margin-left: auto;
    }
    .colorful-tag-popup-header {
        vertical-align: middle;
        line-height: 24px;
    }
    .colorful-tag-popup-pin > svg {
        vertical-align: middle;
    }
    .colorful-tag-popup-pin.pinned > svg {
        transform: rotate(45deg);
        fill: white;
    }
    .setting-item.colorful-tag-popup-item {
        padding-top: 5px;
        padding-bottom: 5px;
    }
    .colorful-tag-popup-body {
        background-color: var(--background-primary);
    }
	.colorful-tag-popup input[type="text"] {
        border: none;
    }
	.colorful-tag-popup input[type="text"]:focus {
        border: inherit;
    }
    .colorful-tag-popup-body .setting-item-control > textarea {
        border: none;
        resize: vertical;
    }
    .colorful-tag-popup-body .setting-item-control > textarea.readonly {
        resize: none;
    }
    .shadow-text-start {
        vertical-align: bottom;
        font-size: var(--font-smaller);
        color: var(--text-muted);
    }
    .shadow-text-end {
        vertical-align: bottom;
        font-size: var(--font-smaller);
        color: var(--text-muted);
    }
    .colorful-tag-handler > svg {
        vertical-align: middle;
    }
    `
}