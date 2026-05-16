export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const filePath = url.pathname.replace('/media/', '');
  
  if (!filePath) {
    return new Response('请指定文件路径', { status: 400 });
  }
  
  try {
    const object = await env.my-assetsT.get(filePath);
    if (!object) {
      return new Response('文件不存在', { status: 404 });
    }
    return new Response(object.body, {
      headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream' }
    });
  } catch (error) {
    return new Response('读取文件失败: ' + error.message, { status: 500 });
  }
}
