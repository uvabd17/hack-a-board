import RegistrationForm from "@/components/registration-form"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug }
    })

    if (!hackathon) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-muted-foreground">{hackathon.name}</h1>
            </div>
            <RegistrationForm hackathonSlug={slug} />
        </div>
    )
}
