export interface EndpointData {
    get: {
        operationId: string;
        parameters?: [];
        responses: {
            '200': {
                description: string;
            };
        };
    };
}

export interface OpenApi {
    paths: {
        [path: string]: EndpointData;
    };
}
