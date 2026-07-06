import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenant_id");
  const propertyId = searchParams.get("property_id");

  let query = supabase
    .from("rent_obligations")
    .select(`*, tenants ( full_name ), properties ( name, address )`)
    .eq("landlord_id", user.id)
    .order("due_date", { ascending: false });

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ obligations: data });
}
