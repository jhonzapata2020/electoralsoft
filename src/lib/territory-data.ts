import { JuntaDirectiva, Barrio, Corregimiento, Vereda } from '../types';

// Las 20 Juntas Directivas Oficiales de la Campaña de Janier Lloreda
export const OFFICIAL_JUNTAS: JuntaDirectiva[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  numero: i + 1,
  nombre: `Junta Directiva ${i + 1}`,
}));

// Los 40 Barrios / Equipos Operativos distribuidos equitativamente (2 por Junta Directiva)
export const OFFICIAL_BARRIOS: Barrio[] = [
  // Junta Directiva 1
  { id: 85, nombre: 'Buenos Aires', junta_directiva_id: 1 },
  { id: 86, nombre: 'Flores', junta_directiva_id: 1 },
  // Junta Directiva 2
  { id: 87, nombre: 'Gaitán', junta_directiva_id: 2 },
  { id: 88, nombre: 'Malvinas', junta_directiva_id: 2 },
  // Junta Directiva 3
  { id: 89, nombre: 'Pescador 1', junta_directiva_id: 3 },
  { id: 90, nombre: 'Pescador 2', junta_directiva_id: 3 },
  // Junta Directiva 4
  { id: 91, nombre: 'Manuela Beltrán', junta_directiva_id: 4 },
  { id: 92, nombre: 'Santa Fe la playa', junta_directiva_id: 4 },
  // Junta Directiva 5
  { id: 93, nombre: 'Floresta', junta_directiva_id: 5 },
  { id: 94, nombre: 'Jesús Mora', junta_directiva_id: 5 },
  // Junta Directiva 6
  { id: 95, nombre: 'Julia Orozco', junta_directiva_id: 6 },
  { id: 96, nombre: 'Hoover Quintero', junta_directiva_id: 6 },
  // Junta Directiva 7
  { id: 97, nombre: 'Instituto', junta_directiva_id: 7 },
  { id: 98, nombre: 'Monterrey 2', junta_directiva_id: 7 },
  // Junta Directiva 8
  { id: 99, nombre: 'Manizales', junta_directiva_id: 8 },
  { id: 100, nombre: 'San Francisco', junta_directiva_id: 8 },
  // Junta Directiva 9
  { id: 101, nombre: 'El tesoro', junta_directiva_id: 9 },
  { id: 102, nombre: 'La lucila', junta_directiva_id: 9 },
  // Junta Directiva 10
  { id: 103, nombre: 'Baltazar', junta_directiva_id: 10 },
  { id: 104, nombre: 'Delicia', junta_directiva_id: 10 },
  // Junta Directiva 11
  { id: 105, nombre: 'Monterrey 1', junta_directiva_id: 11 },
  { id: 106, nombre: 'Veranillo', junta_directiva_id: 11 },
  // Junta Directiva 12
  { id: 107, nombre: 'Juan XXIII', junta_directiva_id: 12 },
  { id: 108, nombre: 'Centro', junta_directiva_id: 12 },
  // Junta Directiva 13
  { id: 109, nombre: 'La ciudadela', junta_directiva_id: 13 },
  { id: 110, nombre: 'Manglares', junta_directiva_id: 13 },
  // Junta Directiva 14
  { id: 111, nombre: 'San Martín', junta_directiva_id: 14 },
  { id: 112, nombre: 'Bosque', junta_directiva_id: 14 },
  // Junta Directiva 15
  { id: 113, nombre: 'Brisas del Mar', junta_directiva_id: 15 },
  { id: 114, nombre: 'Esfuerzo', junta_directiva_id: 15 },
  // Junta Directiva 16
  { id: 115, nombre: '16 de enero', junta_directiva_id: 16 },
  { id: 116, nombre: 'Muelle', junta_directiva_id: 16 },
  // Junta Directiva 17
  { id: 117, nombre: 'Obrero', junta_directiva_id: 17 },
  { id: 118, nombre: '23 de enero', junta_directiva_id: 17 },
  // Junta Directiva 18
  { id: 119, nombre: 'Casanova', junta_directiva_id: 18 },
  { id: 120, nombre: 'Las Garzas', junta_directiva_id: 18 },
  // Junta Directiva 19
  { id: 121, nombre: 'El 1 o 7 de agosto', junta_directiva_id: 19 },
  { id: 122, nombre: 'Porvenir', junta_directiva_id: 19 },
  // Junta Directiva 20
  { id: 123, nombre: 'Tesorito', junta_directiva_id: 20 },
  { id: 124, nombre: 'Villa María', junta_directiva_id: 20 },
];

