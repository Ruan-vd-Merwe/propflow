import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, area, province, motivation, categories } = body;

  if (!name?.trim() || !email?.trim() || !area?.trim() || !province || !motivation?.trim()) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const emailNorm = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("connector_interest")
    .select("id")
    .eq("email", emailNorm)
    .single();

  if (existing) {
    return NextResponse.json({
      success: true,
      message: "We already have your interest registered. We will be in touch.",
    });
  }

  const { error } = await supabase.from("connector_interest").insert({
    name: name.trim(),
    email: emailNorm,
    area: area.trim(),
    province,
    motivation: motivation.trim(),
    categories: Array.isArray(categories) ? categories : [],
  });

  if (error) {
    console.error("connector_interest insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
