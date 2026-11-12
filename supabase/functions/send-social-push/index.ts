import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  try {
    const authorization = request.headers.get('Authorization');
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!authorization || !url || !anonKey || !serviceKey) {
      return respond({ error: 'Push service is not configured' }, 500);
    }

    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user) return respond({ error: 'Unauthorized' }, 401);

    const input = await request.json();
    const type = input?.type;
    const matchId = input?.matchId;
    const messageId = input?.messageId;
    if (!['match', 'message'].includes(type) || typeof matchId !== 'string') {
      return respond({ error: 'Invalid payload' }, 400);
    }
    if (type === 'message' && typeof messageId !== 'string') {
      return respond({ error: 'Invalid payload' }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: match, error: matchError } = await admin
      .from('matches')
      .select('id,user_a,user_b')
      .eq('id', matchId)
      .maybeSingle();
    if (matchError || !match || ![match.user_a, match.user_b].includes(authData.user.id)) {
      return respond({ error: 'Conversation unavailable' }, 403);
    }

    let recipientIds = [match.user_a, match.user_b];
    if (type === 'message') {
      const { data: message, error: messageError } = await admin
        .from('messages')
        .select('id,match_id,sender_id')
        .eq('id', messageId)
        .eq('match_id', matchId)
        .maybeSingle();
      if (messageError || !message || message.sender_id !== authData.user.id) {
        return respond({ error: 'Message unavailable' }, 403);
      }
      recipientIds = [message.sender_id === match.user_a ? match.user_b : match.user_a];
    }

    const { data: devices, error: devicesError } = await admin
      .from('device_push_tokens')
      .select('id,token,user_id')
      .in('user_id', recipientIds)
      .eq('provider', 'expo')
      .is('disabled_at', null);
    if (devicesError) return respond({ error: 'Push delivery unavailable' }, 500);
    if (!devices?.length) return respond({ accepted: 0 }, 200);

    const payloads = devices.map((device) => ({
      to: device.token,
      sound: 'default',
      title: type === 'match' ? 'C’est un match !' : 'Nouveau message TÉCAP',
      body:
        type === 'match'
          ? 'Vous vous plaisez. Ouvre TÉCAP pour lancer la conversation.'
          : 'Un nouveau message t’attend dans ta conversation.',
      data: { route: 'Conversation', matchId },
      priority: 'high',
      channelId: 'tecap-default',
    }));
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payloads),
    });
    if (!expoResponse.ok) return respond({ error: 'Push provider unavailable' }, 502);

    const result = await expoResponse.json();
    const tickets = Array.isArray(result?.data) ? result.data : [result?.data];
    const staleIds = tickets.flatMap((ticket: any, index: number) =>
      ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered'
        ? [devices[index]?.id]
        : [],
    );
    if (staleIds.length) {
      await admin
        .from('device_push_tokens')
        .update({ disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in('id', staleIds);
    }
    return respond({ accepted: tickets.filter((ticket: any) => ticket?.status === 'ok').length });
  } catch {
    return respond({ error: 'Push delivery unavailable' }, 500);
  }
});

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
