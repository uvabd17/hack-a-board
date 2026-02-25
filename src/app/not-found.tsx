import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md px-6">
                <div className="text-8xl font-bold text-zinc-800">404</div>
                <h1 className="text-xl font-bold tracking-tight">Page not found</h1>
                <p className="text-zinc-500 text-sm">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2 bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                    GO HOME
                </Link>
            </div>
        </div>
    )
}
