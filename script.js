// === SISTEM DATA BASE SEDERHANA (STATE MANAGEMENT) ===
let userData = {
  name: "Pengguna",
  phone: "081234567890",
  email: "user@email.com",
  pin: "123456", // Default PIN jika belum daftar
};

let isLoggedIn = false;
let currentBalance = 500000;
let isBalanceHidden = false;
let selectedPrice = 0,
  selectedProductName = "",
  currentService = "",
  currentGame = "ml";
let pendingTopUpAmount = 0;

// Menunggu HTML selesai dibaca sebelum menjalankan animasi (MENCEGAH ERROR)
document.addEventListener("DOMContentLoaded", () => {
  attachRipple();
  updateProfileUI();
});

// === EFEK RIPPLE (GELOMBANG ANIMASI) ===
function attachRipple() {
  document.querySelectorAll(".ripple").forEach((button) => {
    if (!button.hasAttribute("data-ripple")) {
      button.setAttribute("data-ripple", "true");
      button.addEventListener("click", function (e) {
        let circle = document.createElement("span");
        circle.classList.add("ripple-effect");
        this.appendChild(circle);
        let rect = this.getBoundingClientRect(),
          d = Math.max(this.clientWidth, this.clientHeight);
        circle.style.width = circle.style.height = d + "px";
        circle.style.left = e.clientX - rect.left - d / 2 + "px";
        circle.style.top = e.clientY - rect.top - d / 2 + "px";
        setTimeout(() => circle.remove(), 700);
      });
    }
  });
}

// === FITUR MATA (HIDE/SHOW SALDO) ===
function toggleBalance(e) {
  e.stopPropagation();
  isBalanceHidden = !isBalanceHidden;
  const balElement = document.getElementById("display-balance");
  const eyeIcon = document.getElementById("eye-icon");
  if (isBalanceHidden) {
    balElement.innerText = "Rp •••••••";
    eyeIcon.className = "fas fa-eye-slash eye-btn";
  } else {
    balElement.innerText = formatRp(currentBalance);
    eyeIcon.className = "fas fa-eye eye-btn";
  }
}

// === FITUR LOGIN & REGISTER (AKUN) ===
function toggleAuth(type) {
  document
    .getElementById("btn-tab-login")
    .classList.toggle("active", type === "login");
  document
    .getElementById("btn-tab-register")
    .classList.toggle("active", type === "register");
  document.getElementById("form-login-area").style.display =
    type === "login" ? "block" : "none";
  document.getElementById("form-register-area").style.display =
    type === "register" ? "block" : "none";
}

function registerUser() {
  const nameInput = document.getElementById("reg-name").value;
  const phoneInput = document.getElementById("reg-phone").value;
  const emailInput = document.getElementById("reg-email").value;
  const pinInput = document.getElementById("reg-pin").value;

  if (!nameInput || !phoneInput || !emailInput || !pinInput) {
    alert("Gagal! Harap isi semua kolom pendaftaran dengan lengkap.");
    return;
  }

  // SIMPAN PIN KE DATABASE SEMENTARA
  userData.name = nameInput;
  userData.phone = phoneInput;
  userData.email = emailInput;
  userData.pin = pinInput;

  isLoggedIn = true;
  closeModal("modal-login");
  updateProfileUI();

  document.getElementById("reg-name").value = "";
  document.getElementById("reg-phone").value = "";
  document.getElementById("reg-email").value = "";
  document.getElementById("reg-pin").value = "";

  alert("✅ Akun Berhasil Dibuat!\nSelamat datang, " + userData.name);
  switchTab("profile");
}

function loginUser(msg) {
  isLoggedIn = true;
  closeModal("modal-login");
  updateProfileUI();
  alert(msg);
  switchTab("profile");
}

function logoutUser() {
  isLoggedIn = false;
  alert("Berhasil keluar dengan aman.");
  document.getElementById("header-user-text").innerText = "Masuk Akun";
  switchTab("home");
}

function updateProfileUI() {
  document.getElementById("header-user-text").innerText = userData.name;
  document.getElementById("profile-name").innerText = userData.name;
  document.getElementById("profile-phone").innerText = userData.phone;
  document.getElementById("profile-email").innerText = userData.email;
}

// === FITUR TOP UP SALDO ===
function openTopUpModal() {
  if (!isLoggedIn) {
    alert("Silakan Akses Akun terlebih dahulu!");
    openModal("modal-login");
    return;
  }
  document.getElementById("input-topup").value = "";
  document
    .querySelectorAll(".topup-card")
    .forEach((c) => c.classList.remove("active"));
  openModal("modal-topup");
}

