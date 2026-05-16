// functions/media/[[path]].js
export async function onRequest(context) {
  // 从 URL 中提取 /media/ 后面的部分，例如 /media/cat.jpg → cat.jpg
  const url = new URL(context.request.url);
  const key = url.pathname.replace('/media/', '');

  if (!key) {
    return new Response('请指定文件路径', { status: 400 });
  }

  // 使用绑定好的 R2 桶
  const bucket = context.env.ceshi;

  try {
    // 从 R2 获取对象
    const object = await bucket.get(key);
    if (object === null) {
      return new Response('文件未找到', { status: 404 });
    }

    // 设置响应头（根据需要可自定义 Content-Type）
    const headers = new Headers();
    object.writeHttpMetadata(headers); // 自动写入 etag, content-type 等
    headers.set('Cache-Control', 'public, max-age=604800'); // 缓存一周

    return new Response(object.body, { headers });
  } catch (e) {
    return new Response('读取文件出错', { status: 500 });
  }
}
