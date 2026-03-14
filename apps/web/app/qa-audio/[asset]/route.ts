import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QA_AUDIO_DIR = resolve(process.cwd(), '../../qa/assets/audio');

const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function isQaAudioEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.TEMPO_TUNE_ENABLE_QA_ASSETS === '1'
  );
}

function isSafeAssetName(asset: string): boolean {
  return (
    asset.length > 0 &&
    !asset.includes('..') &&
    !asset.includes('/') &&
    !asset.includes('\\')
  );
}

export async function GET(
  _request: Request,
  context: {params: Promise<{asset: string}>},
): Promise<Response> {
  if (!isQaAudioEnabled()) {
    return new Response('Not Found', {status: 404});
  }

  const {asset} = await context.params;
  if (!isSafeAssetName(asset)) {
    return new Response('Not Found', {status: 404});
  }

  const ext = extname(asset).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response('Not Found', {status: 404});
  }

  try {
    const filePath = resolve(QA_AUDIO_DIR, asset);
    const body = await readFile(filePath);

    return new Response(body, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': contentType,
      },
    });
  } catch {
    return new Response('Not Found', {status: 404});
  }
}
