"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Member } from "@/types/member";
import { useFetchCategories } from "@/hooks/useFetchCategories";
import { useFetchMemberFunctions } from "@/hooks/useFetchMemberFunctions";
import { useAppData } from "@/contexts/AppDataContext";
import { Tabs, Tab } from "@heroui/react";
import MembersStatisticTab from "./components/MembersStatisticTab";
import MembersListTab from "./components/MembersListTab";
import { DEFAULT_MEMBER_FUNCTIONS, GENDER_OPTIONS } from "@/constants";

export default function MembersAdminPage() {
  const genderOptions = GENDER_OPTIONS;

  // Fetch member functions from database
  const {
    data: functionsData,
    loading: functionsLoading,
    error: functionsError,
  } = useFetchMemberFunctions();

  // Convert functions array to Record format for compatibility
  const functionOptions = useMemo(() => {
    // Only use data from the database, no hardcoded fallback
    if (!functionsData || functionsData.length === 0) {
      return DEFAULT_MEMBER_FUNCTIONS;
    }
    const result = functionsData.reduce((acc, func) => {
      acc[func.name] = func.display_name;
      return acc;
    }, {} as Record<string, string>);
    return result;
  }, [functionsData]);

  // State for tabs
  const [activeTab, setActiveTab] = useState("members");

  // Use AppDataContext for members data
  const { members, membersLoading, membersError } = useAppData();

  // Fetch categories from database
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useFetchCategories();

  return (
    <div className="p-6">
      {/* Tabs */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab key="members" title="Seznam členů">
          <div className="flex flex-col gap-4">
            <MembersListTab 
              categoriesData={categoriesData}
              functionOptions={functionOptions}
              sexOptions={genderOptions}
            />
          </div>
        </Tab>
        <Tab key="statistics" title="Statistiky">
          <div className="flex flex-col gap-4">
            <MembersStatisticTab 
              members={members}
              categoriesData={categoriesData}
              functionOptions={functionOptions}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
