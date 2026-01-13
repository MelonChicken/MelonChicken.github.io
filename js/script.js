// 1. Projects Data Structure (Including EN translations)
const projects = [
    {
        name: "똑똑목욕 (Smart Bath)",
        name_en: "Smart Bath",
        status: "Done",
        description: "방문목욕 정보 탐색 시간·정신적 부담 해소를 위한 통합정보 플랫폼 구축",
        description_en: "Integrated platform for visiting bath services to reduce information search time and mental burden",
        tags: ["React", "TypeScript", "Firebase"],
        link: "https://www.notion.so/ml-c/22614b84a0f28067ab39ea95cbb8b546",
        icon: "fas fa-bath"
    },
    {
        name: "ITM Notification",
        name_en: "ITM Notification",
        status: "Done",
        description: "학교 공지를 실시간으로 알려주는 디스코드 알림봇",
        description_en: "Discord bot that provides real-time school announcements",
        tags: ["Python", "FastAPI", "Discord API"],
        link: "https://github.com/MelonChicken/NotificationChecker",
        icon: "fas fa-bell"
    },
    {
        name: "NewsBoy (뉴스보이)",
        name_en: "Newsboy",
        status: "Done",
        description: "인터넷 커뮤니티 동향 파악을 위한 워드클라우드 서비스",
        description_en: "Word cloud service to grasp internet community trends at a glance",
        tags: ["Python", "Selenium", "NLP"],
        link: "https://www.notion.so/ml-c/NewsBoy-26214b84a0f280f09fd7fcba37b2da29",
        icon: "fas fa-newspaper"
    },
    {
        name: "HaBi",
        name_en: "HaBi",
        status: "Archived",
        description: "파편화된 일정을 한곳에서 모아보는 통합 일정 관리 서비스",
        description_en: "Integrated schedule management service gathering fragmented schedules",
        tags: ["Flutter", "FastAPI"],
        link: "https://www.notion.so/ml-c/HaBi-26014b84a0f28059a59ae1b158f2ae96",
        icon: "fas fa-calendar-check"
    },
    {
        name: "WeatherCall119",
        name_en: "WeatherCall119",
        status: "Done",
        description: "기상 데이터를 활용한 지역별 119 신고 건수 예측",
        description_en: "Predicting 119 calls by region using weather data",
        tags: ["Python", "scikit-learn", "pandas"],
        link: "https://www.notion.so/ml-c/WeatherCall119-25f14b84a0f280158651dcb937391df5",
        icon: "fas fa-cloud-sun-rain"
    },
    {
        name: "OPOMO",
        name_en: "OPOMO",
        status: "Done",
        description: "인생네컷 포즈 고민 해결을 위한 포즈 수집 및 추천 서비스",
        description_en: "Pose collection and recommendation service for photo booths",
        tags: ["Vanilla JS", "Firebase", "Flutter"],
        link: "https://www.notion.so/ml-c/OPOMO-26314b84a0f280628145f5ce2e296cf3",
        icon: "fas fa-camera"
    },
    {
        name: "GovPulse",
        name_en: "GovPulse",
        status: "Done",
        description: "정부 서버 복구 현황을 실시간으로 시각화하여 확인하는 툴",
        description_en: "Tool to visualize real-time government server recovery status",
        tags: ["FastAPI", "Python"],
        link: "https://govpulse.onrender.com/",
        icon: "fas fa-server"
    },
    {
        name: "F1 QNA Bot",
        name_en: "F1 QNA Bot",
        status: "Developing",
        description: "F1 관련 데이터를 기반으로 한 Q&A 챗봇",
        description_en: "Q&A Chatbot based on F1 data",
        tags: ["Python", "LLM"],
        link: "https://www.notion.so/ml-c/F1-QNA-Bot-2ae14b84a0f28020a0bef59f2736f4d0",
        icon: "fas fa-robot"
    },
    {
        name: "쇼츠 자동화",
        name_en: "Shorts Automation",
        status: "Planning",
        description: "반려견 정보를 기반으로 쇼츠 영상을 자동 생성 및 업로드",
        description_en: "System to automatically generate and upload shorts videos based on pet info",
        tags: ["n8n", "Python", "AI", "GPT"],
        link: "https://www.notion.so/ml-c/2d714b84a0f28026b5e6d51694b2805e",
        icon: "fas fa-video"
    }
];

