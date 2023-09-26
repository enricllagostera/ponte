import { join } from 'path'
import sanitizeHtml, { defaults } from 'sanitize-html'
import { load as loadCheerio } from 'cheerio'
import HTMLtoDOCX from 'html-to-docx'
// import { pathToFileURL } from 'url'
import imageToBase64 from 'image-to-base64'

// Using ES6 import syntax
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)

import { marked } from 'marked'
import { markedXhtml } from 'marked-xhtml'
marked.use(markedXhtml())

export async function convertMdToDocx(md, name = '', basePath = '') {
  const htmlData = marked.parse(md, { gfm: true })
  // https://raw.githubusercontent.com/pippinbarr/itisasifyouweremakinglove/master/process/
  const cheerio = loadCheerio(htmlData, {})
  for (const allImgEls of cheerio('img').toArray()) {
    let old_src = cheerio(allImgEls).attr('src')
    if (old_src.startsWith('http') == false) {
      let base64Src = await imageToBase64(join(basePath, '..', old_src))
      //let localSrc = pathToFileURL(join(basePath, old_src)).toString()
      // let new_src = `https://raw.githubusercontent.com/${repoInfo}/${commitHash}/${baseFolder}/${old_src}`;
      cheerio(allImgEls).attr('src', 'data:image/png;base64,' + base64Src)
    }
  }
  const processedHtml = cheerio.xml()
  let sanitizedHtml = sanitizeHtml(processedHtml, {
    allowedTags: defaults.allowedTags.concat(['img']),
    allowedSchemesByTag: {
      img: ['file', 'https', 'http', 'data']
    }
  })

  let docRs = await HTMLtoDOCX(sanitizedHtml, null, {
    footer: true,
    pageNumber: true,
    font: 'Roboto',
    fontSize: '12pt',
    title: name,
    decodeUnicode: true
  })
  return docRs
}

export async function convertCodeToDocx(content, name = '', basePath = '') {
  const allLines = content.split('\n')
  const cheerio = loadCheerio('', {})
  for (const line of allLines) {
    cheerio('body').append(`<p>`)
    cheerio('body').children().last().html(`<code>${line}</code>`)
  }
  cheerio('body').attr('style', 'line-height: 1em;')
  const processedHtml = cheerio.xml()

  let docRs = await HTMLtoDOCX(processedHtml, null, {
    footer: true,
    pageNumber: true,
    font: 'JetBrains Mono',
    fontSize: '9pt',
    title: name,
    decodeUnicode: true
  })
  return docRs
}
