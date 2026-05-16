// functions/upload-url.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function onRequestGet(context) {
  // 1. 配置 S3 客户端 (R2 兼容 S3 API)
  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${context.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: context.env.R2_ACCESS_KEY_ID,
      secretAccessKey: context.env.R2_SECRET_ACCESS_KEY
    }
  });

  // 2. 获取客户端想上传的文件名和类型，并做安全处理
  const url = new URL(context.request.url);
  // 从查询参数中获取文件名，并进行安全处理，防止路径遍历等攻击
  const rawFileName = url.searchParams.get('filename');
  if (!rawFileName) {
    return new Response('缺少文件名参数', { status: 400 });
  }
  // 只保留文件名，去掉可能的路径部分
  const safeFileName = rawFileName.replace(/^.*[\\\/]/, '');
  // 使用时间戳作为前缀，防止文件重名
  const key = `uploads/${Date.now()}-${safeFileName}`;
  const contentType = url.searchParams.get('contentType') || 'application/octet-stream';

  // 3. 创建上传命令并生成预签名URL
  const command = new PutObjectCommand({
    Bucket: context.env.R2_BUCKET_NAME, // 你的 R2 存储桶名称
    Key: key,
    ContentType: contentType,
  });

  // 生成一个有效期1小时的预签名URL
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  // 将生成的URL返回给浏览器
  return new Response(JSON.stringify({ uploadUrl: signedUrl, key: key }), {
    headers: { 'Content-Type': 'application/json' },
  });
}