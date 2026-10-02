<template>
  <div class="game">
    <div
      ref="viewRef"
      class="game__view"
      @mousedown="onMouseDown"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    >
      <svg class="game__svg" :viewBox="viewBox">
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" class="game__grid" />
          </pattern>
          <clipPath id="field">
            <polygon :points="outlinePoints" />
          </clipPath>
        </defs>

        <polygon :points="outlinePoints" class="game__ground" />
        <g clip-path="url(#field)">
          <rect :x="bounds.minX" :y="bounds.minY" :width="fieldWidth" :height="fieldHeight" fill="url(#grid)" />
          <line :x1="bounds.minX" y1="0" :x2="bounds.maxX" y2="0" class="game__axis" />
          <line x1="0" :y1="bounds.minY" x2="0" :y2="bounds.maxY" class="game__axis" />
        </g>
        <circle cx="0" cy="0" r="5" class="game__origin" />

        <line
          v-if="selected && selected.moving"
          :x1="selected.x"
          :y1="selected.y"
          :x2="selected.targetX"
          :y2="selected.targetY"
          class="game__path"
        />

        <GameObjectView
          v-for="obj in drawList"
          :key="obj.id"
          :obj="obj"
          :selected="obj.id === selectedId"
        />
      </svg>

      <div class="game__hud">
        <div>Курсор: {{ Math.round(cursor.x) }}, {{ Math.round(cursor.y) }} · центр карты (0, 0)</div>
        <div>
          ЛКМ — выбрать, ПКМ — идти, WASD или стрелки — камера, колёсико — масштаб, средняя кнопка — двигать камеру.
          <RouterLink :to="{ name: ROUTE_NAME.HOME }">К урокам</RouterLink>
        </div>
      </div>
    </div>

    <div class="game__panel">
      <div v-if="selected">
        <b>{{ selected.name }}</b>
        <span v-if="selected.owner === 'enemy'"> (противник)</span>
        <span v-else> (игрок)</span>
        <div v-if="selected.kind === 'unit'">
          Скорость: {{ selected.speed }} · {{ selected.moving ? 'идёт' : 'стоит' }}
        </div>
        <div v-else>Здание {{ selected.width }}×{{ selected.height }}, стоит на месте</div>
        <div>Позиция: {{ Math.round(selected.x) }}, {{ Math.round(selected.y) }}</div>
      </div>
      <div v-else>Ничего не выбрано. Кликните по юниту или зданию.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ROUTE_NAME } from '@/router'
import GameObjectView from '@/components/game/GameObjectView.vue'
import { boundsOf, clampCamera, createWorld, objectAt, screenToWorld, sortForDraw, updateWorld } from '@/game/world'

const CAMERA_SPEED = 500
const EDGE = 16

const store = useStore()
const world = reactive(createWorld())
const bounds = boundsOf(world.outline)

const camera = reactive({
  x: -160,
  y: -40,
  zoom: 1,
})

const viewRef = ref(null)
const viewW = ref(window.innerWidth)
const viewH = ref(window.innerHeight - 110)
const cursor = reactive({ x: 0, y: 0 })
const mouseInside = ref(false)
const keys = new Set()

let panLast: any = null
let clickStart: any = null

const selectedId = computed(() => store.getters['getSelectedId'])
const selected = computed(() => world.objects.find((obj) => obj.id === selectedId.value))
const drawList = computed(() => sortForDraw(world.objects))
const outlinePoints = computed(() => world.outline.map((p) => p.x + ',' + p.y).join(' '))
const fieldWidth = computed(() => bounds.maxX - bounds.minX)
const fieldHeight = computed(() => bounds.maxY - bounds.minY)

// Камера: viewBox показывает кусок мира вокруг точки (camera.x, camera.y)
const viewBox = computed(() => {
  const w = viewW.value / camera.zoom
  const h = viewH.value / camera.zoom
  return camera.x - w / 2 + ' ' + (camera.y - h / 2) + ' ' + w + ' ' + h
})

