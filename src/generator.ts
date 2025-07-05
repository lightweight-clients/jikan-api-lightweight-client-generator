import type { OpenApi, Parameter } from './types';
import * as config from './config.json';
import * as fs from 'node:fs';
import * as operationId from 'node:path';
import assert from 'node:assert';
import { Eta } from 'eta';
import { createClient } from '@hey-api/openapi-ts';

interface EndpointRenderData {
  name: string;
  url: string;
  description: string;
  baseEndpointName: string;
  pathParameters: Parameter[];
  hasQueryParameters: boolean;
  hasDataInResponse: boolean;
}

interface ClientRenderData {
  endpoints: EndpointRenderData[];
}

const fetchSpecification = async (): Promise<OpenApi> => {
  console.log('Fetching specification...');

  const openApiRes = await fetch(config.specification_url);
  const openApi = await openApiRes.json();
  assert(openApi && typeof openApi === 'object');
  assert('paths' in openApi);

  return openApi;
};

const getClientRenderData = (openApi: OpenApi): ClientRenderData => {
  const endpoints: EndpointRenderData[] = [];
  for (const [url, methods] of Object.entries(openApi.paths)) {
    assert(methods, 'Path should have methods defined');
    assert(
      Object.keys(methods).length === 1,
      'Path should have exactly one method (GET)',
    );
    assert(methods.get, 'Path should have a GET method');
    assert(methods.get.operationId, 'Path should have an operationId');
    assert(
      /^[a-zA-Z0-9_]+$/.test(methods.get.operationId),
      `Path ${methods.get.operationId} should contain only letters, numbers, and underscores`,
    );
    assert(
      methods.get.responses['200'],
      'Path should have a 200 response defined',
    );
    assert(
      methods.get.responses['200'].description,
      'Path should have a description for the 200 response',
    );

    const { operationId, parameters, responses } = methods.get;

    const pathParameters = parameters?.filter((p) => p.in === 'path') || [];
    assert(
      pathParameters.length === 0 || pathParameters[0].required,
      'Path parameters should be required',
    );

    const endpoint: EndpointRenderData = {
      name: operationId,
      url: url.slice(1),
      description: responses['200'].description,
      baseEndpointName:
        operationId.charAt(0).toUpperCase() + operationId.slice(1),
      hasQueryParameters: parameters?.some((p) => p.in === 'query') || false,
      hasDataInResponse:
        Object.keys(responses['200'].content['application/json'].schema)
          .length > 0,
      pathParameters,
    };
    endpoints.push(endpoint);
  }
  return { endpoints };
};

const generateEtaFile = async (
  fileName: string,
  data: ClientRenderData | object,
): Promise<void> => {
  console.log(`Generating ${fileName}.eta...`);

  const eta = new Eta({ views: operationId.resolve(__dirname, 'templates') });
  const content = await eta.renderAsync(`${fileName}.eta`, data);
  await fs.promises.writeFile(
    `${config.output_folder}/${fileName}.ts`,
    content,
    'utf-8',
  );
};

const generateTypesFile = async (
  openApi: OpenApi,
  outputPath: string,
): Promise<void> => {
  const tempClientFolder = operationId.resolve(
    config.temp_folder,
    '.tmp',
    'client',
  );
  await createClient({
    input: openApi,
    output: {
      path: tempClientFolder,
      clean: true,
      format: false,
      lint: false,
    },
    plugins: ['@hey-api/client-fetch'],
  });

  fs.copyFileSync(
    operationId.join(tempClientFolder, 'types.gen.ts'),
    outputPath,
  );
};

export const generate = async () => {
  const openApi = await fetchSpecification();

  const renderData = getClientRenderData(openApi);

  fs.mkdirSync(config.output_folder, { recursive: true });

  await generateEtaFile('core', {});
  await generateEtaFile('index', {});
  await generateEtaFile('client', renderData);
  await generateEtaFile('types', renderData);
  await generateTypesFile(openApi, `${config.output_folder}/raw-types.ts`);
};

generate()
  .then(() => {
    console.log('Done');
  })
  .catch((e) => {
    console.error(e);
  });
