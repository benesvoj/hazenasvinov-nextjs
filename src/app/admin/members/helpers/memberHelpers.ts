import { CategoryNew } from "@/types";
import { GenderType } from "@/constants";

/**
 * Get the display name for a category code
 * @deprecated Use getCategoryNameById instead for new system
 */
export const getCategoryName = (categoryCode: string, categories: Record<string, string>) => {
  return categories[categoryCode] || categoryCode;
};

/**
 * Get the display name for a category by ID
 * Updated for the new category system using IDs
 */
export const getCategoryNameById = (categoryId: string, categories: CategoryNew[] | null) => {
  if (!categories) return categoryId;
  const category = categories.find(cat => cat.id === categoryId);
  return category?.name || categoryId;
};

/**
 * Get the appropriate badge color for a category based on gender and name
 */
export const getCategoryBadgeColor = (categoryId: string, categoriesData: CategoryNew[] | null) => {
  if (!categoriesData) return "default";
  
  const categoryData = categoriesData.find(cat => cat.id === categoryId);
  if (!categoryData) return "default";
  
  if (categoryData.gender === 'male') return "primary";
  if (categoryData.gender === 'female') return "secondary";
  if (categoryData.gender === 'mixed') return "success";
  
  // Fallback for categories without gender
  if (categoryData.name.toLowerCase().includes('kids') || categoryData.name.toLowerCase().includes('prep')) return "warning";
  if (categoryData.name.toLowerCase().includes('boys')) return "primary";
  if (categoryData.name.toLowerCase().includes('girls')) return "secondary";
  
  return "default";
};

/**
 * Get the appropriate badge color for sex
 */
export const getSexBadgeColor = (sex: "male" | "female") => {
  return sex === "male" ? "primary" : "secondary";
};

/**
 * Format date of birth and calculate age
 */
export const formatDateOfBirth = (dateOfBirth: string) => {
  const birthDate = new Date(dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  return {
    formattedDate: birthDate.toLocaleDateString("cs-CZ"),
    age
  };
};

/**
 * Filter members based on search term and filters
 */
export const filterMembers = (
  members: any[],
  searchTerm: string,
  filters: {
    sex: GenderType;
    category: string;
    function: string;
  }
) => {
  let filtered = members;

  // Filter by search term (name, surname, or registration number)
  if (searchTerm) {
    filtered = filtered.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.registration_number &&
          member.registration_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Filter by sex
  if (filters.sex) {
    filtered = filtered.filter((member) => member.sex === filters.sex);
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((member) => member.category === filters.category);
  }

  // Filter by function
  if (filters.function) {
    filtered = filtered.filter((member) =>
      member.functions && member.functions.length > 0 && member.functions.includes(filters.function)
    );
  }

  return filtered;
};

/**
 * Sort members based on sort descriptor
 */
export const sortMembers = (
  members: any[],
  sortDescriptor: {
    column: string;
    direction: "ascending" | "descending";
  }
) => {
  return [...members].sort((a, b) => {
    const first = a[sortDescriptor.column as keyof typeof a];
    const second = b[sortDescriptor.column as keyof typeof b];

    if (first === null || second === null) {
      return 0;
    }

    if (typeof first === "string" && typeof second === "string") {
      return sortDescriptor.direction === "ascending"
        ? first.localeCompare(second)
        : second.localeCompare(first);
    }

    if (typeof first === "number" && typeof second === "number") {
      return sortDescriptor.direction === "ascending"
        ? first - second
        : second - first;
    }

    // Handle registration number sorting
    if (sortDescriptor.column === "registration_number") {
      const extractNumber = (str: string) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };

      const numA = extractNumber(first as string);
      const numB = extractNumber(second as string);

      return sortDescriptor.direction === "ascending"
        ? numA - numB
        : numB - numA;
    }

    return 0;
  });
};

/**
 * Convert categories array to Record format for compatibility
 * Uses category code as key for backward compatibility with existing components
 */
export const convertCategoriesToRecord = (categoriesData: CategoryNew[] | null) => {
  if (!categoriesData) return {};
  return categoriesData.reduce((acc, category) => {
    acc[category.code] = category.name;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Create reverse mapping from name to ID for form submission
 * Updated to use category ID instead of code for the new system
 */
export const createCategoryNameToIdMap = (categoriesData: CategoryNew[] | null) => {
  if (!categoriesData) return {};
  return categoriesData.reduce((acc, category) => {
    acc[category.name] = category.id;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * @deprecated Use createCategoryNameToIdMap instead
 * Legacy function for backward compatibility
 */
export const createCategoryNameToCodeMap = (categoriesData: CategoryNew[] | null) => {
  if (!categoriesData) return {};
  return categoriesData.reduce((acc, category) => {
    acc[category.name] = category.code;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Check if member has active functions
 */
export const hasActiveFunctions = (member: { functions?: string[] }) => {
  return member.functions && member.functions.length > 0;
};

/**
 * Get member status indicator data
 */
export const getMemberStatusData = (member: { functions?: string[] }) => {
  const isActive = hasActiveFunctions(member);
  return {
    isActive,
    color: isActive ? "bg-green-500" : "bg-red-500",
    title: isActive ? "Aktivní člen" : "Neaktivní člen"
  };
};
