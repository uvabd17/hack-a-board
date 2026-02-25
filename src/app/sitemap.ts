import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hackaboard.dev"

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date("2026-02-25"),
            changeFrequency: "yearly",
            priority: 0.2,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date("2026-02-25"),
            changeFrequency: "yearly",
            priority: 0.2,
        },
        {
            url: `${baseUrl}/security`,
            lastModified: new Date("2026-02-25"),
            changeFrequency: "yearly",
            priority: 0.2,
        },
    ]

    // Dynamic hackathon public pages (only published/live ones)
    try {
        const hackathons = await prisma.hackathon.findMany({
            where: { status: { in: ["published", "live"] } },
            select: { slug: true, updatedAt: true },
        })

        const hackathonPages: MetadataRoute.Sitemap = hackathons.map((h) => ({
            url: `${baseUrl}/h/${h.slug}`,
            lastModified: h.updatedAt,
            changeFrequency: "daily" as const,
            priority: 0.8,
        }))

        return [...staticPages, ...hackathonPages]
    } catch {
        return staticPages
    }
}
