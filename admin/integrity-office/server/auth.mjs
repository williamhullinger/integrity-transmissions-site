import { createRemoteJWKSet, jwtVerify } from "jose";
import { forbidden, unauthorized, unavailable } from "./errors.mjs";

const jwksByIssuer = new Map();

const cleanIssuer = (env) => {
  const configured = env.OFFICE_AUTH0_ISSUER
    || (env.OFFICE_AUTH0_DOMAIN ? `https://${env.OFFICE_AUTH0_DOMAIN}` : "");
  if (!configured) throw unavailable("Staff authentication is not configured.");
  let url;
  try {
    url = new URL(configured);
  } catch {
    throw unavailable("Staff authentication is not configured.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw unavailable("Staff authentication is not configured.");
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/`;
};

const bearerToken = (headers = {}) => {
  const value = headers.authorization || headers.Authorization || "";
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(value);
  if (!match || match[1].length > 8_192) throw unauthorized();
  return match[1];
};

const mfaSatisfied = (payload, claimName) => {
  const methods = Array.isArray(payload.amr) ? payload.amr.map(String) : [];
  const assurance = String(payload.acr || "").toLowerCase();
  return payload[claimName] === true
    || methods.some((method) => ["mfa", "otp", "webauthn", "phrh", "phr"].includes(method.toLowerCase()))
    || assurance.includes("multi-factor")
    || assurance.includes("mfa");
};

export const createAuthenticator = ({ env = process.env, verify = jwtVerify, jwksFactory = createRemoteJWKSet } = {}) => {
  const issuer = cleanIssuer(env);
  const audience = String(env.OFFICE_AUTH0_AUDIENCE || "").trim();
  if (!audience) throw unavailable("Staff authentication is not configured.");
  const mfaClaim = String(env.OFFICE_AUTH0_MFA_CLAIM || "https://office.integritydrivetrain.com/mfa");
  const requireMfa = String(env.OFFICE_REQUIRE_MFA || "true").toLowerCase() !== "false";

  if (!jwksByIssuer.has(issuer)) {
    jwksByIssuer.set(issuer, jwksFactory(new URL(".well-known/jwks.json", issuer), {
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
      timeoutDuration: 5_000,
    }));
  }
  const jwks = jwksByIssuer.get(issuer);

  return async (event) => {
    const token = bearerToken(event?.headers);
    let payload;
    try {
      ({ payload } = await verify(token, jwks, {
        issuer,
        audience,
        algorithms: ["RS256"],
        clockTolerance: 5,
        maxTokenAge: "15m",
      }));
    } catch {
      throw unauthorized("Your staff session is invalid or expired.");
    }

    const subject = String(payload.sub || "");
    if (!subject || subject.length > 255) throw unauthorized("Your staff session is invalid.");
    if (requireMfa && !mfaSatisfied(payload, mfaClaim)) {
      throw forbidden("Multi-factor authentication is required for Integrity Office.");
    }

    return Object.freeze({
      subject,
      email: typeof payload.email === "string" ? payload.email.slice(0, 320) : "",
      name: typeof payload.name === "string" ? payload.name.slice(0, 160) : "",
      issuedAt: payload.iat,
    });
  };
};

export const _internals = { bearerToken, cleanIssuer, mfaSatisfied, jwksByIssuer };
