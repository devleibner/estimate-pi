"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [estimation, setEstimation] = useState(0);
  const inputPointsRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../worker.ts", import.meta.url));
    }

    workerRef.current.onmessage = (event: MessageEvent<number>) => {
      setEstimation(event.data);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleWork = useCallback(
    (points: { x: number; y: number }[], total: number) => {
      if (workerRef.current) {
        workerRef.current.postMessage({ points, total });
      }
    },
    []
  );

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      const numPoints = parseInt(inputPointsRef.current?.value || "10", 10);
      const result = await fetch(`/api/estimate?n=${numPoints}`);

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || "An unknown error occurred.");
      }

      const reader = result.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const allPoints: { x: number; y: number }[] = [];

      const processText = async ({
        done,
        value,
      }: {
        done: boolean;
        value: Uint8Array;
      }) => {
        if (done) {
          return;
        }
        const chunk = decoder.decode(value).trim();
        buffer += chunk;

        const chunks = buffer.split("\n").filter(Boolean);

         if (chunks.length > 1) {
          buffer = chunks.pop() || "";
        } 

        for (const jsonChunk of chunks) {
          try {
            const points = JSON.parse(jsonChunk);
            if (Array.isArray(points)) {
              allPoints.push(...points);
            } else {
              console.warn(
                "Invalid chunk format. Expected an array of points."
              );
            }
          } catch (err) {
            console.error("Failed to parse JSON chunk:", err);
          }
        }

        return reader.read().then(processText);
      };

      await reader?.read().then(processText);

      if (allPoints.length > 0) {
        handleWork(allPoints, numPoints);
      } else {
        console.warn("No valid points received from the backend.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while estimating π.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center mx-auto">
      <main className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-2xl font-bold">PI Estimation</h1>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Number of random points:
        </label>
        <input
          id="input"
          ref={inputPointsRef}
          type="number"
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter number of points"
          min={0}
        />
        <button
          className={
            "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          }
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Calculate"}
        </button>
        {estimation > 0 && (
          <p className="text-green-500 font-bold">
            Estimation: {estimation.toFixed(5)}
          </p>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </main>
    </div>
  );
}
