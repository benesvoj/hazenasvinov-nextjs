'use client';

import { useEffect, useState } from "react";
import { fetchCSVData } from "@/utils/fetchCSVdata";

export const useCSVData = (url: string) => {
	const [data, setData] = useState<string[][]>([]);

	useEffect(() => {
		fetchCSVData(url).then(setData);
	}, [url]);

	return data;
};