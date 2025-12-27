export interface MenuItemConfig {
    label: string;
    description: string;
    command?: string;
    icon?: string;
}

export const menuItemConfiguration : MenuItemConfig[] = [
  {
    label: 'Base64 Helper',
    description: '',
    command: 'codemate.base64Helper',
    icon: 'shield'
  },
  {
    label: 'JSON → Code',
    description: '',
    command: 'codemate.jsonToCode',
    icon: 'symbol-file'
  }
]