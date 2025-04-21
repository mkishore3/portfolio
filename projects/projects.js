import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const titleEl = document.querySelector('.projects-title');

if (projectsContainer && titleEl) {
  const projects = await fetchJSON('../lib/projects.json');
  
  renderProjects(projects, projectsContainer, 'h2');

  titleEl.textContent = `${projects.length} Projects`;
} else {
  console.error('Missing projects container or title element.');
}

