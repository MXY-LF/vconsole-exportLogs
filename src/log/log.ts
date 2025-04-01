import { VConsoleSveltePlugin } from '../lib/sveltePlugin';
import LogComp from './log.svelte';
import { VConsoleLogModel } from './log.model';
import { VConsoleLogExporter } from './log.exporter';
import type { IConsoleLogMethod } from './log.model';
import UploadDialog from "./UploadDialog.svelte";
const MAX_LOG_NUMBER = 1000;

/**
 * vConsole Log Plugin (base class).
 */
export class VConsoleLogPlugin extends VConsoleSveltePlugin {
  public model: VConsoleLogModel = VConsoleLogModel.getSingleton(VConsoleLogModel, 'VConsoleLogModel');
  public isReady: boolean = false;
  public isShow: boolean = false;
  public isInBottom: boolean = true; // whether the panel is in the bottom

  constructor(id: string, name: string,) {
    super(id, name, LogComp, { pluginId: id, filterType: 'all' });
    this.model.bindPlugin(id);
    this.exporter = new VConsoleLogExporter(id);
  }

  public onReady() {
    super.onReady();
    this.model.maxLogNumber = Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    this.compInstance.showTimestamps = !!this.vConsole.option.log?.showTimestamps;
  }

  public onRemove() {
    super.onRemove();
    this.model.unbindPlugin(this.id);
  }

  public onAddTopBar(callback: Function) {
    const types = ['All', 'Log', 'Info', 'Warn', 'Error'];
    const btnList = [];
    for (let i = 0; i < types.length; i++) {
      btnList.push({
        name: types[i],
        data: {
          type: types[i].toLowerCase()
        },
        actived: i === 0,
        className: '',
        onClick: (e: PointerEvent, data: { type: 'all' | IConsoleLogMethod }) => {
          if (data.type === this.compInstance.filterType) { return false; }
          this.compInstance.filterType = data.type;
        }
      });
    }
    btnList[0].className = 'vc-actived';
    callback(btnList);
  }

  public onAddTool(callback: Function) {
    const toolList = [
      {
        name: "Upload",
        global: false,
        onClick: (e) => {
          const uploadDialog = new UploadDialog({
            target: document.body, // 直接设置为 body
            props: {
              visible: true,
              uploadId: "", // 初始化为空
              onClose: () => {
                uploadDialog.$destroy();
              },
            },
          });

          this.model
            .uploadLogs(this.vConsole.option?.log)
            .then((id) => {
              uploadDialog.$set({
                uploadId: id, // 设置上传成功后的 ID
              });
            })
            .catch((error) => {
              console.error("Upload failed:", error);
              if ((error as any).logData) {
                console.log("Log Data:", JSON.parse((error as any).logData));
              }
              uploadDialog.$set({
                uploadId: "上传失败，请重试。",
              });
              this.model.addLog({
                type: "error",
                origData: [`上传失败: ${error.message}`],
              });
            });
        },
      },{
      name: 'Clear',
      global: false,
      onClick: (e) => {
        this.model.clearPluginLog(this.id);
        this.vConsole.triggerEvent('clearLog');
      }
    }, {
      name: 'Top',
      global: false,
      onClick: (e) => {
        this.compInstance.scrollToTop()
      }
    }, {
      name: 'Bottom',
      global: false,
      onClick: (e) => {
        this.compInstance.scrollToBottom()
      }
    }];
    callback(toolList);
  }

  public onUpdateOption() {
    if (this.vConsole.option.log?.maxLogNumber !== this.model.maxLogNumber) {
      this.model.maxLogNumber = Number(this.vConsole.option.log?.maxLogNumber) || MAX_LOG_NUMBER;
    }
    if (!!this.vConsole.option.log?.showTimestamps !== this.compInstance.showTimestamps) {
      this.compInstance.showTimestamps = !!this.vConsole.option.log?.showTimestamps;
    }
    if (this.vConsole.option.log?.exportMethod) {
      this.model.exportMethod = this.vConsole.option.log?.exportMethod;
    }
  }
}

export default VConsoleLogPlugin;
