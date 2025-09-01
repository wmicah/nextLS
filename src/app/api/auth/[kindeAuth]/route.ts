import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const GET = handleAuth();