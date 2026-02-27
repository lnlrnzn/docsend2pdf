import { PDFDocument } from "pdf-lib";

export async function buildPdf(imageBuffers: Buffer[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const imgBuffer of imageBuffers) {
    const uint8 = new Uint8Array(imgBuffer);

    let image;
    if (isPng(uint8)) {
      image = await pdfDoc.embedPng(uint8);
    } else {
      image = await pdfDoc.embedJpg(uint8);
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function isPng(data: Uint8Array): boolean {
  return (
    data.length >= 4 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  );
}
