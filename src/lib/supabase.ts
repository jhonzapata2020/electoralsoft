import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikklyhdpdyyewlcwkwjs.supabase.co';
let rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Protección: Si el usuario configuró por error la clave secreta (sb_secret_...)
// en NEXT_PUBLIC_SUPABASE_ANON_KEY, supabase-js arroja 'Forbidden use of secret API key in browser'
// al ejecutarse en el navegador móvil/desktop. Reemplazamos en el navegador por un token seguro
// ya que todas las operaciones maestras se gestionan por las Server API Routes (/api/users, /api/voters).
if (typeof window !== 'undefined' && rawKey.startsWith('sb_secret_')) {
  rawKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.anon_safe_token';
}

export const supabase = createClient(supabaseUrl, rawKey, {
  auth: {
    persistSession: false,
  },
});
