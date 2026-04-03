import RegistrationForm from "@/components/registration-form"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BrandFooter } from "@/components/ui/brand"

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug }
    })

    if (!hackathon || hackathon.isArchived) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight">{hackathon.name}</h1>
                <p className="text-xs text-muted-foreground mt-2">
                    Already registered?{" "}
                    <Link className="text-primary underline" href={`/h/${slug}/participant-login`}>
                        Open participant login
                    </Link>
                </p>
            </div>
            <RegistrationForm hackathonSlug={slug} />
            <BrandFooter className="mt-8" />
        </div>
    )
}
