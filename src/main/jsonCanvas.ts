import { dialog } from 'electron'
import { writeJSONSync } from 'fs-extra'
import { JSONCanvas } from '@trbn/jsoncanvas'
import { v4 as uuid } from 'uuid'
import { DateTime } from 'luxon'

export async function exportJsonCanvas(_event, commitsData, userRepoInfo) {
  let res
  try {
    res = await dialog.showSaveDialog({
      filters: [{ name: 'JSON Canvas', extensions: ['canvas'] }]
    })
    if (res.canceled) {
      return
    }
  } catch (error) {
    return
  }
  const canvas = new JSONCanvas()
  const baseWidth = 300
  const baseHeight = 150
  const gap = { x: 100, y: 25 }

  for (const [hash, cv] of commitsData) {
    //console.log(hash, cv)
    const commitDate = DateTime.fromMillis(cv.author.timestamp).toFormat('yyyy-MM-dd, HH:mm')
    canvas.addNode({
      id: hash,
      type: 'text',
      text: `**${cv.subject}**\n\n${commitDate} [\`#${cv.hashAbbrev}\`](https://github.com/${userRepoInfo}/commit/${hash})`,
      x: cv.col * (baseWidth + gap.x),
      y: cv.band * (baseHeight + gap.y),
      width: baseWidth,
      height: baseHeight
    })
  }
  for (const [hash, cv] of commitsData) {
    const parent = cv.parents.split(' ')[0] ?? ''
    if (parent == '') {
      continue
    }
    const toSide = cv.band == 0 ? 'left' : 'top'
    const fromSide = cv.band == 0 ? 'right' : 'bottom'
    canvas.addEdge({
      id: uuid(),
      fromNode: parent,
      toNode: cv.hash,
      toSide,
      fromSide
    })
  }

  writeJSONSync(res.filePath, canvas)
}
