export interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	meta?: {
		total: number;
		page: number;
		limit: number;
	};
}