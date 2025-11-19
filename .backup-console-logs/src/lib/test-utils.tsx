import React, { type ReactElement } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';

// Create a custom render function that includes minimal providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockClient = (overrides = {}) => ({
  id: 'client-1',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockProgram = (overrides = {}) => ({
  id: 'program-1',
  name: 'Test Program',
  description: 'A test program',
  duration: 30,
  difficulty: 'BEGINNER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 'message-1',
  content: 'Test message',
  senderId: 'user-1',
  receiverId: 'user-2',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API response mocks
export const createMockApiResponse = (data: any, overrides = {}) => ({
  success: true,
  data,
  message: 'Success',
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockApiError = (message: string, overrides = {}) => ({
  success: false,
  error: {
    message,
    code: 'ERROR',
    details: null,
  },
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Form testing utilities
export const fillForm = async (form: HTMLElement, data: Record<string, string>) => {
  const userEvent = await import('@testing-library/user-event');
  const user = userEvent.default;
  
  for (const [name, value] of Object.entries(data)) {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      await user.type(input, value);
    }
  }
};

export const submitForm = async (form: HTMLElement) => {
  const userEvent = await import('@testing-library/user-event');
  const user = userEvent.default;
  
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitButton) {
    await user.click(submitButton);
  }
};

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export const waitForElementToBeRemoved = (element: HTMLElement) =>
  new Promise(resolve => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

// Mock function utilities
export const createMockFunction = () => jest.fn();

export const createMockAsyncFunction = (returnValue?: any) =>
  jest.fn().mockResolvedValue(returnValue);

export const createMockRejectedFunction = (error: Error) =>
  jest.fn().mockRejectedValue(error);

// Router mock utilities
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

// Local storage utilities
export const setLocalStorage = (key: string, value: string) => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((k: string) => k === key ? value : null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
};

export const clearLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
};
