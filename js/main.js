//First line of main.js...wrap everything in a self-executing anonymous //function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["REM_2012", "REM_2013", "REM_2014", "REM_2015", "REM_2016"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
    
var margin = {top: 10, left: 10, bottom: 10, right: 10},
    width = parseInt(d3.select('#map').style('width')),
    width = (width - margin.left - margin.right)/2,
    mapRatio = .3,
    height = width * mapRatio * 2,
    centered;


    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);


    
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 489,
        leftPadding = 35,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    
   var REM_2012 = "Annual Inflow Remittances Data 2012",
        REM_2013 = "Annual Inflow Remittances Data 2013",
        REM_2014 = "Annual Inflow Remittances Data 2014",
        REM_2015 = "Annual Inflow Remittances Data 2015",
       REM_2016 = "Annual Inflow Remittances Data 2016";
  
     //create a scale to size bars proportionally to frame and for axis
    
    var yScale = d3.scaleLinear()
        .range([453, 0])
        .domain([0, 1100]);

//begin script when window loads
window.onload = setMap();


//set up choropleth map
function setMap(){

     //map frame dimensions
     var width = window.innerWidth * 0.5,
        height = 489;


    //create new svg container for the map
 var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    //create Albers equal area conic projection centered on France
 var projection = d3.geoAlbers()
      .center([25, 13])
      .rotate([0, 11])
      .parallels([20, 24])
      .scale(390)
      .translate([width / 2, height / 2]);
        
    var path = d3.geoPath()
        .projection(projection);
    
    
    d3.queue()
        .defer(d3.csv, "data/R_Africa.csv") //load attributes from csv
        .defer(d3.json, "data/countries.topojson")//load background spatial data
        .defer(d3.json, "data/Africa.topojson") //load choropleth spatial data
    
        .await(callback);
    
   
    function callback(error, csvData, world, africa){
             console.log(africa);
        //place graticule on the map
        setGraticule(map, path);

         //translate world TopoJSON
        var worldCountries = topojson.feature(world, world.objects.cntry00),
            africaRegions = topojson.feature(africa, africa.objects. Africa).features;

        //add Europe countries to map
        var countries = map.append("path")
            .datum(worldCountries)
            .attr("class", "countries")
            .attr("d", path);
        
          //join csv data to GeoJSON enumeration units
       africaRegions = joinData(africaRegions, csvData);

     //create the color scale
        var colorScale = makeColorScale(csvData);
        
        //add enumeration units to the map
     setEnumerationUnits(africaRegions, map, path, colorScale);
        
     createDropdown(csvData);   
        //add coordinated visualization to the map
    
     setText(); 
        
     setChart(csvData, colorScale);
          
    };
}; //end of setMap()

function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM PREVIOUS MODULE
    //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        
         //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        
         //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        
};

function joinData(africaRegions, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
 
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.CODE; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<africaRegions.length; a++){

            var geojsonProps = africaRegions[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.CODE; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
       };  
    };
    
     console.log(africaRegions);
    return africaRegions;
};


   //function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        
        "#FFEED5",
        "#FFDDAA",
        "#FFCC80",
        "#FFBB55",
        "#FFAA2A"

    ];

  //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
  
   function choropleth(props, colorScale){
    var val = parseFloat(props[expressed]);
    if (typeof val == 'number' && !isNaN(val) && val != 0.0){
        return colorScale(val);
    } else {
        return "#CCC";
    };
}; 
    
             
function setEnumerationUnits(africaRegions, map, path, colorScale){
    
    //add africa regions to map
   var regions = map.selectAll(".regions")
        .data(africaRegions)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.CODE;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
       .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    
    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};
   
    //function to create coordinated bar chart

function setChart(csvData, colorScale){
    
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
   
    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.CODE;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel)
    
       .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 489 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
    
        
            
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');   
            
        });
    

     //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
 updateChart(bars, csvData.length, colorScale);
};
    
    
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
      .on("change", function () {
        changeAttribute(this.value, csvData)
    });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
   var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ 
      if (d == attrArray[0]) {
          d = REM_2012;
      } else if (d == attrArray[1]){
          d = REM_2013;
    } else if (d == attrArray[2]){
        d = REM_2014;
    } else if (d == attrArray[3]){
        d = REM_2015;
    } else if (d == attrArray[4]){
       d = REM_2016;
  };     
             
            return d });
};
       

