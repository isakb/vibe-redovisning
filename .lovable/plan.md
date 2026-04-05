

# Fix PDF Download

## Problem
`jsPDF.save()` uses `document.createElement('a')` with a blob URL to trigger downloads. In the Lovable preview iframe (sandboxed), this approach is blocked — the browser silently prevents the download with no error in console.

## Solution
Replace `doc.save(fileName)` with a manual approach that opens the PDF in a new tab using `window.open()` with a blob URL, which works reliably in iframes.

### Changes

**`src/lib/pdfExport.ts`** (line ~383-385):
- Instead of `doc.save(fileName)`, generate the PDF as a blob, create an object URL, and open it in a new window/tab via `window.open()`. The user can then save it from the browser's PDF viewer.
- Alternatively, use `doc.output('blob')` and create a download link with `target="_blank"` which is more reliable in sandboxed iframes.

**`src/components/ReportWizard.tsx`** (line ~38-50):
- Wrap the `generatePDF` call in a try/catch and show an error toast if it fails, so the user gets feedback.

