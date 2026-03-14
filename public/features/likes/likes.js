export async function sendLike() {
  const btn = document.getElementById("likeBtn");
  if (btn) {
    btn.classList.add("just-liked");
    setTimeout(() => btn.classList.remove("just-liked"), 200);
  }
  try {
    await fetch("/api/like", { method: "POST" });
  } catch (e) {
    console.error(e);
  }
}

export async function openLikesModal() {
  const el = document.getElementById("likesCountDisplay");
  if (el) el.textContent = "…";
  document.getElementById("likesOverlay").classList.add("open");
  try {
    const res = await fetch("/api/likes");
    const data = res.ok ? await res.json() : {};
    if (el) el.textContent = String(data.count != null ? data.count : "—");
  } catch (e) {
    console.error(e);
    if (el) el.textContent = "—";
  }
}

export function closeLikesModal() {
  document.getElementById("likesOverlay").classList.remove("open");
}

export function initLikes() {
  const overlay = document.getElementById("likesOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) closeLikesModal();
    });
  }
}
