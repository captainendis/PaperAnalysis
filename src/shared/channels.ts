// IPC kanal adları - main ve preload tarafında ortak kullanılır.
export const CH = {
  connTest: 'connection:test',
  connSave: 'connection:save',
  connList: 'connection:list',
  connDelete: 'connection:delete',
  query: 'query:run',
  schemaIntrospect: 'schema:introspect',
  dashSave: 'dashboard:save',
  dashOpen: 'dashboard:open',
  dashExport: 'dashboard:export',
  dashExportPdf: 'dashboard:exportPdf',
  fileSaveText: 'file:saveText',
  fileSaveBinary: 'file:saveBinary'
} as const
