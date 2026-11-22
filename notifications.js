/* Shared accessible toast notifications for the application modules. */

export function notify(message, type = "error") {
    const toast = document.createElement("div");
    toast.className = `app-notification app-notification-${type}`;
    toast.textContent = String(message);
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        maxWidth: "min(360px, calc(100vw - 40px))",
        padding: "14px 20px",
        borderRadius: "8px",
        color: "#ffffff",
        backgroundColor: type === "success" ? "#16a34a" : "#dc2626",
        fontSize: "14px",
        fontWeight: "600",
        zIndex: "9999",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    });
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
}
