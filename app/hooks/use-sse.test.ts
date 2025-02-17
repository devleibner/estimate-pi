import { renderHook, act, waitFor } from "@testing-library/react";
import { useSSE } from "./use-sse";

interface MockEventSource {
  onopen: jest.Mock;
  onmessage: jest.Mock;
  onerror: jest.Mock;
  addEventListener: jest.Mock;
  close: jest.Mock;
}

describe("useSSE Hook", () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    mockEventSource = {
      onopen: jest.fn(),
      onmessage: jest.fn(),
      onerror: jest.fn(),
      addEventListener: jest.fn(),
      close: jest.fn(),
    };

    global.EventSource = jest.fn(
      () => mockEventSource
    ) as unknown as typeof EventSource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useSSE(0));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.estimation).toBe(0);
  });

  it("should start loading and calculate estimation when totalPoints > 0", async () => {
    const totalPoints = 10;

    const { result } = renderHook(() => useSSE(totalPoints));

    expect(EventSource).toHaveBeenCalledWith(`/api/estimate?n=${totalPoints}`);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await waitFor(() => {
        mockEventSource.onmessage({
          data: JSON.stringify([
            { x: 0.5, y: 0.5 },
            { x: 1.5, y: 1.5 },
            { x: 0.3, y: 0.4 },
            { x: 2.0, y: 2.0 },
            { x: 0.1, y: 0.2 },
          ]),
        });

        mockEventSource.onmessage({
          data: JSON.stringify([
            { x: 0.6, y: 0.7 },
            { x: 3.0, y: 3.0 },
            { x: 0.8, y: 0.9 },
            { x: 4.0, y: 4.0 },
            { x: 0.2, y: 0.3 },
          ]),
        });

        mockEventSource.onmessage({ data: "[DONE]" });
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.estimation).toBeGreaterThan(0);
    });

    expect(mockEventSource.close).toHaveBeenCalledTimes(1);
  });

  it("should handle errors during EventSource initialization", async () => {
    global.EventSource = jest.fn(() => {
      throw new Error("Network error");
    }) as unknown as typeof EventSource;

    const { result } = renderHook(() => useSSE(10));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(
        "Failed to initialize the EventSource connection."
      );
      expect(result.current.estimation).toBe(0);
    });
  });
});
