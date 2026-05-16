import type { MetadataRoute } from "next"

/**
 * Web App Manifest — drives the "Add to Home Screen" experience on
 * Android / Chrome, plus the address-bar tint on mobile. Theme color
 * matches the wrapped feature's ink. Icons reference the existing
 * icon.svg + apple-icon endpoints so we have a single source of truth.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "hackaboard",
        short_name: "hackaboard",
        description: "Real-time hackathon operations — leaderboards, QR judging, and ceremony reveals.",
        start_url: "/",
        display: "standalone",
        background_color: "#0E0E12",
        theme_color: "#0E0E12",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
                purpose: "any",
            },
        ],
    }
}
