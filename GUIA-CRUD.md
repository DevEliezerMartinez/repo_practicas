# 🧭 Guía CRUD Full-Stack — Playbook para prueba técnica (2h)

> Stack: **Next.js (App Router) + TypeScript + Tailwind** (front) · **Node + Express + TS** (back) · estado con **Zustand**.
> Te dan una entidad (ej. `products`, `clients`, `travelPackages`). El patrón SIEMPRE es el mismo: solo cambian los campos.

---

## ⏱️ Plan EXPRÉS (1h20 — FULL TS)

| Tiempo | Qué |
|---|---|
| 0–5 min | **Lee bien el enunciado.** ¿Qué entidad? ¿qué campos? ¿qué piden exacto? Anótalo. |
| 5–35 min | **Backend** Express + TS: las 4 rutas con array en memoria. Prueba con curl. |
| 35–55 min | **Frontend READ + CREATE**: listar (GET) y crear (POST con form). |
| 55–70 min | **DELETE + UPDATE**. |
| 70–80 min | Validación, manejo de error, un poco de estilo. **Margen para bugs.** |

> ⚠️ **Regla de oro**: que funcione end-to-end RÁPIDO (aunque feo). Primero GET+POST funcionando, luego el resto. NO te claves en estilos.

> 🟦 **FULL TS — checklist**: todos los archivos `.ts`/`.tsx` · `tsconfig` con `"strict": true` · tipa `interface` de la entidad · tipa handlers (`Request`, `Response`) · tipa `useState<T>` y el form · **cero archivos `.js`**.

> ⚡ **Ahorra tiempo**: si es un CRUD de **una sola página**, NO uses Zustand — un `useState<Item[]>` con la lista basta y es más rápido. Usa Zustand SOLO si piden compartir estado entre varias páginas/componentes. (Abajo te dejo las dos versiones.)

---

## 1) BACKEND — Express + TypeScript

### Setup (una vez)
```bash
mkdir backend && cd backend && npm init -y
npm install express cors
npm install -D typescript tsx @types/node @types/express @types/cors
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

`package.json` scripts:
```json
"dev": "tsx watch server.ts",
"build": "tsc",
"start": "node dist/server.js"
```

### `server.ts` — esqueleto CRUD completo (adapta los campos)
```ts
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());          // ← sin esto el navegador bloquea al front (CORS)
app.use(express.json());  // ← sin esto req.body llega undefined

// 👇 EL MOLDE: cambia los campos según la entidad que te pidan
interface Item {
  id: number;
  title: string;
  message: string;
  author: string;
}

let items: Item[] = []; // "base de datos" en memoria

// READ
app.get("/items", (req: Request, res: Response) => {
  res.json(items);
});

// CREATE
app.post("/items", (req: Request, res: Response) => {
  const { title, message, author } = req.body;

  // Validación (SIEMPRE: req.body viene del cliente, no confíes)
  if (!title || !message || !author) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  // id sin repetir: el más alto + 1 (NO uses length + 1)
  const next_id = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;

  const newItem: Item = { id: next_id, title, message, author };
  items.push(newItem);
  return res.status(201).json(newItem); // 201 = creado, devuelve el recurso
});

// UPDATE
app.put("/items/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);          // params llegan como string
  const { title, message, author } = req.body;

  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ message: "No encontrado" });
  if (!title || !message || !author) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const updated: Item = { id, title, message, author };
  items[index] = updated;
  return res.status(200).json(updated);
});

// DELETE
app.delete("/items/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ message: "No encontrado" });

  const [deleted] = items.splice(index, 1); // splice borra y devuelve lo borrado
  return res.status(200).json({ message: "Eliminado", item: deleted });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
```

### Probar el backend (curl)
```bash
curl http://localhost:4000/items                                   # GET
curl -X POST http://localhost:4000/items -H "Content-Type: application/json" -d '{"title":"a","message":"b","author":"c"}'
curl -X PUT  http://localhost:4000/items/1 -H "Content-Type: application/json" -d '{"title":"x","message":"y","author":"z"}'
curl -X DELETE http://localhost:4000/items/1
```

---

## 2) FRONTEND — Next.js (App Router)

### Tipo (debe calcar el backend) — `app/items/types.ts`
```ts
export interface Item {
  id: number;
  title: string;
  message: string;
  author: string;
}
```

### Store Zustand — `app/store/useItemStore.ts`
```ts
import { create } from "zustand";
import { Item } from "../items/types";

interface ItemStore {
  items: Item[];
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  removeItem: (id: number) => void;
}

export const useItemStore = create<ItemStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),                                  // GET
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),       // POST
  updateItem: (item) =>                                                 // PUT
    set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
  removeItem: (id) =>                                                   // DELETE
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));
```
> **Inmutabilidad**: siempre array NUEVO (`[...]`, `.map`, `.filter`). Nunca `push`/mutar — React detecta cambios por referencia.

### Página CRUD — `app/items/page.tsx` (estructura)
```tsx
"use client"; // obligatorio: usa useState/useEffect/eventos

