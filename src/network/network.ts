/*
 * @Descripttion:
 * @Author: xiangyumeng@webank.com
 * @LastEditTime: 2024-10-21 14:28:33
 */
import { VConsoleSveltePlugin } from "../lib/sveltePlugin";
import NetworkComp from "./network.svelte";
import { VConsoleNetworkModel } from "./network.model";
import { VConsoleNetworkExporter } from "./network.exporter";
import copy from 'copy-text-to-clipboard';
const safeStringify = require("fast-safe-stringify");
const MAX_NETWORK_NUMBER = 1000;

export class VConsoleNetworkPlugin extends VConsoleSveltePlugin {
  public model: VConsoleNetworkModel = VConsoleNetworkModel.getSingleton(
    VConsoleNetworkModel,
    "VConsoleNetworkModel"
  );
  public exporter: VConsoleNetworkExporter;

  constructor(id: string, name: string, renderProps = {}) {
    super(id, name, NetworkComp, renderProps);
    this.exporter = new VConsoleNetworkExporter(id);
  }

  public onReady() {
    super.onReady();
    this.onUpdateOption();
  }

  public onAddTool(callback) {
    const toolList = [
      {
        name: "CopyLogs",
        global: false,
        onClick: (e) => {
          copy(safeStringify(this.model.RequestList));
        },
      },
      {
        name: "Clear",
        global: false,
        onClick: (e) => {
          this.model.clearLog();
        },
      },
    ];
    callback(toolList);
  }

  public onRemove() {
    super.onRemove();
    if (this.model) {
      this.model.unMock();
    }
  }

  public onUpdateOption() {
    if (
      this.vConsole.option.network?.maxNetworkNumber !==
      this.model.maxNetworkNumber
    ) {
      this.model.maxNetworkNumber =
        Number(this.vConsole.option.network?.maxNetworkNumber) ||
        MAX_NETWORK_NUMBER;
    }
    if (this.vConsole.option.network?.ignoreUrlRegExp) {
      this.model.ignoreUrlRegExp = this.vConsole.option.network.ignoreUrlRegExp;
    }
    if (this.vConsole.option.network?.exportUrlRegExp) {
      this.model.exportUrlRegExp = this.vConsole.option.network.exportUrlRegExp;
    }
  }
}
