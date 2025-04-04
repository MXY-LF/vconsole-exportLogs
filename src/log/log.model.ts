import * as tool from '../lib/tool';
import { VConsoleModel } from '../lib/model';
import { contentStore } from '../core/core.model';
import { getLogDatasWithFormatting } from './logTool';
import { VConsoleLogStore as Store } from './log.store';
import { get } from "svelte/store";
import {  uploadRequestList } from "../network/network.model";
import { storageStore } from "../storage/storage.model";
import { VConsoleLogOptions, VConsoleOptions } from "../core/options.interface";
import pako from "pako";
import { Base64 } from "js-base64";

/**********************************
 * Interfaces
 **********************************/

export type IConsoleLogMethod = 'log' | 'info' | 'debug' | 'warn' | 'error';

export interface IVConsoleLogData {
  origData: any; // The original logging data
  style?: string;
}

export interface IVConsoleLog {
  _id: string;
  type: IConsoleLogMethod;
  cmdType?: 'input' | 'output';
  repeated: number;
  toggle: Record<string, boolean>;
  date: number;
  data: IVConsoleLogData[]; // the `args: any[]` of `console.log(...args)`
  // hide?: boolean;
  groupLevel: number;
  groupLabel?: symbol;
  groupHeader?: 0 | 1 | 2; // 0=not_header, 1=is_header(no_collapsed), 2=is_header(collapsed)
  groupCollapsed?: boolean; // collapsed by it's group header
}

export type IVConsoleLogListMap = { [pluginId: string]: IVConsoleLog[] };
export type IVConsoleLogFilter = { [pluginId: string]: string };

export interface IVConsoleAddLogOptions {
  noOrig?: boolean;
  cmdType?: 'input' | 'output';
}


/**********************************
 * Model
 **********************************/

export class VConsoleLogModel extends VConsoleModel {
  public readonly LOG_METHODS: IConsoleLogMethod[] = ['log', 'info', 'warn', 'debug', 'error'];
  public ADDED_LOG_PLUGIN_ID: string[] = [];
  public maxLogNumber: number = 1000;
  protected logCounter: number = 0; // a counter used to do some tasks on a regular basis
  protected groupLevel: number = 0; // for `console.group()`
  protected groupLabelCollapsedStack: { label: symbol, collapsed: boolean }[] = [];
  protected pluginPattern: RegExp;
  protected logQueue: IVConsoleLog[] = [];
  protected flushLogScheduled: boolean = false;

  /**
   * The original `window.console` methods.
   */
  public origConsole: { [method: string]: Function } = {};

  public exportLogs: { data: IVConsoleLogData[]; type: IConsoleLogMethod }[] = [];
  public exportMethod: string[] = ["debug", "info", "warn", "error"];
  /**
   * Bind a Log plugin.
   * When binding first plugin, `window.console` will be hooked.
   */
  public bindPlugin(pluginId: string) {
    if (this.ADDED_LOG_PLUGIN_ID.indexOf(pluginId) > -1) {
      return false;
    }
    if (this.ADDED_LOG_PLUGIN_ID.length === 0) {
      this.mockConsole();
    }

    Store.create(pluginId);

    this.ADDED_LOG_PLUGIN_ID.push(pluginId);
    this.pluginPattern = new RegExp(`^\\[(${this.ADDED_LOG_PLUGIN_ID.join('|')})\\]$`, 'i');
    // this.callOriginalConsole('info', 'bindPlugin:', this.pluginPattern);
    return true;
  }

  /**
   * Unbind a Log plugin.
   * When no binded plugin exists, hooked `window.console` will be recovered.
   */
  public unbindPlugin(pluginId: string) {
    const idx = this.ADDED_LOG_PLUGIN_ID.indexOf(pluginId);
    if (idx === -1) { return false; }

    this.ADDED_LOG_PLUGIN_ID.splice(idx, 1);
    // logStore.update((store) => {
    //   store[pluginId].logList = [];
    //   delete store[pluginId];
    //   return store;
    // });
    Store.delete(pluginId);

    if (this.ADDED_LOG_PLUGIN_ID.length === 0) {
      this.unmockConsole();
    }
    return true;
  }

