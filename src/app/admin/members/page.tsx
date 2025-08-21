"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { translations } from "@/lib/translations";
import { Member } from "@/types/types";
import { useFetchCategories } from "@/hooks/useFetchCategories";
import { useFetchMemberFunctions } from "@/hooks/useFetchMemberFunctions";
import { showToast } from "@/components/Toast";
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
      console.warn('No member functions data available, using fallback constants');
      return DEFAULT_MEMBER_FUNCTIONS;
    }
    console.log('Functions data structure:', functionsData);
    const result = functionsData.reduce((acc, func) => {
      acc[func.name] = func.display_name;
      return acc;
    }, {} as Record<string, string>);
    console.log('Generated functionOptions:', result);
    return result;
  }, [functionsData]);

  // Log function fetch status for debugging
  useEffect(() => {
    console.log("Member functions fetch status:", {
      functionsData,
      functionsLoading,
      functionsError,
      functionOptions,
    });
  }, [functionsData, functionsLoading, functionsError, functionOptions]);

  const supabase = createClient();

  // State for tabs and basic data
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // Basic fetch function for statistics
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
    } catch (error: any) {
      console.error("Error fetching members:", error);
      showToast.danger("Chyba při načítání členů");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load members on component mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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
