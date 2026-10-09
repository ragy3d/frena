# ✋ Frená

Una pausa antes de comprar. Cada vez que la abrís —a mano, o sola cuando
configurás que salte al abrir Mercado Pago— te hace esperar unos segundos y
te pregunta si realmente querés lo que ibas a comprar. Si decís que no,
queda anotado cuánto te ahorraste.

## Dónde se usa

Publicado en **https://ragy3d.github.io/frena/**

Para levantarlo en tu máquina:

```bash
python -m http.server 5800 --directory frena
```

Después entrá a **http://localhost:5800**.

## Instalarlo en el celular

Es una PWA: se instala como cualquier app, con su ícono, a pantalla completa
y sin internet.

- **Android (Chrome):** aparece el botón **Instalar** arriba a la derecha.
  Si no, menú ⋮ → «Instalar aplicación».
- **iPhone (Safari):** compartir → «Agregar a inicio».

Abrilo desde Chrome o Safari, no desde el navegador interno de WhatsApp o
Instagram — ahí no aparece la opción de instalar.

## Cómo funciona

1. Entrás a la app (a mano o porque saltó sola).
2. Te muestra una pregunta distinta cada vez y una cuenta regresiva de unos
   segundos — el tiempo justo para que no sea un trámite, pero tampoco un
   reflejo.
3. **«No, lo dejo pasar»** cierra ahí, sin esperar nada, y anota lo que te
   ahorraste si pusiste cuánto salía.
4. **«Sí, abrir Mercado Pago»** se habilita recién cuando termina la espera,
   y te lleva a la app de verdad. Por los próximos minutos (configurable) no
   te vuelve a frenar — si no, cuando la automatización dispara de nuevo al
   volver a abrir Mercado Pago, quedarías en un bucle.

En el medio podés tocar, en un toque, **cómo andabas** (aburrido, cansado,
ansioso, con hambre) — queda anotado junto con la compra, sin que frene nada.
Si tocás «Hambre» aparece un Plan B: llevar algo para picar (una fruta, unos
frutos secos) para cuando el antojo te agarra con las manos vacías.

## Presupuesto de gustos

En **Ajustes** podés ponerte un monto semanal para comprar cosas en la
calle. En **Registro** ves cuánto te queda; cuando llega a cero, el aviso se
pone en rojo y más insistente. Se calcula solo, sumando lo que gastaste cada
vez que elegiste seguir.

## Patrones

Con un mínimo de datos (tres veces o más), Registro te muestra si se repite
algo: que compras más seguido en un estado de ánimo particular, o siempre en
la misma franja del día — por ejemplo, «a la vuelta del laburo». Con una o
dos veces no dice nada: es ruido, no un patrón.

## Lugares donde se te escapa la plata

También en Ajustes podés guardar un lugar —el kiosco, la panadería— estando
ahí parado. Cada vez que abrís Frená cerca de un lugar guardado (a menos de
150 metros), te avisa arriba de todo.

Esto tiene un límite real y lo decimos en la propia app: **no puede
avisarte caminando con la app cerrada**. Eso necesitaría permiso de
ubicación en segundo plano, que los navegadores no les dan a los sitios
web — ni deberían, es un problema de privacidad serio. Lo que sí hace: mira
dónde estás cada vez que abrís la app, y sólo si ya le diste el permiso
antes (nunca lo pide solo). La ubicación se guarda y se calcula enteramente
en el celular; no sale de ahí.

## Que salte sola al abrir Mercado Pago

Ninguna página web puede detectar qué otra app abriste — ningún sitio puede,
y está bien que sea así, sería un problema de privacidad grave. Lo que sí se
puede es que el propio celular la dispare. La app trae la guía paso a paso
en **Ajustes**, con MacroDroid (Android, gratis) o Atajos (iPhone, viene de
fábrica), y el link ya armado para copiar y pegar en la automatización.

También podés apuntar el disparador a Mercado Libre o a cualquier otra app,
cambiando el destino en Ajustes.

## Tus datos

Todo vive en `localStorage`, **solo en ese navegador/celular**. No hay
servidor, no hay cuenta, no se sincroniza entre dispositivos. Lo que ibas a
comprar y cuánto costaba no sale de ahí.

## Archivos

```
frena/
├── index.html          la pausa, el registro y los ajustes
├── css/style.css
└── js/
    ├── datos.js         config por defecto, destinos, repreguntas
    ├── registro.js       aperturas, frenadas, ahorro (localStorage)
    ├── app.js             la cuenta regresiva y el salto a la otra app
    └── ui.js               pantallas, tabs e instalación como app
```
