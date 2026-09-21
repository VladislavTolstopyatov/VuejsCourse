<script setup lang="ts">
import {useRoute} from "vue-router";
import {computed} from "vue";

const route = useRoute()

const id = computed(() => route.params.id)
</script>

<template>
  Вторая
  <div v-if="id">Это страница ID :{{id}}</div>
  <div v-else>
    Это пустая страница

    <br>

    <br>

    Возможно, вы искали это : <br>
    
  </div>
</template>

<style scoped>

</style>