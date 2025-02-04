function displayTooltip(data, name, attrPath) {
  const cmp = document.getElementById("node-info");
  cmp.innerHTML = `
    <p><b>Attribute Name:</b> ${name}</p>
    <div id="attribute-tree-data">
    <div class="tree-data-field">
        <div class="key-field"><small><b>Attribute path</b></small></div>
        <div class="value-field"><small>${attrPath}</small></div>
    </div>
    <div class="tree-data-field">
        <div class="key-field"><small><b>Required</b></small></div>
        <div class="value-field"><small>${
          data["_required"] || data["required"]
        }</small></div>
    </div>
    <div class="tree-data-field">
        <div class="key-field"><small><b>Sample Usage</b></small></div>
        <div class="value-field"><small>${
          data["_usage"] || data["usage"]
        }</small></div>
    </div>
    <div class="tree-data-field">
        <div class="key-field"><small><b>Owner</b></small></div>
        <div class="value-field"><small>${
          data["_owner"] || data["owner"]
        }</small></div>
    </div>
    <div class="tree-data-field">
        <div class="key-field"><small><b>Type</b></small></div>
        <div class="value-field"><small>${
          data["_type"] || data["type"]
        }</small></div>
    </div>
    <div class="tree-data-field">
        <div class="key-field"><small><b>Description</b></small></div>
        <div class="value-field"><small>${
          data["_description"] || data["description"]
        }</small></div>
    </div>
    </div>`;
  cmp.style.display = "flex";
}

