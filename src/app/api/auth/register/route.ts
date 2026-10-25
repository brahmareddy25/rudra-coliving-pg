import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json(
    {
      error:
        "Public self-registration is disabled. Please contact property administration to allocate a bed and receive your login credentials.",
    },
    { status: 403 }
  );
}
