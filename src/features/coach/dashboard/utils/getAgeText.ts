/**
 * Returns a text representation of the given age in Czech grammar,
 * including appropriate singular and plural forms.
 *
 * @param {number} age - The age to format as text.
 * @return string The formatted age text with proper grammatical form.
 */
export const getAgeText = (age: number) => {
  if (age === 1) return '1 rok';
  if (age >= 2 && age <= 4) return `${age} roky`;
  return `${age} let`;
};
