"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  accentPalette: () => accentPalette,
  chartColors: () => chartColors,
  colors: () => colors,
  deleteAuthSessionsById: () => deleteAuthSessionsById,
  deleteOrgDepartmentsByDepartmentIdTeamsByTeamId: () => deleteOrgDepartmentsByDepartmentIdTeamsByTeamId,
  deleteOrgDepartmentsById: () => deleteOrgDepartmentsById,
  deleteOrgDesignationsById: () => deleteOrgDesignationsById,
  deleteOrgUsersById: () => deleteOrgUsersById,
  echartsTheme: () => echartsTheme,
  getAdminAuditLogs: () => getAdminAuditLogs,
  getAdminSettings: () => getAdminSettings,
  getAttendanceDays: () => getAttendanceDays,
  getAuthProfile: () => getAuthProfile,
  getAuthSessions: () => getAuthSessions,
  getChatConversations: () => getChatConversations,
  getChatConversationsByIdMessages: () => getChatConversationsByIdMessages,
  getDirectory: () => getDirectory,
  getHealth: () => getHealth,
  getLeaveRequests: () => getLeaveRequests,
  getOrgDepartments: () => getOrgDepartments,
  getOrgDepartmentsById: () => getOrgDepartmentsById,
  getOrgDesignations: () => getOrgDesignations,
  getOrgUsers: () => getOrgUsers,
  getOrgUsersById: () => getOrgUsersById,
  postAttendanceEvents: () => postAttendanceEvents,
  postAuthChangePassword: () => postAuthChangePassword,
  postAuthForgotPassword: () => postAuthForgotPassword,
  postAuthLogin: () => postAuthLogin,
  postAuthLogout: () => postAuthLogout,
  postAuthResetPassword: () => postAuthResetPassword,
  postAuthRoleSelect: () => postAuthRoleSelect,
  postChatConversationsByIdMessages: () => postChatConversationsByIdMessages,
  postLeaveRequests: () => postLeaveRequests,
  postOrgDepartments: () => postOrgDepartments,
  postOrgDepartmentsByDepartmentIdTeams: () => postOrgDepartmentsByDepartmentIdTeams,
  postOrgDesignations: () => postOrgDesignations,
  postOrgUsers: () => postOrgUsers,
  putAdminSettings: () => putAdminSettings,
  putAuthProfile: () => putAuthProfile,
  putOrgDepartmentsById: () => putOrgDepartmentsById,
  putOrgDesignationsById: () => putOrgDesignationsById,
  putOrgUsersById: () => putOrgUsersById,
  themePreset: () => themePreset
});
module.exports = __toCommonJS(index_exports);

// src/theme/tokens.ts
var colors = {
  primary: "#1A1A2E",
  success: "#16A34A",
  info: "#2563EB",
  warning: "#D97706",
  danger: "#DC2626",
  neutralStatus: "#6B7280",
  overtime: "#D97706",
  successDark: "#22C55E",
  infoDark: "#3B82F6",
  warningDark: "#F59E0B",
  dangerDark: "#EF4444",
  neutralStatusDark: "#9CA3AF",
  overtimeDark: "#F59E0B"
};
var accentPalette = {
  violet: "#8A2BE2",
  violetDeep: "#9400D3",
  gold: "#FFD700",
  pink: "#FF1493",
  orange: "#F97316",
  coral: "#FF7F50",
  red: "#EF4444",
  magenta: "#D946EF",
  blue: "#3B82F6",
  indigo: "#6366F1",
  cyan: "#06B6D4",
  teal: "#14B8A6",
  green: "#22C55E",
  lime: "#84CC16",
  gray: "#6B7280"
};
var chartColors = [
  accentPalette.violet,
  accentPalette.blue,
  accentPalette.cyan,
  accentPalette.teal,
  accentPalette.green,
  accentPalette.lime,
  "#EAB308",
  // yellow
  "#F59E0B",
  // amber
  accentPalette.orange,
  accentPalette.red,
  accentPalette.pink,
  accentPalette.magenta
];
var echartsTheme = {
  color: chartColors,
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
  }
  // We can expand this with more ECharts specific tokens later
};
var themePreset = {
  colors: {
    primary: {
      DEFAULT: colors.primary
    },
    accent: accentPalette
  }
};

