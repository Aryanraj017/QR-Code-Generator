
/* ============================================
   SMART QR - MAIN APPLICATION
============================================ */

import "./generator.js";
import "./scanner.js";
import "./customization.js";
import "./history.js";
import "./batch.js";


document.addEventListener("DOMContentLoaded", () => {

    console.log("Smart QR application initialized.");

    // ========================================
    // 1. SELECT HTML ELEMENTS
    // ========================================

    const sidebar = document.getElementById("sidebar");

    const menuToggle = document.getElementById("menuToggle");

    const sidebarClose = document.getElementById("sidebarClose");

    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const themeToggle = document.getElementById("themeToggle");

    const themeIcon = document.getElementById("themeIcon");

    const pageTitle = document.getElementById("pageTitle");

    const breadcrumbPage = document.getElementById("breadcrumbPage");


    // ========================================
    // 2. PAGE NAVIGATION
    // ========================================

    const navigationItems = document.querySelectorAll("[data-section]");

    const pageSections = document.querySelectorAll(".page-section");


    const pageNames = {
        home: "Dashboard",
        generate: "Generate QR",
        scanner: "Scanner",
        batch: "Batch Generator",
        history: "History",
        about: "About"
    };


    function showSection(sectionName) {

        // Check that the requested section exists.
        const targetSection = document.getElementById(sectionName);

        if (!targetSection || !targetSection.classList.contains("page-section")) {
            return;
        }

        // Hide all page sections.
        pageSections.forEach((section) => {
            section.classList.remove("active");
        });

        // Show selected page.
        targetSection.classList.add("active");

        // Update sidebar navigation.
        document.querySelectorAll(".nav-link").forEach((link) => {

            link.classList.toggle(
                "active",
                link.dataset.section === sectionName
            );

        });

        // Update page title.
        if (pageTitle) pageTitle.textContent = pageNames[sectionName];

        // Update breadcrumb.
        if (breadcrumbPage) breadcrumbPage.textContent = pageNames[sectionName];

        // Close mobile sidebar.
        closeSidebar();

        // Start the new page at the top.
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // Handle all section navigation buttons.
    navigationItems.forEach((item) => {

        item.addEventListener("click", () => {

            const sectionName = item.dataset.section;

            showSection(sectionName);

        });

    });


    // ========================================
    // 3. MOBILE SIDEBAR
    // ========================================

    function openSidebar() {

        sidebar?.classList.add("open");

        sidebarOverlay?.classList.add("show");

        menuToggle?.setAttribute("aria-expanded", "true");

    }


    function closeSidebar() {

        sidebar?.classList.remove("open");

        sidebarOverlay?.classList.remove("show");

        menuToggle?.setAttribute("aria-expanded", "false");

    }


    if (menuToggle) {
        menuToggle.addEventListener("click", () => {

            if (sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }

        });
    }


    sidebarClose?.addEventListener("click", closeSidebar);

    sidebarOverlay?.addEventListener("click", closeSidebar);


    // Close sidebar when Escape is pressed.
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    // ========================================
    // 4. DARK / LIGHT THEME
    // ========================================

    const htmlElement = document.documentElement;


    function applyTheme(theme) {

        htmlElement.setAttribute("data-theme", theme);

        if (theme === "dark") {

        themeIcon?.setAttribute("data-lucide", "sun");

            themeToggle?.setAttribute(
                "aria-label",
                "Switch to light theme"
            );

            themeToggle?.setAttribute(
                "title",
                "Switch to light theme"
            );

        } else {

            themeIcon?.setAttribute("data-lucide", "moon");

            themeToggle?.setAttribute(
                "aria-label",
                "Switch to dark theme"
            );

            themeToggle?.setAttribute(
                "title",
                "Switch to dark theme"
            );

        }

        // Update Lucide icons after changing their names.
        if (window.lucide) {
            window.lucide.createIcons();
        }

    }


    // Load saved theme, default to light.
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem("smartQRTheme");
    } catch (error) {
        console.warn("Theme preference is unavailable in browser storage:", error);
    }

    applyTheme(savedTheme === "dark" ? "dark" : "light");


    // Toggle between light and dark themes.
    themeToggle?.addEventListener("click", () => {

        const currentTheme = htmlElement.getAttribute("data-theme");

        const newTheme = currentTheme === "light" ? "dark" : "light";

        applyTheme(newTheme);

        // Save preference in browser storage.
        try {
            localStorage.setItem("smartQRTheme", newTheme);
        } catch (error) {
            console.warn("Theme preference could not be saved:", error);
        }

    });


    // ========================================
    // 5. INITIALIZE ICONS
    // ========================================

    if (window.lucide) {
        window.lucide.createIcons();
    }


    // ========================================
    // 6. INITIAL PAGE
    // ========================================

    showSection("home");

});