// Format Rupiah (digunakan untuk Top Up dan Input Nominal Manual Transfer)
function formatRupiahInput(element) {
  let value = element.value.replace(/[^,\d]/g, "").toString();
  let split = value.split(",");
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    let separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }
  rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;
  element.value = rupiah;
}

// Khusus mengecek saldo saat ngetik manual di form transfer
function checkManualBalance(element) {
  formatRupiahInput(element);
  let amount = parseInt(element.value.replace(/\./g, ""));
  const warning = document.getElementById("saldo-warning");

  // Auto peringatan merah jika saldo kurang
  if (!isNaN(amount) && amount > currentBalance) {
    warning.style.display = "block";
  } else {
    warning.style.display = "none";
  }
}

function formatTopUpInput(element) {
  formatRupiahInput(element);
  document
    .querySelectorAll(".topup-card")
    .forEach((c) => c.classList.remove("active"));
}

function selectTopUpNominal(element, amountStr) {
  document
    .querySelectorAll(".topup-card")
    .forEach((c) => c.classList.remove("active"));
  element.classList.add("active");
  document.getElementById("input-topup").value = amountStr;
}

function generateVirtualAccount() {
  let rawValue = document
    .getElementById("input-topup")
    .value.replace(/\./g, "");
  let amount = parseInt(rawValue);
  if (isNaN(amount) || amount < 10000) {
    alert("Minimal top up Rp 10.000");
    return;
  }
  pendingTopUpAmount = amount;
  document.getElementById("gateway-amount").innerText = formatRp(amount);
  closeModal("modal-topup");
  openModal("modal-gateway");
}

function successTopUp() {
  currentBalance += pendingTopUpAmount;
  updateBalanceUI();
  const list = document.getElementById("history-list");
  if (list.innerHTML.includes("Belum ada")) list.innerHTML = "";
  list.insertAdjacentHTML(
    "afterbegin",
    `<div class="history-item ripple ripple-dark" style="animation: fadeIn 0.4s ease;"><div style="display: flex; gap: 16px; align-items: center;"><div class="history-icon" style="color: #059669; background: #d1fae5; box-shadow:0 4px 15px rgba(5,150,105,0.2);"><i class="fas fa-arrow-down"></i></div><div class="history-detail"><h4>Isi Saldo</h4><p>VA BCA / DANA</p></div></div><div class="history-status"><h4 style="color: #059669;">+ ${formatRp(pendingTopUpAmount)}</h4><span class="badge success">Berhasil</span></div></div>`,
  );
  alert(
    `✅ Saldo Rp ${pendingTopUpAmount.toLocaleString("id-ID")} berhasil ditambahkan.`,
  );
  closeModal("modal-gateway");
  attachRipple();
  switchTab("history");
}

// === FITUR TRANSAKSI LAYANAN (PULSA, DATA, DLL) ===
const dataPulsa = [
  5000, 7000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000,
  70000, 80000, 90000, 100000, 150000, 200000, 250000, 300000, 350000, 400000,
  450000, 500000,
];
const dataInternet = [
  { nama: "1 GB / 7 Hari", harga: 5500 },
  { nama: "10 GB / 30 Hari", harga: 75000 },
  { nama: "50 GB / 30 Hari", harga: 180000 },
];
const dataTelepon = [
  { nama: "Nelpon 100 Menit", harga: 10000 },
  { nama: "Nelpon Sepuasnya", harga: 80000 },
];
const dataML = [
  { nama: "5 Diamonds", harga: 1500 },
  { nama: "86 Diamonds", harga: 20000 },
  { nama: "172 Diamonds", harga: 40000 },
  { nama: "Weekly Pass", harga: 28000 },
];
const dataFF = [
  { nama: "70 Diamonds", harga: 10000 },
  { nama: "140 Diamonds", harga: 20000 },
  { nama: "355 Diamonds", harga: 50000 },
];
const dataPUBG = [
  { nama: "60 UC", harga: 15000 },
  { nama: "325 UC", harga: 75000 },
  { nama: "660 UC", harga: 150000 },
];
const dataRoblox = [
  { nama: "80 Roblox", harga: 15000 },
  { nama: "400 Roblox", harga: 75000 },
  { nama: "800 Roblox", harga: 150000 },
];

const formatRp = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);