// src/api/core/bodySerializer.gen.ts
var jsonBodySerializer = {
  bodySerializer: (body) => JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value)
};

// src/api/core/params.gen.ts
var extraPrefixesMap = {
  $body_: "body",
  $headers_: "headers",
  $path_: "path",
  $query_: "query"
};
var extraPrefixes = Object.entries(extraPrefixesMap);

// src/api/core/serverSentEvents.gen.ts
function createSseClient({
  onRequest,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}) {
  let lastEventId;
  const sleep = sseSleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const createStream = async function* () {
    let retryDelay = sseDefaultRetryDelay ?? 3e3;
    let attempt = 0;
    const signal = options.signal ?? new AbortController().signal;
    while (true) {
      if (signal.aborted) break;
      attempt++;
      const headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
      if (lastEventId !== void 0) {
        headers.set("Last-Event-ID", lastEventId);
      }
      try {
        const requestInit = {
          redirect: "follow",
          ...options,
          body: options.serializedBody,
          headers,
          signal
        };
        let request = new Request(url, requestInit);
        if (onRequest) {
          request = await onRequest(url, requestInit);
        }
        const _fetch = options.fetch ?? globalThis.fetch;
        const response = await _fetch(request);
        if (!response.ok) throw new Error(`SSE failed: ${response.status} ${response.statusText}`);
        if (!response.body) throw new Error("No body in SSE response");
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        const abortHandler = () => {
          try {
            reader.cancel();
          } catch {
          }
        };
        signal.addEventListener("abort", abortHandler);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += value;
            buffer = buffer.replace(/\r\n?/g, "\n");
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";
            for (const chunk of chunks) {
              const lines = chunk.split("\n");
              const dataLines = [];
              let eventName;
              for (const line of lines) {
                if (line.startsWith("data:")) {
                  dataLines.push(line.replace(/^data:\s*/, ""));
                } else if (line.startsWith("event:")) {
                  eventName = line.replace(/^event:\s*/, "");
                } else if (line.startsWith("id:")) {
                  lastEventId = line.replace(/^id:\s*/, "");
                } else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10);
                  if (!Number.isNaN(parsed)) {
                    retryDelay = parsed;
                  }
                }
              }
              let data;
              let parsedJson = false;
              if (dataLines.length) {
                const rawData = dataLines.join("\n");
                try {
                  data = JSON.parse(rawData);
                  parsedJson = true;
                } catch {
                  data = rawData;
                }
              }
              if (parsedJson) {
                if (responseValidator) {
                  await responseValidator(data);
                }
                if (responseTransformer) {
                  data = await responseTransformer(data);
                }
              }
              onSseEvent?.({
                data,
                event: eventName,
                id: lastEventId,
                retry: retryDelay
              });
              if (dataLines.length) {
                yield data;
              }
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler);
          reader.releaseLock();
        }
        break;
      } catch (error) {
        onSseError?.(error);
        if (sseMaxRetryAttempts !== void 0 && attempt >= sseMaxRetryAttempts) {
          break;
        }
        const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 3e4);
        await sleep(backoff);
      }
    }
  };
  const stream = createStream();
  return { stream };
}

