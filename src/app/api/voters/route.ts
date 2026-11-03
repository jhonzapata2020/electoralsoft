import { NextResponse } from 'next/server';
import { formatTitleCase } from '@/lib/formatters';

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
    const mapped = (data || []).map((v: any) => {
      let profesion = null;
      let correoClean = v.correo;
      if (v.correo && v.correo.includes('prof:')) {
        const match = v.correo.match(/prof:([^|]+)/);
        if (match) {
          profesion = formatTitleCase(match[1]);
          correoClean = v.correo.replace(/prof:[^|]+(\| )?/, '').trim() || null;
        }
      } else if (v.correo && !v.correo.includes('@')) {
        profesion = formatTitleCase(v.correo);
        correoClean = null;
      }
      return {
        ...v,
        nombre_completo: formatTitleCase(v.nombre_completo),
        profesion,
        correo: correoClean,
      };
    });
    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener votantes' }, { status: 500 });
  }
}

// POST: Registrar nuevo votante o sincronizar lote offline
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawItems = Array.isArray(body) ? body : [body];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'No se enviaron datos para registrar.' }, { status: 400 });
    }

    // Formatear nombres y profesión en Title Case y serializar profesión en correo
    const items = rawItems.map((item: any) => {
      const { profesion, nombre_completo, ...rest } = item;
      const formattedName = formatTitleCase(nombre_completo);
      const formattedProf = profesion && profesion.trim() ? formatTitleCase(profesion) : null;
      let correoFinal = rest.correo || '';
      if (formattedProf) {
        correoFinal = correoFinal ? `prof:${formattedProf} | ${correoFinal}` : `prof:${formattedProf}`;
      }
      return {
        ...rest,
        nombre_completo: formattedName,
        correo: correoFinal || null,
      };
    });

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

// PATCH: Actualizar datos de un votante existente (ej. corregir teléfono, nombre, profesión, territorio)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      documento,
      nombre_completo,
      telefono,
      estudio_realizado,
      profesion,
      correo,
      barrio_id,
      vereda_id,
      junta_directiva_id,
      zona,
      barrio_nombre,
      vereda_nombre,
    } = body;

    if (!id && !documento) {
      return NextResponse.json({ error: 'Se requiere ID o Documento para actualizar.' }, { status: 400 });
    }

    const formattedName = nombre_completo ? formatTitleCase(nombre_completo) : undefined;
    const formattedProf = profesion && profesion.trim() ? formatTitleCase(profesion) : null;
    let correoFinal = correo || '';
    if (formattedProf) {
      correoFinal = correoFinal ? `prof:${formattedProf} | ${correoFinal}` : `prof:${formattedProf}`;
    }

    const updatePayload: any = {};
    if (formattedName !== undefined) updatePayload.nombre_completo = formattedName;
    if (telefono !== undefined) updatePayload.telefono = telefono.trim();
    if (estudio_realizado !== undefined) updatePayload.estudio_realizado = estudio_realizado;
    if (profesion !== undefined || correo !== undefined) updatePayload.correo = correoFinal || null;
    if (barrio_id !== undefined) updatePayload.barrio_id = barrio_id || null;
    if (vereda_id !== undefined) updatePayload.vereda_id = vereda_id || null;
    if (junta_directiva_id !== undefined) updatePayload.junta_directiva_id = junta_directiva_id || null;
    if (zona !== undefined) updatePayload.zona = zona;

    const filterParam = id ? `id=eq.${encodeURIComponent(id)}` : `documento=eq.${encodeURIComponent(documento)}`;
    const endpoint = `${SUPABASE_URL}/rest/v1/votantes?${filterParam}`;

    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    const rawUpdated = data && data.length > 0 ? data[0] : null;

    if (!rawUpdated) {
      return NextResponse.json({ error: 'No se encontró el registro para actualizar.' }, { status: 404 });
    }

    const updatedVoter = {
      ...rawUpdated,
      nombre_completo: formatTitleCase(rawUpdated.nombre_completo),
      profesion: formattedProf,
      barrio_nombre: barrio_nombre || rawUpdated.barrio_nombre,
      vereda_nombre: vereda_nombre || rawUpdated.vereda_nombre,
    };

    return NextResponse.json({
      success: true,
      message: 'Votante actualizado correctamente',
      voter: updatedVoter,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar votante' }, { status: 500 });
  }
}
