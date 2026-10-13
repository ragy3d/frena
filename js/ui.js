/* Pantallas, registro, ajustes y la instalación como app. */

const UI = (function(){
  const $ = id => document.getElementById(id);
  let temporizadorAviso = null;

  /* ---------- avisos ---------- */

  function avisar(texto){
    const a = $("aviso");
    a.textContent = texto;
    a.classList.remove("oculto");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => a.classList.add("oculto"), 2600);
  }

  /* ---------- pantallas ---------- */

  const TAB_DE = {
    pausa: "pausa", frenaste: "pausa", gracia: "pausa",
    registro: "registro", ajustes: "ajustes"
  };

  function mostrar(cual){
    document.querySelectorAll(".pantalla").forEach(function(s){
      s.classList.toggle("oculto", s.dataset.p !== cual);
    });
    const tab = TAB_DE[cual] || "pausa";
    document.querySelectorAll(".tab").forEach(function(b){
      b.classList.toggle("activa", b.dataset.tab === tab);
    });
    if(cual === "registro") pintarRegistro();
    if(cual !== "pausa") App.detener();
    window.scrollTo(0, 0);
  }

  /* ---------- registro ---------- */

  function cuando(t){
    const f = new Date(t), h = new Date();
    const hora = String(f.getHours()).padStart(2, "0") + ":" +
                 String(f.getMinutes()).padStart(2, "0");
    const dia = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    const suyo = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    const dif = Math.round((dia - suyo) / 86400000);
    if(dif === 0) return "hoy " + hora;
    if(dif === 1) return "ayer " + hora;
    return f.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  function pintarRegistro(){
    const r = Registro.resumen();
    $("stAhorro").textContent = App.plata(r.ahorro);
    $("stFrenadas").textContent = r.frenadas;
    $("stSeguidas").textContent = r.seguidas;
    $("stAperturas").textContent = r.aperturas;

    $("stSemana").textContent = r.semanaFrenadas === 0
      ? "Esta semana todavía no frenaste ninguna."
      : "Esta semana frenaste " + r.semanaFrenadas +
        (r.semanaFrenadas === 1 ? " compra" : " compras") +
        (r.semanaAhorro > 0 ? " — " + App.plata(r.semanaAhorro) : "") + ".";

    $("stMes").textContent = r.mesAhorro > 0
      ? "Este mes ahorraste " + App.plata(r.mesAhorro) + ", en " + r.mesFrenadas +
        (r.mesFrenadas === 1 ? " vez." : " veces.")
      : "";

    pintarPresupuesto(r);
    pintarPatrones();

    const lista = $("historial");
    const h = Registro.historial();
    if(!h.length){
      lista.innerHTML = '<li class="vacio">Todavía no hay nada acá. ' +
        'Aparece cada vez que pasás por la pausa.</li>';
      return;
    }
    lista.innerHTML = "";
    h.slice(0, 60).forEach(function(r){
      const freno = r.accion === "freno";
      const li = document.createElement("li");

      const ico = document.createElement("span");
      ico.className = "ico";
      ico.textContent = freno ? "✋" : "🛒";

      const caja = document.createElement("div");
      caja.className = "qué";
      const b = document.createElement("b");
      b.textContent = r.que || (freno ? "Lo dejaste pasar" : "Seguiste");
      const h = HUMORES.find(x => x.id === r.humor);
      const s = document.createElement("small");
      s.textContent = cuando(r.t) + (freno ? "" : " · seguiste") +
        (h ? " · " + h.emoji + " " + h.texto.toLowerCase() : "");
      caja.appendChild(b); caja.appendChild(s);

      const plata = document.createElement("span");
      plata.className = "plata" + (freno ? " ok" : "");
      plata.textContent = r.monto ? (freno ? "+" : "−") + App.plata(r.monto) : "";

      li.appendChild(ico); li.appendChild(caja); li.appendChild(plata);
      lista.appendChild(li);
    });
  }

  function pintarPresupuesto(r){
    const caja = $("presupuestoCaja");
    if(r.presupuesto <= 0){ caja.classList.add("oculto"); return; }
    caja.classList.remove("oculto");

    const pct = Math.min(100, Math.round((r.gastadoSemana / r.presupuesto) * 100));
    $("presupuestoTexto").textContent = App.plata(r.gastadoSemana) + " de " + App.plata(r.presupuesto);
    $("presupuestoBarra").style.width = pct + "%";

    const agotado = r.restaPresupuesto <= 0;
    $("presupuestoBarra").classList.toggle("lleno", agotado);
    caja.classList.toggle("agotado", agotado);
    $("presupuestoAviso").textContent = agotado
      ? "Ya usaste todo el presupuesto de la semana. Lo que sigue sale de otro lado."
      : "Te quedan " + App.plata(r.restaPresupuesto) + " para esta semana.";
  }

  function pintarPatrones(){
    const caja = $("patronCaja");
    const ph = Registro.patronHumor();
    const pf = Registro.patronFranja();
    if(!ph && !pf){ caja.classList.add("oculto"); return; }

    const partes = [];
    if(ph){
      const h = HUMORES.find(x => x.id === ph.valor);
      partes.push("seguido comprás estando " + (h ? h.texto.toLowerCase() : ph.valor) +
        " (" + ph.cuenta + " de las últimas " + ph.total + " veces)");
    }
    if(pf){
      partes.push("se repite " + pf.valor + " (" + pf.cuenta + " de " + pf.total + " veces)");
    }
    caja.classList.remove("oculto");
    $("patronTexto").textContent = "Se nota un patrón: " + partes.join(", y también ") + ".";
  }

  /* ---------- lugares ---------- */

  function pintarLugares(){
    const ul = $("listaLugares");
    const ls = Registro.listarLugares();
    if(!ls.length){
      ul.innerHTML = '<li class="vacio">Todavía no guardaste ningún lugar.</li>';
      return;
    }
    ul.innerHTML = "";
    ls.forEach(function(l){
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = "📍 " + l.nombre;
      const btn = document.createElement("button");
      btn.className = "borrar-lugar";
      btn.textContent = "✕";
      btn.onclick = function(){
        Registro.borrarLugar(l.id);
        pintarLugares();
      };
      li.appendChild(span); li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  /* ---------- formas de abrir la app (Android) ---------- */

  function pintarSaltos(){
    const c = Registro.cfg();
    const d = DESTINOS[c.destino];
    const sel = $("cfgSalto");
    if(!d || !d.saltos){ $("cajaSalto").classList.add("oculto"); return; }
    $("cajaSalto").classList.remove("oculto");
    sel.innerHTML = "";
    d.saltos.forEach(function(s){
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.texto;
      sel.appendChild(o);
    });
    const elegido = d.saltos.find(s => s.id === c.saltoAndroid) || d.saltos[0];
    sel.value = elegido.id;
  }

  /* ---------- ajustes ---------- */

  function enlaceApp(){
    return location.href.split("#")[0].split("?")[0];
  }

  function pintarAjustes(){
    const c = Registro.cfg();
    $("cfgSegundos").value = c.segundos;
    $("valSegundos").textContent = c.segundos + " s";
    $("cfgGracia").value = c.gracia;
    $("valGracia").textContent = c.gracia === 0 ? "sin gracia" : c.gracia + " min";
    $("cfgMonto").checked = !!c.preguntarMonto;
    $("cfgPresupuesto").value = c.presupuestoSemanal || "";
    $("cfgDestino").value = c.destino;
    $("cfgNombre").value = c.nombre || "";
    $("cfgPaquete").value = c.paquete || "";
    $("cfgEnlace").value = c.enlace || "";
    $("cajaOtra").classList.toggle("oculto", c.destino !== "otra");
    pintarSaltos();
    $("linkAndroid").textContent = enlaceApp();
    $("linkIos").textContent = enlaceApp();
    pintarLugares();
  }

  function atarAjustes(){
    $("cfgSegundos").oninput = function(){
      const v = parseInt(this.value, 10);
      $("valSegundos").textContent = v + " s";
      Registro.guardarCfg({ segundos: v });
    };
    $("cfgGracia").oninput = function(){
      const v = parseInt(this.value, 10);
      $("valGracia").textContent = v === 0 ? "sin gracia" : v + " min";
      Registro.guardarCfg({ gracia: v });
    };
    $("cfgMonto").onchange = function(){
      Registro.guardarCfg({ preguntarMonto: this.checked });
    };
    $("cfgPresupuesto").oninput = function(){
      const v = parseInt(String(this.value).replace(/\D/g, ""), 10);
      Registro.guardarCfg({ presupuestoSemanal: isFinite(v) ? v : 0 });
    };
    $("agregarLugarBtn").onclick = function(){
      const nombre = $("nombreLugar").value.trim();
      if(!nombre){ avisar("Primero ponele un nombre."); return; }
      const btn = this;
      btn.disabled = true;
      btn.textContent = "Ubicando…";
      App.agregarLugarAqui(nombre, function(){
        $("nombreLugar").value = "";
        pintarLugares();
        avisar("Guardado. Te avisa cuando vuelvas a pasar cerca.");
        btn.disabled = false;
        btn.textContent = "📍 Guardar este lugar, estando ahí";
      }, function(mensaje){
        avisar(mensaje);
        btn.disabled = false;
        btn.textContent = "📍 Guardar este lugar, estando ahí";
      });
    };
    $("cfgDestino").onchange = function(){
      Registro.guardarCfg({ destino: this.value });
      $("cajaOtra").classList.toggle("oculto", this.value !== "otra");
      pintarSaltos();
    };
    $("cfgSalto").onchange = function(){
      Registro.guardarCfg({ saltoAndroid: this.value });
    };
    $("cfgNombre").oninput = function(){ Registro.guardarCfg({ nombre: this.value }); };
    $("cfgPaquete").oninput = function(){ Registro.guardarCfg({ paquete: this.value }); };
    $("cfgEnlace").oninput = function(){ Registro.guardarCfg({ enlace: this.value }); };

    $("probarBtn").onclick = function(){
      if(!App.abrirDestino(true)) avisar("Falta el paquete o el link de la app.");
    };

    $("copiarLink").onclick = function(){
      const texto = enlaceApp();
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(texto)
          .then(() => avisar("Link copiado."))
          .catch(() => avisar(texto));
      }else{
        avisar(texto);
      }
    };

    $("borrarBtn").onclick = function(){
      if(!confirm("¿Borro todo el registro y los ajustes? No se puede deshacer.")) return;
      Registro.borrar();
      pintarAjustes();
      pintarRegistro();
      avisar("Listo, quedó vacío.");
    };
  }

  /* ---------- instalación ---------- */

  function instalable(){
    let evento = null;

    addEventListener("beforeinstallprompt", function(ev){
      ev.preventDefault();
      evento = ev;
      $("instalarBtn").classList.remove("oculto");
    });

    $("instalarBtn").onclick = function(){
      if(!evento) return;
      evento.prompt();
      evento.userChoice.finally(function(){
        evento = null;
        $("instalarBtn").classList.add("oculto");
      });
    };

    addEventListener("appinstalled", function(){
      $("instalarBtn").classList.add("oculto");
      avisar("Quedó instalada.");
    });

    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    }
  }

  /* ---------- arranque ---------- */

  function iniciar(){
    document.querySelectorAll(".tab").forEach(function(b){
      b.onclick = function(){
        const t = b.dataset.tab;
        if(t === "pausa"){ mostrar("pausa"); App.nuevaPausa(); }
        else mostrar(t);
      };
    });

    pintarAjustes();
    atarAjustes();
    instalable();
    App.iniciar(mostrar);
  }

  return { iniciar: iniciar, avisar: avisar, mostrar: mostrar };
})();

UI.iniciar();
