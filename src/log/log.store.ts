import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { IVConsoleLog } from './log.model';

export interface Ivconsolelogstore {
  logList: IVConsoleLog[];
}

/**
 * Log Store Factory
 */
export class vconsolelogstore {
  public static storeMap: { [pluginId: string]: Writable<Ivconsolelogstore> } = {};

  /**
   * Create a store.
   */
  public static create(pluginId: string) {
    if (!this.storeMap[pluginId]) {
      this.storeMap[pluginId] = writable<Ivconsolelogstore>({ logList: [] });
    }
    return this.storeMap[pluginId];
  }

  /**
   * Delete a store.
   */
  public static delete(pluginId: string) {
    if (!this.storeMap[pluginId]) { return; }
    delete this.storeMap[pluginId];
  }

  /**
   * Get a store by pluginId,
   */
  public static get(pluginId: string) {
    return this.storeMap[pluginId];
  }

  /**
   * Get a store's raw data.
   */
  public static getRaw(pluginId: string) {
    return get(this.storeMap[pluginId]);
  }

  /**
   * Get all stores.
   */
  public static getAll() {
    return this.storeMap;
  }

}
