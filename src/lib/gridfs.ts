import { GridFSBucket, ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { Readable } from 'stream';

const DEFAULT_BUCKET = 'fs';

export async function getGridFSBucket(bucketName: string = DEFAULT_BUCKET): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName });
}

export async function uploadToGridFS(
  filename: string,
  buffer: Buffer,
  bucketName: string = DEFAULT_BUCKET,
  metadata?: any
): Promise<string> {
  const bucket = await getGridFSBucket(bucketName);
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { metadata });
    
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    
    readableStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id.toString()));
  });
}

export async function getStreamFromGridFSByFilename(
  filename: string,
  bucketName: string = DEFAULT_BUCKET
) {
  const bucket = await getGridFSBucket(bucketName);
  const db = await getDb();
  
  const files = await db.collection(`${bucketName}.files`).find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
  
  if (!files || files.length === 0) {
    return null;
  }
  
  const file = files[0];
  const stream = bucket.openDownloadStreamByName(filename);
  
  return {
    stream,
    contentType: file.metadata?.contentType || 'application/octet-stream',
    length: file.length
  };
}

export function nodeToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    }
  });
}