// src/api/core/pathSerializer.gen.ts
var separatorArrayExplode = (style) => {
  switch (style) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
};
var separatorArrayNoExplode = (style) => {
  switch (style) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
};
var separatorObjectExplode = (style) => {
  switch (style) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
};
var serializeArrayParam = ({
  allowReserved,
  explode,
  name,
  style,
  value
}) => {
  if (!explode) {
    const joinedValues2 = (allowReserved ? value : value.map((v) => encodeURIComponent(v))).join(separatorArrayNoExplode(style));
    switch (style) {
      case "label":
        return `.${joinedValues2}`;
      case "matrix":
        return `;${name}=${joinedValues2}`;
      case "simple":
        return joinedValues2;
      default:
        return `${name}=${joinedValues2}`;
    }
  }
  const separator = separatorArrayExplode(style);
  const joinedValues = value.map((v) => {
    if (style === "label" || style === "simple") {
      return allowReserved ? v : encodeURIComponent(v);
    }
    return serializePrimitiveParam({
      allowReserved,
      name,
      value: v
    });
  }).join(separator);
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};
var serializePrimitiveParam = ({
  allowReserved,
  name,
  value
}) => {
  if (value === void 0 || value === null) {
    return "";
  }
  if (typeof value === "object") {
    throw new Error(
      "Deeply-nested arrays/objects aren\u2019t supported. Provide your own `querySerializer()` to handle these."
    );
  }
  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`;
};
var serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly
}) => {
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`;
  }
  if (style !== "deepObject" && !explode) {
    let values = [];
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? v : encodeURIComponent(v)];
    });
    const joinedValues2 = values.join(",");
    switch (style) {
      case "form":
        return `${name}=${joinedValues2}`;
      case "label":
        return `.${joinedValues2}`;
      case "matrix":
        return `;${name}=${joinedValues2}`;
      default:
        return joinedValues2;
    }
  }
  const separator = separatorObjectExplode(style);
  const joinedValues = Object.entries(value).map(
    ([key, v]) => serializePrimitiveParam({
      allowReserved,
      name: style === "deepObject" ? `${name}[${key}]` : key,
      value: v
    })
  ).join(separator);
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues;
};

// src/api/core/utils.gen.ts
var PATH_PARAM_RE = /\{[^{}]+\}/g;
var defaultPathSerializer = ({ path, url: _url }) => {
  let url = _url;
  const matches = _url.match(PATH_PARAM_RE);
  if (matches) {
    for (const match of matches) {
      let explode = false;
      let name = match.substring(1, match.length - 1);
      let style = "simple";
      if (name.endsWith("*")) {
        explode = true;
        name = name.substring(0, name.length - 1);
      }
      if (name.startsWith(".")) {
        name = name.substring(1);
        style = "label";
      } else if (name.startsWith(";")) {
        name = name.substring(1);
        style = "matrix";
      }
      const value = path[name];
      if (value === void 0 || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        url = url.replace(match, serializeArrayParam({ explode, name, style, value }));
        continue;
      }
      if (typeof value === "object") {
        url = url.replace(
          match,
          serializeObjectParam({
            explode,
            name,
            style,
            value,
            valueOnly: true
          })
        );
        continue;
      }
      if (style === "matrix") {
        url = url.replace(
          match,
          `;${serializePrimitiveParam({
            name,
            value
          })}`
        );
        continue;
      }
      const replaceValue = encodeURIComponent(
        style === "label" ? `.${value}` : value
      );
      url = url.replace(match, replaceValue);
    }
  }
  return url;
};
var getUrl = ({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url
}) => {
  const pathUrl = _url.startsWith("/") ? _url : `/${_url}`;
  let url = (baseUrl ?? "") + pathUrl;
  if (path) {
    url = defaultPathSerializer({ path, url });
  }
  let search = query ? querySerializer(query) : "";
  if (search.startsWith("?")) {
    search = search.substring(1);
  }
  if (search) {
    url += `?${search}`;
  }
  return url;
};
function getValidRequestBody(options) {
  const hasBody = options.body !== void 0;
  const isSerializedBody = hasBody && options.bodySerializer;
  if (isSerializedBody) {
    if ("serializedBody" in options) {
      const hasSerializedBody = options.serializedBody !== void 0 && options.serializedBody !== "";
      return hasSerializedBody ? options.serializedBody : null;
    }
    return options.body !== "" ? options.body : null;
  }
  if (hasBody) {
    return options.body;
  }
  return void 0;
}

