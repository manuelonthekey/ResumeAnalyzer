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

    // Step 1: Create Workspace
    console.log('1️⃣  Creating workspace...');
    // First, fetch the organization identifier
    const orgResponse = await axios.get(`${AFFINDA_BASE_URL}/organizations`, {
      headers: { 'Authorization': `Bearer ${AFFINDA_API_KEY}` }
    });
    const organizationId = orgResponse.data[0]?.identifier;
    if (!organizationId) throw new Error('No organization found on this Affinda account.');
    console.log(`   Found organization: ${organizationId}`);

    const wsResponse = await axios.post(
      `${AFFINDA_BASE_URL}/workspaces`,
      { name: 'ResumeFlow', organization: organizationId },
      {
        headers: {
          'Authorization': `Bearer ${AFFINDA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const workspaceId = wsResponse.data.identifier;
    console.log(`   ✅ Workspace created: ${workspaceId}`);

    // Step 2: Create Collection within the workspace
    console.log('2️⃣  Creating collection...');
    const collResponse = await axios.post(
      `${AFFINDA_BASE_URL}/collections`,
      {
        name: 'Student Resumes',
        workspace: workspaceId,
        extractorIdentifier: 'resume'
      },
      {
        headers: {
          'Authorization': `Bearer ${AFFINDA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const collectionId = collResponse.data.identifier;
    console.log(`   ✅ Collection created: ${collectionId}`);

    // Step 3: Append to .env
    const envLine = `\nAFFINDA_COLLECTION_ID="${collectionId}"\nAFFINDA_WORKSPACE_ID="${workspaceId}"\n`;
    fs.appendFileSync('.env', envLine);

    console.log('\n✅ Done! Added to your .env:');
    console.log(`   AFFINDA_WORKSPACE_ID="${workspaceId}"`);
    console.log(`   AFFINDA_COLLECTION_ID="${collectionId}"`);
    console.log('\n👉 Now restart your backend server and upload a resume!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   → Your AFFINDA_API_KEY might be invalid or expired.');
    }
    process.exit(1);
  }
}

setupAffindaWorkspace();
