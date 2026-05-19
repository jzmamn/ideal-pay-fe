import { EmployeeTestForm } from "../test-forms/test-forms";
import { MasterDataTableConfig } from "./master-data-table-config";

export const  lookupConfig: MasterDataTableConfig<EmployeeTestForm> = {
    title: 'Employee Lookup',
    displayedColumns: ['id', 'name', 'department', 'salary'],
    columnLabels: {
      id: 'ID',
      name: 'Employee Name',
      department: 'Department',
      salary: 'Salary'
    },
    data: [
      { id: 1, name: 'Jezeem', department: 'IT', salary: 5000 },
      { id: 2, name: 'Aymen', department: 'IT', salary: 5000 },
      { id: 3, name: 'Zaid', department: 'IT', salary: 5000 },
      { id: 4, name: 'Raiyan', department: 'IT', salary: 5000 },
      { id: 5, name: 'Shaamil', department: 'IT', salary: 5000 },
      { id: 6, name: 'Amris', department: 'IT', salary: 5000 },
      { id: 7, name: 'Mariyam', department: 'HR', salary: 4500 }
    ]
  };