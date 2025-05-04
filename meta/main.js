import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
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
  
  let data = await loadData();
  let commits = processCommits(data);
  
  renderCommitInfo(data, commits);

  //random comment