function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

   var bars = d3.selectAll(".bars")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        }) ;

    updateChart(bars, csvData.length, colorScale);
    
    updateText(expressed); 
}; //end of changeAttribute()
    
    
  //update chart with attributes
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]))+3;
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
  
      if (expressed == attrArray[0]) {    
        var chartTitle = d3.select(".chartTitle")
            .text("Estimated " + REM_2012 );
    } else if (expressed == attrArray[1]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Estimated  " + REM_2013 );
    } else if (expressed == attrArray[2]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Estimated  " + REM_2014 );
    } else if (expressed == attrArray[3]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Estimated " + REM_2015 );
    } else if (expressed == attrArray[4]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Estimated  " + REM_2016);
       }; 
};
    
  //function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.CODE)
        .style("stroke", "blue")
        .style("stroke-width", "2");
     setLabel(props);
}; 

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.CODE)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
           .text();
        
        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    
     d3.select(".infolabel")
        .remove();
};
 
    
 //function to create dynamic label
function setLabel(props){
    
     if (expressed == attrArray[0]){
        var label = REM_2012;
    } else if (expressed == attrArray[1]){
        var label = REM_2013;
    } else if (expressed == attrArray[2]){
        var label = REM_2014;
    } else if (expressed == attrArray[3]){
        var label = REM_2015;
    } else if (expressed == attrArray[4]){
        var label = REM_2016;
       };
    
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
       "</h1><br><b>" + label + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.CODE + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.Name);
};   

    
  
 //Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
       .node()
        .getBoundingClientRect()
        .width;
   
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};   
    
    
  function setText(){
    var chart = d3.select("body")
    .append("div")
    .attr("width", width-50)
    .attr("height", height-50)
    .attr("class", "textPanel")
    .append("p")
    .text("Welcome, glean in from data on the annual inflow of migrant remittances to Africa for the years; 2012-2016. International migration; the movement of people across international boundaries has had enormous implications for growth and poverty alleviation across African countries. These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries.");
    
}; 
    
function updateText(props){
    var REM_2012Text = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2012. the data was derieved beased on estimates such as: (a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries"
    var REM_2013Text = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2013. the data was derieved beased on estimates such as: (a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries."
    var REM_2014Text = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2014. the data was derieved beased on estimates such as: (a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries"
    var REM_2015Text = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2015. the data was derieved beased on estimates such as: (a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries"
    var REM_2016Text = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2016. the data was derieved beased on estimates such as: (a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries"
  var elseText = "These are analytical estimates based on logical assumptions derived from a global estimation of inflow remittance flows to African countries. These are  officially reported data from the World Bank publications for the year 2012 -2016. the data was derieved beased on estimates such as:(a) the data on migrants in various destination countries are incomplete; (b) the incomes of migrants abroad and the costs of living are both proxied by per capita incomes in PPP terms, which is only a rough proxy; and (c) there is no way to capture remittances flowing through informal, unrecorded channels..These Statistics will deepen your engagements on migration, remittances and the effect the diaspora has on their countries"  
    
    if (expressed == attrArray[0]){
        var chartTitle = d3.select(".textPanel p")
            .text(REM_2012Text);
    } else if (expressed == attrArray[1]){
        var chartTitle = d3.select(".textPanel p")
            .text(REM_2013Text);
    } else if (expressed == attrArray[2]){
        var chartTitle = d3.select(".textPanel p")
            .text(REM_2014Text);
    } else if (expressed == attrArray[3]){
        var chartTitle = d3.select(".textPanel p")
            .text(REM_2015Text);
    } else if (expressed == attrArray[4]){
        var chartTitle = d3.select(".textPanel p")
            .text(REM_2016Text);
    } else if (expressed == attrArray[5]){
        var chartTitle = d3.select(".textPanel p")
            .text(elseText);
    };
};
    
    })(); //last line of main.js  