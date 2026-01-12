import type { Metadata } from "next";
import { Fugaz_One, Montserrat } from "next/font/google";
import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const montserrat = Montserrat({
	variable: "--font-montserrat",
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
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
