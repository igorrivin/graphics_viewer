// app/api/models/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const modelsDir = path.join(process.cwd(), 'public', 'models');
    console.log('Looking for models in:', modelsDir);
    
    const allFiles = fs.readdirSync(modelsDir);
    console.log('All files found:', allFiles);
    
    const files = allFiles
      .filter(file => file.endsWith('.glb'))
      .map(file => ({
        name: file.replace('.glb', ''),
        path: `/models/${file}`
      }));
    
    console.log('Returning models:', files);
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 });
  }
}
