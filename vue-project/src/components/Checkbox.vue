vue
<template>
  <input v-model="check" type="checkbox" @change="(e) => addV(6, e)"> {{ v }} // {{ v2 }}
  <span :class="[ v ? 'checkbox__label--green' : 'checkbox__label--red' ]">Wow! {{ props.way }}</span>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import mitt from "mitt";

const props = defineProps({
  way: {
    default: 0,
    type: Number
  }
})

const v = ref(0)
const check = ref(true)
const emitter = mitt()

const emits = defineEmits(["change"])

const addV = (p: number, e: Event | null = null) => {
  v.value += p
  emits('change', v.value)

  emitter.emit('CHANGE')
}

const v2 = computed(() => v.value * 2)


</script>

<style scoped lang="scss">
.checkbox__label {
  &--red {
    color: red;
  }

  &--green {
    color: green;
  }
}
</style>