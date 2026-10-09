/* El registro: cuántas veces entraste, cuántas frenaste y cuánta plata no
   gastaste. Vive entero en localStorage, en este dispositivo y nada más.
   No hay servidor al que mandar esto ni ganas de tenerlo. */

const Registro = (function(){
  const CLAVE = "frena.v1";
  const TOPE_HISTORIAL = 200;
  const TOPE_DIAS = 180;
  const REBOTE = 25000;   // dos entradas más juntas que esto son la misma

  function vacio(){
    return {
      v: 1,
      aperturas: 0,
      frenadas: 0,
      seguidas: 0,
      ahorro: 0,
      graciaHasta: 0,
      ultimaApertura: 0,
      porDia: {},
      historial: [],
      lugares: [],
      cfg: Object.assign({}, DEFAULTS)
    };
  }

  let d = cargar();

  function cargar(){
    const base = vacio();
    try{
      const crudo = localStorage.getItem(CLAVE);
      if(!crudo) return base;
      const g = JSON.parse(crudo) || {};
      const cfg = Object.assign({}, DEFAULTS, g.cfg || {});
      return Object.assign(base, g, { cfg: cfg });
    }catch(e){
      return base;   // datos rotos: mejor arrancar limpio que no arrancar
    }
  }

  function guardar(){
    try{ localStorage.setItem(CLAVE, JSON.stringify(d)); }catch(e){}
  }

  function clave(t){
    const f = new Date(t);
    return f.getFullYear() + "-" +
           String(f.getMonth() + 1).padStart(2, "0") + "-" +
           String(f.getDate()).padStart(2, "0");
  }

  function podar(){
    const ks = Object.keys(d.porDia);
    if(ks.length <= TOPE_DIAS) return;
    ks.sort();
    for(const k of ks.slice(0, ks.length - TOPE_DIAS)) delete d.porDia[k];
  }

  function anotar(accion, que, monto, humor){
    d.historial.unshift({
      t: Date.now(),
      accion: accion,
      que: String(que || "").trim().slice(0, 80),
      monto: monto || 0,
      humor: humor || ""
    });
    if(d.historial.length > TOPE_HISTORIAL) d.historial.length = TOPE_HISTORIAL;
  }

  /* Una entrada. Cuenta también las que caen en el rato de gracia — son
     veces que abriste la app igual — pero no las que llegan pegadas a la
     anterior: volver de Mercado Pago dispara la automatización de nuevo y si
     no, un solo viaje contaría tres.
     Devuelve cuántas veces entraste hoy, contando ésta. */
  function abrir(){
    const ahora = Date.now();
    const k = clave(ahora);
    if(ahora - (d.ultimaApertura || 0) > REBOTE){
      d.aperturas++;
      d.porDia[k] = (d.porDia[k] || 0) + 1;
      d.ultimaApertura = ahora;
      podar();
      guardar();
    }
    return d.porDia[k] || 1;
  }

  function frenar(que, monto, humor){
    d.frenadas++;
    d.ahorro += (monto || 0);
    anotar("freno", que, monto, humor);
    guardar();
  }

  function seguir(que, monto, humor){
    d.seguidas++;
    d.graciaHasta = Date.now() + (d.cfg.gracia || 0) * 60000;
    anotar("sigo", que, monto, humor);
    guardar();
  }

  function enGracia(){ return Date.now() < (d.graciaHasta || 0); }

  function minutosDeGracia(){
    return Math.max(1, Math.ceil((d.graciaHasta - Date.now()) / 60000));
  }

  function cortarGracia(){ d.graciaHasta = 0; guardar(); }

  function inicioSemana(){
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const dia = (h.getDay() + 6) % 7;        // 0 = lunes
    return h.getTime() - dia * 86400000;
  }

  function inicioMes(){
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1).getTime();
  }

  function resumen(){
    const lunes = inicioSemana();
    const mes = inicioMes();
    let frenadas = 0, ahorro = 0, mesFrenadas = 0, mesAhorro = 0, gastadoSemana = 0;
    for(const r of d.historial){
      if(r.t < mes) break;                   // el historial va del más nuevo al más viejo
      if(r.accion === "freno"){
        mesFrenadas++; mesAhorro += r.monto || 0;
        if(r.t >= lunes){ frenadas++; ahorro += r.monto || 0; }
      }else if(r.accion === "sigo" && r.t >= lunes){
        gastadoSemana += r.monto || 0;
      }
    }
    const presupuesto = d.cfg.presupuestoSemanal || 0;
    return {
      aperturas: d.aperturas,
      frenadas: d.frenadas,
      seguidas: d.seguidas,
      ahorro: d.ahorro,
      semanaFrenadas: frenadas,
      semanaAhorro: ahorro,
      mesFrenadas: mesFrenadas,
      mesAhorro: mesAhorro,
      hoy: d.porDia[clave(Date.now())] || 0,
      presupuesto: presupuesto,
      gastadoSemana: gastadoSemana,
      restaPresupuesto: presupuesto > 0 ? presupuesto - gastadoSemana : null
    };
  }

  /* Patrones: sólo tienen sentido con un mínimo de datos — con una o dos
     veces es ruido, no un patrón. Miran las últimas veces que SEGUISTE
     (compraste), que es donde está el hábito que se quiere notar. */
  const MINIMO_PATRON = 3;

  function masFrecuente(lista){
    const cuentas = {};
    for(const v of lista) cuentas[v] = (cuentas[v] || 0) + 1;
    let top = null;
    for(const k in cuentas){
      if(!top || cuentas[k] > cuentas[top]) top = k;
    }
    return top ? { valor: top, cuenta: cuentas[top], total: lista.length } : null;
  }

  function patronHumor(){
    const vs = d.historial.filter(r => r.accion === "sigo" && r.humor).map(r => r.humor);
    const m = masFrecuente(vs);
    return (m && m.cuenta >= MINIMO_PATRON) ? m : null;
  }

  function patronFranja(){
    const vs = d.historial.filter(r => r.accion === "sigo").map(r => franjaDe(r.t));
    const m = masFrecuente(vs);
    return (m && m.cuenta >= MINIMO_PATRON) ? m : null;
  }

  /* ---------- lugares ---------- */
  /* Todo esto se guarda y se mide en el propio celular. La ubicación nunca
     sale de acá — no hay a dónde mandarla, ni ganas de tenerla. */

  function distanciaMetros(lat1, lng1, lat2, lng2){
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function agregarLugar(nombre, lat, lng){
    const lugar = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: String(nombre || "").trim().slice(0, 40) || "Ese lugar",
      lat: lat, lng: lng
    };
    d.lugares.push(lugar);
    guardar();
    return lugar;
  }

  function borrarLugar(id){
    d.lugares = d.lugares.filter(l => l.id !== id);
    guardar();
  }

  function listarLugares(){ return d.lugares; }

  function cercaDe(lat, lng, radioM){
    radioM = radioM || 150;
    return d.lugares
      .map(l => Object.assign({ distancia: distanciaMetros(lat, lng, l.lat, l.lng) }, l))
      .filter(l => l.distancia <= radioM)
      .sort((a, b) => a.distancia - b.distancia);
  }

  function cfg(){ return d.cfg; }

  function guardarCfg(parcial){
    Object.assign(d.cfg, parcial);
    guardar();
  }

  function historial(){ return d.historial; }

  function borrar(){
    d = vacio();
    guardar();
  }

  return {
    abrir: abrir, frenar: frenar, seguir: seguir,
    enGracia: enGracia, minutosDeGracia: minutosDeGracia,
    cortarGracia: cortarGracia,
    resumen: resumen, historial: historial,
    patronHumor: patronHumor, patronFranja: patronFranja,
    agregarLugar: agregarLugar, borrarLugar: borrarLugar,
    listarLugares: listarLugares, cercaDe: cercaDe,
    cfg: cfg, guardarCfg: guardarCfg, borrar: borrar
  };
})();
