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

  function anotar(accion, que, monto){
    d.historial.unshift({
      t: Date.now(),
      accion: accion,
      que: String(que || "").trim().slice(0, 80),
      monto: monto || 0
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

  function frenar(que, monto){
    d.frenadas++;
    d.ahorro += (monto || 0);
    anotar("freno", que, monto);
    guardar();
  }

  function seguir(que, monto){
    d.seguidas++;
    d.graciaHasta = Date.now() + (d.cfg.gracia || 0) * 60000;
    anotar("sigo", que, monto);
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

  function resumen(){
    const lunes = inicioSemana();
    let frenadas = 0, ahorro = 0;
    for(const r of d.historial){
      if(r.t < lunes) break;                 // el historial va del más nuevo al más viejo
      if(r.accion === "freno"){ frenadas++; ahorro += r.monto || 0; }
    }
    return {
      aperturas: d.aperturas,
      frenadas: d.frenadas,
      seguidas: d.seguidas,
      ahorro: d.ahorro,
      semanaFrenadas: frenadas,
      semanaAhorro: ahorro,
      hoy: d.porDia[clave(Date.now())] || 0
    };
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
    cfg: cfg, guardarCfg: guardarCfg, borrar: borrar
  };
})();
