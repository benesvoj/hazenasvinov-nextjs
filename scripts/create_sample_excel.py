#!/usr/bin/env python3
"""
Sample Excel Template Generator for Match Import
This script creates a sample Excel file with the correct structure for importing matches.
"""

import pandas as pd
from datetime import datetime, timedelta
import os

def create_sample_excel():
    """Create a sample Excel file with match data structure."""
    
    # Sample data
    sample_data = [
        {
            'Datum': '15.03.2024',
            'Čas': '14:30',
            'Číslo zápasu': '1',
            'Domácí tým': 'Baník Most',
            'Hostující tým': 'Sparta Praha',
            'Kategorie': 'Muži'
        },
        {
            'Datum': '16.03.2024',
            'Čas': '16:00',
            'Číslo zápasu': '2',
            'Domácí tým': 'Slavia Praha',
            'Hostující tým': 'Baník Most',
            'Kategorie': 'Muži'
        },
        {
            'Datum': '17.03.2024',
            'Čas': '10:00',
            'Číslo zápasu': '3',
            'Domácí tým': 'Baník Most',
            'Hostující tým': 'Slavia Praha',
            'Kategorie': 'Ženy'
        },
        {
            'Datum': '18.03.2024',
            'Čas': '18:30',
            'Číslo zápasu': '4',
            'Domácí tým': 'Baník Most',
            'Hostující tým': 'Sparta Praha',
            'Kategorie': 'U16'
        },
        {
            'Datum': '19.03.2024',
            'Čas': '15:00',
            'Číslo zápasu': '5',
            'Domácí tým': 'Slavia Praha',
            'Hostující tým': 'Baník Most',
            'Kategorie': 'U18'
        }
    ]
    
    # Create DataFrame
    df = pd.DataFrame(sample_data)
    
    # Create output directory if it doesn't exist
    output_dir = 'public/templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to Excel
    output_file = os.path.join(output_dir, 'sample_matches_template.xlsx')
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Zápasy', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Zápasy']
        
        # Auto-adjust column widths
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Sample Excel template created: {output_file}")
    print("📋 File contains sample data with the correct structure")
    print("🔧 You can modify this file and use it for actual imports")
    
    return output_file

def create_instructions_sheet():
    """Create an Excel file with instructions in a separate sheet."""
    
    # Instructions data
    instructions = [
        ['INSTRUKCE PRO IMPORT ZÁPASŮ'],
        [''],
        ['STRUKTURA SLOUPCŮ:'],
        ['Sloupec A: Datum - Formát: DD.MM.YYYY nebo YYYY-MM-DD'],
        ['Sloupec B: Čas - Formát: HH:MM (24hodinový)'],
        ['Sloupec C: Číslo zápasu - Text nebo číslo'],
        ['Sloupec D: Domácí tým - Název týmu z databáze'],
        ['Sloupec E: Hostující tým - Název týmu z databáze'],
        ['Sloupec F: Kategorie - Název kategorie z databáze'],
        [''],
        ['DŮLEŽITÉ POŽADAVKY:'],
        ['1. První řádek musí obsahovat hlavičky sloupců'],
        ['2. Všechny týmy musí existovat v databázi'],
        ['3. Všechny kategorie musí existovat v databázi'],
        ['4. Čas musí být ve formátu HH:MM'],
        ['5. Datum musí být platné'],
        ['6. Domácí a hostující tým nemohou být stejné'],
        [''],
        ['PŘÍKLAD DAT:'],
        ['15.03.2024', '14:30', '1', 'Baník Most', 'Sparta Praha', 'Muži'],
        ['16.03.2024', '16:00', '2', 'Slavia Praha', 'Baník Most', 'Muži'],
        ['17.03.2024', '10:00', '3', 'Baník Most', 'Slavia Praha', 'Ženy']
    ]
    
    # Create DataFrame for instructions
    df_instructions = pd.DataFrame(instructions)
    
    # Create output directory if it doesn't exist
    output_dir = 'public/templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to Excel with multiple sheets
    output_file = os.path.join(output_dir, 'matches_import_template_with_instructions.xlsx')
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Instructions sheet
        df_instructions.to_excel(writer, sheet_name='Instrukce', index=False, header=False)
        
        # Sample data sheet
        sample_data = [
            {
                'Datum': '15.03.2024',
                'Čas': '14:30',
                'Číslo zápasu': '1',
                'Domácí tým': 'Baník Most',
                'Hostující tým': 'Sparta Praha',
                'Kategorie': 'Muži'
            },
            {
                'Datum': '16.03.2024',
                'Čas': '16:00',
                'Číslo zápasu': '2',
                'Domácí tým': 'Slavia Praha',
                'Hostující tým': 'Baník Most',
                'Kategorie': 'Muži'
            },
            {
                'Datum': '17.03.2024',
                'Čas': '10:00',
                'Číslo zápasu': '3',
                'Domácí tým': 'Baník Most',
                'Hostující tým': 'Slavia Praha',
                'Kategorie': 'Ženy'
            }
        ]
        
        df_sample = pd.DataFrame(sample_data)
        df_sample.to_excel(writer, sheet_name='Vzorová data', index=False)
        
        # Get the workbook
        workbook = writer.book
        
        # Format instructions sheet
        instructions_sheet = workbook['Instrukce']
        for column in instructions_sheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 80)
            instructions_sheet.column_dimensions[column_letter].width = adjusted_width
        
        # Format sample data sheet
        sample_sheet = workbook['Vzorová data']
        for column in sample_sheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 50)
            sample_sheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Excel template with instructions created: {output_file}")
    print("📋 File contains both instructions and sample data")
    print("📚 Instructions sheet explains the import process")
    print("📊 Sample data sheet shows the correct format")
    
    return output_file

if __name__ == "__main__":
    print("🚀 Creating Excel templates for match import...")
    print()
    
    try:
        # Create simple template
        create_sample_excel()
        print()
        
        # Create template with instructions
        create_instructions_sheet()
        print()
        
        print("🎉 All templates created successfully!")
        print("📁 Check the 'public/templates' directory for the generated files")
        
    except Exception as e:
        print(f"❌ Error creating templates: {e}")
        print("💡 Make sure you have the required packages installed:")
        print("   pip install pandas openpyxl")
