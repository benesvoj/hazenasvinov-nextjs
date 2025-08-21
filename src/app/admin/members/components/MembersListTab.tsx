import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Badge } from "@heroui/badge";
import { useDisclosure } from "@heroui/use-disclosure";
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import { Member, Category } from "@/types/types";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import MemberFormModal from "./MemberFormModal";
import MembersCsvImport from "./MembersCsvImport";
import BulkEditModal from "./BulkEditModal";
import { showToast } from "@/components/Toast";
import { Pagination } from "@heroui/react";
import { GENDER_OPTIONS } from "@/constants";

interface MembersListTabProps {
  categoriesData: Category[] | null;
  functionOptions: Record<string, string>;
  sexOptions: Record<string, string>;
}

export default function MembersListTab({ 
  categoriesData, 
  functionOptions, 
  sexOptions 
}: MembersListTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sex: "" as "" | "male" | "female",
    category: "",
    function: "",
  });
  const [activeTab, setActiveTab] = useState("members");

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
  const {
    isOpen: isBulkEditOpen,
    onOpen: onBulkEditOpen,
    onClose: onBulkEditClose,
  } = useDisclosure();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [bulkEditFormData, setBulkEditFormData] = useState({
    sex: "" as "" | "male" | "female",
    category: "",
    functions: [] as string[],
  });
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

  // Filter members based on search term and filters
  useEffect(() => {
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
        member.functions && member.functions.includes(filters.function)
      );
    }

    setFilteredMembers(filtered);
    setPage(1); // Reset to first page when filters change
  }, [members, searchTerm, filters]);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const pages = Math.ceil(filteredMembers.length / rowsPerPage);

  // Sorting
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({
    column: "surname",
    direction: "ascending",
  });

  const handleSortChange = (descriptor: any) => {
    setSortDescriptor({
      column: String(descriptor.column),
      direction: descriptor.direction,
    });
  };

  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Member];
      const second = b[sortDescriptor.column as keyof Member];

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

    return sorted;
  }, [filteredMembers, sortDescriptor]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedMembers.slice(start, end);
  }, [page, sortedMembers, rowsPerPage]);

  // Bulk edit functions
  const handleBulkEdit = async () => {
    if (selectedMembers.size === 0) {
      showToast.danger("Vyberte alespoň jednoho člena pro hromadnou úpravu");
      return;
    }

    // Check if at least one field is being updated
    if (
      !bulkEditFormData.sex &&
      !bulkEditFormData.category &&
      bulkEditFormData.functions.length === 0
    ) {
      showToast.danger("Vyberte alespoň jedno pole pro úpravu");
      return;
    }

    try {
      setLoading(true);

      // Prepare update data (only include fields that are being updated)
      const updateData: any = {};
      if (bulkEditFormData.sex) updateData.sex = bulkEditFormData.sex;
      if (bulkEditFormData.category)
        updateData.category = bulkEditFormData.category;
      if (bulkEditFormData.functions.length > 0)
        updateData.functions = bulkEditFormData.functions;

      // Update all selected members
      const memberIds = Array.from(selectedMembers);
      const { error } = await supabase
        .from("members")
        .update(updateData)
        .in("id", memberIds);

      if (error) {
        console.error("Bulk update error:", error);
        throw error;
      }

      // Clear selection and form
      setSelectedMembers(new Set());
      setBulkEditFormData({
        sex: "",
        category: "",
        functions: [],
      });

      onBulkEditClose();
      fetchMembers();
      showToast.success(`Úspěšně upraveno ${memberIds.length} členů`);
    } catch (error: any) {
      console.error("Error in bulk edit:", error);
      showToast.danger(
        `Chyba při hromadné úpravě: ${error.message || "Neznámá chyba"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const openBulkEditModal = () => {
    if (selectedMembers.size === 0) {
      showToast.danger("Vyberte alespoň jednoho člena pro hromadnou úpravu");
      return;
    }
    onBulkEditOpen();
  };

  const closeBulkEditModal = () => {
    setSelectedMembers(new Set());
    setBulkEditFormData({
      sex: "",
      category: "",
      functions: [],
    });
    onBulkEditClose();
  };

  // Member form functions
  const openAddModal = () => {
    setFormData({
      registration_number: "",
      name: "",
      surname: "",
      date_of_birth: "",
      category: "",
      sex: "male",
      functions: [],
    });
    onAddMemberOpen();
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      registration_number: member.registration_number || "",
      name: member.name,
      surname: member.surname,
      date_of_birth: member.date_of_birth,
      category: member.category,
      sex: member.sex,
      functions: member.functions || [],
    });
    onEditMemberOpen();
  };

  const openDeleteModal = (member: Member) => {
    setSelectedMember(member);
    onDeleteMemberOpen();
  };

  const handleAddMember = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.from("members").insert([
        {
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions,
          registration_number: formData.registration_number || undefined,
        },
      ]);

      if (error) {
        console.error("Error adding member:", error);
        throw error;
      }

      showToast.success("Člen byl úspěšně přidán");
      onAddMemberClose();
      fetchMembers();
    } catch (error: any) {
      console.error("Error adding member:", error);
      showToast.danger(`Chyba při přidávání člena: ${error.message || "Neznámá chyba"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("members")
        .update({
          name: formData.name,
          surname: formData.surname,
          date_of_birth: formData.date_of_birth,
          category: formData.category,
          sex: formData.sex,
          functions: formData.functions,
          registration_number: formData.registration_number || null,
        })
        .eq("id", selectedMember.id);

      if (error) {
        console.error("Error updating member:", error);
        throw error;
      }

      showToast.success("Člen byl úspěšně upraven");
      onEditMemberClose();
      fetchMembers();
    } catch (error: any) {
      console.error("Error updating member:", error);
      showToast.danger(`Chyba při úpravě člena: ${error.message || "Neznámá chyba"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", selectedMember.id);

      if (error) {
        console.error("Error deleting member:", error);
        throw error;
      }

      showToast.success("Člen byl úspěšně smazán");
      onDeleteMemberClose();
      fetchMembers();
    } catch (error: any) {
      console.error("Error deleting member:", error);
      showToast.danger(`Chyba při mazání člena: ${error.message || "Neznámá chyba"}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCategoryName = (categoryCode: string) => {
    return categories[categoryCode] || categoryCode;
  };

  const getCategoryBadgeColor = (category: string) => {
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

  const getSexBadgeColor = (sex: "male" | "female") => {
    return sex === "male" ? "primary" : "secondary";
  };

  // Render cell content based on column key
  const renderCell = (member: Member, columnKey: string) => {
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
          <span className="font-medium">
            {member.registration_number || "N/A"}
          </span>
        );
      case "name":
        return <span className="font-medium">{member.name}</span>;
      case "surname":
        return <span className="font-medium">{member.surname}</span>;
      case "date_of_birth":
        const birthDate = new Date(member.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return (
          <span>
            {birthDate.toLocaleDateString("cs-CZ")} ({age})
          </span>
        );
      case "category":
        return (
          <Badge color={getCategoryBadgeColor(member.category)} variant="flat">
            {getCategoryName(member.category)}
          </Badge>
        );
      case "sex":
        return (
          <Badge color={getSexBadgeColor(member.sex)} variant="flat">
            {member.sex === "male" ? "Muž" : "Žena"}
          </Badge>
        );
      case "functions":
        console.log('Functions case debug:', {
          memberFunctions: member.functions,
          functionOptions,
          memberId: member.id
        });
        if (!member.functions || member.functions.length === 0) {
          return <span className="text-gray-500">Žádné funkce</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {member.functions.map((func) => (
              <Badge key={func} color="secondary" variant="flat" size="sm">
                {functionOptions[func] || func}
              </Badge>
            ))}
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => openEditModal(member)}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => openDeleteModal(member)}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Table columns
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

  // Load members on component mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Debug logging
  useEffect(() => {
    console.log('MembersListTab Debug:', {
      functionOptions,
      categoriesData,
      membersCount: members.length,
      filteredCount: filteredMembers.length
    });
  }, [functionOptions, categoriesData, members.length, filteredMembers.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Seznam členů</h2>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onPress={openBulkEditModal}
            isDisabled={selectedMembers.size === 0}
            startContent={<PencilIcon className="w-4 h-4" />}
          >
            Hromadná úprava ({selectedMembers.size})
          </Button>
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
            isDisabled={Object.keys(categories).length === 0 || Object.keys(functionOptions).length === 0}
          >
            Přidat člena
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            {/* Search and Filters - Single Row on Desktop */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* Search Input - Smaller on desktop */}
              <div className="w-full lg:w-80">
                <Input
                  placeholder={translations.members.membersTable.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                  className="w-full"
                  size="sm"
                />
              </div>

              {/* Filter Controls - All on one row */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Sex Filter */}
                <div className="w-full sm:w-40">
                  <Select
                    placeholder="Všechna pohlaví"
                    selectedKeys={filters.sex ? [filters.sex] : []}
                    onSelectionChange={(keys) =>
                      setFilters(prev => ({
                        ...prev,
                        sex: Array.from(keys)[0] as "male" | "female" | "",
                      }))
                    }
                    className="w-full"
                    size="sm"
                  >
                    <SelectItem key="male">Muži</SelectItem>
                    <SelectItem key="female">Ženy</SelectItem>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="w-full sm:w-48">
                  <Select
                    placeholder="Všechny kategorie"
                    selectedKeys={filters.category ? [filters.category] : []}
                    onSelectionChange={(keys) =>
                      setFilters(prev => ({
                        ...prev,
                        category: Array.from(keys)[0] as string,
                      }))
                    }
                    className="w-full"
                    size="sm"
                  >
                    {categoriesData?.map((category) => (
                      <SelectItem key={category.code}>{category.name}</SelectItem>
                    )) || []}
                  </Select>
                </div>

                {/* Function Filter */}
                <div className="w-full sm:w-48">
                  <Select
                    placeholder="Všechny funkce"
                    selectedKeys={filters.function ? [filters.function] : []}
                    onSelectionChange={(keys) =>
                      setFilters(prev => ({
                        ...prev,
                        function: Array.from(keys)[0] as string,
                      }))
                    }
                    className="w-full"
                    size="sm"
                  >
                    {Object.entries(functionOptions).map(([key, value]) => (
                      <SelectItem key={key}>{value}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {(filters.sex || filters.category || filters.function) && (
                  <div className="w-full sm:w-auto">
                    <Button
                      variant="light"
                      size="sm"
                      onPress={() => setFilters({ sex: "", category: "", function: "" })}
                      className="w-full sm:w-auto"
                    >
                      Vymazat filtry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Members Table */}
      <Card>
        <CardBody>
          <Table
            aria-label="Tabulka členů"
            selectionMode="multiple"
            selectedKeys={selectedMembers}
            onSelectionChange={(keys) => {
              if (typeof keys === "string") {
                setSelectedMembers(new Set([keys]));
              } else {
                setSelectedMembers(
                  new Set(Array.from(keys).map((key) => String(key)))
                );
              }
            }}
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            classNames={{
              wrapper: "min-h-[400px]",
            }}
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="secondary"
                  page={page}
                  total={pages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            }
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
              items={items}
              loadingContent={
                loading
                  ? translations.loading
                  : "Načítání dat..."
              }
              loadingState={loading ? "loading" : "idle"}
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

      {/* Modals */}
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

      <DeleteConfirmationModal
        isOpen={isDeleteMemberOpen}
        onClose={onDeleteMemberClose}
        onConfirm={handleDeleteMember}
        title="Smazat člena"
        message={`Opravdu chcete smazat člena <strong>${selectedMember?.name} ${selectedMember?.surname}</strong> (Reg. číslo: ${selectedMember?.registration_number})? Tato akce je nevratná.`}
      />

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={closeBulkEditModal}
        onSubmit={handleBulkEdit}
        selectedCount={selectedMembers.size}
        formData={bulkEditFormData}
        setFormData={setBulkEditFormData}
        categories={categoriesData || []}
        functionOptions={functionOptions}
        isLoading={loading}
      />
    </div>
  );
}