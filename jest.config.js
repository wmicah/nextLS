const nextJest = require("next/jest")

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files
	dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	testEnvironment: "jsdom",
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		"\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/__mocks__/fileMock.js",
	},
	testPathIgnorePatterns: [
		"<rootDir>/.next/", 
		"<rootDir>/node_modules/",
		"<rootDir>/coverage/",
		"<rootDir>/dist/",
		"<rootDir>/build/"
	],
	collectCoverageFrom: [
		"src/**/*.{js,jsx,ts,tsx}",
		"!src/**/*.d.ts",
		"!src/**/*.stories.{js,jsx,ts,tsx}",
		"!src/**/*.test.{js,jsx,ts,tsx}",
		"!src/**/*.spec.{js,jsx,ts,tsx}",
		"!src/**/index.{js,jsx,ts,tsx}",
		"!src/app/layout.tsx",
		"!src/app/page.tsx"
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	coverageReporters: [
		"text",
		"lcov",
		"html",
		"json"
	],
	testMatch: [
		"<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
		"<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}"
	],
	transform: {
		"^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }]
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	clearMocks: true,
	restoreMocks: true,
	collectCoverage: true,
	verbose: true,
	testTimeout: 10000,
	globals: {
		"ts-jest": {
			tsconfig: "tsconfig.json"
		}
	}
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
