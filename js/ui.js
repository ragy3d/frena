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
      const s = document.createElement("small");
      s.textContent = cuando(r.t) + (freno ? "" : " · seguiste");
      caja.appendChild(b); caja.appendChild(s);

      const plata = document.createElement("span");
      plata.className = "plata" + (freno ? " ok" : "");
      plata.textContent = r.monto ? (freno ? "+" : "−") + App.plata(r.monto) : "";

      li.appendChild(ico); li.appendChild(caja); li.appendChild(plata);
      lista.appendChild(li);
    });
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
    $("cfgDestino").value = c.destino;
    $("cfgNombre").value = c.nombre || "";
    $("cfgPaquete").value = c.paquete || "";
    $("cfgEnlace").value = c.enlace || "";
    $("cajaOtra").classList.toggle("oculto", c.destino !== "otra");
    $("linkAndroid").textContent = enlaceApp();
    $("linkIos").textContent = enlaceApp();
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
    $("cfgDestino").onchange = function(){
      Registro.guardarCfg({ destino: this.value });
      $("cajaOtra").classList.toggle("oculto", this.value !== "otra");
    };
    $("cfgNombre").oninput = function(){ Registro.guardarCfg({ nombre: this.value }); };
    $("cfgPaquete").oninput = function(){ Registro.guardarCfg({ paquete: this.value }); };
    $("cfgEnlace").oninput = function(){ Registro.guardarCfg({ enlace: this.value }); };

    $("probarBtn").onclick = function(){
      if(!App.abrirDestino()) avisar("Falta el paquete o el link de la app.");
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
