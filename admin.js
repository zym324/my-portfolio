// ================= 管理后台逻辑 =================
const API = '';
const TOKEN_KEY = 'portfolio_admin_token';
let state = null;

// ---------- 工具 ----------
function $(id) { return document.getElementById(id); }

function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        const nextIsIndex = /^\d+$/.test(keys[i + 1]);
        if (cur[k] == null) cur[k] = nextIsIndex ? [] : {};
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
}

function esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setStatus(text, type) {
    const el = $('statusText');
    el.textContent = text;
    el.className = 'status-text' + (type ? ' ' + type : '');
    if (type === 'ok') {
        setTimeout(() => { el.textContent = ''; el.className = 'status-text'; }, 3000);
    }
}

async function api(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(API + path, { ...options, headers });
    let data = null;
    try { data = await res.json(); } catch { }
    if (!res.ok) throw new Error((data && data.error) || ('请求失败 ' + res.status));
    return data;
}

// ---------- 表单控件 ----------
function field(label, path, value, type = 'text', extra = '') {
    const common = `data-path="${path}" data-type="${type}" ${extra}`;
    if (type === 'textarea') {
        return `<div class="field"><label>${label}</label>
            <textarea ${common}>${esc(value)}</textarea></div>`;
    }
    if (type === 'number') {
        return `<div class="field"><label>${label}</label>
            <input type="number" min="0" max="100" value="${esc(value)}" ${common}></div>`;
    }
    return `<div class="field"><label>${label}</label>
        <input type="text" value="${esc(value)}" ${common}></div>`;
}

