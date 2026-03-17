"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

export default function Latex({ tex, displayMode = false, className }: { tex: string; displayMode?: boolean; className?: string }) {
  let html = tex
  try {
    html = katex.renderToString(tex, { throwOnError: false, displayMode })
  } catch {
    html = tex
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
