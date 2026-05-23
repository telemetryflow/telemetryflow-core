import type { DataTableDefinition } from './types';

const DEFAULT_FEATURES = {
  pagination: true, pageSize: 20, pageSizes: [10, 20, 50, 100],
  search: false, filter: false, export: false, rowClick: true,
  rowSelection: false, striped: false, expandable: false,
};

// Allocated ID range: DBM31301-DBM31304
export const DBM_SQLITE3_DATATABLES: DataTableDefinition[] = [
  {
    datatableId: 'DBM31301', module: 'DBM', title: 'SQLite3 Table Browser', component: 'NDataTable',
    columns: [
      { key: 'tableName', title: 'Table', width: 180, sortable: true, renderType: 'text' },
      { key: 'tableType', title: 'Type', width: 80, sortable: true, renderType: 'tag' },
      { key: 'rowCount', title: 'Rows', width: 120, sortable: true, renderType: 'text' },
      { key: 'columnCount', title: 'Columns', width: 80, sortable: true, renderType: 'text' },
      { key: 'indexCount', title: 'Indexes', width: 80, sortable: true, renderType: 'text' },
      { key: 'withoutRowid', title: 'No RowID', width: 90, sortable: true, renderType: 'tag' },
      { key: 'strictMode', title: 'Strict', width: 80, sortable: true, renderType: 'tag' },
    ],
    features: { ...DEFAULT_FEATURES, search: true, filter: true },
    view: 'db-monitoring/sqlite3/Sqlite3InstanceDetailView.vue',
    dataSource: 'dbSqlite3Store.tables.tables',
    description: 'SQLite3 table catalog browser', position: 'sqlite3-table-browser',
  },
  {
    datatableId: 'DBM31302', module: 'DBM', title: 'Integrity Check History', component: 'NDataTable',
    columns: [
      { key: 'timestamp', title: 'Timestamp', width: 180, sortable: true, renderType: 'date' },
      { key: 'checkType', title: 'Check Type', width: 150, sortable: true, renderType: 'text' },
      { key: 'status', title: 'Status', width: 100, sortable: true, renderType: 'tag' },
      { key: 'message', title: 'Message', width: 300, sortable: false, renderType: 'text' },
      { key: 'errorCount', title: 'Errors', width: 80, sortable: true, renderType: 'text' },
    ],
    features: DEFAULT_FEATURES,
    view: 'db-monitoring/sqlite3/Sqlite3InstanceDetailView.vue',
    dataSource: 'dbSqlite3Store.integrity.checks',
    description: 'SQLite3 integrity check history', position: 'sqlite3-integrity-table',
  },
  {
    datatableId: 'DBM31303', module: 'DBM', title: 'Active Processes', component: 'NDataTable',
    columns: [
      { key: 'pid', title: 'PID', width: 80, sortable: true, renderType: 'text' },
      { key: 'command', title: 'Command', width: 200, sortable: true, renderType: 'text' },
      { key: 'database', title: 'Database', width: 150, sortable: true, renderType: 'text' },
      { key: 'state', title: 'State', width: 100, sortable: true, renderType: 'tag' },
      { key: 'startTime', title: 'Started', width: 180, sortable: true, renderType: 'date' },
      { key: 'durationMs', title: 'Duration (ms)', width: 120, sortable: true, renderType: 'text' },
    ],
    features: { ...DEFAULT_FEATURES, search: true },
    view: 'db-monitoring/sqlite3/Sqlite3InstanceDetailView.vue',
    dataSource: 'dbSqlite3Store.processes',
    description: 'Active SQLite3 connections and processes', position: 'sqlite3-process-table',
  },
];
