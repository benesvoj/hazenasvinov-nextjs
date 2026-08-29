/**
 * @description Generates matchweek options based on the selected category.
 * @deprecated Matchweek count is now fixed to 22 for all categories, needs to be refactored, this should be combo of season+category in future
 * @returns Array of matchweek options
 */
// Helper function to generate matchweek options based on category
export const getMatchweekOptions = () => {
  const options = [];
  // Add "No matchweek" option
  options.push({value: '', label: 'Bez kola'});

  const maxMatchweeks = 22; // Default to 20 matchweeks since column doesn't exist

  // Add matchweek numbers based on category setting
  for (let i = 1; i <= maxMatchweeks; i++) {
    options.push({value: i.toString(), label: `${i}. kolo`});
  }
  return options;
};
