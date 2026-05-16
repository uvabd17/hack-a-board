import { ImageResponse } from "next/og"

/**
 * Apple touch icon — used when iOS / iPadOS users add the site to the
 * home screen, and as the og:image fallback in some chat clients
 * (Slack, iMessage link previews). Rendered server-side as a 180×180
 * PNG so we don't commit a binary; the SVG-equivalent is icon.svg
 * for everyday browser tab favicons.
 */
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "#0E0E12",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3DD9E0",
                    fontSize: 144,
                    fontWeight: 900,
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                    letterSpacing: -10,
                }}
            >
                a
            </div>
        ),
        { ...size },
    )
}
