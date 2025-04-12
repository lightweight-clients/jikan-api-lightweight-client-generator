import * as fs from 'node:fs';
import { createClient } from '@hey-api/openapi-ts';
import { OpenApi } from './types';
import { ensure } from './utils/ensure';
import * as path from 'node:path';
import { generateCustomClient } from './client-generator.mjs';

const SPECIFICATION_URL = 'https://raw.githubusercontent.com/jikan-me/jikan-rest/master/storage/api-docs/api-docs.json';
const TMP_DIR = path.resolve('./.tmp/client');
const OUTPUT_DIR = path.resolve('./output');

export const generate = async () => {
    const openApi = await fetch(SPECIFICATION_URL).then(x => x.json());
    ensure(openApi && typeof openApi === 'object');
    ensure('paths' in openApi);

    await createClient({
        input: openApi,
        output: TMP_DIR,
        client: 'fetch',
    });
    console.log('Client generated');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.copyFileSync('./src/templates/index.ts', `${OUTPUT_DIR}/index.ts`);
    fs.copyFileSync('./src/templates/core.ts', `${OUTPUT_DIR}/core.ts`);
    fs.copyFileSync(`${TMP_DIR}/types.gen.ts`, `${OUTPUT_DIR}/types.ts`);

    const clientContent = await generateCustomClient(openApi as OpenApi);
    fs.writeFileSync(`${OUTPUT_DIR}/client.ts`, clientContent);
};

await generate()
console.log('Done');