import { useEffect, useState } from "react";
import { useItemStore } from "../store/useItemStore";
import { Item } from "./types";

const API = "http://localhost:4000/items";
type Form = { title: string; message: string; author: string };
const EMPTY: Form = { title: "", message: "", author: "" };

export default function ItemsPage() {
  const items = useItemStore((s) => s.items);     // selectores separados
  const setItems = useItemStore((s) => s.setItems);
  const addItem = useItemStore((s) => s.addItem);
  const updateItem = useItemStore((s) => s.updateItem);
  const removeItem = useItemStore((s) => s.removeItem);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null); // null = crear

  // READ
  useEffect(() => {
    async function load() {                 // async DENTRO del efecto
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error();
        setItems(await res.json());
      } catch { setError("Error al cargar"); }
      finally { setLoading(false); }
    }
    load();
  }, [setItems]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));   // [name] computed property
  }

  // CREATE + UPDATE (mismo form)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();                      // evita recargar la página
    if (!form.title || !form.message || !form.author) { setError("Faltan datos"); return; }
    try {
      if (editingId === null) {
        const res = await fetch(API, { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        addItem(await res.json());
      } else {
        const res = await fetch(`${API}/${editingId}`, { method: "PUT",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        updateItem(await res.json());
        setEditingId(null);
      }
      setForm(EMPTY);
    } catch { setError("Error al guardar"); }
  }

  // DELETE
  async function handleDelete(id: number) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    removeItem(id);
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setForm({ title: item.title, message: item.message, author: item.author });
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <input name="title"   value={form.title}   onChange={handleChange} placeholder="Título" />
        <input name="author"  value={form.author}  onChange={handleChange} placeholder="Autor" />
        <textarea name="message" value={form.message} onChange={handleChange} placeholder="Mensaje" />
        <button type="submit">{editingId === null ? "Crear" : "Guardar"}</button>
      </form>

      {loading && <p>Cargando...</p>}
      {error && <p>{error}</p>}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.title} — {item.author}
            <button onClick={() => startEdit(item)}>Editar</button>
            <button onClick={() => handleDelete(item.id)}>Borrar</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### El patrón de TODA mutación (memorízalo)
```
1. await fetch(url, { method, headers, body })
2. revisar res.ok
3. SOLO si salió bien → actualizar el store (add/update/remove)
4. la lista se re-pinta sola (sale del store)
```

---

## 3) ¿Store (Zustand) o estado local (useState)?

| Va al **store** (global)        | Va a **useState** (local)              |
|---------------------------------|----------------------------------------|
| Datos compartidos entre comps   | `loading`, `error`                     |
| La lista que muta (el CRUD)     | El `form`, el `editingId`              |

> Si NO hay estado compartido, ni necesitas Zustand: un `useState` con la lista basta. Zustand brilla cuando varios componentes leen/escriben lo mismo.
> Para páginas de **solo lectura** (no mutan) → un custom hook tipo `useFetch<T>` es suficiente.

### ⚡ Versión RÁPIDA sin Zustand (CRUD de una sola página)
Reemplazas el store por un `useState` y actualizas la lista con las mismas operaciones inmutables:
```tsx
const [items, setItems] = useState<Item[]>([]);

// en lugar de las acciones del store:
setItems(await res.json());                                  // setTasks (GET)
setItems((prev) => [...prev, created]);                      // addTask (POST)
setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i)); // updateTask (PUT)
setItems((prev) => prev.filter((i) => i.id !== id));         // removeTask (DELETE)
```
Mismo concepto de inmutabilidad, sin archivo de store. **Menos cosas que cablear = menos bugs en una prueba con reloj.**

---

## 3.5) ZUSTAND a detalle

### Qué es (modelo mental)
Una "caja" de estado **global** que vive fuera de los componentes. Cualquier componente se **suscribe** a un pedazo y lo lee/modifica directo, **sin pasar props** (adiós prop drilling). Más ligero que Redux: sin providers, sin reducers, sin boilerplate.

### Anatomía de `create`
```ts
import { create } from "zustand";

interface BearStore {
  bears: number;          // estado
  addBear: () => void;    // acción
  reset: () => void;
}

// create<T>( (set, get) => ({ ...estado, ...acciones }) )
export const useBearStore = create<BearStore>((set, get) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  reset: () => set({ bears: 0 }),
}));
```
- Devuelve un **hook** (`useBearStore`).
- Estado y acciones viven **juntos** dentro del store.
- El callback recibe **`set`** (para escribir) y **`get`** (para leer el estado actual sin re-render).

### `set` — las 2 formas
```ts
set({ bears: 0 });                         // 1) valor NO depende del anterior
set((state) => ({ bears: state.bears + 1 })); // 2) SÍ depende del anterior
```
🔑 **`set` hace MERGE superficial** (shallow): solo reemplaza las claves de primer nivel que devuelves; lo demás queda intacto. Por eso devuelves `{ bears: ... }` y no se borran las otras props.
⚠️ El merge es **solo de 1 nivel**. Si tu estado tiene objetos anidados, tú armas el objeto nuevo a mano (spread).

### `get` — leer estado actual dentro de una acción
```ts
addBearIfFew: () => {
  if (get().bears < 3) set((s) => ({ bears: s.bears + 1 }));
},
```
Útil cuando una acción necesita leer el valor actual sin recibirlo por parámetro.

### Selectores — leer en el componente
```tsx
const bears = useBearStore((s) => s.bears);       // ✅ se re-renderiza SOLO si bears cambia
const addBear = useBearStore((s) => s.addBear);   // las acciones son referencia ESTABLE
```
- **Pide cada cosa por separado** (un selector por valor). Así minimizas re-renders.
- ❌ **Gotcha clásico**: seleccionar un OBJETO nuevo cada render causa renders infinitos / de más:
  ```tsx
  // MAL: crea objeto nuevo cada render → re-render siempre
  const { bears, addBear } = useBearStore((s) => ({ bears: s.bears, addBear: s.addBear }));
  ```
  Si necesitas varias cosas en un objeto, usa `useShallow`:
  ```tsx
  import { useShallow } from "zustand/react/shallow";
  const { bears, addBear } = useBearStore(useShallow((s) => ({ bears: s.bears, addBear: s.addBear })));
  ```
- `useBearStore()` SIN selector → te da TODO el store y re-renderiza con cualquier cambio. Evítalo salvo casos triviales.

### Acción async dentro del store (opcional, muy pro)
Puedes meter el fetch en el propio store, así el componente queda limpísimo:
```ts
interface ItemStore {
  items: Item[];
  loading: boolean;
  fetchItems: () => Promise<void>;
}
export const useItemStore = create<ItemStore>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    const res = await fetch("http://localhost:4000/items");
    set({ items: await res.json(), loading: false });
  },
}));
// en el componente: useEffect(() => { fetchItems(); }, [fetchItems]);
```

### Usar el store FUERA de React (dato pro)
```ts
useBearStore.getState().bears;        // leer sin hook
useBearStore.getState().addBear();    // llamar acción sin hook
useBearStore.setState({ bears: 10 }); // escribir directo
```
Sirve en funciones utilitarias, interceptors, etc. (fuera de componentes).

### Gotchas de Zustand (resumen)
| Error | Por qué | Fix |
|---|---|---|
| Re-renders de más / loop | selector devuelve objeto nuevo | selectores separados o `useShallow` |
| La UI no reacciona | mutaste el estado (`state.items.push`) | devuelve objeto/array NUEVO en `set` |
| "Cannot update during render" | llamas una acción en el cuerpo del render | llámala en evento o dentro de `useEffect` |
| Estado se borra al actualizar | pensaste que `set` reemplaza todo | `set` hace **merge**, devuelve solo lo que cambia |

### Frase para la entrevista
> "Uso Zustand para estado global compartido sin prop drilling. Es más simple que Redux: defino el estado y las acciones juntos en un `create`, leo con selectores para minimizar re-renders, y mantengo todo inmutable para que React detecte los cambios."

---

## 4) ⚠️ Errores comunes (los que cuestan tiempo)

| Síntoma | Causa | Fix |
|---|---|---|
| Front no puede leer el back | **CORS** (puertos distintos) | `app.use(cors())` en el backend |
| `req.body` es `undefined` | falta middleware | `app.use(express.json())` |
| El form recarga la página | submit por defecto | `e.preventDefault()` |
| La acción se dispara al cargar | `onClick={fn(x)}` (se ejecuta en render) | `onClick={() => fn(x)}` |
| `result.map is not a function` | el GET devuelve `{data:[...]}` no `[...]` | devuelve el array pelón o lee `.data` |
| La lista no se actualiza | mutaste el array (`push`) | crea array nuevo (`[...]`/`map`/`filter`) |
| Warning de `useEffect` async | el callback no puede ser `async` | función async DENTRO + llamarla |
| `:id` no hace match | llega como string | `Number(req.params.id)` |
| id repetido tras borrar | usaste `length + 1` | `Math.max(...ids) + 1` |

---

## 5) Preguntas rápidas (por si te las hacen verbalmente)

- **¿Por qué `"use client"`?** El componente usa hooks/eventos → corre en el navegador, no en el server.
- **¿TS valida el `req.body`?** No. Los tipos se borran en runtime y el body viene del cliente → SIEMPRE validas a mano.
- **¿Por qué selectores separados en Zustand?** Para que el componente solo re-renderice cuando ESA pieza cambia.
- **¿201 vs 200?** 201 = recurso creado (POST). 200 = OK genérico. 400 = datos malos. 404 = no existe.
- **¿Status code va en el body?** No. Va con `res.status(201)`, no como campo del JSON.

---

## 6) Comandos para correr

```bash
# Backend
cd backend && npm run dev      # tsx watch → http://localhost:4000

# Frontend
npm run dev                    # Next → http://localhost:3000
```

**Checklist final antes de entregar:** ¿las 4 rutas responden? ¿el front crea/edita/borra y la lista se actualiza sola? ¿maneja loading y error? ¿valida campos vacíos?

¡Éxito! 🚀
