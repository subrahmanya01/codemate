export interface MenuItemConfig {
    label: string;
    description: string;
    command?: string;
    icon?: string;
}

export const menuItemConfiguration : MenuItemConfig[] = [
  {
    label: 'Base64 Helper',
    description: 'Encode and decode Base64 strings',
    command: 'codemate.base64Helper',
    icon: 'symbol-string'
  },
  {
    label: 'Code → JSON',
    description: 'Convert code structures to JSON',
    command: 'codemate.codeToJson',
    icon: 'symbol-file'
  },
  {
    label: 'JSON → Code',
    description: 'Generate code from JSON schemas',
    command: 'codemate.jsonToCode',
    icon: 'symbol-class'
  },
  {
    label: 'XML ↔ JSON',
    description: 'Convert between XML and JSON',
    command: 'codemate.xmlJson',
    icon: 'symbol-namespace'
  },
  {
    label: 'JWT Debugger',
    description: 'Inspect and decode JWT tokens',
    command: 'codemate.jwtDebugger',
    icon: 'symbol-key'
  },
  {
    label: 'Quick Hash',
    description: 'Generate hash values',
    command: 'codemate.quickHash',
    icon: 'symbol-misc'
  }
]