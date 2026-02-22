import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function DebugSession() {
    let session = null
    let sessionError = null
    
    try {
        session = await auth()
    } catch (error: any) {
        sessionError = error.message
    }
    
    const hackathons = await prisma.hackathon.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            }
        }
    })
    
    return (
        <div className="p-8 bg-black text-white font-mono">
            <h1 className="text-2xl mb-4">Debug Session</h1>
            
            {sessionError && (
                <div className="mb-8 bg-red-900/20 border border-red-500 p-4 rounded">
                    <h2 className="text-xl mb-2 text-red-400">Session Error:</h2>
                    <p className="text-red-300 mb-2">{sessionError}</p>
                    <p className="text-sm text-zinc-400">
                        This usually means old session cookies are incompatible with the current auth setup.
                        <br />
                        <strong>Solution:</strong> Clear your browser cookies for localhost:3000 and try again.
                    </p>
                </div>
            )}
            
            <div className="mb-8">
                <h2 className="text-xl mb-2">Current Session:</h2>
                <pre className="bg-zinc-900 p-4 rounded overflow-auto">
                    {JSON.stringify(session, null, 2)}
                </pre>
            </div>
            
            <div>
                <h2 className="text-xl mb-2">Hackathons in Database:</h2>
                <pre className="bg-zinc-900 p-4 rounded overflow-auto">
                    {JSON.stringify(hackathons, null, 2)}
                </pre>
            </div>
        </div>
    )
}
