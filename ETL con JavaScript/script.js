// script.js
// Requiere d3.v7 (ya está referenciado en index.html)

// --- Cargar CSV y normalizar nombres de columnas ---
d3.csv("data/World-happiness-report-2024.csv").then(raw => {
  const data = raw.map(d => {
    // Normalizar y parsear
    const logGDP = d["Log GD per capita"] !== undefined ? d["Log GD per capita"]
                 : (d["Log GDP per capita"] !== undefined ? d["Log GDP per capita"] : d["Log GDP per capita"]);
    return {
      "Country name": d["Country name"],
      "Regional Indicator": d["Regional Indicator"] || d["Regional indicator"] || d["Regional"],
      "Ladder score": +d["Ladder score"],
      "upperwhisker": +(d["upperwhisker"] || d["upperWhisker"] || 0),
      "lowerwhisker": +(d["lowerwhisker"] || d["lowerWhisker"] || 0),
      "Log GDP per capita": +logGDP,
      "Social support": +d["Social support"],
      "Healthy life expectancy": +d["Healthy life expectancy"],
      "Freedom to make life choices": +d["Freedom to make life choices"],
      "Generosity": +d["Generosity"],
      "Perceptions of corruption": +d["Perceptions of corruption"],
      "Dystopia + residual": +d["Dystopia + residual"]
    };
  });

  drawCharts(data);
}).catch(err => {
  console.error("Error cargando CSV:", err);
});

function drawCharts(data) {
  chart1_barCountries(data);
  chart2_barTop10(data);
  chart3_scatterGDPvsScore(data);
  chart4_bubbleFreedomGDP(data);
  chart5_avgByRegion(data);
  chart6_pieFactors(data);
  chart7_heatmap(data);
  chart8_boxplot(data);
  chart9_corrGenerosityCorruption(data);
  chart10_radarCountry(data, "Colombia"); // Cambia el país si quieres otro
}

/* ---------------------------
   Helpers comunes
----------------------------*/
function clearAndCreateSVG(selector, w = 900, h = 500) {
  d3.select(selector).selectAll("svg").remove();
  return d3.select(selector).append("svg").attr("width", w).attr("height", h);
}

/* ===========================
   1) Bar chart: Ladder score por país
=========================== */
function chart1_barCountries(data) {
  const svg = clearAndCreateSVG("#chart1");
  const margin = { top: 30, right: 30, bottom: 150, left: 80 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // === Filtrar Top 10 países más felices ===
  let top10 = data
    .slice()
    .sort((a, b) => b["Ladder score"] - a["Ladder score"])
    .slice(0, 10);

  // Escalas
  const x = d3.scaleBand()
    .domain(top10.map(d => d["Country name"]))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(top10, d => d["Ladder score"])])
    .nice()
    .range([height, 0]);

  // Barras
  g.selectAll("rect")
    .data(top10)
    .join("rect")
      .attr("x", d => x(d["Country name"]))
      .attr("y", d => y(d["Ladder score"]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d["Ladder score"]))
      .attr("fill", "#4c78a8");

  // Eje X
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-40)")
      .attr("x", -8)
      .attr("y", 10)
      .style("text-anchor", "end")
      .style("font-size", "11px");

  // Eje Y
  g.append("g").call(d3.axisLeft(y));

  // Título
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Top 10 países más felices según Ladder Score");
}


/* ===========================
   2) Horizontal bar: Top 10 países
=========================== */
function chart2_barTop10(data) {
  const svg = clearAndCreateSVG("#chart2");
  const margin = {top: 30, right: 30, bottom: 30, left: 200},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const top10 = data.slice().sort((a,b)=>b["Ladder score"]-a["Ladder score"]).slice(0,10);

  const y = d3.scaleBand().domain(top10.map(d=>d["Country name"])).range([0,height]).padding(0.15);
  const x = d3.scaleLinear().domain([0, d3.max(top10, d=>d["Ladder score"])]).nice().range([0,width]);

  g.selectAll("rect").data(top10).join("rect")
    .attr("y", d=>y(d["Country name"]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d=>x(d["Ladder score"]))
    .attr("fill", "#ff7f0e");

  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
}

/* ===========================
   3) Scatter: Log GDP per capita vs Ladder score
=========================== */
function chart3_scatterGDPvsScore(data) {
  const svg = clearAndCreateSVG("#chart3");
  const margin = {top: 30, right: 30, bottom: 60, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d=>d["Log GDP per capita"])).nice().range([0,width]);
  const y = d3.scaleLinear().domain(d3.extent(data, d=>d["Ladder score"])).nice().range([height,0]);

  g.selectAll("circle").data(data).join("circle")
    .attr("cx", d=>x(d["Log GDP per capita"]))
    .attr("cy", d=>y(d["Ladder score"]))
    .attr("r", 5)
    .attr("fill", "#2ca02c")
    .attr("opacity", 0.7)
    .append("title")
      .text(d => `${d["Country name"]}: ${d["Ladder score"]}`);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
}