// Language State
let currentLang = 'ko'; // 'ko' or 'en'

// 2. Render Projects
const projectsContainer = document.getElementById('projects-track');

function renderProjects() {
    projectsContainer.innerHTML = projects.map(project => {
        const statusClass = `status-${project.status.toLowerCase()}`;
        const name = currentLang === 'ko' ? project.name : project.name_en;
        const desc = currentLang === 'ko' ? project.description : project.description_en;

        return `
    <div class="project-card">
        <span class="status-badge ${statusClass}">${project.status}</span>
        <div class="project-img">
            <i class="${project.icon}"></i>
        </div>
        <div class="project-info">
            <h3 class="project-title">${name}</h3>
            <p class="project-desc">${desc}</p>
            
            <div class="tech-tags">
                ${project.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
            </div>
            
            <a href="${project.link}" class="project-link" target="_blank">
                View Details <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    </div>
`}).join('');
}

renderProjects();

// Carousel Navigation
const track = document.getElementById('projects-track');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Scroll amount = card width + gap (approx 350 + 32)
const scrollAmount = 382;

prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});

nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

// 3. Language Switching Logic
const langToggle = document.getElementById('langToggle');
const langText = document.getElementById('langText');
const translatableElements = document.querySelectorAll('[data-en]');

langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    langText.textContent = currentLang === 'ko' ? 'EN' : 'KO'; // Button shows what to switch TO

    updateLanguage();
});

function updateLanguage() {
    // Update static text
    translatableElements.forEach(el => {
        el.innerHTML = el.getAttribute(`data-${currentLang}`);
    });

    // Re-render projects
    renderProjects();
}

// 4. Scroll Progress
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    document.getElementById('scrollProgress').style.width = scrollPercent + '%';
});

// 5. Smooth Scroll & Navbar Active State
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Update active nav link
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 150) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// 6. Premium Timeline Animations & Physics

// A. Dynamic Line Drawing (Scroll Triggered)
const timelineSection = document.getElementById('timeline');
const timelineLine = document.getElementById('timeline-line-progress');
const timelineContainer = document.getElementById('timeline-container');

window.addEventListener('scroll', () => {
    if (!timelineSection || !timelineLine) return;

    const rect = timelineContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Start drawing when the container enters viewport
    if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
        const totalHeight = rect.height;
        const visibleHeight = Math.min(totalHeight, windowHeight * 0.8 - rect.top);
        const progress = Math.max(0, (visibleHeight / totalHeight) * 100);

        // Clamp between 0 and 100
        timelineLine.style.height = `${Math.min(100, Math.max(0, progress + 20))}%`; // +20% buffer for visual flow
    }
});

// B. 3D Tilt Effect (Mouse Physics)
const tiltCards = document.querySelectorAll('.tilt-card');

tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation based on cursor position relative to center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;

        // Dynamic Glow Effect
        const mouseX = ((x / rect.width) * 100);
        const mouseY = ((y / rect.height) * 100);
        card.style.boxShadow = `${(centerX - x) / 10}px ${(centerY - y) / 10}px 30px rgba(52, 211, 241, 0.2)`;
        card.style.borderTop = `1px solid rgba(255, 255, 255, ${0.1 + (y / rect.height) * 0.4})`;
    });

    card.addEventListener('mouseleave', () => {
        // Elastic Reset
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        card.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        card.style.borderTop = '1px solid rgba(255, 255, 255, 0.15)';
    });
});

// C. Scroll Observer for Floating Nodes (Elastic Entry)
const timelineObserverOptions = {
    threshold: 0.2,
    rootMargin: "0px"
};

const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stop observing once visible to keep animation "played"
            timelineObserver.unobserve(entry.target);
        }
    });
}, timelineObserverOptions);

document.querySelectorAll('.timeline-item').forEach(el => timelineObserver.observe(el));

// Reuse existing observer for other elements
const generalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Apply standard fade-up for non-timeline items
            if (!entry.target.classList.contains('timeline-item')) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                generalObserver.unobserve(entry.target);
            }
        }
    });
}, { threshold: 0.1 });

// Animate other elements
document.querySelectorAll('.skill-item, .tech-card, .project-card, .info-card, .contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    generalObserver.observe(el);
});
