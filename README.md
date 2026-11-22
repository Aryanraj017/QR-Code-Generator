# Smart QR Code Generator and Scanner

## Project introduction
Smart QR is a browser-based application for creating, styling, scanning, exporting, organizing, and generating batches of QR codes. It uses plain HTML, CSS, and modular JavaScript, with QR and ZIP libraries loaded from CDNs.

## Abstract
The project combines common QR workflows in one responsive web interface. Users can prepare six QR payload types, apply color, size, margin, correction, and logo settings, export or print the result, keep a local history, scan with a camera or image, and create batch QR downloads. Data is handled in the browser; QR history is persisted locally.

## Problem statement
QR code workflows are often split across separate tools. This project demonstrates a single client-side system that makes QR creation, customization, scanning, and record management accessible through a consistent interface while validating inputs and limiting unnecessary sharing of user data.

## Objectives
- Generate QR codes for website, text, email, phone, Wi-Fi, and contact-card content.
- Customize appearance while preserving scannability and contrast.
- Export QR codes as PNG, JPG, and SVG, copy payloads, and print.
- Keep a compact local generation history.
- Scan QR codes from camera or uploaded images, with explicit confirmation before opening links.
- Generate multiple QR codes and download them together as a ZIP.
- Demonstrate responsive layout, validation, and modular browser JavaScript.

## Existing system
A user needing different QR functions commonly switches among separate web services, with inconsistent customization, export, history, and scanning support. Some services require sign-in or upload payloads to remote servers.

## Proposed system
Smart QR provides these workflows in one browser application. QR rendering is client-side through QRCodeStyling; scanner decoding uses html5-qrcode; batch archives use JSZip. History and theme preference use browser LocalStorage. No application server is required for ordinary use, although camera permissions require HTTPS or localhost.

## Technologies used
- HTML5 and CSS3, including responsive CSS and theme variables.
- Vanilla JavaScript ES modules.
- [QRCodeStyling](https://github.com/kozakdenys/qr-code-styling) for QR rendering and export.
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for camera and image QR scanning.
- [JSZip](https://stuk.github.io/jszip/) for batch ZIP creation.
- Browser APIs: LocalStorage, FileReader, Clipboard, Canvas, object URLs, camera/media devices, and print.
- Lucide icons via CDN.

## Main modules
- `js/app.js`: navigation, sidebar, and theme preference.
- `js/generator.js`: six payload forms, formatting, validation, and generation requests.
- `js/customization.js`: QR rendering, appearance controls, logo validation, preview, and exports.
- `js/scanner.js`: camera/image scanning, result display, copy, validated link opening, and camera cleanup.
- `js/batch.js`: multiline/CSV input, entry validation, yielding batch processing, individual PNGs, and ZIP export.
- `js/history.js`: compact LocalStorage records, rendering, filtering, download, regeneration, and deletion.
- `js/validation.js`: shared email, phone, and HTTP/HTTPS URL validation.
- `js/notifications.js`: shared text-only toast notifications.

## Folder structure
```text
QR-Code-Generator/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── batch.js
│   ├── customization.js
│   ├── generator.js
│   ├── history.js
│   ├── notifications.js
│   ├── scanner.js
│   └── validation.js
└── docs/
    └── diagrams.md
```

## Installation
1. Download or clone the project folder.
2. No package installation or build step is needed; dependencies are referenced by CDN in `index.html`.
3. Ensure the browser has internet access to load the QR, scanner, ZIP, and icon scripts.

## How to run
Open `index.html` in a current browser for QR generation and most UI functions. For camera scanning, serve the project from `localhost` or HTTPS (for example, use a local static-file server) and grant camera permission. Allow clipboard access when copying. Browser security policies may limit ES modules, downloads, clipboard, camera, or image scanning from a direct `file://` URL; a local web server is the recommended demonstration setup.

## Testing details
The following checks were actually run during this source review:
- JavaScript syntax check (`node --check`) on all eight project modules.
- HTML parser pass on `index.html` using Python's standard `HTMLParser`.
- Focused `validation.js` checks: normalized HTTPS, `www` and localhost URLs; rejection of JavaScript scheme, credential-bearing URLs, malformed host, and blank URL; valid/invalid email and phone examples.
- Static source review of module imports, CDN order, selectors, navigation, LocalStorage error paths, file-size/type validation, text-only rendering for user payloads, camera session guards, and mobile CSS breakpoints.

The following browser/device behaviors were **not verified in this review environment**: visual rendering at desktop/tablet/mobile sizes; actual decoding of all six generated QR payload types; logo rendering and live preview; PNG/JPG/SVG browser downloads; clipboard permissions; print dialog; persistence across a real browser restart; camera and image scanning; permission-denial behavior; ZIP contents; and dark/light appearance. These require running the project in a browser, and camera checks additionally require a camera and a secure origin. The static and validation checks above do not prove those end-to-end behaviors.

### Testing checklist for a browser demonstration
- [ ] Create website, plain text, email, phone, Wi-Fi, and vCard QR codes; scan each with an independent reader.
- [ ] Change foreground/background, size, margin, and correction level; verify live redraw and contrast handling.
- [ ] Upload valid and invalid logos; verify type/size limits, logo preview, and H correction.
- [ ] Download PNG, JPG, and SVG; compare colors, size, margin, and logo; open each file.
- [ ] Copy payload, print preview, then clear; confirm export buttons disable with no active QR.
- [ ] Generate twice; confirm preview and downloads use only the latest content/settings.
- [ ] Save history, refresh, download/regenerate/delete an item, and clear history with confirmation.
- [ ] Scan camera and uploaded-image samples; test denied/no-camera errors, stop/navigation cleanup, copy result, and confirmed external-link opening.
- [ ] Generate a batch with valid and malformed entries, check counts/errors, download an individual PNG and ZIP, and try clearing during generation.
- [ ] Toggle theme and refresh; inspect at 1440px desktop, 768px tablet, and 375px mobile widths for clipping and horizontal overflow.

## Future scope
Possible extensions include automated browser/device integration tests, server-side team accounts, cloud-synced history, QR analytics, templates, bulk CSV export, configurable quiet-zone presets, accessibility audits, and localization.

## Conclusion
Smart QR is a modular, client-side academic demonstration covering QR generation, customization, scanning, export, history, and batch processing. The source has passed syntax and focused input-validation checks. Complete claims about camera, download, print, responsive rendering, and other browser-driven features should be made only after the browser checklist is exercised on the target devices.

## Academic diagrams
See [`docs/diagrams.md`](docs/diagrams.md) for the system architecture, use case, Level 0 and Level 1 data flow, activity, and QR generation flowchart diagrams in Mermaid format.
