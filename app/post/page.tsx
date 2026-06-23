    // app/post/page.tsx
    'use client';

    import {useFetch} from "../hooks/useFetch"
    import { Post } from "./types";

    function page() {
    const {result,error,loading} = useFetch<Post>("https://jsonplaceholder.typicode.com/posts")

        return (
            <main>
                <h2>Pagina bonita de Posts</h2>
                <div className='grid grid-cols-3 gap-4'>
                {loading && <p>Cargando contenido...</p>}
                {error && <p>Lo sentimos hubo un error...</p>}
                {result.map((data)=>(
                    <div className='border rounded-xl m-4 px-4 py-2' key={data.id}>
                        <h3 className='text-2xl font-bold'>{data.title}</h3>
                        <p className='mt-4 '>{data.body}</p>
                    </div>
                ))}
                </div>

            </main>
        )
    }

    export default page