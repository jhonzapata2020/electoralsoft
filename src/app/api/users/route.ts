import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikklyhdpdyyewlcwkwjs.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// GET: Obtener usuarios del sistema (todos o filtrados por junta)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const juntaId = searchParams.get('junta_id');

    let endpoint = `${SUPABASE_URL}/rest/v1/usuarios_sistema?select=*&order=created_at.desc`;
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
    return NextResponse.json({ error: err.message || 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST: Crear nuevo usuario del sistema (Admin, Secretaria, Líder)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      documento,
      nombre_completo,
      telefono,
      correo,
      rol,
      zona,
      junta_directiva_id,
      lider_inmediato_id,
      meta_minima,
      is_active,
      barrio_id,
    } = body;

    const docClean = (documento || '').toString().trim();
    const nombreClean = (nombre_completo || '').toString().trim();
    const telClean = (telefono || '').toString().trim();

    if (!docClean || !nombreClean || !telClean) {
      return NextResponse.json(
        { error: 'Documento, nombre y teléfono son obligatorios.' },
        { status: 400 }
      );
    }

    const payload = {
      documento: docClean,
      nombre_completo: nombreClean,
      telefono: telClean,
      correo: correo || `pwd:${docClean}`,
      rol: rol || 'lider_equipo_operativo',
      zona: zona || 'urbano',
      junta_directiva_id: junta_directiva_id ? Number(junta_directiva_id) : null,
      barrio_id: barrio_id ? Number(barrio_id) : null,
      lider_inmediato_id: lider_inmediato_id || null,
      meta_minima: meta_minima || (rol === 'secretaria' ? 500 : 1000),
      is_active: is_active !== undefined ? is_active : true,
    };

    const endpoint = `${SUPABASE_URL}/rest/v1/usuarios_sistema`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify([payload]),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (errText.includes('23505') || errText.includes('duplicate') || errText.includes('unique')) {
        return NextResponse.json(
          { error: 'Esta cédula ya está registrada como usuario en el sistema.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    const createdUser = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(createdUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al crear usuario' }, { status: 500 });
  }
}

// PATCH: Dar de alta o baja a un usuario (is_active)
export async function PATCH(req: Request) {
  try {
    const { id, is_active } = await req.json();

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'ID y estado son requeridos.' }, { status: 400 });
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/usuarios_sistema?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ is_active }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}
