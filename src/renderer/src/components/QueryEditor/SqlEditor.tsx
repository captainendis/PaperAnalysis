import { useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import type { SchemaInfo } from '@shared/types'

interface Props {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  /** Aktif bağlantının şeması — otomatik tamamlama önerileri için. */
  schema?: SchemaInfo
}

// Monaco tamamlama sağlayıcısı bir kez kaydedilir; şema modül düzeyinde güncellenir.
let providerRegistered = false
let currentSchema: SchemaInfo | null = null

export function SqlEditor({ value, onChange, onRun, schema }: Props) {
  // Aktif şemayı sağlayıcının okuyabilmesi için güncel tut.
  useEffect(() => {
    currentSchema = schema ?? null
  }, [schema])

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={(editor, monaco) => {
        // Ctrl/Cmd+Enter ile sorguyu çalıştır.
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun?.())

        // Şema-duyarlı otomatik tamamlama (tablo ve sütun adları) — bir kez kaydet.
        if (!providerRegistered) {
          providerRegistered = true
          monaco.languages.registerCompletionItemProvider('sql', {
            triggerCharacters: [' ', '.', ',', '('],
            provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
              const sc = currentSchema
              if (!sc) return { suggestions: [] }
              const word = model.getWordUntilPosition(position)
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
              }
              const suggestions: Monaco.languages.CompletionItem[] = []
              const seenCol = new Set<string>()
              for (const t of sc.tables) {
                suggestions.push({
                  label: t.name,
                  kind: monaco.languages.CompletionItemKind.Struct,
                  insertText: t.name,
                  detail: t.schema ? `Tablo · ${t.schema}` : 'Tablo',
                  range
                })
                for (const c of t.columns) {
                  if (seenCol.has(c.name)) continue
                  seenCol.add(c.name)
                  suggestions.push({
                    label: c.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: c.name,
                    detail: `Sütun · ${c.type}`,
                    range
                  })
                }
              }
              return { suggestions }
            }
          })
        }
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        padding: { top: 8 }
      }}
    />
  )
}
