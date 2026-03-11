# @vaed-ai/cyto

React components for Cytoscape.js — declarative graph nodes with React content inside.

## Файлы

- **`cyto.tsx`** — core: Cyto, CytoNode, CytoEdge, CytoStyle, grab-механика
- **`index.tsx`** — re-export
- **`app/`** — Next.js демо-сайт с примерами

## Импорты: только по имени пакета

```ts
import { Cyto, CytoNode } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
```

Настроено через tsconfig paths + next.config.mjs webpack alias.

## Примеры

Каждый пример — отдельный файл в `app/examples/`:
- Импортируется как компонент для рендера
- Импортируется как `?raw` строка для отображения кода

**Код в примерах должен быть исходным TSX, не скомпилированным JS.**
Это обеспечивается `?raw` webpack правилом в `oneOf` блоке (next.config.mjs).

## Стили

Стилистика единая с ~/vaed-ai:
- Scoped CSS через `[data-vaed][data-theme="dark"|"light"]`
- Inline styles через `useTheme()` hook
- Нет tailwind, нет utility-классов

## Grab-механика

- `.cyto-grab` — mousedown на этом элементе (и детях) форвардится на canvas cytoscape → нода перетаскивается
- `.cyto-no-grab` — блокирует форвардинг от этой точки вглубь
- `INPUT`, `BUTTON`, `SELECT`, `TEXTAREA`, `A`, `[contenteditable]` — автоматически не триггерят grab
