var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
import cookie from "cookie";
import {v4} from "@lukeed/uuid";
import dotenv from "dotenv";
import pkg from "mongodb";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe};
}
const s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (branch) {
    branch.forEach(({node, loaded, fetched, uses_credentials}) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({node}) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = {head: "", html: "", css: ""};
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 ? `<style amp-custom>${Array.from(styles).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${branch.map(({node}) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		</script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, json}) => `<script type="svelte-data" url="${url}">${json}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options2.template({head, body})
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
function resolve(base2, path) {
  const baseparts = path[0] === "/" ? [] : base2.slice(1).split("/");
  const pathparts = path[0] === "/" ? path.slice(1).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  return `/${baseparts.join("/")}`;
}
const s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const {module} = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options2.read && url.startsWith(options2.paths.assets)) {
          url = url.replace(options2.paths.assets, "");
        }
        if (url.startsWith("//")) {
          throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
        }
        let response;
        if (/^[a-zA-Z]+:/.test(url)) {
          response = await fetch(url, opts);
        } else {
          const [path, search] = url.split("?");
          const resolved = resolve(request.path, path);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
          if (asset) {
            if (options2.read) {
              response = new Response(options2.read(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = {...opts.headers};
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            const rendered = await ssr({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              rawBody: opts.body,
              query: new URLSearchParams(search)
            }, options2, {
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (state.prerender) {
                state.prerender.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                fetched.push({
                  url,
                  json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                });
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: {...context}
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({request, options: options2, state, $session, status, error: error2}) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      request,
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (error3) {
    options2.handle_error(error3);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
async function respond({request, options: options2, state, $session, route}) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options2.load_component(id)));
  } catch (error3) {
    options2.handle_error(error3);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options2.ssr,
    router: "router" in leaf ? leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.force) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error2;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: loaded.loaded.redirect
                }
              };
            }
            if (loaded.loaded.error) {
              ({status, error: error2} = loaded.loaded);
            }
          } catch (e) {
            options2.handle_error(e);
            status = 500;
            error2 = e;
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      request,
      options: options2,
      $session,
      page_config,
      status,
      error: error2,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error3) {
    options2.handle_error(error3);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession({context: request.context});
  if (route) {
    const response = await respond({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (state.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${state.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({...request, params});
    if (response) {
      if (typeof response !== "object") {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; 
						 expected an object, got ${typeof response}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key.toLowerCase()] = obj[key];
  }
  return clone;
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        map.get(key).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
class ReadOnlyFormData {
  constructor(map) {
    _map.set(this, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield key;
      }
    }
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value;
      }
    }
  }
}
_map = new WeakMap();
function parse_body(req) {
  const raw = req.rawBody;
  if (!raw)
    return raw;
  const [type, ...directives] = req.headers["content-type"].split(/;\s*/);
  if (typeof raw === "string") {
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const {data, append} = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  const nope = () => {
    throw new Error("Malformed form data");
  };
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    nope();
  }
  const {data, append} = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          nope();
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      nope();
    append(key, body);
  });
  return data;
}
async function ssr(incoming, options2, state = {}) {
  if (incoming.path.endsWith("/") && incoming.path !== "/") {
    const q = incoming.query.toString();
    return {
      status: 301,
      headers: {
        location: incoming.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const incoming_with_body = {
    ...incoming,
    body: parse_body(incoming)
  };
  const context = await options2.hooks.getContext(incoming_with_body) || {};
  try {
    return await options2.hooks.handle({
      request: {
        ...incoming_with_body,
        params: null,
        context
      },
      render: async (request) => {
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (e) {
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function hash(str) {
  let hash2 = 5381, i = str.length;
  while (i)
    hash2 = hash2 * 33 ^ str.charCodeAt(--i);
  return (hash2 >>> 0).toString(36);
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function custom_event(type, detail) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, false, false, detail);
  return e;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, {$$slots = {}, context = new Map()} = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
var root_svelte_svelte_type_style_lang = "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}";
const css$5 = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {stores} = $$props;
  let {page} = $$props;
  let {components} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  let {props_2 = null} = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$5);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1pdgbjn"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
const getContext = (request) => {
  const cookies = cookie.parse(request.headers.cookie || "");
  return {
    is_new: !cookies.userid,
    userid: cookies.userid || v4()
  };
};
const handle = async ({request, render: render2}) => {
  const response = await render2({
    ...request,
    method: request.query.get("_method") || request.method
  });
  const {is_new, userid} = request.context;
  if (is_new) {
    return {
      ...response,
      headers: {
        ...response.headers,
        "set-cookie": `userid=${userid}; Path=/; HttpOnly`
      }
    };
  }
  return response;
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  getContext,
  handle
});
const template = ({head, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="workspacex">' + body + "</div>\n	</body>\n</html>\n";
let options = null;
function init(settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-5c985ff0.js",
      css: ["/./_app/assets/start-0826e215.css"],
      js: ["/./_app/start-5c985ff0.js", "/./_app/chunks/vendor-6d669ea2.js"]
    },
    fetched: void 0,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2) => {
      console.error(error2.stack);
      error2.stack = options.get_stack(error2);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    router: true,
    ssr: true,
    target: "#workspacex",
    template
  };
}
const d = decodeURIComponent;
const empty = () => ({});
const manifest = {
  assets: [{file: "favicon.ico", size: 1150, type: "image/vnd.microsoft.icon"}, {file: "haburger.svg", size: 525, type: "image/svg+xml"}, {file: "robots.txt", size: 67, type: "text/plain"}, {file: "workspacex-logo.svg", size: 930, type: "image/svg+xml"}, {file: "workspacex-logo2.svg", size: 2484, type: "image/svg+xml"}],
  layout: "src/routes/$layout.svelte",
  error: ".svelte/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/index.svelte"],
      b: [".svelte/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/nextspaces\/?$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index$4;
      })
    },
    {
      type: "page",
      pattern: /^\/register\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/register/index.svelte"],
      b: [".svelte/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/about.svelte"],
      b: [".svelte/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/todos\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return index_json;
      })
    },
    {
      type: "page",
      pattern: /^\/todos\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/todos/index.svelte"],
      b: [".svelte/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/todos\/([^/]+?)\.json$/,
      params: (m) => ({uid: d(m[1])}),
      load: () => Promise.resolve().then(function() {
        return _uid__json;
      })
    },
    {
      type: "page",
      pattern: /^\/auth\/login\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/auth/login/index.svelte"],
      b: [".svelte/build/components/error.svelte"]
    }
  ]
};
const get_hooks = (hooks) => ({
  getContext: hooks.getContext || (() => ({})),
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({request, render: render2}) => render2(request))
});
const module_lookup = {
  "src/routes/$layout.svelte": () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  ".svelte/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$3;
  }),
  "src/routes/register/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  }),
  "src/routes/todos/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/auth/login/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
const metadata_lookup = {"src/routes/$layout.svelte": {entry: "/./_app/pages/$layout.svelte-ad3c7858.js", css: ["/./_app/assets/pages/$layout.svelte-f5828267.css"], js: ["/./_app/pages/$layout.svelte-ad3c7858.js", "/./_app/chunks/vendor-6d669ea2.js", "/./_app/chunks/index-c7686ce4.js"], styles: null}, ".svelte/build/components/error.svelte": {entry: "/./_app/error.svelte-f7dd87e0.js", css: [], js: ["/./_app/error.svelte-f7dd87e0.js", "/./_app/chunks/vendor-6d669ea2.js"], styles: null}, "src/routes/index.svelte": {entry: "/./_app/pages/index.svelte-f01d1eb9.js", css: ["/./_app/assets/pages/index.svelte-173d940b.css"], js: ["/./_app/pages/index.svelte-f01d1eb9.js", "/./_app/chunks/vendor-6d669ea2.js"], styles: null}, "src/routes/register/index.svelte": {entry: "/./_app/pages/register/index.svelte-550950ae.js", css: [], js: ["/./_app/pages/register/index.svelte-550950ae.js", "/./_app/chunks/vendor-6d669ea2.js"], styles: null}, "src/routes/about.svelte": {entry: "/./_app/pages/about.svelte-eacce5c1.js", css: [], js: ["/./_app/pages/about.svelte-eacce5c1.js", "/./_app/chunks/vendor-6d669ea2.js"], styles: null}, "src/routes/todos/index.svelte": {entry: "/./_app/pages/todos/index.svelte-662055ff.js", css: ["/./_app/assets/pages/todos/index.svelte-843834d8.css"], js: ["/./_app/pages/todos/index.svelte-662055ff.js", "/./_app/chunks/vendor-6d669ea2.js", "/./_app/chunks/index-c7686ce4.js"], styles: null}, "src/routes/auth/login/index.svelte": {entry: "/./_app/pages/auth/login/index.svelte-44a91a11.js", css: [], js: ["/./_app/pages/auth/login/index.svelte-44a91a11.js", "/./_app/chunks/vendor-6d669ea2.js"], styles: null}};
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
init({paths: {base: "", assets: "/."}});
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return ssr({...request, host}, options, {prerender: prerender2});
}
const {MongoClient} = pkg;
dotenv.config();
const {MONGODB_URI, MONGODB_DB} = process.env;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}
if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable inside .env.local");
}
let cached = global.mongo;
if (!cached) {
  cached = global.mongo = {conn: null, promise: null};
}
async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB)
      };
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
async function get$1(request) {
  try {
    const completed = request.query.get("completed") === "true";
    console.log(completed);
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("nextspaces");
    const nextspaces = await collection.find("completed").toArray();
    return {
      status: 200,
      body: {
        nextspaces
      }
    };
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      body: {
        error: "A server error ocurred"
      }
    };
  }
}
async function post$1(request) {
  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    const collection = db.collection("nextspaces");
    const nextspace = JSON.parse(request.body);
    await collection.insertOne(nextspace);
    return {
      status: 200,
      body: {
        status: "success"
      }
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        error: "A server error ocurred"
      }
    };
  }
}
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$1,
  post: post$1
});
const base = "https://api.svelte.dev";
async function api(request, resource, data) {
  if (!request.context.userid) {
    return {status: 401};
  }
  const res = await fetch(`${base}/${resource}`, {
    method: request.method,
    headers: {
      "content-type": "application/json"
    },
    body: data && JSON.stringify(data)
  });
  if (res.ok && request.method !== "GET" && request.headers.accept !== "application/json") {
    return {
      status: 303,
      headers: {
        location: "/todos"
      },
      body: ""
    };
  }
  return {
    status: res.status,
    body: await res.json()
  };
}
const get = async (request) => {
  if (!request.context.userid) {
    return {body: []};
  }
  const response = await api(request, `todos/${request.context.userid}`);
  if (response.status === 404) {
    return {body: []};
  }
  return response;
};
const post = async (request) => {
  const response = await api(request, `todos/${request.context.userid}`, {
    text: request.body.get("text")
  });
  return response;
};
var index_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get,
  post
});
const patch = async (request) => {
  return api(request, `todos/${request.context.userid}/${request.params.uid}`, {
    text: request.body.get("text"),
    done: request.body.has("done") ? !!request.body.get("done") : void 0
  });
};
const del = async (request) => {
  return api(request, `todos/${request.context.userid}/${request.params.uid}`);
};
var _uid__json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  patch,
  del
});
var index_svelte_svelte_type_style_lang$2 = "svg.svelte-e3rkxq.svelte-e3rkxq{min-height:24px;transition:transform .125s ease-in-out}svg.svelte-e3rkxq line.svelte-e3rkxq{stroke:currentColor;stroke-width:3;transition:transform .1s ease-in-out}button.svelte-e3rkxq.svelte-e3rkxq{outline:none;z-index:20}.open.svelte-e3rkxq svg.svelte-e3rkxq{transform:scale(.7)}.open.svelte-e3rkxq #top.svelte-e3rkxq{transform:translate(6px) rotate(45deg)}.open.svelte-e3rkxq #middle.svelte-e3rkxq{opacity:0}.open.svelte-e3rkxq #bottom.svelte-e3rkxq{transform:translate(-12px,9px) rotate(-45deg)}";
const css$4 = {
  code: "svg.svelte-e3rkxq.svelte-e3rkxq{min-height:24px;transition:transform .125s ease-in-out}svg.svelte-e3rkxq line.svelte-e3rkxq{stroke:currentColor;stroke-width:3;transition:transform .1s ease-in-out}button.svelte-e3rkxq.svelte-e3rkxq{outline:none;z-index:20}.open.svelte-e3rkxq svg.svelte-e3rkxq{transform:scale(.7)}.open.svelte-e3rkxq #top.svelte-e3rkxq{transform:translate(6px) rotate(45deg)}.open.svelte-e3rkxq #middle.svelte-e3rkxq{opacity:0}.open.svelte-e3rkxq #bottom.svelte-e3rkxq{transform:translate(-12px,9px) rotate(-45deg)}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\texport let open = false\\n</script>\\n\\n<button\\n  class=\\"text-teal-600\\"\\n  class:open on:click={() => open = !open}>\\n  <svg width=32 height=24>\\n    <line id=\\"top\\" x1=0 y1=2 x2=32 y2=2/>\\n    <line id=\\"middle\\" x1=0 y1=12 x2=32 y2=12/>\\n    <line id=\\"bottom\\" x1=0 y1=22 x2=32 y2=22/>\\n  </svg>\\n</button>\\n\\n<style>svg{min-height:24px;transition:transform .125s ease-in-out}svg line{stroke:currentColor;stroke-width:3;transition:transform .1s ease-in-out}button{outline:none;z-index:20}.open svg{transform:scale(.7)}.open #top{transform:translate(6px) rotate(45deg)}.open #middle{opacity:0}.open #bottom{transform:translate(-12px,9px) rotate(-45deg)}</style>"],"names":[],"mappings":"AAcO,+BAAG,CAAC,WAAW,IAAI,CAAC,WAAW,SAAS,CAAC,KAAK,CAAC,WAAW,CAAC,iBAAG,CAAC,kBAAI,CAAC,OAAO,YAAY,CAAC,aAAa,CAAC,CAAC,WAAW,SAAS,CAAC,GAAG,CAAC,WAAW,CAAC,kCAAM,CAAC,QAAQ,IAAI,CAAC,QAAQ,EAAE,CAAC,mBAAK,CAAC,iBAAG,CAAC,UAAU,MAAM,EAAE,CAAC,CAAC,mBAAK,CAAC,kBAAI,CAAC,UAAU,UAAU,GAAG,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,mBAAK,CAAC,qBAAO,CAAC,QAAQ,CAAC,CAAC,mBAAK,CAAC,qBAAO,CAAC,UAAU,UAAU,KAAK,CAAC,GAAG,CAAC,CAAC,OAAO,MAAM,CAAC,CAAC"}'
};
const Hamburger = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {open = false} = $$props;
  if ($$props.open === void 0 && $$bindings.open && open !== void 0)
    $$bindings.open(open);
  $$result.css.add(css$4);
  return `<button class="${["text-teal-600 svelte-e3rkxq", open ? "open" : ""].join(" ").trim()}"><svg width="${"32"}" height="${"24"}" class="${"svelte-e3rkxq"}"><line id="${"top"}" x1="${"0"}" y1="${"2"}" x2="${"32"}" y2="${"2"}" class="${"svelte-e3rkxq"}"></line><line id="${"middle"}" x1="${"0"}" y1="${"12"}" x2="${"32"}" y2="${"12"}" class="${"svelte-e3rkxq"}"></line><line id="${"bottom"}" x1="${"0"}" y1="${"22"}" x2="${"32"}" y2="${"22"}" class="${"svelte-e3rkxq"}"></line></svg>
</button>`;
});
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {sidebar = false} = $$props;
  if ($$props.sidebar === void 0 && $$bindings.sidebar && sidebar !== void 0)
    $$bindings.sidebar(sidebar);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<header class="${"text-gray-600 border-b border-tale-500 border-opacity-25"}"><nav class="${"flex justify-between p-4 m-4"}"><div class="${"brand justify-self-start"}"><a href="${"/"}"><img src="${"/workspacex-logo2.svg"}" alt="${"WorkspaceX"}" width="${"68"}"></a></div>

		<div class="${"toggle-button pt-2"}">${validate_component(Hamburger, "HamburgerButton").$$render($$result, {open: sidebar}, {
      open: ($$value) => {
        sidebar = $$value;
        $$settled = false;
      }
    }, {})}</div></nav>
