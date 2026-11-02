import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Proyecto Político Janier Lloreda ("SOMOS")
        somos: {
          blue: '#0080FF',       // Azul Somos (Principal)
          cyan: '#00CFFF',       // Azul Secundario (Acentos)
          dark: '#001E72',       // Azul Oscuro (Institucionalidad)
          yellow: '#F4BD21',     // Amarillo (Llamados a la acción / detalles)
          green: '#3FBC24',      // Verde (Naturaleza, territorio)
          navy: '#050a17',       // Fondo profundo
          card: '#0a1226',       // Tarjetas con profundidad
        },
      },
    },
  },
  plugins: [],
};
export default config;
