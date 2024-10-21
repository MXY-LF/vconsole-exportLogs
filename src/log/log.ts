import { VConsoleSveltePlugin } from "../lib/sveltePlugin";
import LogComp from "./log.svelte";
import { VConsoleLogModel } from "./log.model";
import { VConsoleLogExporter } from "./log.exporter";
import type { IConsoleLogMethod } from "./log.model";
import copy from 'copy-text-to-clipboard';
import * as tool from "../lib/tool";
const safeStringify = require("fast-safe-stringify");
const MAX_LOG_NUMBER = 1000;

/**
 * vConsole Log Plugin (base class).
 */
export class VConsoleLogPlugin extends VConsoleSveltePlugin {
  public model: VConsoleLogModel = VConsoleLogModel.getSingleton(
    VConsoleLogModel,
    "VConsoleLogModel"
  );
  public isReady: boolean = false;
  public isShow: boolean = false;
  public isInBottom: boolean = true; // whether the panel is in the bottom

  constructor(id: string, name: string) {
    super(id, name, LogComp, { pluginId: id, filterType: "all" });
    this.model.bindPlugin(id);
    this.exporter = new VConsoleLogExporter(id);
  }

  public onReady() {
    super.onReady();
    this.model.maxLogNumber =
      Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    this.compInstance.showTimestamps =
      !!this.vConsole.option.log?.showTimestamps;
  }

  public onRemove() {
    super.onRemove();
    this.model.unbindPlugin(this.id);
  }

  public onAddTopBar(callback: Function) {
    const types = ["All", "Log", "Info", "Warn", "Error"];
    const btnList = [];
    for (let i = 0; i < types.length; i++) {
      btnList.push({
        name: types[i],
        data: {
          type: types[i].toLowerCase(),
        },
        actived: i === 0,
        className: "",
        onClick: (
          e: PointerEvent,
          data: { type: "all" | IConsoleLogMethod }
        ) => {
          if (data.type === this.compInstance.filterType) {
            return false;
          }
          this.compInstance.filterType = data.type;
        },
      });
    }
    btnList[0].className = "vc-actived";
    callback(btnList);
  }

  public onAddTool(callback: Function) {
    const toolList = [
      {
        name: "ExportLogs",
        global: false,
        onClick: (e) => {
          this.exportLog();
          // this.model.clearPluginLog(this.id);
          // this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "CopyLog",
        global: false,
        onClick: (e) => {
          copy(safeStringify(this.model.exportLogs));
          // this.exportCurrentHtml();
          // this.model.clearPluginLog(this.id);
          // this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "Clear",
        global: false,
        onClick: (e) => {
          this.model.clearPluginLog(this.id);
          this.vConsole.triggerEvent("clearLog");
        },
      },
      {
        name: "Top",
        global: false,
        onClick: (e) => {
          this.compInstance.scrollToTop();
        },
      },
      {
        name: "Bottom",
        global: false,
        onClick: (e) => {
          this.compInstance.scrollToBottom();
        },
      },
    ];
    callback(toolList);
  }

  public onUpdateOption() {
    if (this.vConsole.option.log?.maxLogNumber !== this.model.maxLogNumber) {
      this.model.maxLogNumber =
        Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    }

    if (
      !!this.vConsole.option.log?.showTimestamps !==
      this.compInstance.showTimestamps
    ) {
      this.compInstance.showTimestamps =
        !!this.vConsole.option.log?.showTimestamps;
    }
  }

  public exportLog() {
    function downloadObjectAsJson(obj, filename) {
      // 将对象转换为 JSON 字符串
      const jsonString = safeStringify(obj);

      // const logsContent = `\
      //     const logs = ${jsonString};
      //     export default logs;
      //       `;

      // 创建一个 Blob 对象，使用 UTF-8 编码
      const blob = new Blob([jsonString], { type: "application/json" });

      // 创建一个可下载的链接
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }

    const log = this.model.exportLogs;

    // function formatObj(log: any) {
    //   const result = [];
    //   log.forEach((item) => {
    //     const formatObj = tool.removeLargeFields(item.origData);
    //     result.push(formatObj);
    //   });
    //   return result;
    // }
    // const formatLog = [];
    // log.forEach((item) => {
    //   const string = safeStringify(item);
    //   const logData = formatObj(JSON.parse(string));
    //   formatLog.push({ logData });
    // });

    downloadObjectAsJson(log, `log.json`);
    // this.exportJsonToFile(this.model.exportLogs, `log.json`);
  }


}

export default VConsoleLogPlugin;
