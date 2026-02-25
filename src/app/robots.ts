import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hackaboard.dev"

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/dashboard",
                    "/h/*/manage/",
                    "/h/*/judge/",
                    "/h/*/qr/",
                    "/signin",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