</header>`;
  } while (!$$settled);
  return $$rendered;
});
var Modal_svelte_svelte_type_style_lang = ".modal-backdrop.svelte-1fuqbil{background:rgba(0,0,0,.75);height:100vh;left:0;position:fixed;top:0;width:100%;z-index:10}.modal.svelte-1fuqbil{background:#fff;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.26);left:10%;max-height:80vh;overflow:scroll;position:fixed;top:10vh;width:80%;z-index:1001}header.svelte-1fuqbil{border-bottom:1px solid #ccc;font-family:Roboto Slab,sans-serif;margin:0}.content.svelte-1fuqbil,footer.svelte-1fuqbil,header.svelte-1fuqbil{padding:1rem}@media(min-width:768px){.modal.svelte-1fuqbil{left:calc(50% - 20rem);width:40rem}}";
const css$3 = {
  code: ".modal-backdrop.svelte-1fuqbil{background:rgba(0,0,0,.75);height:100vh;left:0;position:fixed;top:0;width:100%;z-index:10}.modal.svelte-1fuqbil{background:#fff;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.26);left:10%;max-height:80vh;overflow:scroll;position:fixed;top:10vh;width:80%;z-index:1001}header.svelte-1fuqbil{border-bottom:1px solid #ccc;font-family:Roboto Slab,sans-serif;margin:0}.content.svelte-1fuqbil,footer.svelte-1fuqbil,header.svelte-1fuqbil{padding:1rem}@media(min-width:768px){.modal.svelte-1fuqbil{left:calc(50% - 20rem);width:40rem}}",
  map: `{"version":3,"file":"Modal.svelte","sources":["Modal.svelte"],"sourcesContent":["<script>\\n  import { createEventDispatcher }  from 'svelte'\\n  import { fly, fade } from 'svelte/transition'\\n  // import Button from './Button.svelte'\\n\\n  const dispatch = createEventDispatcher()\\n  \\n  function onClose() {\\n    dispatch('close')\\n  }\\n</script>\\n<style>.modal-backdrop{background:rgba(0,0,0,.75);height:100vh;left:0;position:fixed;top:0;width:100%;z-index:10}.modal{background:#fff;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.26);left:10%;max-height:80vh;overflow:scroll;position:fixed;top:10vh;width:80%;z-index:1001}header{border-bottom:1px solid #ccc;font-family:Roboto Slab,sans-serif;margin:0}.content,footer,header{padding:1rem}@media (min-width:768px){.modal{left:calc(50% - 20rem);width:40rem}}</style>\\n\\n<div\\n  on:click={onClose}\\n  class=\\"modal-backdrop\\"\\n  transition:fade\\n  ></div>\\n<div\\n  class=\\"modal\\"\\n  transition:fly={{y: -200}}\\n  >\\n  <header>\\n    <slot name=\\"header\\" />\\n  </header>\\n  <div class=\\"content\\">\\n    <slot />\\n  </div>\\n  <footer>\\n    <slot\\n      name=\\"footer\\">\\n      <!-- <Button\\n        on:click={onCancel}>\\n        Close\\n      </Button> -->\\n    </slot>\\n  </footer>\\n</div>\\n"],"names":[],"mappings":"AAWO,8BAAe,CAAC,WAAW,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,OAAO,KAAK,CAAC,KAAK,CAAC,CAAC,SAAS,KAAK,CAAC,IAAI,CAAC,CAAC,MAAM,IAAI,CAAC,QAAQ,EAAE,CAAC,qBAAM,CAAC,WAAW,IAAI,CAAC,cAAc,GAAG,CAAC,WAAW,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,GAAG,CAAC,WAAW,IAAI,CAAC,SAAS,MAAM,CAAC,SAAS,KAAK,CAAC,IAAI,IAAI,CAAC,MAAM,GAAG,CAAC,QAAQ,IAAI,CAAC,qBAAM,CAAC,cAAc,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,YAAY,MAAM,CAAC,IAAI,CAAC,UAAU,CAAC,OAAO,CAAC,CAAC,uBAAQ,CAAC,qBAAM,CAAC,qBAAM,CAAC,QAAQ,IAAI,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,qBAAM,CAAC,KAAK,KAAK,GAAG,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,MAAM,KAAK,CAAC,CAAC"}`
};
const Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  $$result.css.add(css$3);
  return `<div class="${"modal-backdrop svelte-1fuqbil"}"></div>
