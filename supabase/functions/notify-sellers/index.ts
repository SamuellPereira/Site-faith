import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const token = Deno.env.get("WHATSAPP_CLOUD_TOKEN");
    const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const sellers = (Deno.env.get("SELLER_WHATSAPP_NUMBERS") || "").split(",").map(x => x.replace(/\D/g, "")).filter(Boolean);
    if (!token || !phoneId || !sellers.length) {
      return new Response(JSON.stringify({ ok: false, configured: false }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const text = `Olá! Nova reserva na Faith Store.\n\nCamiseta: ${body.productName}\nNome: ${body.name}\nWhatsApp do cliente: ${body.customerWhatsapp}${body.note ? `\nObservação: ${body.note}` : ""}`;
    const results = [];
    for (const to of sellers) {
      const r = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
      });
      results.push({ to, ok: r.ok, response: await r.text() });
    }
    return new Response(JSON.stringify({ ok: results.every(x => x.ok), configured: true, results }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
