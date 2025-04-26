import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Fetch projects
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleEl = document.querySelector('.projects-title');

if (projectsContainer && titleEl) {
  renderProjects(projects, projectsContainer, 'h2');
  titleEl.textContent = `${projects.length} Projects`;
} else {
  console.error('Missing projects container or title element.');
}

// Create arc and pie generators
let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

let sliceGenerator = d3.pie().value((d) => d.value);

// Your data 
// Group the projects by year and count how many projects per year
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

// Convert the rolled data into {label, value} objects
let data = rolledData.map(([year, count]) => ({
  label: year,
  value: count,
}));
// Generate pie slices
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

// Color palette
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Select SVG and draw slices
arcs.forEach((arc, idx) => {
  d3.select('svg')  
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx));
});

let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});

let query = '';
