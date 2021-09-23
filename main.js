// var tricks = JSON.parse(json)
// const nodes = tricks.map((trick, i) => {return {name:trick.trick_name, group: trick.balls-2, difficulty: trick.difficulty, url: trick.trick_url}})
// // console.log(nodes)
// const edges = []
// tricks.forEach((trick, index) => {
//   for (req of trick.prereqs) {
//     req_index = tricks.findIndex(el => {
//       return req.name.toLowerCase() == el.trick_name.toLowerCase()
//     })
//     if(req_index == -1) {
//       console.log(req.name.toLowerCase() +" => "+ trick.trick_name.toLowerCase())
//     }
//     edges.push({
//       source: req_index,
//       target: index,
//       value: req.optional ? 3: 4,
//     })
//   }
//
//   for (related of trick.related) {
//     rel_index = tricks.findIndex(el => {
//       return related.toLowerCase() == el.trick_name.toLowerCase()
//     })
//     if(rel_index == -1) {
//       console.log(related.toLowerCase() +" => "+ trick.trick_name.toLowerCase())
//     }
//     edges.push({
//       target: rel_index,
//       source: index,
//       value: 2
//     })
//   }
// })
// // console.log(edges)

var margin = { top: 220, right:0, bottom:0, left: 220 },
    width = 2000,
    height = 2000;
var svg = d3.select('body').append('svg')
  .attr('class', 'matrix')
  .attr('width', width+margin.right+margin.left)
  .attr('height', height+margin.top+margin.bottom)
  .append('g')
  .attr('transform', 'translate('+margin.left+','+margin.top+')');

