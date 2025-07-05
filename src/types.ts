export type Parameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: {
    type: 'string' | 'number' | 'boolean' | 'integer';
  };
};

export type EndpointData = {
  get: {
    operationId: string;
    parameters?: Parameter[];
    responses: {
      [statusCode: string]: {
        description: string;
        content: {
          'application/json': {
            schema: Record<string, unknown>;
          };
        };
      };
    };
  };
};

export type OpenApi = Record<string, unknown> & {
  paths: {
    [path: string]: EndpointData;
  };
};
