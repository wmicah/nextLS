import "@testing-library/jest-dom";

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
    };
  },
  usePathname() {
    return "/";
  },
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.JWT_SECRET = "test-jwt-secret";

// Mock console methods in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
        args[0].includes("<button> cannot be a descendant of <button>") ||
        args[0].includes("<button> cannot contain a nested <button>"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
        args[0].includes("<button> cannot be a descendant of <button>") ||
        args[0].includes("<button> cannot contain a nested <button>"))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock global Request and Response for Next.js
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this._url = url;
    this.method = options.method || "GET";
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
  }

  get url() {
    return this._url;
  }

  get nextUrl() {
    return { pathname: this._url };
  }

  get ip() {
    return "127.0.0.1";
  }

  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : {});
  }

  text() {
    return Promise.resolve(this.body || "");
  }
};

// Mock global Response
global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : {});
  }

  text() {
    return Promise.resolve(this.body || "");
  }

  static json(data, options = {}) {
    return new MockResponse(JSON.stringify(data), options);
  }

  static redirect(url, status = 302) {
    return new MockResponse(null, { status, headers: { location: url } });
  }
};

// Mock NextResponse
global.NextResponse = class MockNextResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  static json(data, options = {}) {
    return new MockNextResponse(JSON.stringify(data), options);
  }

  static redirect(url, options = {}) {
    return new MockNextResponse(null, {
      ...options,
      status: 302,
      headers: { Location: url },
    });
  }

  static next(options = {}) {
    return new MockNextResponse(null, options);
  }
};
