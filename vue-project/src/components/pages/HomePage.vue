<template>
  Главная //
  <RouterLink :to="{ name: ROUTE_NAME.SECOND }">На вторую</RouterLink>
  <Button @click="() => toSecond()">Переход</Button>
  {{ ourCount }}

  <button @click="()=>upCount()">Увеличить</button>
  <Checkbox>
<!--    <Part1/>-->
<!--    <Part2/>-->
    <template v-for="i in list">
      <component :is="listMapComp['Part' + i.type]" :id = "i.id" />
    </template>
  </Checkbox>
</template>

<script setup lang="ts">
import {ROUTE_NAME} from '@/router'
import {useRouter} from 'vue-router'
import {computed, onBeforeMount, onMounted} from "vue";
import {useStore} from "vuex";
import mitt from "../plugins/mitt.ts";
import Checkbox from "@/components/Checkbox.vue";
import Part1 from "@/components/parts/part1.vue";
import Part2 from "@/components/parts/part2.vue";

const router = useRouter()
const store = useStore()
const emitter = mitt

const ourCount = computed(() => store.getters['getCountX2'])

const toSecond = () => {
  const value = confirm('Вы уверены, что хотите перейти?')
  if (value) {
    router.push({name: ROUTE_NAME.SECOND})
  }
}

const list = computed(() => {
  return [
    {
      type: 1,
      id: 1
    },
    {
      type: 2,
      id: 2
    }, {
      id: 3,
      type: 3
    }, {
      type: 4,
      id: 4
    }
  ];
})

const upCount = () => {
  store.dispatch('runIncrement', 10)
}

onMounted(() => {
  emitter.on("ch1", () => {
    alert('CHANGE')
  })
})

onBeforeMount(() => {
  emitter.off("ch1")
})

</script>

<style scoped>

</style>