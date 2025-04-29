import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Fetch projects
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleEl = document.querySelector('.projects-title');
let selectedIndex = -1;

if (projectsContainer && titleEl) {
  renderProjects(projects, projectsContainer, 'h2');
  titleEl.textContent = `${projects.length} Projects`;
} else {
  console.error('Missing projects container or title element.');
}

// Color palette (define once)
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Function to render pie chart and legend
function renderPieChart(projectsGiven) {
  // Group the projects by year and count how many projects per year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // Convert rolled data into { label, value } objects
  let data = rolledData.map(([year, count]) => ({
    label: year,
    value: count,
  }));

  // Create arc and pie generators
  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let sliceGenerator = d3.pie().value((d) => d.value);

  // Generate pie slices
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  // Clear previous paths and legend items
  let svg = d3.select('svg');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i; // toggle selection

        // Update wedge classes
        svg
          .selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update legend classes
        legend
          .selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

          if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
          } else {
            // Get the selected year from the `data` array
            let selectedYear = data[selectedIndex].label;
            
            // Filter projects by the selected year
            let filteredBySearch = projects.filter((project) => {
              let values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            });
            
            if (selectedIndex === -1) {
              renderProjects(filteredBySearch, projectsContainer, 'h2');
            } else {
              let selectedYear = data[selectedIndex].label;
              let filteredByYear = filteredBySearch.filter((project) => project.year === selectedYear);
              renderProjects(filteredByYear, projectsContainer, 'h2');
            }
          }
          
      });
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Initial render on page load
renderPieChart(projects);

// Search functionality
let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('change', (event) => {
  // Update query value
  query = event.target.value;

  // Filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  titleEl.textContent = `${filteredProjects.length} Projects`;

  // Render updated pie chart and legend
  renderPieChart(filteredProjects);
});
