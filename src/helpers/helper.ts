export const ExtractDate = (date: string | undefined) => {
		if (date === null || date === undefined) {
			return 'N/A';
		} else new Date(date).toLocaleDateString()
}