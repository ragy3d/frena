/* La pausa: la cuenta regresiva, las dos respuestas y el salto a la otra app. */

const App = (function(){
  const $ = id => document.getElementById(id);
  const CIRC = 2 * Math.PI * 54;      // el radio del círculo está en el HTML

  let mostrar = function(){};          // lo pasa ui.js
  let cfg = Registro.cfg();
  let animacion = null;
  let listo = false;                   // ya pasó la espera
  let arranque = 0;
  let humorActual = "";                // qué chip de humor está tocado, si hay

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

  /* ---------- humor: el registro de un toque ---------- */

  function pintarHumores(){
    const cont = $("humores");
    cont.innerHTML = "";
    HUMORES.forEach(function(h){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "humor";
      b.dataset.id = h.id;
      b.innerHTML = '<span class="humor-emoji">' + h.emoji + '</span>' + h.texto;
      b.onclick = function(){
        humorActual = (humorActual === h.id) ? "" : h.id;
        actualizarHumores();
      };
      cont.appendChild(b);
    });
  }

  function actualizarHumores(){
    document.querySelectorAll(".humor").forEach(function(b){
      b.classList.toggle("activo", b.dataset.id === humorActual);
    });
    $("planB").classList.toggle("oculto", humorActual !== "hambre");
    if(humorActual === "hambre") $("planB").textContent = PLAN_B;
  }

  /* ---------- lugares cercanos ---------- */

  /* Ninguna página puede avisarte caminando con la app cerrada — eso
     necesitaría permiso de ubicación en segundo plano, que los navegadores
     no les dan a los sitios web. Lo que sí se puede: mirar dónde estás cada
     vez que abrís la app. Por eso esto se revisa acá, al entrar — no es una
     alerta en tiempo real, es una revisada puntual. */
  function revisarLugares(){
    $("alertaLugar").classList.add("oculto");
    if(!navigator.geolocation || !Registro.listarLugares().length) return;
    if(!navigator.permissions || !navigator.permissions.query){
      return;   // sin forma de chequear el permiso sin interrumpir, no se pide solo
    }
    navigator.permissions.query({ name: "geolocation" }).then(function(estado){
      if(estado.state !== "granted") return;   // no se pide el permiso solo: sólo si ya se dio
      navigator.geolocation.getCurrentPosition(function(pos){
        const cerca = Registro.cercaDe(pos.coords.latitude, pos.coords.longitude);
        if(!cerca.length) return;
        const l = cerca[0];
        $("alertaLugar").textContent = "📍 Estás cerca de «" + l.nombre + "». ¿Vas para ahí también?";
        $("alertaLugar").classList.remove("oculto");
      }, function(){}, { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 });
    }).catch(function(){});
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
     por un link profundo que la app acepte (ver DESTINOS en datos.js), en
     iPhone por el esquema propio de la app.

     El respaldo en Android es la Play Store y no la web: en la ficha de una
     app instalada aparece «Abrir», que sí la abre de verdad. La web te dejaba
     en Mercado Pago del navegador, que no es lo que se quería. */
  function saltoElegido(d){
    if(!d.saltos) return null;
    return d.saltos.find(s => s.id === cfg.saltoAndroid) || d.saltos[0];
  }

  function tiendaDe(d){
    return d.paquete ? "market://details?id=" + d.paquete : "";
  }

  function urlDeSalto(android){
    const d = destino();
    if(android){
      const s = saltoElegido(d);
      if(s) return s.url;
      // "otra app": con esquema y paquete se arma el link profundo; con
      // paquete solo, lo único seguro es la Play Store
      const m = /^([a-z][\w+.-]*):\/\/(.*)$/i.exec(d.esquema || "");
      if(d.paquete && m){
        return "intent://" + m[2] + "#Intent;scheme=" + m[1] +
               ";package=" + d.paquete + ";end";
      }
      if(d.paquete) return tiendaDe(d);
    }
    return d.esquema || d.web || "";
  }

  /* sinRespaldo: para «Probar el botón» — si la forma elegida no abre la app,
     que se note, en vez de taparlo saltando a otro lado. */
  function abrirDestino(sinRespaldo){
    const android = esAndroid();
    const u = urlDeSalto(android);
    if(!u) return false;

    const d = destino();
    const respaldo = android ? (tiendaDe(d) || d.web) : d.web;
    const antes = Date.now();
    location.href = u;

    // si en un segundo y medio seguimos en esta pestaña, la app no abrió
    if(!sinRespaldo && respaldo && respaldo !== u){
      setTimeout(function(){
        if(!document.hidden && Date.now() - antes < 2600) location.href = respaldo;
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
    humorActual = "";
    actualizarHumores();

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
    revisarLugares();
  }

  /* ---------- respuestas ---------- */

  function freno(){
    const monto = aNumero($("monto").value);
    const que = $("que").value;
    Registro.frenar(que, monto, humorActual);
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
    Registro.seguir($("que").value, aNumero($("monto").value), humorActual);
    detener();
    if(!abrirDestino()){
      mostrar("ajustes");
      UI.avisar("Decime a qué app tengo que abrir.");
    }
  }

  /* Para "Agregar este lugar" en Ajustes: hay que estar ahí parado cuando se
     toca el botón. Pide el permiso si hace falta — acá sí, porque es un
     toque explícito del usuario, no algo que la app decide sola. */
  function agregarLugarAqui(nombre, listo, error){
    if(!navigator.geolocation){ error && error("Este navegador no tiene ubicación."); return; }
    navigator.geolocation.getCurrentPosition(function(pos){
      const l = Registro.agregarLugar(nombre, pos.coords.latitude, pos.coords.longitude);
      listo && listo(l);
    }, function(e){
      const textos = {
        1: "No diste el permiso de ubicación.",
        2: "No se pudo ubicar — probá de nuevo con buena señal.",
        3: "Tardó demasiado en ubicarte. Probá de nuevo."
      };
      error && error(textos[e.code] || "No se pudo guardar la ubicación.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }

  /* ---------- arranque ---------- */

  function iniciar(fnMostrar){
    mostrar = fnMostrar;
    pintarHumores();

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
    detener: detener,
    urlDeSalto: urlDeSalto,
    agregarLugarAqui: agregarLugarAqui,
    revisarLugares: revisarLugares
  };
})();