<div class="${"modal svelte-1fuqbil"}"><header class="${"svelte-1fuqbil"}">${slots.header ? slots.header({}) : ``}</header>
  <div class="${"content svelte-1fuqbil"}">${slots.default ? slots.default({}) : ``}</div>
  <footer class="${"svelte-1fuqbil"}">${slots.footer ? slots.footer({}) : `
      
    `}</footer></div>`;
});
const Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {open = false} = $$props;
  if ($$props.open === void 0 && $$bindings.open && open !== void 0)
    $$bindings.open(open);
  return `${open === true ? `${validate_component(Modal, "Modal").$$render($$result, {}, {}, {
    header: () => `<h1 slot="${"header"}" class="${"bg-teal-600"}">Header
    </h1>`,
    default: () => `<nav class="${"text-xl"}"><a class="${"block"}" href="${"/auth/login"}">Login</a>
      <a class="${"block"}" href="${"/register"}">Register</a></nav>`
  })}` : ``}`;
});
const Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<footer class="${"bg-gray-100 p-4 text-teal-600 border-t border-tale-500 border-opacity-25"}">
<div class="${"max-w-screen-xl mx-auto px-4"}">
  <div class="${"-mx-4 flex flex-wrap"}">
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/4"}">
      <div class="${"flex-1 px-10 py-12"}"><h4 class="${"font-extrabold py-4"}">About</h4>
        <ul class="${"text-gray-700"}"><li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li></ul></div></div>
    
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/4"}">
      <div class="${"flex-1 px-10 py-12"}"><h4 class="${"font-extrabold py-4"}">Workers</h4>
        <ul class="${"text-gray-700"}"><li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li></ul></div></div>
    
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/4"}">
      <div class="${"flex-1 px-10 py-12"}"><h4 class="${"font-extrabold py-4"}">Partners</h4>
        <ul class="${"text-gray-700"}"><li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li></ul></div></div>
    
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/4"}">
      <div class="${"flex-1 px-10 py-12"}"><h4 class="${"font-extrabold py-4"}">Companies</h4>
        <ul class="${"text-gray-700"}"><li>1</li>
          <li>1</li>
          <li>1</li>
          <li>1</li></ul></div></div>

    
    <div class="${"w-full"}">
      <div class="${"px-10 py-12"}"><p class="${"font-extrabold text-center"}">@webspaceX 2021</p></div></div></div></div>


	
</footer>`;
});
var app = "/*! tailwindcss v2.1.1 | MIT License | https://tailwindcss.com*/\n\n/*! modern-normalize v1.0.0 | MIT License | https://github.com/sindresorhus/modern-normalize */:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}html{line-height:1.15;-webkit-text-size-adjust:100%}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;margin:0}hr{color:inherit;height:0}abbr[title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}legend{padding:0}progress{vertical-align:baseline}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}button{background-color:transparent;background-image:none}button:focus{outline:1px dotted;outline:5px auto -webkit-focus-ring-color}fieldset,ol,ul{margin:0;padding:0}ol,ul{list-style:none}html{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5}body{font-family:inherit;line-height:inherit}*,:after,:before{border:0 solid #e5e7eb;box-sizing:border-box}hr{border-top-width:1px}img{border-style:solid}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input:-ms-input-placeholder,textarea:-ms-input-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}table{border-collapse:collapse}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}button,input,optgroup,select,textarea{color:inherit;line-height:inherit;padding:0}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}.space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(1.5rem*var(--tw-space-y-reverse));margin-top:calc(1.5rem*(1 - var(--tw-space-y-reverse)))}.space-y-8>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(2rem*var(--tw-space-y-reverse));margin-top:calc(2rem*(1 - var(--tw-space-y-reverse)))}.-space-y-px>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(-1px*var(--tw-space-y-reverse));margin-top:calc(-1px*(1 - var(--tw-space-y-reverse)))}.sr-only{clip:rect(0,0,0,0);border-width:0;height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px}.appearance-none{-webkit-appearance:none;-moz-appearance:none;appearance:none}.bg-white{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.bg-gray-50{--tw-bg-opacity:1;background-color:rgba(249,250,251,var(--tw-bg-opacity))}.bg-gray-100{--tw-bg-opacity:1;background-color:rgba(243,244,246,var(--tw-bg-opacity))}.bg-teal-500{--tw-bg-opacity:1;background-color:rgba(56,178,172,var(--tw-bg-opacity))}.bg-teal-600,.hover\\:bg-teal-600:hover{--tw-bg-opacity:1;background-color:rgba(49,151,149,var(--tw-bg-opacity))}.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops))}.from-teal-500{--tw-gradient-from:#38b2ac;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(56,178,172,0))}.to-teal-600{--tw-gradient-to:#319795}.hover\\:from-teal-600:hover{--tw-gradient-from:#319795;--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(49,151,149,0))}.border-transparent{border-color:transparent}.border-gray-300{--tw-border-opacity:1;border-color:rgba(209,213,219,var(--tw-border-opacity))}.focus\\:border-teal-500:focus{--tw-border-opacity:1;border-color:rgba(56,178,172,var(--tw-border-opacity))}.border-opacity-25{--tw-border-opacity:0.25}.rounded-none{border-radius:0}.rounded{border-radius:.25rem}.rounded-md{border-radius:.375rem}.rounded-lg{border-radius:.5rem}.rounded-full{border-radius:9999px}.rounded-t-md{border-top-left-radius:.375rem;border-top-right-radius:.375rem}.rounded-b-md{border-bottom-left-radius:.375rem;border-bottom-right-radius:.375rem}.border{border-width:1px}.border-t{border-top-width:1px}.border-b{border-bottom-width:1px}.cursor-pointer{cursor:pointer}.block{display:block}.flex{display:flex}.table{display:table}.grid{display:grid}.contents{display:contents}.hidden{display:none}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.justify-self-start{justify-self:start}.flex-1{flex:1 1 0%}.font-light{font-weight:300}.font-normal{font-weight:400}.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-extrabold{font-weight:800}.h-4{height:1rem}.h-5{height:1.25rem}.h-6{height:1.5rem}.h-12{height:3rem}.h-16{height:4rem}.h-full{height:100%}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-6xl{font-size:3.75rem}.leading-none,.text-6xl{line-height:1}.m-4{margin:1rem}.m-12{margin:3rem}.m-20{margin:5rem}.mx-auto{margin-left:auto;margin-right:auto}.-mx-4{margin-left:-1rem;margin-right:-1rem}.ml-2{margin-left:.5rem}.mt-4{margin-top:1rem}.mb-4{margin-bottom:1rem}.mt-6{margin-top:1.5rem}.mt-8{margin-top:2rem}.mb-8{margin-bottom:2rem}.mt-12{margin-top:3rem}.max-w-md{max-width:28rem}.max-w-screen-xl{max-width:1280px}.min-h-full{min-height:100%}.min-h-screen{min-height:100vh}.focus\\:outline-none:focus,.outline-none{outline:2px solid transparent;outline-offset:2px}.p-3{padding:.75rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}.px-1{padding-left:.25rem;padding-right:.25rem}.py-2{padding-bottom:.5rem;padding-top:.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.py-4{padding-bottom:1rem;padding-top:1rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-8{padding-bottom:2rem;padding-top:2rem}.px-8{padding-left:2rem;padding-right:2rem}.px-10{padding-left:2.5rem;padding-right:2.5rem}.py-12{padding-bottom:3rem;padding-top:3rem}.py-16{padding-bottom:4rem;padding-top:4rem}.py-40{padding-bottom:10rem;padding-top:10rem}.pt-2{padding-top:.5rem}.pl-3{padding-left:.75rem}.placeholder-gray-500::-moz-placeholder{--tw-placeholder-opacity:1;color:rgba(107,114,128,var(--tw-placeholder-opacity))}.placeholder-gray-500:-ms-input-placeholder{--tw-placeholder-opacity:1;color:rgba(107,114,128,var(--tw-placeholder-opacity))}.placeholder-gray-500::placeholder{--tw-placeholder-opacity:1;color:rgba(107,114,128,var(--tw-placeholder-opacity))}.static{position:static}.absolute{position:absolute}.relative{position:relative}.inset-y-0{bottom:0;top:0}.left-0{left:0}*{--tw-shadow:0 0 transparent}.shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,0.05)}.shadow-md,.shadow-sm{box-shadow:var(--tw-ring-offset-shadow,0 0 transparent),var(--tw-ring-shadow,0 0 transparent),var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06)}.hover\\:shadow-lg:hover,.shadow-lg{--tw-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);box-shadow:var(--tw-ring-offset-shadow,0 0 transparent),var(--tw-ring-shadow,0 0 transparent),var(--tw-shadow)}*{--tw-ring-inset:var(--tw-empty,/*!*/ /*!*/);--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,0.5);--tw-ring-offset-shadow:0 0 transparent;--tw-ring-shadow:0 0 transparent}.focus\\:ring-2:focus{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 transparent)}.focus\\:ring-offset-2:focus{--tw-ring-offset-width:2px}.focus\\:ring-indigo-500:focus{--tw-ring-opacity:1;--tw-ring-color:rgba(99,102,241,var(--tw-ring-opacity))}.focus\\:ring-teal-500:focus{--tw-ring-opacity:1;--tw-ring-color:rgba(56,178,172,var(--tw-ring-opacity))}.text-left{text-align:left}.text-center{text-align:center}.text-black{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.text-white{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}.text-gray-300{--tw-text-opacity:1;color:rgba(209,213,219,var(--tw-text-opacity))}.text-gray-600{--tw-text-opacity:1;color:rgba(75,85,99,var(--tw-text-opacity))}.text-gray-700{--tw-text-opacity:1;color:rgba(55,65,81,var(--tw-text-opacity))}.text-gray-800{--tw-text-opacity:1;color:rgba(31,41,55,var(--tw-text-opacity))}.text-gray-900{--tw-text-opacity:1;color:rgba(17,24,39,var(--tw-text-opacity))}.text-teal-500{--tw-text-opacity:1;color:rgba(56,178,172,var(--tw-text-opacity))}.text-teal-600{--tw-text-opacity:1;color:rgba(49,151,149,var(--tw-text-opacity))}.group:hover .group-hover\\:text-teal-400{--tw-text-opacity:1;color:rgba(79,209,197,var(--tw-text-opacity))}.hover\\:text-gray-900:hover{--tw-text-opacity:1;color:rgba(17,24,39,var(--tw-text-opacity))}.hover\\:text-teal-500:hover{--tw-text-opacity:1;color:rgba(56,178,172,var(--tw-text-opacity))}.no-underline{text-decoration:none}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.tracking-wide{letter-spacing:.025em}.w-4{width:1rem}.w-5{width:1.25rem}.w-6{width:1.5rem}.w-12{width:3rem}.w-auto{width:auto}.w-full{width:100%}.focus\\:z-10:focus{z-index:10}.gap-2{gap:.5rem}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.transform{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;transform:translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.transition{transition-duration:.15s;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-200{transition-duration:.2s}.duration-300{transition-duration:.3s}@-webkit-keyframes spin{to{transform:rotate(1turn)}}@keyframes spin{to{transform:rotate(1turn)}}@-webkit-keyframes ping{75%,to{opacity:0;transform:scale(2)}}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}@-webkit-keyframes pulse{50%{opacity:.5}}@keyframes pulse{50%{opacity:.5}}@-webkit-keyframes bounce{0%,to{-webkit-animation-timing-function:cubic-bezier(.8,0,1,1);animation-timing-function:cubic-bezier(.8,0,1,1);transform:translateY(-25%)}50%{-webkit-animation-timing-function:cubic-bezier(0,0,.2,1);animation-timing-function:cubic-bezier(0,0,.2,1);transform:none}}@keyframes bounce{0%,to{-webkit-animation-timing-function:cubic-bezier(.8,0,1,1);animation-timing-function:cubic-bezier(.8,0,1,1);transform:translateY(-25%)}50%{-webkit-animation-timing-function:cubic-bezier(0,0,.2,1);animation-timing-function:cubic-bezier(0,0,.2,1);transform:none}}.animate-bounce{-webkit-animation:bounce 1s infinite;animation:bounce 1s infinite}.filter{--tw-blur:var(--tw-empty,/*!*/ /*!*/);--tw-brightness:var(--tw-empty,/*!*/ /*!*/);--tw-contrast:var(--tw-empty,/*!*/ /*!*/);--tw-grayscale:var(--tw-empty,/*!*/ /*!*/);--tw-hue-rotate:var(--tw-empty,/*!*/ /*!*/);--tw-invert:var(--tw-empty,/*!*/ /*!*/);--tw-saturate:var(--tw-empty,/*!*/ /*!*/);--tw-sepia:var(--tw-empty,/*!*/ /*!*/);--tw-drop-shadow:var(--tw-empty,/*!*/ /*!*/);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.drop-shadow{--tw-drop-shadow:drop-shadow(0 1px 2px rgba(0,0,0,0.1)) drop-shadow(0 1px 1px rgba(0,0,0,0.06))}@media (min-width:640px){.sm\\:text-sm{font-size:.875rem;line-height:1.25rem}.sm\\:p-12{padding:3rem}.sm\\:px-2{padding-left:.5rem;padding-right:.5rem}.sm\\:px-6{padding-left:1.5rem;padding-right:1.5rem}.sm\\:py-40{padding-bottom:10rem;padding-top:10rem}.sm\\:w-1\\/2{width:50%}}@media (min-width:768px){.md\\:px-4{padding-left:1rem;padding-right:1rem}}@media (min-width:1024px){.lg\\:m-40{margin:10rem}.lg\\:ml-20{margin-left:5rem}.lg\\:mt-32{margin-top:8rem}.lg\\:px-6{padding-left:1.5rem;padding-right:1.5rem}.lg\\:px-8{padding-left:2rem;padding-right:2rem}.lg\\:w-1\\/3{width:33.333333%}.lg\\:w-1\\/4{width:25%}}@media (min-width:1280px){.xl\\:px-8{padding-left:2rem;padding-right:2rem}.xl\\:w-2\\/4{width:50%}}";
var $layout_svelte_svelte_type_style_lang = "body{padding:0}";
const css$2 = {
  code: "body{padding:0}",
  map: `{"version":3,"file":"$layout.svelte","sources":["$layout.svelte"],"sourcesContent":["<script>\\n\\timport Header from '$lib/layout/Header/index.svelte'\\n\\timport Aside from '$lib/layout/Sidebar/index.svelte'\\n\\timport Footer from '$lib/layout/Footer/index.svelte'\\n\\timport '../app.postcss'\\n\\n\\tlet open = false\\n</script>\\n\\n<Header bind:sidebar={open}/>\\n<Aside bind:open />\\n\\n<main>\\n\\t<slot />\\n</main>\\n\\n<Footer />\\n\\n<style>:global(body){padding:0}</style>\\n"],"names":[],"mappings":"AAkBe,IAAI,AAAC,CAAC,QAAQ,CAAC,CAAC"}`
};
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let open = false;
  $$result.css.add(css$2);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `${validate_component(Header, "Header").$$render($$result, {sidebar: open}, {
      sidebar: ($$value) => {
        open = $$value;
        $$settled = false;
      }
    }, {})}
${validate_component(Sidebar, "Aside").$$render($$result, {open}, {
      open: ($$value) => {
        open = $$value;
        $$settled = false;
      }
    }, {})}

<main>${slots.default ? slots.default({}) : ``}</main>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
  } while (!$$settled);
  return $$rendered;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
function load$1({error: error2, status}) {
  return {props: {error: error2, status}};
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<p>${escape(error2.message)}</p>


${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1,
  load: load$1
});
var index_svelte_svelte_type_style_lang$1 = "svg.svelte-1gtp85a line.svelte-1gtp85a{stroke:currentColor;stroke-width:12}";
const css$1 = {
  code: "svg.svelte-1gtp85a line.svelte-1gtp85a{stroke:currentColor;stroke-width:12}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["\\n<section class=\\"bg-teal-600 h-full py-16 px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8\\">\\n  <div class=\\"lg:2/6 xl:w-4/4 m-12 lg:m-40 lg:ml-30 text-left\\">\\n    <form method=\\"GET\\">\\n      <input\\n        class=\\"w-full\\n        h-16 rounded mb-8 focus:outline-none focus:shadow-outline text-xl px-8 shadow-lg\\"\\n        type=\\"search\\"\\n        name=\\"s\\"\\n        placeholder=\\"Search...\\">\\n    </form>\\n    </div>\\n</section>\\n\\n<!-- hero section -->\\n<section class=\\"p-8\\">\\n  <div class=\\"lg:2/6 xl:w-2/4 m-20 lg:m-40 text-left\\">\\n    <div class=\\"text-6xl font-semibold text-gray-900 leading-none\\">Bring all your work together</div>\\n    <div class=\\"mt-6 text-xl font-light text-true-gray-500 antialiased\\">A better experience for your attendees and less stress your employees.</div>\\n    <button class=\\"mt-6 px-8 py-4 rounded-full font-normal tracking-wide bg-gradient-to-b from-teal-500 to-teal-600 text-white outline-none focus:outline-none hover:shadow-lg hover:from-teal-600 transition duration-200 ease-in-out\\">\\n      Find out more\\n    </button>\\n  </div>\\n  <div class=\\"mt-12 lg:mt-32 lg:ml-20 text-left\\">\\n    <bottom type=\\"button\\" class=\\"flex items-center justify-center w-12 h-12 rounded-full bg-cool-gray-100 text-gray-800 animate-bounce hover:text-gray-900 hover:bg-cool-gray-50 transition duration-300 ease-in-out cursor-pointer\\">\\n      <svg class=\\"w-6 h-6\\" fill=\\"none\\" stroke=\\"currentColor\\" viewBox=\\"0 0 24 24\\" xmlns=\\"http://www.w3.org/2000/svg\\">\\n        <path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"2\\" d=\\"M19 14l-7 7m0 0l-7-7m7 7V3\\"></path>\\n      </svg>\\n    </bottom>\\n  </div>\\n\\n  <!-- /hero section -->\\n</section>\\n\\n<!-- Container -->\\n<div class=\\"max-w-screen-xl mx-auto m-12 p-4\\">\\n  <!-- Grid wrapper -->\\n  <div class=\\"-mx-4 flex flex-wrap\\">\\n    <!-- Grid column -->\\n    <div class=\\"w-full p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"px-10 py-12 text-gray-300 rounded-lg\\">\\n        <svg height=\\"100%\\" width=\\"100%\\">\\n          <line x1=0 y1=4 x2=400 y2=4/>\\n          <line x1=0 y1=34 x2=200 y2=34/>\\n          <line x1=0 y1=64 x2=300 y2=64/>\\n          <line x1=0 y1=94 x2=280 y2=94/>\\n        </svg>\\n      </div>\\n    </div>\\n    <!-- Grid column -->\\n    <div class=\\"w-full p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"px-10 py-12 text-gray-300 rounded-lg\\">\\n        <svg height=\\"100%\\" width=\\"100%\\">\\n          <line x1=0 y1=4 x2=400 y2=4/>\\n          <line x1=0 y1=34 x2=200 y2=34/>\\n          <line x1=0 y1=64 x2=300 y2=64/>\\n          <line x1=0 y1=94 x2=280 y2=94/>\\n        </svg>\\n      </div>\\n    </div>\\n    <!-- Grid column -->\\n    <div class=\\"w-full p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"px-10 py-12 text-gray-300 rounded-lg\\">\\n        <svg height=\\"100%\\" width=\\"100%\\">\\n          <line x1=0 y1=4 x2=400 y2=4/>\\n          <line x1=0 y1=34 x2=200 y2=34/>\\n          <line x1=0 y1=64 x2=300 y2=64/>\\n          <line x1=0 y1=94 x2=280 y2=94/>\\n        </svg>\\n      </div>\\n    </div>\\n  </div>\\n</div>\\n\\n<!-- Container -->\\n<div class=\\"max-w-screen-xl mx-auto p-4 m-12\\">\\n  <div class=\\"grid grid-cols-2 gap-2 text-center\\">\\n    <div>\\n        <svg height=\\"100%\\" width=\\"100%\\">\\n          <line x1=0 y1=4 x2=400 y2=4/>\\n          <line x1=0 y1=34 x2=200 y2=34/>\\n          <line x1=0 y1=64 x2=300 y2=64/>\\n          <line x1=0 y1=94 x2=280 y2=94/>\\n        </svg>\\n    </div>\\n    <div>\\n        <svg height=\\"100%\\" width=\\"100%\\">\\n          <line x1=0 y1=4 x2=400 y2=4/>\\n          <line x1=0 y1=34 x2=200 y2=34/>\\n          <line x1=0 y1=64 x2=300 y2=64/>\\n          <line x1=0 y1=94 x2=280 y2=94/>\\n        </svg>\\n    </div>\\n  </div>\\n</div>\\n\\n\\n<!-- Container -->\\n<div class=\\"max-w-screen-xl mx-auto m-12 p-4\\">\\n  <!-- Grid wrapper -->\\n  <div class=\\"-mx-4 flex flex-wrap\\">\\n    <!-- Grid column -->\\n    <div class=\\"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg\\">\\n        <!-- Card contents -->\\n      </div>\\n    </div>\\n    <!-- Grid column -->\\n    <div class=\\"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg\\">\\n        <!-- Card contents -->\\n      </div>\\n    </div>\\n    <!-- Grid column -->\\n    <div class=\\"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3\\">\\n      <!-- Column contents -->\\n      <div class=\\"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg\\">\\n        <!-- Card contents -->\\n      </div>\\n    </div>\\n  </div>\\n</div>\\n<!-- End Container -->\\n\\n<style>svg line{stroke:currentColor;stroke-width:12}</style>"],"names":[],"mappings":"AAiIO,kBAAG,CAAC,mBAAI,CAAC,OAAO,YAAY,CAAC,aAAa,EAAE,CAAC"}'
};
const Main = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<section class="${"bg-teal-600 h-full py-16 px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8"}"><div class="${"lg:2/6 xl:w-4/4 m-12 lg:m-40 lg:ml-30 text-left"}"><form method="${"GET"}"><input class="${"w-full\n        h-16 rounded mb-8 focus:outline-none focus:shadow-outline text-xl px-8 shadow-lg"}" type="${"search"}" name="${"s"}" placeholder="${"Search..."}"></form></div></section>


<section class="${"p-8"}"><div class="${"lg:2/6 xl:w-2/4 m-20 lg:m-40 text-left"}"><div class="${"text-6xl font-semibold text-gray-900 leading-none"}">Bring all your work together</div>
    <div class="${"mt-6 text-xl font-light text-true-gray-500 antialiased"}">A better experience for your attendees and less stress your employees.</div>
    <button class="${"mt-6 px-8 py-4 rounded-full font-normal tracking-wide bg-gradient-to-b from-teal-500 to-teal-600 text-white outline-none focus:outline-none hover:shadow-lg hover:from-teal-600 transition duration-200 ease-in-out"}">Find out more
    </button></div>
  <div class="${"mt-12 lg:mt-32 lg:ml-20 text-left"}"><bottom type="${"button"}" class="${"flex items-center justify-center w-12 h-12 rounded-full bg-cool-gray-100 text-gray-800 animate-bounce hover:text-gray-900 hover:bg-cool-gray-50 transition duration-300 ease-in-out cursor-pointer"}"><svg class="${"w-6 h-6"}" fill="${"none"}" stroke="${"currentColor"}" viewBox="${"0 0 24 24"}" xmlns="${"http://www.w3.org/2000/svg"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" stroke-width="${"2"}" d="${"M19 14l-7 7m0 0l-7-7m7 7V3"}"></path></svg></bottom></div>

  </section>


<div class="${"max-w-screen-xl mx-auto m-12 p-4"}">
  <div class="${"-mx-4 flex flex-wrap"}">
    <div class="${"w-full p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"px-10 py-12 text-gray-300 rounded-lg"}"><svg height="${"100%"}" width="${"100%"}" class="${"svelte-1gtp85a"}"><line x1="${"0"}" y1="${"4"}" x2="${"400"}" y2="${"4"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"34"}" x2="${"200"}" y2="${"34"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"64"}" x2="${"300"}" y2="${"64"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"94"}" x2="${"280"}" y2="${"94"}" class="${"svelte-1gtp85a"}"></line></svg></div></div>
    
    <div class="${"w-full p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"px-10 py-12 text-gray-300 rounded-lg"}"><svg height="${"100%"}" width="${"100%"}" class="${"svelte-1gtp85a"}"><line x1="${"0"}" y1="${"4"}" x2="${"400"}" y2="${"4"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"34"}" x2="${"200"}" y2="${"34"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"64"}" x2="${"300"}" y2="${"64"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"94"}" x2="${"280"}" y2="${"94"}" class="${"svelte-1gtp85a"}"></line></svg></div></div>
    
    <div class="${"w-full p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"px-10 py-12 text-gray-300 rounded-lg"}"><svg height="${"100%"}" width="${"100%"}" class="${"svelte-1gtp85a"}"><line x1="${"0"}" y1="${"4"}" x2="${"400"}" y2="${"4"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"34"}" x2="${"200"}" y2="${"34"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"64"}" x2="${"300"}" y2="${"64"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"94"}" x2="${"280"}" y2="${"94"}" class="${"svelte-1gtp85a"}"></line></svg></div></div></div></div>


<div class="${"max-w-screen-xl mx-auto p-4 m-12"}"><div class="${"grid grid-cols-2 gap-2 text-center"}"><div><svg height="${"100%"}" width="${"100%"}" class="${"svelte-1gtp85a"}"><line x1="${"0"}" y1="${"4"}" x2="${"400"}" y2="${"4"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"34"}" x2="${"200"}" y2="${"34"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"64"}" x2="${"300"}" y2="${"64"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"94"}" x2="${"280"}" y2="${"94"}" class="${"svelte-1gtp85a"}"></line></svg></div>
    <div><svg height="${"100%"}" width="${"100%"}" class="${"svelte-1gtp85a"}"><line x1="${"0"}" y1="${"4"}" x2="${"400"}" y2="${"4"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"34"}" x2="${"200"}" y2="${"34"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"64"}" x2="${"300"}" y2="${"64"}" class="${"svelte-1gtp85a"}"></line><line x1="${"0"}" y1="${"94"}" x2="${"280"}" y2="${"94"}" class="${"svelte-1gtp85a"}"></line></svg></div></div></div>



<div class="${"max-w-screen-xl mx-auto m-12 p-4"}">
  <div class="${"-mx-4 flex flex-wrap"}">
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg"}"></div></div>
    
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg"}"></div></div>
    
    <div class="${"w-full flex flex-col p-4 sm:w-1/2 lg:w-1/3"}">
      <div class="${"flex-1 px-10 py-12 bg-white rounded-lg shadow-lg"}"></div></div></div></div>
`;
});
const prerender$1 = true;
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>Home</title>`, ""}`, ""}

