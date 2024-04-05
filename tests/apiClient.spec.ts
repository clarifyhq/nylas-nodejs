import APIClient, { RequestOptionsParams } from '../src/apiClient';
import { NylasApiError, NylasOAuthError } from '../src/models/error';
import { SDK_VERSION } from '../src/version';
import { mockedFetch, mockResponse } from './testUtils';

jest.mock('node-fetch', () => {
  const originalModule = jest.requireActual('node-fetch');
  return {
    ...originalModule,
    default: jest.fn(),
  };
});

describe('APIClient', () => {
  describe('constructor', () => {
    it('should initialize all the values', () => {
      const client = new APIClient({
        apiKey: 'test',
        apiUri: 'https://test.api.nylas.com',
        timeout: 30,
        headers: {
          'X-SDK-Test-Header': 'This is a test',
        },
      });

      expect(client.apiKey).toBe('test');
      expect(client.serverUrl).toBe('https://test.api.nylas.com');
      expect(client.timeout).toBe(30000);
      expect(client.headers).toEqual({
        'X-SDK-Test-Header': 'This is a test',
      });
    });
  });

  describe('request functions', () => {
    let client: APIClient;

    beforeAll(() => {
      client = new APIClient({
        apiKey: 'testApiKey',
        apiUri: 'https://api.us.nylas.com',
        timeout: 30,
        headers: {},
      });
    });

    describe('setRequestUrl', () => {
      it('should set all the fields properly', () => {
        const options = client.requestOptions({
          path: '/test',
          method: 'GET',
          headers: { 'X-SDK-Test-Header': 'This is a test' },
          queryParams: { param: 'value' },
          body: { id: 'abc123' },
          overrides: { apiUri: 'https://test.api.nylas.com' },
        });

        expect(options.method).toBe('GET');
        expect(options.headers).toEqual({
          Accept: 'application/json',
          Authorization: 'Bearer testApiKey',
          'Content-Type': 'application/json',
          'User-Agent': `Nylas Node SDK v${SDK_VERSION}`,
          'X-SDK-Test-Header': 'This is a test',
        });
        expect(options.url).toEqual(
          new URL('https://test.api.nylas.com/test?param=value')
        );
        expect(options.body).toBe('{"id":"abc123"}');
      });

      it('should use defaults when just the path and method are passed in', () => {
        const options = client.requestOptions({
          path: '/test',
          method: 'POST',
        });

        expect(options.method).toBe('POST');
        expect(options.headers).toEqual({
          Accept: 'application/json',
          Authorization: 'Bearer testApiKey',
          'User-Agent': `Nylas Node SDK v${SDK_VERSION}`,
        });
        expect(options.url).toEqual(new URL('https://api.us.nylas.com/test'));
        expect(options.body).toBeUndefined();
      });

      it('should set metadata_pair as a query string', () => {
        const options = client.requestOptions({
          path: '/test',
          method: 'GET',
          queryParams: {
            metadataPair: { key: 'value', anotherKey: 'anotherValue' },
          },
        });

        expect(options.url).toEqual(
          new URL(
            'https://api.us.nylas.com/test?metadata_pair=key%3Avalue%2CanotherKey%3AanotherValue'
          )
        );
      });
    });

    describe('newRequest', () => {
      it('should set all the fields properly', () => {
        client.headers = {
          'global-header': 'global-value',
        };

        const options: RequestOptionsParams = {
          path: '/test',
          method: 'POST',
          headers: { 'X-SDK-Test-Header': 'This is a test' },
          queryParams: { param: 'value' },
          body: { id: 'abc123' },
          overrides: {
            apiUri: 'https://override.api.nylas.com',
            headers: { override: 'bar' },
          },
        };
        const newRequest = client.newRequest(options);

        expect(newRequest.method).toBe('POST');
        expect(newRequest.headers.raw()).toEqual({
          Accept: ['application/json'],
          Authorization: ['Bearer testApiKey'],
          'Content-Type': ['application/json'],
          'User-Agent': [`Nylas Node SDK v${SDK_VERSION}`],
          'X-SDK-Test-Header': ['This is a test'],
          'global-header': ['global-value'],
          override: ['bar'],
        });
        expect(newRequest.url).toEqual(
          'https://override.api.nylas.com/test?param=value'
        );
        expect(newRequest.body?.toString()).toBe('{"id":"abc123"}');
      });
    });

    describe('requestWithResponse', () => {
      it('should return the data if the response is valid', async () => {
        const payload = {
          id: 123,
          name: 'test',
          isValid: true,
        };

        const requestWithResponse = await client.requestWithResponse(
          mockResponse(JSON.stringify(payload))
        );

        expect(requestWithResponse).toEqual(payload);
      });
    });

    describe('request', () => {
      it('should return a response if the response is valid', async () => {
        const payload = {
          id: 123,
          name: 'test',
          isValid: true,
        };
        mockedFetch.mockImplementationOnce(() =>
          Promise.resolve(mockResponse(JSON.stringify(payload)))
        );

        const response = await client.request({
          path: '/test',
          method: 'GET',
        });
        expect(response).toEqual(payload);
      });

      it('should throw an error if the response is undefined', async () => {
        mockedFetch.mockImplementationOnce(() =>
          Promise.resolve(undefined as any)
        );

        await expect(
          client.request({
            path: '/test',
            method: 'GET',
          })
        ).rejects.toThrow(new Error('Failed to fetch response'));
      });

      it('should throw a general error if the response is an error but cannot be parsed', async () => {
        const payload = {
          invalid: true,
        };
        mockedFetch.mockImplementationOnce(() =>
          Promise.resolve(mockResponse(JSON.stringify(payload), 400))
        );

        await expect(
          client.request({
            path: '/test',
            method: 'GET',
          })
        ).rejects.toThrow(
          new Error(
            'Received an error but could not parse response from the server: {"invalid":true}'
          )
        );
      });

      it('should throw a NylasAuthError if the error comes from connect/token or connect/revoke', async () => {
        const payload = {
          requestId: 'abc123',
          error: 'Test error',
          errorCode: 400,
          errorDescription: 'Nylas SDK Test error',
          errorUri: 'https://test.api.nylas.com/docs/errors#test-error',
        };
        mockedFetch.mockImplementation(() =>
          Promise.resolve(mockResponse(JSON.stringify(payload), 400))
        );

        await expect(
          client.request({
            path: '/connect/token',
            method: 'POST',
          })
        ).rejects.toThrow(new NylasOAuthError(payload));

        await expect(
          client.request({
            path: '/connect/revoke',
            method: 'POST',
          })
        ).rejects.toThrow(new NylasOAuthError(payload));
      });

      it('should throw a NylasApiError if the error comes from the other non-auth endpoints', async () => {
        const payload = {
          requestId: 'abc123',
          error: {
            type: 'invalid_request_error',
            message: 'Invalid request',
          },
        };

        mockedFetch.mockImplementation(() =>
          Promise.resolve(mockResponse(JSON.stringify(payload), 400))
        );

        await expect(
          client.request({
            path: '/events',
            method: 'POST',
          })
        ).rejects.toThrow(new NylasApiError(payload));
      });
    });
  });
});
