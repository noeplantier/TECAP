import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await supabase.rpc('expire_evening_statuses');
  if (error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true, expired: data }));
});
