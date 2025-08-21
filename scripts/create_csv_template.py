#!/usr/bin/env python3
"""
CSV Template Generator for Match Import
This script creates CSV template files with the correct structure for importing matches.
"""

import csv
import os
from datetime import datetime, timedelta

def create_csv_template():
    """Create a CSV template file with sample match data."""
    
    # Sample data with proper formatting
    sample_data = [
        {
            'date': '15.03.2024',
            'time': '14:30',
            'matchNumber': '1',
            'homeTeam': 'Baník Most (Most)',
            'awayTeam': 'Sparta Praha (Sparta)',
            'category': 'Muži (men)'
        },
        {
            'date': '15.03.2024',
            'time': '16:00',
            'matchNumber': '2',
            'homeTeam': 'Slavia Praha (Slavia)',
            'awayTeam': 'Baník Most (Most)',
            'category': 'Muži (men)'
        },
        {
            'date': '22.03.2024',
            'time': '14:30',
            'matchNumber': '1',
            'homeTeam': 'Baník Most (Most)',
            'awayTeam': 'Slavia Praha (Slavia)',
            'category': 'Ženy (women)'
        },
        {
            'date': '22.03.2024',
            'time': '16:00',
            'matchNumber': '2',
            'homeTeam': 'Sparta Praha (Sparta)',
            'awayTeam': 'Baník Most (Most)',
            'category': 'Ženy (women)'
        },
        {
            'date': '29.03.2024',
            'time': '10:00',
            'matchNumber': 'Finále',
            'homeTeam': 'Baník Most (Most)',
            'awayTeam': 'Slavia Praha (Slavia)',
            'category': 'U16 (juniorBoys)'
        }
    ]
    
    # Create output directory if it doesn't exist
    output_dir = 'public/templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # Create comma-separated template
    comma_template_path = os.path.join(output_dir, 'matches_template_comma.csv')
    with open(comma_template_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=',')
        
        # Write header
        writer.writeheader()
        
        # Write sample data
        for row in sample_data:
            writer.writerow(row)
    
    print(f"✅ Comma-separated CSV template created: {comma_template_path}")
    
    # Create semicolon-separated template (European standard)
    semicolon_template_path = os.path.join(output_dir, 'matches_template_semicolon.csv')
    with open(semicolon_template_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=';')
        
        # Write header
        writer.writeheader()
        
        # Write sample data
        for row in sample_data:
            writer.writerow(row)
    
    print(f"✅ Semicolon-separated CSV template created: {semicolon_template_path}")
    
    # Create template with instructions
    instructions_template_path = os.path.join(output_dir, 'matches_template_with_instructions.csv')
    with open(instructions_template_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # Write header
        writer.writeheader()
        
        # Write sample data
        for row in sample_data:
            writer.writerow(row)
        
        # Add empty rows for instructions
        writer.writerow({})
        writer.writerow({})
        
        # Add instruction rows
        instructions = [
            {'date': 'INSTRUKCE:', 'time': '', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Datum:', 'time': 'Formát DD.MM.YYYY (např. 15.03.2024)', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Čas:', 'time': 'Formát HH:MM (např. 14:30)', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Číslo zápasu:', 'time': 'Text nebo číslo (např. 1, 2, "Finále")', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Domácí tým:', 'time': 'Přesný název týmu z databáze', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Hostující tým:', 'time': 'Přesný název týmu z databáze', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Kategorie:', 'time': 'Přesný název kategorie z databáze', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''},
            {'date': 'Oddělovač:', 'time': 'Systém automaticky detekuje čárku (,) nebo středník (;)', 'matchNumber': '', 'homeTeam': '', 'awayTeam': '', 'category': ''}
        ]
        
        for instruction in instructions:
            writer.writerow(instruction)
    
    print(f"✅ CSV template with instructions created: {instructions_template_path}")
    
    return comma_template_path, semicolon_template_path, instructions_template_path

def create_csv_from_excel_data():
    """Create a CSV file that demonstrates proper date/time formatting."""
    
    # Create output directory if it doesn't exist
    output_dir = 'public/templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # Create properly formatted CSV
    formatted_csv_path = os.path.join(output_dir, 'matches_properly_formatted.csv')
    with open(formatted_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'time', 'matchNumber', 'homeTeam', 'awayTeam', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # Write header
        writer.writeheader()
        
        # Create sample data with proper formatting
        sample_data = [
            {
                'date': '15.03.2024',
                'time': '14:30',
                'matchNumber': '1',
                'homeTeam': 'TJ Sokol Svinov (Svinov)',
                'awayTeam': 'TJ Sokol Podlázky (Podlázky)',
                'category': 'Muži (men)'
            },
            {
                'date': '15.03.2024',
                'time': '16:00',
                'matchNumber': '2',
                'homeTeam': 'TJ Sokol Krčín (Krčín)',
                'awayTeam': 'TJ Sokol Tymákov (Tymákov)',
                'category': 'Muži (men)'
            },
            {
                'date': '22.03.2024',
                'time': '10:00',
                'matchNumber': '1',
                'homeTeam': 'TJ Sokol Svinov (Svinov)',
                'awayTeam': 'TJ Sokol Krčín (Krčín)',
                'category': 'Ženy (women)'
            }
        ]
        
        # Write sample data
        for row in sample_data:
            writer.writerow(row)
    
    print(f"✅ Properly formatted CSV created: {formatted_csv_path}")
    return formatted_csv_path

if __name__ == "__main__":
    print("🚀 Creating CSV templates for match import...")
    print()
    
    try:
        # Create basic templates
        comma_path, semicolon_path, instructions_path = create_csv_template()
        print()
        
        # Create properly formatted example
        formatted_path = create_csv_from_excel_data()
        print()
        
        print("🎉 All CSV templates created successfully!")
        print("📁 Check the 'public/templates' directory for the generated files:")
        print(f"   • {os.path.basename(comma_path)} - Comma-separated template")
        print(f"   • {os.path.basename(semicolon_path)} - Semicolon-separated template")
        print(f"   • {os.path.basename(instructions_path)} - Template with instructions")
        print(f"   • {os.path.basename(formatted_path)} - Properly formatted example")
        print()
        print("💡 CSV advantages over Excel:")
        print("   • Better date/time formatting")
        print("   • No hidden characters or formatting issues")
        print("   • Easier to edit in text editors")
        print("   • More reliable for data imports")
        
    except Exception as e:
        print(f"❌ Error creating CSV templates: {e}")
        print("💡 Make sure you have write permissions to the public/templates directory")
