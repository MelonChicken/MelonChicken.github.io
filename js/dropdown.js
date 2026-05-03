document.addEventListener("DOMContentLoaded", init);

let currentFilterDict = {
    category: [],
    status: [],
    keyword: ""
};

function init() {
    // console.log("Lets start");
    // 1. add dropdown filters
    let dropdownContents = document.querySelectorAll(".dropdownContent label");
    // console.log("dropdownContent: "+dropdownContents);
    dropdownContents.forEach(content => content.addEventListener("click", filterClick))
    let dropdowns = document.querySelectorAll(".dropdown button");
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener("click", dropdownClick);
    })

    // 2. add event listener to search input
    let searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", searchInputHandler);
}

function dropdownClick(clickedElement) {
    let content = clickedElement.target;
    // console.log(content);
    // How to use .classList
    // https://developer.mozilla.org/ko/docs/Web/API/Element/classList

    while (!content.classList.contains("dropdown")) {
        content = content.parentElement;
    }
    // console.log(`It is ${content}`);
    let dropdownContent = content.getElementsByClassName("dropdownContent");
    let dropdownContents = document.querySelectorAll(".dropdownContent")
    let isOpen = dropdownContent[0].classList.contains("open");
    dropdownContents.forEach(content => {
        content.classList.remove("open");
        content.style.display = "None";
    });
    // console.log(dropdownContent);
    if (isOpen) {
        dropdownContent[0].style.display = "None";
    } else {
        dropdownContent[0].style.display = "grid";
        dropdownContent[0].classList.add("open");
    }

}


/**
 * function to load the filtered contents
 */
function filterClick(clickedElement) {
    let content = clickedElement.target;
    // ignore double-click which happens due to the label? I think so... maybe
    if (content.tagName != "INPUT") {
        return;
    }

    if (content.classList.contains("checked")) {
        content.classList.remove("checked");
    }
    else {
        content.classList.add("checked");
    }
    applyToList(content.name, content.id);
    selectFilteredContent();
}

function applyToList(name, id) {
    let filterlist = currentFilterDict[name];

    if (filterlist.includes(id)) {
        filterlist.splice(filterlist.indexOf(id), 1);
    } else {
        filterlist.push(id);
    }
}

function selectFilteredContent() {
    let projectcards = document.querySelectorAll(".card");

    projectcards.forEach(projectcard => {
        let current = new Project(projectcard);

        // Determines whether the specified callback function returns true for any element of an array.
        let matchesCategory =
            currentFilterDict.category.length === 0 ||
            currentFilterDict.category.some(category =>
                current.toString().includes(category.toLowerCase())
            );

        let matchesStatus =
            currentFilterDict.status.length === 0 ||
            currentFilterDict.status.some(status =>
                current.toString().toLowerCase().includes(status.toLowerCase())
            );

        let matchesKeyword =
            currentFilterDict.keyword === "" ||
            current.toString().toLowerCase().includes(currentFilterDict.keyword);

        if (matchesCategory && matchesStatus && matchesKeyword) {
            projectcard.parentNode.parentNode.style.display = "flex";
        } else {
            projectcard.parentNode.parentNode.style.display = "none";
        }
    });
}

/**
 * function to save the keyword
 */
function searchInputHandler(e) {
    currentFilterDict.keyword = e.target.value.trim().toLowerCase();
    selectFilteredContent();
}

class Project {
    name;
    content;
    status;
    categories;
    stacks;
    result;

    constructor(element) {
        this.loadInfo(element);
    }

    loadInfo(element) {
        this.name = element.getElementsByTagName("h3")[0].innerText;
        this.content = element.getElementsByTagName("p")[0].innerText;

        this.status = "";
        let statusBadge = element.querySelector(".statusBadge");
        if (statusBadge) {
            this.status = statusBadge.innerText.trim().toLowerCase();
        }

        this.categories = [];
        let typeBadges = element.querySelectorAll(".typeBadge");
        typeBadges.forEach(badge => {
            this.categories.push(badge.innerText.trim().toLowerCase());
        });

        this.stacks = [];
        let stacksList = element.querySelectorAll(".stacks p");
        stacksList.forEach(stack => {
            this.stacks.push(stack.innerText.trim());
        });

        let resultText = element.querySelector(".result p");
        this.result = resultText ? resultText.innerText : "";
    }

    toString() {
        return [
            this.name,
            this.content,
            this.status,
            this.categories,
            this.stacks,
            this.result
        ].join(" ").toLowerCase();
    }
}