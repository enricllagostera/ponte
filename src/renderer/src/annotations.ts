import { get, writable } from 'svelte/store'
import type { Annotation } from '../../types'

export const annotations = writable<Annotation[]>([])

export function addAnnotation(reference: string, referenceType: 'code' | 'source', content: string): void {
  const all = get(annotations)
  const foundAnnotation = all.find((an) => an.reference == reference)
  if (foundAnnotation) {
    foundAnnotation.content = content
  } else {
    all.push({
      id: crypto.randomUUID(),
      reference,
      referenceType,
      content
    })
  }
}

export function removeAnnotation(reference: string): void {
  const all = get(annotations)
  const newAll = all.filter((an) => an.reference != reference)
  annotations.set(newAll)
}

export function updateAnnotation(reference: string, content: string): void {
  const all = get(annotations)
  const foundAnnotation = all.find((an) => an.reference == reference)
  if (foundAnnotation) {
    foundAnnotation.content = content
  } else {
    console.warn('ANNOTATION COULD NOT UPDATE')
  }
}

export function getAnnotationContent(reference: string): string {
  const all = get(annotations)
  const foundAnnotation = all.find((an) => an.reference == reference)
  if (foundAnnotation) {
    return foundAnnotation.content
  } else {
    console.warn('ANNOTATION NOT FOUND')
    return ''
  }
}

export function hasAnnotationForReference(reference: string): boolean {
  return get(annotations).find((an) => an.reference == reference) != undefined
}
