import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
	process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

export interface LessonTokenPayload {
	lessonId: string
	clientId: string
	coachId: string
	exp?: number
}

export async function createLessonToken(
	payload: Omit<LessonTokenPayload, "exp">
): Promise<string> {
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d") // Token expires in 7 days
		.sign(secret)

	return token
}

export async function verifyLessonToken(
	token: string
): Promise<LessonTokenPayload> {
	try {
		const { payload } = await jwtVerify(token, secret)
		return payload as unknown as LessonTokenPayload
	} catch (error) {
		throw new Error("Invalid or expired token")
	}
}
