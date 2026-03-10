export async function exportChartPdf(containerEl, fileName = 'chart.pdf') {
  if (!containerEl) return;
  const { toPng } = await import('html-to-image');
  const { jsPDF } = await import('jspdf');
  const rect = containerEl.getBoundingClientRect();
  const pixelRatio = Math.max(2, Math.floor(window.devicePixelRatio || 1));
  const dataUrl = await toPng(containerEl, {
    pixelRatio,
    backgroundColor: '#ffffff',
    cacheBust: true,
    style: { transform: 'none' },
  });
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const imgW = img.naturalWidth || Math.round(rect.width * pixelRatio);
  const imgH = img.naturalHeight || Math.round(rect.height * pixelRatio);
  const orientation = imgW > imgH ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const ratio = imgW / imgH;
  let targetW = availW;
  let targetH = targetW / ratio;
  if (targetH > availH) {
    targetH = availH;
    targetW = targetH * ratio;
  }
  const x = (pageW - targetW) / 2;
  const y = (pageH - targetH) / 2;
  doc.addImage(dataUrl, 'PNG', x, y, targetW, targetH, undefined, 'FAST');
  doc.save(fileName);
}

