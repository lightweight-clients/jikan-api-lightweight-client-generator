export interface EndpointData {
  get: {
    operationId: string;
    parameters?: [];
    responses: {
      [statusCode: string]: {
        description: string;
      };
    };
  };
}

export type OpenApi = Record<string, unknown> & {
  paths: {
    [path: string]: EndpointData;
  };
};
