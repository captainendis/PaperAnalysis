// IPC kanal adları - main ve preload tarafında ortak kullanılır.
export const CH = {
  connTest: 'connection:test',
  connSave: 'connection:save',
  connList: 'connection:list',
  connDelete: 'connection:delete',
  query: 'query:run',
  dashSave: 'dashboard:save',
  dashOpen: 'dashboard:open',
  dashExport: 'dashboard:export'
} as const
