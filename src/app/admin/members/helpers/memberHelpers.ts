import { Category } from "@/types/types";

/**
 * Get the display name for a category code
 */
export const getCategoryName = (categoryCode: string, categories: Record<string, string>) => {
  return categories[categoryCode] || categoryCode;
};

/**
 * Get the appropriate badge color for a category based on gender and name
 */
export const getCategoryBadgeColor = (category: string, categoriesData: Category[] | null) => {
  if (!categoriesData) return "default";
  
  const categoryData = categoriesData.find(cat => cat.code === category);
  if (!categoryData) return "default";
  
  if (categoryData.gender === 'male') return "primary";
  if (categoryData.gender === 'female') return "secondary";
  if (categoryData.gender === 'mixed') return "success";
  
  // Fallback for categories without gender
  if (category.toLowerCase().includes('kids') || category.toLowerCase().includes('prep')) return "warning";
  if (category.toLowerCase().includes('boys')) return "primary";
  if (category.toLowerCase().includes('girls')) return "secondary";
  
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
    sex: "" | "male" | "female";
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
 */
export const convertCategoriesToRecord = (categoriesData: Category[] | null) => {
  if (!categoriesData) return {};
  return categoriesData.reduce((acc, category) => {
    acc[category.code] = category.name;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Create reverse mapping from name to code for form submission
 */
export const createCategoryNameToCodeMap = (categoriesData: Category[] | null) => {
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
