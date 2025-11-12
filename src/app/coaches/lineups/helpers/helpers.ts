export const getPositionColor = (position: string) => {
	switch (position) {
		case 'goalkeeper':
			return 'primary';
		case 'field_player':
			return 'success';
		default:
			return 'default';
	}
};

export const getPositionText = (position: string) => {
	switch (position) {
		case 'goalkeeper':
			return 'Brankář';
		case 'field_player':
			return 'Hráč v poli';
		default:
			return position;
	}
};