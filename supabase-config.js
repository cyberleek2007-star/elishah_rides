// Elishah Rides V11 — Vercel + Supabase public client configuration
// The public Supabase URL/key are supplied by Vercel through /api/config.
// NEVER expose a Supabase secret/service_role key in browser code.

window.ELISHAH_PAYMENT_PROVIDER = "none";
window.ELISHAH_BUSINESS_EMAIL = "elishahrides@gmail.com";
window.ELISHAH_WHATSAPP = "94773523762";

window.supabaseConfigReady = (async function () {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const config = await response.json();

    if (!response.ok || !config.ok) {
      throw new Error(config.error || "Could not load Supabase configuration.");
    }

    window.SUPABASE_URL = config.supabaseUrl;
    window.SUPABASE_ANON_KEY = config.supabaseAnonKey;
    return true;
  } catch (error) {
    console.error("Elishah Rides Supabase configuration error:", error);
    window.SUPABASE_URL = "";
    window.SUPABASE_ANON_KEY = "";
    return false;
  }
})();
