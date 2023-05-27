<script setup lang="ts">
import { useMainStore } from "../store";

const store = useMainStore();
const domain = import.meta.env.VITE_DOMAIN;
</script>

<template>
  <div class="root">
    <div>
      <div>Send the following link to your opponent:</div>
      <div style="margin-top: 1rem">
        <input type="text" :value="domain + '?roomname=' + store.roomName" />
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

input {
  width: 800px;
  text-align: center;
  font-size: 1.4em;
}
</style>
