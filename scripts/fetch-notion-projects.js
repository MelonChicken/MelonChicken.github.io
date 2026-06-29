const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");
const fetch = require("node-fetch");

const notionToken = process.env.NOTION_TOKEN;
const rawDataSourceId = process.env.NOTION_DATA_SOURCE_ID;

if (!notionToken) {
    throw new Error("NOTION_TOKEN is required.");
}

if (!rawDataSourceId) {
    throw new Error("NOTION_DATA_SOURCE_ID is required.");
}

const notion = new Client({ auth: notionToken });
const dataSourceId = extractNotionId(rawDataSourceId);
const outputPath = path.join(process.cwd(), "data", "projects.json");

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

async function main() {
    const pages = await queryAllProjects(dataSourceId);
    const projects = pages.map(normalizeProject).filter(isPublishableProject);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
        outputPath,
        `${JSON.stringify({ generatedAt: new Date().toISOString(), projects }, null, 2)}\n`,
        "utf8"
    );

    console.log(`Wrote ${projects.length} projects to ${outputPath}`);
}

function isPublishableProject(project) {
    return Boolean(
        project.title
        && (
            project.oneLiner
            || project.status
            || project.type
            || project.stacks.length > 0
            || project.roles.length > 0
        )
    );
}

async function queryAllProjects(id) {
    const projects = [];
    let startCursor;

    do {
        const response = await queryDataSource(id, startCursor);
        projects.push(...response.results);
        startCursor = response.has_more ? response.next_cursor : undefined;
    } while (startCursor);

    return projects;
}

async function queryDataSource(id, startCursor) {
    const query = {
        page_size: 100,
        start_cursor: startCursor,
    };

    if (notion.dataSources?.query) {
        return notion.dataSources.query({
            data_source_id: id,
            ...query,
        });
    }

    try {
        return await rawNotionRequest(`/data_sources/${id}/query`, query);
    } catch (error) {
        if (error.status !== 404) {
            throw error;
        }

        return notion.databases.query({
            database_id: id,
            ...query,
        });
    }
}

async function rawNotionRequest(endpoint, body) {
    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${notionToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2025-09-03",
        },
        body: JSON.stringify(body),
    });

    const responseBody = await response.json();

    if (!response.ok) {
        const error = new Error(responseBody.message || `Notion API request failed with ${response.status}`);
        error.status = response.status;
        error.code = responseBody.code;
        error.body = responseBody;
        throw error;
    }

    return responseBody;
}

function normalizeProject(page) {
    const properties = page.properties || {};
    const detailUrl = getFirstUrl(properties, [
        "Detail URL",
        "Details",
        "Detail",
        "\uc0c1\uc138 \ub9c1\ud06c Detail URL",
    ]);

    return {
        id: page.id,
        title: getTitle(properties, ["Name", "Title", "Project", "Project Name", "\ud504\ub85c\uc81d\ud2b8 \uc774\ub984"]),
        oneLiner: getText(properties, ["one-liner", "Description", "Summary", "Overview", "\ubb38\uc81c-\ud574\uacb0 one-liner"]),
        status: getSelect(properties, ["Status", "State", "status", "\uc0c1\ud0dc status"]),
        type: getSelect(properties, ["Type", "\ud0c0\uc785"]),
        stacks: getMulti(properties, ["Stacks", "Stack", "Tech Stack", "Technologies", "Skills", "stack", "\uc2a4\ud0dd stack"]),
        roles: getMulti(properties, ["Role", "Roles", "role", "\uc5ed\ud560 role"]),
        gitRepository: getFirstUrl(properties, ["Git Repository", "GitHub", "Repository"]),
        deployUrl: getFirstUrl(properties, ["Deploy", "Deployment", "\ubc30\ud3ec Deploy"]),
        demonstrationUrl: getFirstUrl(properties, ["Demonstration", "Demo", "\uc2dc\uc5f0 \ubc0f \uc18c\uac1c Demonstration"]),
        detailUrl: detailUrl || page.url,
    };
}

function getProperty(properties, names) {
    const entries = Object.entries(properties);
    const lowerNames = names.map((name) => name.toLowerCase());
    const matched = entries.find(([name]) => {
        const propertyName = name.toLowerCase();
        return lowerNames.some((target) => propertyName === target || propertyName.includes(target));
    });

    return matched?.[1];
}

function getTitle(properties, names) {
    const property = getProperty(properties, names);

    if (!property) {
        const titleProperty = Object.values(properties).find((item) => item.type === "title");
        return richTextToPlain(titleProperty?.title);
    }

    return richTextToPlain(property.title);
}

function getText(properties, names) {
    const property = getProperty(properties, names);

    if (!property) {
        return "";
    }

    if (property.type === "rich_text") {
        return richTextToPlain(property.rich_text);
    }

    if (property.type === "title") {
        return richTextToPlain(property.title);
    }

    if (property.type === "select") {
        return property.select?.name || "";
    }

    if (property.type === "multi_select") {
        return property.multi_select.map((item) => item.name).join(", ");
    }

    return "";
}

function getSelect(properties, names) {
    const property = getProperty(properties, names);
    return property?.select?.name || "";
}

function getMulti(properties, names) {
    const property = getProperty(properties, names);

    if (!property) {
        return [];
    }

    if (property.type === "multi_select") {
        return property.multi_select.map((item) => item.name);
    }

    if (property.type === "select" && property.select?.name) {
        return [property.select.name];
    }

    if (property.type === "rich_text") {
        return splitList(richTextToPlain(property.rich_text));
    }

    return [];
}

function getUrl(properties, names) {
    const property = getProperty(properties, names);

    if (!property) {
        return "";
    }

    if (property.type === "url") {
        return property.url || "";
    }

    if (property.type === "rich_text") {
        return richTextToPlain(property.rich_text);
    }

    return "";
}

function getFirstUrl(properties, names) {
    for (const name of names) {
        const url = getUrl(properties, [name]);

        if (url) {
            return url;
        }
    }

    return "";
}

function richTextToPlain(value = []) {
    return value.map((item) => item.plain_text || "").join("").trim();
}

function splitList(value) {
    return value
        .split(/[,/|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function extractNotionId(value) {
    const compactValue = String(value).replace(/-/g, "");
    const ids = compactValue.match(/[0-9a-f]{32}/gi);

    if (!ids?.length) {
        throw new Error("NOTION_DATA_SOURCE_ID must be a Notion URL or 32 character ID.");
    }

    return ids[0].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}
