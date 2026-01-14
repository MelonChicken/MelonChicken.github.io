const projects = [
    {
        name: "똑똑목욕 (Smart Bath)",
        name_en: "Smart Bath",
        status: "Done",
        description: "방문목욕 정보를 한곳에 모아, 보호자와 이용자가 쉽게 탐색할 수 있도록 만든 서비스입니다.",
        description_en: "Integrated platform for visiting bath services",
        problem_ko: "방문목욕 정보가 파편화되어 탐색이 어렵고 부담이 큼",
        problem_en: "Fragmented information makes finding visiting bath services difficult",
        role_ko: "프론트엔드 개발 및 전체 플랫폼 설계",
        role_en: "Frontend Dev & Platform Architecture",
        result_ko: "정보 탐색 시간 단축 및 사용자 접근성 향상",
        result_en: "Reduced search time and improved accessibility",
        tags: ["React", "TypeScript", "Firebase"],
        link: "https://www.notion.so/ml-c/22614b84a0f28067ab39ea95cbb8b546",
        icon: "fas fa-bath",
        last_used: "2024-06"
    },
    {
        name: "ITM Notification",
        name_en: "ITM Notification",
        status: "Done",
        description: "학교 공지사항을 실시간으로 전달하는 자동 알림 시스템입니다.",
        description_en: "School announcement notification bot",
        problem_ko: "중요한 학교 공지사항을 놓치는 문제 발생",
        problem_en: "Students frequently missed important school announcements",
        role_ko: "Python 봇 개발 및 디스코드 연동",
        role_en: "Python Bot Dev & Discord Integration",
        result_ko: "실시간 알림으로 공지 확인율 증대",
        result_en: "Increased engagement via real-time alerts",
        tags: ["Python", "FastAPI", "Discord API"],
        link: "https://github.com/MelonChicken/NotificationChecker",
        icon: "fas fa-bell",
        last_used: "2024-03"
    },
    {
        name: "NewsBoy (뉴스보이)",
        name_en: "Newsboy",
        status: "Done",
        description: "여러 커뮤니티의 이슈를 수집·분석해 트렌드를 한눈에 보여주는 서비스입니다.",
        description_en: "Word cloud service for community trends",
        problem_ko: "다양한 커뮤니티의 이슈를 한눈에 파악하기 어려움",
        problem_en: "Difficult to grasp trending topics across multiple communities",
        role_ko: "데이터 수집(Crawling) 및 시각화 파이프라인 구축",
        role_en: "Data Crawling & Visualization Pipeline",
        result_ko: "주요 키워드 시각화로 트렌드 파악 효율화",
        result_en: "Efficient trend tracking via keyword visualization",
        tags: ["Python", "Selenium", "NLP"],
        link: "https://www.notion.so/ml-c/NewsBoy-26214b84a0f280f09fd7fcba37b2da29",
        icon: "fas fa-newspaper",
        last_used: "2023-12"
    },
    {
        name: "HaBi",
        name_en: "HaBi",
        status: "Archived",
        description: "여러 앱에 흩어진 일정을 통합하여 관리할 수 있는 서비스 프로토타입입니다.",
        description_en: "Integrated schedule management service",
        problem_ko: "일정이 여러 앱에 파편화되어 관리가 불편함",
        problem_en: "Fragmented schedules across apps made management hard",
        role_ko: "Flutter 앱 개발 및 백엔드 연동",
        role_en: "Flutter App Dev & Backend Integration",
        result_ko: "통합 일정 관리 프로토타입 구현",
        result_en: "Developed integrated schedule management prototype",
        tags: ["Flutter", "FastAPI"],
        link: "https://www.notion.so/ml-c/HaBi-26014b84a0f28059a59ae1b158f2ae96",
        icon: "fas fa-calendar-check",
        last_used: "2023-08"
    },
    {
        name: "WeatherCall119",
        name_en: "WeatherCall119",
        status: "Done",
        description: "기상 데이터와 119 신고 전화의 상관관계를 분석하여 신고 건수를 예측하는 모델입니다.",
        description_en: "Predicting 119 calls using weather data",
        problem_ko: "기상 조건에 따른 신고 건수 예측 필요성",
        problem_en: "Need to predict emergency calls based on weather conditions",
        role_ko: "데이터 전처리 및 머신러닝 모델 학습",
        role_en: "Data Preprocessing & ML Model Training",
        result_ko: "지역별 신고 건수 예측 모델 도출",
        result_en: "Developed regional call volume prediction model",
        tags: ["Python", "scikit-learn"],
        link: "https://www.notion.so/ml-c/WeatherCall119-25f14b84a0f280158651dcb937391df5",
        icon: "fas fa-cloud-sun-rain",
        last_used: "2023-11"
    },
    {
        name: "OPOMO",
        name_en: "OPOMO",
        status: "Done",
        description: "사진 촬영 시 상황에 맞는 최적의 포즈를 추천해주는 모바일 서비스입니다.",
        description_en: "Photo booth pose recommendation service",
        problem_ko: "사진 촬영 시 포즈를 고민하는 사용자의 불편함",
        problem_en: "Users struggle to choose poses for photo booths",
        role_ko: "웹페이지 프레임 구축 및 UI 개발",
        role_en: "Frontend Dev (Vanilla JS + Firebase)",
        result_ko: "다양한 포즈 데이터베이스 구축 및 추천 기능",
        result_en: "Built pose database & recommendation system",
        tags: ["Vanilla JS", "Firebase"],
        link: "https://www.notion.so/ml-c/OPOMO-26314b84a0f280628145f5ce2e296cf3",
        icon: "fas fa-camera",
        last_used: "2024-05"
    },
    {
        name: "GovPulse",
        name_en: "GovPulse",
        status: "Done",
        description: "정부 서버의 장애 발생 및 복구 현황을 실시간으로 시각화하는 대시보드입니다.",
        description_en: "Government server recovery visualization",
        problem_ko: "정부 서버 장애 복구 현황을 확인하기 어려움",
        problem_en: "Hard to track real-time government server recovery status",
        role_ko: "FastAPI 백엔드 및 모니터링 대시보드 개발",
        role_en: "FastAPI Backend & Monitoring Dashboard",
        result_ko: "실시간 서버 상태 시각화 서비스 배포",
        result_en: "Deployed real-time server status visualization",
        tags: ["FastAPI", "Python"],
        link: "https://govpulse.onrender.com/",
        icon: "fas fa-server",
        last_used: "2024-08"
    },
    {
        name: "F1 QNA Bot",
        name_en: "F1 QNA Bot",
        status: "Developing",
        description: "복잡한 F1 규정과 데이터를 RAG 기술을 활용해 쉽게 답변해주는 챗봇입니다.",
        description_en: "F1 Q&A Chatbot",
        problem_ko: "F1 규정 및 데이터를 쉽게 검색하기 어려움",
        problem_en: "Difficult to search complex F1 regulations and data",
        role_ko: "RAG 기반 챗봇 파이프라인 구축",
        role_en: "Built RAG-based Chatbot Pipeline",
        result_ko: "F1 관련 질문에 대한 정확한 답변 제공 (개발중)",
        result_en: "Provides accurate answers to F1 queries (Developing)",
        tags: ["Python", "PyTorch", "LLM"],
        link: "https://www.notion.so/ml-c/F1-QNA-Bot-2ae14b84a0f28020a0bef59f2736f4d0",
        icon: "fas fa-robot",
        last_used: "2024-11"
    },
    {
        name: "Shorts Automation",
        name_en: "Shorts Automation",
        status: "Planning",
        description: "반려견 영상을 자동으로 편집하고 업로드해주는 자동화 워크플로우 툴입니다.",
        description_en: "Automated Shorts Generation",
        problem_ko: "반려견 영상 편집 및 업로드의 번거로움",
        problem_en: "Time-consuming editing/uploading of pet videos",
        role_ko: "영상 생성 및 업로드 자동화 워크플로우 설계",
        role_en: "designed automated video generation workflow",
        result_ko: "기획 단계 (n8n 워크플로우 설계)",
        result_en: "Planning Phase (n8n workflow design)",
        tags: ["n8n", "Python", "AI", "GPT"],
        link: "https://www.notion.so/ml-c/2d714b84a0f28026b5e6d51694b2805e",
        icon: "fas fa-video",
        last_used: "2024-12"
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
        // Fallback to description if specific fields are missing (though we populated them)
        const problem = currentLang === 'ko' ? (project.problem_ko || project.description) : (project.problem_en || project.description_en);
        const role = currentLang === 'ko' ? project.role_ko : project.role_en;
        const result = currentLang === 'ko' ? project.result_ko : project.result_en;

        return `
    <div class="project-card">
        <span class="status-badge ${statusClass}">${project.status}</span>
        <div class="project-img">
            <i class="${project.icon}"></i>
        </div>
        <div class="project-info">
            <h3 class="project-title">${name}</h3>
            
            <div class="project-details">
                <div class="detail-row">
                    <span class="detail-label">Problem:</span>
                    <span class="detail-content">${problem}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">My Role:</span>
                    <span class="detail-content">${role || '-'}</span>
                </div>
                <!-- Tech is displayed via tags below -->
            </div>

            <div class="tech-tags">
                <span class="detail-label" style="margin-right: 4px; font-weight:700; color:#555;">Tech:</span>
                ${project.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
            </div>

            <div class="project-details" style="margin-bottom: 1rem;">
                 <div class="detail-row">
                    <span class="detail-label">Result:</span>
                    <span class="detail-content">${result || '-'}</span>
                </div>
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

// 4. Living Stack Map Logic
const techMapContainer = document.getElementById('techMapContainer');
const mapControls = document.getElementById('mapControls');
const activeFiltersList = document.getElementById('activeFiltersList');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Target technologies to display
const DISPLAY_TAGS = ['Python', 'PyTorch', 'TensorFlow', 'Flutter', 'FastAPI', 'Firebase'];
let activeFilters = [];

function calculateTechStats() {
    const stats = {};

    // Initialize stats for display tags
    DISPLAY_TAGS.forEach(tag => {
        stats[tag] = { count: 0, lastUsed: "2000-01" };
    });

    projects.forEach(project => {
        if (project.tags) {
            project.tags.forEach(tag => {
                // Case-insensitive match
                const standardizedTag = DISPLAY_TAGS.find(t => t.toLowerCase() === tag.toLowerCase());
                if (standardizedTag) {
                    stats[standardizedTag].count++;
                    if (project.last_used > stats[standardizedTag].lastUsed) {
                        stats[standardizedTag].lastUsed = project.last_used;
                    }
                }
            });
        }
    });
    return stats;
}

function getBubbleSizeClass(count) {
    if (count >= 4) return 'bubble-xl';
    if (count === 3) return 'bubble-l';
    if (count === 2) return 'bubble-m';
    return 'bubble-s';
}

function renderStackMap() {
    const stats = calculateTechStats();
    techMapContainer.innerHTML = '';

    // Grid-based random placement
    const cells = [];
    const rows = 3;
    const cols = 4;
    for (let r = 0; r < rows; r++) cells.push({ r, c: r }); // Diagonal fallback? No, let's do full grid
    // Actually full grid:
    const gridCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gridCells.push({ r, c });
        }
    }

    // Shuffle
    for (let i = gridCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridCells[i], gridCells[j]] = [gridCells[j], gridCells[i]];
    }

    DISPLAY_TAGS.forEach((tag, index) => {
        const data = stats[tag];
        // Ensure we display even 0 count tags? No, only active ones usually. But prompt implied these specific ones.
        // Let's hide 0 count to be clean, or show as disabled? 
        // Logic says "usage frequency", imply > 0.
        if (!data || data.count === 0) return;

        const bubble = document.createElement('div');
        // Add specific data-tech attribute for easy selection
        bubble.setAttribute('data-tech', tag);
        bubble.className = `tech-bubble ${getBubbleSizeClass(data.count)}`;
        bubble.textContent = tag;

        // Position
        const cell = gridCells[index] || { r: 0, c: 0 };
        const topJitter = Math.random() * 20 - 10;
        const leftJitter = Math.random() * 20 - 10;
        const topBase = (cell.r / rows) * 100 + (100 / rows / 2);
        const leftBase = (cell.c / cols) * 100 + (100 / cols / 2);

        const floatDelay = Math.random() * 5;
        bubble.style.animation = `float 6s ease-in-out ${floatDelay}s infinite`;

        // Desktop positioning
        if (window.innerWidth > 768) {
            bubble.style.top = `${topBase + topJitter}%`;
            bubble.style.left = `${leftBase + leftJitter}%`;
            bubble.style.transform = 'translate(-50%, -50%)';
        }

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'bubble-tooltip';
        tooltip.innerHTML = `Used in <strong>${data.count}</strong> projects<br>Last used: ${data.lastUsed}`;
        bubble.appendChild(tooltip);

        // Click Event
        bubble.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling issues
            toggleFilter(tag);
        });

        techMapContainer.appendChild(bubble);
    });
}

// Core Toggle Logic
function toggleFilter(tag) {
    if (activeFilters.includes(tag)) {
        activeFilters = activeFilters.filter(t => t !== tag);
    } else {
        activeFilters.push(tag);
    }
    updateUI();
}

// Clear Logic
function clearFilters() {
    activeFilters = [];
    updateUI();
}

// activeFiltersList.addEventListener('click', (e) => {
//     // Optional: remove tag by clicking chip
// });
clearFiltersBtn.addEventListener('click', clearFilters);

function updateUI() {
    // 1. Sync Bubbles
    document.querySelectorAll('.tech-bubble').forEach(b => {
        const tech = b.getAttribute('data-tech');
        if (activeFilters.includes(tech)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // 2. Sync Map Controls (Chips)
    activeFiltersList.innerHTML = '';
    if (activeFilters.length > 0) {
        mapControls.style.display = 'inline-flex';
        activeFilters.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'active-filter-tag';
            chip.innerHTML = `${tag} <i class="fas fa-times" style="font-size: 0.7em; margin-left: 4px; cursor: pointer;"></i>`;
            // Add click to remove
            chip.onclick = () => toggleFilter(tag);
            activeFiltersList.appendChild(chip);
        });
    } else {
        mapControls.style.display = 'none';
    }

    // 3. Render Projects
    renderFilteredProjects(activeFilters);
}

// Clear button event
clearFiltersBtn.addEventListener('click', clearFilters);

function renderFilteredProjects(filters = []) {
    let filtered = projects;

    // Filter Logic
    if (filters.length > 0) {
        filtered = projects.filter(project => {
            // Check if project has ANY of the active filter tags (OR logic)
            // Use standardized lowercase comparison
            if (!project.tags) return false;
            return project.tags.some(ptag =>
                filters.some(ftag => ftag.toLowerCase() === ptag.toLowerCase())
            );
        });
    }

    // Safety check for empty results
    if (filtered.length === 0) {
        const emptyMsg = currentLang === 'ko' ? "선택한 필터와 일치하는 프로젝트가 없습니다." : "No projects match the selected filters.";
        projectsContainer.innerHTML = `<div style="text-align:center; padding: 2rem; width: 100%; color: var(--text-secondary);">${emptyMsg}</div>`;
        return;
    }

    // Render
    // Render
    projectsContainer.innerHTML = filtered.map(project => {
        const statusClass = `status-${project.status.toLowerCase()}`;
        const name = currentLang === 'ko' ? project.name : project.name_en;
        const description = currentLang === 'ko' ? project.description : project.description_en;
        const problem = currentLang === 'ko' ? (project.problem_ko || project.description) : (project.problem_en || project.description_en);
        // Using 'result' field as 'Solution' based on user mapping (approximate)
        // Or should we use role? User example 'Solution' was 'Designed... to improve...'. 
        // My result field is 'Reduced search time...'. Close enough as 'How/What solved'.
        const solution = currentLang === 'ko' ? project.result_ko : project.result_en;

        return `
    <div class="project-card">
        <div class="project-header">
            <div class="header-top">
                <h3 class="project-title">${name}</h3>
                <span class="status-badge ${statusClass}">${project.status}</span>
            </div>
            <p class="project-summary">${description}</p>
        </div>
        
        <div class="project-body">
            <div class="info-section">
                <div class="info-block">
                    <span class="info-label">Problem</span>
                    <p class="info-text">${problem}</p>
                </div>
                <div class="info-block">
                    <span class="info-label">Solution</span>
                    <p class="info-text">${solution || '-'}</p>
                </div>
            </div>

            <div class="tech-section">
                <span class="info-label">Tech Stack</span>
                <div class="tech-chips">
                    ${project.tags.slice(0, 4).map(tag => `<span class="tech-chip">${tag}</span>`).join('')}
                    ${project.tags.length > 4 ? `<span class="tech-chip more">+${project.tags.length - 4}</span>` : ''}
                </div>
            </div>
        </div>

        <div class="project-footer">
            <a href="${project.link}" class="project-btn" target="_blank">
                View Details <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    </div>
`}).join('');
}

// Initial Render
renderStackMap();
// Trigger initial project filter (empty)
renderFilteredProjects();

// Resize Handler
window.addEventListener('resize', () => {
    // Optional: Re-calculate bubble positions if needed, 
    // but pure CSS media queries usually handle the Grid vs Absolute switch fine.
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
    renderFilteredProjects(activeFilters);
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
