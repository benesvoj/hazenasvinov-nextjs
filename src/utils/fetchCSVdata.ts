export const fetchCSVData = async (url: string): Promise<string[][]> => {
	const response = await fetch(url);
	const text = await response.text();
	return text.split('\n').map((row) => row.split(',').map((cell) => cell.trim()));
};