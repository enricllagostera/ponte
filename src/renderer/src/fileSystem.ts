import type { RepoDirent } from '../../types'
import type { PathLike } from 'fs-extra'

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

export function findInTreeAndToggleSelected(abs: PathLike, directory: RepoDirent, value: boolean): void {
  const dir = directory.children || directory
  for (const dirent of dir) {
    if (dirent.children?.length > 0) {
      // is folder
      if (dirent.abs == abs) {
        dirent.selected = value
        return
      }

      findInTreeAndToggleSelected(abs, dirent, value)
    } else if (!dirent.children && dirent.abs == abs) {
      dirent.selected = value
      return
    }
  }
}
