import { Category } from "@/types/types";

export const getCategoryInfo = (categoryId: string, categories: Category[]) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return { name: "Neznámá kategorie", competition: "Neznámá soutěž" };
    
    return {
      name: category.name,
      competition: `${category.description || 'Soutěž'}`
    };
  };