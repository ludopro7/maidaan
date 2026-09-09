"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeOrder, updateOrderStatus } from "./actions";

export function OrderForm({ listingId, sellerId, price }: { listingId: string; sellerId: string; price: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleClick() {
    setFeedback(null);
    startTransition(async () => {
      const result = await placeOrder(listingId, sellerId, price, quantity);
      if (result.success) {
        setFeedback({ ok: true, message: "Order placed." });
        router.refresh();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: "var(--chalk-300)" }}>Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: 70, padding: "8px 10px", background: "var(--pitch-950)", border: "1px solid var(--pitch-700)", borderRadius: 8, color: "var(--chalk-100)" }}
        />
      </div>
      {feedback && (
        <div style={{ fontSize: 13, marginBottom: 10, color: feedback.ok ? "var(--ok-500)" : "var(--danger-500)" }}>
          {feedback.message}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{ padding: "12px 20px", background: "var(--gold)", color: "#10150f", border: "none", borderRadius: 8, fontWeight: 700, cursor: isPending ? "default" : "pointer", opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? "Placing order…" : `Order · ₹${(price * quantity).toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}

export function OrderStatusButtons({ orderId, listingId, isSeller, isBuyer }: { orderId: string; listingId: string; isSeller: boolean; isBuyer: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(status: "confirmed" | "fulfilled" | "cancelled") {
    startTransition(async () => {
      await updateOrderStatus(orderId, listingId, status);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
      {isSeller && (
        <>
          <button onClick={() => set("confirmed")} disabled={isPending} style={{ fontSize: 11, padding: "6px 10px", background: "var(--ok-500)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>
            Confirm
          </button>
          <button onClick={() => set("fulfilled")} disabled={isPending} style={{ fontSize: 11, padding: "6px 10px", background: "var(--gold)", color: "#10150f", border: "none", borderRadius: 6, fontWeight: 700 }}>
            Mark fulfilled
          </button>
        </>
      )}
      {(isSeller || isBuyer) && (
        <button onClick={() => set("cancelled")} disabled={isPending} style={{ fontSize: 11, padding: "6px 10px", background: "var(--pitch-700)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>
          Cancel
        </button>
      )}
    </div>
  );
}
