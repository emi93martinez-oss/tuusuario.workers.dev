// Página web que ven los clientes al entrar a la API:
// explica qué es, muestra los planes y deja probarla en vivo.

export function paginaInicio(planes) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API de Herramientas</title>
<style>
  :root { --fondo:#f7f7f5; --tarjeta:#fff; --texto:#1d1d1b; --suave:#6b6b66; --borde:#e3e3de; --acento:#e8590c; --codigo:#1e1e1e; }
  @media (prefers-color-scheme: dark) { :root { --fondo:#161615; --tarjeta:#21211f; --texto:#ededea; --suave:#a3a39d; --borde:#34342f; --acento:#ff8a3d; --codigo:#0d0d0c; } }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,sans-serif; background:var(--fondo); color:var(--texto); line-height:1.55; }
  main { max-width:880px; margin:0 auto; padding:40px 16px 64px; }
  h1 { font-size:clamp(1.8rem,5vw,2.6rem); margin:0 0 8px; letter-spacing:-0.02em; }
  h2 { font-size:1.25rem; margin:44px 0 14px; }
  .sub { color:var(--suave); font-size:1.08rem; margin:0; }
  .grilla { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
  .tarjeta { background:var(--tarjeta); border:1px solid var(--borde); border-radius:12px; padding:18px; }
  .tarjeta h3 { margin:0 0 6px; font-size:1rem; }
  .tarjeta p { margin:0; color:var(--suave); font-size:.94rem; }
  .paso { font-weight:700; color:var(--acento); font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; }
  .precio { font-size:1.8rem; font-weight:700; margin:6px 0; }
  .destacado { border:2px solid var(--acento); }
  label { display:block; font-size:.85rem; color:var(--suave); margin:12px 0 4px; }
  select, input { width:100%; padding:10px 12px; font-size:1rem; border-radius:8px; border:1px solid var(--borde); background:var(--fondo); color:var(--texto); }
  button { margin-top:16px; padding:11px 22px; font-size:1rem; font-weight:600; border:0; border-radius:8px; background:var(--acento); color:#fff; cursor:pointer; }
  pre { background:var(--codigo); color:#e6e6e6; padding:14px; border-radius:8px; overflow-x:auto; font-size:.86rem; margin:12px 0 0; white-space:pre-wrap; word-break:break-word; }
  code { font-family:ui-monospace,Menlo,monospace; }
  .fila { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
  @media (max-width:560px) { .fila { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
  <h1>API de Herramientas</h1>
  <p class="sub">Validá CUITs, calculá IVA y generá contraseñas desde tu propio sistema. Gratis para probar; pagás solo si la usás mucho.</p>

  <h2>¿Cómo funciona?</h2>
  <div class="grilla">
    <div class="tarjeta"><div class="paso">Paso 1</div><h3>El cliente pide algo</h3><p>Su sistema le manda a la API un pedido, por ejemplo "¿este CUIT es válido?".</p></div>
    <div class="tarjeta"><div class="paso">Paso 2</div><h3>La API revisa la clave</h3><p>Cada cliente tiene una clave secreta. Así se sabe quién es y qué plan pagó.</p></div>
    <div class="tarjeta"><div class="paso">Paso 3</div><h3>Cuenta el uso</h3><p>Si superó los pedidos de su plan, se le pide que pase a uno pago.</p></div>
    <div class="tarjeta"><div class="paso">Paso 4</div><h3>Responde</h3><p>Devuelve el resultado al instante, desde servidores de todo el mundo.</p></div>
  </div>

  <h2>Planes</h2>
  <div class="grilla">
    <div class="tarjeta"><h3>Gratis</h3><div class="precio">${planes.gratis.precio}</div><p>${planes.gratis.pedidosPorDia} pedidos por día. Ideal para probar.</p></div>
    <div class="tarjeta destacado"><h3>Pro</h3><div class="precio">${planes.pro.precio}</div><p>${planes.pro.pedidosPorDia.toLocaleString("es-AR")} pedidos por día. Para negocios y sistemas en producción.</p></div>
  </div>

  <h2>Probala ahora</h2>
  <div class="tarjeta">
    <div class="fila">
      <div>
        <label for="herr">Herramienta</label>
        <select id="herr">
          <option value="cuit">Validar CUIT</option>
          <option value="iva">Calcular IVA</option>
          <option value="password">Generar contraseña</option>
        </select>
      </div>
      <div>
        <label for="clave">Clave de API</label>
        <select id="clave">
          <option value="demo-gratis">demo-gratis (plan Gratis)</option>
          <option value="demo-pro">demo-pro (plan Pro)</option>
          <option value="clave-falsa">clave-falsa (inválida)</option>
        </select>
      </div>
    </div>
    <label for="valor" id="etiqueta">Número de CUIT</label>
    <input id="valor" value="20-12345678-6">
    <button id="probar">Enviar pedido</button>
    <pre id="pedido"></pre>
    <pre id="respuesta">La respuesta va a aparecer acá.</pre>
  </div>

  <h2>Para programadores</h2>
  <div class="tarjeta">
    <p>Se usa con cualquier lenguaje. Ejemplo desde la terminal:</p>
    <pre><code>curl -H "X-API-Key: TU_CLAVE" "${"$"}{location.origin}/api/iva?precio=1000"</code></pre>
  </div>
</main>
<script>
  const config = {
    cuit: { etiqueta: "Número de CUIT", valor: "20-12345678-6", param: "numero" },
    iva: { etiqueta: "Precio sin IVA", valor: "1000", param: "precio" },
    password: { etiqueta: "Largo de la contraseña", valor: "16", param: "largo" },
  };
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll("pre code").forEach((c) => c.textContent = c.textContent.replace("${"$"}{location.origin}", location.origin));
  $("herr").onchange = () => { const c = config[$("herr").value]; $("etiqueta").textContent = c.etiqueta; $("valor").value = c.valor; };
  $("probar").onclick = async () => {
    const c = config[$("herr").value];
    const ruta = "/api/" + $("herr").value + "?" + c.param + "=" + encodeURIComponent($("valor").value);
    $("pedido").textContent = "Pedido:  GET " + ruta + "\\nClave:   " + $("clave").value;
    $("respuesta").textContent = "Enviando…";
    const r = await fetch(ruta, { headers: { "X-API-Key": $("clave").value } });
    $("respuesta").textContent = "Respuesta (" + r.status + "):\\n" + await r.text();
  };
</script>
</body>
</html>`;
}
