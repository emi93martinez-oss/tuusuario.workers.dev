# API de Herramientas

Ejemplo de **API de pago** sobre Cloudflare Workers. Ofrece tres servicios:

| Dirección | Qué hace | Ejemplo |
|---|---|---|
| `/api/cuit` | Valida un CUIT/CUIL | `/api/cuit?numero=20-12345678-6` |
| `/api/iva` | Calcula IVA y total | `/api/iva?precio=1000` |
| `/api/password` | Genera una contraseña segura | `/api/password?largo=20` |

Cada pedido necesita una **clave** (encabezado `X-API-Key`). La clave dice a qué plan pertenece el cliente:

- **Gratis:** 20 pedidos por día
- **Pro:** 10.000 pedidos por día por USD 9 al mes

Los planes se cambian en `src/index.js`, en la sección `PLANES`.

## Probarla en tu computadora

```bash
npm install
npm run dev
```

Abrí http://localhost:8787 y usá las claves de prueba `demo-gratis` o `demo-pro`.

## Publicarla en internet (gratis)

1. Creá una cuenta en https://dash.cloudflare.com
2. `npx wrangler login`
3. `npx wrangler kv namespace create CLAVES` y pegá el `id` que te devuelve en `wrangler.toml`
4. `npm run deploy`

Queda publicada en `https://api-herramientas.TU-USUARIO.workers.dev`.

## Dar de alta un cliente que pagó

```bash
npx wrangler kv key put --binding CLAVES --remote "clave:CLAVE-SECRETA-DEL-CLIENTE" '{"cliente":"Juan SRL","plan":"pro"}'
```

Le mandás `CLAVE-SECRETA-DEL-CLIENTE` al cliente y ya puede usar la API con el plan Pro.

## Próximos pasos para cobrar automáticamente

- Botón de pago con Mercado Pago o Stripe que cree la clave solo al confirmarse el pago
- Panel donde el cliente vea su consumo
- Publicarla en RapidAPI para conseguir clientes
