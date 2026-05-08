const STORAGE_KEY = "hm_tv_royale_static_v1";
const LEGACY_KEYS = ["hm_tv_static_premium_v2", "hm_tv_static_premium_v1"];
const SESSION_KEY = "hm_tv_royale_session_v1";
const LEGACY_SESSION_KEYS = ["hm_tv_static_session_v2", "hm_tv_static_session_v1"];

const defaultChannels = [
  {
    id: "tvri-nasional",
    name: "TVRI Nasional",
    category: "Nasional",
    servers: ["https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8"],
    builtin: true,
    logo: "",
    poster: "",
    description: "Siaran nasional resmi dengan berita, budaya, hiburan, dan program publik."
  },
  {
    id: "tvri-world",
    name: "TVRI World",
    category: "Internasional",
    servers: ["https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8"],
    builtin: true,
    logo: "",
    poster: "",
    description: "Saluran internasional TVRI dengan tampilan global dan program pilihan."
  },
  {
    id: "hm-sports-demo",
    name: "HM Sports Demo",
    category: "Olahraga",
    servers: ["https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"],
    builtin: true,
    logo: "",
    poster: "",
    description: "Channel demo untuk menguji player HLS, server, dan mode theater."
  },
  {
    id: "hm-cinema-demo",
    name: "HM Cinema Demo",
    category: "Film",
    servers: ["https://test-streams.mux.dev/test_001/stream.m3u8"],
    builtin: true,
    logo: "",
    poster: "",
    description: "Channel demo bergaya sinematik untuk mengecek tampilan player luxury."
  }
];

const defaultUsers = [
  {
    id: "admin-default",
    username: "admin",
    password: "admin12345",
    role: "admin",
    premiumUntil: "",
    active: true,
    note: "Admin utama"
  },
  {
    id: "premium-default",
    username: "premium",
    password: "premium12345",
    role: "user",
    premiumUntil: "2099-12-31T23:59",
    active: true,
    note: "User premium demo"
  }
];

let state = loadState();
let currentUser = null;
let hls = null;
let activeChannel = null;
let activeServerIndex = 0;
let currentCategory = "Semua";
let toastTimer = null;
let clockTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const splashScreen = $("#splashScreen");
const loginPage = $("#loginPage");
const dashboardPage = $("#dashboardPage");
const loginForm = $("#loginForm");
const loginUsername = $("#loginUsername");
const loginPassword = $("#loginPassword");
const loginMessage = $("#loginMessage");

const welcomeText = $("#welcomeText");
const todayDate = $("#todayDate");
const liveClock = $("#liveClock");
const themeSelect = $("#themeSelect");
const rolePill = $("#rolePill");
const premiumPill = $("#premiumPill");
const summaryChannels = $("#summaryChannels");
const summaryFavorites = $("#summaryFavorites");
const summaryHistory = $("#summaryHistory");
const summaryUserName = $("#summaryUserName");
const summaryPremium = $("#summaryPremium");
const accountInitial = $("#accountInitial");

const openAdminBtn = $("#openAdminBtn");
const navAdminBtn = $("#navAdminBtn");
const quickAddStreamBtn = $("#quickAddStreamBtn");
const logoutBtn = $("#logoutBtn");
const railLogoutBtn = $("#railLogoutBtn");

const video = $("#videoPlayer");
const playerBackdrop = $("#playerBackdrop");
const playerCover = $("#playerCover");
const currentChannelText = $("#currentChannel");
const statusText = $("#statusText");
const activeServerText = $("#activeServerText");
const serverList = $("#serverList");
const reloadBtn = $("#reloadBtn");
const muteBtn = $("#muteBtn");
const pipBtn = $("#pipBtn");
const theaterBtn = $("#theaterBtn");
const fullscreenBtn = $("#fullscreenBtn");
const volumeRange = $("#volumeRange");
const volumeText = $("#volumeText");

const searchInput = $("#searchInput");
const categoryTabs = $("#categoryTabs");
const favoriteOnlyToggle = $("#favoriteOnlyToggle");
const channelCount = $("#channelCount");
const premiumNotice = $("#premiumNotice");
const channelList = $("#channelList");
const emptyState = $("#emptyState");

