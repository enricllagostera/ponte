import utils from './helpers'
import * as fs from 'fs-extra'
import * as path from 'path'
import { create as xmlCreate } from 'xmlbuilder2'
import AdmZip from 'adm-zip'
import { DateTime } from 'luxon'

import { convertMdToDocx, convertCodeToDocx } from './docxBuilder'

class QdpxExporter {
  constructor(qdeFolderPath, userRepoInfo, userGuid = utils.guid(), userName = 'DEFAULT') {
    this.userGuid = userGuid
    this.userName = userName
    this.userRepoInfo = userRepoInfo
    this.xml = this.createBlankProject()
    this.extToConvertToDocx = ['md', 'docx']
    this.qdeFolderPath = qdeFolderPath
  }

  appendTextSource(ts) {
    this.xml.Project.Sources.TextSource.push(ts)
  }

  appendNoteToCodings(noteGuid, annotation) {
    const targetTS = this.xml.Project.Sources.TextSource.find((t) => t['@guid'] == annotation.reference)
    const noteRef = {
      '@targetGUID': noteGuid
    }
    const pts = this.createPlainTextSelection('note ref', 0, 2)
    pts['NoteRef'] = pts['NoteRef'] ?? []
    pts['NoteRef'].push(noteRef)
    targetTS['PlainTextSelection'] = targetTS['PlainTextSelection'] ?? []
    targetTS['PlainTextSelection'].push(pts)
  }

  appendNoteToTextSource(noteGuid, annotation) {
    const targetTS = this.xml.Project.Sources.TextSource.find((t) => t['@guid'] == annotation.reference)
    const noteRef = {
      '@targetGUID': noteGuid
    }
    const pts = this.createPlainTextSelection('note ref', 0, 2)
    pts['NoteRef'] = pts['NoteRef'] ?? []
    pts['NoteRef'].push(noteRef)
    targetTS['PlainTextSelection'] = targetTS['PlainTextSelection'] ?? []
    targetTS['PlainTextSelection'].push(pts)
  }

  appendCode(c) {
    this.xml.Project.CodeBook.Codes.Code.push(c)
  }

  createBlankProject() {
    return {
      Project: {
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation':
          'urn:QDA-XML:project:1.0 http://schema.qdasoftware.org/versions/Project/v1.0/Project.xsd',
        '@origin': `Ponte ${__VERSION__}`,
        '@name': `${this.userRepoInfo.replace('/', '--')} ${utils.getNowDateTime()}`,
        '@creatingUserGUID': this.userGuid,
        '@creationDateTime': utils.getNowDateTime(),
        '@xmlns': 'urn:QDA-XML:project:1.0',
        Users: [
          {
            User: {
              '@guid': this.userGuid,
              '@name': this.userName
            }
          }
        ],
        CodeBook: {
          Codes: {
            Code: [this.createCode('Sample code')]
          }
        },
        Sources: { TextSource: [] },
        Notes: {}
      }
    }
  }

  createCode(name, codeGuid = utils.guid(), color = '#CC00FF') {
    let c = {
      '@name': name,
      '@guid': codeGuid,
      '@isCodable': true,
      '@color': color
    }
    return c
  }

  createCoding(codeGuid) {
    let cd = {
      '@guid': utils.guid(),
      '@creatingUser': this.userGuid,
      '@creationDateTime': utils.getNowDateTime(),
      CodeRef: [
        {
          '@targetGUID': codeGuid
        }
      ]
    }
    return cd
  }

  createNote(noteName, noteGuid = utils.guid(), _description, plainText) {
    return {
      '@name': noteName,
      '@guid': noteGuid,
      '@creatingUser': this.userGuid,
      PlainTextContent: plainText ?? 'Some annotation content'
    }
  }

  createPlainTextSelection(name, start = 0, end = 1) {
    let pts = {
      '@guid': utils.guid(),
      '@name': name,
      '@creatingUser': this.userGuid,
      '@creationDateTime': utils.getNowDateTime(),
      '@startPosition': start,
      '@endPosition': end
    }
    return pts
  }

