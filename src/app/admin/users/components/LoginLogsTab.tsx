'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { LoginLog } from "@/hooks/useFetchUsers";
import { translations } from "@/lib/translations";

interface LoginLogsTabProps {
	loginLogs: LoginLog[];
	loading: boolean;
}

export const LoginLogsTab: React.FC<LoginLogsTabProps> = ({ loginLogs, loading }) => {
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('cs-CZ', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status.toLowerCase()) {
			case 'success':
				return <Badge color="success" variant="flat">Úspěšné</Badge>;
			case 'failed':
				return <Badge color="danger" variant="flat">Neúspěšné</Badge>;
			case 'pending':
				return <Badge color="warning" variant="flat">Čekající</Badge>;
			default:
				return <Badge color="default" variant="flat">{status}</Badge>;
		}
	};

	const truncateUserAgent = (userAgent: string) => {
		if (userAgent.length > 50) {
			return userAgent.substring(0, 50) + '...';
		}
		return userAgent;
	};

	if (loading) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Načítání historie přihlášení...</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<h3 className="text-xl font-semibold">{translations.users.loginLogs.title}</h3>
					<Badge color="primary" variant="flat">{loginLogs.length}</Badge>
				</div>
				<p className="text-sm text-gray-600">{translations.users.loginLogs.description}</p>
			</CardHeader>
			<CardBody>
				{loginLogs.length === 0 ? (
					<div className="text-center py-12 text-gray-500">
						<div className="mb-2">Žádné záznamy o přihlášení</div>
						<div className="text-sm text-gray-400">
							Historie přihlášení se zobrazí po prvním přihlášení uživatelů
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table aria-label="Login logs table">
							<TableHeader>
								<TableColumn>{translations.users.loginLogs.table.user}</TableColumn>
								<TableColumn>{translations.users.loginLogs.table.email}</TableColumn>
								<TableColumn>{translations.users.loginLogs.table.loginTime}</TableColumn>
								<TableColumn>{translations.users.loginLogs.table.ipAddress}</TableColumn>
								<TableColumn>{translations.users.loginLogs.table.userAgent}</TableColumn>
								<TableColumn>{translations.users.loginLogs.table.status}</TableColumn>
							</TableHeader>
							<TableBody>
								{loginLogs.map((log) => (
									<TableRow key={log.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
													<span className="text-sm font-medium text-blue-600">
														{log.email.charAt(0).toUpperCase()}
													</span>
												</div>
												<span className="font-medium">{log.email}</span>
											</div>
										</TableCell>
										<TableCell className="text-sm text-gray-600">{log.email}</TableCell>
										<TableCell className="text-sm">
											<div className="flex flex-col">
												<span className="font-medium">{formatDate(log.login_time)}</span>
												<span className="text-xs text-gray-500">
													{new Date(log.login_time).toLocaleDateString('cs-CZ')}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-sm font-mono text-gray-600">{log.ip_address}</TableCell>
										<TableCell className="text-sm text-gray-600 max-w-xs">
											<div className="truncate" title={log.user_agent}>
												{truncateUserAgent(log.user_agent)}
											</div>
										</TableCell>
										<TableCell>
											{getStatusBadge(log.status)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardBody>
		</Card>
	);
};
