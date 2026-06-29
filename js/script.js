const projectContainer = document.querySelector("#projectContainer");
const searchInput = document.querySelector("#searchInput");
const categoryInputs = Array.from(document.querySelectorAll('input[name="category"]'));
const statusInputs = Array.from(document.querySelectorAll('input[name="status"]'));

let projects = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
        return "#";
    }
}

function iconForProject(project) {
    const type = (project.type || "").toLowerCase();

    if (type.includes("app")) {
        return "fa-mobile-screen-button";
    }

    if (["ml", "data", "research", "cv"].some((keyword) => type.includes(keyword))) {
        return "fa-brain";
    }

    if (type.includes("discord")) {
        return "fa-comments";
    }

    return "fa-globe";
}

function selectedValues(inputs) {
    return inputs.filter((input) => input.checked).map((input) => input.id.toLowerCase());
}

function projectMatchesFilters(project) {
    const searchText = (searchInput?.value || "").trim().toLowerCase();
    const selectedCategories = selectedValues(categoryInputs);
    const selectedStatuses = selectedValues(statusInputs);
    const type = (project.type || "").toLowerCase();
    const status = (project.status || "").toLowerCase();
    const stacks = (project.stacks || []).map((stack) => stack.toLowerCase());
    const roles = (project.roles || []).map((role) => role.toLowerCase());

    const searchableText = [
        project.title,
        project.oneLiner,
        project.status,
        project.type,
        project.gitRepository,
        project.deployUrl,
        project.demonstrationUrl,
        project.detailUrl,
        ...(project.stacks || []),
        ...(project.roles || []),
    ].join(" ").toLowerCase();

    const matchesSearch = !searchText || searchableText.includes(searchText);
    const matchesCategory = selectedCategories.length === 0
        || selectedCategories.some((category) => {
            return type.includes(category) || stacks.some((value) => value.includes(category));
        });
    const matchesStatus = selectedStatuses.length === 0
        || selectedStatuses.some((selectedStatus) => status.includes(selectedStatus));

    return matchesSearch && matchesCategory && matchesStatus;
}

function includesAny(value, keywords) {
    const normalizedValue = String(value || "").toLowerCase();
    return keywords.some((keyword) => normalizedValue.includes(keyword));
}

function projectSortPriority(project) {
    const status = project.status || "";
    const type = project.type || "";
    const isOngoing = includesAny(status, ["work in progress", "working in progress", "wip", "진행", "작업"]);
    const isDoneOrArchived = includesAny(status, ["completed", "complete", "archived", "완료", "아카이브"]);
    const isIdea = includesAny(status, ["idea", "아이디어"]);
    const isMlOrCv = includesAny(type, ["ml", "cv", "machine learning", "computer vision"]);
    const isWebOrApp = includesAny(type, ["web", "app"]);

    if (isOngoing) {
        return 1;
    }

    if (isDoneOrArchived && isMlOrCv) {
        return 2;
    }

    if (isDoneOrArchived && isWebOrApp) {
        return 3;
    }

    if (isIdea) {
        return 4;
    }

    return 5;
}

function compareProjects(projectA, projectB) {
    const priorityDiff = projectSortPriority(projectA) - projectSortPriority(projectB);

    if (priorityDiff !== 0) {
        return priorityDiff;
    }

    return String(projectA.title || "").localeCompare(String(projectB.title || ""));
}

function renderFallback(message) {
    if (!projectContainer) {
        return;
    }

    projectContainer.innerHTML = `<p class="projectFallback">${escapeHtml(message)}</p>`;
}

function renderBadge(value, className) {
    return value ? `<span class="${className}">${escapeHtml(value)}</span>` : "";
}

function renderLimitedPills(values, limit, emptyText) {
    if (!Array.isArray(values) || values.length === 0) {
        return `<span class="chip chipEmpty">${escapeHtml(emptyText)}</span>`;
    }

    const visibleValues = values.slice(0, limit);
    const hiddenValues = values.slice(limit);
    const visibleChips = visibleValues.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("");

    if (hiddenValues.length === 0) {
        return visibleChips;
    }

    return `${visibleChips}<span class="chip chipMore" title="${escapeHtml(values.join(", "))}">+${hiddenValues.length}</span>`;
}

function renderAction(url, label, icon, variant = "secondary") {
    if (!url) {
        return "";
    }

    return `
        <a class="projectAction ${escapeHtml(variant)}" href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid ${escapeHtml(icon)}"></i>
            ${escapeHtml(label)}
        </a>
    `;
}

function renderProjects() {
    if (!projectContainer) {
        return;
    }

    const visibleProjects = projects.filter(projectMatchesFilters).sort(compareProjects);

    if (visibleProjects.length === 0) {
        renderFallback("No projects to display.");
        return;
    }

    projectContainer.innerHTML = visibleProjects.map((project) => {
        const stacks = Array.isArray(project.stacks) ? project.stacks : [];
        const roles = Array.isArray(project.roles) ? project.roles : [];
        const detailUrl = project.detailUrl || project.url;

        return `
            <div class="cardDeck">
                <div class="card">
                    <div class="cardTop">
                        <div class="badgeGroup">
                            ${renderBadge(project.status, "statusBadge")}
                            ${renderBadge(project.type, "typeBadge")}
                        </div>
                        <span class="cardIcon">
                            <i class="fa-solid ${escapeHtml(iconForProject(project))}"></i>
                        </span>
                    </div>

                    <div class="cardBody">
                        <div class="cardTitleLine">
                            <h3>${escapeHtml(project.title || "Untitled Project")}</h3>
                        </div>

                        <p class="description">
                            ${escapeHtml(project.oneLiner || "No one-liner available.")}
                        </p>
                    </div>

                    <div class="cardMeta">
                        <div class="projectField">
                            <p class="fieldLabel">Stack</p>
                            <span class="chipGroup stacks">
                                ${renderLimitedPills(stacks, 5, "No stack listed")}
                            </span>
                        </div>

                        <div class="projectField">
                            <p class="fieldLabel">Role</p>
                            <span class="chipGroup roles">
                                ${renderLimitedPills(roles, 2, "No role listed")}
                            </span>
                        </div>
                    </div>

                    <div class="projectActions">
                        ${renderAction(detailUrl, "Details", "fa-arrow-right", "primary")}
                        ${renderAction(project.gitRepository, "Git Repository", "fa-code-branch")}
                        ${renderAction(project.deployUrl, "Deploy", "fa-up-right-from-square")}
                        ${renderAction(project.demonstrationUrl, "Demonstration", "fa-circle-play")}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

async function loadProjects() {
    if (!projectContainer) {
        return;
    }

    try {
        const response = await fetch("./data/projects.json", { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Failed to load projects.json: ${response.status}`);
        }

        const data = await response.json();
        projects = Array.isArray(data.projects) ? data.projects : [];

        if (projects.length === 0) {
            renderFallback("No projects to display.");
            return;
        }

        renderProjects();
    } catch (error) {
        if (window.location.protocol === "file:") {
            console.warn("Project JSON cannot be fetched from a file:// page. Serve this site over HTTP.");
            renderFallback("Projects can be loaded when the site is served over HTTP.");
            return;
        }

        console.warn("Projects could not be loaded.", error);
        renderFallback("Projects could not be loaded right now.");
    }
}

[searchInput, ...categoryInputs, ...statusInputs].forEach((element) => {
    element?.addEventListener("input", renderProjects);
    element?.addEventListener("change", renderProjects);
});

loadProjects();
