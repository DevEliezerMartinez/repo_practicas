"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { Task } from "./types";

const API = "http://localhost:4000/tasks";

// La forma del formulario: SIN id (el id lo genera el backend al crear)
type TaskForm = { title: string; message: string; author: string };
const EMPTY_FORM: TaskForm = { title: "", message: "", author: "" };

function TaskPage() {
  // --- STORE (fuente de verdad compartida) ---
  const tasks = useTaskStore((s) => s.tasks);
  const setTasks = useTaskStore((s) => s.setTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const removeTask = useTaskStore((s) => s.removeTask);

  // --- ESTADO LOCAL DE UI (no se comparte → no va al store) ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  // editingId === null  → el form está en modo CREAR
  // editingId === número → el form está en modo EDITAR esa task
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- READ: GET al montar → vuelca al store ---
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error();
        const data: Task[] = await res.json();
        setTasks(data);
      } catch {
        setError("No se pudieron cargar las tareas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setTasks]);

  // Input controlado: cada tecla actualiza el campo correspondiente del form.
  // Usamos [name] (computed property) para reusar un solo handler en todos los inputs.
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // --- CREATE + UPDATE: el mismo form sirve para ambos ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // sin esto, el form recarga la página (comportamiento HTML por defecto)

    // Validación básica
    if (!form.title || !form.message || !form.author) {
      setError("Completa todos los campos");
      return;
    }
    setError(null);

    try {
      if (editingId === null) {
        // CREATE → POST. El backend devuelve la task creada (ya con su id).
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const created: Task = await res.json();
        addTask(created); // ← el store se actualiza y la lista se re-pinta sola
      } else {
        // UPDATE → PUT /tasks/:id. Devuelve la task ya actualizada.
        const res = await fetch(`${API}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        const updated: Task = await res.json();
        updateTask(updated);
        setEditingId(null); // salimos de modo edición
      }
      setForm(EMPTY_FORM); // limpiamos el form en ambos casos
    } catch {
      setError("No se pudo guardar la tarea");
    }
  }

  // --- DELETE → DELETE /tasks/:id ---
  async function handleDelete(id: number) {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      removeTask(id); // quita del store → desaparece de la lista
    } catch {
      setError("No se pudo borrar la tarea");
    }
  }

  // Pasa una task al form para editarla (modo edición)
  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm({ title: task.title, message: task.message, author: task.author });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">
        Lista de tareas
      </h1>

      {/* --- FORMULARIO (crear / editar) --- */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Título"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          placeholder="Autor"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Mensaje"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            {editingId === null ? "Crear tarea" : "Guardar cambios"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* --- ESTADOS --- */}
      {loading && (
        <p className="animate-pulse text-gray-500">Cargando tareas...</p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {!loading && tasks.length === 0 && (
        <p className="text-gray-500">No hay tareas todavía.</p>
      )}

      {/* --- LISTA --- */}
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
              {task.id}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <p className="text-sm text-gray-600">{task.message}</p>
              <p className="mt-1 text-xs text-gray-400">por {task.author}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => startEdit(task)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default TaskPage;
