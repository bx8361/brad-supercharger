import type { Dataset } from "../data/dataset";
import { t } from "../../i18n.js";

export function renderDataTable(
  container: HTMLElement,
  dataset: Dataset,
  selectedRow: number | null,
  onSelect: (row: number) => void,
): void {
  const maxRows = 100;
  const cols = dataset.columns.map((c) => c.name);
  const shown = dataset.rows.slice(0, maxRows);
  const thead = cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const tbody = shown
    .map((row, i) => {
      const selected = selectedRow === i ? "selected" : "";
      const cells = cols
        .map((c) => {
          const v = row[c];
          const cls = dataset.columns.find((col) => col.name === c)?.type === "numeric"
            ? "num"
            : "";
          return `<td class="${cls}">${escapeHtml(v === null ? "" : String(v))}</td>`;
        })
        .join("");
      return `<tr data-row="${i}" class="${selected}">${cells}</tr>`;
    })
    .join("");
  container.innerHTML = `
    <p class="table-caption">${escapeHtml(t("Showing first {shown} of {total} rows", { shown: shown.length, total: dataset.rows.length.toLocaleString() }))}</p>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
  container.querySelectorAll("tr[data-row]").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number((tr as HTMLElement).dataset.row);
      onSelect(idx);
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
