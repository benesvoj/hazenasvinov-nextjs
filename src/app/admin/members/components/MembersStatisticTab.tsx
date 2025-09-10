import React, { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Badge } from "@heroui/badge";
import { MembersStatisticTabProps } from "@/types";


export default function MembersStatisticTab({ 
  members, 
  categoriesData, 
  functionOptions 
}: MembersStatisticTabProps) {
  // Statistics calculations
  const statistics = useMemo(() => {
    if (!members.length) return null;

    const totalMembers = members.length;
    const maleMembers = members.filter(m => m.sex === 'male').length;
    const femaleMembers = members.filter(m => m.sex === 'female').length;
    
    // Category statistics
    const categoryStats = categoriesData?.reduce((acc, category) => {
      const count = members.filter(m => m.category_id === category.id).length;
      if (count > 0) {
        acc[category.name] = count;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Function statistics
    const functionStats = Object.keys(functionOptions).reduce((acc, funcKey) => {
      const count = members.filter(m => m.functions && m.functions.includes(funcKey)).length;
      if (count > 0) {
        acc[functionOptions[funcKey]] = count;
      }
      return acc;
    }, {} as Record<string, number>);

    // Age statistics
    const currentYear = new Date().getFullYear();
    const ages = members.map(m => {
      if (m.date_of_birth) {
        const birthYear = new Date(m.date_of_birth).getFullYear();
        return currentYear - birthYear;
      }
      return null;
    }).filter(age => age !== null) as number[];

    const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

    // Active vs Inactive members
    const activeMembers = members.filter(m => m.functions && m.functions.length > 0).length;
    const inactiveMembers = totalMembers - activeMembers;

    return {
      totalMembers,
      maleMembers,
      femaleMembers,
      categoryStats,
      functionStats,
      ageStats: { averageAge, minAge, maxAge },
      activeMembers,
      inactiveMembers,
      activePercentage: Math.round((activeMembers / totalMembers) * 100)
    };
  }, [members, categoriesData, functionOptions]);

  if (!statistics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Načítání statistik...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Statistiky členů</h2>
      
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Celkové členy</h3>
            <p className="text-4xl font-bold text-blue-600">{statistics.totalMembers}</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Aktivní členové</h3>
            <p className="text-4xl font-bold text-green-600">{statistics.activeMembers}</p>
            <p className="text-sm text-green-600 mt-1">({statistics.activePercentage}%)</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Neaktivní členové</h3>
            <p className="text-4xl font-bold text-red-600">{statistics.inactiveMembers}</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Průměrný věk</h3>
            <p className="text-4xl font-bold text-purple-600">{statistics.ageStats.averageAge} let</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Nejmladší člen</h3>
            <p className="text-4xl font-bold text-orange-600">{statistics.ageStats.minAge} let</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardBody className="text-center">
            <h3 className="text-lg font-semibold text-pink-800 mb-2">Nejstarší člen</h3>
            <p className="text-4xl font-bold text-pink-600">{statistics.ageStats.maxAge} let</p>
          </CardBody>
        </Card>
      </div>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Rozložení podle pohlaví</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Muži: {statistics.maleMembers}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
              <span>Ženy: {statistics.femaleMembers}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Statistiky podle kategorií</h3>
        </CardHeader>
        <CardBody>
          {Object.keys(statistics.categoryStats).length > 0 ? (
            <div className="overflow-x-auto">
              <Table aria-label="Statistiky kategorií">
                <TableHeader>
                  <TableColumn>Kategorie</TableColumn>
                  <TableColumn>Počet členů</TableColumn>
                  <TableColumn>Procento</TableColumn>
                </TableHeader>
                <TableBody>
                  {Object.entries(statistics.categoryStats).map(([categoryName, count]) => {
                    const countValue = count as number;
                    return (
                      <TableRow key={categoryName}>
                        <TableCell>
                          <Badge color="primary" variant="flat">
                            {categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{countValue}</TableCell>
                        <TableCell className="text-gray-600">
                          {Math.round((countValue / statistics.totalMembers) * 100)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Žádné členové v kategoriích momentálně.</p>
          )}
        </CardBody>
      </Card>

      {/* Function Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Statistiky podle funkcí</h3>
        </CardHeader>
        <CardBody>
          {Object.keys(statistics.functionStats).length > 0 ? (
            <div className="overflow-x-auto">
              <Table aria-label="Statistiky funkcí">
                <TableHeader>
                  <TableColumn>Funkce</TableColumn>
                  <TableColumn>Počet členů</TableColumn>
                  <TableColumn>Procento</TableColumn>
                </TableHeader>
                <TableBody>
                  {Object.entries(statistics.functionStats).map(([functionName, count]) => (
                    <TableRow key={functionName}>
                      <TableCell>
                        <Badge color="secondary" variant="flat">
                          {functionName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{count}</TableCell>
                      <TableCell className="text-gray-600">
                        {Math.round((count / statistics.totalMembers) * 100)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Žádné členové s funkcemi momentálně.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}