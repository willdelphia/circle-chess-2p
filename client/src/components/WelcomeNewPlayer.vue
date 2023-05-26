<script setup lang="ts">
import { useMainStore } from "../store";

const store = useMainStore();
</script>

<template>
  <div>Send the following link to your opponent:</div>
  <div style="margin-top: 1rem">
    <input
      type="text"
      :value="'https://circle-chess.herokuapp.com/?roomname=' + store.roomName"
    />
  </div>
</template>

<style lang="scss" scoped>
div {
  text-align: center;
}

input {
  width: 500px;
  text-align: center;
  font-size: 1.4em;
}
</style>