const nowPoster = $("#nowPoster");
const nowTitle = $("#nowTitle");
const nowMeta = $("#nowMeta");
const favoriteQuickList = $("#favoriteQuickList");
const historyList = $("#historyList");

const adminModal = $("#adminModal");
const closeAdminBtn = $("#closeAdminBtn");
const streamForm = $("#streamForm");
const streamEditId = $("#streamEditId");
const streamName = $("#streamName");
const streamCategory = $("#streamCategory");
const streamLogo = $("#streamLogo");
const streamPoster = $("#streamPoster");
const streamDescription = $("#streamDescription");
const streamUrls = $("#streamUrls");
const streamMessage = $("#streamMessage");
const resetStreamFormBtn = $("#resetStreamFormBtn");
const adminStreamList = $("#adminStreamList");

const userForm = $("#userForm");
const userEditId = $("#userEditId");
const userUsername = $("#userUsername");
const userPassword = $("#userPassword");
const userRole = $("#userRole");
const premiumUntil = $("#premiumUntil");
const userActive = $("#userActive");
const userNote = $("#userNote");
const userMessage = $("#userMessage");
const resetUserFormBtn = $("#resetUserFormBtn");
const adminUserList = $("#adminUserList");

const exportDataBtn = $("#exportDataBtn");
const importDataInput = $("#importDataInput");
const factoryResetBtn = $("#factoryResetBtn");
const toast = $("#toast");

init();

function init() {
  applyTheme(state.settings.theme || "royale");
  themeSelect.value = state.settings.theme || "royale";
  bindEvents();
  startClock();
  setVolume(1);
  restoreSession();
  setTimeout(() => splashScreen.classList.add("hide"), 650);
}

function bindEvents() {
  loginForm.addEventListener("submit", handleLogin);

  logoutBtn.addEventListener("click", logout);
  railLogoutBtn.addEventListener("click", logout);
  openAdminBtn.addEventListener("click", openAdminPanel);
  navAdminBtn.addEventListener("click", openAdminPanel);
  quickAddStreamBtn.addEventListener("click", () => {
    openAdminPanel();
    activateTab("streams");
  });
  closeAdminBtn.addEventListener("click", () => adminModal.close());

  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
    state.settings.theme = themeSelect.value;
    saveState();
  });

  $$(".nav-item[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  reloadBtn.addEventListener("click", () => {
    if (!activeChannel) return showToast("Pilih channel dulu.");
    playChannel(activeChannel, activeServerIndex);
  });

  muteBtn.addEventListener("click", toggleMute);
  theaterBtn.addEventListener("click", toggleTheaterMode);
  fullscreenBtn.addEventListener("click", () => {
    const target = document.querySelector(".player-shell");
    if (!document.fullscreenElement) target.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  pipBtn.addEventListener("click", async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
        await video.requestPictureInPicture();
      } else {
        showToast("Picture-in-Picture tidak didukung browser ini.");
      }
    } catch {
      showToast("Gagal membuka Picture-in-Picture.");
    }
  });

  volumeRange.addEventListener("input", () => setVolume(Number(volumeRange.value) / 100));
  video.addEventListener("volumechange", syncVolumeUi);
  video.addEventListener("playing", () => setStatus("Sedang live"));
  video.addEventListener("pause", () => {
    if (!video.ended && activeChannel) setStatus("Paused");
  });
  video.addEventListener("waiting", () => setStatus("Buffering..."));
  video.addEventListener("error", () => setStatus("Video gagal diputar"));

  searchInput.addEventListener("input", renderChannels);
  favoriteOnlyToggle.addEventListener("change", renderChannels);

  streamForm.addEventListener("submit", handleSaveStream);
  resetStreamFormBtn.addEventListener("click", resetStreamForm);
  userForm.addEventListener("submit", handleSaveUser);
  resetUserFormBtn.addEventListener("click", resetUserForm);

  $$(".chip-btn[data-days]").forEach((button) => {
    button.addEventListener("click", () => setPremiumFromNow(Number(button.dataset.days)));
  });

  $$(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  exportDataBtn.addEventListener("click", exportData);
  importDataInput.addEventListener("change", importData);
  factoryResetBtn.addEventListener("click", factoryReset);

  document.addEventListener("keydown", handleKeyboard);
}

