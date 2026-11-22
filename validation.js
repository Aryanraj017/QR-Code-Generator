/* Shared validation for QR payloads entered through the UI. */

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) return false;
    const digitCount = phone.replace(/\D/g, "").length;
    return digitCount >= 7 && digitCount <= 15;
}

export function normalizeWebsiteUrl(value) {
    const input = String(value || "").trim();
    if (!input) throw new Error("Website URL is required.");
    let url;
    try {
        url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
    } catch {
        throw new Error("Please enter a valid website URL.");
    }
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only HTTP and HTTPS website URLs are supported.");
    }
    if (url.username || url.password) {
        throw new Error("Website URLs cannot include a username or password.");
    }
    const hostname = url.hostname.replace(/\.$/, "");
    const validHostname = hostname.split(".").every((label) =>
        label.length > 0 && label.length <= 63 &&
        /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
    );
    if (!validHostname) throw new Error("Please enter a valid website address.");
    return url.href;
}
