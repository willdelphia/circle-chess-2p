<script setup lang="ts">
import { useMainStore } from "../store";

const store = useMainStore();
</script>

<template>
  Send the following link to your opponent:
  <input type="text" :value="store.roomName" />
</template>
<style lang="scss"></style>
