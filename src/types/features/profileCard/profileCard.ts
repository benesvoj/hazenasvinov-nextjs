/**
 * Represents a public-facing profile card containing basic user information.
 *
 * This interface is commonly used to display user details that can be shared publicly.
 * It includes properties for identification, contact information, and optional notes or a profile photo.
 *
 * Properties:
 * - `id`: A unique identifier for the profile card.
 * - `name`: The first name of the individual.
 * - `surname`: The last name of the individual.
 * - `email`: An optional email address for contacting the individual.
 * - `phone`: An optional phone number for contacting the individual.
 * - `note`: An optional note or additional information about the individual.
 * - `photo_url`: An optional URL pointing to the individual's profile photo.
 */
export interface PublicProfileCard {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone?: string | null;
  note?: string | null;
  photo_url: string | null;
  role?: string | null;
}
