import { create } from "zustand";
  import { Task } from "../task/types";

  interface TaskStore {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (task: Task) => void;
    removeTask: (id: number) => void;
  }

  export const useTaskStore = create<TaskStore>((set) => ({
    tasks: [],

    // 1) Reemplaza la lista completa (lo que llega del GET).
    //    No depende de lo anterior → forma simple.
    //    { tasks } es atajo de { tasks: tasks }
    setTasks: (tasks) => set({ tasks }),

    // 2) Agrega una task. SÍ depende del array actual → forma con (state).
    //    Creamos un array NUEVO con spread (no mutamos el viejo).
    addTask: (task) =>
      set((state) => ({ tasks: [...state.tasks, task] })),

    // 3) Reemplaza una task por su id (para editar).
    //    map devuelve array nuevo: si coincide el id, pone la nueva; si no, deja la misma.
    updateTask: (task) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      })),

    // 4) Quita por id. También depende del actual.
    //    filter devuelve un array nuevo solo con los que NO son ese id.
    removeTask: (id) =>
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  }));