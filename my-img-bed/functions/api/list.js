// 获取所有图片列表的接口
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 列出 R2 中 uploads 前缀下的所有文件
    const list = await env.MY_IMG_BED.list({ 
      prefix: "uploads/",
      limit: 1000 // 最多显示1000张（可调整）
    });

    // 格式化返回数据（按上传时间倒序）
    const images = list.objects.map(obj => ({
      name: obj.customMetadata?.originalName || obj.key.split("/").pop(),
      url: `${env.PUBLIC_R2_URL}/${obj.key}`,
      size: (obj.size / 1024).toFixed(2) + 'KB', // 转换为KB显示
      uploaded: new Date(obj.uploaded).toLocaleString() // 格式化时间
    })).sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    return new Response(JSON.stringify({ success: true, data: images }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '获取列表失败：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
