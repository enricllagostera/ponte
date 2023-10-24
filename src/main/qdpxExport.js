import utils from './helpers'
import * as fs from 'fs-extra'
import * as path from 'path'
import { create as xmlCreate } from 'xmlbuilder2'
import AdmZip from 'adm-zip'
import { convertMdToDocx, convertCodeToDocx } from './docxBuilder'

class QdpxExporter {
  constructor(qdeFolderPath, userGuid = utils.guid(), userName = 'DEFAULT') {
    this.userGuid = userGuid
    this.userName = userName
    this.xml = this.createBlankProject()
    this.extToConvertToDocx = ['md', 'docx']
    this.qdeFolderPath = qdeFolderPath
  }

  appendTextSource(ts) {
    this.xml.Project.Sources.TextSource.push(ts)
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
        '@origin': 'RepoToQDA 0.0.1',
        '@name': 'repo-to-qda test ' + utils.getNowDateTime(),
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
            Code: [this.createCode('')]
          }
        },
        Sources: { TextSource: [] }
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
      await fs.outputFile(path.join(qdpxSourcesPath, `/${base_ts_guid}.${richTextExt}`), docFile)
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
    // const outputXml = doc.end({ prettyPrint: true, allowEmptyTags: true });
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
    for (const source of exportData.sources) {
      let ext = source.originalExt
        ? source.originalExt
        : source.name.split('.')[source.name.split('.').length - 1]
      const new_ts = await this.createTextSourceFromTextData(
        qdeSourcesFolder,
        source.name,
        ext,
        source.content,
        source.abs,
        undefined,
        source.parent == 'compilationSource' ? true : false
      )
      new_ts.PlainTextSelection = []
      allTs.push(new_ts)
    }
    for (const appliedCode of exportData.codes) {
      let new_c = this.createCode(appliedCode.code.value)
      let matchCount = 0
      for (const hash of appliedCode.commitHashes) {
        allTs.forEach((ts, i) => {
          const s = exportData.sources[i].content.indexOf(hash.substring(0, 7))
          if (s >= 0) {
            matchCount++
            const pts = this.createPlainTextSelection(
              `Match ${matchCount} of ${appliedCode.code.value} @ #${hash.substring(0, 7)}`,
              s,
              s + hash.substring(0, 7).length
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

    await this.writeFile(this.qdeFolderPath, exportPath)
  }
}

export default QdpxExporter
