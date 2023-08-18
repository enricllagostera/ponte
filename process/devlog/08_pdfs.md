---
date: 2023-08-18
title: "08 On PDFs across CAQDAS tools"
---

In Atlas.ti, PDF coding allows for both text selections and image selection (as rectangles). When exported to QDPX, these look like `<PDFSelections>` added to a `<PDFSource>`  element. In QualCoder, PDF sources retain only text-representation codings. Image-based codings are lost. Atlas.ti imports PDFSelections from NVivo just fine, but seems to lose the `<PlainTextSelection>` tags made on its textual representation.

In short, there is plenty of issues in how different tools interpret PDF sources and their annotations. It seems that if we target apps like NVivo or Atlas.ti, then image-based codings (`<PDFSelection>`) could work well, but the most interoperable is plain text on `docx` or `txt` files.