${validate_component(Main, "Main").$$render($$result, {}, {}, {})}`;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes,
  prerender: prerender$1
});
const Register = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="${"min-h-full flex items-center justify-center bg-gray-50 py-40 sm:py-40 px-8 sm:px-6 lg:px-8"}">
  <div class="${"max-w-md w-full space-y-8"}"><div class="${"bg-white px-6 py-8 rounded shadow-md text-black w-full"}"><h2 class="${"mb-8 text-3xl text-center font-extrabold text-gray-900"}">Sign up
    </h2>
      <input type="${"text"}" class="${"block border border-grey-light w-full p-3 rounded mb-4"}" name="${"fullname"}" placeholder="${"Full Name"}">

      <input type="${"text"}" class="${"block border border-grey-light w-full p-3 rounded mb-4"}" name="${"email"}" placeholder="${"Email"}">

      <input type="${"password"}" class="${"block border border-grey-light w-full p-3 rounded mb-4"}" name="${"password"}" placeholder="${"Password"}">
      <input type="${"password"}" class="${"block border border-grey-light w-full p-3 rounded mb-4"}" name="${"confirm_password"}" placeholder="${"Confirm Password"}">

      <button type="${"submit"}" class="${"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"}">Create Account</button>

      <div class="${"text-center text-sm text-grey-dark mt-4"}">By signing up, you agree to the 
        <a class="${"no-underline border-b border-grey-dark text-grey-dark"}" href="${"#/terms-of-service"}">Terms of Service
        </a> and 
        <a class="${"no-underline border-b border-grey-dark text-grey-dark"}" href="${"#/privacy-policy"}">Privacy Policy
        </a></div></div>

    <div class="${"text-grey-dark mt-6"}">Already have an account? 
        <a class="${"no-underline border-b border-blue text-blue"}" href="${"/login/"}">Log in
        </a>.
    </div></div></section>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Register
});
const browser = false;
const dev = false;
const hydrate = dev;
const router = browser;
const prerender = true;
const About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>About</title>`, ""}`, ""}

<div class="${"min-h-screen bg-gray-100 p-6 flex flex-col justify-center sm:p-12"}"><div class="${"content"}"><h1>About this app</h1>

		<p>This is a <a href="${"https://kit.svelte.dev"}">SvelteKit</a> app. You can make your own by typing the
			following into your command line and following the prompts:
		</p>

		
		<pre>npm init svelte@next</pre>

		<p>The page you&#39;re looking at is purely static HTML, with no client-side interactivity needed.
			Because of that, we don&#39;t need to load any JavaScript. Try viewing the page&#39;s source, or opening
			the devtools network panel and reloading.
		</p>

		<p>The <a href="${"/todos"}">TODOs</a> page illustrates SvelteKit&#39;s data loading and form handling. Try using
			it with JavaScript disabled!
		</p></div>
</div>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: About,
  hydrate,
  router,
  prerender
});
var index_svelte_svelte_type_style_lang = `.todos.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{line-height:1;margin:var(--column-margin-top) auto 0 auto;max-width:var(--column-width);width:100%}.new.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{margin:0 0 .5rem}input.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{border:1px solid transparent}input.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p:focus-visible{border:1px solid #ff3e00!important;box-shadow:inset 1px 1px 6px rgba(0,0,0,.1);outline:none}.new.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p{background:hsla(0,0%,100%,.05);box-sizing:border-box;font-size:28px;padding:.5em 1em .3em;text-align:center;width:100%}.new.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p,.todo.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{border-radius:8px}.todo.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{grid-gap:.5rem;align-items:center;background-color:#fff;display:grid;filter:drop-shadow(2px 4px 6px rgba(0,0,0,.1));grid-template-columns:2rem 1fr 2rem;margin:0 0 .5rem;padding:.5rem;transform:translate(-1px,-1px);transition:filter .2s,transform .2s}.done.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{filter:drop-shadow(0 0 1px rgba(0,0,0,.1));opacity:.4;transform:none}form.text.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{align-items:center;display:flex;flex:1;position:relative}.todo.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p{border-radius:3px;flex:1;padding:.5em 2em .5em .8em}.todo.svelte-mhdm0p button.svelte-mhdm0p.svelte-mhdm0p{background-color:transparent;background-position:50% 50%;background-repeat:no-repeat;border:none;height:2em;width:2em}button.toggle.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-size:1em auto;border:1px solid rgba(0,0,0,.2);border-radius:50%;box-sizing:border-box}.done.svelte-mhdm0p .toggle.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='22' height='16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m20.5 1.5-13.063 13L1.5 8.59' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}.delete.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 5v17h15V5h-15z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M10 10v6.5m4-6.5v6.5' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 5h20' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m8 5 1.645-3h4.744L16 5H8z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E");opacity:.2}.delete.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p:hover{opacity:1;transition:opacity .2s}.save.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M17 2v9H7.5V2H17z' fill='%23fff' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M13.5 5.5v2M5.998 2H18.5' stroke='%23676778' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");opacity:0;position:absolute;right:0}.todo.svelte-mhdm0p input.svelte-mhdm0p:focus+.save.svelte-mhdm0p{opacity:1;transition:opacity .2s}`;
const css = {
  code: `.todos.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{line-height:1;margin:var(--column-margin-top) auto 0 auto;max-width:var(--column-width);width:100%}.new.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{margin:0 0 .5rem}input.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{border:1px solid transparent}input.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p:focus-visible{border:1px solid #ff3e00!important;box-shadow:inset 1px 1px 6px rgba(0,0,0,.1);outline:none}.new.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p{background:hsla(0,0%,100%,.05);box-sizing:border-box;font-size:28px;padding:.5em 1em .3em;text-align:center;width:100%}.new.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p,.todo.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{border-radius:8px}.todo.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{grid-gap:.5rem;align-items:center;background-color:#fff;display:grid;filter:drop-shadow(2px 4px 6px rgba(0,0,0,.1));grid-template-columns:2rem 1fr 2rem;margin:0 0 .5rem;padding:.5rem;transform:translate(-1px,-1px);transition:filter .2s,transform .2s}.done.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{filter:drop-shadow(0 0 1px rgba(0,0,0,.1));opacity:.4;transform:none}form.text.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{align-items:center;display:flex;flex:1;position:relative}.todo.svelte-mhdm0p input.svelte-mhdm0p.svelte-mhdm0p{border-radius:3px;flex:1;padding:.5em 2em .5em .8em}.todo.svelte-mhdm0p button.svelte-mhdm0p.svelte-mhdm0p{background-color:transparent;background-position:50% 50%;background-repeat:no-repeat;border:none;height:2em;width:2em}button.toggle.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-size:1em auto;border:1px solid rgba(0,0,0,.2);border-radius:50%;box-sizing:border-box}.done.svelte-mhdm0p .toggle.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='22' height='16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m20.5 1.5-13.063 13L1.5 8.59' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}.delete.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 5v17h15V5h-15z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M10 10v6.5M14 10v6.5' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 5h20' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m8 5 1.645-3h4.744L16 5H8z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E");opacity:.2}.delete.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p:hover{opacity:1;transition:opacity .2s}.save.svelte-mhdm0p.svelte-mhdm0p.svelte-mhdm0p{background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M17 2v9H7.5V2H17z' fill='%23fff' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M13.5 5.5v2M5.998 2H18.5' stroke='%23676778' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");opacity:0;position:absolute;right:0}.todo.svelte-mhdm0p input.svelte-mhdm0p:focus+.save.svelte-mhdm0p{opacity:1;transition:opacity .2s}`,
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n\\timport { enhance } from '$lib/form';\\n\\t\\n\\t// see https://kit.svelte.dev/docs#loading\\n\\texport const load = async ({ fetch }) => {\\n\\t\\tconst res = await fetch('/todos.json');\\n\\t\\n\\t\\tif (res.ok) {\\n\\t\\t\\tconst todos = await res.json();\\n\\t\\n\\t\\t\\treturn {\\n\\t\\t\\t\\tprops: { todos }\\n\\t\\t\\t};\\n\\t\\t}\\n\\t\\n\\t\\tconst { message } = await res.json();\\n\\t\\n\\t\\treturn {\\n\\t\\t\\terror: new Error(message)\\n\\t\\t};\\n\\t};\\n</script>\\n\\n<script>\\n\\timport { scale } from 'svelte/transition';\\n\\timport { flip } from 'svelte/animate';\\n\\t\\n\\texport let todos;\\n\\t\\n\\tasync function patch(res) {\\n\\t\\tconst todo = await res.json();\\n\\t\\n\\t\\ttodos = todos.map((t) => {\\n\\t\\t\\tif (t.uid === todo.uid) return todo;\\n\\t\\t\\treturn t;\\n\\t\\t});\\n\\t}\\n</script>\\n\\n<svelte:head>\\n\\t<title>Todos</title>\\n</svelte:head>\\n\\n<div class=\\"todos\\">\\n\\t<h1>Todos</h1>\\n\\n\\t<form class=\\"new\\" action=\\"/todos.json\\" method=\\"post\\" use:enhance={{\\n\\t\\tresult: async (res, form) => {\\n\\t\\t\\tconst created = await res.json();\\n\\t\\t\\ttodos = [...todos, created]\\n\\n\\t\\t\\tform.reset();\\n\\t\\t}\\n\\t}}>\\n\\t\\t<input name=\\"text\\" placeholder=\\"+ tap to add a todo\\">\\n\\t</form>\\n\\n\\t{#each todos as todo (todo.uid)}\\n\\t\\t<div class=\\"todo\\" class:done={todo.done} transition:scale|local={{start:0.7}} animate:flip={{duration:200}}>\\n\\t\\t\\t<form action=\\"/todos/{todo.uid}.json?_method=patch\\" method=\\"post\\" use:enhance={{\\n\\t\\t\\t\\tpending: (data) => {\\n\\t\\t\\t\\t\\tconst done = !!data.get('done');\\n\\n\\t\\t\\t\\t\\ttodos = todos.map(t => {\\n\\t\\t\\t\\t\\t\\tif (t === todo) return { ...t, done };\\n\\t\\t\\t\\t\\t\\treturn t;\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tresult: patch\\n\\t\\t\\t}}>\\n\\t\\t\\t\\t<input type=\\"hidden\\" name=\\"done\\" value={todo.done ? '' : 'true'}>\\n\\t\\t\\t\\t<button class=\\"toggle\\" aria-label=\\"Mark todo as {todo.done ? 'not done' : 'done'}\\"/>\\n\\t\\t\\t</form>\\n\\n\\t\\t\\t<form class=\\"text\\" action=\\"/todos/{todo.uid}.json?_method=patch\\" method=\\"post\\" use:enhance={{\\n\\t\\t\\t\\tresult: patch\\n\\t\\t\\t}}>\\n\\t\\t\\t\\t<input type=\\"text\\" name=\\"text\\" value={todo.text}>\\n\\t\\t\\t\\t<button class=\\"save\\" aria-label=\\"Save todo\\"/>\\n\\t\\t\\t</form>\\n\\n\\t\\t\\t<form action=\\"/todos/{todo.uid}.json?_method=delete\\" method=\\"post\\" use:enhance={{\\n\\t\\t\\t\\tresult: () => {\\n\\t\\t\\t\\t\\ttodos = todos.filter(t => t.uid !== todo.uid);\\n\\t\\t\\t\\t}\\n\\t\\t\\t}}>\\n\\t\\t\\t\\t<button class=\\"delete\\" aria-label=\\"Delete todo\\"/>\\n\\t\\t\\t</form>\\n\\t\\t</div>\\n\\t{/each}\\n</div>\\n\\n<style>.todos{line-height:1;margin:var(--column-margin-top) auto 0 auto;max-width:var(--column-width);width:100%}.new{margin:0 0 .5rem}input{border:1px solid transparent}input:focus-visible{border:1px solid #ff3e00!important;box-shadow:inset 1px 1px 6px rgba(0,0,0,.1);outline:none}.new input{background:hsla(0,0%,100%,.05);box-sizing:border-box;font-size:28px;padding:.5em 1em .3em;text-align:center;width:100%}.new input,.todo{border-radius:8px}.todo{grid-gap:.5rem;align-items:center;background-color:#fff;display:grid;filter:drop-shadow(2px 4px 6px rgba(0,0,0,.1));grid-template-columns:2rem 1fr 2rem;margin:0 0 .5rem;padding:.5rem;transform:translate(-1px,-1px);transition:filter .2s,transform .2s}.done{filter:drop-shadow(0 0 1px rgba(0,0,0,.1));opacity:.4;transform:none}form.text{align-items:center;display:flex;flex:1;position:relative}.todo input{border-radius:3px;flex:1;padding:.5em 2em .5em .8em}.todo button{background-color:transparent;background-position:50% 50%;background-repeat:no-repeat;border:none;height:2em;width:2em}button.toggle{background-size:1em auto;border:1px solid rgba(0,0,0,.2);border-radius:50%;box-sizing:border-box}.done .toggle{background-image:url(\\"data:image/svg+xml;charset=utf-8,%3Csvg width='22' height='16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m20.5 1.5-13.063 13L1.5 8.59' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\\")}.delete{background-image:url(\\"data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 5v17h15V5h-15z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M10 10v6.5M14 10v6.5' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 5h20' stroke='%23676778' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m8 5 1.645-3h4.744L16 5H8z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E\\");opacity:.2}.delete:hover{opacity:1;transition:opacity .2s}.save{background-image:url(\\"data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2z' fill='%23676778' stroke='%23676778' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M17 2v9H7.5V2H17z' fill='%23fff' stroke='%23fff' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M13.5 5.5v2M5.998 2H18.5' stroke='%23676778' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\\");opacity:0;position:absolute;right:0}.todo input:focus+.save{opacity:1;transition:opacity .2s}</style>"],"names":[],"mappings":"AA4FO,gDAAM,CAAC,YAAY,CAAC,CAAC,OAAO,IAAI,mBAAmB,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,UAAU,IAAI,cAAc,CAAC,CAAC,MAAM,IAAI,CAAC,8CAAI,CAAC,OAAO,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,+CAAK,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,WAAW,CAAC,+CAAK,cAAc,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,OAAO,UAAU,CAAC,WAAW,KAAK,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,QAAQ,IAAI,CAAC,kBAAI,CAAC,iCAAK,CAAC,WAAW,KAAK,CAAC,CAAC,EAAE,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,WAAW,UAAU,CAAC,UAAU,IAAI,CAAC,QAAQ,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,WAAW,MAAM,CAAC,MAAM,IAAI,CAAC,kBAAI,CAAC,iCAAK,CAAC,+CAAK,CAAC,cAAc,GAAG,CAAC,+CAAK,CAAC,SAAS,KAAK,CAAC,YAAY,MAAM,CAAC,iBAAiB,IAAI,CAAC,QAAQ,IAAI,CAAC,OAAO,YAAY,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,sBAAsB,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,OAAO,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,QAAQ,KAAK,CAAC,UAAU,UAAU,IAAI,CAAC,IAAI,CAAC,CAAC,WAAW,MAAM,CAAC,GAAG,CAAC,SAAS,CAAC,GAAG,CAAC,+CAAK,CAAC,OAAO,YAAY,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,QAAQ,EAAE,CAAC,UAAU,IAAI,CAAC,IAAI,+CAAK,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,KAAK,CAAC,CAAC,SAAS,QAAQ,CAAC,mBAAK,CAAC,iCAAK,CAAC,cAAc,GAAG,CAAC,KAAK,CAAC,CAAC,QAAQ,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,CAAC,mBAAK,CAAC,kCAAM,CAAC,iBAAiB,WAAW,CAAC,oBAAoB,GAAG,CAAC,GAAG,CAAC,kBAAkB,SAAS,CAAC,OAAO,IAAI,CAAC,OAAO,GAAG,CAAC,MAAM,GAAG,CAAC,MAAM,iDAAO,CAAC,gBAAgB,GAAG,CAAC,IAAI,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,cAAc,GAAG,CAAC,WAAW,UAAU,CAAC,mBAAK,CAAC,mCAAO,CAAC,iBAAiB,IAAI,6PAA6P,CAAC,CAAC,iDAAO,CAAC,iBAAiB,IAAI,ykBAAykB,CAAC,CAAC,QAAQ,EAAE,CAAC,iDAAO,MAAM,CAAC,QAAQ,CAAC,CAAC,WAAW,OAAO,CAAC,GAAG,CAAC,+CAAK,CAAC,iBAAiB,IAAI,ohBAAohB,CAAC,CAAC,QAAQ,CAAC,CAAC,SAAS,QAAQ,CAAC,MAAM,CAAC,CAAC,mBAAK,CAAC,mBAAK,MAAM,CAAC,mBAAK,CAAC,QAAQ,CAAC,CAAC,WAAW,OAAO,CAAC,GAAG,CAAC"}`
};
const load = async ({fetch: fetch2}) => {
  const res = await fetch2("/todos.json");
  if (res.ok) {
    const todos = await res.json();
    return {props: {todos}};
  }
  const {message} = await res.json();
  return {error: new Error(message)};
};
const Todos = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {todos} = $$props;
  if ($$props.todos === void 0 && $$bindings.todos && todos !== void 0)
    $$bindings.todos(todos);
  $$result.css.add(css);
  return `${$$result.head += `${$$result.title = `<title>Todos</title>`, ""}`, ""}

<div class="${"todos svelte-mhdm0p"}"><h1>Todos</h1>

	<form class="${"new svelte-mhdm0p"}" action="${"/todos.json"}" method="${"post"}"><input name="${"text"}" placeholder="${"+ tap to add a todo"}" class="${"svelte-mhdm0p"}"></form>

	${each(todos, (todo) => `<div class="${["todo svelte-mhdm0p", todo.done ? "done" : ""].join(" ").trim()}"><form action="${"/todos/" + escape(todo.uid) + ".json?_method=patch"}" method="${"post"}"><input type="${"hidden"}" name="${"done"}"${add_attribute("value", todo.done ? "" : "true", 0)} class="${"svelte-mhdm0p"}">
				<button class="${"toggle svelte-mhdm0p"}" aria-label="${"Mark todo as " + escape(todo.done ? "not done" : "done")}"></button></form>

			<form class="${"text svelte-mhdm0p"}" action="${"/todos/" + escape(todo.uid) + ".json?_method=patch"}" method="${"post"}"><input type="${"text"}" name="${"text"}"${add_attribute("value", todo.text, 0)} class="${"svelte-mhdm0p"}">
				<button class="${"save svelte-mhdm0p"}" aria-label="${"Save todo"}"></button></form>

			<form action="${"/todos/" + escape(todo.uid) + ".json?_method=delete"}" method="${"post"}"><button class="${"delete svelte-mhdm0p"}" aria-label="${"Delete todo"}"></button></form>
		</div>`)}
</div>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Todos,
  load
});
const Login = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="${"min-h-full flex items-center justify-center bg-gray-50 py-40 sm:py-40 px-8 sm:px-6 lg:px-8"}"><div class="${"max-w-md w-full space-y-8"}"><img class="${"mx-auto h-12 w-auto"}" src="${"/workspacex-logo.svg"}" alt="${"Workflow"}">
    <h2 class="${"mt-6 text-center text-3xl font-extrabold text-gray-900"}">Sign in to your account
    </h2>
    <form class="${"mt-8 space-y-6"}" action="${"#"}" method="${"POST"}"><input type="${"hidden"}" name="${"remember"}" value="${"true"}">
      <div class="${"rounded-md shadow-sm -space-y-px"}"><div><label for="${"email-address"}" class="${"sr-only"}">Email address</label>
          <input id="${"email-address"}" name="${"email"}" type="${"email"}" autocomplete="${"email"}" required class="${"appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-teal-500 focus:z-10 sm:text-sm"}" placeholder="${"Email address"}"></div>
        <div><label for="${"password"}" class="${"sr-only"}">Password</label>
          <input id="${"password"}" name="${"password"}" type="${"password"}" autocomplete="${"current-password"}" required class="${"appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"}" placeholder="${"Password"}"></div></div>

      <div class="${"flex items-center justify-between"}"><div class="${"flex items-center"}"><input id="${"remember_me"}" name="${"remember_me"}" type="${"checkbox"}" class="${"h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"}">
          <label for="${"remember_me"}" class="${"ml-2 block text-sm text-gray-900"}">Remember me
          </label></div>

        <div class="${"text-sm"}"><a href="${"#/auth/password-recovery"}" class="${"font-medium text-teal-600 hover:text-teal-500"}">Forgot your password?
          </a></div></div>

      <div><button type="${"submit"}" class="${"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"}"><span class="${"absolute left-0 inset-y-0 flex items-center pl-3"}">
            <svg class="${"h-5 w-5 text-teal-500 group-hover:text-teal-400"}" xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 20 20"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path fill-rule="${"evenodd"}" d="${"M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"}" clip-rule="${"evenodd"}"></path></svg></span>
          Sign in
        </button></div></form></div></section>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Login
});
export {init, render};
