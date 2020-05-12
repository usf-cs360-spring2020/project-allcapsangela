var width = d3.select('#map').node().getBoundingClientRect().width,
height = d3.select('#map').node().getBoundingClientRect().height;

console.log(width);
console.log(height);

var center = [width / 2, height / 2];

var projection = d3.geoMercator()
.center([0, 10]);

var svg = d3.select("svg#svgmap")
//.append("svg")
//.attr("id", "svgmap")
.attr("width", width)
.attr("height", height);

const legendlayer = d3.select("g#legendlayer")
 .attr("width", width)
   .attr("height", height);

var path = d3.geoPath()
.projection(projection);

var g = svg.append("g");

var sizescale = d3.scaleSqrt().domain([0,8000000]).range([1,50]);

var color = d3.scaleOrdinal().domain(["Vulnerable", "Definitely endangered", "Severely endangered", "Critically endangered", "Extinct"])
.range(["#8ad08a", "#c5b7d9", "#eaf202", "#f2020e","#000000"]);



d3.json("world-110m2.json").then(function(topology) {

  g.selectAll("path")
  .data(topojson.feature(topology, topology.objects.countries)
  .features)
  .enter().append("path")
  .attr("d", path)
  .attr("stroke", "white")
  .attr("stroke-width", "0.5px")
  .attr("fill", "#EBEBE0");


});

d3.csv("Extinct-Languages-Processed-Final.csv").then(function(cities) {
  cities.sort((a, b) => b.NumSpeakers - a.NumSpeakers);

  const group = svg.append('g').attr('id', 'bubbles');
  const bubbles = group.selectAll('circle')
  .data(cities)
  .enter()
  .append('circle');

  bubbles
  .attr("cx", function(d) {
    d.IsUnderMax = true;
    d.IsChecked = true;
    d.Opacity = 1;
    return projection([parseFloat(d.Longitude), parseFloat(d.Latitude)])[0];})
  .attr("cy", function(d) {
    return projection([parseFloat(d.Longitude), parseFloat(d.Latitude)])[1];})
  .attr("r", d=>sizescale(parseInt(d.NumSpeakers)))
  .style("fill", d=>color(d.DegreeEndangerment))
  .style("stroke", "black")
  .style("stroke-width", 0.1);

  circles = d3.select("g#bubbles").selectAll("circle");
  circles.on("mouseover.highlight", function(d) {
    d3.select(this)
    .raise() // bring to front
    .style("stroke", "#eb34e8")
    .style("stroke-width", 1);
    console.log("MOUSEOVER");

    // show what we interacted with
    //d3.select(status).text("highlight: dog");
  });

  circles.on("mouseout.highlight", function(d) {
    d3.select(this).lower().style("stroke", null);
    //d3.select(status).text("highlight: none");
  });

  circles.on("mouseover.brush1", function(d) {
  circles.filter(e => (e.TopLevelFamily !== d.TopLevelFamily)).transition().style("opacity", "0");

  // show what we interacted with
  //d3.select(status).text("brush: " + d.type);
});

circles.on("mouseout.brush1", function(d) {
  circles.filter(d=>(d.Opacity==1)).transition().style("opacity", 1);
  //circles.transition().style("fill", d.transition().style("opacity", d.Opacity));
});

  circles.on("mouseover.hover2", function(d) {
  console.log("CIRCLES ON");
  let me = d3.select(this);
  //let div = svg.append("div");
  //let div = d3.select("div#details");
  //let div = d3.select("svg").append("div").attr("id", "details");
  //let div = d3.select("svg").insert("div",":first-child").attr("id", "details");
if (d.Opacity == 1) {
  let div = d3.select("body").append("div").attr("id", "details");
  div.attr("class", "tooltip");

  //body.html(html);
  div.style("visibility", "visible");
  div.html(generateTooltip(d));
}




});

circles.on("mousemove.hover2", function(d) {

  let div = d3.select("div#details");
  // get height of tooltip
  let bbox = div.node().getBoundingClientRect();



  //div.style("left", "0px");
  //div.style("top",  "0px");
  if (d.Opacity ==1) {
    div.style("left", d3.event.clientX + "px");
    div.style("top",  (d3.event.pageY - bbox.height) + "px");
      div.style("opacity", 1);
  }


  console.log("pageX: " + d3.event.pageX + "pageY: " + d3.event.pageY)
  console.log("clientX: " + d3.event.clientX + "clientY: " + d3.event.clientY)
  console.log(bbox.height);
  //console.log("left: " + (d3.event.clientX - margin.left - margin.right));
  //console.log("top: " + (d3.event.clientY - margin.top - margin.top));

});

circles.on("mouseout.hover2", function(d) {
  //  d3.selectAll("div#details").style("visibility", "hidden");
//TODO
  d3.selectAll("div#details").remove();
});

circles.on("mousedown.level", function(d) {
  d3.select(this).lower().style("stroke", null);
  circles.transition().style("fill", d => color(d.DegreeEndangerment));
})

circles.on("mouseup.level", function(d) {
  let div = d3.select("div#details");

  //body.html(html);
  //div.style("visibility", "visible");
      if (d.Opacity == 1) {
        div.html(generateTooltip(d));
      }
})

    });

