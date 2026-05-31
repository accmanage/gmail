import { authenticator } from "otplib";

authenticator.options = {
  step: 30,
  digits: 6
};

export function generateTotp(secret: string) {
  const code = authenticator.generate(secret.replace(/\s+/g, ""));
  const epochSeconds = Math.floor(Date.now() / 1000);
  const remaining = 30 - (epochSeconds % 30);
  return { code, remaining };
}
