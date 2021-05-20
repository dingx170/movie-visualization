
async function getData(movie, minutes){
    var sec = minutes * 60, totals = [], stop = 0;
    var data = await d3.csv("http://localhost/data/" + movie + ".csv");
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
    for (var [canvasId, type] of Object.entries(charts)) {
      canvasId = movie+'-'+canvasId;
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
              backgroundColor: pattern.draw('diagonal-right-left',`rgba(255, 64, 0,${alpha})`),
              borderColor: `rgba(255, 64, 0,${alphaH})`

            },
            {
              label: "Disgust",
              data: data.map(a => a.disgust),
              backgroundColor: pattern.draw('dot',`rgba(255, 191, 0,${alpha})`),
              borderColor: `rgba(255, 191, 0,${alphaH})`
            },
            {
              label: "Fear",
              data: data.map(a => a.fear),
              backgroundColor: pattern.draw('dash',`rgba(160, 82, 45,${alpha})`),
              borderColor: `rgba(160, 82, 45,${alphaH})`
            },
            {
              label: "Happy",
              data: data.map(a => a.happy),
              backgroundColor: pattern.draw('box',`rgba(0, 153, 51,${alpha})`),
              borderColor: `rgba(0, 153, 51,${alphaH})`
            },
            {
              label: "Sad",
              data: data.map(a => a.sad),
              backgroundColor: pattern.draw('triangle',`rgba(80, 80, 255,${alpha})`),
            borderColor: `rgba(80, 80, 255,${alphaH})`
          },
          {
            label: "Suprised",
            data: data.map(a => a.surprised),
            backgroundColor: pattern.draw('line-vertical',`rgba(255, 80, 255,${alpha})`),
            borderColor: `rgba(255, 80, 255,${alphaH})`
          },
          {
            label: "Neutral",
            data: data.map(a => a.neutral),
            backgroundColor: pattern.draw('zigzag',`rgba(194, 194, 214,${alpha})`),
            borderColor: `rgba(194, 194, 214,${alphaH})`
          }]
        },
        options: {
          scales: scales,
          onClick: (e) => {
            const canvasPosition = Chart.helpers.getRelativePosition(e, testChart);
            const dataX = testChart.scales.x.getValueForPixel(canvasPosition.x);
            document.getElementById(movie +'-movie').pause();
            if(dataX<1)
              document.getElementById(movie +'-movie').currentTime = 0;
              else
              document.getElementById(movie +'-movie').currentTime = data[dataX-1].second;
            }
          }
        });
    }
}

async function createChord(movie) {
  var data = await d3.csv("http://localhost/data/" + movie + ".csv");

  function redraw()
  {

  var element = document.getElementsByTagName("svg"), index;
  for (index = element.length - 1; index >= 0; index--)
    element[index].parentNode.removeChild(element[index]);

    var width = parseInt($("#"+movie+"-chordChartCanvas").parent().width()), height = width;
    var innerRadius = width * 0.65 / 2, outerRadius = width * 0.70 / 2;
    var names = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprised", "Neutral"];
    var colors = ["#ff4000", "#ffbf00", "#A0522D", "#009933", "#5050FF", "#FF50FF", "#c2c2d6"];

    // Get place holder for the svg area
    var canvas = d3.select("#"+movie+'-chordChartCanvas');



    // Create patterns on the placeholder
    createPatterns(movie, canvas, colors);

    createLegends(movie, colors, names);

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


      }
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


    redraw();
          window.addEventListener("resize", redraw);

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

function createPatterns(movie, canvas, colors) {
    defs = canvas.append('svg').attr('width', 1).attr('height', 1).append('defs')

    defs.append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 10).attr('height', 10).attr('patternTransform','rotate(45,0,0)')
        .append('rect').attr('width', 5.5).attr('height', 10)
        .attr('stroke', colors[0]).attr('stroke-width', 5.5);


    defs.append('pattern')
        .attr('id', 'diagonalHatch1')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 10).attr('height', 10)
        .append('rect').attr('width', 10).attr('height', 10).attr('fill', colors[1]);
    p = d3.select('#'+movie+'-chordChartCanvas svg pattern#diagonalHatch1');
    p.append('circle').attr('cx', 5).attr('cy', 5).attr('r', 1.5).attr('fill', '#ffffff')
        .attr('stroke', '#ffffff').attr('stroke-width', 1);


    defs.append('pattern')
        .attr('id', 'diagonalHatch2')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 12).attr('height', 12).attr('patternTransform', 'rotate(135,0,0)')
        .append('rect').attr('width', 12).attr('height', 12).attr('fill', colors[2]);

    p = d3.select('#'+movie+'-chordChartCanvas svg pattern#diagonalHatch2');
    p.append('rect').attr('width',1.5).attr('height',6.5).attr('fill', '#FFFFFF')
        .attr('stroke', '#FFFFFF').attr('stroke-width', .5);


    defs.append('pattern')
        .attr('id', 'diagonalHatch3')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 16).attr('height', 16)
        .append('rect').attr('width', 16).attr('height', 16).attr('fill', colors[3]);

    p = d3.select('#'+movie+'-chordChartCanvas svg pattern#diagonalHatch3');
    p.append('rect').attr('width', 5).attr('height', 5).attr('fill', colors[3])
        .attr('stroke', '#FFFFFF').attr('stroke-width', 1);
    p.append('rect').attr('width', 5).attr('height', 5).attr('fill', colors[3])
        .attr('stroke', '#FFFFFF').attr('stroke-width', 1).attr('transform','translate(8,8)');

    defs.append('pattern')
        .attr('id', 'diagonalHatch4')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 16).attr('height', 16)
        .append('rect').attr('width', 16).attr('height', 16).attr('fill', colors[4]);

    p = d3.select('#'+movie+'-chordChartCanvas svg pattern#diagonalHatch4');
    p.append('polygon').attr('points','4,1 8,8 1,8').attr('fill', '#FFFFFF')
        .attr('stroke', '#FFFFFF').attr('stroke-width', 1);
    p.append('polygon').attr('points', '8,4 12,12 4,12').attr('fill', '#FFFFFF')
        .attr('stroke', '#FFFFFF').attr('stroke-width', 1).attr('transform', 'translate(4,4)');

    defs.append('pattern').attr('width', 2).attr('height', 2)
        .attr('id', 'diagonalHatch5')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8).attr('height', 8)
        .append('rect').attr('width', 5.5).attr('height', 8)
        .attr('stroke', colors[5]).attr('stroke-width', 1.5).attr('fill', colors[5]);

    defs.append('pattern')
        .attr('id', 'diagonalHatch6')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8).attr('height', 8)
        .append('rect').attr('width', 8).attr('height', 8).attr('fill', colors[6]);

   p = d3.select('#'+movie+'-chordChartCanvas svg pattern#diagonalHatch6');
    p.append('polyline').attr('points', '0,7 4,3 8,7').attr('fill', colors[6])
        .attr('stroke', '#FFFFFF').attr('stroke-width', 2);
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

