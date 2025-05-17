import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let xScale, yScale;
let allCommits = []; // Store all commits
let filteredCommits = []; // Store filtered commits
let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

let NUM_ITEMS = 20; // Ideally, let this value be the length of your commit history
let ITEM_HEIGHT = 110; // Feel free to change
let VISIBLE_COUNT = 6; // Feel free to change as well
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
function displayCommitFiles(commitSubset = filteredCommits) {
  const lines = commitSubset.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });
  files = d3.sort(files, (d) => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3
    .select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  filesContainer
    .append('dt')
    .html(
      (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`,
    );
  filesContainer
    .append('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', (d) => fileTypeColors(d.type));
}
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, filteredCommits.length - VISIBLE_COUNT));
  renderItems(startIndex);
  // displayCommitFiles();
  displayCommitFiles(filteredCommits.slice(0, 10));
});

enterView({
  selector: '#file-scrolly .step',
  enter: (el, i) => {
    // You can change this to use a different slice strategy later
    const fileScrollySlice = filteredCommits.slice(i * 10, (i + 1) * 10);
    displayCommitFiles(fileScrollySlice); // Overload displayCommitFiles to accept data
  },
});

// Initialize file scrolly
const fileScrollContainer = d3.select('#file-scroll-container');
const fileSpacer = d3.select('#file-spacer');
const fileItemsContainer = d3.select('#file-items-container');

// Set up file scrolly dimensions
const FILE_ITEM_HEIGHT = 110;
const FILE_VISIBLE_COUNT = 6;
const fileTotalHeight = (NUM_ITEMS - 1) * FILE_ITEM_HEIGHT;
fileSpacer.style('height', `${fileTotalHeight}px`);

// Handle file scrolly scroll events
fileScrollContainer.on('scroll', () => {
  const scrollTop = fileScrollContainer.property('scrollTop');
  let startIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
  startIndex = Math.max(0, Math.min(startIndex, filteredCommits.length - FILE_VISIBLE_COUNT));
  renderFileItems(startIndex);
});

function renderFileItems(startIndex) {
  fileItemsContainer.selectAll('div').remove();

  const endIndex = Math.min(startIndex + FILE_VISIBLE_COUNT, filteredCommits.length);
  const newCommitSlice = filteredCommits.slice(startIndex, endIndex);

  fileItemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((commit, index) => {
      const commitDate = commit.datetime.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "short"
      });
      const fileCount = d3.rollups(commit.lines, d => d.length, d => d.file).length;
      const lineCount = commit.totalLines;
      return `
        <p>
          On ${commitDate}, 
          The most significant changes was in:
          
            ${d3.rollups(commit.lines, d => d.length, d => d.file)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 1)
              .map(([file, count]) => `<li>${file} (${count} lines)</li>`)
              .join('')}
          
        </p>
      `;
    })
    .style('position', 'absolute')
    .style('top', (_, idx) => `${(startIndex + idx) * FILE_ITEM_HEIGHT}px`);
}

// Initial render
renderFileItems(0);

function renderItems(startIndex) {
  itemsContainer.selectAll('div').remove();

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, filteredCommits.length);
  const newCommitSlice = filteredCommits.slice(startIndex, endIndex);

  const currentDate = newCommitSlice[0]?.datetime;
  if (currentDate) {
    d3.select('#date-indicator').text(currentDate.toLocaleDateString());
  }


  updateScatterPlot(data, newCommitSlice); // re-render scatterplot

  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((commit, index) => {
      const commitDate = commit.datetime.toLocaleString("en", {
        dateStyle: "full",
        timeStyle: "short"
      });
      const fileCount = d3.rollups(commit.lines, d => d.length, d => d.file).length;
      const lineCount = commit.totalLines;
      return `
        <p>
          On ${commitDate}, I made 
          <a href="${commit.url}" target="_blank">
            ${index > 0 ? "another glorious commit" : "my first commit, and it was glorious"}
          </a>. 
          I edited ${lineCount} lines across ${fileCount} files. Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    })
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}