  /**
   * Hook `window.console` with vConsole log method.
   * Methods will be hooked only once.
   */
  public mockConsole() {
    if (typeof this.origConsole.log === 'function') {
      return;
    }

    // save original console object
    if (!window.console) {
      (<any>window.console) = {};
    } else {
      this.LOG_METHODS.map((method) => {
        this.origConsole[method] = window.console[method];
      });
      this.origConsole.time = window.console.time;
      this.origConsole.timeEnd = window.console.timeEnd;
      this.origConsole.clear = window.console.clear;
      this.origConsole.group = window.console.group;
      this.origConsole.groupCollapsed = window.console.groupCollapsed;
      this.origConsole.groupEnd = window.console.groupEnd;
    }

    this._mockConsoleLog();
    this._mockConsoleTime();
    this._mockConsoleGroup();
    this._mockConsoleClear();

    // convenient for other uses
    (<any>window)._vcOrigConsole = this.origConsole;
  }

  protected _mockConsoleLog() {
    this.LOG_METHODS.map((method) => {
      window.console[method] = ((...args) => {
        this.addLog({
          type: method,
          origData: args || [],
        });
      }).bind(window.console);
    });
  }

  protected _mockConsoleTime() {
    const timeLog: { [label: string]: number } = {};

    window.console.time = ((label: string = '') => {
      timeLog[label] = Date.now();
    }).bind(window.console);

    window.console.timeEnd = ((label: string = '') => {
      const pre = timeLog[label];
      let t = 0;
      if (pre) {
        t = Date.now() - pre;
        delete timeLog[label];
      }
      this.addLog({
        type: 'log',
        origData: [`${label}: ${t}ms`],
      });
    }).bind(window.console);
  }

  protected _mockConsoleGroup() {
    const groupFunction = (isCollapsed: boolean) => {
      return ((label = 'console.group') => {
        const labelSymbol = Symbol(label);
        this.groupLabelCollapsedStack.push({ label: labelSymbol, collapsed: isCollapsed });

        this.addLog({
          type: 'log',
          origData: [label],
          isGroupHeader: isCollapsed ? 2 : 1,
          isGroupCollapsed: false,
        }, {
          noOrig: true,
        });

        this.groupLevel++;
        if (isCollapsed) {
          this.origConsole.groupCollapsed(label);
        } else {
          this.origConsole.group(label);
        }
      }).bind(window.console);
    };
    window.console.group = groupFunction(false);
    window.console.groupCollapsed = groupFunction(true);

    window.console.groupEnd = (() => {
      this.groupLabelCollapsedStack.pop();
      this.groupLevel = Math.max(0, this.groupLevel - 1);
      this.origConsole.groupEnd();
    }).bind(window.console);
  }

  protected _mockConsoleClear() {
    window.console.clear = ((...args) => {
      this.resetGroup();
      this.clearLog();
      this.callOriginalConsole('clear', ...args);
    }).bind(window.console);
  }

  /**
   * Recover `window.console`.
   */
  public unmockConsole() {
    // recover original console methods
    for (const method in this.origConsole) {
      window.console[method] = this.origConsole[method] as any;
      delete this.origConsole[method];
    }
    if ((<any>window)._vcOrigConsole) {
      delete (<any>window)._vcOrigConsole;
    }
  }

  /**
   * Call origin `window.console[method](...args)`
   */
  public callOriginalConsole(method: string, ...args) {
    if (typeof this.origConsole[method] === 'function') {
      this.origConsole[method].apply(window.console, args);
    }
  }

  /**
   * Reset groups by `console.group()`.
   */
  public resetGroup() {
    while (this.groupLevel > 0) {
      console.groupEnd();
    }
  }

  /**
   * Remove all logs.
   */
  public clearLog() {
    const stores = Store.getAll();
    for (let id in stores) {
      this.clearPluginLog(id);
    }
    this.exportLogs = [];
  }

  /**
   * Remove a plugin's logs.
   */
  public clearPluginLog(pluginId: string) {
    // clear logs in the queue
    const logQueue = this.logQueue;
    this.logQueue = [];
    for (const log of logQueue) {
      const logPluginId = this._extractPluginIdByLog(log);
      if (logPluginId !== pluginId) {
        this.logQueue.push(log);
      }
    }
    // clear logs in the store
    Store.get(pluginId).update((store) => {
      store.logList.length = 0;
      return store;
    });
    contentStore.updateTime();
  }

