import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

function GraphComponent({ graphData }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.links) return;

    const nodes = new DataSet(
      graphData.nodes.map((n) => ({ id: n.id, label: n.id, shape: 'dot', color: '#0047ab' }))
    );

    const edges = new DataSet(
      graphData.links.map((e) => ({
        from: e.source,
        to: e.target,
        label: `₹${e.weight}`,
        color: { color: '#999999' },
        arrows: 'to'
      }))
    );

    const data = { nodes, edges };
    const options = {
      layout: { improvedLayout: true },
      physics: { stabilization: true },
      edges: { smooth: true },
    };

    new Network(containerRef.current, data, options);
  }, [graphData]);

  return (
    <div>
      <h2 style={{ marginTop: '30px' }}>🔗 Transaction Graph</h2>
      <div ref={containerRef} style={{ height: '400px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }} />
    </div>
  );
}

export default GraphComponent;