// src/api/core/auth.gen.ts
var getAuthToken = async (auth, callback) => {
  const token = typeof callback === "function" ? await callback(auth) : callback;
  if (!token) {
    return;
  }
  if (auth.scheme === "bearer") {
    return `Bearer ${token}`;
  }
  if (auth.scheme === "basic") {
    return `Basic ${btoa(token)}`;
  }
  return token;
};

// src/api/client/utils.gen.ts
var createQuerySerializer = ({
  parameters = {},
  ...args
} = {}) => {
  const querySerializer = (queryParams) => {
    const search = [];
    if (queryParams && typeof queryParams === "object") {
      for (const name in queryParams) {
        const value = queryParams[name];
        if (value === void 0 || value === null) {
          continue;
        }
        const options = parameters[name] || args;
        if (Array.isArray(value)) {
          const serializedArray = serializeArrayParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "form",
            value,
            ...options.array
          });
          if (serializedArray) search.push(serializedArray);
        } else if (typeof value === "object") {
          const serializedObject = serializeObjectParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "deepObject",
            value,
            ...options.object
          });
          if (serializedObject) search.push(serializedObject);
        } else {
          const serializedPrimitive = serializePrimitiveParam({
            allowReserved: options.allowReserved,
            name,
            value
          });
          if (serializedPrimitive) search.push(serializedPrimitive);
        }
      }
    }
    return search.join("&");
  };
  return querySerializer;
};
var getParseAs = (contentType) => {
  if (!contentType) {
    return "stream";
  }
  const cleanContent = contentType.split(";")[0]?.trim();
  if (!cleanContent) {
    return;
  }
  if (cleanContent.startsWith("application/json") || cleanContent.endsWith("+json")) {
    return "json";
  }
  if (cleanContent === "multipart/form-data") {
    return "formData";
  }
  if (["application/", "audio/", "image/", "video/"].some((type) => cleanContent.startsWith(type))) {
    return "blob";
  }
  if (cleanContent.startsWith("text/")) {
    return "text";
  }
  return;
};
var checkForExistence = (options, name) => {
  if (!name) {
    return false;
  }
  if (options.headers.has(name) || options.query?.[name] || options.headers.get("Cookie")?.includes(`${name}=`)) {
    return true;
  }
  return false;
};
async function setAuthParams(options) {
  for (const auth of options.security ?? []) {
    if (checkForExistence(options, auth.name)) {
      continue;
    }
    const token = await getAuthToken(auth, options.auth);
    if (!token) {
      continue;
    }
    const name = auth.name ?? "Authorization";
    switch (auth.in) {
      case "query":
        if (!options.query) {
          options.query = {};
        }
        options.query[name] = token;
        break;
      case "cookie":
        options.headers.append("Cookie", `${name}=${token}`);
        break;
      case "header":
      default:
        options.headers.set(name, token);
        break;
    }
  }
}
var buildUrl = (options) => getUrl({
  baseUrl: options.baseUrl,
  path: options.path,
  query: options.query,
  querySerializer: typeof options.querySerializer === "function" ? options.querySerializer : createQuerySerializer(options.querySerializer),
  url: options.url
});
var mergeConfigs = (a, b) => {
  const config = { ...a, ...b };
  if (config.baseUrl?.endsWith("/")) {
    config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1);
  }
  config.headers = mergeHeaders(a.headers, b.headers);
  return config;
};
var headersEntries = (headers) => {
  const entries = [];
  headers.forEach((value, key) => {
    entries.push([key, value]);
  });
  return entries;
};
var mergeHeaders = (...headers) => {
  const mergedHeaders = new Headers();
  for (const header of headers) {
    if (!header) {
      continue;
    }
    const iterator = header instanceof Headers ? headersEntries(header) : Object.entries(header);
    for (const [key, value] of iterator) {
      if (value === null) {
        mergedHeaders.delete(key);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          mergedHeaders.append(key, v);
        }
      } else if (value !== void 0) {
        mergedHeaders.set(
          key,
          typeof value === "object" ? JSON.stringify(value) : value
        );
      }
    }
  }
  return mergedHeaders;
};
var Interceptors = class {
  fns = [];
  clear() {
    this.fns = [];
  }
  eject(id) {
    const index = this.getInterceptorIndex(id);
    if (this.fns[index]) {
      this.fns[index] = null;
    }
  }
  exists(id) {
    const index = this.getInterceptorIndex(id);
    return Boolean(this.fns[index]);
  }
  getInterceptorIndex(id) {
    if (typeof id === "number") {
      return this.fns[id] ? id : -1;
    }
    return this.fns.indexOf(id);
  }
  update(id, fn) {
    const index = this.getInterceptorIndex(id);
    if (this.fns[index]) {
      this.fns[index] = fn;
      return id;
    }
    return false;
  }
  use(fn) {
    this.fns.push(fn);
    return this.fns.length - 1;
  }
};
var createInterceptors = () => ({
  error: new Interceptors(),
  request: new Interceptors(),
  response: new Interceptors()
});
var defaultQuerySerializer = createQuerySerializer({
  allowReserved: false,
  array: {
    explode: true,
    style: "form"
  },
  object: {
    explode: true,
    style: "deepObject"
  }
});
var defaultHeaders = {
  "Content-Type": "application/json"
};
var createConfig = (override = {}) => ({
  ...jsonBodySerializer,
  headers: defaultHeaders,
  parseAs: "auto",
  querySerializer: defaultQuerySerializer,
  ...override
});

