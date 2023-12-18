import crypto from "node:crypto";
const pickKeysInObject = <T extends object, K extends keyof T>({
  object,
  keys,
}: {
  object: T;
  keys: K[];
}) =>
  keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
    return result;
  }, {} as Pick<T, K>);

const generateKey = () => crypto.randomBytes(64).toString("hex");

export { pickKeysInObject, generateKey };
