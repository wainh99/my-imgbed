// 处理图片上传的接口
export async function onRequestPost(context) {
  const { request, env } = context;

  // 验证请求类型
  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: '仅支持表单上传' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("file");

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: '请选择图片文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 先校验关键变量是否存在（新增：修复 undefined 报错）
    if (!env.MY_IMG_BED || !env.PUBLIC_R2_URL) {
      return new Response(JSON.stringify({ error: 'R2 配置错误，请检查绑定和环境变量' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploaded = [];
    // 遍历上传文件
    for (const file of files) {
      // 新增：空值校验 + 更宽松的图片判断
      if (!file || !file.name || !file.type) continue;
      // 校验图片类型（增加空值保护）
      if (!file.type.startsWith('image/')) continue;
      
      // 生成唯一文件名（避免重复）
      const fileName = file.name.replace(/[^a-zA-Z0-9_\.\-]/g, ''); // 过滤特殊字符
      const key = `uploads/${Date.now()}-${fileName}`;
      // 上传到 R2
      await env.MY_IMG_BED.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { originalName: file.name }
      });
      // 拼接访问链接
      uploaded.push({
        name: file.name,
        url: `${env.PUBLIC_R2_URL}/${key}`
      });
    }

    return new Response(JSON.stringify({ success: true, data: uploaded }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // 允许跨域（自用场景）
      }
    });
  } catch (error) {
    // 新增：打印详细错误（方便排查）
    console.error('上传接口错误：', error);
    return new Response(JSON.stringify({ error: '上传失败：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