async function loadData() {
    const data = await d3.csv('https://raw.githubusercontent.com/mkishore3/portfolio/main/meta/loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
  }

  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
  
        let ret = {
          id: commit,
          url: 'https://github.com/mkishore3/portfolio/commit/' + commit, 
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        // Hide the full lines array (not enumerable)
        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: false,
          configurable: false,
          enumerable: false, // makes it hidden in console.log
        });
  
        return ret;
      });
  }
  
  function renderCommitInfo(data, commits) {
    const statsContainer = d3.select('#stats');
    statsContainer.selectAll('*').remove(); // Clear previous stats
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Total lines of code
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of files
    const numFiles = d3.group(data, d => d.file).size;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(numFiles);
  
    // Average line length (in characters)
    const avgLineLength = d3.mean(data, d => d.length).toFixed(2);
    dl.append('dt').text('Average line length');
    dl.append('dd').text(avgLineLength + ' characters');
  
    // Longest line (length)
    const longestLine = d3.max(data, d => d.length);
    dl.append('dt').text('Longest line length');
    dl.append('dd').text(longestLine + ' characters');
  
    // Time of day most work is done
    const workByPeriod = d3.rollups(
      data,
      v => v.length,
      d => d.datetime.toLocaleString('en', { dayPeriod: 'short' }) // e.g., morning, afternoon
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
    dl.append('dt').text('Most active time of day');
    dl.append('dd').text(maxPeriod);

    // Average file length
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
      );
      const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
      dl.append('dt').text('Average file length');
      dl.append('dd').text(averageFileLength + " lines");
  }
  
  function createBrushSelector(svg) {
    svg.call(d3.brush());
    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
  }
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }
  

  function updateScatterPlot(data, filteredCommits) {
    // Remove the filtering here since it's now handled in updateSlider
    const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
  
    const rScale = d3.scaleSqrt()
      .domain([minLines, maxLines])
      .range([2, 30]);
  
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  
    const usableArea = {
      left: margin.left,
      right: width - margin.right,
      top: margin.top,
      bottom: height - margin.bottom,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Clear previous chart
    d3.select('#chart svg').remove();
    
    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    // Scales
    xScale = d3.scaleTime()
      .domain(d3.extent(filteredCommits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
  
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    // Gridlines
    svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    // Dots
    const dots = svg.append('g')
      .attr('class', 'dots')
      .selectAll('circle')
      .data(filteredCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, d) => {
        renderTooltipContent(d);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', updateTooltipPosition)
      .on('mouseleave', () => updateTooltipVisibility(false));
  
    // Brush
    const brush = d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on('start brush end', brushed);
  
    svg.append('g')
      .attr('class', 'brush')
      .call(brush);
  
    svg.selectAll('.dots, .overlay ~ *').raise();
  
    // Brush handler
    function brushed(event) {
      const selection = event.selection;
      d3.selectAll('circle')
        .classed('selected', d => isCommitSelected(selection, d));
  
      const selectedCommits = renderSelectionCount(selection, filteredCommits);
      renderLanguageBreakdown(selectedCommits);
    }
  }
  
  
  function renderSelectionCount(selection, commits) {
    const selectedCommits = selection
      ? commits.filter(d => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  
    return selectedCommits;
  }
  
  function renderLanguageBreakdown(selectedCommits) {
    const container = document.getElementById('language-breakdown');
  
    if (!selectedCommits || selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
  
    // Flatten lines from selected commits
    const lines = selectedCommits.flatMap(commit => commit.lines);
  
    if (!lines.length) {
      container.innerHTML = '<dd>No language data</dd>';
      return;
    }
  
    // Roll up line counts by language type
    const breakdown = d3.rollup(
      lines,
      v => v.length,
      d => d.type || 'Unknown' // fallback if `type` is missing
    );
  
    // Total number of lines for proportion calculation
    const total = lines.length;
  
    // Clear and render
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / total;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      `;
    }
  }
  
   
let data = await loadData();
allCommits = processCommits(data);
filteredCommits = [...allCommits]; // Initially show all commits

let commitProgress = 100;

let timeScale = d3.scaleTime(
  d3.extent(allCommits, d => d.datetime),
  [0, 100]
);
displayCommitFiles(filteredCommits.slice(0, 10));

let commitMaxTime = timeScale.invert(commitProgress);
const selectedTime = d3.select('#selectedTime');
selectedTime.textContent = timeScale.invert(commitProgress).toLocaleString();
const slider = document.getElementById('progress');
const timeDisplay = document.getElementById('commit-time-display');
// Helper function to get lines for filtered commits:
function filterLinesByCommits(allLines, filteredCommits) {
  const commitSet = new Set(filteredCommits.map(c => c.id));
  return allLines.filter(line => commitSet.has(line.commit));
}
function renderFileStats(lines) {
  // Group lines by file
  let files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }));
  files = d3.sort(files, d => -d.lines.length);

  const container = d3.select('.files');
  container.selectAll('div').remove(); // Clear old content

  const fileGroups = container.selectAll('div')
    .data(files)
    .enter()
    .append('div');

  fileGroups.append('dt')
    .style('grid-column', 1)
    .html(d => `
      <code>${d.name}</code>
      <small>${d.lines.length} lines</small>
    `);
  

  const dd = fileGroups.append('dd')
  
  dd.selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}


// function updateSlider() {
//   commitProgress = +slider.value;
//   commitMaxTime = timeScale.invert(commitProgress);
//   timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
//     dateStyle: 'long',
//     timeStyle: 'short'
//   });
  
//   // Filter commits based on the new max time
//   filteredCommits = allCommits.filter(commit => commit.datetime <= commitMaxTime);
  
//   const filteredLines = filterLinesByCommits(data, filteredCommits);

//   updateScatterPlot(filteredLines, filteredCommits);
//   renderCommitInfo(filteredLines, filteredCommits);
//   renderFileStats(filteredLines);
//   renderItems(0);
// }

// slider.addEventListener('input', updateSlider);
// updateSlider(); // initialize display


renderCommitInfo(data, filteredCommits);
updateScatterPlot(data, filteredCommits);

function renderTooltipContent(commit) {
    if (!commit) return;
  
    document.getElementById('commit-link').href = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
  
    document.getElementById('commit-date').textContent = commit.datetime?.toLocaleDateString('en', {
      dateStyle: 'full',
    });
  
    document.getElementById('commit-time').textContent = commit.datetime?.toLocaleTimeString('en', {
      timeStyle: 'short',
    });
  
    document.getElementById('commit-author').textContent = commit.author;
    document.getElementById('commit-lines').textContent = commit.totalLines;
  }
  
  function updateTooltipVisibility(isVisible) {
    document.getElementById('commit-tooltip').hidden = !isVisible;
  }
  
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  

  // function filterCommitsByTime(commits) {
  //   const slider = document.querySelector('input[type="range"]');
  //   if (!slider) return commits;
    
  //   const timeRange = parseInt(slider.value);
  //   const now = new Date();
  //   const cutoff = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);
    
  //   return commits.filter(commit => commit.datetime >= cutoff);
  // }
  
  // function updateTimeDisplay() {
  //   commitProgress = Number(document.getElementById('time-slider').value);
  //   document.getElementById('time-display').textContent = commitMaxTime.toLocaleString('en', {
  //     dateStyle: 'long',
  //     timeStyle: 'short',
  //   });
  
  //   filterCommitsByTime();
  //   updateScatterPlot(data, filteredCommits);
  // }
  
