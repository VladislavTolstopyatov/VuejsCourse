<!--<template>-->
<!--  <h1>Не может быть {{ value }})!</h1>-->
<!--  <CheckboxComp :way="1" @change="(v) => addValue(v)" />-->
<!--  <CheckboxComp :way="2" @change="(v) => addValue(v*2)" />-->
<!--  <CheckboxComp :way="123" @change="(v) => addValue(v*3)" />-->
<!--  <CheckboxComp />-->
<!--  <router-view></router-view>-->
<!--</template>-->
<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import CheckboxComp from '@/components/Checkbox.vue'
import { ref, onBeforeMount, onMounted } from 'vue'

const value = ref(0)

const addValue = (v: number) => {
  value.value += v
}

onBeforeMount(() => {
  console.log('onBeforeMount')
})

onMounted(() => {
  console.log('App')
})
</script>

<style scoped></style>