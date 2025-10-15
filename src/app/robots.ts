import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nxlvlcoach.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/auth-callback/",
          "/client-*/",
          "/organization/",
          "/test-*/",
          "/videos/upload/",
          "/videos/compare/",
          "/requests/",
          "/role-selection/",
          "/program-builder-demo/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
