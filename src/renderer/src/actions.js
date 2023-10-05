import { v4 as uuid } from 'uuid'

export class ActionDB {
  constructor() {
    this.current = this.getDefault()
  }

  getDefault() {
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
        description:
          'Generates a single source with the contents of the devlogs for all processed commits.',
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

  get(name) {
    return this.current.filter((a) => a.name == name)[0]
  }

  getAll(name) {
    return this.current.filter((a) => a.name == name)
  }

  removeFrom(action) {
    return [...this.current.filter((a) => a.guid != action.guid)]
  }

  get manualIgnoreCommits() {
    return this.get('manualIgnoreCommits')
  }

  get manualImportFiles() {
    return this.get('manualImportFiles')
  }

  get manualEncodeCommits() {
    return this.get('manualEncodeCommits')
  }

  get devlogCompilation() {
    return this.get('devlogCompilation')
  }

  get individualCommitDevlog() {
    return this.get('individualCommitDevlog')
  }

  get manualImportFolderText() {
    return this.get('manualImportFolderText')
  }

  addApplyCodeCommitGlobTo() {
    const adding = {
      name: 'applyCodeCommitGlob',
      guid: uuid(),
      active: true,
      title: 'Apply codes to commits by pattern',
      description:
        'Apply codes to commits based on their subject and body information (i.e. devlog).',
      selectedCommits: [],
      // selectedCommits: [ hash0, hash1 ]
      codesToApply: [],
      // codesToApply: [{ value, label }]
      searchPattern: ''
    }
    this.current = [...this.current, adding]
    return this.current
  }

  addImportFilesByGlobTo() {
    const adding = {
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
