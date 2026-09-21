<template>
  Главная //
  <RouterLink :to="{ name: ROUTE_NAME.SECOND }">На вторую</RouterLink> //
  <Button @click="() => toSecond()">Переход</Button>
</template>

<script setup lang="ts">
import { ROUTE_NAME } from '@/router'
import { useRouter } from 'vue-router'

const router = useRouter()

const toSecond = () => {
  const value = confirm('Вы уверены, что хотите перейти?')
  if (value) {
    router.push({ name: ROUTE_NAME.SECOND })
  }
}
</script>

<style scoped>

</style>