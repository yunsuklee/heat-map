import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import { colorbrewer } from './colors';
import './CSS/main.css';

/*
  Coded by @yunsuklee

  A project to apply D3 and AJAX in a React App.
  Fetching data from API in JSON format and getting to 
  display the data into a scatterplot chart using d3 library.
*/

// Variables
const url = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json';
const fontSize = 16;
const padding = {
  left: 9 * fontSize,
  right: 9 * fontSize,
  top: 1 * fontSize,
  bottom: 8 * fontSize
};
const height = 33 * 12;
let tooltip = d3
  .select('.root')
  .append('div')
  .attr('id', 'tooltip')
  .style('opacity', 0);

// Data fetch
d3.json(url)
  .then(data => callback(data))
  .catch(err => console.log(err));

function callback(data) {
  // Display data to be handled
  console.log(data);
  
  // ?
  data.monthlyVariance.forEach((val) => val.month -= 1);
  const width = 5 * Math.ceil(data.monthlyVariance.length / 12);

  // Container
  let container = d3
    .select('.root')
    .append('div')
    .attr('class', 'container');

  // Heading
  let heading = container.append('heading');
  heading
    .append('h1')
    .attr('id', 'title')
    .attr('class', 'container-title')
    .text('Monthly Global Land-Surface Temperature');
  heading
    .append('h3')
    .attr('id', 'description')
    .attr('class', 'container-subtitle')
    .html(
      data.monthlyVariance[0].year +
      ' - ' +
      data.monthlyVariance[data.monthlyVariance.length - 1].year +
      ': base temperature ' +
      data.baseTemperature +
      '&#8451;' // °C 
    );
    
  // SVG
  let svg = container
    .append('svg')
    .attr('width', width + padding.left + padding.right)
    .attr('height', height + padding.top + padding.bottom)
    .attr('class', 'container-svg');

  // y-axis
  let yScale = d3
    .scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .rangeRound([0, height])
    .padding(0);

  let yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickValues(yScale.domain())
    .tickFormat((month) => {
      let date = new Date(0);
      date.setUTCMonth(month);
      let format = d3.timeFormat('%B');
      return format(date);
    })
    .tickSize(10, 1);

  svg
    .append('g')
    .classed('y-axis', true)
    .attr('id', 'y-axis')
    .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
    .call(yAxis)
    .append('text')
    .text('Months')
    .style('text-anchor', 'middle')
    .attr(
      'transform',
      'translate(' + -6 * fontSize + ',' + height / 2 + ')' + 'rotate(-90)'
    )
    .attr('fill', 'black')
    .style('font-size', fontSize * 1.2)
    .style('font-weight', 'bold')
    .attr('class', 'axis-title');

  // x-axis
  let xScale = d3
    .scaleBand()
    .domain(
      data.monthlyVariance.map((item) => {
        return item.year;
      })
    )
    .range([0, width])
    .padding(0);

  let xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickValues(
      xScale.domain().filter((year) => {
        return year % 10 === 0;
      })
    )
    .tickFormat(function (year) {
      let date = new Date(0);
      date.setUTCFullYear(year);
      let format = d3.timeFormat('%Y');
      return format(date);
    })
    .tickSize(10, 1);

  svg
    .append('g')
    .classed('x-axis', true)
    .attr('id', 'x-axis')
    .attr(
      'transform',
      'translate(' + padding.left + ',' + (height + padding.top) + ')'
    )
    .call(xAxis)
    .append('text')
    .text('Years')
    .style('text-anchor', 'middle')
    .attr('transform', 'translate(' + width / 2 + ',' + 4 * fontSize + ')')
    .attr('fill', 'black')
    .attr('class', 'axis-title')
    .style('font-size', fontSize * 1.2)
    .style('font-weight', 'bold');

  // legend
  const legendColors = colorbrewer.RdYlBu[11].reverse();
  const legendWidth = 400;
  const legendHeight = 300 / legendColors.length;

  let variance = data.monthlyVariance.map((item) => {
    return item.variance;
  });
  let minTemp = data.baseTemperature + Math.min.apply(null, variance);
  let maxTemp = data.baseTemperature + Math.max.apply(null, variance);

  let legendThreshold = d3
    .scaleThreshold()
    .domain(
      ((min, max, count) => {
        let array = [];
        let step = (max - min) / count;
        let base = min;
        for (let i = 1; i < count; i++) {
          array.push(base + i * step);
        }
        return array;
      })(minTemp, maxTemp, legendColors.length)
    )
    .range(legendColors);

  let legendX = d3
    .scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, legendWidth]);

  let legendXAxis = d3
    .axisBottom()
    .scale(legendX)
    .tickSize(10, 0)
    .tickValues(legendThreshold.domain())
    .tickFormat(d3.format('.2f'));

  let legend = svg
    .append('g')
    .classed('legend', true)
    .attr('id', 'legend')
    .attr(
      'transform',
      'translate(' +
        padding.left +
        ',' + (padding.top + height + padding.bottom - 2 * legendHeight) + 
        ')'
    );

  legend
    .append('g')
    .selectAll('rect')
    .data(
      legendThreshold.range().map((color) => {
        let d = legendThreshold.invertExtent(color);
        if (d[0] === null) {
          d[0] = legendX.domain()[0];
        }
        if (d[1] === null) {
          d[1] = legendX.domain()[1];
        }
        return d;
      })
    )
    .enter()
    .append('rect')
    .style('fill', d => legendThreshold(d[0]))
    .attr('x', d => legendX(d[0]))
    .attr('y', 0)
    .attr('width', d =>
      d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null)
    )
    .attr('height', legendHeight);

  legend
    .append('g')
    .attr('transform', 'translate(' + 0 + ',' + legendHeight + ')')
    .call(legendXAxis);

  // Heat-map
  svg
    .append('g')
    .classed('map', true)
    .attr('transform', 'translate(' + (padding.left * 1.01) + ',' + padding.top + ')')
    .selectAll('rect')
    .data(data.monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-month', d => d.month)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => {
      return data.baseTemperature + d.variance;
    })
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month))
    .attr('width', d => xScale.bandwidth(d.year))
    .attr('height', d => yScale.bandwidth(d.month))
    .attr('fill', d => {
      return legendThreshold(data.baseTemperature + d.variance);
    })
    .on('mouseover', (event, d) => {
      let date = new Date(d.year, d.month);
      tooltip.transition()
             .duration(20)
             .style('opacity', 0.9);
      tooltip
        .attr('data-year', d.year)
        .html(
          d3.timeFormat('%Y - %B')(date) + '<br />' + 
          d3.format('.2f')(data.baseTemperature + d.variance) + '&#8451;' + '<br />' +
          d3.format('+.1f')(d.variance) + '&#8451;'
        )
        .style('top', (event.clientY + 30) + 'px')
        .style('left', (event.clientX + 30) + 'px')
    })
    .on('mouseout', () => {
      tooltip.transition()
             .duration(20)
             .style('opacity', 0);
    });
}