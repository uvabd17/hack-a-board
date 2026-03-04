"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Scan, X } from "lucide-react"

export function Scanner({ slug }: { slug: string }) {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerStartedRef = useRef(false)

    async function safeStopScanner() {
        const scanner = scannerRef.current
        if (!scanner || !scannerStartedRef.current) return
        try {
            await scanner.stop()
        } catch {
            // Ignore "not running/paused" and similar stop races.
        } finally {
            scannerStartedRef.current = false
        }
    }

    function getJudgeRoutingTarget(decodedText: string): string | null {
        const trimmed = decodedText.trim()
        if (!trimmed) return null

        // 1) Token-only QR
        if (!trimmed.includes("/") && !trimmed.includes(":")) {
            return `/h/${slug}/qr/${trimmed}`
        }

        // 2) URL QR: normalize to current origin to preserve current judge cookie domain.
        try {
            const parsed = new URL(trimmed)
            const m = parsed.pathname.match(/^\/h\/([^/]+)\/qr\/([^/?#]+)/i)
            if (!m) return null
            const token = m[2]
            return `/h/${slug}/qr/${token}`
        } catch {
            // 3) Raw path fallback
            const m = trimmed.match(/\/h\/([^/]+)\/qr\/([^/?#]+)/i)
            if (!m) return null
            const token = m[2]
            return `/h/${slug}/qr/${token}`
        }
    }

    useEffect(() => {
        if (!isScanning) return
        let cancelled = false

        const startScanner = async () => {
            setError(null)
            try {
                if (typeof window === "undefined") {
                    setError("Scanner is only available in browser context.")
                    setIsScanning(false)
                    return
                }
                if (!window.isSecureContext) {
                    setError("Camera requires a secure context (HTTPS).")
                    setIsScanning(false)
                    return
                }
                if (!navigator.mediaDevices?.getUserMedia) {
                    setError("This browser does not support camera access APIs.")
                    setIsScanning(false)
                    return
                }

                const scanner = new Html5Qrcode("reader")
                scannerRef.current = scanner

                let cameraConfig: string | { facingMode: string } | { deviceId: { exact: string } } = { facingMode: "environment" }
                const cameras = await Html5Qrcode.getCameras()
                if (cameras.length > 0) {
                    const rear = cameras.find((c) =>
                        /back|rear|environment/i.test(c.label || "")
                    )
                    const selected = rear || cameras[0]
                    if (selected?.id) {
                        cameraConfig = { deviceId: { exact: selected.id } }
                    }
                }

                await scanner.start(
                    cameraConfig,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        if (cancelled) return
                        const nextPath = getJudgeRoutingTarget(decodedText)
                        if (!nextPath) {
                            setError("Scanned QR is not a valid participant/judge pass.")
                            return
                        }
                        await safeStopScanner()
                        setIsScanning(false)
                        window.location.assign(nextPath)
                    },
                    () => {
                        // Ignore per-frame decode errors.
                    }
                )
                scannerStartedRef.current = true
            } catch (err) {
                const name = (err as { name?: string })?.name || ""
                if (name === "NotAllowedError" || name === "PermissionDeniedError") {
                    setError("Camera permission denied. Allow camera for this site and retry.")
                } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
                    setError("No camera device found on this browser/device.")
                } else if (name === "NotReadableError" || name === "TrackStartError") {
                    setError("Camera is in use by another app/tab. Close it and retry.")
                } else {
                    setError("Scanner could not start. Check camera permissions and HTTPS, then retry.")
                }
                setIsScanning(false)
            }
        }

        startScanner()

        return () => {
            cancelled = true
            safeStopScanner()
            scannerRef.current = null
        }
    }, [isScanning, slug])

    return (
        <div className="w-full max-w-sm mx-auto mb-8">
            {!isScanning ? (
                <div className="space-y-2">
                    <Button
                        size="lg"
                        className="w-full h-32 text-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 border-2 border-green-500 rounded-xl"
                        onClick={() => {
                            setError(null)
                            setIsScanning(true)
                        }}
                    >
                        <Scan size={48} className="mr-4" />
                        SCAN_TEAM
                    </Button>
                    {error && (
                        <p className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 p-2 rounded">
                            {error}
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-black border border-green-500 rounded-xl overflow-hidden relative">
                    <div id="reader" className="w-full"></div>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 z-50 rounded-full"
                        onClick={() => setIsScanning(false)}
                    >
                        <X size={20} />
                    </Button>
                    <p className="text-center text-xs text-green-500 py-2">Point camera at Team QR</p>
                </div>
            )}
        </div>
    )
}