function handleKeyboard(event) {
  const tag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

  if (event.key === "Escape" && adminModal.open) {
    adminModal.close();
    return;
  }

  if (event.code === "Space") {
    if (!activeChannel) return;
    event.preventDefault();
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  const key = event.key.toLowerCase();
  if (key === "m") toggleMute();
  if (key === "f") fullscreenBtn.click();
  if (key === "t") toggleTheaterMode();
  if (key === "r") reloadBtn.click();
}

function startClock() {
  updateClock();
  clearInterval(clockTimer);
  clockTimer = setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  todayDate.textContent = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(now);
  liveClock.textContent = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(now);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const normalized = {
        users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : clone(defaultUsers),
        channels: Array.isArray(parsed.channels) && parsed.channels.length ? parsed.channels : clone(defaultChannels),
        favorites: parsed.favorites && typeof parsed.favorites === "object" ? parsed.favorites : {},
        history: parsed.history && typeof parsed.history === "object" ? parsed.history : {},
        settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings : { theme: "royale" }
      };
      normalized.channels = normalized.channels.map(normalizeChannel);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    }
  }

  const initial = {
    users: clone(defaultUsers),
    channels: clone(defaultChannels),
    favorites: {},
    history: {},
    settings: { theme: "royale" }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function normalizeChannel(channel) {
  return {
    id: channel.id || makeId("channel"),
    name: channel.name || "Tanpa Nama",
    category: channel.category || "Lainnya",
    servers: Array.isArray(channel.servers) ? channel.servers : [],
    builtin: Boolean(channel.builtin),
    logo: channel.logo || "",
    poster: channel.poster || "",
    description: channel.description || `Channel ${channel.name || "live"} siap ditonton di HM TV Royale.`
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY) || LEGACY_SESSION_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  const user = state.users.find((item) => item.username === username && item.active);

  if (user) {
    currentUser = user;
    localStorage.setItem(SESSION_KEY, user.username);
    showDashboard();
  } else {
    showLogin();
  }
}

function handleLogin(event) {
  event.preventDefault();
  setFormMessage(loginMessage, "");

  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  const user = state.users.find((item) => item.username.toLowerCase() === username.toLowerCase());

  if (!user || user.password !== password) {
    return setFormMessage(loginMessage, "Username atau password salah.", true);
  }

  if (!user.active) {
    return setFormMessage(loginMessage, "Akun ini nonaktif. Hubungi admin.", true);
  }

  currentUser = user;
  localStorage.setItem(SESSION_KEY, user.username);
  loginForm.reset();
  showDashboard();
}

function logout() {
  destroyPlayer();
  activeChannel = null;
  activeServerIndex = 0;
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  resetPlayerUi();
  showLogin();
}

function showLogin() {
  loginPage.classList.remove("hidden");
  dashboardPage.classList.add("hidden");
}

function showDashboard() {
  loginPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");
  updateUserUi();
  renderCategoryTabs();
  renderChannels();
  renderSidebar();
  updateNowPlaying(null);
}

function updateUserUi() {
  const isAdminUser = isAdmin();
  const premium = hasPremiumAccess(currentUser);
  const favorites = getFavorites();
  const history = getHistory();

  welcomeText.textContent = `Selamat datang, ${currentUser.username}`;
  rolePill.textContent = isAdminUser ? "Admin" : "User";
  accountInitial.textContent = getInitials(currentUser.username).slice(0, 2);
  summaryUserName.textContent = currentUser.username;
  summaryPremium.textContent = isAdminUser ? "Admin akses penuh" : premium ? `Premium sampai ${formatDate(currentUser.premiumUntil)}` : "Premium tidak aktif";
  summaryChannels.textContent = String(state.channels.length);
  summaryFavorites.textContent = String(favorites.length);
  summaryHistory.textContent = String(history.length);

  $$(".admin-only").forEach((element) => element.classList.toggle("hidden", !isAdminUser));

  premiumPill.classList.remove("active", "expired");
  if (isAdminUser) {
    premiumPill.textContent = "Admin akses penuh";
    premiumPill.classList.add("active");
  } else if (premium) {
    premiumPill.textContent = "Premium aktif";
    premiumPill.classList.add("active");
  } else {
    premiumPill.textContent = "Premium habis";
    premiumPill.classList.add("expired");
  }

  premiumNotice.classList.toggle("show", !premium);
}

function hasPremiumAccess(user) {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  if (!user.premiumUntil) return false;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

function renderCategoryTabs() {
  const categories = ["Semua", ...new Set(state.channels.map((channel) => channel.category || "Lainnya"))].sort((a, b) => {
    if (a === "Semua") return -1;
    if (b === "Semua") return 1;
    return a.localeCompare(b);
  });

  if (!categories.includes(currentCategory)) currentCategory = "Semua";

  categoryTabs.innerHTML = categories.map((category) => {
    const active = category === currentCategory ? " active" : "";
    return `<button class="category-tab${active}" type="button" data-category="${escapeAttr(category)}">${escapeHtml(category)}</button>`;
  }).join("");

  categoryTabs.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      renderCategoryTabs();
      renderChannels();
    });
  });
}

