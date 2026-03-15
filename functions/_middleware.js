// 全局密码验证中间件
export async function onRequest(context) {
  const { request, next, env } = context;

  // 从环境变量获取密码（未配置则不验证）
  const PASSWORD = env.IMG_BED_PASSWORD;
  if (!PASSWORD) {
    return next(); // 未配置密码，直接放行
  }

  // 1. 从 Cookie 读取已验证的标识
  const cookieHeader = request.headers.get('Cookie') || '';
  const isVerified = cookieHeader.includes(`img_bed_verified=${PASSWORD}`);

  // 2. 如果已验证，直接放行
  if (isVerified) {
    return next();
  }

  // 3. 如果是接口请求（上传/列表），直接返回未授权
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: '请先输入访问密码' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. 如果是页面请求，返回密码输入页面
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>请输入访问密码</title>
      <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8f9fa; font-family: "Microsoft Yahei"; }
        .password-box { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; width: 300px; }
        h1 { font-size: 1.5rem; color: #333; margin-bottom: 1rem; }
        input { width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
        button { width: 100%; padding: 0.75rem; background: #0d6efd; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
        button:hover { background: #0b5ed7; }
        .error { color: #dc3545; margin-top: 1rem; display: none; }
      </style>
    </head>
    <body>
      <div class="password-box">
        <h1>极简 R2 图床</h1>
        <input type="password" id="passwordInput" placeholder="请输入访问密码">
        <button onclick="verifyPassword()">确认访问</button>
        <div class="error" id="errorTip">密码错误，请重试</div>
      </div>

      <script>
        async function verifyPassword() {
          const password = document.getElementById('passwordInput').value.trim();
          const errorTip = document.getElementById('errorTip');
          
          if (!password) {
            errorTip.textContent = '请输入密码';
            errorTip.style.display = 'block';
            return;
          }

          // 验证密码（跳转到当前页面，携带密码参数）
          const url = new URL(window.location);
          url.searchParams.set('pwd', password);
          window.location.href = url.href;
        }
      </script>
    </body>
    </html>
  `;

  // 4. 检查 URL 参数中的密码是否正确
  const inputPassword = url.searchParams.get('pwd');
  if (inputPassword === PASSWORD) {
    // 密码正确 → 设置 Cookie（有效期7天），并重定向到首页（清除密码参数）
    const response = new Response('', {
      status: 302,
      headers: {
        'Location': url.pathname, // 重定向到原页面（去掉参数）
        'Set-Cookie': `img_bed_verified=${PASSWORD}; Path=/; Max-Age=604800; Secure`,// 7天有效期，仅HTTPS
      }
    });
    return response;
  }

  // 5. 未验证 → 返回密码输入页面
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
