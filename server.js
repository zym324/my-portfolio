'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.createHash('sha256').update('portfolio-' + ADMIN_PASSWORD).digest('hex');
const TOKEN_TTL = 24 * 60 * 60 * 1000;

// 可选：保存后自动同步到 GitHub 仓库（更新 GitHub Pages）
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_REPO = process.env.GH_REPO || 'zym324/my-portfolio';
const GH_PATH = process.env.GH_PATH || 'content.json';
const GH_BRANCH = process.env.GH_BRANCH || 'main';

const ROOT = __dirname;
const CONTENT_FILE = path.join(ROOT, 'content.json');
const DATA_DIR = path.join(ROOT, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
};

// ---------- 鉴权 ----------
function base64url(str) {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(str, 'base64').toString('utf8');
}

function createToken() {
    const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL });
    const enc = base64url(payload);
    const sig = crypto.createHmac('sha256', AUTH_SECRET).update(enc).digest('base64url');
    return enc + '.' + sig;
}

function verifyToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [enc, sig] = parts;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(enc).digest('base64url');
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    try {
        const payload = JSON.parse(fromBase64url(enc));
        return payload.exp > Date.now();
    } catch {
        return false;
    }
}

function isAuthorized(req) {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    return verifyToken(token);
}

// ---------- 工具 ----------
function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > 2 * 1024 * 1024) {
                reject(new Error('请求体过大'));
                req.destroy();
                return;
            }
            raw += chunk;
        });
        req.on('end', () => {
            try {
                resolve(raw ? JSON.parse(raw) : {});
            } catch {
                reject(new Error('JSON 格式错误'));
            }
        });
        req.on('error', reject);
    });
}

function readContent() {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function writeContent(data) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ---------- GitHub 同步 ----------
async function syncToGitHub(commitMessage) {
    if (!GH_TOKEN) return { skipped: true, reason: '未配置 GH_TOKEN' };

    const apiBase = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`;
    const headers = {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-backend'
    };

    const getRes = await fetch(`${apiBase}?ref=${GH_BRANCH}`, { headers });
    if (!getRes.ok && getRes.status !== 404) {
        throw new Error(`获取远程文件失败: ${getRes.status}`);
    }
    const existing = getRes.ok ? await getRes.json() : null;

    const content = fs.readFileSync(CONTENT_FILE);
    const body = {
        message: commitMessage || '更新网站内容',
        content: content.toString('base64'),
        branch: GH_BRANCH
    };
    if (existing && existing.sha) body.sha = existing.sha;

    const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const result = await putRes.json();
    if (!putRes.ok) throw new Error(result.message || `提交失败: ${putRes.status}`);
    return { ok: true, commit: result.commit && result.commit.sha };
}

// ---------- 静态文件 ----------
function serveStatic(req, res, urlPath) {
    const decoded = decodeURIComponent(urlPath.split('?')[0]);
    let rel = decoded.replace(/^[/\\]+/, '');
    if (rel === '') rel = 'index.html';

    const filePath = path.join(ROOT, rel);

    // 禁止越权访问目录外文件、data 目录与敏感文件
    if (!filePath.startsWith(ROOT + path.sep) ||
        filePath.startsWith(DATA_DIR + path.sep) ||
        /\.(env|log)$/i.test(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=3600'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];

    try {
        // 登录
        if (urlPath === '/api/login' && req.method === 'POST') {
            const body = await readBody(req);
            if (body.password !== ADMIN_PASSWORD) {
                sendJson(res, 401, { error: '密码错误' });
                return;
            }
            sendJson(res, 200, { token: createToken() });
            return;
        }

        // 读取内容（公开）
        if (urlPath === '/api/content' && req.method === 'GET') {
            sendJson(res, 200, readContent());
            return;
        }

        // 保存内容（需登录）
        if (urlPath === '/api/content' && (req.method === 'PUT' || req.method === 'POST')) {
            if (!isAuthorized(req)) {
                sendJson(res, 401, { error: '未登录或登录已过期' });
                return;
            }
            const body = await readBody(req);
            if (!body || typeof body !== 'object' || !body.profile) {
                sendJson(res, 400, { error: '内容格式不正确：缺少 profile' });
                return;
            }
            writeContent(body);
            sendJson(res, 200, { ok: true });
            return;
        }

        // 同步到 GitHub（需登录）
        if (urlPath === '/api/sync' && req.method === 'POST') {
            if (!isAuthorized(req)) {
                sendJson(res, 401, { error: '未登录或登录已过期' });
                return;
            }
            const result = await syncToGitHub();
            sendJson(res, 200, result);
            return;
        }

        // 留言提交
        if (urlPath === '/api/message' && req.method === 'POST') {
            const body = await readBody(req);
            if (!body.name || !body.email || !body.message) {
                sendJson(res, 400, { error: '请填写完整信息' });
                return;
            }
            fs.mkdirSync(DATA_DIR, { recursive: true });
            const list = fs.existsSync(MESSAGES_FILE)
                ? JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'))
                : [];
            list.push({ ...body, at: new Date().toISOString() });
            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2), 'utf8');
            sendJson(res, 200, { ok: true });
            return;
        }

        // 管理后台入口
        if (urlPath === '/admin' || urlPath === '/admin/') {
            serveStatic(req, res, '/admin.html');
            return;
        }

        // 其他静态资源
        if (req.method === 'GET' || req.method === 'HEAD') {
            serveStatic(req, res, urlPath);
            return;
        }

        res.writeHead(405);
        res.end('Method Not Allowed');
    } catch (err) {
        sendJson(res, 500, { error: err.message || '服务器内部错误' });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`管理后台: http://localhost:${PORT}/admin`);
});
