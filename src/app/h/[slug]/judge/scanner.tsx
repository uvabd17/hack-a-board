"use client"

import { useState, useEffect, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Scan, X } from "lucide-react"

export function Scanner({ slug }: { slug: string }) {
    const [isScanning, setIsScanning] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        if (isScanning && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            )

            scanner.render((decodedText) => {
                // Handle Success
                // decodedText is likely the full URL like https://.../h/slug/qr/token
                // or just the token if we generated plain tokens.
                // Assuming URL based on our QR generation in Phase 3.

                // We just redirect the browser to that URL. 
                // The QR Router will handle the rest (Smart Routing).
                window.location.href = decodedText

                scanner.clear()
                setIsScanning(false)
            }, (error) => {
                // Ignore errors (scanning in progress)
            })

            scannerRef.current = scanner
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear()
                } catch (e) {
                    // ignore cleanup errors
                }
                scannerRef.current = null
            }
        }
    }, [isScanning])

    return (
        <div className="w-full max-w-sm mx-auto mb-8">
            {!isScanning ? (
                <Button
                    size="lg"
                    className="w-full h-32 text-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 border-2 border-green-500 rounded-xl"
                    onClick={() => setIsScanning(true)}
                >
                    <Scan size={48} className="mr-4" />
                    SCAN_TEAM
                </Button>
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
