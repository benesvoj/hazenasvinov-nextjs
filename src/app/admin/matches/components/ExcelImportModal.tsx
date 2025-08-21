'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { 
  DocumentArrowUpIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface ExcelMatch {
  date: string;
  time: string;
  matchNumber: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  status: 'valid' | 'invalid' | 'duplicate';
  errors?: string[];
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (matches: ExcelMatch[]) => Promise<void>;
  categories: Array<{ id: string; name: string; code: string }>;
  teams: Array<{ id: string; name: string; short_name?: string }>;
  selectedSeason: string;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  categories,
  teams,
  selectedSeason
}) => {
  const [excelData, setExcelData] = useState<ExcelMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv'>('excel');

  // Reset all state when modal closes
  const resetState = useCallback(() => {
    setExcelData([]);
    setIsProcessing(false);
    setValidationErrors([]);
    setFile(null);
    setFileType('excel');
  }, []);

  // Handle modal close with state reset
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
      
      // Debug: Log what props we received
      console.log('🔍 ExcelImportModal opened with props:', {
        categoriesCount: categories.length,
        teamsCount: teams.length,
        selectedSeason,
        categories: categories.slice(0, 3), // First 3 categories
        teams: teams.slice(0, 3) // First 3 teams
      });
      
      // Additional debug: Check if props are actually accessible
      console.log('🔍 Props debug:', {
        teamsProp: teams,
        categoriesProp: categories,
        teamsType: typeof teams,
        categoriesType: typeof categories,
        teamsConstructor: teams?.constructor?.name,
        categoriesConstructor: categories?.constructor?.name,
        teamsIsArray: Array.isArray(teams),
        categoriesIsArray: Array.isArray(categories)
      });
      
      // Check if data is actually loaded
      setTimeout(() => {
        console.log('🔍 Delayed props check (after 100ms):', {
          categoriesCount: categories.length,
          teamsCount: teams.length,
          categories: categories,
          teams: teams
        });
      }, 100);
    }
  }, [isOpen, resetState, categories, teams, selectedSeason]);

  // Define validateMatch function that takes data as parameters
  const validateMatch = (match: ExcelMatch, teamsData: any[], categoriesData: any[]): { isValid: boolean; errors: string[] } => {
    // Debug: Always log the data being passed to validation
    console.log('🔍 validateMatch called with data:', {
      teamsDataLength: teamsData?.length || 'undefined',
      categoriesDataLength: categoriesData?.length || 'undefined',
      teamsData: teamsData,
      categoriesData: categoriesData
    });
    
    const errors: string[] = [];

    // Debug: Log what we're validating (only once per validation)
    if (match.homeTeam === 'TJ Sokol Svinov' && match.awayTeam === 'TJ Sokol Podlázky') {
      console.log('🔍 Validating match:', {
        match,
        availableTeams: teamsData.map(t => ({ name: t.name, short_name: t.short_name })),
        availableCategories: categoriesData.map(c => ({ name: c.name, code: c.code }))
      });
      
      // Also log the raw arrays to see if they're actually empty
      console.log('🔍 Raw arrays check:', {
        teamsLength: teamsData.length,
        categoriesLength: categoriesData.length,
        teamsIsArray: Array.isArray(teamsData),
        categoriesIsArray: Array.isArray(categoriesData),
        teamsFirstItem: teamsData[0],
        categoriesFirstItem: categoriesData[0]
      });
    }

    // Validate date
    if (!match.date) {
      errors.push('Chybí datum');
    } else {
      // Handle European date format (DD.MM.YYYY)
      let date: Date;
      if (match.date.includes('.')) {
        // European format: DD.MM.YYYY
        const [day, month, year] = match.date.split('.');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Standard format
        date = new Date(match.date);
      }
      
      if (isNaN(date.getTime())) {
        errors.push('Neplatné datum');
      }
    }

    // Validate time
    if (!match.time) {
      errors.push('Chybí čas');
    } else {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(match.time)) {
        errors.push('Neplatný čas (formát: HH:MM)');
      }
    }

    // Validate match number
    if (!match.matchNumber) {
      errors.push('Chybí číslo zápasu');
    }

    // Validate home team
    if (!match.homeTeam) {
      errors.push('Chybí domácí tým');
    } else {
      const searchTerm = match.homeTeam.trim().toLowerCase();
      const foundTeam = teamsData.find(team => {
        const teamNameLower = team.name.trim().toLowerCase();
        const teamShortNameLower = team.short_name?.trim().toLowerCase();
        
        const isMatch = teamNameLower === searchTerm || 
               teamShortNameLower === searchTerm ||
               teamNameLower.includes(searchTerm) ||
               searchTerm.includes(teamNameLower) ||
               (teamShortNameLower && (teamShortNameLower.includes(searchTerm) || searchTerm.includes(teamShortNameLower)));
        
        // Debug: Log each team check (only for first few teams to avoid spam)
        if (teamsData.indexOf(team) < 3) {
          console.log(`🏠 Checking home team "${match.homeTeam}":`, {
            searchTerm,
            teamName: team.name,
            teamShortName: team.short_name,
            isMatch
          });
        }
        
        return isMatch;
      });
      
      if (!foundTeam) {
        errors.push(`Domácí tým "${match.homeTeam}" nebyl nalezen`);
      }
    }

    // Validate away team
    if (!match.awayTeam) {
      errors.push('Chybí hostující tým');
    } else {
      const searchTerm = match.awayTeam.trim().toLowerCase();
      const foundTeam = teamsData.find(team => {
        const teamNameLower = team.name.trim().toLowerCase();
        const teamShortNameLower = team.short_name?.trim().toLowerCase();
        
        const isMatch = teamNameLower === searchTerm || 
               teamShortNameLower === searchTerm ||
               teamNameLower.includes(searchTerm) ||
               searchTerm.includes(teamNameLower) ||
               (teamShortNameLower && (teamShortNameLower.includes(searchTerm) || searchTerm.includes(teamShortNameLower)));
        
        // Debug: Log each team check (only for first few teams to avoid spam)
        if (teamsData.indexOf(team) < 3) {
          console.log(`✈️ Checking away team "${match.awayTeam}":`, {
            searchTerm,
            teamName: team.name,
            teamShortName: team.short_name,
            isMatch
          });
        }
        
        return isMatch;
      });
      
      if (!foundTeam) {
        errors.push(`Hostující tým "${match.awayTeam}" nebyl nalezen`);
      }
    }

    // Validate category
    if (!match.category) {
      errors.push('Chybí kategorie');
    } else {
      const searchTerm = match.category.trim().toLowerCase();
      const foundCategory = categoriesData.find(cat => {
        const catNameLower = cat.name.trim().toLowerCase();
        const catCodeLower = cat.code.trim().toLowerCase();
        
        const isMatch = catNameLower === searchTerm || 
               catCodeLower === searchTerm ||
               catNameLower.includes(searchTerm) ||
               searchTerm.includes(catNameLower) ||
               catCodeLower.includes(searchTerm) ||
               searchTerm.includes(catCodeLower);
        
        // Debug: Log each category check (only for first few categories to avoid spam)
        if (categoriesData.indexOf(cat) < 3) {
          console.log(`🏷️ Checking category "${match.category}":`, {
            searchTerm,
            catName: cat.name,
            catCode: cat.code,
            isMatch
          });
        }
        
        return isMatch;
      });
      
      if (!foundCategory) {
        errors.push(`Kategorie "${match.category}" nebyla nalezena`);
      }
    }

    // Check for duplicate teams
    if (match.homeTeam && match.awayTeam && match.homeTeam.toLowerCase() === match.awayTeam.toLowerCase()) {
      errors.push('Domácí a hostující tým nemohou být stejné');
    }

    // Debug: Log validation result (only for first few matches to avoid spam)
    if (match.homeTeam === 'TJ Sokol Svinov' && match.awayTeam === 'TJ Sokol Podlázky') {
      console.log(`✅ Validation result for "${match.homeTeam}" vs "${match.awayTeam}":`, {
        isValid: errors.length === 0,
        errors,
        match
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };



  const processCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n');
        
        if (lines.length < 2) {
          setValidationErrors(['CSV soubor musí obsahovat alespoň hlavičku a jeden řádek dat.']);
          return;
        }

        // Auto-detect separator (comma or semi-colon)
        const detectSeparator = (firstLine: string): string => {
          const commaCount = (firstLine.match(/,/g) || []).length;
          const semicolonCount = (firstLine.match(/;/g) || []).length;
          
          // Use the separator that appears more frequently
          if (semicolonCount >= commaCount) {
            console.log('CSV separator detected: semicolon (;)');
            return ';';
          } else {
            console.log('CSV separator detected: comma (,)');
            return ',';
          }
        };

        const separator = detectSeparator(lines[0]);
        console.log('Using CSV separator:', separator);

        // Parse CSV with detected separator (handle quoted values)
        const parseCSVLine = (line: string, sep: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === sep && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        // Extract headers (first row)
        const headers = parseCSVLine(lines[0], separator);
        
        // Validate headers
        const expectedHeaders = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category'];
        const headerValidation = validateHeaders(headers, expectedHeaders);
        
        if (!headerValidation.isValid) {
          setValidationErrors([`Nesprávná struktura CSV souboru. Očekávané sloupce: ${expectedHeaders.join(', ')}. Nalezené sloupce: ${headers.join(', ')}. Použitý oddělovač: ${separator}`]);
          return;
        }

        // Process data rows (skip header)
        const processedData: ExcelMatch[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines

          const row = parseCSVLine(line, separator);
          if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows

          const match: ExcelMatch = {
            date: row[0]?.toString() || '',
            time: row[1]?.toString() || '',
            matchNumber: row[2]?.toString() || '',
            homeTeam: row[3]?.toString() || '',
            awayTeam: row[4]?.toString() || '',
            category: row[5]?.toString() || '',
            status: 'valid'
          };

          // Debug: Log the raw data being processed
          console.log('Processing CSV row:', {
            rawRow: row,
            processedMatch: match,
            rowIndex: i,
            separator: separator
          });

          // Validate match data
          console.log('🔍 About to call validateMatch with CSV data:', {
            match,
            teamsLength: teams?.length || 'undefined',
            categoriesLength: categories?.length || 'undefined',
            teams: teams,
            categories: categories
          });
          const validation = validateMatch(match, teams, categories);
          match.status = validation.isValid ? 'valid' : 'invalid';
          if (!validation.isValid) {
            match.errors = validation.errors;
            // Debug: Log validation errors
            console.log('Validation failed for row:', {
              rowIndex: i,
              match,
              errors: validation.errors
            });
          }

          processedData.push(match);
        }

        setExcelData(processedData);
        setValidationErrors([]);
      } catch (error) {
        console.error('Error processing CSV file:', error);
        setValidationErrors(['Chyba při zpracování CSV souboru. Zkontrolujte formát souboru.']);
      }
    };
    reader.readAsText(file);
  }, [categories, teams]);

  const processExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setValidationErrors(['Excel soubor musí obsahovat alespoň hlavičku a jeden řádek dat.']);
          return;
        }

        // Extract headers (first row)
        const headers = jsonData[0] as string[];
        
        // Validate headers
        const expectedHeaders = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category'];
        const headerValidation = validateHeaders(headers, expectedHeaders);
        
        if (!headerValidation.isValid) {
          setValidationErrors([`Nesprávná struktura Excel souboru. Očekávané sloupce: ${expectedHeaders.join(', ')}. Nalezené sloupce: ${headers.join(', ')}`]);
          return;
        }

        // Process data rows (skip header)
        const processedData: ExcelMatch[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length === 0 || row.every(cell => !cell)) continue; // Skip empty rows

          const match: ExcelMatch = {
            date: row[0]?.toString() || '',
            time: row[1]?.toString() || '',
            matchNumber: row[2]?.toString() || '',
            homeTeam: row[3]?.toString() || '',
            awayTeam: row[4]?.toString() || '',
            category: row[5]?.toString() || '',
            status: 'valid'
          };

          // Debug: Log the raw data being processed
          console.log('Processing Excel row:', {
            rawRow: row,
            processedMatch: match,
            rowIndex: i
          });

          // Validate match data
          console.log('🔍 About to call validateMatch with Excel data:', {
            match,
            teamsLength: teams?.length || 'undefined',
            categoriesLength: categories?.length || 'undefined',
            teams: teams,
            categories: categories
          });
          const validation = validateMatch(match, teams, categories);
          match.status = validation.isValid ? 'valid' : 'invalid';
          if (!validation.isValid) {
            match.errors = validation.errors;
            // Debug: Log validation errors
            console.log('Validation failed for row:', {
              rowIndex: i,
              match,
              errors: validation.errors
            });
          }

          processedData.push(match);
        }

        setExcelData(processedData);
        setValidationErrors([]);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setValidationErrors(['Chyba při zpracování Excel souboru. Zkontrolujte formát souboru.']);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [categories, teams]);

  const validateHeaders = (headers: string[], expected: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    for (const expectedHeader of expected) {
      if (!headers.some(header => 
        header.toLowerCase().includes(expectedHeader.toLowerCase()) ||
        expectedHeader.toLowerCase().includes(header.toLowerCase())
      )) {
        errors.push(`Chybí sloupec: ${expectedHeader}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Define handleFileChange after the processing functions to avoid dependency issues
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Detect file type
    const fileName = selectedFile.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      setFileType('csv');
      processCSVFile(selectedFile);
    } else {
      setFileType('excel');
      processExcelFile(selectedFile);
    }
  }, [processCSVFile, processExcelFile]);



  const handleImport = useCallback(async () => {
    if (excelData.length === 0) return;

    setIsProcessing(true);
    try {
      await onImport(excelData.filter(match => match.status === 'valid'));
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      setValidationErrors(['Chyba při importu dat. Zkuste to znovu.']);
    } finally {
      setIsProcessing(false);
    }
  }, [excelData, onImport, onClose]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge color="success">Validní</Badge>;
      case 'invalid':
        return <Badge color="danger">Nevalidní</Badge>;
      default:
        return <Badge color="warning">Varování</Badge>;
    }
  };

  const validMatchesCount = excelData.filter(match => match.status === 'valid').length;
  const invalidMatchesCount = excelData.filter(match => match.status === 'invalid').length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="5xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <DocumentArrowUpIcon className="w-6 h-6 text-blue-500" />
            <span>Import zápasů z Excel/CSV</span>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer">
                <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-700">
                  Klikněte pro výběr Excel souboru
                </p>
                <p className="text-sm text-gray-500">
                  Podporované formáty: .xlsx, .xls, .csv
                </p>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">
                      <strong>Vybraný soubor:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      <strong>Typ souboru:</strong> {fileType === 'csv' ? 'CSV' : 'Excel'}
                    </p>
                  </div>
                  <Badge color={fileType === 'csv' ? 'success' : 'primary'}>
                    {fileType === 'csv' ? 'CSV' : 'Excel'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Chyby validace:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Import Summary */}
            {excelData.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Shrnutí importu:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{excelData.length}</div>
                    <div className="text-gray-500">Celkem řádků</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{validMatchesCount}</div>
                    <div className="text-green-500">Validní</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{invalidMatchesCount}</div>
                    <div className="text-red-500">Nevalidní</div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Preview */}
            {excelData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Náhled dat:</h4>
                <div className="max-h-96 overflow-y-auto">
                  <Table aria-label="Excel data preview">
                    <TableHeader>
                      <TableColumn>Status</TableColumn>
                      <TableColumn>Datum</TableColumn>
                      <TableColumn>Čas</TableColumn>
                      <TableColumn>Č. zápasu</TableColumn>
                      <TableColumn>Domácí tým</TableColumn>
                      <TableColumn>Hostující tým</TableColumn>
                      <TableColumn>Kategorie</TableColumn>
                      <TableColumn>Chyby</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {excelData.map((match, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(match.status)}
                              {getStatusBadge(match.status)}
                            </div>
                          </TableCell>
                          <TableCell>{match.date}</TableCell>
                          <TableCell>{match.time}</TableCell>
                          <TableCell>{match.matchNumber}</TableCell>
                          <TableCell>{match.homeTeam}</TableCell>
                          <TableCell>{match.awayTeam}</TableCell>
                          <TableCell>{match.category}</TableCell>
                          <TableCell>
                            {match.errors && match.errors.length > 0 ? (
                              <ul className="text-xs text-red-600 space-y-1">
                                {match.errors.map((error, errorIndex) => (
                                  <li key={errorIndex}>• {error}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-green-600 text-xs">✓</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            Zrušit
          </Button>
          <Button 
            color="primary" 
            onPress={handleImport}
            isDisabled={validMatchesCount === 0 || isProcessing}
            isLoading={isProcessing}
          >
            Importovat ({validMatchesCount} zápasů)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExcelImportModal;
