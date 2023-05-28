<script setup lang="ts">
defineProps<{
  color: string;
  pieces: string[];
}>();
</script>

<template>
  <div class="captured-piece-wrapper" v-for="piece in pieces">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
      <use
        :href="`#${color}${piece}`"
        class="piece"
        xlink:href="#${color}${piece}"
        transform="translate(0 0) scale(.8 .8)"
      ></use>
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.captured-piece-wrapper {
  width: 20px;
  height: 20px;
  display: inline-block;

  svg {
    width: 100%;
    height: 100%;
  }
}
</style>
