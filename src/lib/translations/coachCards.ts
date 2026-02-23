export const coachCardsTranslations = {
  editor: {
    title: 'Vaše vizitka',
    uploadPhoto: 'Nahrát foto',
    removePhoto: 'Odstranit',
    // Per-category visibility
    categoryVisibilityTitle: 'Viditelnost na stránkách kategorií',
    selectCategoriesLabel: 'Vyberte kategorie, kde se má vizitka zobrazovat',
    publishToAll: 'Publikovat všude',
    unpublishAll: 'Skrýt všude',
    publishedStatus: 'Veřejná ({count})', // {count} = number of selected categories
    privateStatus: 'Soukromá',
    noAssignedCategories:
      'Nemáte přiřazené žádné kategorie. Kontaktujte administrátora pro přiřazení kategorií.',
    publishedNotice: 'Vaše vizitka je viditelná na stránkách: {categories}', // {categories} = comma-separated list
    unpublishedNotice: 'Vaše vizitka není veřejná. Vyberte kategorie, kde se má zobrazovat.',
  },
  fields: {
    name: 'Jméno',
    surname: 'Příjmení',
    email: 'E-mail',
    phone: 'Telefon',
    note: 'Poznámka / Bio',
  },
  placeholders: {
    name: 'Zadejte jméno',
    surname: 'Zadejte příjmení',
    email: 'vas@email.cz',
    phone: '+420 123 456 789',
    note: 'Krátký popis o vás...',
  },
  validation: {
    nameRequired: 'Jméno a příjmení jsou povinné',
    invalidImageType: 'Pouze obrázky jsou povoleny',
    imageTooLarge: 'Obrázek je příliš velký (max 5MB)',
    invalidCategorySelection: 'Neplatný výběr kategorií',
  },
  toasts: {
    fetchError: 'Nepodařilo se načíst vizitku',
    createSuccess: 'Vizitka byla vytvořena',
    createError: 'Nepodařilo se vytvořit vizitku',
    updateSuccess: 'Vizitka byla aktualizována',
    updateError: 'Nepodařilo se aktualizovat vizitku',
    deleteSuccess: 'Vizitka byla smazána',
    deleteError: 'Nepodařilo se smazat vizitku',
    // Per-category visibility
    visibilityUpdateSuccess: 'Viditelnost vizitky byla aktualizována',
    visibilityUpdateError: 'Nepodařilo se změnit viditelnost',
    publishedToCategories: 'Vizitka je nyní viditelná na vybraných kategoriích',
    unpublishedFromAll: 'Vizitka je nyní skrytá ze všech kategorií',
    photoUploadError: 'Nepodařilo se nahrát foto',
    photoDeleteError: 'Nepodařilo se odstranit foto',
  },
  responseMessages: {
    fetchFailed: 'Nepodařilo se načíst vizitky',
    createSuccess: 'Vizitka byla vytvořena',
    updateSuccess: 'Vizitka byla aktualizována',
    deleteSuccess: 'Vizitka byla smazána',
    createError: 'Nepodařilo se vytvořit vizitku',
    updateError: 'Nepodařilo se aktualizovat vizitku',
    deleteError: 'Nepodařilo se smazat vizitku',
  },
  section: {
    title: 'Kontakty na trenéry',
  },
};
