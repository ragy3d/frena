/* La pausa: la cuenta regresiva, las dos respuestas y el salto a la otra app. */

const App = (function(){
  const $ = id => document.getElementById(id);
  const CIRC = 2 * Math.PI * 54;      // el radio del círculo está en el HTML

  let mostrar = function(){};          // lo pasa ui.js
  let cfg = Registro.cfg();
  let animacion = null;
  let listo = false;                   // ya pasó la espera
  let arranque = 0;

  /* ---------- plata ---------- */

  function aNumero(s){
    s = String(s == null ? "" : s).replace(/[^\d.,]/g, "");
    if(!s) return 0;
    s = s.replace(/\./g, "").replace(",", ".");   // punto = miles, coma = decimal
    const n = parseFloat(s);
    return isFinite(n) && n > 0 ? Math.round(n) : 0;
  }

  function plata(n){
    return "$" + Math.round(n || 0).toLocaleString("es-AR");
  }

  /* ---------- el destino ---------- */

  function destino(){
    const base = DESTINOS[cfg.destino] || DESTINOS.otra;
    if(cfg.destino !== "otra") return base;
    const enlace = String(cfg.enlace || "").trim();
    return {
      nombre: String(cfg.nombre || "").trim() || "la app",
      paquete: String(cfg.paquete || "").trim(),
      esquema: /^https?:/i.test(enlace) ? "" : enlace,
      web: /^https?:/i.test(enlace) ? enlace : ""
    };
  }

  function esAndroid(){ return /Android/i.test(navigator.userAgent); }

  function esIOS(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  /* Abrir otra app desde el navegador no tiene una forma única: en Android va
     por intent://, en iPhone por el esquema propio de la app. Si no hay con
     qué, queda el sitio web.

     En Android, un intent que sólo lleva "package" y ninguna acción no hace
     match con nada del manifest de la app instalada — casi ningún componente
     escucha un ACTION_VIEW sin datos. Chrome entonces no encuentra la app y
     va directo al fallback: por eso llegabas al sitio web y no a la app de
     verdad. Pidiendo MAIN + LAUNCHER se apunta directo a la pantalla
     principal de la app, que es lo que cualquier app instalada declara. */
  function urlDeSalto(android){
    const d = destino();
    if(android && d.paquete){
      let u = "intent:#Intent;package=" + d.paquete +
              ";action=android.intent.action.MAIN" +
              ";category=android.intent.category.LAUNCHER;";
      if(d.web) u += "S.browser_fallback_url=" + encodeURIComponent(d.web) + ";";
      return u + "end";
    }
    return d.esquema || d.web || "";
  }

  function abrirDestino(){
    const android = esAndroid();
    const u = urlDeSalto(android);
    if(!u) return false;

    const d = destino();
    const antes = Date.now();
    location.href = u;

    // si en un segundo y medio seguimos en esta pestaña, no pasó nada:
    // probamos con el sitio web como último recurso
    if(d.web && u !== d.web){
      setTimeout(function(){
        if(!document.hidden && Date.now() - antes < 2600) location.href = d.web;
      }, 1500);
    }
    return true;
  }

  /* ---------- la cuenta regresiva ---------- */

  function detener(){
    if(animacion) cancelAnimationFrame(animacion);
    animacion = null;
  }

  function pintarAro(falta){
    const total = Math.max(1, cfg.segundos);
    $("aro").style.strokeDasharray = CIRC;
    $("aro").style.strokeDashoffset = CIRC * (1 - falta / total);
  }

  function terminarEspera(){
    listo = true;
    $("reloj").classList.add("fin");
    $("segundos").textContent = "✓";
    pintarAro(0);
    const b = $("sigoBtn");
    b.disabled = false;
    b.textContent = "Sí, abrir " + destino().nombre;
  }

  function latir(ahora){
    const pasado = (ahora - arranque) / 1000;
    const falta = Math.max(0, cfg.segundos - pasado);
    pintarAro(falta);
    const entero = Math.ceil(falta);
    if($("segundos").textContent !== String(entero) && falta > 0){
      $("segundos").textContent = entero;
      $("sigoBtn").textContent = "Esperá " + entero + " s…";
    }
    if(falta <= 0){ terminarEspera(); return; }
    animacion = requestAnimationFrame(latir);
  }

  /* ---------- armar la pausa ---------- */

  function nuevaPausa(){
    detener();
    cfg = Registro.cfg();
    listo = false;

    $("repregunta").textContent =
      REPREGUNTAS[Math.floor(Math.random() * REPREGUNTAS.length)];

    $("que").value = "";
    $("monto").value = "";
    $("montoCaja").classList.toggle("oculto", !cfg.preguntarMonto);

    $("reloj").classList.remove("fin");
    $("segundos").textContent = cfg.segundos;
    $("sigoBtn").disabled = true;
    $("sigoBtn").textContent = "Esperá " + cfg.segundos + " s…";
    pintarAro(cfg.segundos);

    arranque = performance.now();
    animacion = requestAnimationFrame(latir);
  }

  function pantallaGracia(){
    detener();
    $("graciaMin").textContent = Registro.minutosDeGracia();
    $("volverBtn").textContent = "Volver a " + destino().nombre;
    mostrar("gracia");
  }

  /* Al entrar: si venís de decir que sí hace un rato, no te vuelvo a frenar.
     Sin esto, cuando la app salta sola al abrir Mercado Pago, se te repite en
     bucle: abrís, decís que sí, vuelve a saltar. */
  function entrar(){
    const veces = Registro.abrir();
    $("vecesHoy").textContent = veces <= 1
      ? "Primera vez que entrás hoy."
      : "Es la " + veces + "ª vez que entrás hoy.";

    if(Registro.enGracia()){ pantallaGracia(); return; }
    mostrar("pausa");
    nuevaPausa();
  }

  /* ---------- respuestas ---------- */

  function freno(){
    const monto = aNumero($("monto").value);
    const que = $("que").value;
    Registro.frenar(que, monto);
    detener();

    const r = Registro.resumen();
    $("frenasteTexto").textContent = monto
      ? "Te quedaron " + plata(monto) + " en el bolsillo."
      : (que.trim() ? "«" + que.trim() + "» se queda donde estaba." : "");
    $("frenasteTotal").textContent =
      r.ahorro > 0 ? "Van " + plata(r.ahorro) + " en total, en " + r.frenadas +
                     (r.frenadas === 1 ? " vez." : " veces.")
                   : "Van " + r.frenadas + (r.frenadas === 1 ? " vez." : " veces.");
    mostrar("frenaste");
  }

  function sigo(){
    if(!listo) return;
    Registro.seguir($("que").value, aNumero($("monto").value));
    detener();
    if(!abrirDestino()){
      mostrar("ajustes");
      UI.avisar("Decime a qué app tengo que abrir.");
    }
  }

  /* ---------- arranque ---------- */

  function iniciar(fnMostrar){
    mostrar = fnMostrar;

    $("frenoBtn").onclick = freno;
    $("sigoBtn").onclick = sigo;
    $("deNuevoBtn").onclick = function(){ mostrar("pausa"); nuevaPausa(); };
    $("alRegistroBtn").onclick = function(){ mostrar("registro"); };
    $("volverBtn").onclick = function(){ abrirDestino(); };
    $("preguntarIgual").onclick = function(){
      Registro.cortarGracia();
      mostrar("pausa");
      nuevaPausa();
    };

    /* Volviendo de la otra app: si sigue la gracia, no molestar de nuevo; si
       ya se venció, la pausa arranca limpia — el "sí" no queda armado de
       antes. Si estabas mirando el registro o los ajustes, no te muevo. */
    document.addEventListener("visibilitychange", function(){
      if(document.hidden) return;
      if(Registro.enGracia()){ pantallaGracia(); return; }
      const visible = document.querySelector(".pantalla:not(.oculto)");
      const donde = visible ? visible.dataset.p : "";
      if(donde === "gracia" || (donde === "pausa" && listo)) entrar();
    });

    entrar();
  }

  return {
    iniciar: iniciar,
    nuevaPausa: nuevaPausa,
    abrirDestino: abrirDestino,
    destino: destino,
    plata: plata,
    detener: detener
  };
})();
