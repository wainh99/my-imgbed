// 删除图片接口
export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. 校验R2配置
  if (!env.MY_IMG_BED || !env.PUBLIC_R2_URL) {
    return new Response(JSON.stringify({ error: 'R2 配置错误，请检查绑定和环境变量' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. 获取要删除的图片key
    const data = await request.json();
    const { key } = data;

// 先去掉key开头的/，再校验
const cleanKey = key.startsWith('/') ? key.slice(1) : key;
if (!cleanKey || !cleanKey.startsWith('uploads/')) {
  return new Response(JSON.stringify({ error: `无效的图片路径（仅支持删除uploads/前缀的文件），当前key：${cleanKey}` }), {
    status: 400,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
// 后续删除用 cleanKey
await env.MY_IMG_BED.delete(cleanKey);

    // 3. 删除R2中的图片
    await env.MY_IMG_BED.delete(key);

    return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('删除图片错误：', error);
    return new Response(JSON.stringify({ error: '删除失败：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
