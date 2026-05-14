document.addEventListener("DOMContentLoaded", init);
let button;

function init() {
    //check theme
    const doc = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'normal';

    doc.setAttribute('data-theme', savedTheme);
    button = document.querySelector('.themeSwitch');
    if (doc.getAttribute('data-theme') == 'lab') {
        button.innerHTML = `
        <i class="fa-regular fa-lightbulb"></i>
        `
    } else {
        button.innerHTML = `
        <i class="fa-solid fa-bolt-lightning"></i>
        `
    }

    button.addEventListener('click', changeTheme);
}

function changeTheme() {
    const doc = document.documentElement;
    button = document.querySelector('.themeSwitch');

    let currentTheme = doc.getAttribute('data-theme')

    if (currentTheme == 'lab') {
        button.innerHTML = `
        <i class="fa-solid fa-bolt-lightning"></i>
        `
        doc.setAttribute('data-theme', 'normal');
        localStorage.setItem('theme', 'normal');
    } else {
        button.innerHTML = `
        <i class="fa-regular fa-lightbulb"></i>
        `
        doc.setAttribute('data-theme', 'lab');
        localStorage.setItem('theme', 'lab');
    }
}