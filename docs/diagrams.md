# Smart QR Academic Diagrams

The diagrams use Mermaid. Render them in a Mermaid-compatible Markdown preview or export them to image format for a report.

## System architecture
```mermaid
flowchart LR
    U[User] --> UI[HTML and CSS interface]
    UI --> APP[app.js navigation and theme]
    UI --> GEN[generator.js payload forms]
    GEN --> VAL[validation.js]
    GEN --> CUS[customization.js QR renderer and exports]
    CUS --> QR[QRCodeStyling CDN]
    UI --> SCAN[scanner.js]
    SCAN --> H5[html5-qrcode CDN]
    UI --> BATCH[batch.js]
    BATCH --> QR
    BATCH --> ZIP[JSZip CDN]
    CUS --> HIST[history.js]
    HIST <--> LS[(Browser LocalStorage)]
    APP <--> LS
    GEN --> NOTIFY[notifications.js]
    CUS --> NOTIFY
    SCAN --> NOTIFY
    BATCH --> NOTIFY
```

## Use case diagram
```mermaid
flowchart LR
    User([User])
    subgraph App[Smart QR Generator and Scanner]
      UC1((Generate one of six QR types))
      UC2((Customize colors size correction and logo))
      UC3((Download PNG JPG or SVG))
      UC4((Copy or print QR content))
      UC5((Scan using camera or image))
      UC6((Copy scan result))
      UC7((Open scanned URL after confirmation))
      UC8((Manage generation history))
      UC9((Generate batch and download ZIP))
      UC10((Change theme))
    end
    User --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6
    User --- UC7
    User --- UC8
    User --- UC9
    User --- UC10
```

## Data flow diagram — Level 0
```mermaid
flowchart LR
    User[User] -->|QR input, customization, scan controls| System((Smart QR Application))
    System -->|QR preview, scan result, downloads, notices| User
    System <-->|Saved QR records and theme preference| Store[(Browser LocalStorage)]
    Camera[Device camera or image file] -->|Image frames or selected image| System
    System -->|Validated QR content| User
```

## Data flow diagram — Level 1
```mermaid
flowchart LR
    User[User] -->|Typed values and settings| P1((1. Validate and format payload))
    P1 -->|QR payload| P2((2. Render customized QR))
    P2 -->|Preview and export data| User
    P2 -->|Generation record| P3((3. Save and manage history))
    P3 <-->|Compact records| D1[(LocalStorage history)]
    Camera[Camera or uploaded image] -->|Image| P4((4. Decode QR))
    P4 -->|Decoded text| User
    User -->|Batch lines or CSV| P5((5. Generate batch))
    P5 -->|Individual QR files and ZIP| User
    User -->|Theme choice| P6((6. Save theme setting))
    P6 <-->|Theme preference| D2[(LocalStorage theme)]
```

## Activity diagram
```mermaid
flowchart TD
    A([Start]) --> B[Choose generator, scanner, history, or batch]
    B --> C{Generate QR?}
    C -->|Yes| D[Enter payload and customization]
    D --> E{Valid payload and contrast?}
    E -->|No| F[Show validation notice]
    F --> D
    E -->|Yes| G[Render QR and preview]
    G --> H[Save compact record in LocalStorage]
    H --> I{Export, copy, print, or clear?}
    I -->|Export/copy/print| J[Perform selected browser action]
    I -->|Clear| K[Clear preview]
    C -->|No| L{Scan QR?}
    L -->|Yes| M[Request camera or select image]
    M --> N{Camera/image readable?}
    N -->|No| O[Show permission or decoding error]
    N -->|Yes| P[Display decoded text]
    P --> Q{Open URL?}
    Q -->|Yes| R[Validate URL and ask confirmation]
    Q -->|No| B
    R --> B
    L -->|No| S{Batch generation?}
    S -->|Yes| T[Validate lines and render asynchronously]
    T --> U[Download files or ZIP]
    S -->|No| V[Manage history or theme]
    J --> W([Continue or finish])
    K --> W
    O --> W
    U --> W
    V --> W
```

## QR code generation flowchart
```mermaid
flowchart TD
    A([Click Generate]) --> B[Read selected QR type and form fields]
    B --> C{Required values present?}
    C -->|No| D[Show error notice]
    D --> Z([End])
    C -->|Yes| E[Validate and format payload]
    E --> F{Payload valid?}
    F -->|No| D
    F -->|Yes| G[Read colors, size, margin, correction, and logo]
    G --> H{Contrast sufficient?}
    H -->|No| I[Keep preview/export disabled and request stronger contrast]
    I --> Z
    H -->|Yes| J[Render QR with QRCodeStyling]
    J --> K{Rendering successful?}
    K -->|No| L[Show generation error]
    L --> Z
    K -->|Yes| M[Display preview and enable exports]
    M --> N[Save content and settings to LocalStorage history]
    N --> O[Show success notice]
    O --> Z([End])
```
