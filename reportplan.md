Report Generation Module - AI Implementation Prompt
Overview
Build an advanced report generation system for dynamic forms with automatic visualization, text insights, and multi-format exports (PDF, Excel, PowerPoint) for the SchoolSync portal.

Core Requirements
1. Field Analysis & Auto-Detection System
Create a field analyzer that automatically detects data types and suggests appropriate visualizations:
Backend API: /api/admin/reports/analyze-form
javascript// Input: formId
// Output: Field analysis with suggested chart types

Field Types to Detect:
- numeric → Bar Chart, Line Chart, Area Chart, Gauge, Heatmap
- categorical (dropdown, radio, checkbox) → Pie Chart, Donut Chart, Bar Chart
- date → Timeline, Line Chart, Area Chart
- text/textarea → Word Cloud, Text Summary (exclude from charts)
- boolean → Pie Chart, Gauge Chart

Return Structure:
{
  fieldId: string,
  fieldLabel: string,
  fieldType: string,
  detectedDataType: 'numeric' | 'categorical' | 'date' | 'text' | 'boolean',
  suggestedCharts: ['bar', 'pie', 'line'],
  isAggregatable: boolean
}

2. Data Aggregation Functions
Build aggregation functions that group data by District, Taluka, or School:
For Numeric Fields:

Calculate: Average, Sum, Min, Max, Median, Standard Deviation, Count
Group by: District, Taluka, School, or Overall
Return comparison data for selected entities

For Categorical Fields:

Count occurrences of each option
Calculate percentages
Handle multi-select checkboxes (array values)
Group by District/Taluka if needed

For Date Fields:

Group by: Day, Week, Month, Year
Count submissions over time
Show trends

Backend API: /api/admin/reports/aggregate-data
javascript// Input
{
  formId: string,
  fieldId: string,
  groupBy: 'district' | 'taluka' | 'school' | 'none',
  filters: {
    districts: [string],
    talukas: [string],
    schools: [string],
    dateRange: { start: date, end: date }
  }
}

// Output
{
  fieldLabel: string,
  dataType: string,
  aggregatedData: [
    { label: 'District A', value: 85.5, count: 150, min: 20, max: 100 },
    { label: 'District B', value: 78.2, count: 200, min: 15, max: 95 }
  ]
}

3. AI Text Insights Generator
Generate intelligent text summaries and insights from data:
Create functions for:

Numeric Insights:

"Average value is 85.5 across 15 districts"
"Highest performing district: District A (95.2)"
"Significant variation detected (CV: 35%)"
"Upward trend observed over time"


Categorical Insights:

"Most common response: Option A (45% of total)"
"Distribution: Option A: 120, Option B: 85, Option C: 60"
"Top 3 choices account for 80% of responses"


Overall Summary:

"This report analyzes [X] responses from [Y] schools across [Z] districts"
"Key Finding: [Automatic detection of outliers, trends, patterns]"
"Recommendation: [Based on data analysis]"



Backend API: /api/admin/reports/generate-insights
javascript// Input: aggregatedData for each field
// Output: 
{
  summary: string,
  keyFindings: [string],
  recommendations: [string],
  statistics: {
    mean, median, mode, stdDev, range, etc.
  }
}

4. Report Generation API
Main API: POST /api/admin/reports/generate
javascript// Request Body
{
  formId: string,
  reportTitle: string,
  groupBy: 'district' | 'taluka' | 'school' | 'none',
  filters: {
    districts: [string],
    talukas: [string],
    schools: [string],
    dateRange: { start: date, end: date }
  },
  includeCharts: boolean,
  includeTextSummary: boolean,
  chartPreferences: { fieldId: chartType } // optional override
}

// Response
{
  reportId: string,
  generatedAt: date,
  appliedFilters: object,
  summary: {
    overview: string,
    keyFindings: [string],
    recommendations: [string]
  },
  visualizations: [
    {
      fieldId: string,
      fieldLabel: string,
      chartType: 'bar' | 'pie' | 'line' | 'heatmap',
      data: [
        { label: string, value: number, percentage?: number }
      ],
      insights: {
        summary: string,
        details: [string],
        statistics: object
      }
    }
  ],
  rawData: [responses] // for Excel export
}

5. Frontend Components
A. Report Builder Component
Create a report configuration interface with:

Form Selection Dropdown
Group By Selector: None, District, Taluka, School
Filter Panel:

Multi-select Districts
Multi-select Talukas (filtered by selected districts)
Multi-select Schools (filtered by selected talukas)
Date Range Picker (start and end date)


Options:

Toggle: Include Charts
Toggle: Include Text Summary
Chart Type Override (optional per field)


Generate Report Button

Component: ReportBuilder.jsx

B. Dynamic Visualization Renderer
Create a component that renders any chart type based on data:
Supported Chart Types (use Recharts):

Bar Chart (vertical)
Horizontal Bar Chart
Line Chart
Area Chart
Pie Chart
Donut Chart
Heatmap (for geographic distribution)
Gauge Chart (for single metrics)

Each visualization card should show:

Field Label as title
Chart with responsive container
Insights text below chart
Statistics summary (min, max, avg, etc.)

Component: VisualizationRenderer.jsx
Props:
javascript{
  fieldLabel: string,
  chartType: string,
  data: array,
  insights: object
}

C. Complete Report View
Create a full-page report display with:

Report Header:

Title: "School Data Analysis Report"
Generated date
Applied filters summary


Executive Summary Section:

Overview paragraph
Key Findings (bullet points)
Recommendations (bullet points)


Detailed Analysis Section:

