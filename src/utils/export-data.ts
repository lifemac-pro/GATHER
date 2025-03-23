import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

// Define a type for the data
type Data = Record<string, string | number>;

// Define a type for the data
type DataType = Record<string, string>; // ✅ Recommended by TypeScript

// 📌 Export data as CSV
export function exportToCSV(data: Data[], filename = "data.csv") {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 📌 Export data as PDF
export function exportToPDF(data: Data[], columns: string[], filename = "data.pdf") {
  const doc = new jsPDF();
  doc.text("Exported Data", 14, 10);
  
  autoTable(doc, {
    head: [columns],
    body: data.map(row => columns.map(col => String(row[col] !== undefined ? row[col] : ""))),
  });

  doc.save(filename);
}
