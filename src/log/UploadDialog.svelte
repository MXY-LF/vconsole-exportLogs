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
      width: 80vw;
      height: 150px;
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
      <div
        class="button-container"
        style="
          display: flex;
          justify-content: space-between;
          gap: 10px;
        "
      >
        <button
          class="copy-btn"
          on:click={handleCopy}
          style="
            flex: 1;
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
            flex: 1;
            background: #28a745;
            color: white;
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
</div>

