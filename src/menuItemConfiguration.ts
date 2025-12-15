export interface MenuItemConfig {
    label: string;
    description: string;
    command?: string;
    icon?: string;
}

export const menuItemConfiguration : MenuItemConfig[] = [
  {
    label: 'JSON to Code',
    description: 'Convert JSON to Code',
    command: 'codemate.jsonToCode',
    icon: 'file-code'
  },
  {
    label: 'Code to JSON',
    description: 'Convert Code to JSON',
    command: 'codemate.codeToJson',
    icon: 'file-code'
  },
  {
    label: 'Base64 Helper',
    description: 'Convert to/from Base64',
    command: 'codemate.base64Helper',
    icon: 'file-code'
  },
  {
    label: 'Mock Data Generator',
    description: 'Generate Mock Data',
    command: 'codemate.mockDataProvider',
    icon: 'file-code'
  }
]