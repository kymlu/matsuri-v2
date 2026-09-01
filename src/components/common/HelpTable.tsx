import React from "react";

type HelpTableProps = {
  headers: string[],
  rows: React.ReactNode[][],
}

export default function HelpTable({ headers, rows }: HelpTableProps) {
  return (
    <div className="w-full overflow-x-auto border border-line rounded-md">
      <table className="w-full text-sm border-collapse text-start">
        <thead>
          <tr className="bg-subtle">
            {
              headers.map((header, i) => (
                <th key={i} className="p-2 font-bold border-b border-line text-nowrap text-primary">
                  {header}
                </th>
              ))
            }
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {
            rows.map((row, i) => (
              <tr key={i} className="odd:bg-surface even:bg-app">
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
