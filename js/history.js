/* ============================================
   SMART QR - LOCAL HISTORY
============================================ */

import { notify } from "./notifications.js";

const HISTORY_STORAGE_KEY = "smartQRHistoryV1";
const MAX_HISTORY_ITEMS = 100;

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("historyTableBody");
    const searchInput = document.getElementById("historySearch");
    const filterSelect = document.getElementById("historyFilter");
    const clearAllButton = document.getElementById("clearAllHistory");
    const totalCount = document.getElementById("historyTotalCount");
    const generatedCount = document.getElementById("historyGeneratedCount");
    const scannedCount = document.getElementById("historyScannedCount");
    const dashboardGeneratedCount = document.getElementById("dashboardGeneratedCount");
    const dashboardScannedCount = document.getElementById("dashboardScannedCount");
    const dashboardSavedCount = document.getElementById("dashboardSavedCount");
    const dashboardBatchCount = document.getElementById("dashboardBatchCount");
    const recentActivityList = document.getElementById("recentActivityList");
    const recentActivityEmpty = document.getElementById("recentActivityEmpty");
    if (!tableBody) return;

    let historyItems = readHistory();

    function readHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) throw new Error("History data is invalid.");
            return parsed
                .filter((item) => item && typeof item.id === "string" && typeof item.content === "string")
                .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        } catch (error) {
            console.error("Could not read QR history:", error);
            notify("Saved history could not be read from this browser.");
            return [];
        }
    }

    function persistHistory(items) {
        const next = [...items]
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
            .slice(0, MAX_HISTORY_ITEMS);
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
            historyItems = next;
            return true;
        } catch (error) {
            const isQuotaError = error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED";
            if (!isQuotaError) {
                console.error("Could not save QR history:", error);
                notify("Browser storage is unavailable. QR history was not saved.");
                return false;
            }

            const trimmed = [...next];
            while (trimmed.length > 1) {
                trimmed.pop();
                try {
                    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
                    historyItems = trimmed;
                    notify("History storage was full; older records were removed to save this QR.");
                    return true;
                } catch (retryError) {
                    if (retryError?.name !== "QuotaExceededError" && retryError?.name !== "NS_ERROR_DOM_QUOTA_REACHED") break;
                }
            }
            console.error("QR history could not fit in browser storage:", error);
            notify("Browser storage is full. This QR could not be added to history.");
            return false;
        }
    }

    function safeFilename(name, type) {
        const typeNames = { url: "Website", text: "Text", email: "Email", phone: "Phone", wifi: "Wi-Fi", vcard: "Contact" };
        const cleaned = String(name || "")
            .replace(/\.[a-z0-9]{2,5}$/i, "")
            .normalize("NFKD")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/[\s-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return cleaned || `QR-Code-${typeNames[type] || "Code"}`;
    }

    function formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
    }

    function createActionButton(label, action, icon) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-outline history-action";
        button.dataset.action = action;
        button.setAttribute("aria-label", label);
        button.title = label;
        const iconElement = document.createElement("i");
        iconElement.setAttribute("data-lucide", icon);
        button.append(iconElement, document.createTextNode(label));
        return button;
    }

    function filteredItems() {
        const query = (searchInput?.value || "").trim().toLowerCase();
        const filter = filterSelect?.value || "all";
        return historyItems.filter((item) => {
            const activity = item.activity || "generated";
            const matchesFilter = filter === "all" || filter === activity;
            return matchesFilter && `${item.name} ${item.type} ${item.content}`.toLowerCase().includes(query);
        });
    }

    function renderDashboard() {
        const generated = historyItems.filter((item) => (item.activity || "generated") === "generated");
        const scanned = historyItems.filter((item) => item.activity === "scanned");
        const batchRuns = new Set(historyItems
            .filter((item) => item.source === "batch")
            .map((item) => item.batchId || item.id));

        if (dashboardGeneratedCount) dashboardGeneratedCount.textContent = String(generated.length);
        if (dashboardScannedCount) dashboardScannedCount.textContent = String(scanned.length);
        if (dashboardSavedCount) dashboardSavedCount.textContent = String(historyItems.length);
        if (dashboardBatchCount) dashboardBatchCount.textContent = String(batchRuns.size);

        if (!recentActivityList || !recentActivityEmpty) return;
        recentActivityList.replaceChildren();
        const recent = historyItems.slice(0, 5);
        recentActivityList.hidden = recent.length === 0;
        recentActivityEmpty.hidden = recent.length > 0;
        recent.forEach((record) => {
            const item = document.createElement("article");
            item.className = "recent-activity-item";
            const marker = document.createElement("span");
            marker.className = `recent-activity-marker ${record.activity === "scanned" ? "is-scanned" : "is-generated"}`;
            marker.setAttribute("aria-hidden", "true");
            const details = document.createElement("div");
            details.className = "recent-activity-details";
            const title = document.createElement("strong");
            title.textContent = record.activity === "scanned"
                ? "QR code scanned"
                : (record.name || safeFilename("", record.type));
            const content = document.createElement("span");
            content.textContent = record.content.length > 100 ? `${record.content.slice(0, 97)}…` : record.content;
            content.title = record.content;
            details.append(title, content);
            const meta = document.createElement("time");
            meta.className = "recent-activity-time";
            meta.dateTime = record.createdAt || "";
            meta.textContent = formatDate(record.createdAt);
            item.append(marker, details, meta);
            recentActivityList.appendChild(item);
        });
    }

    function render() {
        const visibleItems = filteredItems();
        if (totalCount) totalCount.textContent = String(historyItems.length);
        if (generatedCount) generatedCount.textContent = String(historyItems.filter((item) => (item.activity || "generated") === "generated").length);
        if (scannedCount) scannedCount.textContent = String(historyItems.filter((item) => item.activity === "scanned").length);
        if (clearAllButton) clearAllButton.disabled = historyItems.length === 0;
        tableBody.replaceChildren();

        if (!visibleItems.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            const empty = document.createElement("div");
            empty.className = "table-empty";
            const icon = document.createElement("i");
            icon.setAttribute("data-lucide", "inbox");
            const heading = document.createElement("strong");
            const message = document.createElement("span");
            heading.textContent = historyItems.length ? "No matching records" : "No QR codes saved yet";
            message.textContent = historyItems.length
                ? "Try a different search or activity filter."
                : "QR codes you generate will appear here.";
            empty.append(icon, heading, message);
            cell.append(empty);
            row.append(cell);
            tableBody.append(row);
        } else {
            visibleItems.forEach((item) => {
                const row = document.createElement("tr");
                row.dataset.recordId = item.id;
                const nameCell = document.createElement("td");
                const typeCell = document.createElement("td");
                const contentCell = document.createElement("td");
                const dateCell = document.createElement("td");
                const actionCell = document.createElement("td");
                nameCell.textContent = item.name || safeFilename("", item.type);
                typeCell.textContent = String(item.type || "text").toUpperCase();
                contentCell.textContent = item.content.length > 64 ? `${item.content.slice(0, 61)}…` : item.content;
                contentCell.title = item.content;
                dateCell.textContent = formatDate(item.createdAt);
                actionCell.className = "history-actions-cell";
                actionCell.append(
                    createActionButton("Download", "download", "download"),
                    createActionButton("Regenerate", "regenerate", "refresh-cw"),
                    createActionButton("Delete", "delete", "trash-2")
                );
                row.append(nameCell, typeCell, contentCell, dateCell, actionCell);
                tableBody.append(row);
            });
        }
        if (window.lucide) window.lucide.createIcons();
        renderDashboard();
    }

    function compressLogo(dataUrl) {
        if (!dataUrl) return Promise.resolve("");
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                const maxEdge = 192;
                const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                const context = canvas.getContext("2d");
                if (!context) return resolve("");
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                try { resolve(canvas.toDataURL("image/jpeg", 0.72)); }
                catch { resolve(""); }
            };
            image.onerror = () => resolve("");
            image.src = dataUrl;
        });
    }

    async function saveGeneratedRecord(event) {
        const detail = event.detail || {};
        if (!detail.content || !detail.type) return;
        const createdAt = new Date().toISOString();
        const logo = await compressLogo(detail.logoData);
        const record = {
            id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            content: detail.content,
            type: detail.type,
            name: detail.name || "",
            activity: "generated",
            source: detail.source === "batch" ? "batch" : "generated",
            batchId: typeof detail.batchId === "string" ? detail.batchId : "",
            createdAt,
            settings: {
                foreground: detail.settings?.foreground || "#172554",
                background: detail.settings?.background || "#ffffff",
                size: Number(detail.settings?.size) || 256,
                margin: Number(detail.settings?.margin) || 12,
                errorCorrection: logo ? "H" : (detail.settings?.errorCorrection || "M"),
                logo
            }
        };
        if (persistHistory([record, ...historyItems])) render();
    }

    function saveScannedRecord(event) {
        const content = String(event.detail?.content || "");
        if (!content) return;
        const record = {
            id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            content,
            type: "scan",
            activity: "scanned",
            source: "scanner",
            name: "Scanned QR Code",
            createdAt: new Date().toISOString(),
            settings: { foreground: "#172554", background: "#ffffff", size: 256, margin: 12, errorCorrection: "M", logo: "" }
        };
        if (persistHistory([record, ...historyItems])) render();
    }

    async function downloadRecord(record) {
        if (typeof QRCodeStyling === "undefined") throw new Error("QR export library is unavailable.");
        const settings = record.settings || {};
        const qr = new QRCodeStyling({
            width: settings.size || 256,
            height: settings.size || 256,
            type: "canvas",
            data: record.content,
            image: settings.logo || undefined,
            margin: Number(settings.margin) || 12,
            qrOptions: { errorCorrectionLevel: settings.logo ? "H" : (settings.errorCorrection || "M") },
            dotsOptions: { color: settings.foreground || "#172554", type: "square" },
            cornersSquareOptions: { color: settings.foreground || "#172554", type: "square" },
            cornersDotOptions: { color: settings.foreground || "#172554", type: "square" },
            backgroundOptions: { color: settings.background || "#ffffff" },
            imageOptions: { hideBackgroundDots: true, imageSize: 0.2, margin: 6 }
        });
        const blob = await qr.getRawData("png");
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${safeFilename(record.name, record.type)}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        const row = button?.closest("tr[data-record-id]");
        if (!button || !row) return;
        const item = historyItems.find((record) => record.id === row.dataset.recordId);
        if (!item) return;

        if (button.dataset.action === "delete") {
            if (persistHistory(historyItems.filter((record) => record.id !== item.id))) {
                render();
                notify("QR code removed from history.", "success");
            }
        } else if (button.dataset.action === "regenerate") {
            window.dispatchEvent(new CustomEvent("qr:history-regenerate", { detail: item }));
        } else if (button.dataset.action === "download") {
            try {
                await downloadRecord(item);
                notify("History QR downloaded successfully.", "success");
            } catch (error) {
                console.error("History QR download failed:", error);
                notify("Unable to download this history item.");
            }
        }
    });

    searchInput?.addEventListener("input", render);
    filterSelect?.addEventListener("change", render);
    clearAllButton?.addEventListener("click", () => {
        if (!historyItems.length) return;
        if (!window.confirm("Clear all saved QR code history? This cannot be undone.")) return;
        if (persistHistory([])) {
            render();
            notify("All QR code history was cleared.", "success");
        }
    });

    window.addEventListener("qr:generated", saveGeneratedRecord);
    window.addEventListener("qr:scanned", saveScannedRecord);
    window.addEventListener("qr:history-regenerate", (event) => {
        window.dispatchEvent(new CustomEvent("qr:regenerate", { detail: event.detail }));
    });
    window.addEventListener("storage", (event) => {
        if (event.key === HISTORY_STORAGE_KEY) {
            historyItems = readHistory();
            render();
        }
    });

    render();
});
