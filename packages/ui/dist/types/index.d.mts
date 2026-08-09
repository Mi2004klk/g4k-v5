interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

export type { ApiResponse };
