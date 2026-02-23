export const adminTranslations = {
  roleDefinitions: {
    table: {
      ariaLabel: 'Role Definitions Table',
      columns: {
        name: 'Název',
        displayName: 'Zobrazovaný název',
        description: 'Popis',
        permissions: 'Oprávnění',
        isActive: 'Aktivní',
      },
    },
    responseMessages: {
      fetchFailed: 'Failed to fetch role definitions.',
    },
  },
  userRoles: {
    title: {
      assignRole: 'Přiřadit roli uživateli',
      assignedRoles: 'Přiřazené role',
    },
    table: {
      ariaLabel: 'User Role Definitions Table',
      columns: {
        role: 'Role',
        categories: 'Kategorie',
        assignedAt: 'Přiřazeno dne',
      },
    },
    descriptions: {
      assignRole:
        'Vyberte roli pro tohoto uživatele. Bez přiřazené role nebude mít přístup k aplikaci.',
      skipRoleAssignment:
        'Pokud přeskočíte, uživatel nebude mít přístup k aplikaci, dokud mu nebude přiřazena role.',
    },
    success: {
      roleAssigned: 'Role byla úspěšně přiřazena.',
      roleRemoved: 'Role byla úspěšně odebrána.',
    },
    errors: {
      noRoleSelected: 'Prosím vyberte roli.',
      roleNotFound: 'Vybraná role nebyla nalezena.',
      assignmentFailed: 'Přiřazení role selhalo.',
    },
    modal: {
      assignedCategoriesInfo:
        'Kategorie můžete vybrat později, ale pro správné fungování systému je doporučeno přiřadit alespoň jednu kategorii.',
      assignedCategoriesTitle: 'Výběr kategorií',
      assignedCategoriesSubtitle: 'Vyberte kategorie, které budou přiřazeny této roli.',
    },
    labels: {
      availableCategories: 'Dostupné kategorie',
    },
  },
  users: {
    alert: {
      newUserInfo: 'Novému uživateli bude odeslán email s pozvánkou do systému.',
      passwordResetInfo: 'Uživateli bude odeslán email s odkazem pro vytvoření nového hesla.',
    },
    modal: {
      addNewUser: 'Přidat nového uživatele',
      editUser: 'Upravit uživatele',
      passwordResetTitle: 'Obnovení hesla uživatele',
    },
    tabs: {
      rolesAndAccess: 'Role a přístupy',
      users: 'Uživatelé',
      loginLogs: 'Historie přihlášení',
    },
    errors: {
      fetchProfilesFailed: 'Chyba při načítání profilů: ',
      addRoleFailed: 'Chyba pri pridavani role:',
      deleteRoleFailed: 'Chyba pri mazani role: ',
      categorySelectionFailed: 'Error in category selection confirm: ',
    },
    success: {
      roleCreated: 'Role byla uspesne pridana!',
      roleDeleted: 'Role byla uspesne odstranena!',
    },
    labels: {
      newRole: 'Nová role',
      newRolePlaceholder: 'Vyberte roli k přidání',
      userEmail: 'Email uživatele',
    },
    table: {
      ariaLabel: 'Users Table',
      actions: {
        blocked: 'Blokovat',
        unblock: 'Odblokovat',
        passwordReset: 'Obnovit heslo',
      },
      columns: {
        user: 'Uživatel',
        contact: 'Kontakt',
        status: 'Stav',
        createdAt: 'Vytvořeno dne',
      },
    },
    chips: {
      blocked: 'Blokován',
      active: 'Aktivní',
      unconfirmed: 'Neověřen',
    },
    actions: {
      addUser: 'Přidat uživatele',
    },
  },
  profile: {
    modal: {
      title: 'Upravit profil uživatele',
      subtitle: 'Aktualizujte své osobní informace',
    },
    labels: {
      fullName: 'Celé jméno',
      fullNamePlaceholder: 'Zadejte své celé jméno',
      email: 'Emailová adresa',
      emailDescription: 'Email nelze změnit',
      phone: 'Telefonní číslo',
      phonePlaceholder: '+420 123 456 789',
      bio: 'Bio',
      bioPlaceholder: 'Krátce se představte...',
      position: 'Pozice',
      positionPlaceholder: 'Např. Administrátor, Editor',
    },
    success: {
      profileUpdated: 'Profil byl úspěšně aktualizován.',
    },
    error: {
      profileUpdateFailed: 'Aktualizace profilu selhala.',
      profileSaveFailed: 'Uložení profilu selhalo.',
    },
  },
  loginLogs: {
    title: 'Historie přihlášení',
    description: 'Přehled přihlášení uživatelů do systému.',
    loading: 'Načítání historie přihlášení...',
    table: {
      ariaLabel: 'Login Logs Table',
      noRecords: 'Nebyly nalezeny žádné záznamy.',
      columns: {
        user: 'Uživatel',
        email: 'Email',
        action: 'Akce',
        loginTime: 'Čas přihlášení',
        ipAddress: 'IP adresa',
        userAgent: 'Prohlížeč',
        status: 'Status',
      },
    },
    modal: {
      title: 'Filtry pro historii přihlášení',
    },
  },
};
