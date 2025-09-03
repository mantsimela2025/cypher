const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const OpenAI = require('openai');

// ✅ Following API Development Best Practices Guide - Service Pattern

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class DiagramsService {
  constructor() {
    this.diagramsDir = path.join(__dirname, '../../diagrams');
    this.ensureDirectoryExists(this.diagramsDir);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Generate diagram from assets using AI + Mermaid.js
   */
  async generateDiagram({ assets, diagramType, options, userId }) {
    try {
      console.log(`🤖 Using AI to infer relationships for ${diagramType} diagram...`);

      // Step 1: Use AI to infer relationships and zones
      const aiAnalysis = await this.analyzeAssetsWithAI(assets, diagramType);

      // Step 2: Generate Mermaid syntax
      const mermaidSyntax = this.generateMermaidSyntax(aiAnalysis, diagramType);

      // Step 3: Create diagram record
      const diagram = {
        id: this.generateId(),
        userId,
        name: `${diagramType} Diagram - ${new Date().toLocaleDateString()}`,
        type: diagramType,
        assets: assets.map(a => ({ id: a.assetUuid, name: a.hostname || a.netbiosName })),
        mermaidSyntax,
        aiAnalysis,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Step 4: Save diagram (in production, save to database)
      await this.saveDiagram(diagram);

      console.log(`✅ Generated ${diagramType} diagram with ${assets.length} assets`);

      return {
        id: diagram.id,
        name: diagram.name,
        type: diagram.type,
        mermaidSyntax: diagram.mermaidSyntax,
        preview: await this.generatePreviewSVG(mermaidSyntax),
        assets: diagram.assets,
        createdAt: diagram.createdAt
      };
    } catch (error) {
      console.error('❌ Error generating diagram:', error);
      throw new Error(`Failed to generate diagram: ${error.message}`);
    }
  }

  /**
   * Use OpenAI to analyze assets and infer relationships
   */
  async analyzeAssetsWithAI(assets, diagramType) {
    const prompt = this.buildAIPrompt(assets, diagramType);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert specializing in network architecture and asset relationships. Generate structured diagram data based on asset information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.warn('⚠️ AI analysis failed, using fallback logic:', error.message);
      return this.generateFallbackAnalysis(assets, diagramType);
    }
  }

  buildAIPrompt(assets, diagramType) {
    const assetInfo = assets.map(asset => ({
      id: asset.assetUuid.substring(0, 8),
      name: asset.hostname || asset.netbiosName || 'Unknown',
      type: asset.systemType || 'Unknown',
      os: asset.operatingSystem || 'Unknown',
      ip: asset.ipv4Address || 'N/A',
      source: asset.source || 'Unknown'
    }));

    const prompts = {
      boundary: `Analyze these assets and create a boundary diagram showing security zones (DMZ, Internal, External, etc.).
Assets: ${JSON.stringify(assetInfo, null, 2)}

Return JSON with:
{
  "zones": [{"name": "DMZ", "assets": ["asset1", "asset2"], "color": "#ff6b6b"}],
  "connections": [{"from": "asset1", "to": "asset2", "label": "HTTPS", "type": "flow"}],
  "boundaries": [{"name": "Firewall", "separates": ["DMZ", "Internal"]}]
}`,

      network: `Analyze these assets and create a network diagram showing connections and protocols.
Assets: ${JSON.stringify(assetInfo, null, 2)}

Return JSON with:
{
  "nodes": [{"id": "asset1", "label": "Web Server", "type": "server", "zone": "DMZ"}],
  "connections": [{"from": "asset1", "to": "asset2", "protocol": "TCP:443", "label": "HTTPS"}],
  "subnets": [{"name": "DMZ", "range": "10.0.1.0/24", "assets": ["asset1"]}]
}`,

      dataflow: `Analyze these assets and create a data flow diagram showing how data moves between systems.
Assets: ${JSON.stringify(assetInfo, null, 2)}

Return JSON with:
{
  "processes": [{"id": "asset1", "label": "Web App", "type": "process"}],
  "datastores": [{"id": "asset2", "label": "Database", "type": "datastore"}],
  "flows": [{"from": "asset1", "to": "asset2", "data": "User Data", "direction": "bidirectional"}],
  "external": [{"id": "users", "label": "Users", "type": "external"}]
}`,

      workflow: `Analyze these assets and create a workflow diagram showing business processes and system interactions.
Assets: ${JSON.stringify(assetInfo, null, 2)}

Return JSON with:
{
  "steps": [{"id": "step1", "asset": "asset1", "action": "Authenticate User", "type": "process"}],
  "decisions": [{"id": "decision1", "condition": "Valid User?", "asset": "asset1"}],
  "flows": [{"from": "step1", "to": "decision1", "condition": "always"}]
}`
    };

    return prompts[diagramType] || prompts.network;
  }

  generateFallbackAnalysis(assets, diagramType) {
    // Simple fallback logic when AI fails
    const zones = this.categorizeAssetsByType(assets);
    const connections = this.inferBasicConnections(assets);

    return {
      zones: Object.entries(zones).map(([name, assetList]) => ({
        name,
        assets: assetList.map(a => a.assetUuid.substring(0, 8)),
        color: this.getZoneColor(name)
      })),
      connections: connections,
      fallback: true
    };
  }

  categorizeAssetsByType(assets) {
    const zones = { External: [], DMZ: [], Internal: [], Database: [] };

    assets.forEach(asset => {
      const type = (asset.systemType || '').toLowerCase();
      const os = (asset.operatingSystem || '').toLowerCase();

      if (type.includes('web') || type.includes('http')) {
        zones.DMZ.push(asset);
      } else if (type.includes('database') || type.includes('sql') || os.includes('sql')) {
        zones.Database.push(asset);
      } else if (type.includes('server') || type.includes('application')) {
        zones.Internal.push(asset);
      } else {
        zones.Internal.push(asset);
      }
    });

    return Object.fromEntries(Object.entries(zones).filter(([_, assets]) => assets.length > 0));
  }

  inferBasicConnections(assets) {
    const connections = [];
    
    // Simple heuristic: web servers connect to databases
    const webServers = assets.filter(a => (a.systemType || '').toLowerCase().includes('web'));
    const databases = assets.filter(a => (a.systemType || '').toLowerCase().includes('database'));

    webServers.forEach(web => {
      databases.forEach(db => {
        connections.push({
          from: web.assetUuid.substring(0, 8),
          to: db.assetUuid.substring(0, 8),
          label: 'SQL',
          type: 'data'
        });
      });
    });

    return connections;
  }

  generateMermaidSyntax(analysis, diagramType) {
    switch (diagramType) {
      case 'boundary':
        return this.generateBoundaryDiagram(analysis);
      case 'network':
        return this.generateNetworkDiagram(analysis);
      case 'dataflow':
        return this.generateDataFlowDiagram(analysis);
      case 'workflow':
        return this.generateWorkflowDiagram(analysis);
      default:
        return this.generateNetworkDiagram(analysis);
    }
  }

  generateBoundaryDiagram(analysis) {
    let mermaid = 'graph TD\n';
    
    // Create subgraphs for zones
    if (analysis.zones) {
      analysis.zones.forEach(zone => {
        mermaid += `  subgraph ${zone.name}["🛡️ ${zone.name} Zone"]\n`;
        zone.assets.forEach(assetId => {
          mermaid += `    ${assetId}[${assetId}]\n`;
        });
        mermaid += '  end\n';
      });
    }

    // Add connections
    if (analysis.connections) {
      analysis.connections.forEach(conn => {
        mermaid += `  ${conn.from} -->|${conn.label}| ${conn.to}\n`;
      });
    }

    return mermaid;
  }

  generateNetworkDiagram(analysis) {
    let mermaid = 'graph TD\n';

    // Add nodes with types
    if (analysis.nodes) {
      analysis.nodes.forEach(node => {
        const icon = this.getNodeIcon(node.type);
        mermaid += `  ${node.id}["${icon} ${node.label}"]\n`;
      });
    } else if (analysis.zones) {
      // Fallback to zones structure
      analysis.zones.forEach(zone => {
        mermaid += `  subgraph ${zone.name}\n`;
        zone.assets.forEach(assetId => {
          mermaid += `    ${assetId}[${assetId}]\n`;
        });
        mermaid += '  end\n';
      });
    }

    // Add connections
    if (analysis.connections) {
      analysis.connections.forEach(conn => {
        const label = conn.protocol || conn.label || 'Connection';
        mermaid += `  ${conn.from} -->|${label}| ${conn.to}\n`;
      });
    }

    return mermaid;
  }

  generateDataFlowDiagram(analysis) {
    let mermaid = 'flowchart TD\n';

    // Add processes
    if (analysis.processes) {
      analysis.processes.forEach(proc => {
        mermaid += `  ${proc.id}["📋 ${proc.label}"]\n`;
      });
    }

    // Add data stores
    if (analysis.datastores) {
      analysis.datastores.forEach(ds => {
        mermaid += `  ${ds.id}[("💾 ${ds.label}")]\n`;
      });
    }

    // Add external entities
    if (analysis.external) {
      analysis.external.forEach(ext => {
        mermaid += `  ${ext.id}["👤 ${ext.label}"]\n`;
      });
    }

    // Add flows
    if (analysis.flows) {
      analysis.flows.forEach(flow => {
        const arrow = flow.direction === 'bidirectional' ? '<-->' : '-->';
        mermaid += `  ${flow.from} ${arrow}|${flow.data}| ${flow.to}\n`;
      });
    }

    return mermaid;
  }

  generateWorkflowDiagram(analysis) {
    let mermaid = 'flowchart TD\n';

    // Add steps
    if (analysis.steps) {
      analysis.steps.forEach(step => {
        mermaid += `  ${step.id}["📝 ${step.action}"]\n`;
      });
    }

    // Add decisions
    if (analysis.decisions) {
      analysis.decisions.forEach(decision => {
        mermaid += `  ${decision.id}{"❓ ${decision.condition}"}\n`;
      });
    }

    // Add flows
    if (analysis.flows) {
      analysis.flows.forEach(flow => {
        const label = flow.condition !== 'always' ? flow.condition : '';
        mermaid += `  ${flow.from} -->|${label}| ${flow.to}\n`;
      });
    }

    return mermaid;
  }

  getNodeIcon(type) {
    const icons = {
      server: '🖥️',
      database: '💾',
      web: '🌐',
      firewall: '🛡️',
      router: '📡',
      application: '📱',
      user: '👤',
      external: '☁️'
    };
    return icons[type] || '📦';
  }

  getZoneColor(zoneName) {
    const colors = {
      External: '#ff6b6b',
      DMZ: '#feca57',
      Internal: '#48dbfb',
      Database: '#ff9ff3',
      Secure: '#1dd1a1'
    };
    return colors[zoneName] || '#95a5a6';
  }

  async generatePreviewSVG(mermaidSyntax) {
    // For now, return the mermaid syntax as preview
    // In production, you'd use mermaid CLI to generate actual SVG
    return `data:text/plain;base64,${Buffer.from(mermaidSyntax).toString('base64')}`;
  }

  async saveDiagram(diagram) {
    const filePath = path.join(this.diagramsDir, `${diagram.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(diagram, null, 2));
  }

  async getDiagramById(diagramId, userId) {
    try {
      const filePath = path.join(this.diagramsDir, `${diagramId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const diagram = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check ownership
      if (diagram.userId !== userId) {
        return null;
      }

      return diagram;
    } catch (error) {
      console.error('Error reading diagram:', error);
      return null;
    }
  }

  async exportDiagram(diagramId, format, userId) {
    const diagram = await this.getDiagramById(diagramId, userId);
    if (!diagram) {
      throw new Error('Diagram not found');
    }

    // Write mermaid file
    const mmdPath = path.join(this.diagramsDir, `${diagramId}.mmd`);
    fs.writeFileSync(mmdPath, diagram.mermaidSyntax);

    // Generate export using mermaid CLI
    const outputPath = path.join(this.diagramsDir, `${diagramId}.${format}`);
    
    try {
      await execAsync(`mmdc -i "${mmdPath}" -o "${outputPath}"`);
      
      const buffer = fs.readFileSync(outputPath);
      const contentTypes = {
        png: 'image/png',
        pdf: 'application/pdf',
        svg: 'image/svg+xml'
      };

      // Cleanup temp files
      fs.unlinkSync(mmdPath);
      fs.unlinkSync(outputPath);

      return {
        buffer,
        contentType: contentTypes[format],
        filename: `${diagram.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`
      };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export diagram: ${error.message}`);
    }
  }

  async getUserDiagrams(userId, { page = 1, limit = 10 }) {
    try {
      const diagrams = [];
      const files = fs.readdirSync(this.diagramsDir).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        try {
          const diagram = JSON.parse(fs.readFileSync(path.join(this.diagramsDir, file), 'utf8'));
          if (diagram.userId === userId) {
            diagrams.push({
              id: diagram.id,
              name: diagram.name,
              type: diagram.type,
              assetCount: diagram.assets.length,
              createdAt: diagram.createdAt,
              updatedAt: diagram.updatedAt
            });
          }
        } catch (error) {
          console.warn(`Error reading diagram file ${file}:`, error);
        }
      }

      // Sort by creation date (newest first)
      diagrams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDiagrams = diagrams.slice(startIndex, endIndex);

      return {
        diagrams: paginatedDiagrams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: diagrams.length,
          pages: Math.ceil(diagrams.length / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user diagrams:', error);
      throw new Error('Failed to retrieve diagrams');
    }
  }

  async deleteDiagram(diagramId, userId) {
    const diagram = await this.getDiagramById(diagramId, userId);
    if (!diagram) {
      throw new Error('Diagram not found');
    }

    const filePath = path.join(this.diagramsDir, `${diagramId}.json`);
    fs.unlinkSync(filePath);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = new DiagramsService();