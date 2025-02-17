import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const n = parseInt(request.nextUrl.searchParams.get("n") || "0", 10);

  if (isNaN(n) || n <= 0) {
    return NextResponse.json(
      { error: "Invalid value for 'n'. Please provide a positive integer." },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      let pointsSent = 0;
      const chunkSize = 1000;

      const sendChunk = () => {
        try {
          if (pointsSent >= n) {
            controller.enqueue("data: [DONE]\n\n");
            controller.close();
            return;
          }

          const chunk: { x: number; y: number }[] = [];
          for (let i = 0; i < chunkSize && pointsSent < n; i++) {
            chunk.push({ x: Math.random(), y: Math.random() });
            pointsSent++;
          }

          const eventData = JSON.stringify(chunk);
          const message = `data: ${eventData}\n\n`;
          controller.enqueue(message);

          setTimeout(sendChunk, 10);
        } catch (error) {
          console.error("Error while sending chunk:", error);
          controller.error(error);
        }
      };

      sendChunk();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
}
