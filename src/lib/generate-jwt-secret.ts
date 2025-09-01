import { randomBytes } from "crypto"

// Generate a secure random JWT secret
const generateJWTSecret = () => {
	return randomBytes(64).toString("hex")
}

// This script can be run to generate a new JWT secret
if (require.main === module) {
	console.log("Generated JWT Secret:")
	console.log(generateJWTSecret())
	console.log("\nAdd this to your .env file as:")
	console.log("JWT_SECRET=your_generated_secret_here")
}

export { generateJWTSecret }
