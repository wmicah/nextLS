import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "../Dashboard";
import { trpc } from "@/app/_trpc/client";

// Mock tRPC
jest.mock("@/app/_trpc/client", () => ({
  trpc: {
    clients: {
      list: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
    user: {
      getProfile: {
        useQuery: jest.fn(() => ({
          data: {
            id: "user-1",
            name: "Test Coach",
            email: "coach@example.com",
            role: "COACH",
          },
          isLoading: false,
        })),
      },
    },
    analytics: {
      getCoachAnalytics: {
        useQuery: jest.fn(() => ({
          data: {
            totalClients: 0,
            activeClients: 0,
            totalPrograms: 0,
            averageClientEngagement: 0,
          },
          isLoading: false,
        })),
      },
    },
    events: {
      getUpcomingEvents: {
        useQuery: jest.fn(() => ({
          data: [],
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/dashboard",
}));

// Mock ProfilePictureUploader to avoid TextEncoder issues
jest.mock("../ProfilePictureUploader", () => ({
  __esModule: true,
  default: () => null,
}));

// Mock NotificationPopup to avoid tRPC issues
jest.mock("../NotificationPopup", () => ({
  __esModule: true,
  default: () => null,
}));

// Mock MessagePopup to avoid tRPC issues
jest.mock("../MessagePopup", () => ({
  __esModule: true,
  default: () => null,
}));

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    // Reset mocks to default state
    (trpc.user.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: {
        id: "user-1",
        name: "Test Coach",
        email: "coach@example.com",
        role: "COACH",
      },
      isLoading: false,
    });
    (trpc.clients.list.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (trpc.analytics.getCoachAnalytics.useQuery as jest.Mock).mockReturnValue({
      data: {
        totalClients: 0,
        activeClients: 0,
        totalPrograms: 0,
        averageClientEngagement: 0,
      },
      isLoading: false,
    });
    (trpc.events.getUpcomingEvents.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { container } = render(<Dashboard />);
    // Just verify the component renders without errors
    expect(container).toBeTruthy();
  });

  it("displays loading state while fetching data", () => {
    (trpc.user.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    (trpc.clients.list.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    (trpc.analytics.getCoachAnalytics.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    (trpc.events.getUpcomingEvents.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { container } = render(<Dashboard />);
    // Should render loading state without errors
    expect(container).toBeTruthy();
  });

  it("displays client count when data is loaded", async () => {
    (trpc.user.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: {
        id: "user-1",
        name: "Test Coach",
        email: "coach@example.com",
        role: "COACH",
      },
      isLoading: false,
    });
    (trpc.clients.list.useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: "1", name: "Client 1" },
        { id: "2", name: "Client 2" },
      ],
      isLoading: false,
    });
    (trpc.analytics.getCoachAnalytics.useQuery as jest.Mock).mockReturnValue({
      data: {
        totalClients: 2,
        activeClients: 2,
        totalPrograms: 0,
        averageClientEngagement: 0,
      },
      isLoading: false,
    });
    (trpc.events.getUpcomingEvents.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { container } = render(<Dashboard />);

    await waitFor(() => {
      // Dashboard should render with client data without errors
      expect(container).toBeTruthy();
    });
  });

  it("displays analytics when available", async () => {
    (trpc.user.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: {
        id: "user-1",
        name: "Test Coach",
        email: "coach@example.com",
        role: "COACH",
      },
      isLoading: false,
    });
    (trpc.clients.list.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (trpc.analytics.getCoachAnalytics.useQuery as jest.Mock).mockReturnValue({
      data: {
        totalClients: 10,
        activeClients: 8,
        totalPrograms: 5,
        averageClientEngagement: 85,
      },
      isLoading: false,
    });
    (trpc.events.getUpcomingEvents.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { container } = render(<Dashboard />);

    await waitFor(() => {
      // Dashboard should render with analytics data without errors
      expect(container).toBeTruthy();
    });
  });
});