  /**
   * Add a vConsole log.
   */
  public addLog(
    item: {
      type: IConsoleLogMethod,
      origData: any[],
      isGroupHeader?: 0 | 1 | 2,
      isGroupCollapsed?: boolean,
    } = { type: 'log', origData: [], isGroupHeader: 0, isGroupCollapsed: false, },
    opt?: IVConsoleAddLogOptions
  ) {
    // get group
    const previousGroup = this.groupLabelCollapsedStack[this.groupLabelCollapsedStack.length - 2];
    const currentGroup = this.groupLabelCollapsedStack[this.groupLabelCollapsedStack.length - 1];
    // prepare data
    const log: IVConsoleLog = {
      _id: tool.getUniqueID(),
      type: item.type,
      cmdType: opt?.cmdType,
      toggle: {},
      date: Date.now(),
      data: getLogDatasWithFormatting(item.origData || []),
      repeated: 0,
      groupLabel: currentGroup?.label,
      groupLevel: this.groupLevel,
      groupHeader: item.isGroupHeader,
      groupCollapsed: item.isGroupHeader ? !!previousGroup?.collapsed : !!currentGroup?.collapsed,
    };

    this._signalLog(log);

    if (!opt?.noOrig) {
      // logging to original console
      this.callOriginalConsole(item.type, ...item.origData);
    }
  }

  /**
   * Execute a JS command.
   */
  public evalCommand(cmd: string) {
    this.addLog({
      type: 'log',
      origData: [cmd],
    }, { cmdType: 'input' });

    let result = void 0;

    try {
      result = eval.call(window, '(' + cmd + ')');
    } catch (e) {
      try {
        result = eval.call(window, cmd);
      } catch (e) {
        ;
      }
    }

    this.addLog({
      type: 'log',
      origData: [result],
    }, { cmdType: 'output' });
  };

  protected _signalLog(log: IVConsoleLog) {
     if (this.exportMethod.includes(log.type)) {
      this.exportLogs.push({ data: log.data, type: log.type });
    }
    // throttle addLog
    if (!this.flushLogScheduled) {
      this.flushLogScheduled = true;
      window.requestAnimationFrame(() => {
        this.flushLogScheduled = false;
        this._flushLogs();
      });
    }
    this.logQueue.push(log);
  }

  protected _flushLogs() {
    const logQueue = this.logQueue;
    this.logQueue = [];
    const pluginLogs: Record<string, IVConsoleLog[]> = {};

    // extract pluginId by `[xxx]` format
    for (const log of logQueue) {
      const pluginId = this._extractPluginIdByLog(log);

      (pluginLogs[pluginId] = pluginLogs[pluginId] || []).push(log);
    }

    const pluginIds = Object.keys(pluginLogs);
    for (const pluginId of pluginIds) {
      const logs = pluginLogs[pluginId];

      const store = Store.get(pluginId);
      store.update((store) => {
        let logList = [...store.logList];

        for (const log of logs) {
          if (this._isRepeatedLog(logList, log)) {
            this._updateLastLogRepeated(logList);
          } else {
            logList.push(log);
          }
        }

        logList = this._limitLogListLength(logList);

        return { logList };
      })
    }
    contentStore.updateTime();
  }

  protected _extractPluginIdByLog(log: IVConsoleLog) {
    // if origData[0] is `[xxx]` format, and `xxx` is a Log plugin id,
    // then put this log to that plugin,
    // otherwise put it to default plugin.
    let pluginId = 'default';
    const firstData = log.data[0]?.origData;
    if (tool.isString(firstData)) {
      const match = (firstData as string).match(this.pluginPattern);
      if (match !== null && match.length > 1) {
        const id = match[1].toLowerCase();
        if (this.ADDED_LOG_PLUGIN_ID.indexOf(id) > -1) {
          pluginId = id;
          // if matched, delete `[xxx]` value
          log.data.shift();
        }
      }
    }
    return pluginId;
  }

  protected _isRepeatedLog(logList: IVConsoleLog[], log: IVConsoleLog) {
    const lastLog = logList[logList.length - 1];
    if (!lastLog) {
      return false;
    }

    let isRepeated = false;
    if (log.type === lastLog.type && log.cmdType === lastLog.cmdType && log.data.length === lastLog.data.length) {
      isRepeated = true;
      for (let i = 0; i < log.data.length; i++) {
        if (log.data[i].origData !== lastLog.data[i].origData) {
          isRepeated = false;
          break;
        }
      }
    }
    return isRepeated;
  }

