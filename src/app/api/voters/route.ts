import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikklyhdpdyyewlcwkwjs.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// GET: Consultar votantes o validar existencia de cédula
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doc = searchParams.get('doc');
    const juntaId = searchParams.get('junta_id');

    if (doc) {
      const endpoint = `${SUPABASE_URL}/rest/v1/votantes?documento=eq.${encodeURIComponent(doc)}&select=id,documento,nombre_completo&limit=1`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': SECRET_KEY,
          'Authorization': `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'Error verificando documento' }, { status: 500 });
      }

      const data = await res.json();
      return NextResponse.json(data.length > 0 ? data[0] : null);
    }

    let endpoint = `${SUPABASE_URL}/rest/v1/votantes?select=*&order=created_at.desc`;
    if (juntaId) {
      endpoint += `&junta_directiva_id=eq.${encodeURIComponent(juntaId)}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener votantes' }, { status: 500 });
  }
}

// POST: Registrar nuevo votante o sincronizar lote offline
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No se enviaron datos para registrar.' }, { status: 400 });
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/votantes?on_conflict=documento`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(items),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('23505') || errText.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Esta cédula ya está registrada en el censo electoral.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(body) ? data : (data[0] || body));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al guardar votante' }, { status: 500 });
  }
}
