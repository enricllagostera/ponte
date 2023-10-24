import { writable } from 'svelte/store'

type SourceFile = {
  id: string
  path: string // always relative to repo root
  contents: string | Buffer | undefined
  commitHash?: string
}

class Fs {
  private files: Map<string, SourceFile> = new Map()

  public async get(path: string, commitHash: string = ''): Promise<SourceFile | undefined> {
    if (commitHash != '') {
      return {
        id: crypto.randomUUID(),
        path,
        contents: await window.files.readFileAtCommit(path, commitHash)
      }
    }
    return {
      id: crypto.randomUUID(),
      path,
      contents: await window.files.readFile(path)
    }
  }

  public async set(path: string, jsonContents: string): Promise<SourceFile | undefined> {
    return undefined
  }
}

export const fs = writable(new Fs())
