// ---------- dados dos artistas ----------
const artistas = [
  {
    nome: "Travis Scott",
    estilo: "Hip Hop · Trap",
    capa: "https://cdn-images.dzcdn.net/images/cover/a2f66f08468fb9897019e82ffb7a5fcb/1900x1900-000000-80-0-0.jpg",
    musicas: ["BUTTERFLY EFFECT", "SICKO MODE", "HIGHEST IN THE ROOM"]
  },
  {
    nome: "Don Toliver",
    estilo: "Hip Hop · R&B",
    capa: "https://m.media-amazon.com/images/I/91vobbxGA0L._UF1000,1000_QL80_.jpg",
    musicas: ["No Idea", "Can't Say", "No Pole"]
  },
  {
    nome: "Matuê",
    estilo: "Trap brasileiro",
    capa: "https://i1.sndcdn.com/artworks-j2gHmRPyr38Q5Apg-YPyBCQ-t500x500.jpg",
    musicas: ["Imagina Esse Cenário", "De Peça Em Peça", "Outro Plano"]
  },
  {
    nome: "Justin Bieber",
    estilo: "Pop",
    capa: "https://m.media-amazon.com/images/I/81AP9LwM6aL._UF1000,1000_QL80_.jpg",
    musicas: ["One Time", "Never Say Never", "Yummy"]
  }
];

// fila com todas as músicas (na ordem em que aparecem na tela)
const fila = [];
artistas.forEach(a => a.musicas.forEach(m => fila.push({ artista: a.nome, capa: a.capa, titulo: m, preview: null })));

// ---------- elementos ----------
const audio = document.getElementById("audio");
const btnPlay = document.getElementById("btn-play");
const iconePlay = document.getElementById("icone-play");
let atual = -1;

// ---------- menu fixo com transparência ----------
const menu = document.getElementById("menu");
window.addEventListener("scroll", () => {
  menu.classList.toggle("menu-escuro", window.scrollY > 50);
});
document.getElementById("btn-menu").addEventListener("click", () => {
  document.getElementById("menu-mobile").classList.toggle("hidden");
  menu.classList.add("menu-escuro");
});
document.querySelectorAll("#menu-mobile a").forEach(l =>
  l.addEventListener("click", () => document.getElementById("menu-mobile").classList.add("hidden"))
);

// ---------- cards dos artistas ----------
const lista = document.getElementById("lista-artistas");
let indice = 0;
artistas.forEach(a => {
  let faixas = "";
  a.musicas.forEach((m, j) => {
    faixas += `<li><button class="faixa" data-i="${indice}">
                 <span class="num">${j + 1}</span>
                 <span class="nome">${m}</span>
                 <span class="eq"><i></i><i></i><i></i></span>
                 <i class="fa-solid fa-play seta"></i>
               </button></li>`;
    indice++;
  });
  lista.innerHTML += `
    <article class="card-artista">
      <div class="capa">
        <img src="${a.capa}" alt="${a.nome}">
        <div class="capa-info">
          <span class="estilo">${a.estilo}</span>
          <h3>${a.nome}</h3>
        </div>
      </div>
      <ol class="faixas">${faixas}</ol>
    </article>`;
});
lista.addEventListener("click", e => {
  const b = e.target.closest(".faixa");
  if (b) tocar(Number(b.dataset.i));
});

// ---------- busca o trecho de 30s da música (API pública do Deezer) ----------
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const nome = "cb" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const timer = setTimeout(() => { limpar(); reject(); }, 7000);
    function limpar() { clearTimeout(timer); delete window[nome]; s.remove(); }
    window[nome] = dados => { limpar(); resolve(dados); };
    s.onerror = () => { limpar(); reject(); };
    s.src = url + (url.includes("itunes") ? "&callback=" : "&output=jsonp&callback=") + nome;
    document.body.appendChild(s);
  });
}

