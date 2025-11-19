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
						retry: (failureCount, error) => {
							// Don't retry on 4xx errors
							if (error instanceof Error && 'status' in error) {
								const status = (error as any).status;
								if (status >= 400 && status < 500) {
									return false;
								}
							}
							return failureCount < 2;
						},
						refetchOnWindowFocus: false,
						refetchOnReconnect: true,
					},
					mutations: {
						retry: (failureCount, error) => {
							// Don't retry on 4xx errors
							if (error instanceof Error && 'status' in error) {
								const status = (error as any).status;
								if (status >= 400 && status < 500) {
									return false;
								}
							}
							return failureCount < 1;
						},
					},
				},
			})
	)
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: "/api/trpc", // Use relative URL - works in both dev and production
					// Add error handling
					headers: async () => {
						return {
							'x-trpc-source': 'react',
						};
					},
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
