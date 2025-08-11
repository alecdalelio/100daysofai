/**
 * POST /ensure_profile
 * Ensures a profile row exists for the authenticated user.
 * Returns the full profile row.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject() as unknown as Env
    const authHeader = req.headers.get('authorization') ?? ''

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Check for existing profile
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = No rows found for single() - we tolerate this
      return new Response(JSON.stringify({ error: selectError.message }), { status: 500, headers: corsHeaders })
    }

    if (!existing) {
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id })
        .select('*')
        .single()
      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders })
      }
      return new Response(JSON.stringify({ profile: inserted }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ profile: existing }), { headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders })
  }
})


