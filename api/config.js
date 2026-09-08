module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");

  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    return res.status(500).json({
      ok: false,
      error: "Supabase environment variables are not configured."
    });
  }

  return res.status(200).json({
    ok: true,
    supabaseUrl: url,
    supabaseAnonKey: key
  });
};
