export async function onRequestError() {
  // Required export — not used
}

export async function register() {
  const { ensureSuperAdmin } = await import("@/lib/seed");
  await ensureSuperAdmin();
}
