// pdf.js me worker-in lokal (pa CDN) - i përbashkët për parapamjet, editorin dhe printimin.
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export { pdfjsLib };
