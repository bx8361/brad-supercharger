export function showToast(root: HTMLElement, message: string, kind: "info" | "error" = "info"): void {
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
