# Colorful Tag

![](./assets/setting.png)

Make your tag more **beautiful** and **powerful**!
## Features

- Add prefix or suffix to a tag
- Change the text size or text color
- Change the tag's radius size or tag’s background color
- Global setting or per tag setting
- Reorder tag setting by drag and drop
- Tag detail for each tag
- Add default value for tag detail

You can use `{{DATE}}` in tag detail default value, it will be replaced by current date.

All supported variables are:
- `{{DATE}}`
- `{{TIME}}`
- `{{DATETIME}}`
- `{{TAG}}`

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
- `prefix`: Add prefix to a tag
- `suffix`: Add suffix to a tag
- `radius`: Change the tag's radius size. Use vaild CSS value, like `5px`, `10%`, `1em`...
- `background color`: Change the tag's background color. Use vaild CSS value, like `#fff`, `rgb(255, 255, 255)`, `hsl(0, 0%, 100%)`...
- `text color`: Change the tag's text color. Use vaild CSS value, like `#fff`, `rgb(255, 255, 255)`, `hsl(0, 0%, 100%)`...
- `text size`: Change the tag's text size. Use vaild CSS value, like `5px`, `10%`, `1em`...
- `border`: Change the tag's border. Use vaild CSS value, like `1px solid #fff`, `1px solid rgb(255, 255, 255)`, `1px solid hsl(0, 0%, 100%)`...
- `font weight`: Change the tag's font weight. Use vaild CSS value, like `bold`, `normal`, `500`, `800`...
- `nest tag`: Apply the setting to the nested tag. For example, if you set `nest tag` to `true` and `text color` to `red`, the tag `#tag` and `#tag/nest-tag` will have red text color. **Use `true` or `false` to set this value**.
- `remove hash`: Remove the hash symbol("#") in the tag. **Use `true` or `false` to set this value**. **Only support editing mode**.
- `remove tag name`: Remove the tag name in the tag. **Use `true` or `false` to set this value**. **Only support editing mode**.

### Tag Detail(Beta)

ATTENTION: It will lose data in some case (change tag's **column** and **line** at the same time). You can manually find the lost data in the `.obsidian/plugins/obsidian-colorful-tag/data.json` file.

You can use tag detail to add more information to a tag.

You need to **ENABLE** it in `General` setting. And then add keys in per tag setting. After that, hover the corresponding tag in editing mode to modify the detail.

## Inspired By

- [Shimmering Focus ⟡](https://github.com/chrisgrieser/shimmering-focus): A minimalistic and opinionated Obsidian theme for the keyboard-centric user.
- [Supercharged Links](https://github.com/mdelobelle/obsidian_supercharged_links): Adds attributes to internal links with the values of target note's frontmatter attributes.

## Support Me

Your support will be my motivation to improve Colorful Tag. If you like this plugin, please consider to buy me a coffee. Thank you!
    
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rien7)