var movies = {
  mask: "http://localhost/VA6/theMask_1min.csv",
  "": ""
};

async function getData(movie, minutes){
    var sec = minutes * 60, totals = [], stop = 0;
    var data = await d3.csv(movies[movie]);
    var last=false;
    data.forEach((item, index) => {
      if(index%sec==0){
        stop = (last)?index/sec:stop;
        last = false;
        totals.push({second:0,minute:0,angry:0, disgust:0,fear:0,happy:0,sad:0,surprised:0,neutral:0});
      }
      for(prop in item){
        if(prop=="second") totals[totals.length - 1].second = index;
        else {
          totals[totals.length - 1][prop] += parseInt(item[prop]);
          if(prop!="minute" && totals[totals.length - 1][prop] > 0) last = true;
        };
      }
    });
    totals.length = stop;
    return totals;
}

async function makeChart(movie, minutes) {
    var data = await getData(movie, minutes);

    const charts = {'emotionsOverTime': 'bar', 'emotionsOverTimeLine': 'line'};
    for (const [canvasId, type] of Object.entries(charts)) {
      scales = {};
      if(type == "bar") scales= {x: {stacked: true},y: {stacked: true}};
      parent = $("#" + canvasId).parent();
      $("#" + canvasId).remove();
      parent.append('<canvas id="'+canvasId+'" style="width:100%;height:100%;"></canvas>');
      var ctx = document.getElementById(canvasId).getContext('2d');


      alpha = 0.6;
      alphaH = 1;

      const testChart = new Chart(ctx, {
        type: type,
        responsive:true,
        maintainAspectRatio: false,
        data: {
          labels: data.map(function(it,i,ar) {return `${Math.round((ar[i-1]?ar[i-1].second:0)/60)}-${Math.round(it.second/60)} min`}),
          datasets: [
            {
              label: "Angry",
              data: data.map(a => a.angry),
              backgroundColor: `rgba(255, 64, 0,${alpha})`,
              borderColor: `rgba(255, 64, 0,${alphaH})`

            },
            {
              label: "Disgust",
              data: data.map(a => a.disgust),
              backgroundColor: `rgba(255, 191, 0,${alpha})`,
              borderColor: `rgba(255, 191, 0,${alphaH})`
            },
            {
              label: "Fear",
              data: data.map(a => a.fear),
              backgroundColor: `rgba(160, 82, 45,${alpha})`,
              borderColor: `rgba(160, 82, 45,${alphaH})`
            },
            {
              label: "Happy",
              data: data.map(a => a.happy),
              backgroundColor: `rgba(0, 153, 51,${alpha})`,
              borderColor: `rgba(0, 153, 51,${alphaH})`
            },
            {
              label: "Sad",
              data: data.map(a => a.sad),
              backgroundColor: `rgba(80, 80, 255,${alpha})`,
            borderColor: `rgba(80, 80, 255,${alphaH})`
          },
          {
            label: "Suprised",
            data: data.map(a => a.surprised),
            backgroundColor: `rgba(255, 80, 255,${alpha})`,
            borderColor: `rgba(255, 80, 255,${alphaH})`
          },
          {
            label: "Neutral",
            data: data.map(a => a.neutral),
            backgroundColor: `rgba(194, 194, 214,${alpha})`,
            borderColor: `rgba(194, 194, 214,${alphaH})`
          }]
        },
        options: {
          scales: scales,
          onClick: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, testChart);
            const dataX = testChart.scales.x.getValueForPixel(canvasPosition.x);
            document.getElementById('movie').pause();
            if(dataX<1)
              document.getElementById('movie').currentTime = 0;
              else
              document.getElementById('movie').currentTime = data[dataX-1].second;
            }
          }
        });
    }
}

