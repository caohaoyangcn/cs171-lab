import './css/style.css'
import * as d3 from 'd3';
import data from '../data/wealth-health-2014.csv';


// set header font
d3.select('h1')
  .style('font-family', 'sans-serif')
  .style('text-align', 'center') // center
  .style('font-size', '1.5em');

var margin = { top: 20, right: 10, bottom: 20, left: 10 };

// Width and height as the inner dimensions of the chart area
var width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

for (let country of data) {
  country.Income = +country.Income;
  country.LifeExpectancy = +country.LifeExpectancy;
  country.Population = +country.Population;
}
// console.log(data);
// console.log("Countries: " + data.length);
// Define 'svg' as a child-element (g) from the drawing area and include spaces
let svgContainer = d3.select("#chart-area").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

let tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// frame
svgContainer.append("rect")
  .attr("height", height)
  .attr("width", width)
  .attr("fill", "white")
  .attr("stroke", "black");

let [incomeMin, incomeMax] = d3.extent(data, d => d.Income);
let [lifeMin, lifeMax] = d3.extent(data, d => d.LifeExpectancy);
// console.log(incomeMin, incomeMax, lifeMin, lifeMax);
const scaleUpFactor = 1.15;
const scaleDownFactor = 0.65;
let incomeScale = d3.scaleLog()
  .domain([incomeMin * scaleDownFactor, incomeMax * scaleUpFactor])
  .range([0, width]);
let lifeExpectancyScale = d3.scaleLinear()
  .domain([lifeMin * scaleDownFactor, lifeMax * scaleUpFactor])
  .range([height, 0]);
let populationScale = d3.scaleLinear()
  .domain([d3.min(data, d => d.Population), d3.max(data, d => d.Population)])
  .range([4, 30]);

let distinctRegions = d3.map(data, d => d.Region);
// remove duplicates
distinctRegions = Array.from(new Set(distinctRegions));
// map each region to a number
let regionScale = d3.scaleOrdinal().domain(distinctRegions)
  .range([...Array(distinctRegions.length).keys()]);

let regionColor = d3.scaleOrdinal(d3.schemeCategory10)
  .domain(d3.map(data, d => d.Region).keys());
let regionNodes = svgContainer.selectAll("dots")
  .data(distinctRegions)
  .enter()
  .append("g")
  .attr("class", function (d) {
    return `region-button-${regionScale(d)}`;
  })
  .on("click", function (event, d) {
    // toggle the visibility
    let btn = d3.select(`.region-button-${regionScale(d)}`);
    btn.style("opacity", function () {
      if (btn.style("opacity") === '0.5') {
        return '1';
      } else {
        return '0.5';
      }
    });
    let dots = d3.selectAll(`.region-${regionScale(d)}`);
    let next = "";
    if (dots.attr("visibility") === "visible") {
      next = "hidden";
    } else {
      next = "visible";
    }
    dots.attr("visibility", next);
  })
  ;
regionNodes.append("text")
  .html(d => d)
  .attr("transform", function (d, i) {
    return `translate(75, ${80 + i * 25})`;
  })
regionNodes
  .append("circle")
  .attr("cx", 50)
  .attr("cy", function (d, i) {
    return 75 + i * 25;
  })
  .attr("r", 7)
  .attr("fill", function (d) {
    let color = regionColor(d);
    return color;
  })

// console.log(distinctRegions);

let group = svgContainer.append("g");
// sort by population
data.sort((a, b) => d3.descending(a.Population, b.Population));

group.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", function (d) {
    let cx = incomeScale(d.Income);
    return cx;
  })
  .attr("cy", function (d) {
    return lifeExpectancyScale(d.LifeExpectancy);
  })
  .attr("r", function (d) {
    return populationScale(d.Population);
  })
  .attr("fill", function (d) {
    return regionColor(d.Region);
  })
  .on("mouseover", function (e, d) {
    console.log(e);
    if (e.target.style.opacity === '0') {
      return;
    }
    tooltip.transition()
      .duration(200)
      .style("opacity", 0.9);
    tooltip.html(`${d.Country}<br/>Population: ${d.Population}<br/>Income: ${d.Income}<br/>Life Expectancy: ${d.LifeExpectancy}<br/>Region: ${d.Region}`)
      .style("left", (e.pageX) + "px")
      .style("top", (e.pageY - 28) + "px");
  })
  .on("mouseout", function (d) {
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  })
  .attr("class", function (d) {
    return `region-${regionScale(d.Region)}`;
  })
  .attr("visibility", "visible");
;
let xAxis = d3.axisTop()
  .scale(incomeScale)
  .tickValues([1000, 2000, 4000, 8000, 16000, 32000, 100000])
  .tickFormat(d3.format('.0f'));

let yAxis = d3.axisRight()
  .scale(lifeExpectancyScale);
svgContainer.append("g")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0, ${height})`)
  .call(xAxis);
svgContainer.append("g")
  .attr("class", "axis y-axis")
  // .attr("transform", `translate(${padding}, 0)`)
  .call(yAxis);
// });