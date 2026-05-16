const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } = require('docx');

async function main() {
  try {
    const docElements = [];
    docElements.push(
      new Paragraph({
        text: "Review Report",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
    const doc = new Document({
      sections: [{ children: docElements }],
    });
    const buffer = await Packer.toBuffer(doc);
    console.log("Success! Buffer size:", buffer.length);
  } catch(e) {
    console.error("Error:", e);
  }
}
main();