/* ===========================
   4) Bubble chart: GDP vs Score, tamaño = Freedom
=========================== */
function chart4_bubbleFreedomGDP(data) {
  const svg = clearAndCreateSVG("#chart4");
  const margin = {top: 30, right: 30, bottom: 60, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, d=>d["Log GDP per capita"])).nice().range([0,width]);
  const y = d3.scaleLinear().domain(d3.extent(data, d=>d["Ladder score"])).nice().range([height,0]);
  const r = d3.scaleSqrt().domain(d3.extent(data, d=>d["Freedom to make life choices"])).range([3,25]);

  g.selectAll("circle").data(data).join("circle")
    .attr("cx", d=>x(d["Log GDP per capita"]))
    .attr("cy", d=>y(d["Ladder score"]))
    .attr("r", d=>r(d["Freedom to make life choices"]))
    .attr("fill", "#d62728").attr("opacity", 0.6)
    .append("title")
      .text(d => `${d["Country name"]}\nFreedom: ${d["Freedom to make life choices"]}\nScore: ${d["Ladder score"]}`);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
}

/* ===========================
   5) Line / points: promedio por región
   (Orden alfabético de regiones)
=========================== */
function chart5_avgByRegion(data) {
  const svg = clearAndCreateSVG("#chart5");
  const margin = {top: 30, right: 30, bottom: 80, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const groups = d3.groups(data, d => d["Regional Indicator"]).map(([region, vals]) => ({
    region,
    avg: d3.mean(vals, v => v["Ladder score"])
  })).sort((a,b)=>d3.ascending(a.region, b.region));

  const x = d3.scalePoint().domain(groups.map(d=>d.region)).range([0,width]).padding(0.5);
  const y = d3.scaleLinear().domain([0, d3.max(groups, d=>d.avg)]).nice().range([height,0]);

  const line = d3.line().x(d=>x(d.region)).y(d=>y(d.avg));

  g.append("path").datum(groups).attr("fill","none").attr("stroke","#17becf").attr("stroke-width",2).attr("d", line);
  g.selectAll("circle").data(groups).join("circle").attr("cx", d=>x(d.region)).attr("cy", d=>y(d.avg)).attr("r",5).attr("fill","#17becf");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-35)").style("text-anchor","end");
  g.append("g").call(d3.axisLeft(y));
}

/* ===========================
   6) Pie chart: factores promedio global (composición)
   (usa promedios de los indicadores relevantes)
=========================== */
function chart6_pieFactors(data) {
  const svg = clearAndCreateSVG("#chart6");
  const width = +svg.attr("width"), height = +svg.attr("height");
  const radius = Math.min(width, height) / 4;
  const g = svg.append("g").attr("transform", `translate(${width/2},${height/2})`);

  const factors = [
    {key: "Log GDP per capita", val: d3.mean(data, d=>d["Log GDP per capita"])},
    {key: "Social support", val: d3.mean(data, d=>d["Social support"])},
    {key: "Healthy life expectancy", val: d3.mean(data, d=>d["Healthy life expectancy"])},
    {key: "Freedom", val: d3.mean(data, d=>d["Freedom to make life choices"])},
    {key: "Generosity", val: d3.mean(data, d=>d["Generosity"])},
    {key: "Corruption", val: d3.mean(data, d=>d["Perceptions of corruption"])}
  ];

  const pie = d3.pie().value(d=>d.val);
  const arc = d3.arc().innerRadius(radius*0.4).outerRadius(radius);
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const arcs = g.selectAll("arc").data(pie(factors)).join("g");
  arcs.append("path").attr("d", arc).attr("fill", d=>color(d.data.key)).attr("opacity",0.85);
  arcs.append("text").attr("transform", d=>`translate(${arc.centroid(d)})`).attr("text-anchor","middle").style("font-size","11px")
      .text(d => d.data.key);
}

