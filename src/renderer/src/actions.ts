import { v4 as uuid } from 'uuid'
import type { Action } from '../../types'

export class ActionDB {
  current: Action[]
  constructor() {
    this.current = this.getDefault()
  }

  getDefault(): Action[] {
    return [
      {
        name: 'manualIgnoreCommits',
        guid: uuid(),
        active: true,
        title: 'Manually ignore commits',
        description: 'Removes the selected commits from QDPX processing.',
        ignoredCommits: []
      },
      {
        name: 'manualImportFiles',
        guid: uuid(),
        active: true,
        title: 'Manually import files as sources commits',
        description: 'Includes selected files on QDPX processing.',
        selectedFiles: []
      },
      {
        name: 'manualImportFolderText',
        guid: uuid(),
        active: true,
        title: 'Import folders as text compilation',
        description: 'Includes selected folders as compiled text sources on QDPX.',
        selectedFolders: []
      },
      {
        name: 'manualEncodeCommits',
        guid: uuid(),
        active: true,
        title: 'Manually apply code to commits',
        description: 'Manually add codes in the commits timeline.',
        codesToApply: [] // [{ code :{value, label}, commits: [hash0, hash1] }, ...]
      },
      {
        name: 'devlogCompilation',
        guid: uuid(),
        active: true,
        title: 'Generate devlog compilation',
        description: 'Generates a single source with the contents of the devlogs for all processed commits.',
        selectedCommits: []
      },
      {
        name: 'individualCommitDevlog',
        guid: uuid(),
        active: false,
        title: 'Generate one devlog per commit',
        description: 'Adds a separate text source with devlog information for each commit.',
        selectedCommits: []
      }
    ]
  }

  get(name: string): Action {
    return this.current.filter((a) => a.name == name)[0]
  }

  getAll(name: string): Action[] {
    return this.current.filter((a) => a.name == name)
  }

  removeFrom(action: Action): Action[] {
    return [...this.current.filter((a) => a.guid != action.guid)]
  }

  get manualIgnoreCommits(): Action {
    return this.get('manualIgnoreCommits')
  }

  get manualImportFiles(): Action {
    return this.get('manualImportFiles')
  }

  get manualEncodeCommits(): Action {
    return this.get('manualEncodeCommits')
  }

  get devlogCompilation(): Action {
    return this.get('devlogCompilation')
  }

  get individualCommitDevlog(): Action {
    return this.get('individualCommitDevlog')
  }

  get manualImportFolderText(): Action {
    return this.get('manualImportFolderText')
  }

  addApplyCodeCommitGlobTo(): Action[] {
    const adding: Action = {
      name: 'applyCodeCommitGlob',
      guid: uuid(),
      active: true,
      title: 'Apply codes to commits by pattern',
      description: 'Apply codes to commits based on their subject and body information (i.e. devlog).',
      selectedCommits: [],
      // selectedCommits: [ hash0, hash1 ]
      codesToApply: [],
      // codesToApply: [{ value, label }]
      searchPattern: ''
    }
    this.current = [...this.current, adding]
    return this.current
  }

  addApplyCodeOnFilesChanged(codeToApply, filesToObserve): Action[] {
    const adding: Action = {
      name: 'applyCodeOnFilesChanged',
      guid: uuid(),
      active: true,
      title: 'Apply codes to commits if files changed',
      description: 'Apply codes to commits based on their list of files changed.',
      selectedCommits: [],
      // selectedCommits: [ hash0, hash1 ]
      codesToApply: [codeToApply],
      // codesToApply: [{ value, label }]
      filesToObserve
    }
    this.current = [...this.current, adding]
    return this.current
  }

  addImportFilesByGlobTo(): Action[] {
    const adding: Action = {
      name: 'importFilesByGlob',
      guid: uuid(),
      active: true,
      title: 'Import files as text sources',
      description:
        'Import files from the repository that match the following pattern. They will be read and added as text sources in the QDPX export.',
      selectedCommits: [],
      selectedFiles: [],
      searchPattern: '',
      inputCommitOption: 'latest'
    }
    this.current = [...this.current, adding]
    return this.current
  }
}
