import { NextResponse } from "next/server";
import { Readable } from "stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const n = parseInt(searchParams.get("n") || '0', 10);
  
  if (isNaN(n) || n <= 0) {
    return NextResponse.json(
      { error: "Invalid value for 'n'." },
      { status: 400 }
    );
  }

  let pointsSent = 0;

  const pointStream = new Readable({
    objectMode: true,
    read() {
      const chunkSize = 10;
      const sendChunk = () => {
        if (pointsSent >= n) {
          this.push(null);
          return;
        }

        const chunk: { x: number; y: number }[] = [];
        for (let i = 0; i < chunkSize && pointsSent < n; i++) {
          chunk.push({ x: Math.random(), y: Math.random() });
          pointsSent++;
        }

        this.push(JSON.stringify(chunk) + "\n");
      };

      sendChunk();
    },
  });
  const webStream = new Response(pointStream).body;

  if (!webStream) {
    return NextResponse.json(
      { error: "Failed to create stream." },
      { status: 500 }
    );
  }

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/stream+json",
      "Transfer-Encoding": "chunked",
    },
  });
}
