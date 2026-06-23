import express, { Request, Response } from "express";
import cors from "cors";

// El "molde" de una task: mismo shape que usas en el front
interface Task {
    id: number;
    title: string;
    message: string;
    author: string;
}


const app = express()

const PORT = 4000;

app.use(cors()) 
app.use(express.json());

let cool_tasks: Task[] = [
    {
        id: 1,
        title: "Send messages",
        message: "Make a summary",
        author: "me"
    },
    {
        id: 2,
        title: "Clean repository",
        message: "Remove external backend folders and files",
        author: "me"
    },
    {
        id: 3,
        title: "Configure nodemon",
        message: "Add start script to package.json",
        author: "Eliezer"
    }
];

app.get("/status", (req: Request, res: Response) => {
    res.json({
        message: "API funcionando",
    })
})


app.get("/tasks", (req: Request, res: Response) => {
    res.json(cool_tasks)
})

app.post("/tasks", (req: Request, res: Response) => {
    const new_title = req.body.title;
    const new_message = req.body.message;
    const new_author = req.body.author;




    if (new_title && new_message && new_author) {
        const ids = cool_tasks.map((task) => task.id);
        const next_id = Math.max(...ids) + 1

        let new_task = {
            id: next_id,
            title: new_title,
            message: new_message,
            author: new_author,
        }


        cool_tasks.push(new_task);

        return res.status(201).json(new_task)
    } else {
        return res.status(400).json({ message: "Datos incompletos" })
    }





})


// PUT /tasks/:id  -> actualiza una task existente
app.put("/tasks/:id", (req: Request, res: Response) => {
    // 1) El id viene en la URL como TEXTO ("2"), lo convertimos a número
    const id = Number(req.params.id);

    // 2) Leemos los datos nuevos del body
    const new_title = req.body.title;
    const new_message = req.body.message;
    const new_author = req.body.author;

    // 3) Buscamos la POSICIÓN de la task en el array (-1 si no existe)
    const index = cool_tasks.findIndex((task) => task.id === id);

    // 4) Si no existe, 404 y cortamos
    if (index === -1) {
        return res.status(404).json({ message: "Task no encontrada" });
    }

    // 5) Validamos que vengan los campos
    if (!new_title || !new_message || !new_author) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    // 6) Reemplazamos la task, conservando su id original
    const updated_task = {
        id: id,
        title: new_title,
        message: new_message,
        author: new_author,
    };
    cool_tasks[index] = updated_task;

    // 7) Respondemos con la task actualizada
    return res.status(200).json(updated_task);
})

// DELETE /tasks/:id
app.delete("/tasks/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const index = cool_tasks.findIndex((task) => task.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Task no encontrada" });
    }

    // Elimina la tarea y guarda la eliminada
    const deletedTask = cool_tasks.splice(index, 1)[0];

    return res.status(200).json({
        message: "Task eliminada correctamente",
        task: deletedTask
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});