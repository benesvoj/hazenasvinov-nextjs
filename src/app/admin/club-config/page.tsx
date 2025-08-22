'use client';

import { Tabs, Tab } from "@heroui/tabs";
import ClubConfigCard from "./components/ClubConfigCard";
import ClubPagesCard from "./components/ClubPagesCard";

export default function ClubConfigPage() {

	return (
		<div className="space-y-6">
			<Tabs aria-label="Konfigurace klubu">
				<Tab key="club-config" title="Konfigurace klubu">
					<ClubConfigCard />
				</Tab>
				<Tab key="club-pages" title="Stránky klubu">
					<ClubPagesCard />
				</Tab>
			</Tabs>
		</div>
	);
}
