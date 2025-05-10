import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InventoryVisualization.css';
import * as d3 from 'd3';

const VisualizationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredChart, setHoveredChart] = useState(null);
  const [insight, setInsight] = useState('');

  // Fetch inventory data
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory');
      setData(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI-powered insight with actionable suggestions
  const fetchInsight = async (contextText) => {
    try {
      const prompt = `${contextText}\n\nPlease provide a concise insight followed by 2-3 actionable suggestions to reduce carbon emissions.`;
      const res = await axios.post('http://localhost:5000/api/insight', { context: prompt });
      setInsight(res.data.insight || 'No insight generated.');
    } catch (err) {
      console.error('Insight generation error:', err);
      setInsight('Could not generate insight.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && data.length) {
      drawAllCharts();
    }
  }, [data, loading]);

  const clearChart = (selector) => {
    d3.select(selector).selectAll('*').remove();
  };

  const drawAllCharts = () => {
    drawBarChart();
    drawStackedBarChart();
    drawHorizontalBarChart();
  };

  const formatK = d3.format('.2s');

  // 1. Bar Chart: Total Emission by Product
  const drawBarChart = () => {
    const sel = '#barChart';
    clearChart(sel);
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(sel)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Total Emission by Product');

    const prodData = data.map(d => ({
      label: d.product,
      value: d.raw_materials.reduce((sum, m) => sum + (m.total_carbon_emission || 0), 0),
    }));

    const x = d3.scaleBand()
      .domain(prodData.map(d => d.label))
      .range([0, width])
      .padding(0.3);
    const y = d3.scaleLinear()
      .domain([0, d3.max(prodData, d => d.value) || 0])
      .nice()
      .range([height, 0]);

    svg.selectAll('.bar')
      .data(prodData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', '#007bff')
      .on('mouseenter', (event, d) => {
        setHoveredChart('bar');
        fetchInsight(
          `Graph Context: Product ${d.label} has total emissions of ${d.value.toFixed(2)} kg CO₂e.`
        );
      });

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(label => label))
      .selectAll('text')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end');

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(formatK));

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Total Emission');
  };

  // 2. Stacked Bar Chart: Emission breakdown by raw materials
  const drawStackedBarChart = () => {
    const sel = '#stackedBarChart';
    clearChart(sel);
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(sel)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Emission Breakdown by Raw Materials');

    const keys = Array.from(new Set(data.flatMap(d => d.raw_materials.map(m => m.material_name))));
    const stackedData = data.map(d => {
      const row = { product: d.product };
      d.raw_materials.forEach(m => { row[m.material_name] = m.total_carbon_emission || 0; });
      return row;
    });

    const x = d3.scaleBand().domain(data.map(d => d.product)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

    const layers = d3.stack().keys(keys)(stackedData);
    y.domain([0, d3.max(layers, layer => d3.max(layer, seg => seg[1])) || 0]).nice();

    svg.selectAll('g.layer')
      .data(layers)
      .enter()
      .append('g')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => x(d.data.product))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mouseenter', (event, d) => {
        const material = Object.keys(d.data).find(k => k !== 'product' && d.data[k] === (d[1] - d[0]));
        setHoveredChart('stacked');
        fetchInsight(
          `Graph Context: ${material} in product ${d.data.product} emits ${(d[1] - d[0]).toFixed(2)} kg CO₂e.`
        );
      });

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(label => label))
      .selectAll('text')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end');

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(formatK));

    const legend = svg.append('g')
      .attr('font-size', 10)
      .selectAll('g')
      .data(keys.reverse())
      .enter().append('g')
      .attr('transform', (d, i) => `translate(${width + 10},${i * 20})`);

    legend.append('rect')
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', d => color(d));

    legend.append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);
  };

  // 3. Horizontal Bar Chart: Top 5 emitting materials
  const drawHorizontalBarChart = () => {
    const sel = '#horizontalBarChart';
    clearChart(sel);
    const margin = { top: 40, right: 20, bottom: 50, left: 150 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const matMap = {};
    data.forEach(d => d.raw_materials.forEach(m => {
      matMap[m.material_name] = (matMap[m.material_name] || 0) + m.total_carbon_emission;
    }));

    const arr = Object.entries(matMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const x = d3.scaleLinear().domain([0, d3.max(arr, d => d.value)]).range([0, width]);
    const y = d3.scaleBand().domain(arr.map(d => d.label)).range([0, height]).padding(0.2);

    const svg = d3.select(sel)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Top 5 Emitting Materials');

    svg.selectAll('rect')
      .data(arr)
      .enter()
      .append('rect')
      .attr('y', d => y(d.label))
      .attr('width', d => x(d.value))
      .attr('height', y.bandwidth())
      .attr('fill', '#007bff')
      .on('mouseenter', (event, d) => {
        setHoveredChart('hbar');
        fetchInsight(
          `Graph Context: Material ${d.label} emits ${d.value.toFixed(2)} kg CO₂e, ranking it among the top 5 emitters.`
        );
      });

    svg.append('g').call(d3.axisLeft(y));
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(formatK));
  };

  return (
    <div className="visualization-container">
      <h2>Real-Time Carbon Emission Dashboard</h2>
      {loading ? <p>Loading data...</p> : (
        <div className="charts-container">
          <div id="barChart" className="graph-card"></div>
          <div id="stackedBarChart" className="graph-card"></div>
          <div id="horizontalBarChart" className="graph-card"></div>
        </div>
      )}
      {hoveredChart && (
        <div className="insight-container">
          <h3>Insight & Recommendations</h3>
          <pre style={{ whiteSpace: 'pre-line', margin: 0 }}>{insight}</pre>
        </div>
      )}
    </div>
  );
};

export default VisualizationPage;
