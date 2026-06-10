import { createServerFn } from "@tanstack/react-start";

export const getDemoSession = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "demo@loop.app";
  const password = "demodemo";

  let session = null;

  // Attempt sign-in first
  const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInErr && signInData.session) {
    session = signInData.session;
  }

  // If sign-in failed because user doesn't exist OR password was changed, recreate the demo user
  if (!session) {
    // First try to find and delete the existing user just in case the password was changed
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    if (existingUser) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Demo User" },
    });

    if (createErr) {
      throw createErr;
    }

    const userId = createData.user.id;

    // Ensure profile row exists (in case trigger isn't active)
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        name: "Demo User",
        role: "Product Designer",
        bio: "Exploring the community.",
      },
      { onConflict: "id" },
    );

    // Sign in after creation
    const { data: d2, error: e2 } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });
    if (e2) throw e2;
    session = d2.session;
  }

  if (!session) throw new Error("Could not create demo session");

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
});
