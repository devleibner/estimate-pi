"use client";
import { useState, useRef } from "react";
import { useSSE } from "./hooks/use-sse";

export default function Home() {
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { isLoading, error, estimation } = useSSE(totalPoints || 0);

  const handleSubmit = () => {
    const numPoints = parseInt(inputRef.current?.value || "0");

    if (isNaN(numPoints) || numPoints <= 0) {
      return;
    }

    setTotalPoints(numPoints);
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
          ref={inputRef}
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
            Estimation: {estimation.toFixed(6)}
          </p>
        )}
        {error && <p className="text-red-500">An error occurred: {error}</p>}
      </main>
    </div>
  );
}
