var margin = { top: 180, right:0, bottom:0, left: 180 },
    width = 2600,
    height = 2600;
var matrix_canvas = d3.select('#matrix')
  .attr('width', width+margin.right+margin.left)
  .attr('height', height+margin.top+margin.bottom)
var ctx_m = matrix_canvas.node().getContext('2d')

var hover_canvas = d3.select('#hover')
  .attr('width', width+margin.right+margin.left)
  .attr('height', height+margin.top+margin.bottom)
var ctx_h = hover_canvas.node().getContext('2d')

var label_canvas = d3.select('#labels')
  .attr('width', width+margin.right+margin.left)
  .attr('height', height+margin.top+margin.bottom)
var ctx_l = label_canvas.node().getContext('2d')

  var x_scale = d3.scaleBand().range([0, width]).domain(d3.range(nodes.length)).paddingInner(0.1).align(0);
  var symbol_scale = d3.scaleOrdinal().range([d3.symbolCircle, d3.symbolStar, d3.symbolTriangle, d3.symbolWye, d3.symbolDiamond])
  var color_scale = d3.scaleOrdinal(d3.schemeCategory10)

  var orders = {
    name: d3.range(nodes.length).sort(function(a,b) { return d3.ascending(nodes[a].name, nodes[b].name) }),
    count: d3.range(nodes.length).sort(function(a,b) { return nodes[b].count - nodes[a].count }),
    group: d3.range(nodes.length).sort(function(a,b) { return nodes[b].group - nodes[a].group }),
    difficulty: d3.range(nodes.length).sort(function(a,b) { return nodes[b].difficulty - nodes[a].difficulty }),
  }
  var order = orders.group
  x_scale.domain(order)

  const bandwidth = x_scale.bandwidth()
  const half_band = x_scale.bandwidth()/2
  var text_offset = 1

  var offset_x = 0
  var offset_y = 0
  var last_x;
  var last_y;
  var drag = false

  function drawLine(canvas, x1, y1, x2, y2) {
    canvas.beginPath()
    canvas.moveTo(x1, y1)
    canvas.lineTo(x2, y2)
    canvas.stroke()
  }

  function paint() {
    ctx_l.clearRect(0,0,matrix_canvas.attr('width'),matrix_canvas.attr('height'))
    ctx_m.clearRect(0,0,matrix_canvas.attr('width'),matrix_canvas.attr('height'))

    for(let i=0; i<nodes.length; i++) {
        ctx_l.fillStyle = 'white'
        ctx_l.textBaseline= 'middle'
        ctx_l.textAlign= 'end'
        ctx_l.fillText(nodes[i].name, margin.left-bandwidth,x_scale(i)+margin.top-offset_y+text_offset)

        ctx_l.rotate(-90*Math.PI/180)
        ctx_l.textAlign= 'start'
        ctx_l.fillText(nodes[i].name, -margin.top+bandwidth,x_scale(i)+margin.left-offset_x+text_offset)
        ctx_l.rotate(90*Math.PI/180)

        for(let j=0; j<nodes.length; j++) {
          edge = matrix[i][j]
          ctx_m.globalAlpha = (edge.z==5) ? 0.5 : 0.06
          ctx_m.fillStyle = (edge.z==5) ? color_scale(nodes[edge.x].group) : '#fff'

          ctx_m.fillRect(margin.left+x_scale(i)-(half_band)-offset_x, margin.top+x_scale(j)-(half_band)-offset_y, bandwidth, bandwidth)

          ctx_m.globalAlpha = 1
          if(edge.z != 5 && edge.z != 1) {
            let x = margin.left+x_scale(i)-offset_x
            let y = margin.top+x_scale(j)-offset_y

            let symbol = d3.symbol()
              .size(bandwidth*7)
              .type(symbol_scale(edge.z===2?edge.z:(edge.z*(edge.a?8:9))))
              .context(ctx_m)
            ctx_m.translate(x,y)
            ctx_m.fillStyle = (nodes[edge.x].group === nodes[edge.y].group) ? color_scale(nodes[edge.x].group) : '#aaa'
            ctx_m.strokeStyle = ctx_m.fillStyle
            ctx_m.beginPath()
            symbol()
            ctx_m.closePath()
            ctx_m.fill()
            ctx_m.stroke()
            ctx_m.translate(-x, -y)
          }
        }
    }
    ctx_l.clearRect(0,0,margin.left-half_band, margin.top-half_band)
    ctx_m.clearRect(0,0,margin.left-half_band,matrix_canvas.attr('height'))
    ctx_m.clearRect(0,0,matrix_canvas.attr('width'),margin.top-half_band)
    ctx_m.fillStyle = 'white'
    ctx_m.strokeStyle = 'white'
    if(matrix_canvas.attr('width') < document.getElementById('matrix-container').clientWidth) {
      drawLine(ctx_m, margin.left-half_band, 0, margin.left-half_band, margin.top-half_band+height)
      drawLine(ctx_m, matrix_canvas.attr('width')-half_band, 0, matrix_canvas.attr('width')-half_band, margin.top-half_band+height)
    } else if(offset_x == 0) {
      drawLine(ctx_m, margin.left-half_band, 0, margin.left-half_band, margin.top-half_band+height)
    } else if(offset_x == width+margin.left-half_band - document.getElementById('matrix-container').clientWidth) {
      drawLine(ctx_m, document.getElementById('matrix-container').clientWidth-1, 0, document.getElementById('matrix-container').clientWidth-1, margin.top-half_band+height)
    }

    if(matrix_canvas.attr('height') < document.getElementById('matrix-container').clientHeight) {
      drawLine(ctx_m, 0, margin.top-half_band, margin.left-half_band+width, margin.top-half_band)
      drawLine(ctx_m, 0, matrix_canvas.attr('height')-half_band, margin.left-half_band+width, matrix_canvas.attr('height')-half_band)
    } else if(offset_y == 0) {
      drawLine(ctx_m, 0, margin.top-half_band, margin.left-half_band+width, margin.top-half_band)
    } else if(offset_y == height+margin.top-half_band-document.getElementById('matrix-container').clientHeight) {
      drawLine(ctx_m, 0, document.getElementById('matrix-container').clientHeight-1, margin.left-half_band+width, document.getElementById('matrix-container').clientHeight-1)
    }
  }
  paint()

  document.getElementById('order').addEventListener('change', function() {
    order = orders[this.value]
    x_scale.domain(order)
    paint()
  })

  document.getElementById('hover').addEventListener('mousedown', function(e) {
    if(!(matrix_canvas.attr('width') < document.getElementById('matrix-container').clientWidth && matrix_canvas.attr('height') < document.getElementById('matrix-container').clientHeight)) {
      drag = true
      last_x = e.clientX
      last_y = e.clientY
      hover_canvas.style('cursor', 'grab')
    }
  })

  document.getElementById('hover').addEventListener('mouseleave', function() { drag = false })
  document.getElementById('hover').addEventListener('mouseout', function() { drag = false })
  document.getElementById('hover').addEventListener('mouseup', function() { drag = false; hover_canvas.style('cursor', 'default'); })

  document.getElementById('hover').addEventListener('mousemove', function(e) {
    ctx_h.clearRect(0,0,hover_canvas.attr('width'), hover_canvas.attr('height'))

    if(!(matrix_canvas.attr('width') < document.getElementById('matrix-container').clientWidth && matrix_canvas.attr('height') < document.getElementById('matrix-container').clientHeight)) { hover_canvas.style('cursor', 'grab') }

    if(drag) {
      offset_y += last_y - e.clientY
      offset_x += last_x - e.clientX
      last_x = e.clientX
      last_y = e.clientY

      if(offset_x < 0 || matrix_canvas.attr('width') < document.getElementById('matrix-container').clientWidth) { offset_x = 0 }
      else if(width+margin.left-half_band-offset_x < document.getElementById('matrix-container').clientWidth) { offset_x = width+margin.left-half_band - document.getElementById('matrix-container').clientWidth }

      if(offset_y < 0 || matrix_canvas.attr('height') < document.getElementById('matrix-container').clientHeight) { offset_y = 0 }
      else if(height+margin.top-half_band-offset_y < document.getElementById('matrix-container').clientHeight) { offset_y= height+margin.top-half_band-document.getElementById('matrix-container').clientHeight}

      paint()
    } else {
      var pad_x = offset_x % x_scale.step()
      var pad_y = offset_y % x_scale.step()

      var real_x = Math.trunc(((e.offsetX - margin.left + half_band + pad_x) / x_scale.step()))
      var real_y = Math.trunc(((e.offsetY - margin.top + half_band + pad_y) / x_scale.step()))

      var name_x = real_x + Math.trunc(offset_x/x_scale.step())
      var name_y = real_y + Math.trunc(offset_y/x_scale.step())

      var x = margin.left - half_band +(real_x * x_scale.step()) - pad_x
      var y = margin.top - half_band +(real_y * x_scale.step()) - pad_y

      if(e.offsetY+half_band>margin.top) {
        text_width = (ctx_l.measureText(nodes[order[name_y]].name).width)
        if(e.offsetX>margin.left-text_width-bandwidth-half_band) {
          ctx_h.fillStyle='white'
          ctx_h.strokeStyle='white'
          if(real_y>0 || pad_y == 0) { drawLine(ctx_h, margin.left-half_band, y, width+margin.left-half_band, y) }
          drawLine(ctx_h, margin.left-half_band, y+bandwidth, width+margin.left-half_band, y+bandwidth)
          ctx_h.fillRect(margin.left-text_width-bandwidth-half_band, y-ctx_h.lineWidth, text_width+bandwidth, bandwidth+(ctx_h.lineWidth*2))
          ctx_h.textBaseline= 'middle'
          ctx_h.textAlign= 'end'
          ctx_h.fillStyle='black'
          ctx_h.fillText(nodes[order[name_y]].name, margin.left-bandwidth,y+half_band+text_offset)
        }
      }
      if(e.offsetX+half_band>margin.left) {
        text_width = (ctx_l.measureText(nodes[order[name_x]].name).width)
        if(e.offsetY > margin.top-text_width-bandwidth-half_band){
          ctx_h.fillStyle='white'
          ctx_h.strokeStyle='white'
          if(real_x>0 || pad_x == 0) { drawLine(ctx_h, x, margin.top-half_band, x, height+margin.top-half_band) }
          drawLine(ctx_h, x+bandwidth, margin.top-half_band, x+bandwidth, height+margin.top-half_band)
          ctx_h.fillRect(x-ctx_h.lineWidth, margin.top-text_width-bandwidth-half_band, bandwidth+(ctx_h.lineWidth*2), text_width+bandwidth)
          ctx_h.rotate(-90*Math.PI/180)
          ctx_h.textAlign= 'start'
          ctx_h.textBaseline = 'middle'
          ctx_h.fillStyle = 'black'
          ctx_h.fillText(nodes[order[name_x]].name, -margin.top+bandwidth,x+half_band+text_offset)
          ctx_h.rotate(90*Math.PI/180)
        }
      }
      if((e.offsetX+half_band)>margin.left && (e.offsetY+half_band)>margin.top) {
        var title_txt = function(el) {
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
              return nodes[el.x].name + ' x ' + nodes[el.y].name
          }
          return ''
        }(matrix[order[name_x]][order[name_y]])
        if(title_txt) {
          ctx_h.fillStyle = 'white'
          var rect_x = x+bandwidth+half_band
          var rect_y = y+bandwidth+half_band
          var rect_width = ctx_h.measureText(title_txt).width+bandwidth
          var rect_height = bandwidth*1.75
          if(x > (document.getElementById('matrix-container').clientWidth-margin.left)/2) { rect_x -= ((bandwidth+half_band)*2)+rect_width }
          if(rect_x <= 0) { rect_x = 6 }
          if(y > (document.getElementById('matrix-container').clientHeight-margin.top)/2) { rect_y -= ((bandwidth+half_band)*2)+rect_height }
          if(rect_y <= 0) { rect_x = 6}
          ctx_h.fillRect(rect_x, rect_y, rect_width, rect_height)
          ctx_h.fillStyle= 'black'
          ctx_h.fillText(title_txt, rect_x+half_band, rect_y+bandwidth)
        }
      }
    }
  })
