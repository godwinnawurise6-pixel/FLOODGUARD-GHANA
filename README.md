├── public/
│   ├── manifest.json              # Web App Manifest for iOS & Android installation
│   ├── sw.js                      # Service Worker for offline caching
│   ├── apple-touch-icon.png       # iOS Home Screen Logo
│   ├── icon-192.png               # PWA Icon (192x192)
│   └── icon-512.png               # PWA Icon (512x512)
├── src/
│   ├── assets/                    # App assets and icons
│   ├── components/                # Modular UI Components
│   │   ├── AdminDashboard.tsx     # Administrator analytics & zone configuration
│   │   ├── AuthorityDashboard.tsx # NADMO / Municipal response dispatch portal
│   │   ├── EmergencyScreen.tsx    # Hotline directory, siren, and safety guides
│   │   ├── FloodMap.tsx           # Leaflet interactive flood GIS map
│   │   ├── Header.tsx             # App bar with connectivity & role toggles
│   │   ├── HomeScreen.tsx         # Dashboard overview, live weather & quick reports
│   │   ├── MobileBottomNav.tsx    # Responsive sticky bottom navigation bar
│   │   ├── MobileInstallModal.tsx # PWA install guide for PC, iOS & Android
│   │   ├── ReportModal.tsx        # Incident reporting modal with voice/photo inputs
│   │   ├── SafeRoutePlanner.tsx   # Flood-free commute routing & map guidance
│   │   └── SavedLocationsModal.tsx# Bookmark favorite suburbs & alert settings
│   ├── data/                      # Initial seed datasets (zones, contacts, reports)
│   ├── services/                  # Business logic & APIs
│   │   ├── floodRiskEngine.ts     # Risk calculation & prediction algorithms
│   │   ├── mobileUtils.ts         # PWA installation & haptic feedback helpers
│   │   ├── offlineStorage.ts      # Local cache & offline sync management
│   │   ├── routingService.ts      # Alternate bypass routing engine
│   │   └── weatherService.ts      # Live rainfall monitoring & forecasts
│   ├── types.ts                   # Core TypeScript data models & interfaces
│   ├── App.tsx                    # Main application root & state controller
│   └── main.tsx                   # React DOM entry point
├── metadata.json                  # Application metadata and permissions
├── package.json                   # Dependencies and scripts
├── server.ts                      # Express server entry point
└── tsconfig.json                  # TypeScript configuration
