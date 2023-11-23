import type { RepoDirent } from '../../types'

export function getAllSelectedFolders(directory: RepoDirent[]): RepoDirent[] {
  const selected = []
  for (const dirent of directory) {
    if (dirent.children?.length > 0) {
      // is folder
      if (dirent.selected) {
        selected.push(dirent)
      }
      selected.push(...getAllSelectedFolders(dirent.children))
    }
  }
  return [...selected]
}

export function getAllSelectedFiles(directory: RepoDirent[]): RepoDirent[] {
  const selected = []
  for (const dirent of directory) {
    if (dirent.children?.length > 0) {
      // is folder
      selected.push(...getAllSelectedFiles(dirent.children))
    } else if (!dirent.children) {
      // is file
      if (dirent.selected) {
        selected.push(dirent)
      }
    }
  }
  return selected
}

export function getAllFilesInFolder(folder: RepoDirent): RepoDirent[] {
  const selected = []
  for (const dirent of folder.children) {
    if (dirent.children?.length > 0) {
      // is folder
      selected.push(...getAllFilesInFolder(dirent))
    } else if (!dirent.children) {
      // is file
      selected.push(dirent)
    }
  }
  return selected
}
