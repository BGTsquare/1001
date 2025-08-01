
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function purchaseBundle(bundleId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to purchase a bundle." };
  }

  const { data: bundle, error: bundleError } = await supabase
    .from("bundles")
    .select("price, books:bundle_books!inner(book_id)")
    .eq("id", bundleId)
    .single();

  if (bundleError) {
    return { success: false, error: "Bundle not found." };
  }

  const { error: purchaseError } = await supabase.from("purchases").insert({
    user_id: user.id,
    item_id: bundleId,
    item_type: "bundle",
    amount: bundle.price,
    status: "pending",
  });

  if (purchaseError) {
    return { success: false, error: "Failed to create purchase record." };
  }

  revalidatePath("/library");

  return { success: true };
}