Render all visualizations using VisualizationRenderer
Each chart with its insights


Export Actions Bar:

Export as PDF button
Export as Excel button
Export as PowerPoint button



Component: ReportView.jsx

D. Comparison Report Component
Create side-by-side comparison view:
Compare:

District vs District
Taluka vs Taluka
School vs School

Show:

Dual bar charts (side by side)
Difference metrics
Percentage changes
Highlight better performer

Component: ComparisonReport.jsx
API: POST /api/admin/reports/compare
javascript// Request
{
  formId: string,
  compareBy: 'district' | 'taluka' | 'school',
  entities: ['Entity A', 'Entity B', 'Entity C'] // max 5
}

// Response
{
  comparisons: [
    {
      entity: 'Entity A',
      stats: { /* aggregated data */ }
    }
  ],
  sideBySideData: [ /* formatted for dual charts */ ]
}

6. Export Functions
A. PDF Export with Charts
Requirements:

Use jspdf and html2canvas libraries
Capture each chart as image using html2canvas
Create multi-page PDF with:

Page 1: Title, Executive Summary
Page 2+: Charts with insights (one chart per page or two small charts per page)
Proper page breaks
Headers and footers



Function: exportPDF(reportData)
Steps:

Create new jsPDF instance (A4 size)
Add title and date
Add summary text (split into lines if long)
Loop through visualizations:

Capture chart element as canvas
Convert to image
Add image to PDF
Add insights text below
Add new page if needed


Save PDF file


B. Excel Export with Multiple Sheets
Requirements:

Use xlsx library
Create workbook with multiple sheets:

Sheet 1: "Summary" (overview text, key findings)
Sheet 2: "Raw Data" (all responses in table format)
Sheet 3+: One sheet per field with aggregated data



Function: exportExcel(reportData)
Format for Raw Data Sheet:
UDISESchool NameDistrictTalukaField1Field2Field3
Format for Aggregated Sheets:
LabelValueCountPercentageMinMax

C. PowerPoint Export
Requirements:

Use pptxgenjs library
Create presentation with:

Slide 1: Title slide
Slide 2: Executive summary
Slide 3+: One slide per visualization (chart image + insights)



Function: exportPPT(reportData)

7. Advanced Features to Implement
A. Interactive Dashboard with Drill-down
Create a dashboard where:

Click on District bar → Shows talukas in that district
Click on Taluka bar → Shows schools in that taluka
Click on School → Shows detailed data
Breadcrumb navigation to go back
URL updates with each drill-down for direct access

Component: InteractiveDashboard.jsx

B. Heatmap for Geographic Distribution
Create a heatmap showing data intensity across districts and talukas:

X-axis: Talukas
Y-axis: Districts
Color intensity: Value magnitude (light to dark)
Tooltip on hover showing exact values

Use color gradient: Light blue (low) → Dark blue (high)

C. Trend Analysis (if Date fields exist)
If form has date fields:

Show submissions over time (line chart)
Calculate growth rate
Identify peak periods
Compare current vs previous period


D. Scheduled Reports
Allow admin to:

Schedule automatic report generation (weekly/monthly)
Email reports to specified addresses
Save reports in archive section
Download past reports

Database Schema:
javascriptScheduledReports: {
  scheduleId: string,
  formId: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  recipients: [string], // email addresses
  filters: object,
  lastGenerated: date,
  nextGeneration: date,
  isActive: boolean
}

Database Schema for Reports
javascript// Generated Reports Collection
GeneratedReports: {
  reportId: string (unique),
  formId: string,
  reportTitle: string,
  generatedBy: string (admin),
  generatedAt: date,
  filters: {
    districts: [string],
    talukas: [string],
    schools: [string],
    dateRange: object
  },
  groupBy: string,
  reportData: object, // full report JSON
  fileUrls: {
    pdf: string,
    excel: string,
    ppt: string
  }
}
```

---

## Step-by-Step Implementation Order

1. **Build Field Analyzer** (backend function to detect types and suggest charts)
2. **Create Data Aggregation Functions** (numeric, categorical, date aggregations)
3. **Build Text Insights Generator** (statistics and summary functions)
4. **Create Main Report Generation API** (combines all above)
5. **Build ReportBuilder Component** (frontend configuration UI)
6. **Build VisualizationRenderer Component** (dynamic chart rendering)
7. **Build ReportView Component** (complete report display)
8. **Implement PDF Export** (jspdf + html2canvas)
9. **Implement Excel Export** (xlsx with multiple sheets)
10. **Implement PowerPoint Export** (pptxgenjs)
11. **Add Comparison Reports** (side-by-side analysis)
12. **Add Interactive Dashboard** (drill-down navigation)
13. **Add Heatmap Visualization** (geographic distribution)
14. **Add Scheduled Reports** (cron jobs + email)

---

## Required NPM Packages

**Backend:**
```
- express
- mongoose
- mathjs (for statistical calculations)
```

**Frontend:**
```
- recharts (for all charts)
- jspdf (PDF generation)
- html2canvas (capture charts as images)
- xlsx (Excel generation)
- pptxgenjs (PowerPoint generation)
- react-datepicker (date range picker)
- react-select (multi-select dropdowns)

Expected Output
When implemented, admin should be able to:

Select any form and generate instant reports
Filter by district, taluka, date range
See auto-generated charts for all fields
Read AI-generated text insights
Compare multiple districts/talukas side-by-side
Drill down from district → taluka → school
Export reports as PDF (with charts), Excel (multi-sheet), PowerPoint
Schedule automatic report generation
View heatmaps of geographic distribution
Access report history and download past reports