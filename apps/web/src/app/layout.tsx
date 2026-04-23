import type { Metadata } from "next";
import { Fugaz_One, Montserrat } from "next/font/google";
import "@uploadthing/react/styles.css";
import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
});

const fugazOne = Fugaz_One({
	variable: "--font-fugaz-one",
	weight: "400",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Rythmons",
	description: "Plateforme Rythmons",
};

import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body
				className={`${montserrat.className} ${montserrat.variable} ${fugazOne.variable} antialiased`}
			>
				<Providers routerConfig={extractRouterConfig(ourFileRouter)}>
					<div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
						<Header />
						<div className="min-h-0">{children}</div>
						<SiteFooter />
					</div>
				</Providers>
			</body>
		</html>
	);
}
