# Visualis Digital Services - Client Website

Welcome to the official repository for the **Visualis Digital Services** website – a modern, responsive, and fully custom-built site created for a design-focused client. The project showcases high-quality frontend development using semantic HTML, Tailwind CSS, and vanilla JavaScript.

## 🌐 Live Site

👉 [visualis-digitalservices.com](https://visualis-digitalservices.com)

## 🛠 Tech Stack

- **HTML5** – Semantic, accessible markup
- **Tailwind CSS** – Utility-first responsive design
- **JavaScript (ES6+)** – Interactive features and animations
- **JSON** – Used to manage multilingual content
- **Figma** – Used for wireframes and design concepts (not included in repo)

## ✨ Features

- Fully responsive layout (mobile, tablet, desktop)
- Modern and clean UI/UX with smooth animations
- SEO-optimized structure and metadata
- Multi-language support using JSON and JavaScript
- Custom navigation with sticky header
- CTA sections for lead generation
- Clean and maintainable codebase

## 🌍 Language Support

The website supports multiple languages by dynamically loading content from JSON files via a custom JavaScript function. This allows users to switch languages seamlessly without reloading the page.

### The code I used to change the websites content language:
```javascript
function updateContent(langData) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = langData[key];
    });
}

function setLanguagePreference(lang) {
    localStorage.setItem('language', lang);
    location.reload();
}

async function fetchLanguageData(lang) {
    const response = await fetch(`${lang}.json`);
    return response.json();
}

async function changeLanguage(lang) {
    await setLanguagePreference(lang);
    
    const langData = await fetchLanguageData(lang);
    updateContent(langData);
}

window.addEventListener('DOMContentLoaded', async () => {
    const userPreferredLanguage = localStorage.getItem('language') || 'de';
    const langData = await fetchLanguageData(userPreferredLanguage);
    updateContent(langData);
});
