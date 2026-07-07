import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { JobUrgency } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/tenant-queries/:id/convert — authenticated (landlord only)
 * Converts a tenant_queries row into a maintenance_jobs row, and marks the
 * source query in_progress so it drops out of the triage inbox. RLS on
 * tenant_queries (queries_select_own) already scopes the lookup to this
 * landlord's own tenants, so a 404 covers both "not found" and "not yours".
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const urgency: JobUrgency = ["urgent", "normal", "planned"].includes(
      body.urgency,
    )
      ? body.urgency
      : "normal";
    const componentId =
      typeof body.component_id === "string" && body.component_id
        ? body.component_id
        : null;

    if (!title || !description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 },
      );
    }

    const { data: query, error: queryError } = await supabase
      .from("tenant_queries")
      .select("id, status, tenants!inner(property_id)")
      .eq("id", params.id)
      .single();

    if (queryError || !query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }
    if (query.status !== "open") {
      return NextResponse.json(
        { error: "This query has already been actioned" },
        { status: 409 },
      );
    }

    const propertyId = (query.tenants as unknown as { property_id: string })
      .property_id;

    const { data: job, error: jobError } = await supabase
      .from("maintenance_jobs")
      .insert({
        property_id: propertyId,
        tenant_query_id: query.id,
        component_id: componentId,
        title,
        final_description: description,
        urgency,
        status: "draft",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message ?? "Failed to create job" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("tenant_queries")
      .update({ status: "in_progress" })
      .eq("id", query.id);
    if (updateError) {
      console.error("[tenant-queries convert] status update failed:", updateError.message);
    }

    return NextResponse.json({ success: true, job_id: job.id }, { status: 201 });
  } catch (err) {
    console.error("[tenant-queries convert]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