async function createChord(movie) {
    var data = await d3.csv(movies[movie]);
    var width = parseInt($("#chordChartCanvas").parent().width()), height = width;
    var innerRadius = width * 0.65 / 2, outerRadius = width * 0.70 / 2;
    var names = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprised", "Neutral"];
    var colors = ["#ff4000", "#ffbf00", "#A0522D", "#009933", "#5050FF", "#FF50FF", "#c2c2d6"];

    // Get place holder for the svg area
    var canvas = d3.select('#chordChartCanvas');

    // Create patterns on the placeholder
    createPatterns(canvas, colors);

    // Create SVG area for chart
    var svg = canvas.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // format the data
    completeMatrix = prepareData(data);

    // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (completeMatrix);



    // border circle for names
    svg.selectAll("path")
        .data(res.groups)
        .enter().append("path")
        .style("fill", function (d) { return getPattern(d.index); })
        .style("stroke", function (d) {
            return d3.rgb(colors[d.index]).darker()
        })
        .style("opacity", 0.5)
        .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", fadeOnMouseOverArc(.1))
        .on("mouseout", fadeOnMouseOverArc(0.5))
        ;

    function fadeOnMouseOverArc(opacity) {
        return function (d, i) {
            d3.selectAll(".chord path")
                .filter(function (d) {
                    return d.source.index != i.index && d.target.index != i.index;
                })
                .transition()
                .style("opacity", opacity);
        };
    }

    // Arc for labels
    var arc = d3.arc()
        .innerRadius(innerRadius + 10)
        .outerRadius(outerRadius + 5)
    // Add labels
    svg.selectAll("text")
        .data(res.groups)
        .enter().append("text")
        .attr('transform', function (d) {
            return 'translate(' +
                arc.startAngle(d.startAngle)
                    .endAngle(d.endAngle)
                    .centroid() // this is an array, so will automatically be printed out as x,y
                + ')';
        })
        .attr('dy', '.35em')
        .attr('text-anchor', function (d) { return d.startAngle > Math.PI ? "end" : null; })
        .text(function (d, i) {
            return names[i];
        })
        .style("fill", function (d) {
            return d3.rgb(colors[d.index]).darker();
        })
        .attr("id", "label");

    // Inner ribon drawing
    svg.append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(res)
        .enter().append("path")
        .attr("d", d3.ribbon().radius(innerRadius))
        .style("fill", function (d) {
            return getPattern(d.source.index);
        })
        .style("stroke", function (d) {
            return d3.rgb(colors[d.source.index]).darker()
        })
        .style("opacity", 0.5)
        .on("mouseover", fadeOnMouseOverRibbon(0.1))
        .on("mouseout", fadeOnMouseOverRibbon(0.5))
        ;

    function fadeOnMouseOverRibbon(opacity) {
        return function (d, i) {
            d3.selectAll(".chord path")
                .filter(function (d) {
                    return d.source.index != i.source.index;
                })
                .transition()
                .style("opacity", opacity);
        };
    }
}

function prepareData(data) {
    var prev;
    var completeMatrix = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]];

    data.forEach(function (d) {

        if (d.angry == '0' && d.disgust == '0' && d.fear == '0' &&
            d.happy == '0' && d.sad == '0' && d.surprised == '0' && d.neutral == '0')
            return;

        if (prev != null) {
            if (prev.angry == 1) {
                completeMatrix[0][0] += +d.angry;
                completeMatrix[0][1] += +d.disgust;
                completeMatrix[0][2] += +d.fear;
                completeMatrix[0][3] += +d.happy;
                completeMatrix[0][4] += +d.sad;
                completeMatrix[0][5] += +d.surprised;
                completeMatrix[0][6] += +d.neutral;
            }

            if (prev.disgust == 1) {
                completeMatrix[1][0] += +d.angry;
                completeMatrix[1][1] += +d.disgust;
                completeMatrix[1][2] += +d.fear;
                completeMatrix[1][3] += +d.happy;
                completeMatrix[1][4] += +d.sad;
                completeMatrix[1][5] += +d.surprised;
                completeMatrix[1][6] += +d.neutral;
            }
            if (prev.fear == 1) {
                completeMatrix[2][0] += +d.angry;
                completeMatrix[2][1] += +d.disgust;
                completeMatrix[2][2] += +d.fear;
                completeMatrix[2][3] += +d.happy;
                completeMatrix[2][4] += +d.sad;
                completeMatrix[2][5] += +d.surprised;
                completeMatrix[2][6] += +d.neutral;
            }
            if (prev.happy == 1) {
                completeMatrix[3][0] += +d.angry;
                completeMatrix[3][1] += +d.disgust;
                completeMatrix[3][2] += +d.fear;
                completeMatrix[3][3] += +d.happy;
                completeMatrix[3][4] += +d.sad;
                completeMatrix[3][5] += +d.surprised;
                completeMatrix[3][6] += +d.neutral;
            }
            if (prev.sad == 1) {
                completeMatrix[4][0] += +d.angry;
                completeMatrix[4][1] += +d.disgust;
                completeMatrix[4][2] += +d.fear;
                completeMatrix[4][3] += +d.happy;
                completeMatrix[4][4] += +d.sad;
                completeMatrix[4][5] += +d.surprised;
                completeMatrix[4][6] += +d.neutral;
            }
            if (prev.surprised == 1) {
                completeMatrix[5][0] += +d.angry;
                completeMatrix[5][1] += +d.disgust;
                completeMatrix[5][2] += +d.fear;
                completeMatrix[5][3] += +d.happy;
                completeMatrix[5][4] += +d.sad;
                completeMatrix[5][5] += +d.surprised;
                completeMatrix[5][6] += +d.neutral;
            }
            if (prev.neutral == 1) {
                completeMatrix[6][0] += +d.angry;
                completeMatrix[6][1] += +d.disgust;
                completeMatrix[6][2] += +d.fear;
                completeMatrix[6][3] += +d.happy;
                completeMatrix[6][4] += +d.sad;
                completeMatrix[6][5] += +d.surprised;
                completeMatrix[6][6] += +d.neutral;
            }
        }
        prev = d;
    });
    return completeMatrix;
}

