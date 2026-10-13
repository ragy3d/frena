/* Todo el contenido y los valores por defecto viven acá. */

const DEFAULTS = {
  segundos: 15,        // cuánto hay que esperar antes de poder seguir
  gracia: 10,          // minutos sin volver a preguntar después de decir que sí
  destino: "mercadopago",
  nombre: "",          // sólo para destino "otra"
  paquete: "",         // sólo para destino "otra"
  enlace: "",          // sólo para destino "otra"
  preguntarMonto: true,
  saltoAndroid: "",       // qué forma de abrir la app usar ("" = la primera)
  presupuestoSemanal: 0   // 0 = apagado
};

/* Para el registro rápido: en qué andabas cuando te agarró el impulso.
   Un toque, nada más — por eso son pocas opciones y bien concretas. */
const HUMORES = [
  { id: "aburrido", emoji: "😐", texto: "Aburrido" },
  { id: "cansado", emoji: "😴", texto: "Cansado" },
  { id: "ansioso", emoji: "😰", texto: "Ansioso" },
  { id: "hambre", emoji: "🍔", texto: "Hambre" }
];

const PLAN_B = "¿Tenés algo para picar a mano — una fruta, unos frutos " +
  "secos? A veces alcanza con eso y te ahorrás la vuelta al kiosco.";

/* Para detectar patrones horarios ("siempre te pasa a la vuelta del
   laburo"). Son franjas anchas a propósito: la hora exacta varía, la franja
   se repite. */
const FRANJAS = [
  { desde: 0, hasta: 6, texto: "de madrugada" },
  { desde: 6, hasta: 12, texto: "a la mañana" },
  { desde: 12, hasta: 15, texto: "al mediodía" },
  { desde: 15, hasta: 19, texto: "a la tarde" },
  { desde: 19, hasta: 23, texto: "a la noche" },
  { desde: 23, hasta: 24, texto: "de madrugada" }
];

function franjaDe(t){
  const h = new Date(t).getHours();
  return (FRANJAS.find(f => h >= f.desde && h < f.hasta) || FRANJAS[0]).texto;
}

/* En Android, Chrome sólo deja abrir una app si la entrada que se le pide
   acepta venir del navegador (las que tienen BROWSABLE en el manifest). La
   pantalla principal de la app casi nunca la tiene: por eso un intent a
   MAIN/LAUNCHER cae siempre a la web. Hay que entrar por un link profundo, y
   cuál acepta cada app no está publicado — así que hay varias formas para
   probar desde el celular, y se usa la que ande. La Play Store es la última:
   son dos toques (aparece «Abrir»), pero anda siempre. */
const DESTINOS = {
  mercadopago: {
    nombre: "Mercado Pago",
    paquete: "com.mercadopago.wallet",
    esquema: "mercadopago://",
    web: "https://www.mercadopago.com.ar/",
    saltos: [
      { id: "esquema-paquete", texto: "1 · Esquema de la app",
        url: "intent://home#Intent;scheme=mercadopago;package=com.mercadopago.wallet;end" },
      { id: "esquema", texto: "2 · Esquema directo",
        url: "mercadopago://home" },
      { id: "link", texto: "3 · Link de la app",
        url: "intent://www.mercadopago.com.ar/#Intent;scheme=https;package=com.mercadopago.wallet;end" },
      { id: "tienda", texto: "4 · Por la Play Store (2 toques, anda siempre)",
        url: "market://details?id=com.mercadopago.wallet" }
    ]
  },
  mercadolibre: {
    nombre: "Mercado Libre",
    paquete: "com.mercadolibre",
    esquema: "meli://",
    web: "https://www.mercadolibre.com.ar/",
    saltos: [
      { id: "esquema-paquete", texto: "1 · Esquema de la app",
        url: "intent://home#Intent;scheme=meli;package=com.mercadolibre;end" },
      { id: "esquema", texto: "2 · Esquema directo",
        url: "meli://home" },
      { id: "link", texto: "3 · Link de la app",
        url: "intent://www.mercadolibre.com.ar/#Intent;scheme=https;package=com.mercadolibre;end" },
      { id: "tienda", texto: "4 · Por la Play Store (2 toques, anda siempre)",
        url: "market://details?id=com.mercadolibre" }
    ]
  },
  otra: { nombre: "la app", paquete: "", esquema: "", web: "" }
};

/* Se muestra una distinta cada vez. La misma pregunta repetida deja de hacer
   efecto a la tercera vez: el cerebro la saltea como saltea los carteles. */
const REPREGUNTAS = [
  "¿Lo necesitabas hace una hora?",
  "¿Lo vas a seguir queriendo el martes que viene?",
  "¿Cuántas horas de laburo te cuesta?",
  "¿Ya tenés algo que hace lo mismo?",
  "Si lo dejás para mañana, ¿se te escapa de verdad?",
  "¿Lo querés por lo que es o porque estaba en oferta?",
  "¿Dónde lo vas a guardar?",
  "¿Estás aburrido, cansado o con bronca en este momento?",
  "¿Lo buscaste vos o te apareció solo?",
  "¿Cuánto falta para que cobres?",
  "¿Qué pasa si no lo comprás?",
  "¿Se lo contarías a alguien sin que te dé cosa?",
  "¿Es para vos o para que lo vean?",
  "Si costara el doble, ¿lo comprarías igual?",
  "¿Tenés hambre de verdad, o son ganas de picar algo?",
  "¿Esto es un gusto, o es para tapar otra cosa?",
  "¿Lo mismo te lo podés hacer en tu casa?"
];