// --- FITUR DETEKSI OPERATOR & BANK OTOMATIS CERDAS ---
function checkOperator() {
  if (
    currentService !== "pulsa" &&
    currentService !== "data" &&
    currentService !== "bank" &&
    currentService !== "ewallet"
  ) {
    document.getElementById("operator-badge").style.display = "none";
    return;
  }

  const input = document
    .getElementById("input-number")
    .value.replace(/[^0-9]/g, "");
  const badge = document.getElementById("operator-badge");

  if (
    (input.length < 4 &&
      (currentService === "pulsa" ||
        currentService === "data" ||
        currentService === "ewallet")) ||
    (input.length < 1 && currentService === "bank")
  ) {
    badge.style.display = "none";
    return;
  }

  let opName = "",
    opColor = "";

  if (
    currentService === "pulsa" ||
    currentService === "data" ||
    currentService === "ewallet"
  ) {
    const px = input.substring(0, 4);
    if (
      ["0811", "0812", "0813", "0821", "0822", "0851", "0852", "0853"].includes(
        px,
      )
    ) {
      opName = "Telkomsel";
      opColor = "#ed1c24";
    } else if (
      ["0814", "0815", "0816", "0855", "0856", "0857", "0858"].includes(px)
    ) {
      opName = "Indosat";
      opColor = "#ffcb00";
    } else if (["0817", "0818", "0819", "0859", "0877", "0878"].includes(px)) {
      opName = "XL";
      opColor = "#002561";
    } else if (["0831", "0832", "0833", "0838"].includes(px)) {
      opName = "AXIS";
      opColor = "#612c86";
    } else if (["0895", "0896", "0897", "0898", "0899"].includes(px)) {
      opName = "Tri (3)";
      opColor = "#0f172a";
    } else if (
      [
        "0881",
        "0882",
        "0883",
        "0884",
        "0885",
        "0886",
        "0887",
        "0888",
        "0889",
      ].includes(px)
    ) {
      opName = "Smartfren";
      opColor = "#e61c39";
    }
  } else if (currentService === "bank") {
    const pxBank = input.substring(0, 1);
    if (pxBank === "0") {
      opName = "Bank BCA";
      opColor = "#005bea";
    } else if (pxBank === "1") {
      opName = "Bank Mandiri";
      opColor = "#f59e0b";
    } else if (pxBank === "2") {
      opName = "Bank BNI";
      opColor = "#f97316";
    } else if (pxBank === "3") {
      opName = "Bank BRI";
      opColor = "#0284c7";
    } else if (pxBank === "4") {
      opName = "CIMB Niaga";
      opColor = "#9f1239";
    } else if (pxBank === "5") {
      opName = "PermataBank";
      opColor = "#059669";
    } else if (pxBank === "6") {
      opName = "Bank Danamon";
      opColor = "#ea580c";
    } else if (pxBank === "7") {
      opName = "BSI Syariah";
      opColor = "#0d9488";
    } else if (pxBank === "8") {
      opName = "Bank Jago";
      opColor = "#f97316";
    } else if (pxBank === "9") {
      opName = "SeaBank";
      opColor = "#f43f5e";
    }
  }

  if (opName !== "") {
    badge.innerText = opName;
    badge.style.background = opColor;
    badge.style.color = opName === "Indosat" ? "black" : "white";
    badge.style.display = "block";
  } else {
    badge.style.display = "none";
  }
}

