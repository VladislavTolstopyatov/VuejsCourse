<template>
  <g v-if="obj.kind === 'unit'" class="obj">
    <circle
      :cx="obj.x"
      :cy="obj.y"
      :r="obj.radius"
      :fill="color"
      :stroke="selected ? '#fff' : '#222'"
      :stroke-width="selected ? 3 : 1"
    />
    <text :x="obj.x" :y="obj.y" dy="0.35em" class="obj__label">{{ obj.label }}</text>
  </g>
  <g v-else class="obj">
    <rect
      :x="obj.x - obj.width / 2"
      :y="obj.y - obj.height / 2"
      :width="obj.width"
      :height="obj.height"
      fill="#a8865a"
      :stroke="selected ? '#fff' : color"
      :stroke-width="selected ? 4 : 3"
    />
    <text :x="obj.x" :y="obj.y" dy="0.35em" class="obj__label obj__label--building">{{ obj.label }}</text>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  obj: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const color = computed(() => {
  if (props.obj.owner === 'enemy') return '#d23b3b'
  return '#2f6fe0'
})
</script>

<style scoped lang="scss">
.obj {
  pointer-events: none;

  &__label {
    fill: #fff;
    font-size: 14px;
    font-weight: bold;
    text-anchor: middle;

    &--building {
      font-size: 22px;
    }
  }
}
</style>
