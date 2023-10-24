import { join } from 'path'
import sanitizeHtml, { defaults } from 'sanitize-html'
import { load as loadCheerio } from 'cheerio'
import HTMLtoDOCX from 'html-to-docx'
import { escape } from 'html-escaper'
import imageToBase64 from 'image-to-base64'

import { marked } from 'marked'
import { markedXhtml } from 'marked-xhtml'
marked.use(markedXhtml())

export async function convertMdToDocx(md, name = '', basePath = '', isFolder = false) {
  const htmlData = marked.parse(md, { gfm: true })
  // https://raw.githubusercontent.com/pippinbarr/itisasifyouweremakinglove/master/process/
  const cheerio = loadCheerio(htmlData, {})
  for (const allImgEls of cheerio('img').toArray()) {
    let old_src = cheerio(allImgEls).attr('src')
    if (old_src.startsWith('http') == false) {
      let base64Src = {}
      try {
        if (isFolder) {
          base64Src = await imageToBase64(join(basePath, old_src))
        } else {
          base64Src = await imageToBase64(join(basePath, '..', old_src))
        }
        //let localSrc = pathToFileURL(join(basePath, old_src)).toString()
        // let new_src = `https://raw.githubusercontent.com/${repoInfo}/${commitHash}/${baseFolder}/${old_src}`;
        cheerio(allImgEls).attr('src', 'data:image/png;base64,' + base64Src)
      } catch (error) {
        base64Src = ''
      }
    }
  }
  const processedHtml = cheerio.xml()
  let sanitizedHtml = sanitizeHtml(processedHtml, {
    allowedTags: defaults.allowedTags.concat(['img']),
    allowedSchemesByTag: {
      img: ['file', 'https', 'http', 'data']
    }
  })

  let docRs = undefined
  try {
    docRs = await HTMLtoDOCX(sanitizedHtml, null, {
      footer: true,
      pageNumber: true,
      font: 'Roboto',
      fontSize: '12pt',
      title: name,
      decodeUnicode: true,
      lineNumber: false
    })
    return docRs
  } catch (error) {
    console.log(error.message)
    return null
  }
}

export async function formatCodeAsHTML(_event, content) {
  const allLines = content.split('\n')
  const cheerio = loadCheerio('', {})
  for (const line of allLines) {
    const sLine = `<pre>${escape(line)}</pre>`
    cheerio('body').append(`<p>`)
    cheerio('body').children().last().html(sLine)
  }
  cheerio('body').attr('style', 'line-height: 1em;')
  return cheerio.xml()
}

export async function convertCodeToDocx(content, name = '') {
  const processedHtml = await formatCodeAsHTML(content)
  let docRs = await HTMLtoDOCX(processedHtml, null, {
    footer: true,
    pageNumber: true,
    font: 'JetBrains Mono',
    fontSize: '9pt',
    title: name,
    decodeUnicode: false
  })
  return docRs
}
