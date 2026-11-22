/* ============================================
   SMART QR - ASYNCHRONOUS BATCH GENERATOR
============================================ */

import { notify } from "./notifications.js";
import { normalizeWebsiteUrl } from "./validation.js";

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("batchContent");
    const generateButton = document.getElementById("batchGenerateButton");
    const clearButton = document.getElementById("batchClearButton");
    const zipButton = document.getElementById("batchDownloadZip");
    const status = document.getElementById("batchStatus");
    const successCount = document.getElementById("batchSuccessCount");
    const emptyState = document.getElementById("batchEmptyState");
    const resultsGrid = document.getElementById("batchResultsGrid");
    const errorsPanel = document.getElementById("batchErrors");
    const fileInput = document.getElementById("batchFile");
    const maxEntries = 250;
    let generatedItems = [];
    let isGenerating = false;

    if (!input || !generateButton || !resultsGrid) return;

    function validateEntry(value) {
        const text = value.trim();
        const looksLikeUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(text) || /^www\./i.test(text) ||
            (!text.includes("@") && /^[^\s/]+\.[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(text));
        if (!looksLikeUrl) return { content: text, type: "text" };

        const candidate = /^www\./i.test(text) || !/^[a-z][a-z\d+.-]*:\/\//i.test(text)
            ? `https://${text}`
            : text;
        return { content: normalizeWebsiteUrl(candidate), type: "url" };
    }

    function currentOptions() {
        const foreground = document.getElementById("foregroundColor")?.value || "#172554";
        const background = document.getElementById("backgroundColor")?.value || "#ffffff";
        const ratio = contrastRatio(foreground, background);
        return {
            foreground: ratio >= 4.5 ? foreground : "#172554",
            background: ratio >= 4.5 ? background : "#ffffff",
            size: 256,
            errorCorrection: "M"
        };
    }

    function contrastRatio(first, second) {
        function luminance(hex) {
            const channels = hex.replace("#", "").match(/.{2}/g)?.map((part) => {
                const value = parseInt(part, 16) / 255;
                return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
            if (!channels || channels.length !== 3) return 0;
            return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        }
        const a = luminance(first);
        const b = luminance(second);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }

    function safeFilename(index, type) {
        const label = type === "url" ? "Website" : "Text";
        return `QR-Code-${label}-${String(index + 1).padStart(3, "0")}`;
    }

    function createCard(item, index) {
        const card = document.createElement("article");
        card.className = "batch-qr-card";
        card.dataset.entryIndex = String(index);
        const qrContainer = document.createElement("div");
        qrContainer.className = "batch-qr-image";
        const content = document.createElement("p");
        content.className = "batch-qr-content";
        content.textContent = item.content;
        content.title = item.content;
        const download = document.createElement("button");
        download.type = "button";
        download.className = "btn btn-outline";
        download.innerHTML = '<i data-lucide="download"></i> Download PNG';
        download.addEventListener("click", async () => {
            try {
                const blob = await item.qr.getRawData("png");
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${item.name}.png`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                notify("QR code downloaded.", "success");
            } catch (error) {
                console.error("Batch QR download failed:", error);
                notify("Unable to download this QR code.");
            }
        });
        card.append(qrContainer, content, download);
        resultsGrid.appendChild(card);

        item.qr = new QRCodeStyling({
            width: item.settings.size,
            height: item.settings.size,
            type: "canvas",
            data: item.content,
            margin: 12,
            qrOptions: { errorCorrectionLevel: item.settings.errorCorrection },
            dotsOptions: { color: item.settings.foreground, type: "square" },
            cornersSquareOptions: { color: item.settings.foreground, type: "square" },
            cornersDotOptions: { color: item.settings.foreground, type: "square" },
            backgroundOptions: { color: item.settings.background }
        });
        item.qr.append(qrContainer);
        if (window.lucide) window.lucide.createIcons();
    }

    function renderErrors(errors) {
        if (!errorsPanel) return;
        errorsPanel.replaceChildren();
        errorsPanel.hidden = errors.length === 0;
        if (!errors.length) return;
        const title = document.createElement("strong");
        title.textContent = `${errors.length} entr${errors.length === 1 ? "y" : "ies"} could not be generated:`;
        const list = document.createElement("ul");
        errors.slice(0, 100).forEach((error) => {
            const item = document.createElement("li");
            item.textContent = `Line ${error.line}: ${error.message}`;
            list.appendChild(item);
        });
        if (errors.length > 100) {
            const more = document.createElement("li");
            more.textContent = `${errors.length - 100} additional errors omitted.`;
            list.appendChild(more);
        }
        errorsPanel.append(title, list);
    }

    async function generateAll() {
        if (isGenerating) return;
        if (typeof QRCodeStyling === "undefined") {
            notify("QR code library could not be loaded. Check your internet connection.");
            return;
        }

        const lines = input.value.split(/\r?\n/)
            .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
            .filter((entry) => entry.raw);
        if (!lines.length) {
            notify("Enter at least one URL or text entry first.");
            return;
        }

        const errors = [];
        if (lines.length > maxEntries) {
            errors.push({
                line: lines[maxEntries].line,
                message: `Batch has ${lines.length} entries. Only the first ${maxEntries} were processed.`
            });
        }
        const entries = lines.slice(0, maxEntries);
        generatedItems = [];
        resultsGrid.replaceChildren();
        if (emptyState) emptyState.hidden = true;
        if (zipButton) zipButton.disabled = true;
        if (successCount) successCount.textContent = "0";
        renderErrors([]);
        isGenerating = true;
        generateButton.disabled = true;
        if (clearButton) clearButton.disabled = true;
        const settings = currentOptions();
        const batchId = globalThis.crypto?.randomUUID?.() || `batch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const customColors = settings.foreground !== (document.getElementById("foregroundColor")?.value || "#172554") ||
            settings.background !== (document.getElementById("backgroundColor")?.value || "#ffffff");
        if (customColors) notify("Low contrast colors detected; using high-contrast defaults for this batch.");

        for (let index = 0; index < entries.length; index += 1) {
            const entry = entries[index];
            if (status) status.textContent = `Generating ${index + 1} of ${entries.length}…`;
            try {
                const validated = validateEntry(entry.raw);
                const item = {
                    ...validated,
                    name: safeFilename(index, validated.type),
                    settings: { ...settings },
                    qr: null
                };
                createCard(item, index);
                generatedItems.push(item);
                window.dispatchEvent(new CustomEvent("qr:generated", {
                    detail: {
                        content: item.content,
                        type: item.type,
                        name: item.name,
                        settings: item.settings,
                        source: "batch",
                        batchId,
                        logoData: ""
                    }
                }));
                if (successCount) successCount.textContent = String(generatedItems.length);
            } catch (error) {
                resultsGrid.querySelector(`[data-entry-index="${index}"]`)?.remove();
                errors.push({ line: entry.line, message: error.message || "QR generation failed." });
            }

            // Yield between small groups so layout, input and paint remain responsive.
            if ((index + 1) % 6 === 0) {
                await new Promise((resolve) => window.setTimeout(resolve, 0));
            }
        }

        renderErrors(errors);
        if (status) {
            status.textContent = `${generatedItems.length} QR code${generatedItems.length === 1 ? "" : "s"} generated${errors.length ? `; ${errors.length} entr${errors.length === 1 ? "y" : "ies"} had errors` : " successfully"}.`;
        }
        if (zipButton) zipButton.disabled = generatedItems.length === 0;
        if (emptyState) emptyState.hidden = generatedItems.length > 0;
        isGenerating = false;
        generateButton.disabled = false;
        if (clearButton) clearButton.disabled = false;
        if (generatedItems.length) notify(`${generatedItems.length} QR code${generatedItems.length === 1 ? "" : "s"} generated.`, "success");
    }

    async function downloadAllZip() {
        if (!generatedItems.length) return;
        if (typeof JSZip === "undefined") {
            notify("ZIP library could not be loaded. Check your internet connection.");
            return;
        }
        zipButton.disabled = true;
        generateButton.disabled = true;
        if (clearButton) clearButton.disabled = true;
        if (status) status.textContent = "Preparing QR images for ZIP…";
        try {
            const zip = new JSZip();
            for (let index = 0; index < generatedItems.length; index += 1) {
                const item = generatedItems[index];
                const blob = await item.qr.getRawData("png");
                zip.file(`${item.name}.png`, blob);
                if ((index + 1) % 8 === 0) {
                    if (status) status.textContent = `Preparing ${index + 1} of ${generatedItems.length} images…`;
                    await new Promise((resolve) => window.setTimeout(resolve, 0));
                }
            }
            const zipBlob = await zip.generateAsync(
                { type: "blob", compression: "STORE" },
                (progress) => {
                    if (status) status.textContent = `Creating ZIP… ${Math.round(progress.percent)}%`;
                }
            );
            const url = URL.createObjectURL(zipBlob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `Smart-QR-Batch-${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1500);
            if (status) status.textContent = `${generatedItems.length} QR codes generated and ready to download.`;
            notify("Batch ZIP downloaded successfully.", "success");
        } catch (error) {
            console.error("Batch ZIP creation failed:", error);
            if (status) status.textContent = "Could not prepare the ZIP file.";
            notify("Unable to create the batch ZIP. Try a smaller batch.");
        } finally {
            zipButton.disabled = generatedItems.length === 0;
            generateButton.disabled = false;
            if (clearButton) clearButton.disabled = false;
        }
    }

    function clearAll() {
        if (isGenerating) return;
        input.value = "";
        if (fileInput) fileInput.value = "";
        generatedItems = [];
        resultsGrid.replaceChildren();
        renderErrors([]);
        if (successCount) successCount.textContent = "0";
        if (zipButton) zipButton.disabled = true;
        if (emptyState) emptyState.hidden = false;
        if (status) status.textContent = "Your generated QR collection will appear here.";
    }

    function parseCsvFirstColumn(source) {
        const rows = [];
        let row = [];
        let cell = "";
        let quoted = false;

        for (let index = 0; index < source.length; index += 1) {
            const character = source[index];
            if (quoted) {
                if (character === '"' && source[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                } else if (character === '"') {
                    quoted = false;
                } else {
                    cell += character;
                }
            } else if (character === '"' && cell.length === 0) {
                quoted = true;
            } else if (character === ",") {
                row.push(cell);
                cell = "";
            } else if (character === "\n" || character === "\r") {
                if (character === "\r" && source[index + 1] === "\n") index += 1;
                row.push(cell);
                rows.push(row);
                row = [];
                cell = "";
            } else {
                cell += character;
            }
        }
        row.push(cell);
        rows.push(row);

        const firstValue = rows[0]?.[0]?.trim().toLowerCase();
        const hasHeader = ["url", "text", "content", "data", "qr content"].includes(firstValue);
        return rows
            .slice(hasHeader ? 1 : 0)
            .map((values) => values[0]?.trim() || "")
            .filter(Boolean);
    }

    fileInput?.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            notify("Choose a .csv file.");
            fileInput.value = "";
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            notify("The CSV file must be 2 MB or smaller.");
            fileInput.value = "";
            return;
        }
        try {
            const entries = parseCsvFirstColumn(await file.text());
            if (!entries.length) throw new Error("No entries were found in the first CSV column.");
            input.value = entries.join("\n");
            notify(`${entries.length} entries imported from CSV.`, "success");
        } catch (error) {
            notify(error.message || "Unable to read the selected CSV file.");
        } finally {
            fileInput.value = "";
        }
    });

    generateButton.addEventListener("click", generateAll);
    clearButton?.addEventListener("click", clearAll);
    zipButton?.addEventListener("click", downloadAllZip);
});
