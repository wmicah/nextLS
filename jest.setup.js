import "@testing-library/jest-dom"

// Mock Next.js router
jest.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			refresh: jest.fn(),
		}
	},
	usePathname() {
		return "/"
	},
}))

// Mock Next.js Image component
jest.mock("next/image", () => ({
	__esModule: true,
	default: (props) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img {...props} alt={props.alt} />
	},
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
})
