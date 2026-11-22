
/* ============================================
   SMART QR - QR CUSTOMIZATION MODULE
   QR Generation, Colors, Size and Logo
============================================ */

import { notify } from "./notifications.js";

// ============================================
// 1. DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS = {
    foreground: "#172554",
    background: "#ffffff",
    size: 256,
    margin: 12,
    errorCorrection: "M"
};

const MAX_LOGO_SIZE = 1024 * 1024; // 1 MB

const ALLOWED_LOGO_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

const ALLOWED_SIZES = [128, 256, 512, 1024];

const ALLOWED_ERROR_LEVELS = ["L", "M", "Q", "H"];


// ============================================
// 2. MODULE VARIABLES
// ============================================

let qrInstance = null;
let currentQRText = "";
let currentQRType = "url";
let currentQRName = "";
let logoData = null;


// ============================================
// 3. INITIALIZE CUSTOMIZATION MODULE
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------
    // Select HTML elements
    // ----------------------------------------

    const foreground = document.getElementById("foregroundColor");
    const background = document.getElementById("backgroundColor");

    const size = document.getElementById("qrSize");
    const margin = document.getElementById("qrMargin");
    const errorCorrection = document.getElementById("qrError");

    const logoInput = document.getElementById("qrLogo");
    const resetButton = document.getElementById("resetCustomization");

    const output = document.getElementById("qrCodeOutput");
    const placeholder = document.getElementById("qrPlaceholder");

    const previewTitle = document.getElementById("qrPreviewTitle");
    const previewMessage = document.getElementById("qrPreviewMessage");

    const logoPreview = document.getElementById("logoPreview");
    const exportButtons = {
        png: document.getElementById("downloadPng"),
        jpg: document.getElementById("downloadJpg"),
        svg: document.getElementById("downloadSvg"),
        copy: document.getElementById("copyQrContent"),
        print: document.getElementById("printQr")
    };


    // ----------------------------------------
    // Check required HTML elements
    // ----------------------------------------

    if (
        !foreground ||
        !background ||
        !size ||
        !margin ||
        !errorCorrection ||
        !output
    ) {
        console.error(
            "QR Customization: Required HTML elements are missing."
        );
        return;
    }


    function setExportButtonsEnabled(enabled) {
        Object.values(exportButtons).forEach((button) => {
            if (button) button.disabled = !enabled;
        });
    }


    function getFileNameBase() {
        const typeNames = {
            url: "Website",
            text: "Text",
            email: "Email",
            phone: "Phone",
            wifi: "Wi-Fi",
            vcard: "Contact"
        };
        const fallback = `QR-Code-${typeNames[currentQRType] || "Code"}`;
        const suppliedName = currentQRName
            .replace(/\.[a-z0-9]{2,5}$/i, "")
            .normalize("NFKD")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/[\s-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return suppliedName || fallback;
    }


    async function downloadQr(extension, filenameExtension = extension) {
        if (!qrInstance) {
            throw new Error("Generate a QR code before downloading it.");
        }

        const blob = await qrInstance.getRawData(extension);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${getFileNameBase()}.${filenameExtension}`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }


    function bindDownload(button, extension, filenameExtension = extension) {
        if (!button) return;
        button.addEventListener("click", async () => {
            try {
                await downloadQr(extension, filenameExtension);
                notify(`${filenameExtension.toUpperCase()} downloaded successfully.`, "success");
            } catch (error) {
                console.error(`${extension.toUpperCase()} export failed:`, error);
                notify(`Unable to export ${extension.toUpperCase()}. Please try again.`);
            }
        });
    }


    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Unable to prepare the QR code for printing."));
            reader.readAsDataURL(blob);
        });
    }


    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }


    async function printQr() {
        if (!qrInstance) {
            notify("Generate a QR code before printing it.");
            return;
        }

        const printWindow = window.open("", "_blank", "width=720,height=800");
        if (!printWindow) {
            notify("Allow pop-ups to print the QR code.");
            return;
        }

        try {
            const dataUrl = await blobToDataUrl(await qrInstance.getRawData("png"));
            const title = escapeHtml(getFileNameBase());
            printWindow.document.open();
            printWindow.document.write(`<!doctype html>
                <html><head><meta charset="utf-8"><title>${title}</title>
                <style>
                    body{margin:0;padding:32px;min-height:90vh;display:grid;place-content:center;
                    justify-items:center;font:16px Arial,sans-serif;color:#111}
                    img{display:block;width:auto;height:auto;max-width:min(90vw,1024px);max-height:80vh}
                    h1{font-size:18px;font-weight:600}
                    @media print{body{padding:0;min-height:100vh}}
                </style></head><body><h1>${title}</h1>
                <img src="${dataUrl}" alt="${title} QR code">
                <script>window.addEventListener('load',()=>{window.focus();window.print();});<\/script>
                </body></html>`);
            printWindow.document.close();
            notify("Print dialog opened.", "success");
        } catch (error) {
            printWindow.close();
            console.error("QR printing failed:", error);
            notify("Unable to prepare the QR code for printing.");
        }
    }


    async function copyQrContent() {
        if (!currentQRText || !qrInstance) {
            notify("Generate a QR code before copying its content.");
            return;
        }

        try {
            await navigator.clipboard.writeText(currentQRText);
            notify("QR content copied to the clipboard.", "success");
        } catch (error) {
            console.error("Clipboard copy failed:", error);
            notify("Unable to copy QR content. Check clipboard permissions.");
        }
    }


    // ========================================
    // 5. UPDATE COLOR LABELS
    // ========================================

    function updateColorLabels() {

        const foregroundLabel =
            foreground.parentElement.querySelector("span");

        const backgroundLabel =
            background.parentElement.querySelector("span");

        if (foregroundLabel) {
            foregroundLabel.textContent =
                foreground.value.toUpperCase();
        }

        if (backgroundLabel) {
            backgroundLabel.textContent =
                background.value.toUpperCase();
        }

    }


    // ========================================
    // 6. COLOR CONTRAST VALIDATION
    // ========================================

    function getLuminance(hex) {

        const cleanHex = hex.replace("#", "");

        if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
            return null;
        }

        const rgb = cleanHex.match(/.{2}/g).map(value => {

            const channel = parseInt(value, 16) / 255;

            return channel <= 0.04045
                ? channel / 12.92
                : Math.pow((channel + 0.055) / 1.055, 2.4);

        });

        return (
            0.2126 * rgb[0] +
            0.7152 * rgb[1] +
            0.0722 * rgb[2]
        );

    }


    function hasGoodContrast() {

        const first = getLuminance(foreground.value);
        const second = getLuminance(background.value);

        if (first === null || second === null) {
            return false;
        }

        const lighter = Math.max(first, second);
        const darker = Math.min(first, second);

        const contrastRatio =
            (lighter + 0.05) / (darker + 0.05);

        return contrastRatio >= 4.5;

    }


    // ========================================
    // 7. GET CUSTOMIZATION SETTINGS
    // ========================================

    function getSettings() {

        const selectedSize = Number(size.value);

        const selectedErrorLevel = errorCorrection.value;

        return {

            foreground: foreground.value,

            background: background.value,

            size: ALLOWED_SIZES.includes(selectedSize)
                ? selectedSize
                : DEFAULT_SETTINGS.size,

            margin: [4, 12, 24].includes(Number(margin.value))
                ? Number(margin.value)
                : DEFAULT_SETTINGS.margin,

            errorCorrection: logoData
                ? "H"
                : ALLOWED_ERROR_LEVELS.includes(selectedErrorLevel)
                    ? selectedErrorLevel
                    : DEFAULT_SETTINGS.errorCorrection

        };

    }


    // ========================================
    // 8. GENERATE / RENDER QR CODE
    // ========================================

    function renderQRCode() {

        // Do not generate an empty QR code.
        if (!currentQRText) {
            return false;
        }


        // QRCodeStyling is loaded before app.js and its modules.
        if (typeof QRCodeStyling === "undefined") {
            console.error("QRCodeStyling library is unavailable.");
            notify("QR code library could not be loaded. Check your internet connection.");
            return false;
        }


        // Validate color contrast.
        if (!hasGoodContrast()) {

            qrInstance = null;
            setExportButtonsEnabled(false);
            output.replaceChildren();
            if (placeholder) placeholder.style.display = "";

            if (previewMessage) {
                previewMessage.textContent =
                    "Low contrast detected. Choose colors with stronger contrast.";
            }

            return false;

        }


        // Get customization settings.
        const settings = getSettings();


        // Validate QR dimensions.
        if (
            !Number.isFinite(settings.size) ||
            settings.size <= 0
        ) {

            notify("Please select a valid QR code size.");

            return false;

        }


        // ------------------------------------
        // Create QR Code
        // ------------------------------------

        try {

            // Replace the previous preview with the updated design.
            setExportButtonsEnabled(false);
            qrInstance = null;
            output.innerHTML = "";
            qrInstance = new QRCodeStyling({
                width: settings.size,
                height: settings.size,
                type: "canvas",
                data: currentQRText,
                image: logoData || undefined,
                margin: settings.margin,
                qrOptions: {
                    errorCorrectionLevel: settings.errorCorrection
                },
                dotsOptions: {
                    color: settings.foreground,
                    type: "square"
                },
                cornersSquareOptions: {
                    color: settings.foreground,
                    type: "square"
                },
                cornersDotOptions: {
                    color: settings.foreground,
                    type: "square"
                },
                backgroundOptions: {
                    color: settings.background
                },
                imageOptions: {
                    hideBackgroundDots: true,
                    imageSize: 0.2,
                    margin: 6,
                    crossOrigin: "anonymous"
                }
            });
            qrInstance.append(output);
            setExportButtonsEnabled(true);

        } catch (error) {

            console.error("QR generation failed:", error);

            output.innerHTML = "";

            qrInstance = null;
            setExportButtonsEnabled(false);
            if (placeholder) placeholder.style.display = "";

            notify("Unable to generate QR code. Please try again.");

            return false;

        }


        // ------------------------------------
        // Update Preview
        // ------------------------------------

        output.style.width = `${settings.size}px`;

        output.style.maxWidth = "100%";

        output.style.margin = "0 auto";


        if (placeholder) {
            placeholder.style.display = "none";
        }

        // Keep the square QR preview responsive without stretching it.
        output.querySelectorAll("img, canvas").forEach((element) => {
            element.style.maxWidth = "100%";
            element.style.maxHeight = "100%";
            element.style.width = "auto";
            element.style.height = "auto";
            element.style.objectFit = "contain";
        });


        if (previewTitle) {
            previewTitle.textContent = "Your QR Code";
        }


        if (previewMessage) {

            previewMessage.textContent = logoData
                ? "Logo applied. High error correction is enabled."
                : "QR code generated with the selected colors and size.";

        }

        window.dispatchEvent(new CustomEvent("qr:generated", {
            detail: {
                content: currentQRText,
                type: currentQRType,
                name: currentQRName,
                settings,
                logoData
            }
        }));

        return true;

    }


    // ========================================
    // 9. HANDLE CUSTOMIZATION CHANGES
    // ========================================

    function handleCustomizationChange() {

        updateColorLabels();


        if (!hasGoodContrast()) {

            qrInstance = null;
            setExportButtonsEnabled(false);
            output.replaceChildren();
            if (placeholder) placeholder.style.display = "";

            if (previewMessage) {

                previewMessage.textContent =
                    "Low contrast detected. Choose a darker foreground or lighter background.";

            }

            return;

        }


        // Regenerate QR with updated settings.
        renderQRCode();

    }


    // ========================================
    // 10. HANDLE LOGO UPLOAD
    // ========================================

    function handleLogoUpload(event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }


        // Validate image format.
        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {

            notify(
                "Invalid image format. Upload PNG, JPG or WebP."
            );

            logoInput.value = "";

            return;

        }


        // Validate file size.
        if (file.size > MAX_LOGO_SIZE) {

            notify("Logo must be smaller than 1 MB.");

            logoInput.value = "";

            return;

        }


        const reader = new FileReader();


        // File successfully read.
        reader.onload = () => {

            const image = new Image();


            // Image successfully loaded.
            image.onload = () => {

                const pixelCount = image.naturalWidth * image.naturalHeight;
                if (image.naturalWidth > 4096 || image.naturalHeight > 4096 || pixelCount > 16_000_000) {
                    notify("Logo dimensions are too large. Use an image no larger than 4096 × 4096 pixels.");
                    logoInput.value = "";
                    return;
                }

                logoData = reader.result;


                // Force high error correction for logo mode.
                errorCorrection.value = "H";

                errorCorrection.disabled = true;


                // Display logo preview.
                if (logoPreview) {

                    logoPreview.innerHTML = "";

                    const previewImage =
                        document.createElement("img");

                    previewImage.src = logoData;

                    previewImage.alt = "Uploaded QR logo";

                    previewImage.style.width = "64px";

                    previewImage.style.height = "64px";

                    previewImage.style.objectFit = "contain";

                    previewImage.style.marginTop = "10px";

                    logoPreview.appendChild(previewImage);

                }


                // Regenerate QR with logo.
                renderQRCode();

            };


            // Image loading failed.
            image.onerror = () => {

                notify(
                    "The uploaded image could not be loaded."
                );

                logoInput.value = "";

            };


            image.src = reader.result;

        };


        // File reading failed.
        reader.onerror = () => {

            notify("Unable to read the uploaded file.");

            logoInput.value = "";

        };


        reader.readAsDataURL(file);

    }


    // ========================================
    // 11. RESET CUSTOMIZATION
    // ========================================

    function resetCustomization() {

        // Restore default colors.
        foreground.value = DEFAULT_SETTINGS.foreground;

        background.value = DEFAULT_SETTINGS.background;


        // Restore default size.
        size.value = String(DEFAULT_SETTINGS.size);

        margin.value = String(DEFAULT_SETTINGS.margin);


        // Restore default error correction.
        errorCorrection.value =
            DEFAULT_SETTINGS.errorCorrection;

        errorCorrection.disabled = false;


        // Remove uploaded logo.
        logoData = null;


        if (logoInput) {
            logoInput.value = "";
        }


        if (logoPreview) {
            logoPreview.innerHTML = "";
        }


        // Update color labels.
        updateColorLabels();


        // Regenerate QR using default settings.
        if (currentQRText) {
            renderQRCode();
        }

    }


    // ========================================
    // 12. RECEIVE QR GENERATION EVENT
    // ========================================

    window.addEventListener("qr:generate", (event) => {

        // Keep the export actions tied to the QR code currently being rendered.
        qrInstance = null;
        setExportButtonsEnabled(false);
        output.innerHTML = "";
        if (placeholder) placeholder.style.display = "";

        currentQRText = event.detail?.text || "";
        currentQRType = event.detail?.type || "url";
        currentQRName = event.detail?.name || "";

        if (!currentQRText) {

            notify("Please enter valid content to generate a QR code.");

            return;

        }

        event.detail.generated = renderQRCode();

    });


    window.addEventListener("qr:regenerate", (event) => {
        const record = event.detail;
        if (!record || typeof record.content !== "string") return;

        const settings = record.settings || {};
        foreground.value = settings.foreground || DEFAULT_SETTINGS.foreground;
        background.value = settings.background || DEFAULT_SETTINGS.background;
        size.value = String(ALLOWED_SIZES.includes(Number(settings.size))
            ? Number(settings.size)
            : DEFAULT_SETTINGS.size);
        margin.value = String([4, 12, 24].includes(Number(settings.margin))
            ? Number(settings.margin)
            : DEFAULT_SETTINGS.margin);
        logoData = settings.logo || null;
        errorCorrection.value = logoData
            ? "H"
            : (ALLOWED_ERROR_LEVELS.includes(settings.errorCorrection)
                ? settings.errorCorrection
                : DEFAULT_SETTINGS.errorCorrection);
        errorCorrection.disabled = Boolean(logoData);
        currentQRText = record.content;
        currentQRType = record.type || "text";
        currentQRName = record.name || "";

        if (logoPreview) {
            logoPreview.replaceChildren();
            if (logoData) {
                const image = document.createElement("img");
                image.src = logoData;
                image.alt = "Saved QR logo";
                image.style.width = "64px";
                image.style.height = "64px";
                image.style.objectFit = "contain";
                logoPreview.appendChild(image);
            }
        }

        updateColorLabels();
        if (!renderQRCode()) {
            notify("Could not regenerate this QR code with its saved settings.");
            return;
        }

        const nameInput = document.getElementById("qrFileName");
        if (nameInput) nameInput.value = currentQRName;
    });


    // ========================================
    // 13. RECEIVE QR CLEAR EVENT
    // ========================================

    window.addEventListener("qr:clear", () => {

        currentQRText = "";

        qrInstance = null;
        setExportButtonsEnabled(false);

        output.innerHTML = "";


        // Restore placeholder.
        if (placeholder) {
            placeholder.style.display = "";
        }


        if (previewTitle) {
            previewTitle.textContent = "QR Preview Area";
        }


        if (previewMessage) {

            previewMessage.textContent =
                "Enter your content and generate a QR code to see the preview here.";

        }

    });


    // ========================================
    // 14. EVENT LISTENERS
    // ========================================

    foreground.addEventListener(
        "input",
        handleCustomizationChange
    );


    background.addEventListener(
        "input",
        handleCustomizationChange
    );


    size.addEventListener(
        "change",
        handleCustomizationChange
    );


    margin.addEventListener(
        "change",
        handleCustomizationChange
    );


    errorCorrection.addEventListener(
        "change",
        handleCustomizationChange
    );


    if (logoInput) {

        logoInput.addEventListener(
            "change",
            handleLogoUpload
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetCustomization
        );

    }


    bindDownload(exportButtons.png, "png");
    bindDownload(exportButtons.jpg, "jpeg", "jpg");
    bindDownload(exportButtons.svg, "svg");

    if (exportButtons.copy) {
        exportButtons.copy.addEventListener("click", copyQrContent);
    }

    if (exportButtons.print) {
        exportButtons.print.addEventListener("click", printQr);
    }

    setExportButtonsEnabled(false);


    // ========================================
    // 15. INITIAL SETUP
    // ========================================

    updateColorLabels();

    console.log("QR Customization module initialized.");

});
