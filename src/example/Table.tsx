"use client";

import { ReactNode } from "react";
import { useInformAI } from "../useInformAI";

type TableProps = {
  data: any[];
  colHeaders?: string[];
};

const prompt = `This component is a table that displays data in a tabular format. 
It takes two props: data and colHeaders. The data prop is an array of objects, where 
each object represents a row in the table. The colHeaders prop is an optional 
array of strings that represent the column headers of the table. 
If the colHeaders prop is not provided, the component will use the 
keys of the first object in the data array as the column headers. 
The component will render the table with the provided data and column headers.`;

export function Table({ data, colHeaders }: TableProps) {
  const { updateState, addEvent } = useInformAI({
    name: "Table",
    prompt,
    props: {
      data,
      colHeaders,
    },
  });

  const cellClicked = (e: React.MouseEvent<HTMLTableCellElement>) => {
    //would update any of the keys this Component already registered
    updateState({ props: { colHeaders: ["new", "headers"] } });

    //adds a new hint to the AI
    addEvent({
      type: "click",
      description: "User clicked on a cell with data: " + (e.target as HTMLElement).textContent,
    });
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            {colHeaders
              ? colHeaders.map((header, index) => <th key={index}>{header}</th>)
              : Object.keys(data[0]).map((header, index) => <th key={index}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((cell, cellIndex) => (
                <td key={cellIndex} onClick={cellClicked}>
                  {cell as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