const localPoint = (e: MouseEvent) => {
  const rect = (viewRef.value as any).getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const onMouseDown = (e: MouseEvent) => {
  const point = localPoint(e)
  if (e.button === 0) {
    clickStart = point
  } else if (e.button === 1) {
    panLast = point
    e.preventDefault()
  } else if (e.button === 2) {
    const worldPoint = screenToWorld(camera, viewW.value, viewH.value, point.x, point.y)
    const obj = selected.value
    if (obj && obj.kind === 'unit' && obj.owner === 'player') {
      obj.moving = true
      obj.targetX = worldPoint.x
      obj.targetY = worldPoint.y
    }
  }
}

const onMouseMove = (e: MouseEvent) => {
  if (!viewRef.value) return
  const point = localPoint(e)
  const worldPoint = screenToWorld(camera, viewW.value, viewH.value, point.x, point.y)
  cursor.x = worldPoint.x
  cursor.y = worldPoint.y

  if (panLast) {
    camera.x -= (point.x - panLast.x) / camera.zoom
    camera.y -= (point.y - panLast.y) / camera.zoom
    panLast = point
    clampCamera(camera, bounds)
  }
}

const onMouseUp = (e: MouseEvent) => {
  if (e.button === 0 && clickStart) {
    const point = localPoint(e)
    const moved = Math.hypot(point.x - clickStart.x, point.y - clickStart.y)
    if (moved < 5) {
      const worldPoint = screenToWorld(camera, viewW.value, viewH.value, clickStart.x, clickStart.y)
      const obj = objectAt(world.objects, worldPoint.x, worldPoint.y)
      store.commit('select', obj ? obj.id : null)
    }
    clickStart = null
  }
  if (e.button === 1) panLast = null
}

const onWheel = (e: WheelEvent) => {
  camera.zoom = e.deltaY < 0 ? camera.zoom * 1.1 : camera.zoom / 1.1
  if (camera.zoom < 0.4) camera.zoom = 0.4
  if (camera.zoom > 2.2) camera.zoom = 2.2
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code.startsWith('Arrow') || e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
    e.preventDefault()
  }
  keys.add(e.code)
  if (e.code === 'Escape') store.commit('select', null)
}

const onKeyUp = (e: KeyboardEvent) => {
  keys.delete(e.code)
}

const onBlur = () => {
  keys.clear()
}

const updateSize = () => {
  const el = viewRef.value as any
  if (!el) return
  viewW.value = el.clientWidth
  viewH.value = el.clientHeight
}

let cursorScreenX = 0
let cursorScreenY = 0

const moveCamera = (dt: number) => {
  let dx = 0
  let dy = 0
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1

  if (mouseInside.value && !panLast && viewRef.value) {
    const rect = (viewRef.value as any).getBoundingClientRect()
    if (cursorScreenX < EDGE) dx -= 1
    if (cursorScreenX > rect.width - EDGE) dx += 1
    if (cursorScreenY < EDGE) dy -= 1
    if (cursorScreenY > rect.height - EDGE) dy += 1
  }

  if (!dx && !dy) return
  const len = Math.hypot(dx, dy)
  const step = (CAMERA_SPEED / camera.zoom) * dt
  camera.x += (dx / len) * step
  camera.y += (dy / len) * step
  clampCamera(camera, bounds)
}

const onMouseMoveScreen = (e: MouseEvent) => {
  if (!viewRef.value) return
  const rect = (viewRef.value as any).getBoundingClientRect()
  cursorScreenX = e.clientX - rect.left
  cursorScreenY = e.clientY - rect.top
  mouseInside.value = cursorScreenX >= 0 && cursorScreenY >= 0 && cursorScreenX <= rect.width && cursorScreenY <= rect.height
  onMouseMove(e)
}

let timer: any = null
let lastTime = 0

const tick = () => {
  const now = Date.now()
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now
  moveCamera(dt)
  updateWorld(world, dt)
}

onMounted(() => {
  updateSize()
  window.addEventListener('resize', updateSize)
  window.addEventListener('mousemove', onMouseMoveScreen)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  lastTime = Date.now()
  timer = setInterval(tick, 30)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('resize', updateSize)
  window.removeEventListener('mousemove', onMouseMoveScreen)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onBlur)
  store.commit('select', null)
})
</script>

<style scoped lang="scss">
.game {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0d1a26;
  user-select: none;
  color: #f1e3c2;
  font-family: Georgia, serif;

  &__view {
    position: relative;
    flex: 1;
    overflow: hidden;
    background: #1b4f6e;
    cursor: default;
  }

  &__svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__ground {
    fill: #6b9442;
    stroke: #d8c58a;
    stroke-width: 28;
    stroke-linejoin: round;
  }

  &__grid {
    fill: none;
    stroke: rgba(0, 0, 0, 0.15);
    stroke-width: 1;
  }

  &__axis {
    stroke: rgba(255, 255, 255, 0.35);
    stroke-width: 2;
    stroke-dasharray: 8 8;
  }

  &__origin {
    fill: #fff;
  }

  &__path {
    stroke: #ffe36b;
    stroke-width: 2;
    stroke-dasharray: 6 6;
  }

  &__hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 8px 12px;
    background: rgba(20, 14, 6, 0.75);
    font-size: 14px;
    pointer-events: none;

    a {
      color: #ffd27a;
      pointer-events: auto;
    }
  }

  &__panel {
    height: 110px;
    box-sizing: border-box;
    padding: 16px 20px;
    background: #2c1d0e;
    border-top: 3px solid #8a6d3b;
    font-size: 16px;
    line-height: 1.5;
  }
}
</style>
