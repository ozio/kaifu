import fs from 'fs/promises'

export async function getPackageJson() {
  try {
    const data = await fs.readFile(new URL('../../package.json', import.meta.url), 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading or parsing package.json:', error)
    throw error
  }
}
