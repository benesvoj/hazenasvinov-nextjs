// Get role badge color
export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'danger';
    case 'head_coach':
      return 'warning';
    case 'coach':
      return 'primary';
    case 'member':
      return 'default';
    default:
      return 'default';
  }
};
