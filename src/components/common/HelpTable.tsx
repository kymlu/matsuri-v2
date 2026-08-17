import React from "react";

type HelpTableProps = {
  headers: string[],
  rows: React.ReactNode[][],
}

export default function HelpTable({ headers, rows }: HelpTableProps) {
  return (
    <div className="w-full overflow-x-auto border border-gray-400 rounded-md">
      <table className="w-full text-sm text-start border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {
              headers.map((header, i) => (
                <th key={i} className="p-2 font-bold text-primary border-b border-gray-400">
                  {header}
                </th>
              ))
            }
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {
            rows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                {
                  row.map((cell, j) => (
                    <td key={j} className="p-2 align-top">
                      {cell}
                    </td>
                  ))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
