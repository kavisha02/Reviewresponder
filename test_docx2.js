const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } = require('docx');

async function main() {
  try {
    const docElements = [];
    docElements.push(
        new Table({
            rows: [
                new TableRow({
                    cells: [
                        new TableCell({ children: [new Paragraph("Metric")] })
                    ]
                })
            ]
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
