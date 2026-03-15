import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) throw new Error("Razorpay secret not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, amount } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const isValid = await verifySignature(RAZORPAY_KEY_SECRET, body, razorpay_signature);

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance, total_deposited")
      .eq("user_id", user_id)
      .single();

    if (!wallet) throw new Error("Wallet not found");

    await supabase
      .from("wallets")
      .update({
        balance: wallet.balance + amount,
        total_deposited: wallet.total_deposited + amount,
      })
      .eq("user_id", user_id);

    await supabase.from("transactions").insert({
      user_id,
      type: "deposit",
      amount,
      status: "completed",
      payment_method: "Razorpay",
      razorpay_order_id,
      razorpay_payment_id,
      description: "Wallet deposit via Razorpay",
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
