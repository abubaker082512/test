import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { image, filename } = req.body || {};

    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Match base64 data URL e.g. "data:image/png;base64,iVBORw0KGgo..."
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else ext = 'jpg';

      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // Raw base64 string
      buffer = Buffer.from(image, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid image buffer' });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/receipts/${uniqueName}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
      size: buffer.length
    });
  } catch (error) {
    console.error('Receipt upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to save receipt image' });
  }
}
