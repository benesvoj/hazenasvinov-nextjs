'use client';

import React, { useState, useCallback } from 'react';
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

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    processExcelFile(selectedFile);
  }, []);

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

          // Validate match data
          const validation = validateMatch(match, categories, teams);
          match.status = validation.isValid ? 'valid' : 'invalid';
          if (!validation.isValid) {
            match.errors = validation.errors;
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

  const validateMatch = (match: ExcelMatch, categories: any[], teams: any[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate date
    if (!match.date) {
      errors.push('Chybí datum');
    } else {
      const date = new Date(match.date);
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
    } else if (!teams.some(team => 
      team.name.toLowerCase() === match.homeTeam.toLowerCase() ||
      team.short_name?.toLowerCase() === match.homeTeam.toLowerCase()
    )) {
      errors.push(`Domácí tým "${match.homeTeam}" nebyl nalezen`);
    }

    // Validate away team
    if (!match.awayTeam) {
      errors.push('Chybí hostující tým');
    } else if (!teams.some(team => 
      team.name.toLowerCase() === match.awayTeam.toLowerCase() ||
      team.short_name?.toLowerCase() === match.awayTeam.toLowerCase()
    )) {
      errors.push(`Hostující tým "${match.awayTeam}" nebyl nalezen`);
    }

    // Validate category
    if (!match.category) {
      errors.push('Chybí kategorie');
    } else if (!categories.some(cat => 
      cat.name.toLowerCase() === match.category.toLowerCase() ||
      cat.code.toLowerCase() === match.category.toLowerCase()
    )) {
      errors.push(`Kategorie "${match.category}" nebyla nalezena`);
    }

    // Check for duplicate teams
    if (match.homeTeam && match.awayTeam && match.homeTeam.toLowerCase() === match.awayTeam.toLowerCase()) {
      errors.push('Domácí a hostující tým nemohou být stejné');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

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
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <DocumentArrowUpIcon className="w-6 h-6 text-blue-500" />
            <span>Import zápasů z Excel</span>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
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
                  Podporované formáty: .xlsx, .xls
                </p>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Vybraný soubor:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
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
          <Button color="danger" variant="light" onPress={onClose}>
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
