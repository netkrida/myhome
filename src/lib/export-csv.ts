import Papa from "papaparse";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string; format?: (value: any) => string }[]
) {
  // If columns are specified, transform data
  let csvData: any[] = data;
  
  if (columns) {
    csvData = data.map((row) => {
      const transformedRow: Record<string, any> = {};
      columns.forEach((col) => {
        const value = row[col.key];
        transformedRow[col.label] = col.format ? col.format(value) : value;
      });
      return transformedRow;
    });
  }

  // Convert to CSV
  const csv = Papa.unparse(csvData, {
    quotes: true,
    delimiter: ",",
    header: true,
  });

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: idLocale });
}

/**
 * Format datetime for CSV export
 */
export function formatDateTimeForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: idLocale });
}

