'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { LoginLog } from "@/hooks/useFetchUsers";
import { translations } from "@/lib/translations";
import { 
	ArrowRightOnRectangleIcon, 
	ArrowLeftOnRectangleIcon,
	CheckCircleIcon,
	XCircleIcon,
	ClockIcon
} from "@heroicons/react/24/outline";

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

	const getActionIcon = (action: string) => {
		switch (action.toLowerCase()) {
			case 'login':
				return <ArrowRightOnRectangleIcon className="w-4 h-4 text-blue-600" />;
			case 'logout':
				return <ArrowLeftOnRectangleIcon className="w-4 h-4 text-gray-600" />;
			default:
				return <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400" />;
		}
	};

	const getActionText = (action: string) => {
		switch (action.toLowerCase()) {
			case 'login':
				return 'Přihlášení';
			case 'logout':
				return 'Odhlášení';
			default:
				return action;
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case 'success':
				return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
			case 'failed':
				return <XCircleIcon className="w-5 h-5 text-red-500" />;
			case 'pending':
				return <ClockIcon className="w-5 h-5 text-yellow-500" />;
			default:
				return <ClockIcon className="w-5 h-5 text-gray-400" />;
		}
	};

	const getStatusText = (status: string) => {
		switch (status.toLowerCase()) {
			case 'success':
				return 'Úspěšné';
			case 'failed':
				return 'Neúspěšné';
			case 'pending':
				return 'Čekající';
			default:
				return status;
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
				<div className="flex flex-col items-start gap-2">
					<h3 className="text-xl font-semibold">{translations.users.loginLogs.title}</h3>
					<p className="text-sm text-gray-600">{translations.users.loginLogs.description}</p>
				</div>
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
								<TableColumn>Uživatel</TableColumn>
								<TableColumn>Akce</TableColumn>
								<TableColumn>Čas</TableColumn>
								<TableColumn>Prohlížeč</TableColumn>
								<TableColumn>Stav</TableColumn>
							</TableHeader>
							<TableBody>
								{loginLogs.map((log) => (
									<TableRow key={log.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
													<span className="text-sm font-semibold text-white">
														{log.email.charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="flex flex-col">
													<span className="font-medium text-gray-900">{log.email}</span>
													<span className="text-xs text-gray-500">
														{new Date(log.login_time).toLocaleDateString('cs-CZ')}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{getActionIcon(log.action || 'login')}
												<span className="text-sm font-medium text-gray-700">
													{getActionText(log.action || 'login')}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-sm">
											<div className="flex flex-col">
												<span className="font-medium text-gray-900">{formatDate(log.login_time)}</span>
												<span className="text-xs text-gray-500">
													{new Date(log.login_time).toLocaleTimeString('cs-CZ', {
														hour: '2-digit',
														minute: '2-digit'
													})}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-sm text-gray-600 max-w-xs">
											<div className="truncate" title={log.user_agent}>
												{truncateUserAgent(log.user_agent)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{getStatusIcon(log.status)}
												<span className="text-sm font-medium text-gray-700">
													{getStatusText(log.status)}
												</span>
											</div>
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
