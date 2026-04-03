"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, X, AlertTriangle } from "lucide-react"

export function Scanner({ slug }: { slug: string }) {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cameraSupported, setCameraSupported] = useState(true)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerStartedRef = useRef(false)

    // Check camera support on mount
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!window.isSecureContext) {
            setCameraSupported(false)
            setError("Camera requires HTTPS. Use the manual code entry below instead.")
        } else if (!navigator.mediaDevices?.getUserMedia) {
            setCameraSupported(false)
            setError("This browser doesn't support camera access.")
        }
    }, [])

    async function safeStopScanner() {
        const scanner = scannerRef.current
        if (!scanner || !scannerStartedRef.current) return
        try {
            await scanner.stop()
        } catch {
            // Ignore stop races
        } finally {
            scannerStartedRef.current = false
        }
    }

    function getJudgeRoutingTarget(decodedText: string): string | null {
        const trimmed = decodedText.trim()
        if (!trimmed) return null

        // Token-only QR
        if (!trimmed.includes("/") && !trimmed.includes(":")) {
            return `/h/${slug}/qr/${trimmed}`
        }

        // URL QR
        try {
            const parsed = new URL(trimmed)
            const m = parsed.pathname.match(/^\/h\/([^/]+)\/qr\/([^/?#]+)/i)
            if (!m) return null
            return `/h/${slug}/qr/${m[2]}`
        } catch {
            const m = trimmed.match(/\/h\/([^/]+)\/qr\/([^/?#]+)/i)
            if (!m) return null
            return `/h/${slug}/qr/${m[2]}`
        }
    }

    useEffect(() => {
        if (!isScanning) return
        let cancelled = false

        const startScanner = async () => {
            setError(null)
            try {
                const scanner = new Html5Qrcode("reader")
                scannerRef.current = scanner

                const config = { fps: 10, qrbox: { width: 220, height: 220 } }
                const onScanSuccess = async (decodedText: string) => {
                    if (cancelled) return
                    const nextPath = getJudgeRoutingTarget(decodedText)
                    if (!nextPath) {
                        setError("Not a valid team or judge QR.")
                        return
                    }
                    await safeStopScanner()
                    setIsScanning(false)
                    window.location.assign(nextPath)
                }

                try {
                    await scanner.start(
                        { facingMode: { exact: "environment" } },
                        config,
                        onScanSuccess,
                        () => {}
                    )
                    scannerStartedRef.current = true
                } catch {
                    const cameras = await Html5Qrcode.getCameras()
                    if (cameras.length === 0) throw new Error("DevicesNotFoundError")
                    const rear = cameras.find((c) => /back|rear|environment/i.test(c.label || ""))
                    const selected = rear || cameras[0]
                    await scanner.start(
                        selected?.id ? { deviceId: { exact: selected.id } } : "",
                        config,
                        onScanSuccess,
                        () => {}
                    )
                    scannerStartedRef.current = true
                }
            } catch (err) {
                const name = (err as { name?: string })?.name || ""
                if (name === "NotAllowedError" || name === "PermissionDeniedError") {
                    setError("Camera permission denied. Allow camera access and retry.")
                } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
                    setError("No camera found on this device.")
                } else if (name === "NotReadableError" || name === "TrackStartError") {
                    setError("Camera is in use by another app. Close it and retry.")
                } else {
                    setError("Scanner could not start. Check camera permissions.")
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

    // Camera not supported — show a subtle notice, don't show the scan button
    if (!cameraSupported) {
        return (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-amber-200 font-medium">Camera unavailable</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {!isScanning ? (
                <div className="space-y-3">
                    <Button
                        size="lg"
                        variant="brutal"
                        className="w-full h-16 text-lg font-black gap-3"
                        onClick={() => {
                            setError(null)
                            setIsScanning(true)
                        }}
                    >
                        <Camera className="w-6 h-6" />
                        Scan Team QR
                    </Button>
                    {error && (
                        <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-destructive">{error}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="border-2 border-[var(--role-accent)] rounded-lg overflow-hidden relative bg-black">
                    <div id="reader" className="w-full" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full"
                        onClick={() => setIsScanning(false)}
                    >
                        <X size={18} />
                    </Button>
                    <div className="text-center py-2 bg-black/80">
                        <p className="text-xs text-[var(--role-accent)] font-medium">Point at team QR code</p>
                    </div>
                </div>
            )}
        </div>
    )
}