// src/api/client/client.gen.ts
var createClient = (config = {}) => {
  let _config = mergeConfigs(createConfig(), config);
  const getConfig = () => ({ ..._config });
  const setConfig = (config2) => {
    _config = mergeConfigs(_config, config2);
    return getConfig();
  };
  const interceptors = createInterceptors();
  const beforeRequest = async (options) => {
    const opts = {
      ..._config,
      ...options,
      fetch: options.fetch ?? _config.fetch ?? globalThis.fetch,
      headers: mergeHeaders(_config.headers, options.headers),
      serializedBody: void 0
    };
    if (opts.security) {
      await setAuthParams(opts);
    }
    if (opts.requestValidator) {
      await opts.requestValidator(opts);
    }
    if (opts.body !== void 0 && opts.bodySerializer) {
      opts.serializedBody = opts.bodySerializer(opts.body);
    }
    if (opts.body === void 0 || opts.serializedBody === "") {
      opts.headers.delete("Content-Type");
    }
    const resolvedOpts = opts;
    const url = buildUrl(resolvedOpts);
    return { opts: resolvedOpts, url };
  };
  const request = async (options) => {
    const throwOnError = options.throwOnError ?? _config.throwOnError;
    const responseStyle = options.responseStyle ?? _config.responseStyle;
    let request2;
    let response;
    try {
      const { opts, url } = await beforeRequest(options);
      const requestInit = {
        redirect: "follow",
        ...opts,
        body: getValidRequestBody(opts)
      };
      request2 = new Request(url, requestInit);
      for (const fn of interceptors.request.fns) {
        if (fn) {
          request2 = await fn(request2, opts);
        }
      }
      const _fetch = opts.fetch;
      response = await _fetch(request2);
      for (const fn of interceptors.response.fns) {
        if (fn) {
          response = await fn(response, request2, opts);
        }
      }
      const result = {
        request: request2,
        response
      };
      if (response.ok) {
        const parseAs = (opts.parseAs === "auto" ? getParseAs(response.headers.get("Content-Type")) : opts.parseAs) ?? "json";
        if (response.status === 204 || response.headers.get("Content-Length") === "0") {
          let emptyData;
          switch (parseAs) {
            case "arrayBuffer":
            case "blob":
            case "text":
              emptyData = await response[parseAs]();
              break;
            case "formData":
              emptyData = new FormData();
              break;
            case "stream":
              emptyData = response.body;
              break;
            case "json":
            default:
              emptyData = {};
              break;
          }
          return opts.responseStyle === "data" ? emptyData : {
            data: emptyData,
            ...result
          };
        }
        let data;
        switch (parseAs) {
          case "arrayBuffer":
          case "blob":
          case "formData":
          case "text":
            data = await response[parseAs]();
            break;
          case "json": {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
            break;
          }
          case "stream":
            return opts.responseStyle === "data" ? response.body : {
              data: response.body,
              ...result
            };
        }
        if (parseAs === "json") {
          if (opts.responseValidator) {
            await opts.responseValidator(data);
          }
          if (opts.responseTransformer) {
            data = await opts.responseTransformer(data);
          }
        }
        return opts.responseStyle === "data" ? data : {
          data,
          ...result
        };
      }
      const textError = await response.text();
      let jsonError;
      try {
        jsonError = JSON.parse(textError);
      } catch {
      }
      throw jsonError ?? textError;
    } catch (error) {
      let finalError = error;
      for (const fn of interceptors.error.fns) {
        if (fn) {
          finalError = await fn(finalError, response, request2, options);
        }
      }
      finalError = finalError || {};
      if (throwOnError) {
        throw finalError;
      }
      return responseStyle === "data" ? void 0 : {
        error: finalError,
        request: request2,
        response
      };
    }
  };
  const makeMethodFn = (method) => (options) => request({ ...options, method });
  const makeSseFn = (method) => async (options) => {
    const { opts, url } = await beforeRequest(options);
    return createSseClient({
      ...opts,
      body: opts.body,
      method,
      onRequest: async (url2, init) => {
        let request2 = new Request(url2, init);
        for (const fn of interceptors.request.fns) {
          if (fn) {
            request2 = await fn(request2, opts);
          }
        }
        return request2;
      },
      serializedBody: getValidRequestBody(opts),
      url
    });
  };
  const _buildUrl = (options) => buildUrl({ ..._config, ...options });
  return {
    buildUrl: _buildUrl,
    connect: makeMethodFn("CONNECT"),
    delete: makeMethodFn("DELETE"),
    get: makeMethodFn("GET"),
    getConfig,
    head: makeMethodFn("HEAD"),
    interceptors,
    options: makeMethodFn("OPTIONS"),
    patch: makeMethodFn("PATCH"),
    post: makeMethodFn("POST"),
    put: makeMethodFn("PUT"),
    request,
    setConfig,
    sse: {
      connect: makeSseFn("CONNECT"),
      delete: makeSseFn("DELETE"),
      get: makeSseFn("GET"),
      head: makeSseFn("HEAD"),
      options: makeSseFn("OPTIONS"),
      patch: makeSseFn("PATCH"),
      post: makeSseFn("POST"),
      put: makeSseFn("PUT"),
      trace: makeSseFn("TRACE")
    },
    trace: makeMethodFn("TRACE")
  };
};

