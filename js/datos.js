/* Todo el contenido y los valores por defecto viven acá. */

const DEFAULTS = {
  segundos: 15,        // cuánto hay que esperar antes de poder seguir
  gracia: 10,          // minutos sin volver a preguntar después de decir que sí
  destino: "mercadopago",
  nombre: "",          // sólo para destino "otra"
  paquete: "",         // sólo para destino "otra"
  enlace: "",          // sólo para destino "otra"
  preguntarMonto: true
};

/* Para abrir otra app desde el navegador hay dos caminos y ninguno es
   universal: en Android un intent:// con el nombre del paquete, en iPhone el
   esquema propio de la app. Si los dos fallan, queda el sitio web. */
const DESTINOS = {
  mercadopago: {
    nombre: "Mercado Pago",
    paquete: "com.mercadopago.wallet",
    esquema: "mercadopago://",
    web: "https://www.mercadopago.com.ar/"
  },
  mercadolibre: {
    nombre: "Mercado Libre",
    paquete: "com.mercadolibre",
    esquema: "meli://",
    web: "https://www.mercadolibre.com.ar/"
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
  "Si costara el doble, ¿lo comprarías igual?"
];
