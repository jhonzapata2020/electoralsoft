import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const { documento, password } = await req.json();

    const docClean = (documento || '').toString().trim();
    const passClean = (password || '').toString().trim();

    if (!docClean || !passClean) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu cédula y tu contraseña.' },
        { status: 400 }
      );
    }

    // Consultar con clave de servicio maestra para saltar RLS
    const endpoint = `${SUPABASE_URL}/rest/v1/usuarios_sistema?documento=eq.${encodeURIComponent(docClean)}&is_active=eq.true&select=*`;
    
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
      return NextResponse.json(
        { error: 'Error de conexión con la base de datos.' },
        { status: 500 }
      );
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Cédula no autorizada en el sistema. Contacta al coordinador.' },
        { status: 404 }
      );
    }

    const user = data[0];

    // Verificar contraseña
    let storedPassword = user.documento;
    if (user.correo) {
      if (user.correo.startsWith('pwd:')) {
        storedPassword = user.correo.replace('pwd:', '').trim();
      } else if (user.correo.includes(':::')) {
        storedPassword = user.correo.split(':::')[1].trim();
      }
    }

    if (passClean !== storedPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    console.error('Login API error', err);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