// src/api/client.gen.ts
var client = createClient(createConfig({ baseUrl: "http://localhost:8000/api" }));

// src/api/sdk.gen.ts
var getHealth = (options) => (options?.client ?? client).get({ url: "/health", ...options });
var postAuthLogin = (options) => (options.client ?? client).post({
  url: "/auth/login",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postAuthRoleSelect = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/role/select",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postAuthForgotPassword = (options) => (options.client ?? client).post({
  url: "/auth/forgot-password",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postAuthResetPassword = (options) => (options.client ?? client).post({
  url: "/auth/reset-password",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postAuthChangePassword = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/change-password",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var getAuthSessions = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/sessions",
  ...options
});
var deleteAuthSessionsById = (options) => (options.client ?? client).delete({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/sessions/{id}",
  ...options
});
var postAuthLogout = (options) => (options?.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/logout",
  ...options
});
var getAuthProfile = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/profile",
  ...options
});
var putAuthProfile = (options) => (options.client ?? client).put({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/auth/profile",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var getDirectory = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/directory",
  ...options
});
var getOrgDepartments = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments",
  ...options
});
var postOrgDepartments = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var deleteOrgDepartmentsById = (options) => (options.client ?? client).delete({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments/{id}",
  ...options
});
var getOrgDepartmentsById = (options) => (options.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments/{id}",
  ...options
});
var putOrgDepartmentsById = (options) => (options.client ?? client).put({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments/{id}",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postOrgDepartmentsByDepartmentIdTeams = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments/{departmentId}/teams",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var deleteOrgDepartmentsByDepartmentIdTeamsByTeamId = (options) => (options.client ?? client).delete({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/departments/{departmentId}/teams/{teamId}",
  ...options
});
var getOrgDesignations = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/designations",
  ...options
});
var postOrgDesignations = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/designations",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var deleteOrgDesignationsById = (options) => (options.client ?? client).delete({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/designations/{id}",
  ...options
});
var putOrgDesignationsById = (options) => (options.client ?? client).put({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/designations/{id}",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var getOrgUsers = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/users",
  ...options
});
var postOrgUsers = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/users",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var deleteOrgUsersById = (options) => (options.client ?? client).delete({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/users/{id}",
  ...options
});
var getOrgUsersById = (options) => (options.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/users/{id}",
  ...options
});
var putOrgUsersById = (options) => (options.client ?? client).put({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/org/users/{id}",
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...options.headers
  }
});
var postAttendanceEvents = (options) => (options?.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/attendance/events",
  ...options
});
var getAttendanceDays = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/attendance/days",
  ...options
});
var getLeaveRequests = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/leave-requests",
  ...options
});
var postLeaveRequests = (options) => (options?.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/leave-requests",
  ...options
});
var getChatConversations = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/chat/conversations",
  ...options
});
var getChatConversationsByIdMessages = (options) => (options.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/chat/conversations/{id}/messages",
  ...options
});
var postChatConversationsByIdMessages = (options) => (options.client ?? client).post({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/chat/conversations/{id}/messages",
  ...options
});
var getAdminSettings = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/admin/settings",
  ...options
});
var putAdminSettings = (options) => (options?.client ?? client).put({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/admin/settings",
  ...options
});
var getAdminAuditLogs = (options) => (options?.client ?? client).get({
  security: [{ scheme: "bearer", type: "http" }],
  url: "/admin/audit-logs",
  ...options
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accentPalette,
  chartColors,
  colors,
  deleteAuthSessionsById,
  deleteOrgDepartmentsByDepartmentIdTeamsByTeamId,
  deleteOrgDepartmentsById,
  deleteOrgDesignationsById,
  deleteOrgUsersById,
  echartsTheme,
  getAdminAuditLogs,
  getAdminSettings,
  getAttendanceDays,
  getAuthProfile,
  getAuthSessions,
  getChatConversations,
  getChatConversationsByIdMessages,
  getDirectory,
  getHealth,
  getLeaveRequests,
  getOrgDepartments,
  getOrgDepartmentsById,
  getOrgDesignations,
  getOrgUsers,
  getOrgUsersById,
  postAttendanceEvents,
  postAuthChangePassword,
  postAuthForgotPassword,
  postAuthLogin,
  postAuthLogout,
  postAuthResetPassword,
  postAuthRoleSelect,
  postChatConversationsByIdMessages,
  postLeaveRequests,
  postOrgDepartments,
  postOrgDepartmentsByDepartmentIdTeams,
  postOrgDesignations,
  postOrgUsers,
  putAdminSettings,
  putAuthProfile,
  putOrgDepartmentsById,
  putOrgDesignationsById,
  putOrgUsersById,
  themePreset
});
