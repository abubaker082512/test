import fs from 'fs';
import path from 'path';
import { supabase } from '../../../utils/supabaseClient';

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
    let contentType = 'image/jpeg';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';
      else ext = 'jpg';

      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid image buffer' });
    }

    const uniqueName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // 1. Primary (Serverless-safe): Upload to Supabase Storage 'receipts' bucket
    try {
      const storagePath = `deposits/${uniqueName}`;
      let { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadErr && uploadErr.message && uploadErr.message.toLowerCase().includes('not found')) {
        // Auto-create public bucket if it doesn't exist yet
        await supabase.storage.createBucket('receipts', { public: true }).catch(() => {});
        const retry = await supabase.storage
          .from('receipts')
          .upload(storagePath, buffer, { contentType, upsert: false });
        uploadErr = retry.error;
      }

      if (!uploadErr) {
        const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          return res.status(200).json({
            success: true,
            url: pubData.publicUrl,
            filename: uniqueName,
            size: buffer.length,
            storage: 'supabase'
          });
        }
      }
    } catch (storageErr) {
      console.warn('Supabase receipt storage fallback triggered:', storageErr.message);
    }

    // 2. Local dev fallback (never attempt disk write on Vercel read-only filesystem)
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);
        return res.status(200).json({
          success: true,
          url: `/uploads/receipts/${uniqueName}`,
          filename: uniqueName,
          size: buffer.length,
          storage: 'local'
        });
      } catch (diskErr) {
        console.warn('Local disk receipt fallback failed:', diskErr.message);
      }
    }

    // 3. Guaranteed serverless fallback: inline Data URL so receipt always renders in Admin
    const dataUrl = matches ? image : `data:${contentType};base64,${buffer.toString('base64')}`;
    return res.status(200).json({
      success: true,
      url: dataUrl,
      filename: uniqueName,
      size: buffer.length,
      storage: 'inline'
    });
  } catch (error) {
    console.error('Receipt upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to save receipt image' });
  }
}
