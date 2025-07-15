import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NetworkGraph = ({ graphData }) => {
  const graphRef = useRef();

  useEffect(() => {
    if (graphRef.current) {
      // Auto-zoom to fit
      graphRef.current.zoomToFit(400);
    }
  }, [graphData]);

  const graphDataFormatted = {
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      name: node.label,
      color: node.color,
      val: node.size
    })),
    links: graphData.edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      color: edge.color,
      width: edge.width,
      label: edge.label
    }))
  };

  return (
    <div className="chart-container" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
      <h3 className="chart-title">Transaction Network Graph</h3>
      <div style={{ height: '500px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphDataFormatted}
          nodeLabel="name"
          nodeColor="color"
          linkColor="color"
          linkWidth="width"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            
            // Draw node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val / 5, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x, node.y + node.val / 5 + fontSize);
          }}
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link, ctx) => {
            const start = link.source;
            const end = link.target;
            
            // Draw link label (amount)
            if (link.label) {
              const textPos = {
                x: start.x + (end.x - start.x) * 0.5,
                y: start.y + (end.y - start.y) * 0.5
              };
              
              ctx.font = '10px Sans-Serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'white';
              ctx.fillText(link.label, textPos.x, textPos.y);
            }
          }}
        />
      </div>
      <div style={{ marginTop: '10px', color: '#cbd5e1', fontSize: '0.9rem' }}>
        <span style={{ color: '#ef4444' }}>● Fraud</span> | 
        <span style={{ color: '#22c55e' }}> ● Legitimate</span> | 
        <span style={{ color: '#3b82f6' }}> ● Transaction Flow</span>
      </div>
    </div>
  );
};

export default NetworkGraph;