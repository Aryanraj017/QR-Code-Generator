/* ============================================
   SMART QR - CAMERA SCANNER
============================================ */

import { notify } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
    const scannerSection = document.getElementById("scanner");
    const readerElement = document.getElementById("qrScannerReader");
    const startButton = document.getElementById("startScanButton");
    const stopButton = document.getElementById("stopScanButton");
    const cameraControls = document.getElementById("scannerCameraControls");
    const cameraSelect = document.getElementById("scannerCameraSelect");
    const statusMessage = document.getElementById("scannerStatus");
    const emptyResult = document.getElementById("scanResultEmpty");
    const resultPanel = document.getElementById("scanResultContent");
    const resultText = document.getElementById("scanResultText");
    const copyButton = document.getElementById("copyScanResult");
    const openLinkButton = document.getElementById("openScannedLink");
    const scannerFile = document.getElementById("scannerFile");
    const cameraTab = document.getElementById("scannerCameraTab");
    const uploadTab = document.getElementById("scannerUploadTab");
    const cameraPanel = document.getElementById("cameraPlaceholder");
    const uploadPanel = document.getElementById("scannerUploadPanel");

    if (!scannerSection || !readerElement || !startButton || !stopButton) return;

    let scanner = null;
    let cameras = [];
    let isStarting = false;
    let isScanning = false;
    let isScanningFile = false;
    let pendingStart = null;
    let scanSession = 0;
    let resultHandled = false;
    let lastValidUrl = null;

    function setStatus(message, kind = "info") {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.dataset.state = kind;
    }

    function isSecurePage() {
        const host = window.location.hostname;
        return window.location.protocol === "https:" || host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    }

    function explainCameraError(error) {
        const name = error?.name || "";
        const message = String(error?.message || error || "").toLowerCase();
        if (!isSecurePage()) {
            return "Camera access requires HTTPS or localhost. Open this project from a secure address.";
        }
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || /permission|notallowed|denied/.test(message)) {
            return "Camera permission was denied. Allow camera access in your browser settings, then try again.";
        }
        if (name === "NotFoundError" || /no camera|camera not found|notfound/.test(message)) {
            return "No camera is available on this device.";
        }
        if (name === "NotReadableError" || /notreadable|already in use|could not start video source/.test(message)) {
            return "The camera is unavailable or being used by another application. Close other camera apps and retry.";
        }
        return "Unable to start the camera. Check browser permissions and make sure a camera is connected.";
    }

    function getValidatedWebUrl(content) {
        const value = String(content || "").trim();
        if (!value) return null;
        const candidate = /^www\./i.test(value) ? `https://${value}` : value;
        let url;
        try { url = new URL(candidate); }
        catch { return null; }
        if (!(["http:", "https:"].includes(url.protocol)) || !url.hostname || url.username || url.password) {
            return null;
        }
        return url;
    }

    function displayResult(content) {
        if (!resultText || !resultPanel) return;
        resultHandled = true;
        lastValidUrl = getValidatedWebUrl(content);
        resultText.textContent = content;
        resultPanel.hidden = false;
        if (emptyResult) emptyResult.hidden = true;
        if (copyButton) copyButton.disabled = false;
        if (openLinkButton) openLinkButton.hidden = !lastValidUrl;
        setStatus("QR code scanned successfully.", "success");
        window.dispatchEvent(new CustomEvent("qr:scanned", {
            detail: { content, type: "scan", source: "scanner" }
        }));
        stopScanning({ preserveStatus: true });
    }

    async function stopScanning(options = {}) {
        scanSession += 1;
        const wasStarting = isStarting;
        isStarting = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        if (cameraSelect) cameraSelect.disabled = true;

        if (scanner && isScanning) {
            try { await scanner.stop(); }
            catch (error) { console.warn("Camera stop reported an issue:", error); }
        }
        isScanning = false;

        if (!options.preserveStatus && scannerSection.classList.contains("active")) {
            setStatus(wasStarting ? "Camera start cancelled." : "Camera stopped.");
        }
    }

    async function startScanning(preferredCameraId = "") {
        if (isStarting || isScanning || isScanningFile) return;
        if (typeof Html5Qrcode === "undefined") {
            setStatus("The QR scanner library could not be loaded. Check your internet connection.", "error");
            notify("Scanner library unavailable. Reload the page and try again.");
            return;
        }
        if (!isSecurePage()) {
            setStatus("Camera access requires HTTPS or localhost.", "error");
            notify("Open the project over HTTPS or localhost to use the camera.");
            return;
        }

        const session = ++scanSession;
        resultHandled = false;
        isStarting = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        if (cameraSelect) cameraSelect.disabled = true;
        setStatus("Requesting camera access…");

        try {
            // Camera enumeration triggers a browser permission prompt if needed.
            cameras = await Html5Qrcode.getCameras();
            if (session !== scanSession) return;
            if (!Array.isArray(cameras) || cameras.length === 0) {
                throw Object.assign(new Error("No camera devices were found."), { name: "NotFoundError" });
            }

            if (cameraSelect && cameraControls) {
                cameraSelect.replaceChildren();
                cameras.forEach((camera, index) => {
                    const option = document.createElement("option");
                    option.value = camera.id;
                    option.textContent = camera.label || `Camera ${index + 1}`;
                    cameraSelect.appendChild(option);
                });
                cameraControls.hidden = cameras.length < 2;
                const selectedCamera = cameras.some((camera) => camera.id === preferredCameraId)
                    ? preferredCameraId
                    : (cameraSelect.value || cameras[0].id);
                cameraSelect.value = selectedCamera;
            }

            const selectedCameraId = preferredCameraId && cameras.some((camera) => camera.id === preferredCameraId)
                ? preferredCameraId
                : (cameraSelect?.value || cameras[0].id);

            scanner ||= new Html5Qrcode("qrScannerReader", {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false
            });

            setStatus("Starting camera…");
            await scanner.start(
                selectedCameraId,
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
                (decodedText) => {
                    if (session === scanSession && !resultHandled) displayResult(decodedText);
                },
                () => { /* Per-frame decode misses are expected while scanning. */ }
            );

            if (session !== scanSession) {
                try { await scanner.stop(); } catch { /* already stopped */ }
                return;
            }

            isStarting = false;
            isScanning = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            if (cameraSelect) cameraSelect.disabled = false;
            const cameraName = cameras.find((camera) => camera.id === selectedCameraId)?.label;
            setStatus(`Scanning${cameraName ? ` with ${cameraName}` : ""}. Hold a QR code in view.`);
        } catch (error) {
            if (session !== scanSession) return;
            console.error("QR camera start failed:", error);
            isStarting = false;
            isScanning = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            if (cameraSelect) cameraSelect.disabled = false;
            const message = explainCameraError(error);
            setStatus(message, "error");
            notify(message);
        }
    }

    function requestStart(cameraId = "") {
        if (pendingStart) return pendingStart;
        pendingStart = startScanning(cameraId).finally(() => {
            pendingStart = null;
        });
        return pendingStart;
    }

    async function scanUploadedImage(file) {
        if (!file) return;
        const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
        if (!allowedTypes.includes(file.type)) {
            notify("Choose a PNG, JPG, WebP, GIF, or BMP image.");
            scannerFile.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            notify("The QR image must be 10 MB or smaller.");
            scannerFile.value = "";
            return;
        }
        if (typeof Html5Qrcode === "undefined") {
            notify("Scanner library unavailable. Reload the page and try again.");
            return;
        }

        const starting = pendingStart;
        if (isScanning || isStarting) await stopScanning();
        if (starting) await starting.catch(() => {});
        if (!scannerSection.classList.contains("active")) return;

        isScanningFile = true;
        const session = ++scanSession;
        startButton.disabled = true;
        stopButton.disabled = true;
        setStatus("Reading the selected image…");
        try {
            scanner ||= new Html5Qrcode("qrScannerReader", {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false
            });
            const decodedText = await scanner.scanFile(file, true);
            if (session === scanSession && scannerSection.classList.contains("active")) {
                displayResult(decodedText);
            }
        } catch (error) {
            if (session === scanSession) {
                console.error("QR image scan failed:", error);
                setStatus("No readable QR code was found in that image.", "error");
                notify("No readable QR code was found in the selected image.");
            }
        } finally {
            isScanningFile = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            if (scannerFile) scannerFile.value = "";
        }
    }

    startButton.addEventListener("click", () => requestStart());
    stopButton.addEventListener("click", () => stopScanning());

    cameraSelect?.addEventListener("change", async () => {
        if (!isScanning || !cameraSelect.value) return;
        const selectedCamera = cameraSelect.value;
        await stopScanning({ preserveStatus: true });
        await requestStart(selectedCamera);
    });

    scannerFile?.addEventListener("change", () => scanUploadedImage(scannerFile.files?.[0]));

    function selectScannerMode(mode) {
        const useCamera = mode === "camera";
        if (cameraPanel) cameraPanel.hidden = !useCamera;
        if (uploadPanel) uploadPanel.hidden = useCamera;
        cameraTab?.classList.toggle("active", useCamera);
        uploadTab?.classList.toggle("active", !useCamera);
        cameraTab?.setAttribute("aria-selected", String(useCamera));
        uploadTab?.setAttribute("aria-selected", String(!useCamera));
        if (!useCamera) stopScanning();
    }

    cameraTab?.addEventListener("click", () => selectScannerMode("camera"));
    uploadTab?.addEventListener("click", () => selectScannerMode("upload"));

    copyButton?.addEventListener("click", async () => {
        const content = resultText?.textContent || "";
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            notify("Scan result copied to the clipboard.", "success");
        } catch (error) {
            console.error("Scan result copy failed:", error);
            notify("Unable to copy the result. Check clipboard permissions.");
        }
    });

    openLinkButton?.addEventListener("click", () => {
        if (!lastValidUrl) return;
        if (!window.confirm(`Open this link in a new tab?\n\n${lastValidUrl.href}`)) return;
        window.open(lastValidUrl.href, "_blank", "noopener,noreferrer");
    });

    // Release camera permissions whenever navigation hides the scanner page.
    const sectionObserver = new MutationObserver(() => {
        if (!scannerSection.classList.contains("active") && (isScanning || isStarting || isScanningFile)) stopScanning();
    });
    sectionObserver.observe(scannerSection, { attributes: true, attributeFilter: ["class"] });

    if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Camera scanning is not supported by this browser. Try a current browser over HTTPS.", "error");
    }
});
