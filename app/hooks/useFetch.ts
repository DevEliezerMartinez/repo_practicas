import { useEffect, useState } from "react";

export function useFetch<T>(url: string) {
    const [result, setResult] = useState<T[]>([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPost() {
            try {
                let response = await fetch(url);
                const data: T[] = await response.json();
                console.log(data)
                setResult(data)

            } catch {
                console.log("Fallo al cargar los datos")
                setError("Fallo al cargar los datos");
            } finally {
                setLoading(false)
            }

        }

        fetchPost();
    }, [url])


    return {result,loading,error}

}