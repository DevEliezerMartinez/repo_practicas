'use client'
import  { useMemo, useState } from 'react'
import { Comment } from './type'
import { useFetch } from "../hooks/useFetch"

function Page() {
    // Estado local SOLO para el texto del buscador.
    // Es independiente del estado que maneja useFetch (result, loading, error).
    const [busqueda, setBusqueda] = useState("")

    // useFetch<Comment> hace todo el trabajo pesado: fetch, loading, error.
    // "result" siempre va a ser el array COMPLETO de comentarios de la API,
    // nunca se modifica después de que llega.
    const { result, loading, error } = useFetch<Comment>("https://jsonplaceholder.typicode.com/comments")

    // useMemo memoriza el resultado del filtro.
    // Solo se vuelve a ejecutar el .filter() si "result" o "busqueda" cambiaron
    // desde el último render. Si ningún otro estado ajeno cambia, React reutiliza
    // el array filtrado que ya tenía guardado, sin recalcular nada.
    const commentsFilter = useMemo(() => {
        return result.filter((comment) =>
            // .toLowerCase() en ambos lados = comparación sin importar mayúsculas/minúsculas
            comment.name.toLowerCase().includes(busqueda.toLowerCase())
        )
    }, [result, busqueda])

    return (
        <main className='p-4 '>
            <h2 className='font-bold text-3xl'>
                Comentarios top
            </h2>

            {/* Input controlado: cada tecla dispara setBusqueda,
                lo que actualiza el estado y re-renderiza el componente */}
            <input
                onChange={(e) => setBusqueda(e.target.value)}
                className='w-72 my-4 px-4 py-3 rounded-xl border '
                type='text'
                placeholder='Encuentra lo que dicen tus amigos..'
            />

            <p>Buscando comentarios de: {busqueda}</p>

            {/* Mientras el fetch original sigue en curso o falla,
                avisamos al usuario ANTES de mostrar la lista filtrada */}
            {loading && <p>Cargando comentarios...</p>}
            {error && <p>Lo sentimos hubo un error...</p>}

            {/* Renderizamos commentsFilter (la lista YA filtrada),
                nunca result directamente — así el buscador tiene efecto visual */}
            <div className='grid grid-cols-4 gap-4'>
                {commentsFilter.map((comment) => (
                    <div key={comment.id} className='border bg-blue-300 rounded-xl px-4 py-2 '>
                        <h3 className='text-xl font-bold'>{comment.name}</h3>
                        <p className='text-xs text-gray-50'>{comment.email}</p>
                        <p className='mt-10'>{comment.body}</p>
                    </div>
                ))}
            </div>
        </main>
    )
}

export default Page