function createPatterns(canvas, colors) {
    defs = canvas.append('svg').attr('width', 1).attr('height', 1).append('defs')

    defs.append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4).attr('height', 6)
        .append('path').attr('d', 'M-1, 1 12, -2 M0, 4 14, -4 M3, 5 12, -2')
        .attr('stroke', colors[0]).attr('stroke-width', 1);

    defs.append('pattern')
        .attr('id', 'diagonalHatch1')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4).attr('height', 4)
        .append('circle').attr('cx', 2).attr('cy', 2).attr('r', 2)
        .attr('stroke', colors[1]).attr('stroke-width', 1);

    defs.append('pattern')
        .attr('id', 'diagonalHatch2')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4).attr('height', 4)
        .append('rect').attr('width', 3).attr('height', 1)
        .attr('stroke', colors[2]).attr('stroke-width', 1);

    defs.append('pattern')
        .attr('id', 'diagonalHatch3')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 2).attr('height', 2)
        .append('path').attr('d', 'M0 0l5 3v5l-5 -3z')
        .attr('stroke', colors[3]).attr('stroke-width', 1);

    defs.append('pattern').attr('width', 2).attr('height', 2)
        .attr('id', 'diagonalHatch4')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4).attr('height', 4)
        .append('circle').attr('cx', 0).attr('cy', 0).attr('r', 2)
        .attr('stroke', colors[4]).attr('stroke-width', 1);

    defs.append('pattern').attr('width', 2).attr('height', 2)
        .attr('id', 'diagonalHatch5')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4).attr('height', 4)
        .append('rect').attr('width', 1).attr('height', 3)
        .attr('stroke', colors[5]).attr('stroke-width', 1);

    defs.append('pattern').attr('width', 2).attr('height', 2)
        .attr('id', 'diagonalHatch6')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 2).attr('height', 4)
        .append('path').attr('d', 'M-1, 1 2, -2 M0, 4 14, -4 M3, 5 12, -2')
        .attr('stroke', colors[6]).attr('stroke-width', 2);
}

function getPattern(idx) {
    switch (idx) {
        case 0:
            return 'url(#diagonalHatch)';
        case 1:
            return 'url(#diagonalHatch1)';
        case 2:
            return 'url(#diagonalHatch2)';
        case 3:
            return 'url(#diagonalHatch3)';
        case 4:
            return 'url(#diagonalHatch4)';
        case 5:
            return 'url(#diagonalHatch5)';
        case 6:
            return 'url(#diagonalHatch6)';
    }
}

async function start()
{
  await makeChart("mask", 20);
  createChord("mask");
}
start()
