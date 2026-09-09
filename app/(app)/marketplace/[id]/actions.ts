"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

export type SaveResult = { success: true } | { success: false; message: string };

export async function placeOrder(listingId: string, sellerId: string, price: number, quantity: number): Promise<SaveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Not signed in." };

  const { error } = await supabase.from("orders").insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: sellerId,
    quantity,
    total_price: price * quantity,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/marketplace/${listingId}`);
  return { success: true };
}

export async function updateOrderStatus(
  orderId: string,
  listingId: string,
  status: "confirmed" | "fulfilled" | "cancelled"
): Promise<SaveResult> {
  const supabase = createClient();

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

  if (error) return { success: false, message: error.message };

  revalidatePath(`/marketplace/${listingId}`);
  return { success: true };
}
