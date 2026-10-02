// Координаты мира: ось X вправо, ось Y вниз, точка (0, 0) — центр карты.
// Форма поля задаётся многоугольником. Размер и форма не зависят от размера экрана:
// чтобы изменить карту, достаточно поменять список точек.
// Все объекты — обычные объекты с полями. Разная скорость и размер задаются при создании.

let nextId = 1

const createObject = (data: any) => {
  return {
    id: nextId++,
    kind: data.kind,
    name: data.name,
    label: data.label,
    owner: data.owner,
    x: data.x,
    y: data.y,
    speed: data.speed || 0,
    radius: data.radius || 0,
    width: data.width || 0,
    height: data.height || 0,
    moving: false,
    targetX: 0,
    targetY: 0,
  }
}

const unit = (name: string, label: string, speed: number, x: number, y: number, owner: string) => {
  return createObject({ kind: 'unit', name, label, owner, x, y, speed, radius: 16 })
}

const building = (name: string, label: string, width: number, height: number, x: number, y: number, owner: string) => {
  return createObject({ kind: 'building', name, label, owner, x, y, width, height })
}

export const createWorld = () => {
  return {
    outline: [
      { x: -1100, y: -250 },
      { x: -700, y: -620 },
      { x: -100, y: -520 },
      { x: 450, y: -700 },
      { x: 1100, y: -280 },
      { x: 1250, y: 200 },
      { x: 700, y: 620 },
      { x: 50, y: 480 },
      { x: -550, y: 640 },
      { x: -1150, y: 220 },
    ],
    objects: [
      building('Городской центр', 'ГЦ', 140, 140, -160, -40, 'player'),
      building('Дом', 'Д', 70, 70, -300, -150, 'player'),
      building('Казармы', 'Кз', 100, 100, -320, 90, 'player'),
      unit('Крестьянин', 'К', 70, -40, 50, 'player'),
      unit('Крестьянин', 'К', 70, 10, 50, 'player'),
      unit('Крестьянин', 'К', 70, 60, 50, 'player'),
      unit('Ополченец', 'О', 95, -40, 120, 'player'),
      unit('Ополченец', 'О', 95, 20, 120, 'player'),
      unit('Разведчик', 'Р', 160, 110, 20, 'player'),

      building('Городской центр', 'ГЦ', 140, 140, 780, -60, 'enemy'),
      unit('Ополченец', 'О', 95, 700, 50, 'enemy'),
      unit('Ополченец', 'О', 95, 760, 50, 'enemy'),
    ],
  }
}

export const boundsOf = (points: any[]) => {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  points.forEach((p) => {
    if (p.x < bounds.minX) bounds.minX = p.x
    if (p.y < bounds.minY) bounds.minY = p.y
    if (p.x > bounds.maxX) bounds.maxX = p.x
    if (p.y > bounds.maxY) bounds.maxY = p.y
  })
  return bounds
}

// Точка внутри многоугольника любой формы
export const pointInPolygon = (x: number, y: number, polygon: any[]) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (!a || !b) continue
    const crosses = (a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

export const hits = (obj: any, x: number, y: number) => {
  if (obj.kind === 'unit') {
    return Math.hypot(obj.x - x, obj.y - y) <= obj.radius
  }
  return (
    x >= obj.x - obj.width / 2 &&
    x <= obj.x + obj.width / 2 &&
    y >= obj.y - obj.height / 2 &&
    y <= obj.y + obj.height / 2
  )
}

// Сначала здания, потом юниты снизу вверх — так верхний на экране и кликается первым
export const sortForDraw = (objects: any[]) => {
  return [...objects].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'building' ? -1 : 1
    return a.y - b.y
  })
}

export const objectAt = (objects: any[], x: number, y: number) => {
  const list = sortForDraw(objects)
  for (let i = list.length - 1; i >= 0; i--) {
    const obj = list[i]
    if (obj && hits(obj, x, y)) return obj
  }
  return null
}

const overlapsBuilding = (world: any, obj: any, x: number, y: number) => {
  return world.objects.some((other: any) => {
    if (other.kind !== 'building') return false
    const nearestX = Math.max(other.x - other.width / 2, Math.min(x, other.x + other.width / 2))
    const nearestY = Math.max(other.y - other.height / 2, Math.min(y, other.y + other.height / 2))
    return Math.hypot(x - nearestX, y - nearestY) < obj.radius
  })
}

const canStand = (world: any, obj: any, x: number, y: number) => {
  return pointInPolygon(x, y, world.outline) && !overlapsBuilding(world, obj, x, y)
}

// dt — секунды с прошлого кадра. За шаг юнит проходит speed * dt и не заходит в здания и за край карты.
export const updateWorld = (world: any, dt: number) => {
  world.objects.forEach((obj: any) => {
    if (obj.kind !== 'unit' || !obj.moving) return

    const dx = obj.targetX - obj.x
    const dy = obj.targetY - obj.y
    const dist = Math.hypot(dx, dy)
    const step = obj.speed * dt

    if (dist <= step) {
      if (canStand(world, obj, obj.targetX, obj.targetY)) {
        obj.x = obj.targetX
        obj.y = obj.targetY
      }
      obj.moving = false
      return
    }

    const nextX = obj.x + (dx / dist) * step
    const nextY = obj.y + (dy / dist) * step
    if (canStand(world, obj, nextX, nextY)) {
      obj.x = nextX
      obj.y = nextY
    } else {
      obj.moving = false
    }
  })
}

export const screenToWorld = (camera: any, viewW: number, viewH: number, sx: number, sy: number) => {
  return {
    x: camera.x + (sx - viewW / 2) / camera.zoom,
    y: camera.y + (sy - viewH / 2) / camera.zoom,
  }
}

export const clampCamera = (camera: any, bounds: any) => {
  camera.x = Math.min(bounds.maxX, Math.max(bounds.minX, camera.x))
  camera.y = Math.min(bounds.maxY, Math.max(bounds.minY, camera.y))
}
