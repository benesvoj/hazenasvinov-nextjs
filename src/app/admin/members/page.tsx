"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useDisclosure } from "@heroui/modal";
import { Badge } from "@heroui/badge";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
} from "@heroui/table";
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import { Member } from "@/types/types";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import MemberFormModal from "@/app/admin/members/components/MemberFormModal";
import MembersCsvImport from "@/app/admin/members/components/MembersCsvImport";
import { useFetchCategories } from "@/hooks/useFetchCategories";
import { useFetchMemberFunctions } from "@/hooks/useFetchMemberFunctions";
import { showToast } from "@/components/Toast";
import Link from "next/link";

export default function MembersAdminPage() {
  const sexOptions = {
    male: "Muž",
    female: "Žena",
  };

  // Fetch member functions from database
  const {
    data: functionsData,
    loading: functionsLoading,
    error: functionsError,
  } = useFetchMemberFunctions();

  // Log function fetch status for debugging
  useEffect(() => {
    console.log("Member functions fetch status:", {
      functionsData,
      functionsLoading,
      functionsError,
    });
  }, [functionsData, functionsLoading, functionsError]);

  // Convert functions array to Record format for compatibility
  const functionOptions = useMemo(() => {
    // Only use data from the database, no hardcoded fallback
    if (!functionsData || functionsData.length === 0) {
      return {};
    }
    return functionsData.reduce((acc, func) => {
      acc[func.name] = func.display_name;
      return acc;
    }, {} as Record<string, string>);
  }, [functionsData]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories from database
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useFetchCategories();

  // Convert categories array to Record format for compatibility
  const categories = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce((acc, category) => {
      acc[category.code] = category.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categoriesData]);

  // Create reverse mapping from name to code for form submission
  const categoryNameToCode = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce((acc, category) => {
      acc[category.name] = category.code;
      return acc;
    }, {} as Record<string, string>);
  }, [categoriesData]);

  // Modal states
  const {
    isOpen: isAddMemberOpen,
    onOpen: onAddMemberOpen,
    onClose: onAddMemberClose,
  } = useDisclosure();
  const {
    isOpen: isEditMemberOpen,
    onOpen: onEditMemberOpen,
    onClose: onEditMemberClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteMemberOpen,
    onOpen: onDeleteMemberOpen,
    onClose: onDeleteMemberClose,
  } = useDisclosure();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    registration_number: "",
    name: "",
    surname: "",
    date_of_birth: "",
    category: "",
    sex: "male" as "male" | "female",
    functions: [] as string[],
  });

  const supabase = createClient();

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("surname", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = "Chyba při načítání členů";
      let debugInfo = "";

      if (error) {
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
      }

      const finalErrorMessage = debugInfo
        ? `${errorMessage} ${debugInfo}`
        : errorMessage;
      showToast.danger(finalErrorMessage);
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Filter members based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.registration_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, members]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: categoriesData[0].code,
      }));
    }
  }, [categoriesData, formData.category]);

  // Add new member
  const handleAddMember = async () => {
    // Validate required fields
    if (!formData.category) {
      showToast.danger("Prosím vyberte kategorii");
      return;
    }

    try {
      // Debug: Log what we're sending
      console.log("Adding member with category:", {
        formDataCategory: formData.category,
        categoryCode: formData.category,
        availableCategories: categoriesData,
      });

      // Find the category name from the code
      const selectedCategory = categoriesData?.find(
        (cat) => cat.code === formData.category
      );
      if (!selectedCategory) {
        showToast.danger("Vybraná kategorie nebyla nalezena");
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .insert({
          registration_number: formData.registration_number || undefined, // Let trigger generate if empty
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: selectedCategory.code, // Use category code for database
          sex: formData.sex,
          functions: formData.functions,
        })
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      console.log("Member added successfully:", data);

      onAddMemberClose();
      // Clear form after successful submission
      const defaultCategory =
        categoriesData && categoriesData.length > 0
          ? categoriesData[0].code
          : "";
      setFormData({
        registration_number: "",
        name: "",
        surname: "",
        date_of_birth: "",
        category: defaultCategory,
        sex: "male",
        functions: [],
      });
      fetchMembers();
      showToast.success("Člen byl úspěšně přidán.");
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = "Chyba při přidávání člena";
      let debugInfo = "";

      if (error) {
        // Supabase specific errors
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }

        // Generic error handling
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.toString && error.toString() !== "[object Object]") {
          errorMessage = error.toString();
        }
      }

      // Set user-friendly error message
      const finalErrorMessage = debugInfo
        ? `${errorMessage} ${debugInfo}`
        : errorMessage;
      showToast.danger(finalErrorMessage);

      // Log full error for debugging with better error extraction
      console.error("Full error object:", error);
      console.error("Error type:", typeof error);

      if (error && typeof error === "object") {
        console.error("Error keys:", Object.keys(error));
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);

        // Try to stringify the error for better debugging
        try {
          console.error("Error JSON:", JSON.stringify(error, null, 2));
        } catch (stringifyError) {
          console.error("Could not stringify error:", stringifyError);
        }
      } else {
        console.error("Error is not an object:", error);
      }
    }
  };

  // Update member
  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    // Validate required fields
    if (!formData.category) {
      showToast.danger("Prosím vyberte kategorii");
      return;
    }

    try {
      // Debug: Log what we're sending
      console.log("Updating member with category:", {
        formDataCategory: formData.category,
        categoryCode: formData.category,
        availableCategories: categoriesData,
      });

      // Find the category name from the code
      const selectedCategory = categoriesData?.find(
        (cat) => cat.code === formData.category
      );
      if (!selectedCategory) {
        showToast.danger("Vybraná kategorie nebyla nalezena");
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .update({
          registration_number: formData.registration_number,
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: selectedCategory.code, // Use category code for database
          sex: formData.sex,
          functions: formData.functions,
        })
        .eq("id", selectedMember.id)
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      console.log("Member updated successfully:", data);

      onEditMemberClose();
      setSelectedMember(null);
      const defaultCategory =
        categoriesData && categoriesData.length > 0
          ? categoriesData[0].code
          : "";
      setFormData({
        registration_number: "",
        name: "",
        surname: "",
        date_of_birth: "",
        category: defaultCategory,
        sex: "male",
        functions: [],
      });
      fetchMembers();
      showToast.success("Člen byl úspěšně upraven.");
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = "Chyba při aktualizaci člena";
      let debugInfo = "";

      if (error) {
        // Supabase specific errors
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }

        // Generic error handling
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.toString && error.toString() !== "[object Object]") {
          errorMessage = error.toString();
        }
      }

      // Set user-friendly error message
      const finalErrorMessage = debugInfo
        ? `${errorMessage} ${debugInfo}`
        : errorMessage;
      showToast.danger(finalErrorMessage);

      // Log full error for debugging with better error extraction
      console.error("Full error object:", error);
      console.error("Error type:", typeof error);

      if (error && typeof error === "object") {
        console.error("Error keys:", Object.keys(error));
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);

        // Try to stringify the error for better debugging
        try {
          console.error("Error JSON:", JSON.stringify(error, null, 2));
        } catch (stringifyError) {
          console.error("Could not stringify error:", stringifyError);
        }
      } else {
        console.error("Error is not an object:", error);
      }
    }
  };

  // Delete member
  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", selectedMember.id);

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }

      onDeleteMemberClose();
      setSelectedMember(null);
      fetchMembers();
      showToast.success("Člen byl úspěšně smazán.");
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = "Chyba při mazání člena";
      let debugInfo = "";

      if (error) {
        if (error.code) {
          debugInfo += `Kód chyby: ${error.code}. `;
        }
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.details) {
          debugInfo += `Detaily: ${error.details}. `;
        }
        if (error.hint) {
          debugInfo += `Nápověda: ${error.hint}. `;
        }
      }

      const finalErrorMessage = debugInfo
        ? `${errorMessage} ${debugInfo}`
        : errorMessage;
      showToast.danger(finalErrorMessage);
      console.error("Error deleting member:", error);
    }
  };

  // Clear error when starting new actions
  const clearError = () => {
    // No longer needed with Toast notifications
  };

  // Clear success message
  const clearSuccess = () => {
    // No longer needed with Toast notifications
  };

  // Show success message
  const showSuccess = (message: string) => {
    showToast.success(message);
  };

  // Open edit modal
  const openEditModal = (member: Member) => {
    setSelectedMember(member);

    // The member.category field should already contain the category code
    console.log("Opening edit modal for member:", {
      memberCategory: member.category,
      availableCategories: categoriesData,
    });

    setFormData({
      registration_number: member.registration_number,
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth,
      category: member.category, // Use the category code directly
      sex: member.sex,
      functions: member.functions || [],
    });
    onEditMemberOpen();
  };

  // Open delete modal
  const openDeleteModal = (member: Member) => {
    setSelectedMember(member);
    onDeleteMemberOpen();
  };

  // Open add modal
  const openAddModal = () => {
    // Reset form to default values - use first available category or empty string
    const defaultCategory =
      categoriesData && categoriesData.length > 0 ? categoriesData[0].code : "";
    setFormData({
      registration_number: "",
      name: "",
      surname: "",
      date_of_birth: "",
      category: defaultCategory,
      sex: "male",
      functions: [],
    });
    onAddMemberOpen();
  };

  // Clear form data
  const clearFormData = () => {
    const defaultCategory =
      categoriesData && categoriesData.length > 0 ? categoriesData[0].code : "";
    setFormData({
      registration_number: "",
      name: "",
      surname: "",
      date_of_birth: "",
      category: defaultCategory,
      sex: "male",
      functions: [],
    });
  };

  // Handle modal close with form reset
  const handleAddModalClose = () => {
    clearFormData();
    onAddMemberClose();
  };

  const handleEditModalClose = () => {
    clearFormData();
    setSelectedMember(null);
    onEditMemberClose();
  };

  // Get category name from code
  const getCategoryName = (categoryCode: string) => {
    return (
      categoriesData?.find((cat) => cat.code === categoryCode)?.name ||
      categoryCode
    );
  };

  // Get category badge color
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "men":
        return "primary";
      case "women":
        return "secondary";
      case "juniorBoys":
        return "success";
      case "juniorGirls":
        return "warning";
      case "prepKids":
        return "danger";
      case "youngestKids":
        return "default";
      case "youngerBoys":
        return "primary";
      case "youngerGirls":
        return "secondary";
      case "olderBoys":
        return "success";
      case "olderGirls":
        return "warning";
      default:
        return "default";
    }
  };

  // Get sex badge color
  const getSexBadgeColor = (sex: string) => {
    return sex === "male" ? "primary" : "secondary";
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Format date with age
  const formatDateWithAge = (dateOfBirth: string) => {
    const formattedDate = new Date(dateOfBirth).toLocaleDateString("cs-CZ");
    const age = calculateAge(dateOfBirth);
    return `${formattedDate} (${age})`;
  };

  // Table columns configuration
  const columns = [
    {
      key: "status",
      label: translations.members.membersTable.status,
      sortable: false,
    },
    {
      key: "registration_number",
      label: translations.members.membersTable.registrationNumber,
      sortable: true,
    },
    {
      key: "name",
      label: translations.members.membersTable.name,
      sortable: true,
    },
    {
      key: "surname",
      label: translations.members.membersTable.surname,
      sortable: true,
    },
    {
      key: "date_of_birth",
      label: translations.members.membersTable.dateOfBirth,
      sortable: true,
    },
    {
      key: "category",
      label: translations.members.membersTable.category,
      sortable: true,
    },
    {
      key: "sex",
      label: translations.members.membersTable.sex,
      sortable: true,
    },
    {
      key: "functions",
      label: translations.members.membersTable.functions,
      sortable: false,
    },
    {
      key: "actions",
      label: translations.members.membersTable.actions,
      sortable: false,
    },
  ];

  // Sort members based on sortDescriptor
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "surname",
    direction: "ascending",
  });

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Member];
      const second = b[sortDescriptor.column as keyof Member];

      // Handle date sorting
      if (sortDescriptor.column === "date_of_birth") {
        const dateA = new Date(first as string);
        const dateB = new Date(second as string);
        const cmp = dateA.getTime() - dateB.getTime();
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }

      // Handle registration number sorting (extract numeric part)
      if (sortDescriptor.column === "registration_number") {
        const extractNumber = (regNumber: string) => {
          // Extract numeric part from registration number (e.g., "REG-2024-001" -> 2024001)
          const match = regNumber.match(/\d+/g);
          if (match) {
            return parseInt(match.join(""), 10);
          }
          return 0;
        };

        const numA = extractNumber(first as string);
        const numB = extractNumber(second as string);
        const cmp = numA - numB;
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }

      // Handle string sorting
      const cmp = String(first).localeCompare(String(second), "cs");
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredMembers, sortDescriptor]);

  // Render cell content based on column key
  const renderCell = useCallback(
    (member: Member, columnKey: string) => {
      switch (columnKey) {
        case "status":
          return (
            <div className="flex items-center justify-center">
              <div
                className={`w-3 h-3 rounded-full ${
                  member.functions && member.functions.length > 0
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                title={
                  member.functions && member.functions.length > 0
                    ? "Aktivní člen"
                    : "Neaktivní člen"
                }
              />
            </div>
          );
        case "registration_number":
          return (
            <span className="font-mono text-sm bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
              {member.registration_number}
            </span>
          );
        case "name":
          return <span className="font-medium">{member.name}</span>;
        case "surname":
          return <span className="font-medium">{member.surname}</span>;
        case "date_of_birth":
          return formatDateWithAge(member.date_of_birth);
        case "category":
          return (
            <Badge
              color={getCategoryBadgeColor(member.category)}
              variant="flat"
            >
              {getCategoryName(member.category)}
            </Badge>
          );
        case "sex":
          return (
            <Badge color={getSexBadgeColor(member.sex)} variant="flat">
              {sexOptions[member.sex]}
            </Badge>
          );
        case "functions":
          return (
            <div className="flex flex-wrap gap-1">
              {member.functions && member.functions.length > 0 ? (
                member.functions.map((func, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {functionOptions[func as keyof typeof functionOptions] || func}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">Žádné funkce</span>
              )}
            </div>
          );
        case "actions":
          return (
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="light"
                color="primary"
                startContent={<PencilIcon className="w-4 h-4" />}
                onPress={() => openEditModal(member)}
              />
              <Button
                size="sm"
                variant="light"
                color="danger"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={() => openDeleteModal(member)}
              />
            </div>
          );
        default:
          return member[columnKey as keyof Member];
      }
    },
    [
      formatDateWithAge,
      getCategoryBadgeColor,
      getSexBadgeColor,
      openEditModal,
      openDeleteModal,
    ]
  );

  return (
    <div className="p-6">
      {/* Removed error and success message zones */}

      {categoriesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Chyba při načítání kategorií</span>
          </div>
          <p className="mt-1 text-sm">{categoriesError.message}</p>
        </div>
      )}

      {functionsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Chyba při načítání funkcí</span>
          </div>
          <p className="mt-1 text-sm">{functionsError.message}</p>
        </div>
      )}

      {!functionsError && !functionsLoading && Object.keys(functionOptions).length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Upozornění</span>
          </div>
          <p className="mt-1 text-sm">
            Žádné funkce nejsou momentálně dostupné. Pro správné fungování systému je potřeba nastavit funkce členů v sekci{" "}
            <Link href="/admin/member-functions" className="text-yellow-700 underline hover:text-yellow-800">
              "Funkce členů"
            </Link>
            .
          </p>
        </div>
      )}

      {/* Removed successMessage and its display logic */}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">
                {translations.members.membersList}
              </h2>
            </div>

            {/* Member Count Statistics */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">
                  {members.filter((m) => m.sex === "male").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">
                  {members.filter((m) => m.sex === "female").length}
                </span>
              </div>
              <div className="flex items-center gap-2 border-l pl-4">
                <span className="font-semibold text-gray-700">
                  {members.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <MembersCsvImport
              onImportComplete={fetchMembers}
              categories={categories}
              sexOptions={sexOptions}
              functionOptions={functionOptions}
            />
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={openAddModal}
              isDisabled={
                categoriesLoading ||
                (functionsLoading && !functionsError) ||
                Object.keys(categories).length === 0 ||
                Object.keys(functionOptions).length === 0
              }
            >
              {categoriesLoading || functionsLoading
                ? "Načítání..."
                : translations.members.buttonAddMember}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {/* Search Bar */}
          <div className="mb-4">
            <Input
              placeholder={translations.members.membersTable.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              }
              className="max-w-md"
            />
          </div>

          <Table
            aria-label="Tabulka členů"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  allowsSorting={column.sortable}
                  align={column.key === "actions" ? "center" : "start"}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={sortedMembers}
              loadingContent={
                loading ||
                categoriesLoading ||
                (functionsLoading && !functionsError)
                  ? loading
                    ? translations.loading
                    : "Načítání dat..."
                  : undefined
              }
              loadingState={
                loading ||
                categoriesLoading ||
                (functionsLoading && !functionsError)
                  ? "loading"
                  : "idle"
              }
              emptyContent={
                searchTerm
                  ? "Žádní členové nebyli nalezeni pro zadaný vyhledávací termín."
                  : Object.keys(functionOptions).length === 0
                  ? "Žádní členové nebyli nalezeni. Pro přidání členů je potřeba nejprve nastavit funkce v sekci 'Funkce členů'."
                  : "Žádní členové nebyli nalezeni."
              }
            >
              {(member) => (
                <TableRow key={member.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(member, columnKey as string)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add Member Modal */}
      <MemberFormModal
        isOpen={isAddMemberOpen}
        onClose={onAddMemberClose}
        onSubmit={handleAddMember}
        title="Přidat nového člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        functionOptions={functionOptions}
        submitButtonText="Přidat člena"
        isEditMode={false}
      />

      {/* Edit Member Modal */}
      <MemberFormModal
        isOpen={isEditMemberOpen}
        onClose={onEditMemberClose}
        onSubmit={handleUpdateMember}
        title="Upravit člena"
        formData={formData}
        setFormData={setFormData}
        categories={categoriesData || []}
        sexOptions={sexOptions}
        functionOptions={functionOptions}
        submitButtonText="Uložit změny"
        isEditMode={true}
      />

      {/* Delete Member Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteMemberOpen}
        onClose={onDeleteMemberClose}
        onConfirm={handleDeleteMember}
        title={translations.members.deleteMember}
        message={translations.members.deleteMemberMessage
          .replace("{name}", selectedMember?.name || "")
          .replace("{surname}", selectedMember?.surname || "")
          .replace(
            "{registration_number}",
            selectedMember?.registration_number || ""
          )}
      />
    </div>
  );
}
