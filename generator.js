
/* ============================================
   SMART QR - MULTI-TYPE QR GENERATOR
============================================ */

import { notify } from "./notifications.js";
import { isValidEmail, isValidPhone, normalizeWebsiteUrl } from "./validation.js";

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. SELECT HTML ELEMENTS
    // ========================================

    const qrType = document.getElementById("qrType");
    const dynamicFields = document.getElementById("dynamicFields");

    const qrFileName = document.getElementById("qrFileName");
    const generateButton = document.getElementById("generateButton");
    const clearButton = document.getElementById("clearGenerator");

    const previewTitle = document.getElementById("qrPreviewTitle");
    const previewMessage = document.getElementById("qrPreviewMessage");

    // Check whether essential HTML elements exist.
    if (
        !qrType ||
        !dynamicFields ||
        !qrFileName ||
        !generateButton ||
        !clearButton ||
        !previewTitle ||
        !previewMessage
    ) {
        console.error("QR Generator: Required HTML elements are missing.");
        return;
    }


    // ========================================
    // 2. DYNAMIC INPUT FIELDS
    // ========================================

    function renderFields(type) {

        const fieldTemplates = {

            // WEBSITE URL
            url: `
                <div class="form-group">
                    <label for="urlInput">Website URL *</label>
                    <input
                        type="url"
                        id="urlInput"
                        placeholder="https://example.com"
                    >
                </div>
            `,

            // PLAIN TEXT
            text: `
                <div class="form-group">
                    <label for="textInput">Enter Text *</label>
                    <textarea
                        id="textInput"
                        rows="5"
                        placeholder="Enter your text here..."
                    ></textarea>
                </div>
            `,

            // EMAIL
            email: `
                <div class="form-group">
                    <label for="emailInput">Email Address *</label>
                    <input
                        type="email"
                        id="emailInput"
                        placeholder="example@gmail.com"
                    >
                </div>

                <div class="form-group">
                    <label for="emailSubject">Subject (Optional)</label>
                    <input
                        type="text"
                        id="emailSubject"
                        placeholder="Enter email subject"
                    >
                </div>

                <div class="form-group">
                    <label for="emailMessage">Message (Optional)</label>
                    <textarea
                        id="emailMessage"
                        rows="3"
                        placeholder="Enter email message"
                    ></textarea>
                </div>
            `,

            // PHONE
            phone: `
                <div class="form-group">
                    <label for="phoneInput">Phone Number *</label>
                    <input
                        type="tel"
                        id="phoneInput"
                        placeholder="+919876543210"
                    >
                </div>
            `,

            // WI-FI
            wifi: `
                <div class="form-group">
                    <label for="wifiName">Network Name (SSID) *</label>
                    <input
                        type="text"
                        id="wifiName"
                        placeholder="Enter Wi-Fi name"
                    >
                </div>

                <div class="form-group">
                    <label for="wifiPassword">Password</label>
                    <input
                        type="password"
                        id="wifiPassword"
                        placeholder="Enter Wi-Fi password"
                    >
                </div>

                <div class="form-group">
                    <label for="wifiSecurity">Security Type *</label>
                    <select id="wifiSecurity">
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">No Password</option>
                    </select>
                </div>
            `,

            // CONTACT INFORMATION
            vcard: `
                <div class="form-group">
                    <label for="contactName">Full Name *</label>
                    <input
                        type="text"
                        id="contactName"
                        placeholder="Enter full name"
                    >
                </div>

                <div class="form-group">
                    <label for="contactPhone">Phone Number *</label>
                    <input
                        type="tel"
                        id="contactPhone"
                        placeholder="+919876543210"
                    >
                </div>

                <div class="form-group">
                    <label for="contactEmail">Email Address</label>
                    <input
                        type="email"
                        id="contactEmail"
                        placeholder="example@gmail.com"
                    >
                </div>

                <div class="form-group">
                    <label for="contactAddress">Address</label>
                    <textarea
                        id="contactAddress"
                        rows="2"
                        placeholder="Enter address"
                    ></textarea>
                </div>
            `
        };

        if (!fieldTemplates[type]) {
            notify("Invalid QR code type selected.");
            return;
        }

        dynamicFields.innerHTML = fieldTemplates[type];
    }


    // ========================================
    // 4. INPUT VALIDATION HELPERS
    // ========================================

    function getValue(id) {

        return document.getElementById(id)?.value.trim() || "";
    }


    // Check required fields.
    function validateRequired(value, fieldName) {

        if (!value) {
            throw new Error(`${fieldName} is required.`);
        }

        return value;
    }


    // ========================================
    // 5. FORMAT DATA FOR EACH QR TYPE
    // ========================================

    function formatQRData(type) {

        switch (type) {

            // WEBSITE URL
            case "url": {

                const url = validateRequired(
                    getValue("urlInput"),
                    "Website URL"
                );

                return normalizeWebsiteUrl(url);
            }


            // PLAIN TEXT
            case "text": {

                return validateRequired(
                    getValue("textInput"),
                    "Text"
                );
            }


            // EMAIL
            case "email": {

                const email = validateRequired(
                    getValue("emailInput"),
                    "Email address"
                );

                if (!isValidEmail(email)) {
                    throw new Error("Please enter a valid email address.");
                }

                const subject = getValue("emailSubject");
                const message = getValue("emailMessage");

                const parameters = new URLSearchParams();

                if (subject) {
                    parameters.set("subject", subject);
                }

                if (message) {
                    parameters.set("body", message);
                }

                const query = parameters.toString();

                return `mailto:${email}${query ? "?" + query : ""}`;
            }


            // PHONE
            case "phone": {

                const phone = validateRequired(
                    getValue("phoneInput"),
                    "Phone number"
                );

                if (!isValidPhone(phone)) {
                    throw new Error("Please enter a valid phone number.");
                }

                return `tel:${phone.replace(/[\s()-]/g, "")}`;
            }


            // WI-FI
            case "wifi": {

                const name = validateRequired(
                    getValue("wifiName"),
                    "Network name"
                );

                const security = getValue("wifiSecurity");
                const password = getValue("wifiPassword");

                if (!["WPA", "WEP", "nopass"].includes(security)) {
                    throw new Error("Please select a valid Wi-Fi security type.");
                }

                if (security !== "nopass" && !password) {
                    throw new Error("Wi-Fi password is required.");
                }

                if (security === "nopass" && password) {
                    throw new Error(
                        "Leave the password empty for an open Wi-Fi network."
                    );
                }

                // Escape special characters in Wi-Fi values.
                function escapeWifi(value) {

                    return value.replace(/([\\;,":])/g, "\\$1");
                }

                const escapedName = escapeWifi(name);
                const escapedPassword = escapeWifi(password);

                if (security === "nopass") {
                    return `WIFI:T:nopass;S:${escapedName};;`;
                }

                return `WIFI:T:${security};S:${escapedName};P:${escapedPassword};;`;
            }


            // CONTACT INFORMATION (VCARD)
            case "vcard": {

                const name = validateRequired(
                    getValue("contactName"),
                    "Full name"
                );

                const phone = validateRequired(
                    getValue("contactPhone"),
                    "Contact phone number"
                );

                if (!isValidPhone(phone)) {
                    throw new Error("Please enter a valid contact phone number.");
                }

                const email = getValue("contactEmail");
                const address = getValue("contactAddress");

                if (email && !isValidEmail(email)) {
                    throw new Error(
                        "Please enter a valid contact email address."
                    );
                }

                // Escape special characters in vCard text fields.
                function escapeVCard(value) {

                    return value
                        .replace(/\\/g, "\\\\")
                        .replace(/\n/g, "\\n")
                        .replace(/;/g, "\\;")
                        .replace(/,/g, "\\,");
                }

                const safeName = escapeVCard(name);
                const safePhone = escapeVCard(phone);

                const vcard = [
                    "BEGIN:VCARD",
                    "VERSION:3.0",
                    `FN:${safeName}`,
                    `TEL;TYPE=CELL:${safePhone}`
                ];

                if (email) {
                    vcard.push(`EMAIL:${escapeVCard(email)}`);
                }

                if (address) {
                    vcard.push(
                        `ADR;TYPE=HOME:;;${escapeVCard(address)};;;;`
                    );
                }

                vcard.push("END:VCARD");

                return vcard.join("\r\n");
            }


            default:
                throw new Error("Please select a valid QR code type.");
        }
    }


    // ========================================
    // 6. GENERATE QR CODE
    // ========================================

    function generateQRCode() {

        try {

            const type = qrType.value;

            // Convert form inputs into QR-compatible data.
            const content = formatQRData(type);

            if (typeof window.QRCodeStyling === "undefined") {
                throw new Error("QR code library could not be loaded. Check your internet connection.");
            }

            // customization.js renders the QR using QRCodeStyling.
            const generationRequest = {
                text: content,
                type,
                name: qrFileName.value.trim(),
                generated: false
            };
            window.dispatchEvent(
                new CustomEvent("qr:generate", {
                    detail: generationRequest
                })
            );

            if (!generationRequest.generated) {
                throw new Error("Unable to generate the QR code. Check the selected colors and try again.");
            }

            // Update preview information.
            previewTitle.textContent =
                qrFileName.value.trim() || "Generated QR Code";

            previewMessage.textContent =
                `${type.toUpperCase()} QR code generated successfully.`;

            notify("QR code generated successfully!", "success");

        } catch (error) {

            notify(error.message);

            console.error("QR Generator Error:", error);
        }
    }


    // ========================================
    // 7. CLEAR GENERATOR
    // ========================================

    function clearGenerator() {

        // Reset type selector.
        qrType.value = "url";

        // Render default URL input.
        renderFields("url");

        // Clear QR name.
        qrFileName.value = "";

        // Notify customization.js to clear the QR preview.
        window.dispatchEvent(new Event("qr:clear"));

        // Restore preview information.
        previewTitle.textContent = "QR Preview Area";

        previewMessage.textContent =
            "Enter your content and generate a QR code to see the preview here.";

        notify("Generator cleared successfully!", "success");
    }


    // ========================================
    // 8. EVENT LISTENERS
    // ========================================

    qrType.addEventListener("change", () => {

        renderFields(qrType.value);

    });

    generateButton.addEventListener("click", generateQRCode);

    clearButton.addEventListener("click", clearGenerator);


    // ========================================
    // 9. INITIALIZE GENERATOR
    // ========================================

    renderFields(qrType.value || "url");

    console.log("QR Generator module initialized successfully.");

});
