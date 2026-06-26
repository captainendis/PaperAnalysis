import Editor from '@monaco-editor/react'

interface Props {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
}

export function SqlEditor({ value, onChange, onRun }: Props) {
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
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        padding: { top: 8 }
      }}
    />
  )
}