function showService(element, serviceType) {
  currentService = serviceType;
  selectedPrice = 0;
  document
    .querySelectorAll(".service-item")
    .forEach((el) => el.classList.remove("active-service"));
  element.classList.add("active-service");

  document.getElementById("form-transaction").style.display = "block";

  // Sembunyikan semua komponen spesifik terlebih dahulu
  [
    "data-tabs",
    "game-selector-group",
    "provider-group",
    "operator-badge",
    "manual-input-group",
    "product-container",
    "saldo-warning",
  ].forEach((id) => {
    if (document.getElementById(id))
      document.getElementById(id).style.display = "none";
  });

  document.getElementById("input-number").value = "";
  if (document.getElementById("manual-nominal"))
    document.getElementById("manual-nominal").value = "";

  // Logika Pengaturan Form Berdasarkan Menu
  if (serviceType === "pulsa") {
    document.getElementById("form-title").innerText = "Isi Pulsa";
    document.getElementById("form-label").innerText = "Nomor HP Tujuan";
    document.getElementById("input-number").placeholder =
      "Ketik nomor di sini...";
    document.getElementById("product-container").style.display = "grid";
    renderProducts(dataPulsa, "pulsa");
  } else if (serviceType === "data") {
    document.getElementById("form-title").innerText = "Paket Data";
    document.getElementById("form-label").innerText = "Nomor HP Tujuan";
    document.getElementById("input-number").placeholder =
      "Ketik nomor di sini...";
    document.getElementById("data-tabs").style.display = "flex";
    document.getElementById("product-container").style.display = "grid";
    renderData("internet");
  } else if (serviceType === "game") {
    document.getElementById("form-title").innerText = "Top Up Game";
    document.getElementById("game-selector-group").style.display = "block";
    document.getElementById("product-container").style.display = "grid";
    selectGame("ml", document.querySelector(".game-card"));
  }
  // MENGAKTIFKAN INPUT NOMINAL MANUAL UNTUK BANK DAN E-WALLET
  else if (serviceType === "bank") {
    document.getElementById("form-title").innerText = "Transfer Bank";
    document.getElementById("form-label").innerText = "Nomor Rekening Tujuan";
    document.getElementById("input-number").placeholder =
      "Ketik rekening (0=BCA, 1=Mandiri...)";
    document.getElementById("manual-input-group").style.display = "block";
  } else if (serviceType === "ewallet") {
    document.getElementById("form-title").innerText = "Transfer E-Wallet";
    document.getElementById("form-label").innerText =
      "Nomor Akun DANA/OVO/GoPay";
    document.getElementById("input-number").placeholder =
      "Ketik nomor e-wallet...";
    document.getElementById("manual-input-group").style.display = "block";
  }

  setTimeout(
    () =>
      document
        .getElementById("form-transaction")
        .scrollIntoView({ behavior: "smooth", block: "center" }),
    200,
  );
}

function selectGame(gameId, element) {
  document
    .querySelectorAll(".game-card")
    .forEach((el) => el.classList.remove("active"));
  if (element) element.classList.add("active");
  currentGame = gameId;
  const label = document.getElementById("form-label");
  const input = document.getElementById("input-number");
  if (gameId === "ml") {
    label.innerText = "ID Player (Zone ID)";
    input.placeholder = "Ketik ID Player...";
    renderProducts(dataML, "game");
  } else if (gameId === "ff") {
    label.innerText = "ID Player Free Fire";
    input.placeholder = "Ketik ID Player...";
    renderProducts(dataFF, "game");
  } else if (gameId === "pubg") {
    label.innerText = "ID Karakter PUBG";
    input.placeholder = "Ketik ID Karakter...";
    renderProducts(dataPUBG, "game");
  } else if (gameId === "roblox") {
    label.innerText = "Username Roblox";
    input.placeholder = "Ketik Username...";
    renderProducts(dataRoblox, "game");
  }
}

function renderData(type) {
  document
    .getElementById("tab-internet")
    .classList.toggle("active", type === "internet");
  document
    .getElementById("tab-telepon")
    .classList.toggle("active", type === "telepon");
  renderProducts(type === "internet" ? dataInternet : dataTelepon, "paket");
}

function renderProducts(dataArray, type) {
  const container = document.getElementById("product-container");
  container.innerHTML = "";
  dataArray.forEach((item) => {
    let nama = "",
      hgInt = 0,
      hgStr = "";
    if (type === "pulsa" || type === "pln" || type === "topup") {
      nama = formatRp(item).replace("Rp", "");
      hgInt = item + (type === "topup" ? 1000 : 1500);
      hgStr = formatRp(hgInt);
    } else if (type === "paket") {
      nama = item.nama;
      hgInt = item.harga;
      hgStr = formatRp(hgInt);
    } else if (type === "game") {
      let icon =
        currentGame === "pubg" ? "💵" : currentGame === "roblox" ? "🪙" : "💎";
      nama = icon + " " + item.nama;
      hgInt = item.harga;
      hgStr = formatRp(hgInt);
    }

    const card = document.createElement("div");
    card.className = "nominal-card ripple ripple-dark";
    card.onclick = function () {
      document
        .querySelectorAll(".nominal-card")
        .forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      selectedPrice = hgInt;
      selectedProductName = nama;
    };
    const fSize = type === "paket" || type === "game" ? "13px" : "16px";
    card.innerHTML = `<h4 style="font-size: ${fSize};">${nama}</h4><p>${hgStr}</p>`;
    container.appendChild(card);
  });
  attachRipple();
}

