// =============================================================
//  API de Herramientas — ejemplo de API de pago en Cloudflare Workers
// =============================================================
//
//  Qué hace:
//    1. Recibe pedidos (por ejemplo: "validá este CUIT").
//    2. Revisa que el cliente mande una CLAVE de API válida.
//    3. Cuenta cuántos pedidos hizo hoy y lo frena si superó su plan.
//    4. Responde con el resultado en formato JSON.
//
//  Así se cobra: el plan gratis tiene pocos pedidos por día;
//  quien necesita más, paga el plan Pro y recibe una clave Pro.
// =============================================================

import { paginaInicio } from "./pagina.js";

// ---- Planes: acá definís cuánto puede usar cada cliente por día ----
const PLANES = {
  gratis: { pedidosPorDia: 20, precio: "USD 0" },
  pro: { pedidosPorDia: 10000, precio: "USD 9 / mes" },
};

// Claves de prueba que funcionan siempre (sin configurar nada).
// Las claves reales de clientes se guardan en la base KV "CLAVES".
const CLAVES_DEMO = {
  "demo-gratis": { cliente: "Visitante", plan: "gratis" },
  "demo-pro": { cliente: "Cliente Pro de prueba", plan: "pro" },
};

// ---- Las "herramientas" que vende la API ----
const HERRAMIENTAS = {
  // Valida un CUIT/CUIL argentino con su dígito verificador
  "/api/cuit": (params) => {
    const numero = (params.get("numero") || "").replace(/\D/g, "");
    if (numero.length !== 11) {
      return { error: "El CUIT debe tener 11 números", ejemplo: "20-12345678-6" };
    }
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = pesos.reduce((acc, p, i) => acc + p * Number(numero[i]), 0);
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10) verificador = 9;
    const valido = verificador === Number(numero[10]);
    const tipos = { 20: "Persona (masculino)", 23: "Persona", 24: "Persona", 27: "Persona (femenino)", 30: "Empresa", 33: "Empresa", 34: "Empresa" };
    return {
      cuit: `${numero.slice(0, 2)}-${numero.slice(2, 10)}-${numero.slice(10)}`,
      valido,
      tipo: tipos[numero.slice(0, 2)] || "Desconocido",
    };
  },

  // Calcula IVA: le pasás un precio y te da el neto, el IVA y el total
  "/api/iva": (params) => {
    const precio = Number(params.get("precio"));
    const tasa = Number(params.get("tasa") || 21);
    if (!Number.isFinite(precio) || precio < 0) {
      return { error: "Mandá un precio válido", ejemplo: "/api/iva?precio=1000" };
    }
    const redondear = (n) => Math.round(n * 100) / 100;
    return {
      precio_sin_iva: redondear(precio),
      tasa_iva: `${tasa}%`,
      iva: redondear((precio * tasa) / 100),
      total_con_iva: redondear(precio * (1 + tasa / 100)),
    };
  },

  // Genera una contraseña segura
  "/api/password": (params) => {
    const largo = Math.min(Math.max(Number(params.get("largo")) || 16, 8), 64);
    const letras = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?";
    const azar = crypto.getRandomValues(new Uint32Array(largo));
    const password = Array.from(azar, (n) => letras[n % letras.length]).join("");
    return { password, largo };
  },
};

// ---- Respuesta JSON con permisos para usarla desde cualquier web ----
function json(datos, estado = 200, extras = {}) {
  return new Response(JSON.stringify(datos, null, 2), {
    status: estado,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "x-api-key",
      ...extras,
    },
  });
}

// ---- Busca a quién pertenece una clave ----
async function buscarCliente(clave, env) {
  if (CLAVES_DEMO[clave]) return CLAVES_DEMO[clave];
  if (env.CLAVES) {
    const guardado = await env.CLAVES.get(`clave:${clave}`, "json");
    if (guardado) return guardado;
  }
  return null;
}

// ---- Cuenta el uso del día y dice si todavía puede usar la API ----
async function registrarUso(clave, plan, env) {
  const limite = PLANES[plan].pedidosPorDia;
  if (!env.CLAVES) return { usados: 0, limite, permitido: true };

  const hoy = new Date().toISOString().slice(0, 10); // ej: 2026-11-21
  const contador = `uso:${clave}:${hoy}`;
  const usados = Number(await env.CLAVES.get(contador)) || 0;
  if (usados >= limite) return { usados, limite, permitido: false };

  // Se borra solo a los 2 días para no acumular basura
  await env.CLAVES.put(contador, String(usados + 1), { expirationTtl: 172800 });
  return { usados: usados + 1, limite, permitido: true };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return json(null, 204);

    // Página principal: explica la API y deja probarla
    if (url.pathname === "/") {
      return new Response(paginaInicio(PLANES), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Lista de planes (pública)
    if (url.pathname === "/api/planes") return json(PLANES);

    const herramienta = HERRAMIENTAS[url.pathname];
    if (!herramienta) {
      return json({ error: "Esa dirección no existe", disponibles: Object.keys(HERRAMIENTAS) }, 404);
    }

    // 1) ¿Mandó clave?
    const clave = request.headers.get("x-api-key") || url.searchParams.get("clave");
    if (!clave) {
      return json({ error: "Falta la clave de API. Mandala en el encabezado X-API-Key" }, 401);
    }

    // 2) ¿Es una clave válida?
    const cliente = await buscarCliente(clave, env);
    if (!cliente) return json({ error: "Clave inválida" }, 401);

    // 3) ¿Le quedan pedidos hoy?
    const uso = await registrarUso(clave, cliente.plan, env);
    const encabezadosUso = {
      "x-plan": cliente.plan,
      "x-pedidos-usados": String(uso.usados),
      "x-pedidos-limite": String(uso.limite),
    };
    if (!uso.permitido) {
      return json(
        {
          error: `Llegaste al límite de ${uso.limite} pedidos por día del plan ${cliente.plan}`,
          solucion: `Pasate al plan Pro (${PLANES.pro.precio}) para tener ${PLANES.pro.pedidosPorDia} por día`,
        },
        429,
        encabezadosUso,
      );
    }

    // 4) Hacer el trabajo y responder
    const resultado = herramienta(url.searchParams);
    return json(
      { ...resultado, _uso: { plan: cliente.plan, usados_hoy: uso.usados, limite_diario: uso.limite } },
      resultado.error ? 400 : 200,
      encabezadosUso,
    );
  },
};
