import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create sample data for template
    const templateData = [
      [
        'Question Text',
        'Option 1',
        'Option 2', 
        'Option 3',
        'Option 4',
        'Correct Answer (1-4)',
        'Explanation (Optional)',
        'Tags (Optional, comma-separated)'
      ],
      [
        'What is 2 + 2?',
        '3',
        '4',
        '5',
        '6',
        '2',
        'Basic addition: 2 + 2 = 4',
        'math,addition,basic'
      ],
      [
        'Which planet is closest to the Sun?',
        'Venus',
        'Mercury',
        'Earth',
        'Mars',
        '2',
        'Mercury is the first planet from the Sun',
        'science,planets,solar-system'
      ],
      [
        'What is the capital of France?',
        'London',
        'Berlin',
        'Paris',
        'Madrid',
        '3',
        'Paris is the capital and largest city of France',
        'geography,capitals,europe'
      ]
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 40 }, // Question Text
      { wch: 20 }, // Option 1
      { wch: 20 }, // Option 2
      { wch: 20 }, // Option 3
      { wch: 20 }, // Option 4
      { wch: 15 }, // Correct Answer
      { wch: 30 }, // Explanation
      { wch: 25 }  // Tags
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="question-bank-template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
} 