function displayAttributeTree(payload) {
  function formatdataForTree(data, preKey = "") {
    const noOfKeys = Object.keys(data).length;
    if (
      ("required" in data &&
        "type" in data &&
        "owner" in data &&
        "usage" in data &&
        "description" in data &&
        noOfKeys === 5) ||
      ("_required" in data &&
        "_type" in data &&
        "_owner" in data &&
        "_usage" in data &&
        "_description" in data &&
        noOfKeys === 5)
    ) {
      return { leafNode: true, children: false, _info: false };
    }

    const allObj = [];

    Object.entries(data).forEach(([key, value]) => {
      const tempObj = {};
      tempObj.name = key;
      tempObj.attrPath = preKey.length ? preKey + "." + key : key;

      if (typeof value === "object" && key !== "_description") {
        const response = formatdataForTree(value, tempObj.attrPath);
        if (response.leafNode) {
          tempObj.tooltip = value;
        } else if (response.children && response._info) {
          tempObj._children = response.children;
          tempObj._info = response._info;
        } else {
          tempObj._children = response.children;
        }

        allObj.push(tempObj);
      }
    });

    if ("_description" in data) {
      const info = {
        required: data._description["required"],
        type: data._description["type"],
        owner: data._description["owner"],
        usage: data._description["usage"],
        description: data._description["description"],
      };
      return { leafNode: false, children: allObj, _info: info };
    }

    if (
      ("required" in data &&
        "type" in data &&
        "owner" in data &&
        "usage" in data &&
        "description" in data &&
        noOfKeys > 5) ||
      ("_required" in data &&
        "_type" in data &&
        "_owner" in data &&
        "_usage" in data &&
        "_description" in data &&
        noOfKeys > 5)
    ) {
      const info = {
        required: data["_required"] || data["required"],
        type: data["_type"] || data["type"],
        owner: data["_owner"] || data["owner"],
        usage: data["_usage"] || data["usage"],
        description: data["_description"] || data["description"],
      };
      return { leafNode: false, children: allObj, _info: info };
    }

    return { leafNode: false, children: allObj, _info: false };
  }

  //   function formatdataForTree(data) {
  //     if (
  //       "required" in data &&
  //       "type" in data &&
  //       "owner" in data &&
  //       "usage" in data &&
  //       "description" in data
  //     ) {
  //       return [];
  //     }

  //     const allObj = [];

  //     Object.entries(data).forEach(([key, value]) => {
  //       const tempObj = {};
  //       tempObj.name = key;

  //       if (typeof value === "object") {
  //         const returnedObjArray = formatdataForTree(value);
  //         if (returnedObjArray.length === 0) {
  //           tempObj.tooltip = value;
  //         } else {
  //           tempObj.children = returnedObjArray;
  //         }
  //       } else {
  //         tempObj.value = value;
  //       }

  //       allObj.push(tempObj);
  //     });

  //     return allObj;
  //   }

  const childrenData = formatdataForTree(payload);
  var treeData = { name: "payload", _children: childrenData.children };
  console.log("treeData", treeData);

  // Get JSON data
  // treeJSON = d3.json("flare.json", function (error, treeData) {
  // Calculate total nodes, max label length
  var totalNodes = 0;
  var maxLabelLength = 0;
  // variables for drag/drop
  var selectedNode = null;
  var draggingNode = null;
  // panning variables
  var panSpeed = 400;
  var panBoundary = 20; // Within 20px from edges will pan when dragging.
  // Misc. variables
  var i = 0;
  var duration = 750;
  var root;

  // size of the diagram
  // var viewerWidth = $(document).width();
  // var viewerHeight = $(document).height();
  // var viewerWidth = $(document).width();
  // var viewerHeight = $(document).height();
  var viewerWidth = 640;
  var viewerHeight = 400;

  var tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

  // define a d3 diagonal projection for use by the node paths later on.
  var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
  });

  // A recursive helper function for performing some setup by walking through all nodes

  function visit(parent, visitFn, childrenFn) {
    if (!parent) return;

    visitFn(parent);

    var children = childrenFn(parent);
    if (children) {
      var count = children.length;
      for (var i = 0; i < count; i++) {
        visit(children[i], visitFn, childrenFn);
      }
    }
  }

  // Call visit function to establish maxLabelLength
  visit(
    treeData,
    function (d) {
      totalNodes++;
      maxLabelLength = Math.max(d.name?.length || 0.1, maxLabelLength);
    },
    function (d) {
      return d.children && d.children.length > 0 ? d.children : null;
    }
  );

  // sort the tree according to the node names

  function sortTree() {
    tree.sort(function (a, b) {
      return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
    });
  }
  // Sort the tree initially incase the JSON isn't in a sorted order.
  sortTree();

  // TODO: Pan function, can be better implemented.

  function pan(domNode, direction) {
    var speed = panSpeed;
    if (panTimer) {
      clearTimeout(panTimer);
      translateCoords = d3.transform(svgGroup.attr("transform"));
      if (direction == "left" || direction == "right") {
        translateX =
          direction == "left"
            ? translateCoords.translate[0] + speed
            : translateCoords.translate[0] - speed;
        translateY = translateCoords.translate[1];
      } else if (direction == "up" || direction == "down") {
        translateX = translateCoords.translate[0];
        translateY =
          direction == "up"
            ? translateCoords.translate[1] + speed
            : translateCoords.translate[1] - speed;
      }
      scaleX = translateCoords.scale[0];
      scaleY = translateCoords.scale[1];
      scale = zoomListener.scale();
      svgGroup
        .transition()
        .attr(
          "transform",
          "translate(" + translateX + "," + translateY + ")scale(" + scale + ")"
        );
      d3.select(domNode)
        .select("g.node")
        .attr("transform", "translate(" + translateX + "," + translateY + ")");
      zoomListener.scale(zoomListener.scale());
      zoomListener.translate([translateX, translateY]);
      panTimer = setTimeout(function () {
        pan(domNode, speed, direction);
      }, 50);
    }
  }

  // Define the zoom function for the zoomable tree

  function zoom() {
    svgGroup.attr(
      "transform",
      "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
    );
  }

  // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
  var zoomListener = d3.behavior.zoom().scaleExtent([1, 3]).on("zoom", zoom);

  function initiateDrag(d, domNode) {
    draggingNode = d;
    d3.select(domNode).select(".ghostCircle").attr("pointer-events", "none");
    d3.selectAll(".ghostCircle").attr("class", "ghostCircle show");
    d3.select(domNode).attr("class", "node activeDrag");

    svgGroup.selectAll("g.node").sort(function (a, b) {
      // select the parent and sort the path's
      if (a.id != draggingNode.id)
        return 1; // a is not the hovered element, send "a" to the back
      else return -1; // a is the hovered element, bring "a" to the front
    });
    // if nodes has children, remove the links and nodes
    if (nodes.length > 1) {
      // remove link paths
      links = tree.links(nodes);
      nodePaths = svgGroup
        .selectAll("path.link")
        .data(links, function (d) {
          return d.target.id;
        })
        .remove();
      // remove child nodes
      nodesExit = svgGroup
        .selectAll("g.node")
        .data(nodes, function (d) {
          return d.id;
        })
        .filter(function (d, i) {
          if (d.id == draggingNode.id) {
            return false;
          }
          return true;
        })
        .remove();
    }

    // remove parent link
    parentLink = tree.links(tree.nodes(draggingNode.parent));
    svgGroup
      .selectAll("path.link")
      .filter(function (d, i) {
        if (d.target.id == draggingNode.id) {
          return true;
        }
        return false;
      })
      .remove();

    dragStarted = null;
  }

  // define the baseSvg, attaching a class for styling and the zoomListener
  var baseSvg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", viewerWidth)
    .attr("height", viewerHeight)
    .attr("class", "overlay")
    .call(zoomListener);

  // Define the drag listeners for drag/drop behaviour of nodes.
  dragListener = d3.behavior
    .drag()
    .on("dragstart", function (d) {
      if (d == root) {
        return;
      }
      dragStarted = true;
      nodes = tree.nodes(d);
      d3.event.sourceEvent.stopPropagation();
      // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
    })
    .on("drag", function (d) {
      if (d == root) {
        return;
      }
      if (dragStarted) {
        domNode = this;
        initiateDrag(d, domNode);
      }

      // get coords of mouseEvent relative to svg container to allow for panning
      relCoords = d3.mouse($("svg").get(0));
      if (relCoords[0] < panBoundary) {
        panTimer = true;
        pan(this, "left");
      } else if (relCoords[0] > $("svg").width() - panBoundary) {
        panTimer = true;
        pan(this, "right");
      } else if (relCoords[1] < panBoundary) {
        panTimer = true;
        pan(this, "up");
      } else if (relCoords[1] > $("svg").height() - panBoundary) {
        panTimer = true;
        pan(this, "down");
      } else {
        try {
          clearTimeout(panTimer);
        } catch (e) {}
      }

      d.x0 += d3.event.dy;
      d.y0 += d3.event.dx;
      var node = d3.select(this);
      node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
      updateTempConnector();
    })
    .on("dragend", function (d) {
      if (d == root) {
        return;
      }
      domNode = this;
      if (selectedNode) {
        // now remove the element from the parent, and insert it into the new elements children
        var index = draggingNode.parent.children.indexOf(draggingNode);
        if (index > -1) {
          draggingNode.parent.children.splice(index, 1);
        }
        if (
          typeof selectedNode.children !== "undefined" ||
          typeof selectedNode._children !== "undefined"
        ) {
          if (typeof selectedNode.children !== "undefined") {
            selectedNode.children.push(draggingNode);
          } else {
            selectedNode._children.push(draggingNode);
          }
        } else {
          selectedNode.children = [];
          selectedNode.children.push(draggingNode);
        }
        // Make sure that the node being added to is expanded so user can see added node is correctly moved
        expand(selectedNode);
        sortTree();
        endDrag();
      } else {
        endDrag();
      }
    });

  function endDrag() {
    selectedNode = null;
    d3.selectAll(".ghostCircle").attr("class", "ghostCircle");
    d3.select(domNode).attr("class", "node");
    // now restore the mouseover event or we won't be able to drag a 2nd time
    d3.select(domNode).select(".ghostCircle").attr("pointer-events", "");
    updateTempConnector();
    if (draggingNode !== null) {
      update(root);
      centerNode(draggingNode);
      draggingNode = null;
    }
  }

  // Helper functions for collapsing and expanding nodes.

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function expand(d) {
    if (d._children) {
      d.children = d._children;
      d.children.forEach(expand);
      d._children = null;
    }
  }

  var overCircle = function (d) {
    selectedNode = d;
    updateTempConnector();
  };
  var outCircle = function (d) {
    selectedNode = null;
    updateTempConnector();
  };

  // Function to update the temporary connector indicating dragging affiliation
  var updateTempConnector = function () {
    var data = [];
    if (draggingNode !== null && selectedNode !== null) {
      // have to flip the source coordinates since we did this for the existing connectors on the original tree
      data = [
        {
          source: {
            x: selectedNode.y0,
            y: selectedNode.x0,
          },
          target: {
            x: draggingNode.y0,
            y: draggingNode.x0,
          },
        },
      ];
    }
    var link = svgGroup.selectAll(".templink").data(data);

    link
      .enter()
      .append("path")
      .attr("class", "templink")
      .attr("d", d3.svg.diagonal())
      .attr("pointer-events", "none");

    link.attr("d", d3.svg.diagonal());

    link.exit().remove();
  };

  // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

  function centerNode(source) {
    scale = zoomListener.scale();
    x = -source.y0;
    y = -source.x0;
    x = x * scale + viewerWidth / 2;
    y = y * scale + viewerHeight / 2;
    d3.select("g")
      .transition()
      .duration(duration)
      .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
  }

  // Toggle children function

  function toggleChildren(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    return d;
  }

  // Toggle children on click.

  function click(d) {
    if (d3.event.defaultPrevented) return; // click suppressed
    d = toggleChildren(d);
    update(d);
    centerNode(d);
  }

  function update(source) {
    // Compute the new height, function counts total children of root node and sets tree height accordingly.
    // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
    // This makes the layout more consistent.
    var levelWidth = [1];
    var childCount = function (level, n) {
      if (n.children && n.children.length > 0) {
        if (levelWidth.length <= level + 1) levelWidth.push(0);

        levelWidth[level + 1] += n.children.length;
        n.children.forEach(function (d) {
          childCount(level + 1, d);
        });
      }
    };
    childCount(0, root);
    var newHeight = d3.max(levelWidth) * 45; // 25 pixels per line
    tree = tree.size([newHeight, viewerWidth]);

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Set widths between levels based on maxLabelLength.
    nodes.forEach(function (d) {
      d.y = d.depth * 100; //maxLabelLength * 10px
      // alternatively to keep a fixed scale one can set a fixed depth per level
      // Normalize for fixed-depth by commenting out below line
      // d.y = (d.depth * 500); //500px per level.
    });

    // Update the nodes…
    node = svgGroup.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append("g")
      // .call(dragListener)
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", click);

    nodeEnter
      .append("circle")
      .attr("class", "nodeCircle")
      .attr("r", 0)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    nodeEnter
      .append("text")
      .attr("x", function (d) {
        return d.children || d._children ? -10 : 10;
      })
      .attr("dy", ".35em")
      .attr("class", "nodeText")
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return d.name;
      })
      .style("fill-opacity", 0);

    // phantom node to give us mouseover in a radius around it
    nodeEnter
      .append("circle")
      .attr("class", "ghostCircle")
      .attr("r", 30)
      .attr("opacity", 0.2) // change this to zero to hide the target area
      .style("fill", "red")
      .attr("pointer-events", "mouseover")
      .on("mouseover", function (node) {
        overCircle(node);
      })
      .on("mouseout", function (node) {
        outCircle(node);
      });

    // Update the text to reflect whether node has children or not.
    node
      .select("text")
      .attr("x", function (d) {
        return d.children || d._children ? -10 : 10;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return d.name;
      });

    // Change the circle fill depending on whether it has children and is collapsed
    node
      .select("circle.nodeCircle")
      .attr("r", 4.5)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    node
      .select("circle")
      .style("fill", function (d) {
        return d?.tooltip?.required === "Mandatory" ||
          d?.tooltip?._required === "Mandatory"
          ? "blue"
          : d?.tooltip?.required === "Optional" ||
            d?.tooltip?._required === "Optional"
          ? "yellow"
          : d._info
          ? "green"
          : "#fff";
      })
      .on("mouseover", function (d) {
        if (d.tooltip || d._info) {
            displayTooltip(d.tooltip || d._info, d.name, d.attrPath);
        }
      });
    //   .on("mouseout", function (d) {
    //     const cmp = document.getElementById("node-info")
    //     cmp.innerHTML = ''
    //     cmp.style.display = "none"
    //   });

    // Transition nodes to their new position.
    var nodeUpdate = node
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Fade the text in
    nodeUpdate.select("text").style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select("circle").attr("r", 0);

    nodeExit.select("text").style("fill-opacity", 0);

    // Update the links…
    var link = svgGroup.selectAll("path.link").data(links, function (d) {
      return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = {
          x: source.x0,
          y: source.y0,
        };
        return diagonal({
          source: o,
          target: o,
        });
      });

    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = {
          x: source.x,
          y: source.y,
        };
        return diagonal({
          source: o,
          target: o,
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Append a group which holds all nodes and which the zoom Listener can act upon.
  var svgGroup = baseSvg.append("g");

  // Define the root
  root = treeData;
  root.x0 = viewerHeight / 2;
  root.y0 = 0;

  // Layout the tree initially and center on the root node.
  update(root);
  centerNode(root);
}
