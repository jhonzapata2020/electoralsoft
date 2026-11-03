/**
 * Utilidades de formateo para el sistema electoral SOMOS NUEVAS ACCIONES
 */

/**
 * Convierte cualquier texto o nombre a formato Tipo Título (Title Case):
 * Cada palabra con la primera letra en mayúscula y las demás en minúsculas.
 * Ejemplos:
 * "jhonier zapata" -> "Jhonier Zapata"
 * "CARLOS ALBERTO PEREZ GOMEZ" -> "Carlos Alberto Perez Gomez"
 * "yurany perez villalobos" -> "Yurany Perez Villalobos"
 * Limpia espacios dobles accidentales.
 */
export function formatTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
