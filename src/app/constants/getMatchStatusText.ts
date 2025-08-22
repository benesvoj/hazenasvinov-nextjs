export const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Odehráno';
      case 'upcoming':
        return 'Neodehráno';
      default:
        return status;
    }
  };