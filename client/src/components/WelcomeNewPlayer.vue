<script setup lang="ts">
import { computed, ref } from "vue";
import { useMainStore } from "../store";

const store = useMainStore();
const domain = import.meta.env.VITE_DOMAIN;
const link = computed(() => domain + "?roomname=" + store.roomName);
const inputClass = ref("");

function copy() {
  navigator.clipboard.writeText(link.value);
  inputClass.value = "blink";
  setTimeout(() => (inputClass.value = ""), 2000);
}
</script>

<template>
  <div class="root">
    <div>
      <div>Send the following link to your opponent:</div>
      <div style="margin-top: 1rem">
        <div class="link-row">
          <input type="text" :value="link" :class="inputClass" />
          <button @click="copy">Copy Link</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.root {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 20px);
}
div {
  text-align: center;
}

.link-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: calc(100vw - 40px);
  max-width: 600px;

  & > * {
    height: 40px;
    display: block;
    box-sizing: border-box;
  }
}

input {
  text-align: center;
  font-size: 1em;
  padding: 10px;
  flex: 1;
  border: solid grey 1px;
}

.blink {
  animation-name: blink;
  animation-duration: 0.2s;
  animation-iteration-count: 3;
  background-color: white;
}

@keyframes blink {
  0% {
    background-color: yellow;
  }
  49% {
    background-color: yellow;
  }
  50% {
    background-color: white;
  }
  100% {
    background-color: white;
  }
}
</style>