/* ===========================
   7) Heatmap: País vs indicadores (valores estandarizados 0-1 por indicador)
=========================== */
function chart7_heatmap(data) {
  // === Indicadores seleccionados ===
  const indicators = [
    "Log GDP per capita",
    "Social support",
    "Healthy life expectancy",
    "Freedom to make life choices",
    "Generosity",
    "Perceptions of corruption"
  ];

  // === Filtrar Top 10 países más felices ===
  const top10 = data
    .slice()
    .sort((a, b) => b["Ladder score"] - a["Ladder score"])
    .slice(0, 10);

  // === Estandarizar (min-max) cada indicador para el color mapping ===
  const scales = {};
  indicators.forEach(ind => {
    const vals = top10.map(d => +d[ind]);
    scales[ind] = d3.scaleLinear()
      .domain([d3.min(vals), d3.max(vals)])
      .range([0, 1]);
  });

  // === Configuración del SVG ===
  const svg = clearAndCreateSVG("#chart7");
  const margin = { top: 80, right: 20, bottom: 100, left: 180 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const countries = top10.map(d => d["Country name"]);
  const x = d3.scaleBand().domain(indicators).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(countries).range([0, height]).padding(0.05);

  const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);

  // === Preparar datos de las celdas ===
  const cells = top10.flatMap(d =>
    indicators.map(ind => ({
      country: d["Country name"],
      indicator: ind,
      valueNorm: scales[ind](d[ind]),
      raw: +d[ind]
    }))
  );

  // === Dibujar celdas del heatmap ===
  g.selectAll("rect")
    .data(cells)
    .join("rect")
      .attr("x", d => x(d.indicator))
      .attr("y", d => y(d.country))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.valueNorm))
    .append("title")
      .text(d => `${d.country}\n${d.indicator}: ${d.raw.toFixed(3)}`);

  // === Ejes ===
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("font-size", "11px");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
      .style("font-size", "11px");

  // === Título ===
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Heatmap de indicadores - Top 10 países más felices");
}


/* ===========================
   8) Boxplot: Ladder score por región
=========================== */
function chart8_boxplot(data) {
  const svg = clearAndCreateSVG("#chart8");
  const margin = {top: 30, right: 30, bottom: 120, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const grouped = d3.groups(data, d => d["Regional Indicator"]);
  const regions = grouped.map(gp => gp[0]);
  const x = d3.scaleBand().domain(regions).range([0,width]).padding(0.4);
  const allScores = data.map(d=>d["Ladder score"]);
  const y = d3.scaleLinear().domain([d3.min(allScores), d3.max(allScores)]).nice().range([height,0]);

  // For each region compute quartiles
  grouped.forEach(([region, vals]) => {
    const scores = vals.map(v=>v["Ladder score"]).sort(d3.ascending);
    const q1 = d3.quantile(scores, 0.25);
    const median = d3.quantile(scores, 0.5);
    const q3 = d3.quantile(scores, 0.75);
    const iqr = q3 - q1;
    const min = d3.max([d3.min(scores), q1 - 1.5*iqr]);
    const max = d3.min([d3.max(scores), q3 + 1.5*iqr]);

    const center = x(region) + x.bandwidth()/2;
    const boxWidth = x.bandwidth() * 0.6;

    // vertical line
    g.append("line").attr("x1", center).attr("x2", center).attr("y1", y(min)).attr("y2", y(max)).attr("stroke", "black");
    // box
    g.append("rect").attr("x", center - boxWidth/2).attr("y", y(q3)).attr("width", boxWidth).attr("height", y(q1) - y(q3)).attr("fill", "#8dd3c7").attr("opacity",0.8);
    // median line
    g.append("line").attr("x1", center - boxWidth/2).attr("x2", center + boxWidth/2).attr("y1", y(median)).attr("y2", y(median)).attr("stroke", "black");
    // min/max caps
    g.append("line").attr("x1", center - boxWidth/4).attr("x2", center + boxWidth/4).attr("y1", y(min)).attr("y2", y(min)).attr("stroke","black");
    g.append("line").attr("x1", center - boxWidth/4).attr("x2", center + boxWidth/4).attr("y1", y(max)).attr("y2", y(max)).attr("stroke","black");
  });

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-35)").style("text-anchor","end");
  g.append("g").call(d3.axisLeft(y));
}

/* ===========================
   9) Scatter: Generosity vs Perceptions of corruption + linea de tendencia
=========================== */
function chart9_corrGenerosityCorruption(data) {
  const svg = clearAndCreateSVG("#chart9");
  const margin = {top: 30, right: 30, bottom: 60, left: 80},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Ejes
  const xVar = "Generosity", yVar = "Perceptions of corruption";
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d[xVar])).nice().range([0,width]);
  const y = d3.scaleLinear().domain(d3.extent(data, d=>d[yVar])).nice().range([height,0]);

  g.selectAll("circle").data(data).join("circle")
    .attr("cx", d=>x(d[xVar]))
    .attr("cy", d=>y(d[yVar]))
    .attr("r", 5)
    .attr("fill", "#9467bd").attr("opacity",0.75)
    .append("title").text(d=>`${d["Country name"]}\nGenerosity: ${d[xVar]}\nCorruption: ${d[yVar]}`);

  // Calcular regresión lineal simple (least squares)
  const xVals = data.map(d=>d[xVar]);
  const yVals = data.map(d=>d[yVar]);
  const n = xVals.length;
  const xMean = d3.mean(xVals), yMean = d3.mean(yVals);
  let num = 0, den = 0;
  for (let i=0;i<n;i++){ num += (xVals[i]-xMean)*(yVals[i]-yMean); den += (xVals[i]-xMean)*(xVals[i]-xMean); }
  const slope = num/den;
  const intercept = yMean - slope * xMean;

  const line = d3.line()
    .x(d => x(d))
    .y(d => y(slope * d + intercept));

  const xLine = d3.extent(xVals);
  g.append("path").datum(xLine).attr("d", line).attr("stroke", "black").attr("stroke-width", 2).attr("fill","none");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
}