  protected _updateLastLogRepeated(logList: IVConsoleLog[]) {
    const last = logList[logList.length - 1];
    const repeated = last.repeated ? last.repeated + 1 : 2;
    logList[logList.length - 1] = {
      ...last,
      repeated,
    };
    return logList;
  }

  protected _limitLogListLength(logList: IVConsoleLog[]): IVConsoleLog[] {
    // update logList length every N rounds
    // const N = 10;
    // this.logCounter++;
    // if (this.logCounter % N !== 0) {
    //   return logList;
    // }
    // this.logCounter = 0;

    const len = logList.length;
    const maxLen = this.maxLogNumber;
    if (len > maxLen) {
      // delete N more logs for performance
      // this.callOriginalConsole('info', 'delete', len, len - maxLen);
      return logList.slice(len - maxLen, len);
    }
    return logList;
  }
  /**
   * Upload console logs, API data, and storage data
   */
  public async uploadLogs(
    logOptions: VConsoleLogOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    let logData;
    try {
      const logStores = Store.getAll();
      const storeData = Store.getRaw("system");
      const uploadData = get(uploadRequestList); // 获取 uploadRequestList 的数据

      // 获取存储相关数据
      const defaultStorages = get(storageStore.defaultStorages);
      const activedStorage = get(storageStore.activedName);
      const storageUpdateTime = get(storageStore.updateTime);

      // 收集所有数据
      logData = {
        console: { default: this.exportLogs, system: storeData.logList }, // 使用 uploadLogQueue 中的日志
        network: uploadData, // 上传请求数据
        storage: {
          defaultStorages,
          activedStorage,
          updateTime: storageUpdateTime,
          data: {
            localStorage: this._getLocalStorageData(),
            sessionStorage: this._getSessionStorageData(),
            cookies: this._getCookieData(),
          },
        },
        system: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      };

      // 压缩数据并转换为 Base64
      const compressedData = this.compressData(logData);

      // 使用配置中的上传端点
      const UPLOAD_ENDPOINT = logOptions?.uploadUrl;

      // 使用 XMLHttpRequest 发送到服务器
      const result = await new Promise<{code: number; message?: string; data: {id: string}}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', UPLOAD_ENDPOINT);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('解析响应失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.send(JSON.stringify({ extra: compressedData }));
      });

      if (result.code !== 200 && result.code !== 201) { // 修改这里以处理 201 状态码
        throw new Error(`上传失败: ${result.message || "未知错误"}`);
      }

      return `${logOptions?.showUrl}&id=${result.data.id}`; // 返回上传后的 ID
    } catch (error) {
      const enhancedError = new Error(`上传失败: ${error.message}`);
      (enhancedError as any).logData = JSON.stringify(logData);
      throw enhancedError;
    }
  }

  /**
   * 获取 localStorage 数据
   */
  private _getLocalStorageData(): Record<string, any> {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          data[key] = localStorage.getItem(key);
        } catch (e) {
          data[key] = "[[Error reading value]]";
        }
      }
    }
    return data;
  }

  /**
   * 获取 sessionStorage 数据
   */
  private _getSessionStorageData(): Record<string, any> {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          data[key] = sessionStorage.getItem(key);
        } catch (e) {
          data[key] = "[[Error reading value]]";
        }
      }
    }
    return data;
  }

  /**
   * 获取 Cookie 数据
   */
  private _getCookieData(): Record<string, string> {
    const data = {};
    try {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [key, value] = cookie.split("=").map((part) => part.trim());
        if (key) {
          data[key] = value || "";
        }
      }
    } catch (e) {
      data["error"] = "Error reading cookies";
    }
    return data;
  }

  private compressData(data: any): string {
    const jsonString = JSON.stringify(data, (key, value) => {
      // 去除不必要的字段
      if (key === "largeField" || key === "unnecessaryField") {
        return undefined;
      }
      return value;
    });

    // 使用 pako 进行 gzip 压缩
    const compressed = pako.gzip(jsonString, { level: 9 });

    // 使用 js-base64 将压缩后的数据转换为 Base64
    return Base64.fromUint8Array(compressed);
  }
}
