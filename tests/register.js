const Module = require("node:module");
const path = require("node:path");

require("sucrase/register/ts");

const root = path.resolve(__dirname, "..");
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveTestAlias(request, ...rest) {
  if (request.startsWith("@/")) {
    request = path.join(root, request.slice(2));
  }

  return resolveFilename.call(this, request, ...rest);
};
