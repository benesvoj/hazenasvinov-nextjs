import {Header} from "@/components/Header";
import { translations } from "@/lib/translations";
import React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Header/>
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</main>
			<footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="text-center text-sm text-gray-600 dark:text-gray-400">
						{translations.footer.copyright}
					</div>
				</div>
			</footer>
		</div>
	);
}
