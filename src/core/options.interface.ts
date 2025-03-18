/*
 * @Description: 
 * @Author: mengxiangyu
 * @Date: 2025-03-11 17:10:23
 */
export interface VConsoleLogOptions {
  maxLogNumber?: number;
  showTimestamps?: boolean;
  exportMethod?: string[]
  uploadUrl?: string;
}

export interface VConsoleNetworkOptions {
  maxNetworkNumber?: number;
  ignoreUrlRegExp?: RegExp;
  exportUrlRegExp?: RegExp;
}

export type VConsoleAvailableStorage = 'cookies' | 'localStorage' | 'sessionStorage' | 'wxStorage';
export interface VConsoleStorageOptions {
  defaultStorages?: VConsoleAvailableStorage[];
}

export interface VConsoleOptions {
  target?: string | HTMLElement;
  defaultPlugins?: ('system' | 'network' | 'element' | 'storage')[];
  theme?: '' | 'dark' | 'light';
  disableLogScrolling?: boolean;
  pluginOrder?: string[];
  onReady?: () => void;

  log?: VConsoleLogOptions,
  network?: VConsoleNetworkOptions,
  storage?: VConsoleStorageOptions,

  /**
   * @deprecated Since v3.12.0, use `log.maxLogNumber`.
   */
  maxLogNumber?: number;
  /**
   * @deprecated Since v3.12.0, use `network.maxNetworkNumber`.
   */
  maxNetworkNumber?: number;
  /**
   * @deprecated Since v3.12.0.
   */
  onClearLog?: () => void;
}
