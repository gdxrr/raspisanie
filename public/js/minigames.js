export function closeMinigamesModal() {
  const overlay = document.getElementById("minigamesOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function openBlockBlastFromMinigames() {
  closeMinigamesModal();
  if (typeof window.blockBlastRestart === "function") window.blockBlastRestart();
  const overlay = document.getElementById("blockBlastOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeBlockBlastModal() {
  const overlay = document.getElementById("blockBlastOverlay");
  if (overlay) overlay.classList.remove("open");
}

export function openCasinoFromMinigames() {
  closeMinigamesModal();
  if (typeof window.openCasinoModal === "function") window.openCasinoModal();
}

export function openBetsFromMinigames() {
  closeMinigamesModal();
  if (typeof window.openBetsModal === "function") window.openBetsModal();
}

export function openMonopolyFromMinigames() {
  closeMinigamesModal();
  if (typeof window.openMonopolyModal === "function") window.openMonopolyModal();
}

export function openD20FromMinigames() {
  closeMinigamesModal();
  if (typeof window.openD20Modal === "function") window.openD20Modal();
}