export const OFFICIAL_CORREGIMIENTOS: Corregimiento[] = [
  { id: 1, nombre: 'Currulao' },
  { id: 2, nombre: 'El Tres' },
  { id: 3, nombre: 'Nueva Colonia' },
  { id: 4, nombre: 'Pueblo Bello' },
  { id: 5, nombre: 'Río Grande' },
  { id: 6, nombre: 'San José de Mulatos' },
  { id: 7, nombre: 'Tierradentro' },
  { id: 8, nombre: 'Boca de Atrato' },
];

export const OFFICIAL_VEREDAS: Vereda[] = [
  { id: 1, nombre: 'Vereda Central Currulao', corregimiento_id: 1 },
  { id: 2, nombre: 'La Piña', corregimiento_id: 1 },
  { id: 3, nombre: 'El Carmelo', corregimiento_id: 1 },
  { id: 4, nombre: 'San José', corregimiento_id: 1 },
  { id: 5, nombre: 'El Tres Centro', corregimiento_id: 2 },
  { id: 6, nombre: 'La Esperanza', corregimiento_id: 2 },
  { id: 7, nombre: 'Puente Negro', corregimiento_id: 2 },
  { id: 8, nombre: 'Buenos Aires Rural', corregimiento_id: 2 },
  { id: 9, nombre: 'Nueva Colonia Urbana', corregimiento_id: 3 },
  { id: 10, nombre: 'Caracolí', corregimiento_id: 3 },
  { id: 11, nombre: 'San Juan', corregimiento_id: 3 },
  { id: 12, nombre: 'La Arenera', corregimiento_id: 3 },
  { id: 13, nombre: 'Pueblo Bello Cabecera', corregimiento_id: 4 },
  { id: 14, nombre: 'La Ceiba', corregimiento_id: 4 },
  { id: 15, nombre: 'Guayabal', corregimiento_id: 4 },
  { id: 16, nombre: 'El Totumo', corregimiento_id: 4 },
  { id: 17, nombre: 'Río Grande Centro', corregimiento_id: 5 },
  { id: 18, nombre: 'El Diamante', corregimiento_id: 5 },
  { id: 19, nombre: 'Las Palmas', corregimiento_id: 5 },
  { id: 20, nombre: 'Santa Rosa', corregimiento_id: 5 },
  { id: 21, nombre: 'Mulatos Cabecera', corregimiento_id: 6 },
  { id: 22, nombre: 'La Balsita', corregimiento_id: 6 },
  { id: 23, nombre: 'Arenas Altas', corregimiento_id: 6 },
  { id: 24, nombre: 'El Tomate', corregimiento_id: 6 },
  { id: 25, nombre: 'Tierradentro Centro', corregimiento_id: 7 },
  { id: 26, nombre: 'Zungo', corregimiento_id: 7 },
  { id: 27, nombre: 'Alto Mulatos', corregimiento_id: 7 },
  { id: 28, nombre: 'La Cristalina', corregimiento_id: 7 },
  { id: 29, nombre: 'Boca de Atrato Centro', corregimiento_id: 8 },
  { id: 30, nombre: 'León Abajo', corregimiento_id: 8 },
  { id: 31, nombre: 'Suriquí', corregimiento_id: 8 },
  { id: 32, nombre: 'Tumaradó', corregimiento_id: 8 },
];
