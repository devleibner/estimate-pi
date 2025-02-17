import { useState, useEffect, useCallback } from "react";

export function useSSE(totalPoints: number): {
  isLoading: boolean;
  error: string | null;
  estimation: number;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimation, setEstimation] = useState(0);

  const calculatePIEstimation = useCallback(
    (pointsInsideCircle: number) => {
      return totalPoints > 0 ? (4 * pointsInsideCircle) / totalPoints : 0;
    },
    [totalPoints]
  );

  const setupEventSource = useCallback(
    (url: string) => {
      let eventSource: EventSource | null = null;

      try {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          setIsLoading(true);
        };

        let pointsInsideCircle = 0;

        eventSource.onmessage = (event) => {
          if (event.data === "[DONE]") {
            eventSource?.close();
            setIsLoading(false);
            return;
          }

          try {
            const parsedChunk = JSON.parse(event.data);

            if (Array.isArray(parsedChunk)) {
              for (const point of parsedChunk) {
                if (
                  typeof point.x === "number" &&
                  typeof point.y === "number"
                ) {
                  if (point.x ** 2 + point.y ** 2 <= 1) {
                    pointsInsideCircle++;
                  }
                } else {
                  console.warn("Invalid point format:", point);
                }
              }

              setEstimation(calculatePIEstimation(pointsInsideCircle));
            } else {
              console.warn("Invalid chunk format:", parsedChunk);
            }
          } catch (err) {
            console.error("Error parsing chunk:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource error:", err);
          setError("An error occurred while streaming data.");
          setIsLoading(false);
          if (eventSource) {
            eventSource.close();
          }
        };

        eventSource.addEventListener("close", () => {
          console.log("EventSource connection closed");
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error initializing EventSource:", err);
        setError("Failed to initialize the EventSource connection.");
        setIsLoading(false);
      }

      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    },
    [calculatePIEstimation]
  );

  useEffect(() => {
    if (totalPoints <= 0) {
      setIsLoading(false);
      return;
    }

    const url = `/api/estimate?n=${totalPoints}`;
    return setupEventSource(url);
  }, [totalPoints, setupEventSource]);

  return { isLoading, error, estimation };
}
