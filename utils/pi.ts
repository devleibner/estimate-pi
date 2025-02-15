export default function pi({
  points,
  total,
}: {
  points: { x: number; y: number }[];
  total: number;
}) {
  if (!Array.isArray(points)) {
    throw new Error("Invalid input: 'points' must be an array.");
  }

  if (
    points.some(
      (point) => typeof point.x !== "number" || typeof point.y !== "number"
    )
  ) {
    throw new Error(
      "Invalid input: Each point must have numeric 'x' and 'y' properties."
    );
  }

  let inside = 0;

  for (const { x, y } of points) {
    if (x ** 2 + y ** 2 <= 1) {
      inside++;
    }
  }

  if (points.length === 0) {
    return 0;
  }

  const estimation = (inside / total) * 4;
  return estimation;
}
