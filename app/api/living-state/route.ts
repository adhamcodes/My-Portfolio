import { getCurrentPublicLivingState } from "@/server/living-state";

export async function GET() {
  const state = await getCurrentPublicLivingState();
  return Response.json(state, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
