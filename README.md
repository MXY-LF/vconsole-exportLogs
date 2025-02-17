English | [简体中文](./README_CN.md)

vConsole
===

A lightweight, extendable front-end developer tool for mobile web page.

vConsole is framework-free, you can use it in Vue or React or any other framework application.

Now vConsole is the official debugging tool for WeChat Miniprograms.

---

## Features

- Logs: `console.log|info|error|...`
- Network: `XMLHttpRequest`, `Fetch`, `sendBeacon`
- Element: HTML elements tree
- Storage: `Cookies`, `LocalStorage`, `SessionStorage`
- Execute JS command manually
- Custom plugins

For details, please see the screenshots below.

---

## Release Notes

Latest version: [![npm version](https://img.shields.io/npm/v/vconsolelogs/latest.svg)](https://www.npmjs.com/package/vconsolelogs)

Detailed release notes for each version are available on [Changelog](./CHANGELOG.md).

---

## Guide

See [Tutorial](./doc/tutorial.md) for more usage details.

For installation, there are 2 primary ways of adding vConsole to a project:

#### Method 1: Using npm (Recommended)

```bash
$ npm install vconsolelogs
```

```javascript
import VConsole from 'vconsolelogs';

const vConsole = new VConsole();
// or init with options
const vConsole = new VConsole({ theme: 'dark' });

// call `console` methods as usual
console.log('Hello world');

// remove it when you finish debugging
vConsole.destroy();
```

#### Method 2: Using CDN in HTML:

```html
<script src="https://unpkg.com/vconsolelogs@latest/dist/vconsolelogs.min.js"></script>
<script>
  // VConsole will be exported to `window.VConsole` by default.
  var vConsole = new window.VConsole();
</script>
```

Available CDN:

- https://unpkg.com/vconsolelogs@latest/dist/vconsolelogs.min.js
- https://cdn.jsdelivr.net/npm/vconsolelogs@latest/dist/vconsolelogs.min.js

---

## Preview

[http://wechatfe.github.io/vconsolelogs/demo.html](http://wechatfe.github.io/vconsolelogs/demo.html)

![](./doc/screenshot/qrcode.png)

---

## Screenshots

### Overview

<details>
  <summary>Light theme</summary>

![](./doc/screenshot/overview_light.jpg)
</details>

<details>
  <summary>Dark theme</summary>

![](./doc/screenshot/overview_dark.jpg)
</details>

### Log Panel

<details>
  <summary>Log styling</summary>

![](./doc/screenshot/plugin_log_types.jpg)
</details>

<details>
  <summary>Command line</summary>

![](./doc/screenshot/plugin_log_command.jpg)
</details>

### System Panel

<details>
  <summary>Performance info</summary>

![](./doc/screenshot/plugin_system.jpg)
</details>

<details>
  <summary>Output logs to different panel</summary>

```javascript
console.log('output to Log panel.')
console.log('[system]', 'output to System panel.')
```
</details>

### Network Panel

<details>
  <summary>Request details</summary>

![](./doc/screenshot/plugin_network.jpg)
</details>

### Element Panel

<details>
  <summary>Realtime HTML elements structure</summary>

![](./doc/screenshot/plugin_element.jpg)
</details>

### Storage Panel

<details>
  <summary>Add, edit, delete or copy Cookies / LocalStorage / SessionStorage</summary>

![](./doc/screenshot/plugin_storage.jpg)
</details>

---

## Documentation

vConsole:

 - [Tutorial](./doc/tutorial.md)
 - [Public Properties & Methods](./doc/public_properties_methods.md)
 - [Builtin Plugin: Properties & Methods](./doc/plugin_properties_methods.md)

Custom Plugin:

 - [Plugin: Getting Started](./doc/plugin_getting_started.md)
 - [Plugin: Building a Plugin](./doc/plugin_building_a_plugin.md)
 - [Plugin: Event List](./doc/plugin_event_list.md)

---

## Third-party Plugins

 - [vConsole-sources](https://github.com/WechatFE/vConsole-sources)
 - [vconsolelogs-webpack-plugin](https://github.com/diamont1001/vconsolelogs-webpack-plugin)
 - [vconsolelogs-stats-plugin](https://github.com/smackgg/vConsole-Stats)
 - [vconsolelogs-vue-devtools-plugin](https://github.com/Zippowxk/vue-vconsolelogs-devtools)
 - [vconsolelogs-outputlog-plugin](https://github.com/sunlanda/vconsolelogs-outputlog-plugin)
 - [vite-plugin-vconsolelogs](https://github.com/vadxq/vite-plugin-vconsolelogs)

---

## Feedback

QQ Group: 497430533

![](./doc/screenshot/qq_group.png)

---

## License

[The MIT License](./LICENSE)