async function createLegends(movie, colors, names) {

    var width = parseInt($('#'+movie+'-chordChartLegend').parent().width()), height = parseInt($('#'+movie+'-chordChartCanvas').parent().height());

    canvas = d3.select('#'+movie+'-chordChartLegend');
    createPatterns(movie, canvas, colors);



    var svg = canvas.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + 0 + "," + height * 0.5/ 2 + ")");

    function legend(cx, cy, idx) {
        svg.append('rect').attr('width', 42).attr('height', 12).attr('fill', function () { return getPattern(idx) })
            .attr("transform", "translate(" + cx + "," + cy + ")")
            .style("opacity", 0.8)
            .style('stroke-width', 2)
            .style("stroke", function (d) {
                return d3.rgb(colors[idx]).darker()
            });

        svg.append('text').text(function (d) {
            return names[idx];
        })
        .attr("transform", "translate(" + (cx+50) + "," + (cy+10)  + ")")
            .style("fill", function () {
                return d3.rgb(colors[idx]).darker()
            })
            .attr("id", "label");
    }

    legend(0, 10, 0);
    legend(0, 40, 1);
    legend(0, 70, 2);
    legend(0, 100, 3);
    legend(0, 130, 4);
    legend(0, 160, 5);
    legend(0, 190, 6 )
}



async function updateMovieInfo(movie) {
    var data = {'Mask' : {'title':'The Mask', 'year':'1994','director':'Charles Russell', 'genre':'Comedy/Romance', 'desc':'The Mask, a mischievous green-faced troublemaker with the ability to cartoonishly alter himself and his surroundings at will who later becomes a crimefighter, only to become targeted by gangster Dorian Tyrell, who intends to use the mask to overthrow his superior.'},
                'Jumanji' : {'title':'Jumanji: Welcome to the Jungl‪e', 'year':'2017','director':'Jake Kasdan', 'genre':'Comedy/Adventure', 'desc':'The story focuses on a group of teenagers who come across Jumanji—now transformed into a video game—twenty-one years after the events of the 1995 film. They find themselves trapped in the game as a set of adult avatars, seeking to complete a quest alongside another player who has been trapped since 1996.'},
                'Jigsaw' : {'title':'Jigsaw', 'year':'2017','director':'Michael Spierig, Peter Spierig', 'genre':'Horror/Thriller', 'desc':'After a series of murders bearing all the markings of the Jigsaw killer, law enforcement officials find themselves chasing the ghost of a man who has been dead for over a decade, and they become embroiled in a new game that\'s only just begun.'},
                'Martian' : {'title':'The Martian', 'year':'2015','director':'Ridley Scott', 'genre':'Sci-fi/Drama', 'desc':'An astronaut becomes stranded on Mars after his team assume him dead and must rely on his ingenuity to find a way to signal to Earth that he is alive.'}};

    textId = movie+'-info';
    parent = $("#" + textId).parent();
    $("#" + textId).remove();
    console.log(data[movie]);
    parent.append('<div id="'+textId+'"><b>Title:</b> {{title}}<br/><b>Year:</b> {{year}}<br/><b>Director:</b> {{director}}<br/><b>Genre:</b> {{genre}}<br/><br/><b>Description:</b> {{desc}}</div>');
    w3.displayObject(textId, data[movie]);
}


$(document).ready(function () {
    var activeTab = $(".tab-content").find(".active");
    var id = activeTab.attr('id');
    changeMovie(id)
});


async function changeMovie(movie)
{
  $("video").each(function() {
    $(this).get(0).pause();
  });

  await makeChart(movie, 20);
  await updateMovieInfo(movie);

  setTimeout(function (){
    createChord(movie, 1);
  }, 200);
}
