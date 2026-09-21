import { resolve } from 'node:path';

function numero(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && valor !== '' ? n : porDefecto;
}

export function configuracion() {
  const claveStripe = process.env.STRIPE_SECRET_KEY ?? '';
  const claveGemini = process.env.GEMINI_API_KEY ?? '';
  const maxMb = numero(process.env.MAX_UPLOAD_MB, 5);

  return {
    esProduccion: process.env.NODE_ENV === 'production',
    puerto: numero(process.env.PORT, 3000),

    db: {
      url: process.env.DATABASE_URL as string,
    },

    jwt: {
      secreto: process.env.JWT_SECRET ?? '',
      expiraEnMinutos: numero(process.env.JWT_EXPIRES_MINUTES, 60),
    },

    uploads: {
      carpeta: resolve(process.env.UPLOAD_DIR || 'uploads'),
      maxBytes: maxMb * 1024 * 1024,
    },

    stripe: {
      habilitado: claveStripe.length > 0,
      modoPrueba: claveStripe.startsWith('sk_test_'),
      secretKey: claveStripe,
      moneda: (process.env.STRIPE_MONEDA || 'usd').toLowerCase(),
      tasaBob: numero(process.env.STRIPE_TASA_BOB, 6.96),
      minimoCentavos: numero(process.env.STRIPE_MINIMO_CENTAVOS, 50),
    },

    gemini: {
      habilitado:
        claveGemini.length > 0 && process.env.IA_HABILITADA !== 'false',
      apiKey: claveGemini,
      modelo: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      consultasPorHora: numero(process.env.IA_CONSULTAS_POR_HORA, 30),
    },

    reservas: {
      horasVigencia: numero(process.env.RESERVA_HORAS_VIGENCIA, 24),
    },
  };
}

export type Configuracion = ReturnType<typeof configuracion>;