/* ===========================
   10) Radar chart (perfil de indicadores) para un país
   Indicadores: GDP, Social support, Healthy life expectancy, Freedom, Generosity, Corruption (negado para coherencia)
=========================== */
function chart10_radarCountry(data, countryName) {
  const svg = clearAndCreateSVG("#chart10");
  const width = +svg.attr("width"), height = +svg.attr("height");
  const g = svg.append("g").attr("transform", `translate(${width/2},${height/2})`);
  const radius = Math.min(width, height) / 3;

  const country = data.find(d => d["Country name"].toLowerCase() === countryName.toLowerCase());
  if (!country) {
    g.append("text").attr("text-anchor","middle").text(`País no encontrado: ${countryName}`);
    return;
  }

  // Indicadores a mostrar y sus valores (normalizamos entre 0 y 1 usando dataset min/max)
  const indicators = [
    {key: "Log GDP per capita", label: "GDP"},
    {key: "Social support", label: "Social support"},
    {key: "Healthy life expectancy", label: "Health"},
    {key: "Freedom to make life choices", label: "Freedom"},
    {key: "Generosity", label: "Generosity"},
    {key: "Perceptions of corruption", label: "Corruption"}
  ];

  // calcular min/max por indicador para normalizar
  indicators.forEach(ind => {
    const vals = data.map(d => d[ind.key]);
    ind.min = d3.min(vals);
    ind.max = d3.max(vals);
    // valor normalizado para el país (si corrupción, invertimos para que mayor sea 'mejor' visualmente)
    let raw = country[ind.key];
    let norm = (raw - ind.min) / (ind.max - ind.min);
    if (ind.key === "Perceptions of corruption") {
      // si percepción de corrupción alta => peor; invertimos para que un mayor valor represente 'mejor'
      norm = 1 - norm;
    }
    ind.value = norm;
  });

  const angleSlice = (Math.PI * 2) / indicators.length;
  const rScale = d3.scaleLinear().range([0, radius]).domain([0,1]);

  // draw grid
  const levels = 4;
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = radius * (lvl/levels);
    g.append("circle").attr("r", r).attr("fill","none").attr("stroke","#bbb").attr("stroke-dasharray","2,2");
  }

  // axes
  const axis = g.selectAll(".axis").data(indicators).join("g").attr("class","axis");
  axis.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", (d,i)=> rScale(1.05) * Math.cos(angleSlice * i - Math.PI/2))
    .attr("y2", (d,i)=> rScale(1.05) * Math.sin(angleSlice * i - Math.PI/2))
    .attr("stroke","#777");

  axis.append("text")
    .attr("x", (d,i)=> rScale(1.15) * Math.cos(angleSlice * i - Math.PI/2))
    .attr("y", (d,i)=> rScale(1.15) * Math.sin(angleSlice * i - Math.PI/2))
    .attr("dy","0.35em")
    .style("font-size","11px")
    .attr("text-anchor","middle")
    .text(d=>d.label);

  // polygon data
  const radarLine = d3.lineRadial()
    .radius(d => rScale(d.value))
    .angle((d,i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  const polygonData = indicators.map(d => ({value: d.value}));

  g.append("path")
    .datum(polygonData)
    .attr("d", radarLine)
    .attr("fill","#1f77b4")
    .attr("fill-opacity",0.5)
    .attr("stroke","#1f77b4")
    .attr("stroke-width",2);

  // puntos
  g.selectAll(".radarCircle")
    .data(polygonData)
    .join("circle")
    .attr("r", 4)
    .attr("cx", (d,i)=> rScale(d.value) * Math.cos(angleSlice * i - Math.PI/2))
    .attr("cy", (d,i)=> rScale(d.value) * Math.sin(angleSlice * i - Math.PI/2))
    .attr("fill","#1f77b4").attr("stroke","#fff");

  // título con el país y valores
  svg.append("text").attr("x", width/2).attr("y", 25).attr("text-anchor","middle").style("font-size","14px").text(`${country["Country name"]} — Perfil de indicadores`);
}