// d3.json('d3_data.json').then(function(tricks) {
  // var matrix = [],
  //     nodes = tricks.nodes,
      var node_count = nodes.length;

  // nodes.forEach(function(node, i) {
  //   node.index = i
  //   node.count = 0
  //   matrix[i] = d3.range(node_count).map(function(j) {
  //     return {
  //       x: j,
  //       y: i,
  //       z: 1,
  //       a: false
  //     }
  //   })
  // })
  //
  // tricks.links.forEach(function(link) {
  //   matrix[link.source][link.target].z = link.value
  //   matrix[link.target][link.source].z = link.value
  //   nodes[link.source].count += link.value
  //   nodes[link.target].count += link.value
  //   matrix[link.source][link.source].z = 5
  //   matrix[link.target][link.target].z = 5
  //   matrix[link.target][link.source].a = true
  // })
  //
  // console.log(nodes)
  // console.log(matrix)

  var x_scale = d3.scaleBand().range([0, width]).domain(d3.range(node_count)).paddingInner(0.1).align(0);
  var symbol_scale = d3.scaleOrdinal().range([d3.symbolCircle, d3.symbolStar, d3.symbolTriangle])
  var color_scale = d3.scaleOrdinal(d3.schemeCategory10)

  var orders = {
    name: d3.range(node_count).sort(function(a,b) { return d3.ascending(nodes[a].name, nodes[b].name) }),
    count: d3.range(node_count).sort(function(a,b) { return nodes[b].count - nodes[a].count }),
    group: d3.range(node_count).sort(function(a,b) { return nodes[b].group - nodes[a].group }),
    difficulty: d3.range(node_count).sort(function(a,b) { return nodes[b].difficulty - nodes[a].difficulty }),
  }
  x_scale.domain(orders.count)

  var rows = svg.selectAll('g.row')
    .data(matrix)
    .enter().append('g')
    .attr('class', 'row')
    .attr('transform', function(el, i) {
      return "translate(0," + x_scale(i) + ")";
    })
    .each(make_cells)
  rows.append('a')
    .attr('href', function(el,i) { return nodes[i].url })
    .append('text')
    .attr('x', -6)
    .attr('y', x_scale.bandwidth()/2)
    .attr('dy', '.32em')
    .attr('text-anchor', 'end')
    .text(function(el, i) {
      return nodes[i].name
    })
    .append('title')
    .text(function(el,i) {
      return nodes[i].name+'\n'+(nodes[i].group+2)+' balls'+'\n'+'difficulty: '+nodes[i].difficulty
    })

  var columns = svg.selectAll('g.column')
    .data(matrix)
    .enter().append('g')
    .attr('class', 'column')
    .attr('transform', function(el, i) {
      return 'translate(' + x_scale(i) + ')rotate(-90)'
    })
  columns.append('a')
    .attr('href', function(el,i) { return nodes[i].url })
    .append('text')
    .attr('x', 6)
    .attr('y', x_scale.bandwidth()/2)
    .attr('dy', '.32em')
    .attr('text-anchor', 'start')
    .text(function(el,i) {
      return nodes[i].name
    })
    .append('title')
    .text(function(el,i) {
      return nodes[i].name+'\n'+(nodes[i].group+2)+' balls'+'\n'+'difficulty: '+nodes[i].difficulty
    })

  function make_cells(row) {
    var cells = d3.select(this).selectAll('.cell')
      .data(row.filter(function(el) {
        return el.z
      }))
      .enter().append('svg')
      .attr("class", "cell")
      .attr('x', function(el) { return x_scale(el.x); })
      .style('overflow', 'visible')
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)

    cells
      .append('rect')
      .attr('width', x_scale.bandwidth())
      .attr('height', x_scale.bandwidth())
      .style('fill', function(el, i) {
        return el.z==5 ? color_scale(nodes[el.x].group) : '#000'
      })
      .style('fill-opacity', function(el, i) {
        return el.z==5 ? 0.5 : 0.06
      })

    cells.filter(function(el) { return (el.z!=5 && el.z != 1) })
      .append('path')
      .attr('d', function(el) {
        return d3.symbol().size(x_scale.bandwidth()*7).type(symbol_scale(el.z))()
      })
      .style('fill', function(el) {
        if(nodes[el.x].group === nodes[el.y].group) {
          return color_scale(nodes[el.x].group)
        } else {
          return '#555'
        }
      })
      .attr('transform', function(el, i) {
        y = x_scale.bandwidth()/2
        return 'translate(' + y + ','+ y + ')'
      })

    cells.append('title')
    .text(function(el) {
      if(el.z === 2) {
        return (el.a) ? nodes[el.x].name+' is similar to '+nodes[el.y].name : nodes[el.y].name+' is similar to '+nodes[el.x].name
      }
      else if(el.z === 3) {
        return (el.a) ? nodes[el.x].name+' is an optional prereq for '+nodes[el.y].name : nodes[el.y].name+' is an optional prereq for '+nodes[el.x].name
      }
      else if(el.z === 4) {
        return (el.a) ? nodes[el.x].name+' is a prereq for '+nodes[el.y].name : nodes[el.y].name+' is a prereq for '+nodes[el.x].name
      }
      else if(el.z === 5) {
        return nodes[el.y].name
      } else {
          return nodes[el.y].name + ' x ' + nodes[el.x].name
      }
    })
  }

  d3.select('#order').on('change', function() {
    order(this.value)
  })

  function order(val) {
    x_scale.domain(orders[val])

    var trans = svg.transition().duration(2500)
    trans.selectAll('.row')
      .delay(function(el, i) { return x_scale(i) * 4 })
      .attr('transform', function(el, i) { return 'translate(0,' + x_scale(i) + ')' })
      .selectAll('.cell')
        .delay(function(el) { return x_scale(el.x) * 4 })
        .attr('x', function(el) { return x_scale(el.x) })

      trans.selectAll('.column')
        .delay(function(el, i) { return x_scale(i) * 4 })
        .attr('transform', function(el, i) { return 'translate(' + x_scale(i) + ')rotate(-90)' })
  }

  function mouseover(p) {
    row=d3.selectAll(".row")
      .filter(function(d, i) {
        return i == p.target.__data__.y;
      })
    row.append("line").attr("x2", width)
    row.append("line").attr("y1", x_scale.bandwidth()).attr("y2", x_scale.bandwidth()).attr("x2", width)
    row.selectAll('text').classed("active", true)

    col=d3.selectAll(".column")
      .filter(function(d, i) {
        return i == p.target.__data__.x;
      })
    col.append("line").attr("x1", -width)
    col.append("line").attr("y1", x_scale.bandwidth()).attr("y2", x_scale.bandwidth()).attr("x1", -width)
    col.selectAll('text').classed("active", true)
  }

  function mouseout(p) {
    d3.selectAll("text").classed("active", false);
    d3.selectAll("line").remove()
  }
// })