  findEncodedLinePositions(keyword, content) {
    let start = 0
    let head = 0
    let lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      start = head
      head += l.length
      let match = l.indexOf(keyword)
      if (match > -1) {
        return [start, head]
      }
    }
    return []
  }

  async createTextSourceFromTextData(
    qdpxSourcesPath,
    name,
    originalExt = 'txt',
    plainTextData = '',
    originalAbsPath = '',
    dateTime = utils.getNowDateTime(),
    isFolder = false
  ) {
    const base_ts_guid = utils.guid()
    const richTextExt = 'docx'
    let ts = {
      '@guid': base_ts_guid,
      '@name': name,
      '@plainTextPath': `internal://${base_ts_guid}.txt`,
      '@richTextPath': `internal://${base_ts_guid}.${richTextExt}`,
      '@creatingUser': this.userGuid,
      '@creationDateTime': dateTime,
      '#': ''
    }

    // Create file for rich text/ original ext version
    if (originalExt == 'md') {
      // convert to docx if md
      const docFile = await convertMdToDocx(plainTextData, name, originalAbsPath, isFolder)
      if (!docFile) {
        delete ts['@richTextPath']
      } else {
        await fs.outputFile(path.join(qdpxSourcesPath, `/${base_ts_guid}.${richTextExt}`), docFile)
      }
    }
    // Treat any other extension as plain text code
    else {
      // convert to docx if md
      const docFile = await convertCodeToDocx(plainTextData, name, originalAbsPath, isFolder)
      await fs.outputFile(path.join(qdpxSourcesPath, `/${base_ts_guid}.${richTextExt}`), docFile)
    }
    // Create file for plain text version
    await fs.outputFile(path.join(qdpxSourcesPath, `/${base_ts_guid}.txt`), plainTextData)
    return ts
  }

  async writeFile(sourceExportPath, exportQdpxFilename) {
    let doc = {}
    try {
      doc = xmlCreate({ version: '1.0', encoding: 'utf-8' }, this.xml)
    } catch (error) {
      console.log(error)
    }

    const outputXml = doc.end({ prettyPrint: true })
    fs.writeFileSync(path.join(sourceExportPath, 'project.qde'), outputXml)
    // Add export folder to ZIP, write it to disk as .QDPX file
    let zip = new AdmZip()
    zip.addLocalFolder(sourceExportPath)
    fs.ensureFileSync(exportQdpxFilename)
    await zip.writeZipPromise(exportQdpxFilename)
    console.log('done qdpx zip packing, file at ' + exportQdpxFilename)
  }

  async exportToFile(exportData, exportPath) {
    const qdeSourcesFolder = path.join(this.qdeFolderPath, 'Sources')
    fs.emptyDirSync(this.qdeFolderPath)
    fs.emptyDirSync(qdeSourcesFolder)
    let allTs = []

    const exportSources = [...exportData.sources]

    let commitSummaries = []
    for (let i = exportData.commits.length - 1; i >= 0; i--) {
      const c = exportData.commits[i]
      const summary = {
        id: utils.guid(),
        abs: '',
        type: 'compilationSource',
        commitHash: exportData.commits[i].hash,
        content: '',
        originalExt: 'md',
        '@creationDateTime': utils.formatDate(DateTime.fromMillis(c.committer.timestamp))
      }

      summary.name = `${String(exportData.commits.length - i).padStart(
        exportData.commits.length.toString().length,
        '0'
      )} #${c.hashAbbrev} ${c.subject}`
      const simplifiedC = { ...c }
      delete simplifiedC.fileTree
      delete simplifiedC.fileList
      delete simplifiedC.fileChangeStats
      //delete simplifiedC.parents // avoids duplicate encodings, but it is a hack
      summary.content = `# ${summary.name}


| Key | Value |
| --- | --- |
| Author | ${c.author_name} <${c.author_email}> |
| Authoring date | ${utils.getISODate(c.author.timestamp)} |
| Committer | ${c.committer_name} <${c.committer_email}> |
| Commit date | ${utils.getISODate(c.committer.timestamp)} |
| Branches | ${c.branches.toString().replaceAll(',', ', ')} |

## Message body

${c.body == '' ? '*Commit message body is empty.*' : c.body}

### Trailers

${c.trailers.length == 0 ? '*No trailers in commit.*' : c.trailers.toString()}

## Changes

${
  c.fileChangeStats.length > 0
    ? `| Path | Change |
| --- | --- |${c.fileChangeStats
        .map((fc) => `\n| ${fc.filepath} | ${fc.operation} |`)
        .toString()
        .replaceAll(',', '')}`
    : `*No file changes.*`
}

## All files

| Path |
|--- |
| ${c.fileList.toString().replaceAll(',', ' |\n| ')} |

---

## Raw metadata

\`\`\`json
${JSON.stringify(simplifiedC, null, 2)}
\`\`\`
`
      commitSummaries.push(summary)
    }

    exportSources.push(...commitSummaries)

    for (const source of exportSources) {
      let ext = source.originalExt ? source.originalExt : source.name.split('.')[source.name.split('.').length - 1]
      const new_ts = await this.createTextSourceFromTextData(
        qdeSourcesFolder,
        source.name,
        ext,
        source.content,
        source.abs,
        source['@creationDateTime'] ?? undefined,
        source.parent == 'compilationSource' ? true : false
      )

      const foundAnnotation = exportData.annotations.find((an) => an.reference == source.id)
      if (foundAnnotation != undefined) {
        foundAnnotation.reference = new_ts['@guid']
      }

      new_ts.PlainTextSelection = []
      allTs.push(new_ts)
    }
    //const allCodingsWithAnnotations = []
    for (const appliedCode of exportData.codes) {
      let new_c = this.createCode(appliedCode.code.value)
      const foundAnnotation = exportData.annotations.find((an) => an.reference == appliedCode.code.id)
      if (foundAnnotation != undefined) {
        foundAnnotation.reference = new_c['@guid']
      }

      let matchCount = 0
      for (const hash of appliedCode.commitHashes) {
        allTs.forEach((ts, i) => {
          const s = exportSources[i].content.indexOf('#' + hash.substring(0, 7))
          if (s >= 0) {
            matchCount++
            const [start, end] = this.findEncodedLinePositions('#' + hash.substring(0, 7), exportSources[i].content)
            const pts = this.createPlainTextSelection(
              `Match ${matchCount} of ${appliedCode.code.value} @ #${hash.substring(0, 7)}`,
              start,
              end
            )
            pts.Coding = this.createCoding(new_c['@guid'])
            ts.PlainTextSelection.push(pts)
          }
        })
      }
      this.appendCode(new_c)
    }

    for (const ts of allTs) {
      if (ts.PlainTextSelection.length == 0) {
        delete ts.PlainTextSelection
      }
      this.appendTextSource(ts)
    }

    this.xml.Project.Notes.Note = this.xml.Project.Notes.Note ?? []

    for (const an of exportData.annotations) {
      console.log(an)
      let newNote = this.createNote(an.id, undefined, undefined, an.content)
      if (an.referenceType == 'source') {
        this.appendNoteToTextSource(newNote['@guid'], an)
      }
      if (an.referenceType == 'code') {
        for (const code of this.xml.Project.CodeBook.Codes.Code.filter((cd) => cd['@guid'] == an.reference)) {
          newNote['@name'] = `Code annotation -- ${code['@name']}`
          code.Description = an.content
        }
      }
      this.xml.Project.Notes.Note.push(newNote)
    }

    if (this.xml.Project.Notes.Note.length == 0) {
      // empty notes, remove key
      delete this.xml.Project.Notes
    }

    await this.writeFile(this.qdeFolderPath, exportPath)
  }
}

export default QdpxExporter