function renderChannels() {
  const query = searchInput.value.trim().toLowerCase();
  const favorites = getFavorites();
  const onlyFavorites = favoriteOnlyToggle.checked;
  const canWatch = hasPremiumAccess(currentUser);

  const channels = state.channels.filter((channel) => {
    const text = [channel.name, channel.category, channel.description].join(" ").toLowerCase();
    const matchesSearch = text.includes(query);
    const matchesCategory = currentCategory === "Semua" || (channel.category || "Lainnya") === currentCategory;
    const matchesFavorite = !onlyFavorites || favorites.includes(channel.id);
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  channelCount.textContent = String(channels.length);
  channelList.innerHTML = "";
  emptyState.classList.toggle("show", channels.length === 0);

  channels.forEach((channel) => {
    const isActive = activeChannel && activeChannel.id === channel.id;
    const isFavorite = favorites.includes(channel.id);
    const card = document.createElement("article");
    card.className = `channel-card${isActive ? " active" : ""}${!canWatch ? " locked" : ""}`;
    card.dataset.id = channel.id;
    if (channel.poster) {
      card.style.setProperty("--poster", `url("${safeUrlForCss(channel.poster)}")`);
    }

    card.innerHTML = `
      <div class="card-top">
        <div class="channel-logo">${logoContent(channel)}</div>
        <div class="card-badges">
          ${!canWatch ? '<span class="lock-badge">PREMIUM</span>' : ""}
          <span class="badge">${channel.servers.length} server</span>
          <button class="favorite-btn${isFavorite ? " active" : ""}" type="button" title="Favorit">★</button>
        </div>
      </div>
      <div class="card-body">
        <h3>${escapeHtml(channel.name)}</h3>
        <p>${escapeHtml(channel.description || "Channel live stream siap ditonton.")}</p>
      </div>
      <div class="card-bottom">
        <span class="live-mini">LIVE</span>
        <span class="play-hint">${canWatch ? "Putar sekarang" : "Terkunci"}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      if (!hasPremiumAccess(currentUser)) {
        return showToast("Premium belum aktif atau sudah habis. Hubungi admin.");
      }
      playChannel(channel, 0);
    });

    card.querySelector(".favorite-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(channel.id);
    });

    channelList.appendChild(card);
  });
}

function logoContent(channel) {
  if (channel.logo) {
    return `<img src="${escapeAttr(channel.logo)}" alt="${escapeAttr(channel.name)} logo" loading="lazy" onerror="this.remove()" />`;
  }
  return escapeHtml(getInitials(channel.name));
}

function renderServers(channel) {
  serverList.innerHTML = "";
  channel.servers.forEach((url, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `server-btn${index === activeServerIndex ? " active" : ""}`;
    button.textContent = `Server ${index + 1}`;
    button.addEventListener("click", () => playChannel(channel, index));
    serverList.appendChild(button);
  });
}

function playChannel(channel, serverIndex = 0) {
  if (!hasPremiumAccess(currentUser)) {
    return showToast("Premium belum aktif atau sudah habis.");
  }

  if (!channel.servers[serverIndex]) {
    return showToast("Server channel tidak tersedia.");
  }

  activeChannel = channel;
  activeServerIndex = serverIndex;
  const url = channel.servers[serverIndex];

  playerCover.classList.add("hidden");
  currentChannelText.textContent = `${channel.name} • Server ${serverIndex + 1}`;
  activeServerText.textContent = `Server ${serverIndex + 1}`;
  setStatus("Memuat siaran...");
  renderServers(channel);
  renderChannels();
  rememberHistory(channel.id);
  renderSidebar();
  updateNowPlaying(channel);
  destroyPlayer();

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play().then(() => setStatus("Sedang live")).catch(() => setStatus("Klik play untuk mulai"));
    return;
  }

  if (!window.Hls || !Hls.isSupported()) {
    setStatus("Browser tidak mendukung HLS.");
    return showToast("HLS.js tidak termuat atau browser tidak mendukung HLS.");
  }

  hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90,
    maxBufferLength: 30
  });

  hls.loadSource(url);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play().then(() => setStatus("Sedang live")).catch(() => setStatus("Klik play untuk mulai"));
  });

  hls.on(Hls.Events.ERROR, (event, data) => {
    if (!data.fatal) return;
    setStatus("Stream error, mencoba server lain...");

    if (channel.servers.length > 1 && activeServerIndex < channel.servers.length - 1) {
      setTimeout(() => playChannel(channel, activeServerIndex + 1), 700);
      return;
    }

    setStatus("Stream gagal diputar");
    showToast("Semua server channel ini gagal diputar.");
  });
}

function destroyPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();
}

function resetPlayerUi() {
  playerCover.classList.remove("hidden");
  currentChannelText.textContent = "Belum ada channel";
  activeServerText.textContent = "-";
  serverList.innerHTML = "";
  setStatus("Siap memutar");
  updateNowPlaying(null);
}

function updateNowPlaying(channel) {
  if (!channel) {
    nowTitle.textContent = "Belum ada channel";
    nowMeta.textContent = "Pilih channel untuk memulai.";
    nowPoster.textContent = "HM";
    nowPoster.style.backgroundImage = "";
    playerBackdrop.style.background = "";
    return;
  }

  nowTitle.textContent = channel.name;
  nowMeta.textContent = `${channel.category || "Lainnya"} • ${channel.servers.length} server`;
  nowPoster.textContent = channel.logo || channel.poster ? "" : getInitials(channel.name);

  if (channel.poster) {
    nowPoster.style.backgroundImage = `linear-gradient(180deg, transparent, rgba(0,0,0,.55)), url("${safeUrlForCss(channel.poster)}")`;
    playerBackdrop.style.background = `radial-gradient(circle at center, var(--accent), transparent 48%), url("${safeUrlForCss(channel.poster)}")`;
    playerBackdrop.style.backgroundSize = "cover";
    playerBackdrop.style.backgroundPosition = "center";
  } else {
    nowPoster.style.backgroundImage = "";
    playerBackdrop.style.background = "radial-gradient(circle at center, var(--accent), transparent 58%)";
  }

  if (channel.logo && !channel.poster) {
    nowPoster.innerHTML = `<img src="${escapeAttr(channel.logo)}" alt="" onerror="this.remove()" />`;
  }
}

function setStatus(text) {
  statusText.textContent = text;
}

function setVolume(value) {
  const volume = Math.min(1, Math.max(0, Number(value) || 0));
  video.volume = volume;
  if (volume > 0 && video.muted) video.muted = false;
  syncVolumeUi();
}

function toggleMute() {
  video.muted = !video.muted;
  syncVolumeUi();
}

function syncVolumeUi() {
  const volume = video.muted ? 0 : Math.round(video.volume * 100);
  volumeText.textContent = `${volume}%`;
  muteBtn.textContent = video.muted || video.volume === 0 ? "Unmute" : "Mute";
  volumeRange.value = String(volume);
}

function toggleTheaterMode() {
  document.body.classList.toggle("theater-mode");
  theaterBtn.textContent = document.body.classList.contains("theater-mode") ? "Keluar Theater" : "Theater";
}

function getFavorites() {
  if (!currentUser) return [];
  return state.favorites[currentUser.username] || [];
}

function toggleFavorite(channelId) {
  if (!currentUser) return;
  const favorites = new Set(getFavorites());
  if (favorites.has(channelId)) favorites.delete(channelId);
  else favorites.add(channelId);
  state.favorites[currentUser.username] = Array.from(favorites);
  saveState();
  renderChannels();
  renderSidebar();
  updateUserUi();
}

function getHistory() {
  if (!currentUser) return [];
  return state.history[currentUser.username] || [];
}

function rememberHistory(channelId) {
  if (!currentUser) return;
  const history = getHistory().filter((id) => id !== channelId);
  history.unshift(channelId);
  state.history[currentUser.username] = history.slice(0, 10);
  saveState();
}

function renderSidebar() {
  renderQuickList(favoriteQuickList, getFavorites(), "Belum ada favorit. Tekan bintang di channel.");
  renderQuickList(historyList, getHistory(), "Belum ada riwayat tontonan.");
  updateUserUi();
}

function renderQuickList(container, ids, emptyText) {
  const channels = ids.map((id) => state.channels.find((channel) => channel.id === id)).filter(Boolean).slice(0, 6);
  if (!channels.length) {
    container.innerHTML = `<div class="side-empty">${escapeHtml(emptyText)}</div>`;
    return;
  }

  container.innerHTML = channels.map((channel) => `
    <button class="side-link" type="button" data-channel-id="${escapeAttr(channel.id)}">
      <span class="side-avatar">${logoContent(channel)}</span>
      <span>
        <strong>${escapeHtml(channel.name)}</strong>
        <small>${escapeHtml(channel.category || "Lainnya")} • ${channel.servers.length} server</small>
      </span>
    </button>
  `).join("");

  container.querySelectorAll("[data-channel-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const channel = state.channels.find((item) => item.id === button.dataset.channelId);
      if (!channel) return;
      if (!hasPremiumAccess(currentUser)) return showToast("Premium belum aktif atau sudah habis.");
      playChannel(channel, 0);
    });
  });
}

function openAdminPanel() {
  if (!isAdmin()) return showToast("Hanya admin yang bisa membuka panel ini.");
  resetStreamForm();
  resetUserForm();
  renderAdminLists();
  adminModal.showModal();
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function activateTab(name) {
  $$(".tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.tab === name));
  $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${name}`));
}

function handleSaveStream(event) {
  event.preventDefault();
  if (!isAdmin()) return setFormMessage(streamMessage, "Hanya admin yang bisa menambah stream.", true);

  const name = streamName.value.trim();
  const category = streamCategory.value.trim() || "Lainnya";
  const logo = streamLogo.value.trim();
  const poster = streamPoster.value.trim();
  const description = streamDescription.value.trim() || `Channel ${name} dalam kategori ${category}.`;
  const servers = streamUrls.value.split("\n").map((url) => url.trim()).filter(Boolean);

  if (!name || !servers.length) {
    return setFormMessage(streamMessage, "Nama channel dan URL stream wajib diisi.", true);
  }

  const invalidServer = servers.find((url) => !isValidM3u8Url(url));
  if (invalidServer) {
    return setFormMessage(streamMessage, `URL stream tidak valid: ${invalidServer}. Pakai HTTPS dan .m3u8.`, true);
  }

  if (logo && !isValidHttpsUrl(logo)) {
    return setFormMessage(streamMessage, "Logo harus URL HTTPS valid.", true);
  }

  if (poster && !isValidHttpsUrl(poster)) {
    return setFormMessage(streamMessage, "Poster harus URL HTTPS valid.", true);
  }

  const editId = streamEditId.value;

  if (editId) {
    const index = state.channels.findIndex((channel) => channel.id === editId);
    if (index === -1) return setFormMessage(streamMessage, "Stream tidak ditemukan.", true);
    state.channels[index] = {
      ...state.channels[index],
      name,
      category,
      logo,
      poster,
      description,
      servers,
      builtin: false
    };
    setFormMessage(streamMessage, "Stream berhasil diperbarui.");
  } else {
    state.channels.unshift({
      id: makeId("channel"),
      name,
      category,
      logo,
      poster,
      description,
      servers,
      builtin: false
    });
    setFormMessage(streamMessage, "Stream berhasil ditambahkan.");
  }

  saveState();
  resetStreamForm(false);
  renderCategoryTabs();
  renderChannels();
  renderSidebar();
  renderAdminLists();
  updateUserUi();
}

function isValidM3u8Url(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /\.m3u8(\?.*)?$/i.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resetStreamForm(clearMessage = true) {
  streamForm.reset();
  streamEditId.value = "";
  if (clearMessage) setFormMessage(streamMessage, "");
}

function handleSaveUser(event) {
  event.preventDefault();
  if (!isAdmin()) return setFormMessage(userMessage, "Hanya admin yang bisa mengatur user.", true);

  const username = userUsername.value.trim();
  const password = userPassword.value;
  const role = userRole.value;
  const premium = premiumUntil.value;
  const active = userActive.value === "true";
  const note = userNote.value.trim();
  const editId = userEditId.value;

  if (!username) return setFormMessage(userMessage, "Username wajib diisi.", true);

  const usernameExists = state.users.some((user) => user.username.toLowerCase() === username.toLowerCase() && user.id !== editId);
  if (usernameExists) return setFormMessage(userMessage, "Username sudah dipakai.", true);

  if (!editId && password.length < 6) {
    return setFormMessage(userMessage, "Password minimal 6 karakter untuk user baru.", true);
  }

  if (editId) {
    const index = state.users.findIndex((user) => user.id === editId);
    if (index === -1) return setFormMessage(userMessage, "User tidak ditemukan.", true);

    const previousUsername = state.users[index].username;
    state.users[index] = {
      ...state.users[index],
      username,
      role,
      premiumUntil: role === "admin" ? "" : premium,
      active,
      note
    };

    if (password) state.users[index].password = password;

    if (previousUsername !== username) {
      state.favorites[username] = state.favorites[previousUsername] || [];
      state.history[username] = state.history[previousUsername] || [];
      delete state.favorites[previousUsername];
      delete state.history[previousUsername];
    }

    if (currentUser.id === editId) {
      currentUser = state.users[index];
      localStorage.setItem(SESSION_KEY, currentUser.username);
      updateUserUi();
      renderSidebar();
    }

    setFormMessage(userMessage, "User berhasil diperbarui.");
  } else {
    state.users.push({
      id: makeId("user"),
      username,
      password,
      role,
      premiumUntil: role === "admin" ? "" : premium,
      active,
      note
    });
    setFormMessage(userMessage, "User berhasil ditambahkan.");
  }

  saveState();
  resetUserForm(false);
  renderAdminLists();
}

function resetUserForm(clearMessage = true) {
  userForm.reset();
  userEditId.value = "";
  userRole.value = "user";
  userActive.value = "true";
  if (clearMessage) setFormMessage(userMessage, "");
}

function setPremiumFromNow(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  premiumUntil.value = toDateTimeLocal(date);
}

function renderAdminLists() {
  renderAdminStreamList();
  renderAdminUserList();
}

function renderAdminStreamList() {
  adminStreamList.innerHTML = "";

  state.channels.forEach((channel) => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(channel.name)}</h3>
        <p>${escapeHtml(channel.category || "Lainnya")} • ${channel.servers.length} server • ${channel.builtin ? "Bawaan" : "Custom"}</p>
        <p>${escapeHtml(channel.description || "-")}</p>
      </div>
      <div class="admin-actions">
        <button class="btn ghost" type="button" data-action="edit">Edit</button>
        <button class="btn danger" type="button" data-action="delete">Hapus</button>
      </div>
    `;

    item.querySelector('[data-action="edit"]').addEventListener("click", () => {
      streamEditId.value = channel.id;
      streamName.value = channel.name;
      streamCategory.value = channel.category || "Lainnya";
      streamLogo.value = channel.logo || "";
      streamPoster.value = channel.poster || "";
      streamDescription.value = channel.description || "";
      streamUrls.value = channel.servers.join("\n");
      activateTab("streams");
      setFormMessage(streamMessage, "Mode edit stream.");
      streamName.focus();
    });

    item.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm(`Hapus stream ${channel.name}?`)) return;
      state.channels = state.channels.filter((itemChannel) => itemChannel.id !== channel.id);
      Object.keys(state.favorites).forEach((username) => {
        state.favorites[username] = (state.favorites[username] || []).filter((id) => id !== channel.id);
      });
      Object.keys(state.history).forEach((username) => {
        state.history[username] = (state.history[username] || []).filter((id) => id !== channel.id);
      });
      if (activeChannel && activeChannel.id === channel.id) {
        destroyPlayer();
        activeChannel = null;
        resetPlayerUi();
      }
      saveState();
      renderCategoryTabs();
      renderChannels();
      renderSidebar();
      renderAdminStreamList();
      updateUserUi();
    });

    adminStreamList.appendChild(item);
  });
}

function renderAdminUserList() {
  adminUserList.innerHTML = "";

  state.users.forEach((user) => {
    const premiumText = user.role === "admin" ? "Akses penuh" : user.premiumUntil ? formatDate(user.premiumUntil) : "Tidak premium";
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(user.username)} ${user.active ? "" : "• Nonaktif"}</h3>
        <p>Role: ${escapeHtml(user.role)} • Premium sampai: ${escapeHtml(premiumText)}</p>
        <p>${escapeHtml(user.note || "Tidak ada catatan")}</p>
      </div>
      <div class="admin-actions">
        <button class="btn ghost" type="button" data-action="edit">Edit</button>
        <button class="btn danger" type="button" data-action="delete">Hapus</button>
      </div>
    `;

    item.querySelector('[data-action="edit"]').addEventListener("click", () => {
      userEditId.value = user.id;
      userUsername.value = user.username;
      userPassword.value = "";
      userRole.value = user.role;
      premiumUntil.value = user.premiumUntil || "";
      userActive.value = String(user.active);
      userNote.value = user.note || "";
      activateTab("users");
      setFormMessage(userMessage, "Mode edit user. Kosongkan password jika tidak diganti.");
      userUsername.focus();
    });

    item.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (state.users.length <= 1) return showToast("Minimal harus ada satu user.");
      if (user.id === currentUser.id) return showToast("Tidak bisa menghapus akun yang sedang login.");
      if (!confirm(`Hapus user ${user.username}?`)) return;
      state.users = state.users.filter((itemUser) => itemUser.id !== user.id);
      delete state.favorites[user.username];
      delete state.history[user.username];
      saveState();
      renderAdminUserList();
    });

    adminUserList.appendChild(item);
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hm-tv-royale-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (!Array.isArray(imported.users) || !Array.isArray(imported.channels)) {
        throw new Error("Format backup salah.");
      }

      state = {
        users: imported.users,
        channels: imported.channels.map(normalizeChannel),
        favorites: imported.favorites && typeof imported.favorites === "object" ? imported.favorites : {},
        history: imported.history && typeof imported.history === "object" ? imported.history : {},
        settings: imported.settings && typeof imported.settings === "object" ? imported.settings : { theme: "royale" }
      };

      saveState();
      currentUser = state.users.find((user) => user.username === currentUser?.username) || state.users.find((user) => user.role === "admin") || null;

      if (currentUser) {
        localStorage.setItem(SESSION_KEY, currentUser.username);
        applyTheme(state.settings.theme || "royale");
        themeSelect.value = state.settings.theme || "royale";
        showDashboard();
      } else {
        logout();
      }

      showToast("Import data berhasil.");
      renderAdminLists();
    } catch (error) {
      showToast(error.message || "Gagal import data.");
    } finally {
      importDataInput.value = "";
    }
  };
  reader.readAsText(file);
}

function factoryReset() {
  if (!confirm("Reset semua data ke bawaan? Semua user, stream custom, favorit, history, dan tema akan hilang.")) return;
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(SESSION_KEY);
  LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  state = loadState();
  currentUser = null;
  adminModal.close();
  logout();
  applyTheme("royale");
  themeSelect.value = "royale";
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "HM";
}

function makeId(prefix) {
  if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function toDateTimeLocal(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setFormMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function safeUrlForCss(url) {
  return String(url).replaceAll('"', "%22").replaceAll(")", "%29");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