drawLegend();

    var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', function() {
      g.selectAll('path').attr('transform', d3.event.transform);
      svg.select("g#bubbles").selectAll('circle').attr('transform', d3.event.transform);
    });

    svg.call(zoom);

    d3.select('#zoom-in').on('click', function () {
      svg.transition().call(zoom.scaleBy, 2)
    });

    d3.select('#zoom-out').on('click', function () {
      svg.transition().call(zoom.scaleBy, 0.5)
    });

    d3.select('#reset').on('click', function () {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      )
    });

    d3.select("#goal").on("input", function() {
      goal = +this.value;
      d3.select('#goal-value').text(goal);

      svg.selectAll("circle").each(function(d) {
        //if checked, consider
        //this.style.opacity = d.NumSpeakers < goal ? 1 : 0;
        if (d.IsChecked) {
          this.style.opacity = d.NumSpeakers < goal ? 1 : 0;
          d.Opacity = this.style.opacity;
          //d.Opacity = this.style.opacity;
        }
        //this.style.opacity = d.NumSpeakers < goal ? 1 : 0;
        //d.Opacity = this.style.opacity;
        d.IsUnderMax = d.NumSpeakers < goal ? 1 : 0;
      });
    });

    // When a button change, I run the update function
    d3.selectAll(".checkbox").on("change",update);
    // And I initialize it at the beginning
    update();

    function update() {

      //console.log(circles);
      // For each check box:
      d3.selectAll(".checkbox").each(function(d){
        cb = d3.select(this);
        grp = cb.property("value");


        // p sure this does 1 row at a time
        //console.log(cb.property("value"), cb.property("checked"), grp)
        //circles = d3.select("g#bubbles").selectAll("circle");

        // If the box is check, I show the group
        if(cb.property("checked")){
          console.log("BOX CHECKED", cb.property("value"))
          svg.selectAll("circle").each(function(e) {
            if (e.DegreeEndangerment == grp) {
                e.IsChecked = true;
            }
            if (e.IsUnderMax && e.DegreeEndangerment == grp) {
              this.style.opacity = 1;
              e.Opacity = 1;
            }

            //this.style.opacity = e.DegreeEndangerment == grp ? 1 : 0;
          });

          //console.log(svg.selectAll('circles'));
          //svg.selectAll(".checkbox"+grp).transition().duration(1000).style("opacity", 1)//.attr("r", function(d){ return size(d.size) })
          //svg.selectAll("circle").transition().duration(1000).style("opacity", 1);
          //circles.filter(e=>d.DegreeEndangerment == cb.property("value")).style("opacity", 1)
          // Otherwise I hide it
        }else{ // if unchecked
          console.log("BOX UNCHECKED", cb.property("value"))
          svg.selectAll("circle").each(function(e) {


            //if (e.IsUnderMax && e.DegreeEndangerment == grp) {
            if (e.DegreeEndangerment == grp) {
              e.IsChecked=false;
              this.style.opacity = 0;
              e.Opacity = 0;
            }
          });
          //circles.filter(e=>d.DegreeEndangerment == cb.property("value")).style("opacity", 0)
        }
      })
    }

    function drawLegend() {
      const legendWidth = 200;
const legendHeight = 20;

// place legend into its own group
const group = legendlayer.append('g').attr('id', 'circle-legend');

// position legend
//group.attr('transform', translate(width - margin.right - legendWidth, margin.top + 75))
group.attr('transform', translate(650, 400))

// https://d3-legend.susielu.com/#size-linear
const legendSize = d3.legendSize()
.scale(sizescale)
.shape('circle')
.cells([0,1000,10000,100000,1000000])
.ascending(false)
.shapePadding(50)
.labelOffset(10)
.labelFormat(".1s")
//.labelFormat(d3.format("s"))
.labelAlign("middle")

.title('Number of Speakers')
.orient('horizontal');

group.call(legendSize);

// fix the title spacing
group.select('text.legendTitle').attr('dy', -8);
    }



/*
* returns a translate string for the transform attribute
*/
function translate(x, y) {
return 'translate(' + String(x) + ',' + String(y) + ')';
}

/*
* generates the HTML tooltip string from a given data
*/
function generateTooltip(d) {
const html = `
<table border="0" cellspacing="0" cellpadding="2">
<tbody>
<tr>
<th>Name: </th>
<td>${d.EngName}</td>
</tr>
<tr>
<th>Name in Language: </th>
<td>${d.NameInLanguage}</td>
</tr>
<tr>
<th>Alternate Names: </th>
<td>${d.AlternateNames}</td>
</tr>
<tr>
<th>Top-Level Family: </th>
<td>${d.TopLevelFamily}</td>
</tr>
<tr>
<th>ISO 639-3 Code: </th>
<td>${d.ISO6393Code}</td>
</tr>
<tr>
<th>Countries: </th>
<td>${d.Countries} min</td>
</tr>
<tr>
<th>Location Description: </th>
<td>${d.LocationDescription}</td>
</tr>
<tr>
<tr>
<th>Degree of Endangerment: </th>
<td>${d.DegreeEndangerment}</td>
</tr>
<tr>
<th>Speakers: </th>
<td>${d.NumSpeakers}</td>
</tr>
<tr>
<th>Sources: </th>
<td>${d.Sources}</td>
</tr>
<tr>
<th>Glottolog Link: </th>
<td><a href="https://www.glottolog.org?iso=${d.ISO6393Code}">Here</a></td>
</tr>
</tbody>
</table>
`;

return html;

}
