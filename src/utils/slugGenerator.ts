/**
 * Generate URL-friendly slug from Czech text
 * Handles Czech diacritics and special characters properly
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    // Replace Czech diacritics
    .replace(/á/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ď/g, 'd')
    .replace(/é/g, 'e')
    .replace(/ě/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ň/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ř/g, 'r')
    .replace(/š/g, 's')
    .replace(/ť/g, 't')
    .replace(/ú/g, 'u')
    .replace(/ů/g, 'u')
    .replace(/ý/g, 'y')
    .replace(/ž/g, 'z')
    // Replace uppercase versions
    .replace(/Á/g, 'a')
    .replace(/Č/g, 'c')
    .replace(/Ď/g, 'd')
    .replace(/É/g, 'e')
    .replace(/Ě/g, 'e')
    .replace(/Í/g, 'i')
    .replace(/Ň/g, 'n')
    .replace(/Ó/g, 'o')
    .replace(/Ř/g, 'r')
    .replace(/Š/g, 's')
    .replace(/Ť/g, 't')
    .replace(/Ú/g, 'u')
    .replace(/Ů/g, 'u')
    .replace(/Ý/g, 'y')
    .replace(/Ž/g, 'z')
    // Replace spaces and special characters with hyphens
    .replace(/[\s\-_]+/g, '-')
    // Remove any remaining non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9\-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^\-+|\-+$/g, '')
    // Limit length to 60 characters
    .substring(0, 60)
    .replace(/\-$/, ''); // Remove trailing hyphen if cut off
}

/**
 * Generate unique slug by appending number if needed
 */
export function generateUniqueSlug(baseText: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSlug(baseText);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
