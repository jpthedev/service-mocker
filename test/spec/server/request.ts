import { expect } from 'chai';
import { createServer } from 'service-mocker/server';

import { uniquePath } from './helpers/unique-path';
import { sendRequest } from './helpers/send-request';

export function requestRunner() {
  const { router } = createServer();

  describe('Request', () => {
    describe('.params', () => {
      it('should have a `.params` property', async () => {
        const request = await requestToPromise();

        expect(request).to.have.property('params')
          .and.that.is.an('object');
      });

      it('should have a `user` property in `req.params`', async () => {
        const path = uniquePath();
        const { params } = await requestToPromise(`${path}/:user`, `${path}/dolphin`);

        expect(params).to.have.property('user')
          .and.that.equals('dolphin');
      });
    });

    describe('.query', () => {
      it('should have a `.query` property', async () => {
        const path = uniquePath();
        const request = await requestToPromise(path, `${path}?whatever`);

        expect(request).to.have.property('query')
          .and.that.is.an('object');
      });

      it('should have a `.user` property in `req.query`', async () => {
        const path = uniquePath();
        const { query } = await requestToPromise(path, `${path}?user=dolphin`);

        expect(query).to.have.property('user')
          .and.that.equals('dolphin');
      });

      it('should support nested query', async () => {
        const path = uniquePath();
        const { query } = await requestToPromise(path, `${path}?user[name]=dolphin`);

        expect(query.user).to.have.property('name')
          .and.that.equals('dolphin');
      });
    });

    describe('.path', () => {
      it('should have a `.path` property', async () => {
        const path = uniquePath();
        const request = await requestToPromise(path, path);

        expect(request).to.have.property('path')
          .and.that.equals(path);
      });

      it('should shrink to the given baseURL', async () => {
        let request: any;

        const path = uniquePath();
        const baseURL = '/api/v1';

        router.base(baseURL).get(path, (req, res) => {
          request = req;
          res.end();
        });

        await sendRequest(baseURL + path);

        expect(request.path).to.equal(path);
      });
    });

    describe('.baseURL', () => {
      it('should equal to local machine', async () => {
        const request = await requestToPromise();

        expect(request).to.have.property('baseURL')
          .and.that.equals(new URL(location.href).origin);
      });

      it('should equal to remote address', async () => {
        const remote = 'https://a.com/api';
        let request: any;

        router.base(remote).get('/', (req, res) => {
          request = req;
          res.end();
        });

        await sendRequest(remote);

        expect(request.baseURL).to.equal(remote);
      });
    });

    describe('.url', () => {
      it('should be an absolute path', async () => {
        const path = uniquePath();
        const url = new URL(path, location.href);

        const request = await requestToPromise(path, path);

        expect(request).to.have.property('url')
          .and.that.equals(url.href);
      });
    });

    describe('.clone()', () => {
      it('should return a new MockerRequest', async () => {
        const request = await requestToPromise();

        const rr = request.clone();

        expect(rr.constructor).to.equal(request.constructor);
      });

      it('should keep the same properties', async () => {
        const path = uniquePath();

        const request = await requestToPromise(`${path}/:user`, `${path}/dolphin?id=1`);

        const rr = request.clone();

        expect(rr.params).to.deep.equal(request.params);
        expect(rr.query).to.deep.equal(request.query);
        expect(rr.path).to.equal(request.path);
        expect(rr.url).to.equal(request.url);
      });
    });

    describe('original request methods', () => {
      const postToPromise = requestToPromise.bind(null, null, null);

      it('should have `.arrayBuffer()` method', async () => {
        const request = await postToPromise({
          method: 'POST',
          body: new ArrayBuffer(100),
        });

        expect(await request.arrayBuffer()).to.be.an.instanceof(ArrayBuffer);
      });

      it('should have `.blob()` method', async () => {
        const request = await postToPromise({
          method: 'POST',
          body: new Blob(),
        });

        expect(await request.blob()).to.be.an.instanceof(Blob);
      });

      it('should have `.formData()` method', async function() {
        // no `res.formData()` method in some browsers
        // fetch polyfill bug: https://github.com/github/fetch/issues/460
        if (!('formData' in new Response()) || (fetch as any).polyfill) {
          this.skip();
        }

        const request = await postToPromise({
          method: 'POST',
          body: new FormData(),
        });

        expect(await request.formData()).to.be.an.instanceof(FormData);
      });

      it('should have `.json()` method', async () => {
        const obj = { user: 'dolphin' };

        const request = await postToPromise({
          method: 'POST',
          body: JSON.stringify(obj),
        });

        expect(await request.json()).to.deep.equal(obj);
      });

      it('should have `.text()` method', async () => {
        const request = await postToPromise({
          method: 'POST',
          body: '123',
        });

        expect(await request.text()).to.equal('123');
      });
    });
  });

  async function requestToPromise(
    path?: string,
    requestURL?: string,
    init: RequestInit = {},
  ): Promise<any> {
    const p = uniquePath();

    const method = init.method ? init.method.toLowerCase() : 'get';

    const promise = new Promise((resolve) => {
      router[method](path || p, (req, res) => {
        resolve(req);
        res.end();
      });
    });

    await sendRequest(requestURL || p, init);

    return promise;
  }
}
