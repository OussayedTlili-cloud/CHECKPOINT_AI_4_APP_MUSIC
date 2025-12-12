//---------------------------------------------------------------------
// MINI LECTEUR DEEZER — VERSION ORGANISÉE
//---------------------------------------------------------------------

const form = document.getElementById("search-form");
const qInput = document.getElementById("query");
const backBtn = document.getElementById("back-btn");
const resultsSection = document.getElementById("results-section");
const tracksEl = document.getElementById("tracks");
const noResults = document.getElementById("no-results");

// Player
const playerCard = document.getElementById("player-card");
const playerCover = document.getElementById("player-cover");
const playerTitle = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progress = document.getElementById("progress");
const current = document.getElementById("current-time");
const duration = document.getElementById("duration");
const volume = document.getElementById("volume");

let audio = new Audio();
let currentList = [];
let currentIndex = -1;


//-----------------------------------------------------
// FORMAT TEMPS
//-----------------------------------------------------
function format(s) {
  if (!s) return "0:00";
  s = Math.floor(s);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}


//-----------------------------------------------------
// RECHERCHE DEEZER EN JSONP
//-----------------------------------------------------
function deezerSearch(query) {
  return new Promise((resolve) => {
    const cb = "dz_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");

    window[cb] = (data) => {
      resolve(data);
      script.remove();
      delete window[cb];
    };

    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=${cb}`;
    document.body.appendChild(script);
  });
}


//-----------------------------------------------------
// AFFICHAGE DES RÉSULTATS
//-----------------------------------------------------
function renderResults(list) {
  tracksEl.innerHTML = "";

  if (!list.length) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  list.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "track";

    div.innerHTML = `
      <img src="${t.album.cover_medium}" />
      <div class="meta">
        <div><strong>${t.title}</strong></div>
        <div>${t.artist.name}</div>
      </div>
      <button class="play-btn" data-i="${i}">▶</button>
    `;

    tracksEl.appendChild(div);

    div.querySelector(".play-btn").addEventListener("click", () => {
      playTrack(i);
    });
  });
}


//-----------------------------------------------------
// LECTURE D'UNE PISTE
//-----------------------------------------------------
function playTrack(i) {
  const t = currentList[i];
  if (!t.preview) return alert("Pas de preview disponible.");

  currentIndex = i;
  audio.src = t.preview;
  audio.play();

  // mettre à jour le lecteur
  playerCard.setAttribute("aria-hidden", "false");
  playerCover.src = t.album.cover_big;
  playerTitle.textContent = t.title;
  playerArtist.textContent = t.artist.name;

  updatePlayButton();
}


//-----------------------------------------------------
// CONTROLES
//-----------------------------------------------------
playBtn.addEventListener("click", () => {
  if (audio.paused) audio.play();
  else audio.pause();
  updatePlayButton();
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) playTrack(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < currentList.length - 1) playTrack(currentIndex + 1);
});

// barre progression
audio.addEventListener("timeupdate", () => {
  current.textContent = format(audio.currentTime);
  duration.textContent = format(audio.duration);
  progress.value = audio.currentTime;
  progress.max = audio.duration;
});

progress.addEventListener("input", () => {
  audio.currentTime = progress.value;
});

// volume
volume.addEventListener("input", () => {
  audio.volume = volume.value;
});

function updatePlayButton() {
  playBtn.textContent = audio.paused ? "▶" : "⏸";
}


//-----------------------------------------------------
// FORMULAIRE DE RECHERCHE
//-----------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = qInput.value.trim();
  if (!q) return;

  tracksEl.innerHTML = "Recherche…";

  const data = await deezerSearch(q);
  currentList = data.data;

  renderResults(currentList);

  // afficher bouton retour
  backBtn.style.display = "block";
});


//-----------------------------------------------------
// BOUTON RETOUR
//-----------------------------------------------------
backBtn.addEventListener("click", () => {
  tracksEl.innerHTML = "";
  noResults.style.display = "block";
  backBtn.style.display = "none";
  playerCard.setAttribute("aria-hidden", "true");

  audio.pause();
  currentIndex = -1;
});
