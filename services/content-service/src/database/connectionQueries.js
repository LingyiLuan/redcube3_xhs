const pool = require('../config/database');

/**
 * Save connections to database
 */
async function saveConnections(connections, analyses) {
  const savedConnections = [];

  for (const connection of connections) {
    const post1Id = analyses[connection.post1_index].id;
    const post2Id = analyses[connection.post2_index].id;

    try {
      const query = `
        INSERT INTO analysis_connections
        (post1_id, post2_id, connection_type, strength, insights, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (post1_id, post2_id) DO UPDATE SET
          connection_type = $3,
          strength = $4,
          insights = $5,
          metadata = $6
        RETURNING id, created_at
      `;

      const values = [
        post1Id,
        post2Id,
        connection.connection_types.join(','),
        connection.strength,
        connection.insights,
        JSON.stringify({ connection_types: connection.connection_types })
      ];

      const result = await pool.query(query, values);
      savedConnections.push({
        ...connection,
        id: result.rows[0].id,
        post1_id: post1Id,
        post2_id: post2Id,
        createdAt: result.rows[0].created_at
      });
    } catch (error) {
      console.error('Error saving connection:', error);
    }
  }

  return savedConnections;
}

/**
 * Get connections for a specific analysis
 */
async function getConnectionsForAnalysis(analysisId, includeDetails = false) {
  const query = `
    SELECT
      ac.*,
      ar1.company as post1_company,
      ar1.role as post1_role,
      ar1.original_text as post1_text,
      ar2.company as post2_company,
      ar2.role as post2_role,
      ar2.original_text as post2_text
    FROM analysis_connections ac
    JOIN analysis_results ar1 ON ac.post1_id = ar1.id
    JOIN analysis_results ar2 ON ac.post2_id = ar2.id
    WHERE ac.post1_id = $1 OR ac.post2_id = $1
    ORDER BY ac.strength DESC
  `;

  const result = await pool.query(query, [analysisId]);

  return result.rows.map(row => ({
    id: row.id,
    strength: parseFloat(row.strength),
    connection_types: row.connection_type.split(','),
    insights: row.insights,
    metadata: JSON.parse(row.metadata || '{}'),
    created_at: row.created_at,
    connected_post: {
      id: row.post1_id === parseInt(analysisId) ? row.post2_id : row.post1_id,
      company: row.post1_id === parseInt(analysisId) ? row.post2_company : row.post1_company,
      role: row.post1_id === parseInt(analysisId) ? row.post2_role : row.post1_role,
      text: includeDetails ?
            (row.post1_id === parseInt(analysisId) ? row.post2_text : row.post1_text) :
            undefined
    }
  }));
}

/**
 * Get connection network for visualization
 */
async function getConnectionNetwork(userId, minStrength = 0.3, limit = 50) {
  let whereClause = 'WHERE ac.strength >= $1';
  let queryParams = [minStrength];

  if (userId) {
    whereClause += ` AND (ar1.user_id = $${queryParams.length + 1} OR ar2.user_id = $${queryParams.length + 1})`;
    queryParams.push(userId);
  }

  const query = `
    SELECT
      ac.id,
      ac.post1_id,
      ac.post2_id,
      ac.connection_type,
      ac.strength,
      ac.insights,
      ar1.company as post1_company,
      ar1.role as post1_role,
      ar1.sentiment as post1_sentiment,
      ar2.company as post2_company,
      ar2.role as post2_role,
      ar2.sentiment as post2_sentiment
    FROM analysis_connections ac
    JOIN analysis_results ar1 ON ac.post1_id = ar1.id
    JOIN analysis_results ar2 ON ac.post2_id = ar2.id
    ${whereClause}
    ORDER BY ac.strength DESC
    LIMIT $${queryParams.length + 1}
  `;

  queryParams.push(limit);

  const result = await pool.query(query, queryParams);

  // Build nodes and edges for network visualization
  const nodesMap = new Map();
  const edges = [];

  result.rows.forEach(row => {
    // Add nodes
    if (!nodesMap.has(row.post1_id)) {
      nodesMap.set(row.post1_id, {
        id: row.post1_id,
        company: row.post1_company,
        role: row.post1_role,
        sentiment: row.post1_sentiment
      });
    }

    if (!nodesMap.has(row.post2_id)) {
      nodesMap.set(row.post2_id, {
        id: row.post2_id,
        company: row.post2_company,
        role: row.post2_role,
        sentiment: row.post2_sentiment
      });
    }

    // Add edge
    edges.push({
      id: row.id,
      source: row.post1_id,
      target: row.post2_id,
      strength: parseFloat(row.strength),
      type: row.connection_type,
      insights: row.insights
    });
  });

  const nodes = Array.from(nodesMap.values());

  return {
    nodes,
    edges,
    total_nodes: nodes.length,
    total_edges: edges.length,
    network_density: nodes.length > 1 ? edges.length / (nodes.length * (nodes.length - 1) / 2) : 0
  };
}

module.exports = {
  saveConnections,
  getConnectionsForAnalysis,
  getConnectionNetwork
};