// === ALUR PROSES PEMBAYARAN & MEMANGGIL MODAL PIN ===
function openPaymentModal() {
  if (!isLoggedIn) {
    alert("Silakan Login terlebih dahulu!");
    openModal("modal-login");
    return;
  }
  if (document.getElementById("input-number").value === "") {
    alert("Harap isi Nomor / ID tujuan!");
    return;
  }

  // Cek apakah menggunakan input nominal manual (Transfer)
  if (currentService === "bank" || currentService === "ewallet") {
    let rawVal = document
      .getElementById("manual-nominal")
      .value.replace(/\./g, "");
    selectedPrice = parseInt(rawVal);
    selectedProductName =
      "Transfer " + (currentService === "bank" ? "Bank" : "E-Wallet");
  }

  if (!selectedPrice || selectedPrice === 0) {
    alert("Pilih / Masukkan nominal terlebih dahulu!");
    return;
  }
  if (selectedPrice > currentBalance) {
    alert("Maaf, saldo Anda tidak mencukupi untuk transaksi ini.");
    return;
  }

  updateBalanceUI();
  openModal("modal-payment");
}

function processPayment(method) {
  if (method === "Saldo") {
    if (currentBalance >= selectedPrice) {
      // TUTUP MODAL PEMBAYARAN, BUKA MODAL PIN!
      closeModal("modal-payment");
      document.getElementById("verify-pin-input").value = ""; // Bersihkan kolom PIN
      openModal("modal-pin-verify");
    } else {
      alert(`❌ Saldo tidak cukup!\nSisa Saldo: ${formatRp(currentBalance)}`);
    }
  }
}

// === VERIFIKASI PIN & EKSEKUSI PEMOTONGAN SALDO ===
function verifyAndPay() {
  const enteredPin = document.getElementById("verify-pin-input").value;

  if (enteredPin === "") {
    alert("Harap masukkan 6 Digit PIN Anda!");
    return;
  }
  if (enteredPin !== userData.pin) {
    alert("❌ PIN yang Anda masukkan SALAH!");
    return;
  }

  // Jika PIN Benar, Eksekusi Saldo!
  currentBalance -= selectedPrice;
  updateBalanceUI();
  const list = document.getElementById("history-list");
  if (list.innerHTML.includes("Belum ada")) list.innerHTML = "";
  let icon = "fa-mobile-alt",
    col = "#3b82f6",
    bg = "#eff6ff";

  if (currentService === "game") {
    icon = "fa-gamepad";
    col = "#6366f1";
    bg = "#e0e7ff";
  } else if (currentService === "ewallet" || currentService === "bank") {
    icon = "fa-paper-plane";
    col = "#059669";
    bg = "#d1fae5";
  }

  list.insertAdjacentHTML(
    "afterbegin",
    `<div class="history-item ripple ripple-dark" style="animation: fadeIn 0.4s ease;"><div style="display:flex; gap:16px; align-items:center;"><div class="history-icon" style="color:${col}; background:${bg}; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><i class="fas ${icon}"></i></div><div><h4>${selectedProductName}</h4><p>${document.getElementById("input-number").value}</p></div></div><div><h4>${formatRp(selectedPrice)}</h4><span class="badge success">Berhasil</span></div></div>`,
  );

  alert(
    `✅ Transaksi Berhasil diproses!\nSaldo dipotong: Rp ${selectedPrice.toLocaleString("id-ID")}.`,
  );
  closeModal("modal-pin-verify");

  selectedPrice = 0;
  document.getElementById("input-number").value = "";
  if (document.getElementById("manual-nominal"))
    document.getElementById("manual-nominal").value = "";
  document
    .querySelectorAll(".nominal-card")
    .forEach((c) => c.classList.remove("active"));

  switchTab("history");
  attachRipple();
}

function updateBalanceUI() {
  if (!isBalanceHidden)
    document.getElementById("display-balance").innerText =
      formatRp(currentBalance);
  if (document.getElementById("modal-balance"))
    document.getElementById("modal-balance").innerText =
      formatRp(currentBalance);
}

function switchTab(tab) {
  if ((tab === "profile" || tab === "history") && !isLoggedIn) {
    openModal("modal-login");
    return;
  }
  document.getElementById("view-home").style.display =
    tab === "home" ? "block" : "none";
  document.getElementById("view-history").style.display =
    tab === "history" ? "block" : "none";
  document.getElementById("view-profile").style.display =
    tab === "profile" ? "block" : "none";
  document
    .getElementById("nav-home")
    .classList.toggle("active", tab === "home");
  document
    .getElementById("nav-history")
    .classList.toggle("active", tab === "history");
  document
    .getElementById("nav-profile")
    .classList.toggle("active", tab === "profile");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
