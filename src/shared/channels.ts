/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
// IPC kanal adları - main ve preload tarafında ortak kullanılır.
export const CH = {
  appInfo: 'app:info',
  appShowAbout: 'app:showAbout',
  connTest: 'connection:test',
  connSave: 'connection:save',
  connList: 'connection:list',
  connDelete: 'connection:delete',
  query: 'query:run',
  queryCancel: 'query:cancel',
  schemaIntrospect: 'schema:introspect',
  dashSave: 'dashboard:save',
  dashOpen: 'dashboard:open',
  dashExport: 'dashboard:export',
  dashExportPdf: 'dashboard:exportPdf',
  fileSaveText: 'file:saveText',
  fileSaveBinary: 'file:saveBinary',
  reportPickFolder: 'report:pickFolder',
  reportSchedule: 'report:schedule',
  reportCancel: 'report:cancel',
  reportStatus: 'report:status',
  publishStart: 'publish:start',
  publishRepublish: 'publish:republish',
  publishStop: 'publish:stop',
  publishStatus: 'publish:status'
} as const
