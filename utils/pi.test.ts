import pi from "./pi"; 

describe("pi function", () => {
  it("should return an estimation of pi when valid points are provided", () => {
    const points = [
      { x: 0.5, y: 0.5 },
      { x: 0.7, y: 0.7 },
      { x: -0.3, y: -0.4 },
      { x: 1.2, y: 1.2 },
    ];
    const total = points.length;
    const result = pi({ points, total });
    expect(result).toBeCloseTo(3);
  });

  it("should return 0 when no points are provided", () => {
    const points: [] = [];
    const total = points.length;
    const result = pi({ points, total });
    expect(result).toBe(0);
  });

  it("should handle large datasets without errors", () => {
    const points = Array.from({ length: 10000 }, () => ({
      x: Math.random(),
      y: Math.random(),
    }));
    const total = points.length;
    const result = pi({ points, total });
    expect(result).toBeGreaterThan(3);
    expect(result).toBeLessThan(4);
  });
});
