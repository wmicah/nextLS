"use client"

import { PropsWithChildren, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { trpc } from "@/app/_trpc/client"
import { httpBatchLink } from "@trpc/client"

const Providers = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes
						gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
						retry: 1,
						refetchOnWindowFocus: false,
						refetchOnReconnect: false,
					},
					mutations: {
						retry: 1,
					},
				},
			})
	)
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url:
						process.env.NODE_ENV === "production"
							? "https://next-ls-nine.vercel.app/api/trpc"
							: "http://localhost:3000/api/trpc",
				}),
			],
		})
	)

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	)
}

export default Providers
