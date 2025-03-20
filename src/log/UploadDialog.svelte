<script lang="ts">
  import { fade } from "svelte/transition";
  import copy from "copy-text-to-clipboard";

  export let uploadId: string = "";
  export let visible: boolean = false;
  export let onClose: () => void;

  let copied = false;

  function handleCopy() {
    if (uploadId) {
      copy(uploadId);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }
</script>

<div
  class="dialog-container"
  class:visible
  transition:fade
  style="
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    align-items: center;
    justify-content: center;
    z-index: 10000000;
  "
>
  <div
    class="dialog"
    role="dialog"
    style="
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100vw;
      height: 400px;
    "
  >
    <div class="success-content">
      <h3
        style="
          margin: 0 0 20px;
          font-size: 16px;
          color: #000;
          text-align: center;
        "
      >
        {#if uploadId}上传成功，ID: {uploadId}{:else}正在上传...{/if}
      </h3>
      <button
        class="copy-btn"
        on:click={handleCopy}
        style="
          background: #007bff;
          color: #fff;
          white-space: nowrap;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: opacity 0.2s;
        "
        disabled={!uploadId}
      >
        {copied ? "已复制" : "复制链接"}
      </button>
      <button
        class="close-btn"
        on:click={onClose}
        style="
          background: #28a745;
          color: white;
          width: 100%;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: opacity 0.2s;
        "
      >
        关闭
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10000000; /* 确保 z-index 足够高 */
  }

  .visible {
    display: flex;
  }

  .dialog {
    background: #fff; /* 白色背景 */
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 100vw; /* 设置宽度为屏幕宽度 */
    height: 400px; /* 设置高度为 400px */
  }

  h3 {
    margin: 0 0 20px;
    font-size: 16px;
    color: #000; /* 黑色字体 */
    text-align: center;
  }

  .progress-bar {
    height: 4px;
    background: #e9ecef;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .progress-inner {
    height: 100%;
    background: #28a745;
    transition: width 0.3s ease;
  }

  .progress-text {
    display: block;
    text-align: center;
    color: #000; /* 黑色字体 */
    font-size: 14px;
  }

  .url-container {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    background: #f0f0f0;
    padding: 8px;
    border-radius: 4px;
  }

  .url {
    flex: 1;
    word-break: break-all;
    font-size: 14px;
    color: #000; /* 黑色字体 */
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 0.8;
  }

  .copy-btn {
    background: #007bff;
    color: #fff;
    white-space: nowrap;
  }

  .close-btn {
    background: #28a745;
    color: white;
    width: 100%;
  }
</style>
