# Colorful Tag

![](./assets/setting.png)

Make your tag more **beautiful** and **powerful**!
## Features

- Add many settings to style your tag
- Global setting for all tags
- Reorder tag setting by drag and drop
- Tag detail for each tag
- Add default value for tag detail
- Add shadow text for each tag

You can use `{{DATE}}` in tag detail default value, it will be replaced by current date.

All supported variables are:
- `{{DATE}}`
- `{{TIME}}`
- `{{DATETIME}}`
- `{{TAG}}`
- `{{FILE}}`
- `{{PATH}}`

## How To Install

### Community Plugin
You can install this plugin from the community plugin page in Obsidian.

Search for `Colorful Tag` in the community plugin page, or click [here](https://obsidian.md/plugins?search=colorful%20tag#).

### BRAT
You can install this plugin via [BRAT](https://github.com/TfTHacker/obsidian42-brat) now.

Here is the repository for this plugin: `rien7/obsidian-colorful-tag`

## Usage

### Global Setting

You can use global setting to change the default setting for all tags.

**But** it will be **override** by per tag setting.

### Per Tag Setting

You can use per tag setting to change the setting for a specific tag.

Setting list:
- `prefix`
- `suffix`
- `radius`
- `background color`
- `text color`
- `text size`
- `border`: Change the tag's border. Use vaild CSS value, like `none`, `1px solid #fff`, `1px solid rgb(255, 255, 255)`, `1px solid hsl(0, 0%, 100%)`...
- `font weight`: Change the tag's font weight.
- `nest tag`: Apply the setting to the nested tag.
- `remove hash`: Remove the hash symbol("#") in the tag.
- `remove tag name`: Remove the tag name in the tag.

### Tag Detail(Beta)

You can use tag detail to add more information to a tag.

You need to **ENABLE** it in `General` setting. And then add keys in per tag setting. After that, hover the corresponding tag in editing mode to modify the detail.

### Shadow Text(Beta)

You can use shadow text to add shadow text to a tag.

You need to set template in `Tag Detail Setting`. Attention: the template must contain `{{TAG}}`.

For example, you have a tag `TODO` with this detail:

```yaml
colorful-tag:
    - color: red
      priority: ⭐⭐
      text: colorful tag
```

 And you set `[{{priority}}] {{TAG}} {{text}}` as the template, and then the tag will be rendered as `[⭐⭐] #TODO colorful tag`.

## Roadmap

- add function to shadow text
- new page to query tag & tag detail
- link to another note/tag in tag detail
- resize & move popup window

## Inspired By

- [Shimmering Focus ⟡](https://github.com/chrisgrieser/shimmering-focus): A minimalistic and opinionated Obsidian theme for the keyboard-centric user.
- [Supercharged Links](https://github.com/mdelobelle/obsidian_supercharged_links): Adds attributes to internal links with the values of target note's frontmatter attributes.

## Support Me

Your support will be my motivation to improve Colorful Tag. If you like this plugin, please consider to buy me a coffee. Thank you!
    
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rien7)