// tira acentos, padroniza apóstrofos e deixa minúsculo para comparar nomes
const norm = s => (s || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[’‘`]/g, "'")
  .toLowerCase();

async function pegarPreview(m) {
  if (m.preview) return m.preview;
  const art = norm(m.artista);
  const tit = norm(m.titulo);

  // 1ª tentativa: Deezer (Busca aberta, sem o filtro restrito artist:"" track:"")
  try {
    const q = `${m.artista} ${m.titulo}`;
    const d = await jsonp("https://api.deezer.com/search?limit=10&q=" + encodeURIComponent(q));
    
    // Verificamos apenas se a música tem preview e o título bate.
    // Confiamos na relevância da busca da API para o artista.
    const achou = (d.data || []).find(t =>
      t.preview && (norm(t.title).includes(tit) || tit.includes(norm(t.title)))
    );
    if (achou) {
      m.preview = achou.preview;
      return m.preview;
    }
  } catch (e) { /* segue para a 2ª tentativa */ }

  // 2ª tentativa: iTunes
  const termo = encodeURIComponent(m.artista + " " + m.titulo);
  // Removi o "country=BR" para ampliar a chance de achar versões com preview
  const d2 = await jsonp("https://itunes.apple.com/search?media=music&entity=song&limit=10&term=" + termo);
  
  const achou2 = (d2.results || []).find(r =>
    r.previewUrl && (norm(r.trackName).includes(tit) || tit.includes(norm(r.trackName)))
  );
  
  if (!achou2) throw new Error("Não achou");
  m.preview = achou2.previewUrl;
  return m.preview;
}
// ---------- player ----------
async function tocar(i) {
  if (i < 0) i = fila.length - 1;
  if (i >= fila.length) i = 0;
  atual = i;
  const m = fila[i];

  document.getElementById("p-titulo").textContent = m.titulo;
  document.getElementById("p-artista").textContent = m.artista;
  document.getElementById("p-capa").src = m.capa;
  document.querySelectorAll(".faixa").forEach(f =>
    f.classList.toggle("tocando", Number(f.dataset.i) === i)
  );

  try {
    document.getElementById("p-artista").textContent = m.artista + " · carregando...";
    audio.src = await pegarPreview(m);
    document.getElementById("p-artista").textContent = m.artista;
    await audio.play();
  } catch (erro) {
    document.getElementById("p-artista").textContent = "Não foi possível carregar esta faixa";
    iconePlay.className = "fa-solid fa-play text-sm";
  }
}

btnPlay.addEventListener("click", () => {
  if (atual === -1) return tocar(0);
  audio.paused ? audio.play() : audio.pause();
});
document.getElementById("btn-prox").addEventListener("click", () => tocar(atual === -1 ? 0 : atual + 1));
document.getElementById("btn-ant").addEventListener("click", () => tocar(atual === -1 ? 0 : atual - 1));
document.getElementById("btn-ouvir").addEventListener("click", () => {
  tocar(0);
  document.getElementById("artistas").scrollIntoView();
});

audio.addEventListener("play", () => iconePlay.className = "fa-solid fa-pause text-sm");
audio.addEventListener("pause", () => iconePlay.className = "fa-solid fa-play text-sm");
audio.addEventListener("ended", () => tocar(atual + 1)); // passa sozinho pra próxima

function formatar(s) {
  const min = Math.floor(s / 60);
  const seg = Math.floor(s % 60).toString().padStart(2, "0");
  return min + ":" + seg;
}

// ---------- tempo e volume ----------
const barra = document.getElementById("barra");
const volume = document.getElementById("volume");
const iconeVol = document.getElementById("icone-vol");
let arrastando = false;
let volumeAntes = 1;

// pinta a parte preenchida da barra
function preencher(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty("--p", pct + "%");
}

// atualiza a barra conforme a música toca
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  document.getElementById("p-total").textContent = formatar(audio.duration);
  if (arrastando) return;
  document.getElementById("p-atual").textContent = formatar(audio.currentTime);
  barra.value = (audio.currentTime / audio.duration) * 100;
  preencher(barra);
});

// arrastando: mostra o tempo, e só muda a música ao soltar
barra.addEventListener("input", () => {
  if (!audio.duration) return;
  arrastando = true;
  preencher(barra);
  document.getElementById("p-atual").textContent = formatar((barra.value / 100) * audio.duration);
});
barra.addEventListener("change", () => {
  if (audio.duration) audio.currentTime = (barra.value / 100) * audio.duration;
  arrastando = false;
});

// volume
function atualizarIconeVolume() {
  iconeVol.className = "fa-solid w-5 " + (
    audio.muted || audio.volume === 0 ? "fa-volume-xmark" :
    audio.volume < 0.5 ? "fa-volume-low" : "fa-volume-high"
  );
}
volume.addEventListener("input", () => {
  audio.muted = false;
  audio.volume = Number(volume.value);
  preencher(volume);
  atualizarIconeVolume();
});
document.getElementById("btn-mudo").addEventListener("click", () => {
  if (audio.muted || audio.volume === 0) {
    audio.muted = false;
    audio.volume = volumeAntes || 0.5;
  } else {
    volumeAntes = audio.volume;
    audio.muted = true;
  }
  volume.value = audio.muted ? 0 : audio.volume;
  preencher(volume);
  atualizarIconeVolume();
});
preencher(volume);

// ---------- formulário ----------
document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();
  const msg = document.getElementById("msg-form");
  msg.textContent = "Pronto! Seu e-mail foi cadastrado.";
  msg.className = "mt-4 text-sm h-5 text-azulclaro";
  e.target.reset();
});