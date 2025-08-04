#!/usr/bin/env node
/**
 * Node.js Tenable Testing Client
 * Tests Tenable integration using local mock server
 */

import axios, { AxiosInstance } from 'axios';

class MockTenableClient {
    private baseURL: string;
    private client: AxiosInstance;
    
    constructor() {
        this.baseURL = 'http://localhost:5001';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'RAS-DASH-Test/1.0.0'
            }
        });
    }
    
    async testConnection() {
        try {
            const response = await this.client.get('/session');
            return response.data;
        } catch (error: any) {
            throw new Error(`Connection failed: ${error.message}`);
        }
    }
    
    async getAssets() {
        try {
            const response = await this.client.get('/assets');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get assets: ${error.message}`);
        }
    }
    
    async getVulnerabilities() {
        try {
            const response = await this.client.get('/workbenches/vulnerabilities');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get vulnerabilities: ${error.message}`);
        }
    }
    
    async exportAssets() {
        try {
            // Start export
            const exportResponse = await this.client.post('/assets/export', {});
            const exportUuid = exportResponse.data.export_uuid;
            
            console.log(`Asset export started: ${exportUuid}`);
            
            // Get export status
            const statusResponse = await this.client.get(`/assets/export/${exportUuid}/status`);
            console.log(`Export status: ${statusResponse.data.status}`);
            
            // Download chunks
            const allAssets = [];
            let chunkId = 1;
            
            while (true) {
                try {
                    const chunkResponse = await this.client.get(`/assets/export/${exportUuid}/chunks/${chunkId}`);
                    const chunk = chunkResponse.data;
                    
                    if (!chunk || chunk.length === 0) {
                        break;
                    }
                    
                    allAssets.push(...chunk);
                    console.log(`Downloaded chunk ${chunkId} with ${chunk.length} assets`);
                    chunkId++;
                    
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        // No more chunks
                        break;
                    }
                    throw error;
                }
            }
            
            return allAssets;
            
        } catch (error: any) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }
}

async function runTests() {
    try {
        const client = new MockTenableClient();
        
        console.log("=== Testing Connection ===");
        const userInfo = await client.testConnection();
        console.log(`✅ Connected as: ${userInfo.email}`);
        
        console.log("\n=== Testing Asset Retrieval ===");
        const assets = await client.getAssets();
        console.log(`✅ Retrieved ${assets.assets.length} assets`);
        
        console.log("\n=== Testing Vulnerability Data ===");
        const vulns = await client.getVulnerabilities();
        console.log(`✅ Retrieved vulnerability data for ${vulns.vulnerabilities.length} categories`);
        
        console.log("\n=== Testing Asset Export ===");
        const exportedAssets = await client.exportAssets();
        console.log(`✅ Exported ${exportedAssets.length} total assets`);
        
        console.log("\n🎉 All tests passed!");
        
    } catch (error: any) {
        console.error(`❌ Test failed: ${error.message}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

export { MockTenableClient };
