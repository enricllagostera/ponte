import utils from './helpers'
import * as fs from 'fs-extra'
import * as path from 'path'
import { create as xmlCreate } from 'xmlbuilder2'
import AdmZip from 'adm-zip'

class QdpxExporter {
  constructor(userGuid = utils.guid(), userName = 'DEFAULT') {
    this.userGuid = userGuid
    this.userName = userName
    this.xml = this.createBlankProject()
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
    plainTextData = '',
    richTextData = '',
    ext = 'txt',
    dateTime = utils.getNowDateTime()
  ) {
    const guid_txt = utils.guid()
    const guid_ext = utils.guid()
    let ts = {
      '@guid': utils.guid(),
      '@name': name,
      '@plainTextPath': `internal://${guid_txt}.txt`,
      '@richTextPath': `internal://${guid_ext}.${ext}`,
      '@creatingUser': this.userGuid,
      '@creationDateTime': dateTime,
      '#': ''
    }

    // Create file for rich text/ original ext version
    if (richTextData != '') {
      await fs.outputFile(path.join(qdpxSourcesPath, `/${guid_ext}.${ext}`), richTextData)
    }
    // Create file for plain text version
    await fs.outputFile(path.join(qdpxSourcesPath, `/${guid_txt}.txt`), plainTextData)
    return ts
  }

  async writeFile(sourceExportPath, qdpxFolderPath, exportQdpxFilename) {
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
    fs.emptyDirSync(qdpxFolderPath)
    await zip.writeZipPromise(path.join(qdpxFolderPath, exportQdpxFilename))
    console.log('done qdpx zip packing, file at ' + path.join(qdpxFolderPath, exportQdpxFilename))
  }
}

export default QdpxExporter
