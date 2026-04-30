<script setup lang="ts">
defineProps<{ size?: 'hero' | 'large' | 'normal' | 'inline' }>()
</script>

<template>
  <component
    :is="size === 'inline' ? 'span' : 'h1'"
    class="wordmark"
    :class="`wordmark-${size || 'normal'}`"
  >
    <span class="wm-text">hack</span><span class="wm-tag">&lt;a&gt;</span><span class="wm-text">board</span>
  </component>
</template>

<style scoped>
.wordmark {
  font-family: 'Geist', sans-serif;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0;
  display: inline-block;
}
.wordmark-hero { font-size: 7rem; }
.wordmark-large { font-size: 4.5rem; }
.wordmark-normal { font-size: 2.25rem; }
.wordmark-inline { font-size: inherit; font-weight: 900; }

.wm-text {
  background: linear-gradient(180deg, #ffffff 0%, oklch(0.55 0.01 260) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.wm-tag {
  color: oklch(0.78 0.15 195);
}
</style>
