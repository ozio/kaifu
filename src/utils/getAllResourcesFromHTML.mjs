import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'

const listFilePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../skip.txt')
const list = fs.readFileSync(listFilePath, 'utf-8')

const restrictedLinkParts = list
  .split('\n')
  .map(line => {
    const commentPosition = line.indexOf('#')

    if (commentPosition >= 0) {
      line = line.slice(0, commentPosition)
    }

    return line.trim()
  })
  .filter(line => line !== '')

export const getAllResourcesFromHTML = async (html) => {
  let document

  try {
    document = parse(html)
  } catch (e) {
    return []
  }

  const resources = []

  document.querySelectorAll('link').forEach(item => {
    if (!item.getAttribute('href')) return
    if (!item.getAttribute('rel') || item.getAttribute('rel') !== 'stylesheet') return
    if (restrictedLinkParts.some((part) => item.getAttribute('href').includes(part))) return

    resources.push(item.getAttribute('href'))
  })

  document.querySelectorAll('script').forEach(item => {
    if (!item.getAttribute('src')) return
    if (restrictedLinkParts.some((part) => item.getAttribute('src').includes(part))) return

    resources.push(item.getAttribute('src'))
  })

  return resources.filter(Boolean)
}
