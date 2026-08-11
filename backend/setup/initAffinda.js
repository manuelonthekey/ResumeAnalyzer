/**
 * One-time Affinda workspace setup script.
 * Run this ONCE before starting development:
 *   node setup/initAffinda.js
 * Then copy the printed AFFINDA_COLLECTION_ID into your .env file.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const AFFINDA_API_KEY = process.env.AFFINDA_API_KEY;
const AFFINDA_BASE_URL = 'https://api.affinda.com/v3';

if (!AFFINDA_API_KEY) {
  console.error('❌ AFFINDA_API_KEY not found in .env');
  process.exit(1);
}

async function setupAffindaWorkspace() {
  try {
    console.log('🔧 Setting up Affinda workspace for ResumeFlow...\n');
    
    const headers = {
      'Authorization': `Bearer ${AFFINDA_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Step 1: Get Organization
    console.log('1️⃣  Fetching organization...');
    const orgResponse = await axios.get(`${AFFINDA_BASE_URL}/organizations`, { headers });
    const organizationId = orgResponse.data[0]?.identifier;
    if (!organizationId) throw new Error('No organization found on this Affinda account.');
    console.log(`   Found organization: ${organizationId}`);

    // Step 2: Get or Create Workspace
    console.log('2️⃣  Setting up workspace...');
    const wsListRes = await axios.get(`${AFFINDA_BASE_URL}/workspaces?organization=${organizationId}`, { headers });
    let workspaceId = wsListRes.data.find(w => w.name === 'ResumeFlow')?.identifier;
    
    if (workspaceId) {
       console.log(`   ✅ Existing Workspace found: ${workspaceId}`);
    } else {
       const wsResponse = await axios.post(
         `${AFFINDA_BASE_URL}/workspaces`,
         { name: 'ResumeFlow', organization: organizationId },
         { headers }
       );
       workspaceId = wsResponse.data.identifier;
       console.log(`   ✅ Workspace created: ${workspaceId}`);
    }

    // Step 3: Get or Create Collection
    console.log('3️⃣  Setting up collection...');
    const collListRes = await axios.get(`${AFFINDA_BASE_URL}/collections?workspace=${workspaceId}`, { headers });
    let collectionId = (collListRes.data.results || collListRes.data).find(c => c.name === 'Student Resumes')?.identifier;

    if (collectionId) {
        console.log(`   ✅ Existing Collection found: ${collectionId}`);
    } else {
        const collResponse = await axios.post(
          `${AFFINDA_BASE_URL}/collections`,
          {
            name: 'Student Resumes',
            workspace: workspaceId,
            extractor: 'resume'
          },
          { headers }
        );
        collectionId = collResponse.data.identifier;
        console.log(`   ✅ Collection created: ${collectionId}`);
    }

    console.log('\n🎉 SUCCESS! Setup complete.');
    console.log('\n=============================================================');
    console.log(`AFFINDA_COLLECTION_ID=${collectionId}`);
    console.log('=============================================================\n');
    console.log('👉 Copy the ID above into your .env file AND your Render Environment Variables.\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
    process.exit(1);
  }
}

setupAffindaWorkspace();
