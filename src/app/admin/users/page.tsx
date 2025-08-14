'use client';

import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useFetchUsers } from "@/hooks/useFetchUsers";
import { UsersTab } from "./components/UsersTab";
import { LoginLogsTab } from "./components/LoginLogsTab";
import { translations } from "@/lib/translations";
import { useState } from "react";

export default function Page() {
	const [selectedTab, setSelectedTab] = useState<string>("users");
	const { 
		users, 
		loginLogs, 
		loading, 
		error,
		pagination,
		selectedUser,
		changePage,
		changeUserFilter,
		clearFilters
	} = useFetchUsers(selectedTab === "loginLogs");

	if (error) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="text-red-600 mb-4">
						<svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">Chyba při načítání</h3>
					<p className="text-gray-600">{error.message}</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className="space-y-6">

			{/* Tabs */}
			<Tabs 
				selectedKey={selectedTab} 
				onSelectionChange={(key) => setSelectedTab(key as string)}
				className="w-full"
				color="primary"
				variant="underlined"
				size="lg"
			>
				<Tab key="users" title={translations.users.tabs.users} />
				<Tab key="loginLogs" title={translations.users.tabs.loginLogs} />
			</Tabs>

			{/* Tab Content */}
			{selectedTab === "users" && (
				<UsersTab users={users} loading={loading} />
			)}
			
			{selectedTab === "loginLogs" && (
				<LoginLogsTab 
					loginLogs={loginLogs} 
					loading={loading}
					users={users}
					pagination={pagination}
					selectedUser={selectedUser}
					onPageChange={changePage}
					onUserFilterChange={changeUserFilter}
					onClearFilters={clearFilters}
				/>
			)}
		</div>
	);
}