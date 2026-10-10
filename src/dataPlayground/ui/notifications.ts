import { t } from "../../i18n.js";

export function showToast(root: HTMLElement, message: string, kind: "info" | "error" = "info"): void {
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = t(message);
  root.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