// ---------- 面板渲染 ----------
function renderProfile() {
    const p = state.profile || {};

    const aboutRows = (p.about || []).map((t, i) => `
        <div class="card">
            <div class="card-head">
                <h3><span class="idx">段落 ${i + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="profile.about.${i}">删除</button>
            </div>
            ${field('内容', `profile.about.${i}`, t, 'textarea')}
        </div>`).join('');

    const statRows = (p.stats || []).map((s, i) => `
        <div class="card">
            <div class="card-head">
                <h3><span class="idx">统计 ${i + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="profile.stats.${i}">删除</button>
            </div>
            <div class="grid-2">
                ${field('数值', `profile.stats.${i}.number`, s.number)}
                ${field('说明', `profile.stats.${i}.label`, s.label)}
            </div>
        </div>`).join('');

    const socialRows = (p.socials || []).map((s, i) => `
        <div class="card">
            <div class="card-head">
                <h3><span class="idx">社交 ${i + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="profile.socials.${i}">删除</button>
            </div>
            <div class="grid-2">
                ${field('名称', `profile.socials.${i}.name`, s.name)}
                ${field('链接', `profile.socials.${i}.url`, s.url)}
            </div>
            <div class="field">
                <label>图标</label>
                <select data-path="profile.socials.${i}.icon" data-type="text">
                    ${['github', 'linkedin', 'twitter', 'email', 'link']
                        .map(k => `<option value="${k}" ${s.icon === k ? 'selected' : ''}>${k}</option>`).join('')}
                </select>
            </div>
        </div>`).join('');

    $('panelProfile').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>基本信息</h3></div>
            <div class="grid-2">
                ${field('问候语', 'profile.greeting', p.greeting)}
                ${field('姓名', 'profile.name', p.name)}
            </div>
            ${field('头衔 / 副标题', 'profile.subtitle', p.subtitle)}
            ${field('一句话简介', 'profile.description', p.description, 'textarea')}
            <div class="grid-2">
                ${field('头像图片地址', 'profile.avatar', p.avatar)}
                ${field('头像 alt 文本', 'profile.avatarAlt', p.avatarAlt)}
            </div>
            ${field('关于我配图地址', 'profile.aboutImage', p.aboutImage)}
            ${p.avatar ? `<img class="thumb" src="${esc(p.avatar)}" alt="头像预览">` : ''}
        </div>

        <div class="card">
            <div class="card-head"><h3>关于我 - 段落</h3></div>
            ${aboutRows || '<p style="color:var(--text-muted);font-size:.85rem">暂无段落</p>'}
            <button class="btn-add" data-action="add-about">+ 添加段落</button>
        </div>

        <div class="card">
            <div class="card-head"><h3>数据统计</h3></div>
            ${statRows || '<p style="color:var(--text-muted);font-size:.85rem">暂无统计项</p>'}
            <button class="btn-add" data-action="add-stat">+ 添加统计项</button>
        </div>

        <div class="card">
            <div class="card-head"><h3>社交链接</h3></div>
            ${socialRows || '<p style="color:var(--text-muted);font-size:.85rem">暂无社交链接</p>'}
            <button class="btn-add" data-action="add-social">+ 添加社交链接</button>
        </div>`;
}

function renderSkills() {
    const cats = state.skills || [];
    const html = cats.map((cat, ci) => {
        const items = (cat.items || []).map((it, ii) => `
            <div class="sub-block">
                <div class="grid-2">
                    ${field('技能名称', `skills.${ci}.items.${ii}.name`, it.name)}
                    ${field('图标（emoji）', `skills.${ci}.items.${ii}.icon`, it.icon)}
                </div>
                ${field('熟练度 0-100', `skills.${ci}.items.${ii}.level`, it.level, 'number')}
                <button class="btn btn-danger btn-sm" data-action="del" data-path="skills.${ci}.items.${ii}">删除该技能</button>
            </div>`).join('');

        return `<div class="card">
            <div class="card-head">
                <h3><span class="idx">分类 ${ci + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="skills.${ci}">删除分类</button>
            </div>
            ${field('分类名称', `skills.${ci}.category`, cat.category)}
            ${items}
            <button class="btn-add" data-action="add-skill-item" data-index="${ci}">+ 添加技能</button>
        </div>`;
    }).join('');

    $('panelSkills').innerHTML = html + `<button class="btn-add" data-action="add-skill-cat">+ 添加技能分类</button>`;
}

function renderProjects() {
    const list = state.projects || [];
    const html = list.map((p, i) => `
        <div class="card">
            <div class="card-head">
                <h3><span class="idx">项目 ${i + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="projects.${i}">删除</button>
            </div>
            ${field('标题', `projects.${i}.title`, p.title)}
            ${field('描述', `projects.${i}.description`, p.description, 'textarea')}
            ${field('封面图片地址', `projects.${i}.image`, p.image)}
            ${field('技术标签（英文逗号分隔）', `projects.${i}.tags`, (p.tags || []).join(', '), 'tags')}
            ${field('详情链接', `projects.${i}.link`, p.link)}
            ${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="预览">` : ''}
        </div>`).join('');

    $('panelProjects').innerHTML = html + `<button class="btn-add" data-action="add-project">+ 添加项目</button>`;
}

function renderPosts() {
    const list = state.posts || [];
    const html = list.map((p, i) => `
        <div class="card">
            <div class="card-head">
                <h3><span class="idx">文章 ${i + 1}</span></h3>
                <button class="btn btn-danger btn-sm" data-action="del" data-path="posts.${i}">删除</button>
            </div>
            ${field('标题', `posts.${i}.title`, p.title)}
            ${field('摘要', `posts.${i}.excerpt`, p.excerpt, 'textarea')}
            <div class="grid-2">
                ${field('日期 (YYYY-MM-DD)', `posts.${i}.date`, p.date)}
                ${field('分类', `posts.${i}.category`, p.category)}
            </div>
            ${field('封面图片地址', `posts.${i}.image`, p.image)}
            ${field('文章链接', `posts.${i}.link`, p.link)}
            ${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="预览">` : ''}
        </div>`).join('');

    $('panelPosts').innerHTML = html + `<button class="btn-add" data-action="add-post">+ 添加文章</button>`;
}

function renderContact() {
    const c = state.contact || {};
    $('panelContact').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>联系信息</h3></div>
            ${field('邮箱', 'contact.email', c.email)}
            ${field('位置', 'contact.location', c.location)}
            ${field('工作状态', 'contact.status', c.status)}
        </div>`;
}

function renderAll() {
    renderProfile();
    renderSkills();
    renderProjects();
    renderPosts();
    renderContact();
}

// ---------- 输入同步 ----------
function bindInputs() {
    document.querySelectorAll('[data-path]').forEach(el => {
        if (el.tagName === 'BUTTON') return;
        const handler = () => {
            const p = el.getAttribute('data-path');
            const type = el.getAttribute('data-type');
            let value = el.value;
            if (type === 'number') value = Number(value) || 0;
            if (type === 'tags') value = value.split(',').map(s => s.trim()).filter(Boolean);
            setPath(state, p, value);
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
}

// ---------- 增删 ----------
function handleAction(action, path, index) {
    const arr = (name) => {
        if (!Array.isArray(state[name])) state[name] = [];
        return state[name];
    };

    if (action === 'del') {
        const keys = path.split('.');
        const prop = keys.pop();
        const parent = getPath(state, keys.join('.'));
        if (prop === 'skills' && index !== undefined) { }
        if (Array.isArray(parent)) parent.splice(Number(prop), 1);
        else if (parent) delete parent[prop];
    }

    if (action === 'add-about') {
        state.profile.about = state.profile.about || [];
        state.profile.about.push('');
    }
    if (action === 'add-stat') {
        state.profile.stats = state.profile.stats || [];
        state.profile.stats.push({ number: '', label: '' });
    }
    if (action === 'add-social') {
        state.profile.socials = state.profile.socials || [];
        state.profile.socials.push({ name: '', url: '', icon: 'link' });
    }
    if (action === 'add-skill-cat') {
        arr('skills').push({ category: '新分类', items: [] });
    }
    if (action === 'add-skill-item') {
        const cat = state.skills[Number(index)];
        if (cat) {
            cat.items = cat.items || [];
            cat.items.push({ name: '', icon: '✨', level: 80 });
        }
    }
    if (action === 'add-project') {
        arr('projects').push({ title: '新项目', description: '', image: '', tags: [], link: '#' });
    }
    if (action === 'add-post') {
        arr('posts').push({ title: '新文章', excerpt: '', date: new Date().toISOString().slice(0, 10), category: '', image: '', link: '#' });
    }

    renderAll();
    bindInputs();
}

// ---------- API 操作 ----------
async function loadContent() {
    try {
        state = await api('/api/content');
        renderAll();
        bindInputs();
    } catch (err) {
        alert('读取内容失败: ' + err.message);
    }
}

async function saveAll() {
    try {
        setStatus('保存中…');
        await api('/api/content', { method: 'PUT', body: JSON.stringify(state) });
        setStatus('已保存，网站已更新 ✓', 'ok');
    } catch (err) {
        if (/未登录|过期/.test(err.message)) {
            logout();
            return;
        }
        setStatus('保存失败：' + err.message, 'err');
    }
}

async function syncGitHub() {
    try {
        setStatus('正在同步到 GitHub Pages…');
        const r = await api('/api/sync', { method: 'POST' });
        if (r.skipped) setStatus('未配置 GH_TOKEN，跳过同步', 'err');
        else setStatus('已同步到 GitHub Pages ✓', 'ok');
    } catch (err) {
        setStatus('同步失败：' + err.message, 'err');
    }
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    $('editorView').hidden = true;
    $('loginView').style.display = 'flex';
    $('password').value = '';
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        $('loginView').style.display = 'none';
        $('editorView').hidden = false;
        loadContent();
    }

    $('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        $('loginError').textContent = '';
        try {
            const r = await api('/api/login', {
                method: 'POST',
                body: JSON.stringify({ password: $('password').value })
            });
            localStorage.setItem(TOKEN_KEY, r.token);
            $('loginView').style.display = 'none';
            $('editorView').hidden = false;
            await loadContent();
        } catch (err) {
            $('loginError').textContent = err.message;
        }
    });

    $('tabBar').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.querySelector(`.panel[data-panel="${tab.dataset.tab}"]`);
        if (panel) panel.classList.add('active');
    });

    $('saveBtn').addEventListener('click', saveAll);
    $('saveBtn2').addEventListener('click', saveAll);
    $('syncBtn').addEventListener('click', syncGitHub);
    $('logoutBtn').addEventListener('click', logout);

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        e.preventDefault();
        handleAction(btn.getAttribute('data-action'), btn.getAttribute('data-path'), btn.getAttribute('data-index'));
    });

    // Ctrl+S 保存
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (state) saveAll();
        }
    });
});
