// ---------- dados dos artistas ----------
const artistas = [
  {
    nome: "Travis Scott",
    estilo: "Hip Hop · Trap",
    capa: "https://cdn-images.dzcdn.net/images/cover/a2f66f08468fb9897019e82ffb7a5fcb/1900x1900-000000-80-0-0.jpg",
    musicas: ["Goosebumps", "SICKO MODE", "HIGHEST IN THE ROOM"]
  },
  {
    nome: "Don Toliver",
    estilo: "Hip Hop · R&B",
    capa: "https://m.media-amazon.com/images/I/91vobbxGA0L._UF1000,1000_QL80_.jpg",
    musicas: ["No Idea", "Can't Say", "Lose My Mind"]
  },
{
  nome: "Matuê",
  estilo: "Trap brasileiro",
  capa: "https://i1.sndcdn.com/artworks-j2gHmRPyr38Q5Apg-YPyBCQ-t500x500.jpg",
  musicas: ["Imagina Esse Cenário", "Anos Luz", "333"]
},
  {
    nome: "Justin Bieber",
    estilo: "Pop",
    capa: "https://m.media-amazon.com/images/I/81AP9LwM6aL._UF1000,1000_QL80_.jpg",
    musicas: ["Peaches", "Ghost", "Yummy"]
  }
];

// fila com todas as músicas (na ordem em que aparecem na tela)
const fila = [];
artistas.forEach(a => a.musicas.forEach(m => fila.push({ artista: a.nome, capa: a.capa, titulo: m, preview: null })));

// ---------- elementos ----------
const audio = document.getElementById("audio");
const btnPlay = document.getElementById("btn-play");
const iconePlay = document.getElementById("icone-play");
const progresso = document.getElementById("progresso");
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

async function pegarPreview(m) {
  if (m.preview) return m.preview;
  // 1ª tentativa: Deezer
  try {
    const q = `artist:"${m.artista}" track:"${m.titulo}"`;
    const d = await jsonp("https://api.deezer.com/search?limit=1&q=" + encodeURIComponent(q));
    if (d.data && d.data.length && d.data[0].preview) {
      m.preview = d.data[0].preview;
      return m.preview;
    }
  } catch (e) { /* segue para a 2ª tentativa */ }
  // 2ª tentativa: iTunes
  const termo = encodeURIComponent(m.artista + " " + m.titulo);
  const d2 = await jsonp("https://itunes.apple.com/search?media=music&entity=song&limit=1&term=" + termo);
  if (!d2.results || !d2.results.length) throw new Error("não achou");
  m.preview = d2.results[0].previewUrl;
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
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  progresso.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  document.getElementById("p-atual").textContent = formatar(audio.currentTime);
  document.getElementById("p-total").textContent = formatar(audio.duration);
});
document.getElementById("barra").addEventListener("click", e => {
  if (!audio.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});

// ---------- formulário ----------
document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();
  const msg = document.getElementById("msg-form");
  msg.textContent = "Pronto! Seu e-mail foi cadastrado.";
  msg.className = "mt-4 text-sm h-5 text-azulclaro";
  e.target.reset();
});

