// ============ 社交图标 ============
const SOCIAL_ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M22 6l-10 7L2 6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>'
};

const CONTACT_ICONS = { email: '📧', location: '📍', status: '💼' };

// ============ 渲染函数 ============
function renderProfile(p) {
    document.getElementById('heroGreeting').textContent = p.greeting || '';
    document.getElementById('heroName').textContent = p.name || '';
    document.getElementById('heroSubtitle').textContent = p.subtitle || '';
    document.getElementById('heroDescription').textContent = p.description || '';

    const avatar = document.getElementById('heroAvatar');
    if (p.avatar) { avatar.src = p.avatar; }
    avatar.alt = p.avatarAlt || '头像';

    const aboutImg = document.getElementById('aboutImage');
    if (p.aboutImage) { aboutImg.src = p.aboutImage; }

    document.getElementById('aboutText').innerHTML = (p.about || [])
        .map(t => `<p>${escapeHtml(t)}</p>`).join('');

    document.getElementById('aboutStats').innerHTML = (p.stats || [])
        .map(s => `<div class="stat-item"><span class="stat-number">${escapeHtml(s.number)}</span><span class="stat-label">${escapeHtml(s.label)}</span></div>`)
        .join('');

    document.getElementById('heroSocials').innerHTML = (p.socials || [])
        .map(s => {
            const icon = SOCIAL_ICONS[s.icon] || SOCIAL_ICONS.link;
            return `<a href="${escapeAttr(s.url || '#')}" class="social-link" aria-label="${escapeAttr(s.name)}" target="_blank" rel="noopener">${icon}</a>`;
        }).join('');

    document.getElementById('footerName').textContent = p.name || 'Portfolio';
    document.title = (p.name ? p.name + ' | 个人主页' : '个人展示网站 | Portfolio');

    // 后台管理入口（地址可在 content.json 的 profile.adminUrl 配置）
    if (p.adminUrl) {
        ['navAdminLink', 'footerAdminLink'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.href = p.adminUrl; el.hidden = false; }
        });
    }
}

function renderContact(c) {
    const rows = [
        { key: 'email', label: '邮箱' },
        { key: 'location', label: '位置' },
        { key: 'status', label: '工作状态' }
    ];
    document.getElementById('contactInfo').innerHTML = rows.map(r => `
        <div class="contact-item">
            <div class="contact-icon">${CONTACT_ICONS[r.key]}</div>
            <div>
                <h4>${r.label}</h4>
                <p>${escapeHtml(c[r.key] || '')}</p>
            </div>
        </div>`).join('');
}

function renderSkills(skills) {
    document.getElementById('skillsContainer').innerHTML = (skills || []).map(cat => `
        <div class="skills-category">
            <h3 class="category-title">${escapeHtml(cat.category)}</h3>
            <div class="skills-grid">
                ${(cat.items || []).map(item => `
                    <div class="skill-card">
                        <div class="skill-icon">${escapeHtml(item.icon || '')}</div>
                        <h4>${escapeHtml(item.name)}</h4>
                        <div class="skill-bar">
                            <div class="skill-progress" data-progress="${Number(item.level) || 0}"></div>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`).join('');
}

function renderProjects(projects) {
    document.getElementById('projectsContainer').innerHTML = (projects || []).map(p => `
        <div class="project-card">
            <div class="project-image">
                <img src="${escapeAttr(p.image || '')}" alt="${escapeAttr(p.title)}">
                <div class="project-overlay">
                    <a href="${escapeAttr(p.link || '#')}" class="project-link">查看详情</a>
                </div>
            </div>
            <div class="project-info">
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.description || '')}</p>
                <div class="project-tags">
                    ${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>
        </div>`).join('');
}

function renderPosts(posts) {
    document.getElementById('blogContainer').innerHTML = (posts || []).map(p => `
        <article class="blog-card">
            <div class="blog-image">
                <img src="${escapeAttr(p.image || '')}" alt="${escapeAttr(p.title)}">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-date">${escapeHtml(p.date || '')}</span>
                    <span class="blog-category">${escapeHtml(p.category || '')}</span>
                </div>
                <h3 class="blog-title">${escapeHtml(p.title)}</h3>
                <p class="blog-excerpt">${escapeHtml(p.excerpt || '')}</p>
                <a href="${escapeAttr(p.link || '#')}" class="read-more">阅读全文 →</a>
            </div>
        </article>`).join('');
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str) {
    return escapeHtml(str);
}

// ============ 加载内容 ============
async function fetchContent() {
    // 有后端时优先走接口（读取 GitHub 中的最新内容）
    try {
        const api = await fetch('api/content?t=' + Date.now());
        if (api.ok) {
            const data = await api.json();
            if (data && data.profile) return data;
        }
    } catch { /* 无后端（如 GitHub Pages），走静态文件 */ }

    const res = await fetch('content.json?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

async function loadContent() {
    try {
        const data = await fetchContent();

        renderProfile(data.profile || {});
        renderContact(data.contact || {});
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderPosts(data.posts);

        document.getElementById('footerYear').textContent = new Date().getFullYear();

        initAnimations();
    } catch (err) {
        console.error('内容加载失败:', err);
        document.getElementById('heroName').textContent = '内容加载失败';
        showToast('内容加载失败，请刷新重试', 'error');
    }
}

// ============ 导航栏与交互 ============
function initAnimations() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.getElementById('back-to-top');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    function updateActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const link = document.querySelector(`.nav-link[href="#${section.getAttribute('id')}"]`);
            if (link && scrollY >= top && scrollY < top + height) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        backToTop.classList.toggle('visible', window.scrollY > 500);
        updateActiveLink();
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 滚动进入动画 + 技能进度条
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            if (entry.target.id === 'skills') {
                document.querySelectorAll('.skill-progress').forEach(bar => {
                    bar.style.width = (bar.getAttribute('data-progress') || 0) + '%';
                });
            }
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('section, .skill-card, .project-card, .blog-card, .about-text, .about-image')
        .forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - navbar.offsetHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 联系表单
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            showToast('请填写所有字段', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('请输入有效的邮箱地址', 'error');
            return;
        }
        try {
            const res = await fetch('api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            if (!res.ok) throw new Error('发送失败');
            showToast('消息发送成功！我会尽快回复你。', 'success');
            form.reset();
        } catch (err) {
            showToast('消息发送失败，请稍后再试', 'error');
        }
    });

    updateActiveLink();
}

// ============ Toast 通知 ============
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 12px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', loadContent);
