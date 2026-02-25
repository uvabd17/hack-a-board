import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ManageShell } from "@/components/manage-shell"

export default async function ManageLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/signin")
    }

    const { slug } = await params

    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, userId: true, name: true, slug: true }
    })

    if (!hackathon) {
        notFound()
    }

    if (hackathon.userId !== session.user.id) {
        notFound() // Access denied - hide existence
    }

    return <ManageShell hackathonName={hackathon.name} hackathonSlug={hackathon.slug}>{children}</ManageShell>
}
