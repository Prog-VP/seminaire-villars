declare module "docx-merger" {
  class DocxMerger {
    constructor(options: Record<string, unknown>, files: Buffer[]);
    save(type: "nodebuffer", callback: (data: Buffer) => void): void;
  }
  export default DocxMerger;
}
