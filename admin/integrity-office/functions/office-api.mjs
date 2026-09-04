import { createAuthenticator } from "../server/auth.mjs";
import { getPool } from "../server/db.mjs";
import { createOfficeApi } from "../server/office-api.mjs";
import { PostgresOfficeRepository } from "../server/repository.mjs";

let authenticator;
let repository;

const authenticate = (event) => {
  authenticator ||= createAuthenticator();
  return authenticator(event);
};

const lazyRepository = new Proxy({}, {
  get(_target, property) {
    repository ||= new PostgresOfficeRepository(getPool());
    const value = repository[property];
    return typeof value === "function" ? value.bind(repository) : value;
  },
});

const officeApi = createOfficeApi({ authenticate, repository: lazyRepository });

export const handler = (event) => officeApi(event);
