console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


// //step 2.1
// const navLinks = $$("nav a");

// // step 2.2
// const currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
// // step 2.3
// currentLink?.classList.add("current");

//step 3
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
    { url: "./", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "resume/", title: "Resume" },
    { url: "https://github.com/mkishore3", title: "GitHub" },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;
    // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    if (a.host !== location.host) {
        a.target = "_blank";
    }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );
  
  let select = document.querySelector('.color-scheme select');
  

  let prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  let autoOption = select.querySelector('option[value="light dark"]');
  autoOption.textContent = `Automatic (${prefersDark ? "Dark" : "Light"})`;
  
  select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', select.value);
  });
  

  function setColorScheme(scheme) {
    document.documentElement.style.setProperty('color-scheme', scheme);
    select.value = scheme;
  }
  
  if ("colorScheme" in localStorage) {
    setColorScheme(localStorage.colorScheme);
  }

  select.addEventListener('change', (event) => {
    let scheme = event.target.value;
    setColorScheme(scheme);
    localStorage.colorScheme = scheme;
  });

  export async function fetchJSON(url) {
    try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      console.log(response);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }

  export function renderProjects(project, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    
    for (let pro of project) {
      const article = document.createElement('article');
      article.innerHTML = `
        <${headingLevel}>${pro.title}</${headingLevel}>
        <img src="${pro.image}" alt="${pro.title}">
        <p>Completed in ${pro.year}. ${pro.description}</p>
      `;
      containerElement.appendChild(article);
    }
  }

  export async function fetchGithubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
  }

  
  