export function renderTemplate(text: string, variables: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
}
