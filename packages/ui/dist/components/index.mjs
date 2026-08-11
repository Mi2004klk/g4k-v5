import {
  useDebouncedValidation
} from "../chunk-3E6CS2SC.mjs";
import {
  __commonJS,
  __require,
  __toESM
} from "../chunk-6DZX6EAA.mjs";

// ../../node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/cjs/_interop_require_default.cjs
var require_interop_require_default = __commonJS({
  "../../node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/cjs/_interop_require_default.cjs"(exports) {
    "use strict";
    function _interop_require_default(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    exports._ = _interop_require_default;
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/deployment-id.js
var require_deployment_id = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/deployment-id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getAssetToken: function() {
        return getAssetToken;
      },
      getAssetTokenQuery: function() {
        return getAssetTokenQuery;
      },
      getDeploymentId: function() {
        return getDeploymentId;
      },
      getDeploymentIdQuery: function() {
        return getDeploymentIdQuery;
      }
    });
    var deploymentId;
    if (typeof window !== "undefined") {
      deploymentId = document.documentElement.dataset.dplId;
      delete document.documentElement.dataset.dplId;
    } else {
      deploymentId = process.env.NEXT_DEPLOYMENT_ID || void 0;
    }
    function getDeploymentId() {
      return deploymentId;
    }
    function getDeploymentIdQuery(ampersand = false) {
      let id = getDeploymentId();
      if (id) {
        return `${ampersand ? "&" : "?"}dpl=${id}`;
      }
      return "";
    }
    function getAssetToken() {
      return process.env.NEXT_SUPPORTS_IMMUTABLE_ASSETS ? void 0 : process.env.NEXT_DEPLOYMENT_ID;
    }
    function getAssetTokenQuery(ampersand = false) {
      let id = getAssetToken();
      if (id) {
        return `${ampersand ? "&" : "?"}dpl=${id}`;
      }
      return "";
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-blur-svg.js
var require_image_blur_svg = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-blur-svg.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "getImageBlurSvg", {
      enumerable: true,
      get: function() {
        return getImageBlurSvg;
      }
    });
    function getImageBlurSvg({ widthInt, heightInt, blurWidth, blurHeight, blurDataURL, objectFit }) {
      const std = 20;
      const svgWidth = blurWidth ? blurWidth * 40 : widthInt;
      const svgHeight = blurHeight ? blurHeight * 40 : heightInt;
      const viewBox = svgWidth && svgHeight ? `viewBox='0 0 ${svgWidth} ${svgHeight}'` : "";
      const preserveAspectRatio = viewBox ? "none" : objectFit === "contain" ? "xMidYMid" : objectFit === "cover" ? "xMidYMid slice" : "none";
      return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${viewBox}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${preserveAspectRatio}' style='filter: url(%23b);' href='${blurDataURL}'/%3E%3C/svg%3E`;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-config.js
var require_image_config = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      VALID_LOADERS: function() {
        return VALID_LOADERS;
      },
      imageConfigDefault: function() {
        return imageConfigDefault;
      }
    });
    var VALID_LOADERS = [
      "default",
      "imgix",
      "cloudinary",
      "akamai",
      "custom"
    ];
    var imageConfigDefault = {
      deviceSizes: [
        640,
        750,
        828,
        1080,
        1200,
        1920,
        2048,
        3840
      ],
      imageSizes: [
        32,
        48,
        64,
        96,
        128,
        256,
        384
      ],
      path: "/_next/image",
      loader: "default",
      loaderFile: "",
      /**
      * @deprecated Use `remotePatterns` instead to protect your application from malicious users.
      */
      domains: [],
      disableStaticImages: false,
      minimumCacheTTL: 14400,
      formats: [
        "image/webp"
      ],
      maximumDiskCacheSize: void 0,
      maximumRedirects: 3,
      maximumResponseBody: 5e7,
      dangerouslyAllowLocalIP: false,
      dangerouslyAllowSVG: false,
      contentSecurityPolicy: `script-src 'none'; frame-src 'none'; sandbox;`,
      contentDispositionType: "attachment",
      localPatterns: void 0,
      remotePatterns: [],
      qualities: [
        75
      ],
      unoptimized: false,
      customCacheHandler: false
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/warn-once.js
var require_warn_once = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/warn-once.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "warnOnce", {
      enumerable: true,
      get: function() {
        return warnOnce;
      }
    });
    var warnOnce = (_) => {
    };
    if (process.env.NODE_ENV !== "production") {
      const warnings = /* @__PURE__ */ new Set();
      warnOnce = (msg) => {
        if (!warnings.has(msg)) {
          console.warn(msg);
        }
        warnings.add(msg);
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/get-img-props.js
var require_get_img_props = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/get-img-props.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "getImgProps", {
      enumerable: true,
      get: function() {
        return getImgProps;
      }
    });
    var _deploymentid = require_deployment_id();
    var _imageblursvg = require_image_blur_svg();
    var _imageconfig = require_image_config();
    var VALID_LOADING_VALUES = [
      "lazy",
      "eager",
      void 0
    ];
    var INVALID_BACKGROUND_SIZE_VALUES = [
      "-moz-initial",
      "fill",
      "none",
      "scale-down",
      void 0
    ];
    function isStaticRequire(src) {
      return src.default !== void 0;
    }
    function isStaticImageData(src) {
      return src.src !== void 0;
    }
    function isStaticImport(src) {
      return !!src && typeof src === "object" && (isStaticRequire(src) || isStaticImageData(src));
    }
    var allImgs = /* @__PURE__ */ new Map();
    var perfObserver;
    function getInt(x) {
      if (typeof x === "undefined") {
        return x;
      }
      if (typeof x === "number") {
        return Number.isFinite(x) ? x : NaN;
      }
      if (typeof x === "string" && /^[0-9]+$/.test(x)) {
        return parseInt(x, 10);
      }
      return NaN;
    }
    function getWidths({ deviceSizes, allSizes }, width, sizes) {
      if (sizes) {
        const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
        const percentSizes = [];
        for (let match; match = viewportWidthRe.exec(sizes); match) {
          percentSizes.push(parseInt(match[2]));
        }
        if (percentSizes.length) {
          const smallestRatio = Math.min(...percentSizes) * 0.01;
          return {
            widths: allSizes.filter((s) => s >= deviceSizes[0] * smallestRatio),
            kind: "w"
          };
        }
        return {
          widths: allSizes,
          kind: "w"
        };
      }
      if (typeof width !== "number") {
        return {
          widths: deviceSizes,
          kind: "w"
        };
      }
      const widths = [
        ...new Set(
          // > This means that most OLED screens that say they are 3x resolution,
          // > are actually 3x in the green color, but only 1.5x in the red and
          // > blue colors. Showing a 3x resolution image in the app vs a 2x
          // > resolution image will be visually the same, though the 3x image
          // > takes significantly more data. Even true 3x resolution screens are
          // > wasteful as the human eye cannot see that level of detail without
          // > something like a magnifying glass.
          // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
          [
            width,
            width * 2
            /*, width * 3*/
          ].map((w) => allSizes.find((p) => p >= w) || allSizes[allSizes.length - 1])
        )
      ];
      return {
        widths,
        kind: "x"
      };
    }
    function generateImgAttrs({ config, src, unoptimized, width, quality, sizes, loader }) {
      if (unoptimized) {
        if (src.startsWith("/") && !src.startsWith("//")) {
          let deploymentId = (0, _deploymentid.getDeploymentId)();
          if (src.includes("/_next/static/immutable") && !(0, _deploymentid.getAssetToken)()) {
            deploymentId = void 0;
          } else if (deploymentId) {
            const qIndex = src.indexOf("?");
            if (qIndex !== -1) {
              const params = new URLSearchParams(src.slice(qIndex + 1));
              const srcDpl = params.get("dpl");
              if (!srcDpl) {
                params.append("dpl", deploymentId);
                src = src.slice(0, qIndex) + "?" + params.toString();
              }
            } else {
              src = src + `?dpl=${deploymentId}`;
            }
          }
        }
        return {
          src,
          srcSet: void 0,
          sizes: void 0
        };
      }
      const { widths, kind } = getWidths(config, width, sizes);
      const last = widths.length - 1;
      return {
        sizes: !sizes && kind === "w" ? "100vw" : sizes,
        srcSet: widths.map((w, i) => `${loader({
          config,
          src,
          quality,
          width: w
        })} ${kind === "w" ? w : i + 1}${kind}`).join(", "),
        // It's intended to keep `src` the last attribute because React updates
        // attributes in order. If we keep `src` the first one, Safari will
        // immediately start to fetch `src`, before `sizes` and `srcSet` are even
        // updated by React. That causes multiple unnecessary requests if `srcSet`
        // and `sizes` are defined.
        // This bug cannot be reproduced in Chrome or Firefox.
        src: loader({
          config,
          src,
          quality,
          width: widths[last]
        })
      };
    }
    function getImgProps({ src, sizes, unoptimized = false, priority = false, preload = false, loading, className, quality, width, height, fill = false, style, overrideSrc, onLoad, onLoadingComplete, placeholder = "empty", blurDataURL, fetchPriority, decoding = "async", layout, objectFit, objectPosition, lazyBoundary, lazyRoot, ...rest }, _state) {
      const { imgConf, showAltText, blurComplete, defaultLoader } = _state;
      let config;
      let c = imgConf || _imageconfig.imageConfigDefault;
      if ("allSizes" in c) {
        config = c;
      } else {
        const allSizes = [
          ...c.deviceSizes,
          ...c.imageSizes
        ].sort((a, b) => a - b);
        const deviceSizes = c.deviceSizes.sort((a, b) => a - b);
        const qualities = c.qualities?.sort((a, b) => a - b);
        config = {
          ...c,
          allSizes,
          deviceSizes,
          qualities
        };
      }
      if (typeof defaultLoader === "undefined") {
        throw Object.defineProperty(new Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config"), "__NEXT_ERROR_CODE", {
          value: "E163",
          enumerable: false,
          configurable: true
        });
      }
      let loader = rest.loader || defaultLoader;
      delete rest.loader;
      delete rest.srcSet;
      const isDefaultLoader = "__next_img_default" in loader;
      if (isDefaultLoader) {
        if (config.loader === "custom") {
          throw Object.defineProperty(new Error(`Image with src "${src}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`), "__NEXT_ERROR_CODE", {
            value: "E252",
            enumerable: false,
            configurable: true
          });
        }
      } else {
        const customImageLoader = loader;
        loader = (obj) => {
          const { config: _, ...opts } = obj;
          return customImageLoader(opts);
        };
      }
      if (layout) {
        if (layout === "fill") {
          fill = true;
        }
        const layoutToStyle = {
          intrinsic: {
            maxWidth: "100%",
            height: "auto"
          },
          responsive: {
            width: "100%",
            height: "auto"
          }
        };
        const layoutToSizes = {
          responsive: "100vw",
          fill: "100vw"
        };
        const layoutStyle = layoutToStyle[layout];
        if (layoutStyle) {
          style = {
            ...style,
            ...layoutStyle
          };
        }
        const layoutSizes = layoutToSizes[layout];
        if (layoutSizes && !sizes) {
          sizes = layoutSizes;
        }
      }
      let staticSrc = "";
      let widthInt = getInt(width);
      let heightInt = getInt(height);
      let blurWidth;
      let blurHeight;
      if (isStaticImport(src)) {
        const staticImageData = isStaticRequire(src) ? src.default : src;
        if (!staticImageData.src) {
          throw Object.defineProperty(new Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(staticImageData)}`), "__NEXT_ERROR_CODE", {
            value: "E460",
            enumerable: false,
            configurable: true
          });
        }
        if (!staticImageData.height || !staticImageData.width) {
          throw Object.defineProperty(new Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(staticImageData)}`), "__NEXT_ERROR_CODE", {
            value: "E48",
            enumerable: false,
            configurable: true
          });
        }
        blurWidth = staticImageData.blurWidth;
        blurHeight = staticImageData.blurHeight;
        blurDataURL = blurDataURL || staticImageData.blurDataURL;
        staticSrc = staticImageData.src;
        if (!fill) {
          if (!widthInt && !heightInt) {
            widthInt = staticImageData.width;
            heightInt = staticImageData.height;
          } else if (widthInt && !heightInt) {
            const ratio = widthInt / staticImageData.width;
            heightInt = Math.round(staticImageData.height * ratio);
          } else if (!widthInt && heightInt) {
            const ratio = heightInt / staticImageData.height;
            widthInt = Math.round(staticImageData.width * ratio);
          }
        }
      }
      src = typeof src === "string" ? src : staticSrc;
      let isLazy = !priority && !preload && (loading === "lazy" || typeof loading === "undefined");
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        unoptimized = true;
        isLazy = false;
      }
      if (config.unoptimized) {
        unoptimized = true;
      }
      if (isDefaultLoader && !config.dangerouslyAllowSVG && src.split("?", 1)[0].endsWith(".svg")) {
        unoptimized = true;
      }
      const qualityInt = getInt(quality);
      if (process.env.NODE_ENV !== "production") {
        const { warnOnce } = require_warn_once();
        if (config.output === "export" && isDefaultLoader && !unoptimized) {
          throw Object.defineProperty(new Error(`Image Optimization using the default loader is not compatible with \`{ output: 'export' }\`.
  Possible solutions:
    - Remove \`{ output: 'export' }\` and run "next start" to run server mode including the Image Optimization API.
    - Configure \`{ images: { unoptimized: true } }\` in \`next.config.js\` to disable the Image Optimization API.
  Read more: https://nextjs.org/docs/messages/export-image-api`), "__NEXT_ERROR_CODE", {
            value: "E500",
            enumerable: false,
            configurable: true
          });
        }
        if (!src) {
          unoptimized = true;
        } else {
          if (fill) {
            if (width) {
              throw Object.defineProperty(new Error(`Image with src "${src}" has both "width" and "fill" properties. Only one should be used.`), "__NEXT_ERROR_CODE", {
                value: "E96",
                enumerable: false,
                configurable: true
              });
            }
            if (height) {
              throw Object.defineProperty(new Error(`Image with src "${src}" has both "height" and "fill" properties. Only one should be used.`), "__NEXT_ERROR_CODE", {
                value: "E115",
                enumerable: false,
                configurable: true
              });
            }
            if (style?.position && style.position !== "absolute") {
              throw Object.defineProperty(new Error(`Image with src "${src}" has both "fill" and "style.position" properties. Images with "fill" always use position absolute - it cannot be modified.`), "__NEXT_ERROR_CODE", {
                value: "E216",
                enumerable: false,
                configurable: true
              });
            }
            if (style?.width && style.width !== "100%") {
              throw Object.defineProperty(new Error(`Image with src "${src}" has both "fill" and "style.width" properties. Images with "fill" always use width 100% - it cannot be modified.`), "__NEXT_ERROR_CODE", {
                value: "E73",
                enumerable: false,
                configurable: true
              });
            }
            if (style?.height && style.height !== "100%") {
              throw Object.defineProperty(new Error(`Image with src "${src}" has both "fill" and "style.height" properties. Images with "fill" always use height 100% - it cannot be modified.`), "__NEXT_ERROR_CODE", {
                value: "E404",
                enumerable: false,
                configurable: true
              });
            }
          } else {
            if (typeof widthInt === "undefined") {
              throw Object.defineProperty(new Error(`Image with src "${src}" is missing required "width" property.`), "__NEXT_ERROR_CODE", {
                value: "E451",
                enumerable: false,
                configurable: true
              });
            } else if (isNaN(widthInt)) {
              throw Object.defineProperty(new Error(`Image with src "${src}" has invalid "width" property. Expected a numeric value in pixels but received "${width}".`), "__NEXT_ERROR_CODE", {
                value: "E66",
                enumerable: false,
                configurable: true
              });
            }
            if (typeof heightInt === "undefined") {
              throw Object.defineProperty(new Error(`Image with src "${src}" is missing required "height" property.`), "__NEXT_ERROR_CODE", {
                value: "E397",
                enumerable: false,
                configurable: true
              });
            } else if (isNaN(heightInt)) {
              throw Object.defineProperty(new Error(`Image with src "${src}" has invalid "height" property. Expected a numeric value in pixels but received "${height}".`), "__NEXT_ERROR_CODE", {
                value: "E444",
                enumerable: false,
                configurable: true
              });
            }
            if (/^[\x00-\x20]/.test(src)) {
              throw Object.defineProperty(new Error(`Image with src "${src}" cannot start with a space or control character. Use src.trimStart() to remove it or encodeURIComponent(src) to keep it.`), "__NEXT_ERROR_CODE", {
                value: "E176",
                enumerable: false,
                configurable: true
              });
            }
            if (/[\x00-\x20]$/.test(src)) {
              throw Object.defineProperty(new Error(`Image with src "${src}" cannot end with a space or control character. Use src.trimEnd() to remove it or encodeURIComponent(src) to keep it.`), "__NEXT_ERROR_CODE", {
                value: "E21",
                enumerable: false,
                configurable: true
              });
            }
          }
        }
        if (!VALID_LOADING_VALUES.includes(loading)) {
          throw Object.defineProperty(new Error(`Image with src "${src}" has invalid "loading" property. Provided "${loading}" should be one of ${VALID_LOADING_VALUES.map(String).join(",")}.`), "__NEXT_ERROR_CODE", {
            value: "E357",
            enumerable: false,
            configurable: true
          });
        }
        if (priority && loading === "lazy") {
          throw Object.defineProperty(new Error(`Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`), "__NEXT_ERROR_CODE", {
            value: "E218",
            enumerable: false,
            configurable: true
          });
        }
        if (preload && loading === "lazy") {
          throw Object.defineProperty(new Error(`Image with src "${src}" has both "preload" and "loading='lazy'" properties. Only one should be used.`), "__NEXT_ERROR_CODE", {
            value: "E803",
            enumerable: false,
            configurable: true
          });
        }
        if (preload && priority) {
          throw Object.defineProperty(new Error(`Image with src "${src}" has both "preload" and "priority" properties. Only "preload" should be used.`), "__NEXT_ERROR_CODE", {
            value: "E802",
            enumerable: false,
            configurable: true
          });
        }
        if (placeholder !== "empty" && placeholder !== "blur" && !placeholder.startsWith("data:image/")) {
          throw Object.defineProperty(new Error(`Image with src "${src}" has invalid "placeholder" property "${placeholder}".`), "__NEXT_ERROR_CODE", {
            value: "E431",
            enumerable: false,
            configurable: true
          });
        }
        if (placeholder !== "empty") {
          if (widthInt && heightInt && widthInt * heightInt < 1600) {
            warnOnce(`Image with src "${src}" is smaller than 40x40. Consider removing the "placeholder" property to improve performance.`);
          }
        }
        if (qualityInt && config.qualities && !config.qualities.includes(qualityInt)) {
          warnOnce(`Image with src "${src}" is using quality "${qualityInt}" which is not configured in images.qualities [${config.qualities.join(", ")}]. Please update your config to [${[
            ...config.qualities,
            qualityInt
          ].sort().join(", ")}].
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-qualities`);
        }
        if (placeholder === "blur" && !blurDataURL) {
          const VALID_BLUR_EXT = [
            "jpeg",
            "png",
            "webp",
            "avif"
          ];
          throw Object.defineProperty(new Error(`Image with src "${src}" has "placeholder='blur'" property but is missing the "blurDataURL" property.
        Possible solutions:
          - Add a "blurDataURL" property, the contents should be a small Data URL to represent the image
          - Change the "src" property to a static import with one of the supported file types: ${VALID_BLUR_EXT.join(",")} (animated images not supported)
          - Remove the "placeholder" property, effectively no blur effect
        Read more: https://nextjs.org/docs/messages/placeholder-blur-data-url`), "__NEXT_ERROR_CODE", {
            value: "E371",
            enumerable: false,
            configurable: true
          });
        }
        if ("ref" in rest) {
          warnOnce(`Image with src "${src}" is using unsupported "ref" property. Consider using the "onLoad" property instead.`);
        }
        if (!unoptimized && !isDefaultLoader) {
          const urlStr = loader({
            config,
            src,
            width: widthInt || 400,
            quality: qualityInt || 75
          });
          let url;
          try {
            url = new URL(urlStr);
          } catch (err) {
          }
          if (urlStr === src || url && url.pathname === src && !url.search) {
            warnOnce(`Image with src "${src}" has a "loader" property that does not implement width. Please implement it or use the "unoptimized" property instead.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader-width`);
          }
        }
        if (onLoadingComplete) {
          warnOnce(`Image with src "${src}" is using deprecated "onLoadingComplete" property. Please use the "onLoad" property instead.`);
        }
        for (const [legacyKey, legacyValue] of Object.entries({
          layout,
          objectFit,
          objectPosition,
          lazyBoundary,
          lazyRoot
        })) {
          if (legacyValue) {
            warnOnce(`Image with src "${src}" has legacy prop "${legacyKey}". Did you forget to run the codemod?
Read more: https://nextjs.org/docs/messages/next-image-upgrade-to-13`);
          }
        }
        if (typeof window !== "undefined" && !perfObserver && window.PerformanceObserver) {
          perfObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const imgSrc = entry?.element?.src || "";
              const lcpImage = allImgs.get(imgSrc);
              if (lcpImage && lcpImage.loading === "lazy" && lcpImage.placeholder === "empty" && !lcpImage.src.startsWith("data:") && !lcpImage.src.startsWith("blob:")) {
                warnOnce(`Image with src "${lcpImage.src}" was detected as the Largest Contentful Paint (LCP). Please add the \`loading="eager"\` property if this image is above the fold.
Read more: https://nextjs.org/docs/app/api-reference/components/image#loading`);
              }
            }
          });
          try {
            perfObserver.observe({
              type: "largest-contentful-paint",
              buffered: true
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
      const imgStyle = Object.assign(fill ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit,
        objectPosition
      } : {}, showAltText ? {} : {
        color: "transparent"
      }, style);
      const backgroundImage = !blurComplete && placeholder !== "empty" ? placeholder === "blur" ? `url("data:image/svg+xml;charset=utf-8,${(0, _imageblursvg.getImageBlurSvg)({
        widthInt,
        heightInt,
        blurWidth,
        blurHeight,
        blurDataURL: blurDataURL || "",
        objectFit: imgStyle.objectFit
      })}")` : `url("${placeholder}")` : null;
      const backgroundSize = !INVALID_BACKGROUND_SIZE_VALUES.includes(imgStyle.objectFit) ? imgStyle.objectFit : imgStyle.objectFit === "fill" ? "100% 100%" : "cover";
      let placeholderStyle = backgroundImage ? {
        backgroundSize,
        backgroundPosition: imgStyle.objectPosition || "50% 50%",
        backgroundRepeat: "no-repeat",
        backgroundImage
      } : {};
      if (process.env.NODE_ENV === "development") {
        if (placeholderStyle.backgroundImage && placeholder === "blur" && blurDataURL?.startsWith("/")) {
          placeholderStyle.backgroundImage = `url("${blurDataURL}")`;
        }
      }
      const imgAttributes = generateImgAttrs({
        config,
        src,
        unoptimized,
        width: widthInt,
        quality: qualityInt,
        sizes,
        loader
      });
      const loadingFinal = isLazy ? "lazy" : loading;
      if (process.env.NODE_ENV !== "production") {
        if (typeof window !== "undefined") {
          let fullUrl;
          try {
            fullUrl = new URL(imgAttributes.src);
          } catch (e) {
            fullUrl = new URL(imgAttributes.src, window.location.href);
          }
          allImgs.set(fullUrl.href, {
            src,
            loading: loadingFinal,
            placeholder
          });
        }
      }
      const props = {
        ...rest,
        loading: loadingFinal,
        fetchPriority,
        width: widthInt,
        height: heightInt,
        decoding,
        className,
        style: {
          ...imgStyle,
          ...placeholderStyle
        },
        sizes: imgAttributes.sizes,
        srcSet: imgAttributes.srcSet,
        src: overrideSrc || imgAttributes.src
      };
      const meta = {
        unoptimized,
        preload: preload || priority,
        placeholder,
        fill
      };
      return {
        props,
        meta
      };
    }
  }
});

// ../../node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs
var require_interop_require_wildcard = __commonJS({
  "../../node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs"(exports) {
    "use strict";
    function _getRequireWildcardCache(nodeInterop) {
      if (typeof WeakMap !== "function") return null;
      var cacheBabelInterop = /* @__PURE__ */ new WeakMap();
      var cacheNodeInterop = /* @__PURE__ */ new WeakMap();
      return (_getRequireWildcardCache = function(nodeInterop2) {
        return nodeInterop2 ? cacheNodeInterop : cacheBabelInterop;
      })(nodeInterop);
    }
    function _interop_require_wildcard(obj, nodeInterop) {
      if (!nodeInterop && obj && obj.__esModule) return obj;
      if (obj === null || typeof obj !== "object" && typeof obj !== "function") return { default: obj };
      var cache = _getRequireWildcardCache(nodeInterop);
      if (cache && cache.has(obj)) return cache.get(obj);
      var newObj = { __proto__: null };
      var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var key in obj) {
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
          if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
          else newObj[key] = obj[key];
        }
      }
      newObj.default = obj;
      if (cache) cache.set(obj, newObj);
      return newObj;
    }
    exports._ = _interop_require_wildcard;
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/side-effect.js
var require_side_effect = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/side-effect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function() {
        return SideEffect;
      }
    });
    var _react = __require("react");
    var isServer = typeof window === "undefined";
    var useClientOnlyLayoutEffect = isServer ? () => {
    } : _react.useLayoutEffect;
    var useClientOnlyEffect = isServer ? () => {
    } : _react.useEffect;
    function SideEffect(props) {
      const { headManager, reduceComponentsToState } = props;
      function emitChange() {
        if (headManager && headManager.mountedInstances) {
          const headElements = _react.Children.toArray(Array.from(headManager.mountedInstances).filter(Boolean));
          headManager.updateHead(reduceComponentsToState(headElements));
        }
      }
      if (isServer) {
        headManager?.mountedInstances?.add(props.children);
        emitChange();
      }
      useClientOnlyLayoutEffect(() => {
        headManager?.mountedInstances?.add(props.children);
        return () => {
          headManager?.mountedInstances?.delete(props.children);
        };
      });
      useClientOnlyLayoutEffect(() => {
        if (headManager) {
          headManager._pendingUpdate = emitChange;
        }
        return () => {
          if (headManager) {
            headManager._pendingUpdate = emitChange;
          }
        };
      });
      useClientOnlyEffect(() => {
        if (headManager && headManager._pendingUpdate) {
          headManager._pendingUpdate();
          headManager._pendingUpdate = null;
        }
        return () => {
          if (headManager && headManager._pendingUpdate) {
            headManager._pendingUpdate();
            headManager._pendingUpdate = null;
          }
        };
      });
      return null;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.js
var require_head_manager_context_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "HeadManagerContext", {
      enumerable: true,
      get: function() {
        return HeadManagerContext;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _react = /* @__PURE__ */ _interop_require_default._(__require("react"));
    var HeadManagerContext = _react.default.createContext({});
    if (process.env.NODE_ENV !== "production") {
      HeadManagerContext.displayName = "HeadManagerContext";
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/head.js
var require_head = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/head.js"(exports, module) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      default: function() {
        return _default;
      },
      defaultHead: function() {
        return defaultHead;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _jsxruntime = __require("react/jsx-runtime");
    var _react = /* @__PURE__ */ _interop_require_wildcard._(__require("react"));
    var _sideeffect = /* @__PURE__ */ _interop_require_default._(require_side_effect());
    var _headmanagercontextsharedruntime = require_head_manager_context_shared_runtime();
    function defaultHead() {
      const head = [
        /* @__PURE__ */ (0, _jsxruntime.jsx)("meta", {
          charSet: "utf-8"
        }, "charset"),
        /* @__PURE__ */ (0, _jsxruntime.jsx)("meta", {
          name: "viewport",
          content: "width=device-width"
        }, "viewport")
      ];
      return head;
    }
    function onlyReactElement(list, child) {
      if (typeof child === "string" || typeof child === "number") {
        return list;
      }
      if (child.type === _react.default.Fragment) {
        return list.concat(
          // @ts-expect-error @types/react does not remove fragments but this could also return ReactPortal[]
          _react.default.Children.toArray(child.props.children).reduce(
            // @ts-expect-error @types/react does not remove fragments but this could also return ReactPortal[]
            (fragmentList, fragmentChild) => {
              if (typeof fragmentChild === "string" || typeof fragmentChild === "number") {
                return fragmentList;
              }
              return fragmentList.concat(fragmentChild);
            },
            []
          )
        );
      }
      return list.concat(child);
    }
    var METATYPES = [
      "name",
      "httpEquiv",
      "charSet",
      "itemProp"
    ];
    function unique() {
      const keys = /* @__PURE__ */ new Set();
      const tags = /* @__PURE__ */ new Set();
      const metaTypes = /* @__PURE__ */ new Set();
      const metaCategories = {};
      return (h) => {
        let isUnique = true;
        let hasKey = false;
        if (h.key && typeof h.key !== "number" && h.key.indexOf("$") > 0) {
          hasKey = true;
          const key = h.key.slice(h.key.indexOf("$") + 1);
          if (keys.has(key)) {
            isUnique = false;
          } else {
            keys.add(key);
          }
        }
        switch (h.type) {
          case "title":
          case "base":
            if (tags.has(h.type)) {
              isUnique = false;
            } else {
              tags.add(h.type);
            }
            break;
          case "meta":
            for (let i = 0, len = METATYPES.length; i < len; i++) {
              const metatype = METATYPES[i];
              if (!h.props.hasOwnProperty(metatype)) continue;
              if (metatype === "charSet") {
                if (metaTypes.has(metatype)) {
                  isUnique = false;
                } else {
                  metaTypes.add(metatype);
                }
              } else {
                const category = h.props[metatype];
                const categories = metaCategories[metatype] || /* @__PURE__ */ new Set();
                if ((metatype !== "name" || !hasKey) && categories.has(category)) {
                  isUnique = false;
                } else {
                  categories.add(category);
                  metaCategories[metatype] = categories;
                }
              }
            }
            break;
          default:
            break;
        }
        return isUnique;
      };
    }
    function reduceComponents(headChildrenElements) {
      return headChildrenElements.reduce(onlyReactElement, []).reverse().concat(defaultHead().reverse()).filter(unique()).reverse().map((c, i) => {
        const key = c.key || i;
        if (process.env.NODE_ENV === "development") {
          const { warnOnce } = require_warn_once();
          if (c.type === "script" && c.props["type"] !== "application/ld+json") {
            const srcMessage = c.props["src"] ? `<script> tag with src="${c.props["src"]}"` : `inline <script>`;
            warnOnce(`Do not add <script> tags using next/head (see ${srcMessage}). Use next/script instead. 
See more info here: https://nextjs.org/docs/messages/no-script-tags-in-head-component`);
          } else if (c.type === "link" && c.props["rel"] === "stylesheet") {
            warnOnce(`Do not add stylesheets using next/head (see <link rel="stylesheet"> tag with href="${c.props["href"]}"). Use Document instead. 
See more info here: https://nextjs.org/docs/messages/no-stylesheets-in-head-component`);
          }
        }
        return /* @__PURE__ */ _react.default.cloneElement(c, {
          key
        });
      });
    }
    function Head({ children }) {
      const headManager = (0, _react.useContext)(_headmanagercontextsharedruntime.HeadManagerContext);
      return /* @__PURE__ */ (0, _jsxruntime.jsx)(_sideeffect.default, {
        reduceComponentsToState: reduceComponents,
        headManager,
        children
      });
    }
    var _default = Head;
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-config-context.shared-runtime.js
var require_image_config_context_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-config-context.shared-runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ImageConfigContext", {
      enumerable: true,
      get: function() {
        return ImageConfigContext;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _react = /* @__PURE__ */ _interop_require_default._(__require("react"));
    var _imageconfig = require_image_config();
    var ImageConfigContext = _react.default.createContext(_imageconfig.imageConfigDefault);
    if (process.env.NODE_ENV !== "production") {
      ImageConfigContext.displayName = "ImageConfigContext";
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router-context.shared-runtime.js
var require_router_context_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router-context.shared-runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "RouterContext", {
      enumerable: true,
      get: function() {
        return RouterContext;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _react = /* @__PURE__ */ _interop_require_default._(__require("react"));
    var RouterContext = _react.default.createContext(null);
    if (process.env.NODE_ENV !== "production") {
      RouterContext.displayName = "RouterContext";
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/find-closest-quality.js
var require_find_closest_quality = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/find-closest-quality.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "findClosestQuality", {
      enumerable: true,
      get: function() {
        return findClosestQuality;
      }
    });
    function findClosestQuality(quality, config) {
      const q = quality || 75;
      if (!config?.qualities?.length) {
        return q;
      }
      return config.qualities.reduce((prev, cur) => Math.abs(cur - q) < Math.abs(prev - q) ? cur : prev, config.qualities[0]);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/picomatch/index.js
var require_picomatch = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/picomatch/index.js"(exports, module) {
    "use strict";
    (() => {
      "use strict";
      var t = { 286: (t2, e2, u2) => {
        const n = u2(696);
        const isWindows = () => {
          if (typeof navigator !== "undefined" && navigator.platform) {
            const t3 = navigator.platform.toLowerCase();
            return t3 === "win32" || t3 === "windows";
          }
          if (typeof process !== "undefined" && process.platform) {
            return process.platform === "win32";
          }
          return false;
        };
        function picomatch(t3, e3, u3 = false) {
          if (e3 && (e3.windows === null || e3.windows === void 0)) {
            e3 = { ...e3, windows: isWindows() };
          }
          return n(t3, e3, u3);
        }
        Object.assign(picomatch, n);
        t2.exports = picomatch;
      }, 963: (t2) => {
        const e2 = "\\\\/";
        const u2 = `[^${e2}]`;
        const n = "\\.";
        const o = "\\+";
        const s = "\\?";
        const r = "\\/";
        const a = "(?=.)";
        const i = "[^/]";
        const c = `(?:${r}|$)`;
        const p = `(?:^|${r})`;
        const l = `${n}{1,2}${c}`;
        const f = `(?!${n})`;
        const A = `(?!${p}${l})`;
        const _ = `(?!${n}{0,1}${c})`;
        const R = `(?!${l})`;
        const E = `[^.${r}]`;
        const h = `${i}*?`;
        const g = "/";
        const b = { DOT_LITERAL: n, PLUS_LITERAL: o, QMARK_LITERAL: s, SLASH_LITERAL: r, ONE_CHAR: a, QMARK: i, END_ANCHOR: c, DOTS_SLASH: l, NO_DOT: f, NO_DOTS: A, NO_DOT_SLASH: _, NO_DOTS_SLASH: R, QMARK_NO_DOT: E, STAR: h, START_ANCHOR: p, SEP: g };
        const C = { ...b, SLASH_LITERAL: `[${e2}]`, QMARK: u2, STAR: `${u2}*?`, DOTS_SLASH: `${n}{1,2}(?:[${e2}]|$)`, NO_DOT: `(?!${n})`, NO_DOTS: `(?!(?:^|[${e2}])${n}{1,2}(?:[${e2}]|$))`, NO_DOT_SLASH: `(?!${n}{0,1}(?:[${e2}]|$))`, NO_DOTS_SLASH: `(?!${n}{1,2}(?:[${e2}]|$))`, QMARK_NO_DOT: `[^.${e2}]`, START_ANCHOR: `(?:^|[${e2}])`, END_ANCHOR: `(?:[${e2}]|$)`, SEP: "\\" };
        const y = { alnum: "a-zA-Z0-9", alpha: "a-zA-Z", ascii: "\\x00-\\x7F", blank: " \\t", cntrl: "\\x00-\\x1F\\x7F", digit: "0-9", graph: "\\x21-\\x7E", lower: "a-z", print: "\\x20-\\x7E ", punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~", space: " \\t\\r\\n\\v\\f", upper: "A-Z", word: "A-Za-z0-9_", xdigit: "A-Fa-f0-9" };
        t2.exports = { MAX_LENGTH: 1024 * 64, POSIX_REGEX_SOURCE: y, REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g, REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/, REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/, REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g, REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g, REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g, REPLACEMENTS: { "***": "*", "**/**": "**", "**/**/**": "**" }, CHAR_0: 48, CHAR_9: 57, CHAR_UPPERCASE_A: 65, CHAR_LOWERCASE_A: 97, CHAR_UPPERCASE_Z: 90, CHAR_LOWERCASE_Z: 122, CHAR_LEFT_PARENTHESES: 40, CHAR_RIGHT_PARENTHESES: 41, CHAR_ASTERISK: 42, CHAR_AMPERSAND: 38, CHAR_AT: 64, CHAR_BACKWARD_SLASH: 92, CHAR_CARRIAGE_RETURN: 13, CHAR_CIRCUMFLEX_ACCENT: 94, CHAR_COLON: 58, CHAR_COMMA: 44, CHAR_DOT: 46, CHAR_DOUBLE_QUOTE: 34, CHAR_EQUAL: 61, CHAR_EXCLAMATION_MARK: 33, CHAR_FORM_FEED: 12, CHAR_FORWARD_SLASH: 47, CHAR_GRAVE_ACCENT: 96, CHAR_HASH: 35, CHAR_HYPHEN_MINUS: 45, CHAR_LEFT_ANGLE_BRACKET: 60, CHAR_LEFT_CURLY_BRACE: 123, CHAR_LEFT_SQUARE_BRACKET: 91, CHAR_LINE_FEED: 10, CHAR_NO_BREAK_SPACE: 160, CHAR_PERCENT: 37, CHAR_PLUS: 43, CHAR_QUESTION_MARK: 63, CHAR_RIGHT_ANGLE_BRACKET: 62, CHAR_RIGHT_CURLY_BRACE: 125, CHAR_RIGHT_SQUARE_BRACKET: 93, CHAR_SEMICOLON: 59, CHAR_SINGLE_QUOTE: 39, CHAR_SPACE: 32, CHAR_TAB: 9, CHAR_UNDERSCORE: 95, CHAR_VERTICAL_LINE: 124, CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, extglobChars(t3) {
          return { "!": { type: "negate", open: "(?:(?!(?:", close: `))${t3.STAR})` }, "?": { type: "qmark", open: "(?:", close: ")?" }, "+": { type: "plus", open: "(?:", close: ")+" }, "*": { type: "star", open: "(?:", close: ")*" }, "@": { type: "at", open: "(?:", close: ")" } };
        }, globChars(t3) {
          return t3 === true ? C : b;
        } };
      }, 929: (t2, e2, u2) => {
        const n = u2(963);
        const o = u2(971);
        const { MAX_LENGTH: s, POSIX_REGEX_SOURCE: r, REGEX_NON_SPECIAL_CHARS: a, REGEX_SPECIAL_CHARS_BACKREF: i, REPLACEMENTS: c } = n;
        const expandRange = (t3, e3) => {
          if (typeof e3.expandRange === "function") {
            return e3.expandRange(...t3, e3);
          }
          t3.sort();
          const u3 = `[${t3.join("-")}]`;
          try {
            new RegExp(u3);
          } catch (e4) {
            return t3.map(((t4) => o.escapeRegex(t4))).join("..");
          }
          return u3;
        };
        const syntaxError = (t3, e3) => `Missing ${t3}: "${e3}" - use "\\\\${e3}" to match literal characters`;
        const parse = (t3, e3) => {
          if (typeof t3 !== "string") {
            throw new TypeError("Expected a string");
          }
          t3 = c[t3] || t3;
          const u3 = { ...e3 };
          const p = typeof u3.maxLength === "number" ? Math.min(s, u3.maxLength) : s;
          let l = t3.length;
          if (l > p) {
            throw new SyntaxError(`Input length: ${l}, exceeds maximum allowed length: ${p}`);
          }
          const f = { type: "bos", value: "", output: u3.prepend || "" };
          const A = [f];
          const _ = u3.capture ? "" : "?:";
          const R = n.globChars(u3.windows);
          const E = n.extglobChars(R);
          const { DOT_LITERAL: h, PLUS_LITERAL: g, SLASH_LITERAL: b, ONE_CHAR: C, DOTS_SLASH: y, NO_DOT: $, NO_DOT_SLASH: x, NO_DOTS_SLASH: S, QMARK: H, QMARK_NO_DOT: v, STAR: d, START_ANCHOR: L } = R;
          const globstar = (t4) => `(${_}(?:(?!${L}${t4.dot ? y : h}).)*?)`;
          const T = u3.dot ? "" : $;
          const O = u3.dot ? H : v;
          let k = u3.bash === true ? globstar(u3) : d;
          if (u3.capture) {
            k = `(${k})`;
          }
          if (typeof u3.noext === "boolean") {
            u3.noextglob = u3.noext;
          }
          const m = { input: t3, index: -1, start: 0, dot: u3.dot === true, consumed: "", output: "", prefix: "", backtrack: false, negated: false, brackets: 0, braces: 0, parens: 0, quotes: 0, globstar: false, tokens: A };
          t3 = o.removePrefix(t3, m);
          l = t3.length;
          const w = [];
          const N = [];
          const I = [];
          let B = f;
          let G;
          const eos = () => m.index === l - 1;
          const D = m.peek = (e4 = 1) => t3[m.index + e4];
          const M = m.advance = () => t3[++m.index] || "";
          const remaining = () => t3.slice(m.index + 1);
          const consume = (t4 = "", e4 = 0) => {
            m.consumed += t4;
            m.index += e4;
          };
          const append = (t4) => {
            m.output += t4.output != null ? t4.output : t4.value;
            consume(t4.value);
          };
          const negate = () => {
            let t4 = 1;
            while (D() === "!" && (D(2) !== "(" || D(3) === "?")) {
              M();
              m.start++;
              t4++;
            }
            if (t4 % 2 === 0) {
              return false;
            }
            m.negated = true;
            m.start++;
            return true;
          };
          const increment = (t4) => {
            m[t4]++;
            I.push(t4);
          };
          const decrement = (t4) => {
            m[t4]--;
            I.pop();
          };
          const push = (t4) => {
            if (B.type === "globstar") {
              const e4 = m.braces > 0 && (t4.type === "comma" || t4.type === "brace");
              const u4 = t4.extglob === true || w.length && (t4.type === "pipe" || t4.type === "paren");
              if (t4.type !== "slash" && t4.type !== "paren" && !e4 && !u4) {
                m.output = m.output.slice(0, -B.output.length);
                B.type = "star";
                B.value = "*";
                B.output = k;
                m.output += B.output;
              }
            }
            if (w.length && t4.type !== "paren") {
              w[w.length - 1].inner += t4.value;
            }
            if (t4.value || t4.output) append(t4);
            if (B && B.type === "text" && t4.type === "text") {
              B.output = (B.output || B.value) + t4.value;
              B.value += t4.value;
              return;
            }
            t4.prev = B;
            A.push(t4);
            B = t4;
          };
          const extglobOpen = (t4, e4) => {
            const n2 = { ...E[e4], conditions: 1, inner: "" };
            n2.prev = B;
            n2.parens = m.parens;
            n2.output = m.output;
            const o2 = (u3.capture ? "(" : "") + n2.open;
            increment("parens");
            push({ type: t4, value: e4, output: m.output ? "" : C });
            push({ type: "paren", extglob: true, value: M(), output: o2 });
            w.push(n2);
          };
          const extglobClose = (t4) => {
            let n2 = t4.close + (u3.capture ? ")" : "");
            let o2;
            if (t4.type === "negate") {
              let s2 = k;
              if (t4.inner && t4.inner.length > 1 && t4.inner.includes("/")) {
                s2 = globstar(u3);
              }
              if (s2 !== k || eos() || /^\)+$/.test(remaining())) {
                n2 = t4.close = `)$))${s2}`;
              }
              if (t4.inner.includes("*") && (o2 = remaining()) && /^\.[^\\/.]+$/.test(o2)) {
                const u4 = parse(o2, { ...e3, fastpaths: false }).output;
                n2 = t4.close = `)${u4})${s2})`;
              }
              if (t4.prev.type === "bos") {
                m.negatedExtglob = true;
              }
            }
            push({ type: "paren", extglob: true, value: G, output: n2 });
            decrement("parens");
          };
          if (u3.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(t3)) {
            let n2 = false;
            let s2 = t3.replace(i, ((t4, e4, u4, o2, s3, r2) => {
              if (o2 === "\\") {
                n2 = true;
                return t4;
              }
              if (o2 === "?") {
                if (e4) {
                  return e4 + o2 + (s3 ? H.repeat(s3.length) : "");
                }
                if (r2 === 0) {
                  return O + (s3 ? H.repeat(s3.length) : "");
                }
                return H.repeat(u4.length);
              }
              if (o2 === ".") {
                return h.repeat(u4.length);
              }
              if (o2 === "*") {
                if (e4) {
                  return e4 + o2 + (s3 ? k : "");
                }
                return k;
              }
              return e4 ? t4 : `\\${t4}`;
            }));
            if (n2 === true) {
              if (u3.unescape === true) {
                s2 = s2.replace(/\\/g, "");
              } else {
                s2 = s2.replace(/\\+/g, ((t4) => t4.length % 2 === 0 ? "\\\\" : t4 ? "\\" : ""));
              }
            }
            if (s2 === t3 && u3.contains === true) {
              m.output = t3;
              return m;
            }
            m.output = o.wrapOutput(s2, m, e3);
            return m;
          }
          while (!eos()) {
            G = M();
            if (G === "\0") {
              continue;
            }
            if (G === "\\") {
              const t4 = D();
              if (t4 === "/" && u3.bash !== true) {
                continue;
              }
              if (t4 === "." || t4 === ";") {
                continue;
              }
              if (!t4) {
                G += "\\";
                push({ type: "text", value: G });
                continue;
              }
              const e5 = /^\\+/.exec(remaining());
              let n3 = 0;
              if (e5 && e5[0].length > 2) {
                n3 = e5[0].length;
                m.index += n3;
                if (n3 % 2 !== 0) {
                  G += "\\";
                }
              }
              if (u3.unescape === true) {
                G = M();
              } else {
                G += M();
              }
              if (m.brackets === 0) {
                push({ type: "text", value: G });
                continue;
              }
            }
            if (m.brackets > 0 && (G !== "]" || B.value === "[" || B.value === "[^")) {
              if (u3.posix !== false && G === ":") {
                const t4 = B.value.slice(1);
                if (t4.includes("[")) {
                  B.posix = true;
                  if (t4.includes(":")) {
                    const t5 = B.value.lastIndexOf("[");
                    const e5 = B.value.slice(0, t5);
                    const u4 = B.value.slice(t5 + 2);
                    const n3 = r[u4];
                    if (n3) {
                      B.value = e5 + n3;
                      m.backtrack = true;
                      M();
                      if (!f.output && A.indexOf(B) === 1) {
                        f.output = C;
                      }
                      continue;
                    }
                  }
                }
              }
              if (G === "[" && D() !== ":" || G === "-" && D() === "]") {
                G = `\\${G}`;
              }
              if (G === "]" && (B.value === "[" || B.value === "[^")) {
                G = `\\${G}`;
              }
              if (u3.posix === true && G === "!" && B.value === "[") {
                G = "^";
              }
              B.value += G;
              append({ value: G });
              continue;
            }
            if (m.quotes === 1 && G !== '"') {
              G = o.escapeRegex(G);
              B.value += G;
              append({ value: G });
              continue;
            }
            if (G === '"') {
              m.quotes = m.quotes === 1 ? 0 : 1;
              if (u3.keepQuotes === true) {
                push({ type: "text", value: G });
              }
              continue;
            }
            if (G === "(") {
              increment("parens");
              push({ type: "paren", value: G });
              continue;
            }
            if (G === ")") {
              if (m.parens === 0 && u3.strictBrackets === true) {
                throw new SyntaxError(syntaxError("opening", "("));
              }
              const t4 = w[w.length - 1];
              if (t4 && m.parens === t4.parens + 1) {
                extglobClose(w.pop());
                continue;
              }
              push({ type: "paren", value: G, output: m.parens ? ")" : "\\)" });
              decrement("parens");
              continue;
            }
            if (G === "[") {
              if (u3.nobracket === true || !remaining().includes("]")) {
                if (u3.nobracket !== true && u3.strictBrackets === true) {
                  throw new SyntaxError(syntaxError("closing", "]"));
                }
                G = `\\${G}`;
              } else {
                increment("brackets");
              }
              push({ type: "bracket", value: G });
              continue;
            }
            if (G === "]") {
              if (u3.nobracket === true || B && B.type === "bracket" && B.value.length === 1) {
                push({ type: "text", value: G, output: `\\${G}` });
                continue;
              }
              if (m.brackets === 0) {
                if (u3.strictBrackets === true) {
                  throw new SyntaxError(syntaxError("opening", "["));
                }
                push({ type: "text", value: G, output: `\\${G}` });
                continue;
              }
              decrement("brackets");
              const t4 = B.value.slice(1);
              if (B.posix !== true && t4[0] === "^" && !t4.includes("/")) {
                G = `/${G}`;
              }
              B.value += G;
              append({ value: G });
              if (u3.literalBrackets === false || o.hasRegexChars(t4)) {
                continue;
              }
              const e5 = o.escapeRegex(B.value);
              m.output = m.output.slice(0, -B.value.length);
              if (u3.literalBrackets === true) {
                m.output += e5;
                B.value = e5;
                continue;
              }
              B.value = `(${_}${e5}|${B.value})`;
              m.output += B.value;
              continue;
            }
            if (G === "{" && u3.nobrace !== true) {
              increment("braces");
              const t4 = { type: "brace", value: G, output: "(", outputIndex: m.output.length, tokensIndex: m.tokens.length };
              N.push(t4);
              push(t4);
              continue;
            }
            if (G === "}") {
              const t4 = N[N.length - 1];
              if (u3.nobrace === true || !t4) {
                push({ type: "text", value: G, output: G });
                continue;
              }
              let e5 = ")";
              if (t4.dots === true) {
                const t5 = A.slice();
                const n3 = [];
                for (let e6 = t5.length - 1; e6 >= 0; e6--) {
                  A.pop();
                  if (t5[e6].type === "brace") {
                    break;
                  }
                  if (t5[e6].type !== "dots") {
                    n3.unshift(t5[e6].value);
                  }
                }
                e5 = expandRange(n3, u3);
                m.backtrack = true;
              }
              if (t4.comma !== true && t4.dots !== true) {
                const u4 = m.output.slice(0, t4.outputIndex);
                const n3 = m.tokens.slice(t4.tokensIndex);
                t4.value = t4.output = "\\{";
                G = e5 = "\\}";
                m.output = u4;
                for (const t5 of n3) {
                  m.output += t5.output || t5.value;
                }
              }
              push({ type: "brace", value: G, output: e5 });
              decrement("braces");
              N.pop();
              continue;
            }
            if (G === "|") {
              if (w.length > 0) {
                w[w.length - 1].conditions++;
              }
              push({ type: "text", value: G });
              continue;
            }
            if (G === ",") {
              let t4 = G;
              const e5 = N[N.length - 1];
              if (e5 && I[I.length - 1] === "braces") {
                e5.comma = true;
                t4 = "|";
              }
              push({ type: "comma", value: G, output: t4 });
              continue;
            }
            if (G === "/") {
              if (B.type === "dot" && m.index === m.start + 1) {
                m.start = m.index + 1;
                m.consumed = "";
                m.output = "";
                A.pop();
                B = f;
                continue;
              }
              push({ type: "slash", value: G, output: b });
              continue;
            }
            if (G === ".") {
              if (m.braces > 0 && B.type === "dot") {
                if (B.value === ".") B.output = h;
                const t4 = N[N.length - 1];
                B.type = "dots";
                B.output += G;
                B.value += G;
                t4.dots = true;
                continue;
              }
              if (m.braces + m.parens === 0 && B.type !== "bos" && B.type !== "slash") {
                push({ type: "text", value: G, output: h });
                continue;
              }
              push({ type: "dot", value: G, output: h });
              continue;
            }
            if (G === "?") {
              const t4 = B && B.value === "(";
              if (!t4 && u3.noextglob !== true && D() === "(" && D(2) !== "?") {
                extglobOpen("qmark", G);
                continue;
              }
              if (B && B.type === "paren") {
                const t5 = D();
                let e5 = G;
                if (B.value === "(" && !/[!=<:]/.test(t5) || t5 === "<" && !/<([!=]|\w+>)/.test(remaining())) {
                  e5 = `\\${G}`;
                }
                push({ type: "text", value: G, output: e5 });
                continue;
              }
              if (u3.dot !== true && (B.type === "slash" || B.type === "bos")) {
                push({ type: "qmark", value: G, output: v });
                continue;
              }
              push({ type: "qmark", value: G, output: H });
              continue;
            }
            if (G === "!") {
              if (u3.noextglob !== true && D() === "(") {
                if (D(2) !== "?" || !/[!=<:]/.test(D(3))) {
                  extglobOpen("negate", G);
                  continue;
                }
              }
              if (u3.nonegate !== true && m.index === 0) {
                negate();
                continue;
              }
            }
            if (G === "+") {
              if (u3.noextglob !== true && D() === "(" && D(2) !== "?") {
                extglobOpen("plus", G);
                continue;
              }
              if (B && B.value === "(" || u3.regex === false) {
                push({ type: "plus", value: G, output: g });
                continue;
              }
              if (B && (B.type === "bracket" || B.type === "paren" || B.type === "brace") || m.parens > 0) {
                push({ type: "plus", value: G });
                continue;
              }
              push({ type: "plus", value: g });
              continue;
            }
            if (G === "@") {
              if (u3.noextglob !== true && D() === "(" && D(2) !== "?") {
                push({ type: "at", extglob: true, value: G, output: "" });
                continue;
              }
              push({ type: "text", value: G });
              continue;
            }
            if (G !== "*") {
              if (G === "$" || G === "^") {
                G = `\\${G}`;
              }
              const t4 = a.exec(remaining());
              if (t4) {
                G += t4[0];
                m.index += t4[0].length;
              }
              push({ type: "text", value: G });
              continue;
            }
            if (B && (B.type === "globstar" || B.star === true)) {
              B.type = "star";
              B.star = true;
              B.value += G;
              B.output = k;
              m.backtrack = true;
              m.globstar = true;
              consume(G);
              continue;
            }
            let e4 = remaining();
            if (u3.noextglob !== true && /^\([^?]/.test(e4)) {
              extglobOpen("star", G);
              continue;
            }
            if (B.type === "star") {
              if (u3.noglobstar === true) {
                consume(G);
                continue;
              }
              const n3 = B.prev;
              const o2 = n3.prev;
              const s2 = n3.type === "slash" || n3.type === "bos";
              const r2 = o2 && (o2.type === "star" || o2.type === "globstar");
              if (u3.bash === true && (!s2 || e4[0] && e4[0] !== "/")) {
                push({ type: "star", value: G, output: "" });
                continue;
              }
              const a2 = m.braces > 0 && (n3.type === "comma" || n3.type === "brace");
              const i2 = w.length && (n3.type === "pipe" || n3.type === "paren");
              if (!s2 && n3.type !== "paren" && !a2 && !i2) {
                push({ type: "star", value: G, output: "" });
                continue;
              }
              while (e4.slice(0, 3) === "/**") {
                const u4 = t3[m.index + 4];
                if (u4 && u4 !== "/") {
                  break;
                }
                e4 = e4.slice(3);
                consume("/**", 3);
              }
              if (n3.type === "bos" && eos()) {
                B.type = "globstar";
                B.value += G;
                B.output = globstar(u3);
                m.output = B.output;
                m.globstar = true;
                consume(G);
                continue;
              }
              if (n3.type === "slash" && n3.prev.type !== "bos" && !r2 && eos()) {
                m.output = m.output.slice(0, -(n3.output + B.output).length);
                n3.output = `(?:${n3.output}`;
                B.type = "globstar";
                B.output = globstar(u3) + (u3.strictSlashes ? ")" : "|$)");
                B.value += G;
                m.globstar = true;
                m.output += n3.output + B.output;
                consume(G);
                continue;
              }
              if (n3.type === "slash" && n3.prev.type !== "bos" && e4[0] === "/") {
                const t4 = e4[1] !== void 0 ? "|$" : "";
                m.output = m.output.slice(0, -(n3.output + B.output).length);
                n3.output = `(?:${n3.output}`;
                B.type = "globstar";
                B.output = `${globstar(u3)}${b}|${b}${t4})`;
                B.value += G;
                m.output += n3.output + B.output;
                m.globstar = true;
                consume(G + M());
                push({ type: "slash", value: "/", output: "" });
                continue;
              }
              if (n3.type === "bos" && e4[0] === "/") {
                B.type = "globstar";
                B.value += G;
                B.output = `(?:^|${b}|${globstar(u3)}${b})`;
                m.output = B.output;
                m.globstar = true;
                consume(G + M());
                push({ type: "slash", value: "/", output: "" });
                continue;
              }
              m.output = m.output.slice(0, -B.output.length);
              B.type = "globstar";
              B.output = globstar(u3);
              B.value += G;
              m.output += B.output;
              m.globstar = true;
              consume(G);
              continue;
            }
            const n2 = { type: "star", value: G, output: k };
            if (u3.bash === true) {
              n2.output = ".*?";
              if (B.type === "bos" || B.type === "slash") {
                n2.output = T + n2.output;
              }
              push(n2);
              continue;
            }
            if (B && (B.type === "bracket" || B.type === "paren") && u3.regex === true) {
              n2.output = G;
              push(n2);
              continue;
            }
            if (m.index === m.start || B.type === "slash" || B.type === "dot") {
              if (B.type === "dot") {
                m.output += x;
                B.output += x;
              } else if (u3.dot === true) {
                m.output += S;
                B.output += S;
              } else {
                m.output += T;
                B.output += T;
              }
              if (D() !== "*") {
                m.output += C;
                B.output += C;
              }
            }
            push(n2);
          }
          while (m.brackets > 0) {
            if (u3.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
            m.output = o.escapeLast(m.output, "[");
            decrement("brackets");
          }
          while (m.parens > 0) {
            if (u3.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
            m.output = o.escapeLast(m.output, "(");
            decrement("parens");
          }
          while (m.braces > 0) {
            if (u3.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
            m.output = o.escapeLast(m.output, "{");
            decrement("braces");
          }
          if (u3.strictSlashes !== true && (B.type === "star" || B.type === "bracket")) {
            push({ type: "maybe_slash", value: "", output: `${b}?` });
          }
          if (m.backtrack === true) {
            m.output = "";
            for (const t4 of m.tokens) {
              m.output += t4.output != null ? t4.output : t4.value;
              if (t4.suffix) {
                m.output += t4.suffix;
              }
            }
          }
          return m;
        };
        parse.fastpaths = (t3, e3) => {
          const u3 = { ...e3 };
          const r2 = typeof u3.maxLength === "number" ? Math.min(s, u3.maxLength) : s;
          const a2 = t3.length;
          if (a2 > r2) {
            throw new SyntaxError(`Input length: ${a2}, exceeds maximum allowed length: ${r2}`);
          }
          t3 = c[t3] || t3;
          const { DOT_LITERAL: i2, SLASH_LITERAL: p, ONE_CHAR: l, DOTS_SLASH: f, NO_DOT: A, NO_DOTS: _, NO_DOTS_SLASH: R, STAR: E, START_ANCHOR: h } = n.globChars(u3.windows);
          const g = u3.dot ? _ : A;
          const b = u3.dot ? R : A;
          const C = u3.capture ? "" : "?:";
          const y = { negated: false, prefix: "" };
          let $ = u3.bash === true ? ".*?" : E;
          if (u3.capture) {
            $ = `(${$})`;
          }
          const globstar = (t4) => {
            if (t4.noglobstar === true) return $;
            return `(${C}(?:(?!${h}${t4.dot ? f : i2}).)*?)`;
          };
          const create = (t4) => {
            switch (t4) {
              case "*":
                return `${g}${l}${$}`;
              case ".*":
                return `${i2}${l}${$}`;
              case "*.*":
                return `${g}${$}${i2}${l}${$}`;
              case "*/*":
                return `${g}${$}${p}${l}${b}${$}`;
              case "**":
                return g + globstar(u3);
              case "**/*":
                return `(?:${g}${globstar(u3)}${p})?${b}${l}${$}`;
              case "**/*.*":
                return `(?:${g}${globstar(u3)}${p})?${b}${$}${i2}${l}${$}`;
              case "**/.*":
                return `(?:${g}${globstar(u3)}${p})?${i2}${l}${$}`;
              default: {
                const e4 = /^(.*?)\.(\w+)$/.exec(t4);
                if (!e4) return;
                const u4 = create(e4[1]);
                if (!u4) return;
                return u4 + i2 + e4[2];
              }
            }
          };
          const x = o.removePrefix(t3, y);
          let S = create(x);
          if (S && u3.strictSlashes !== true) {
            S += `${p}?`;
          }
          return S;
        };
        t2.exports = parse;
      }, 696: (t2, e2, u2) => {
        const n = u2(229);
        const o = u2(929);
        const s = u2(971);
        const r = u2(963);
        const isObject = (t3) => t3 && typeof t3 === "object" && !Array.isArray(t3);
        const picomatch = (t3, e3, u3 = false) => {
          if (Array.isArray(t3)) {
            const n3 = t3.map(((t4) => picomatch(t4, e3, u3)));
            const arrayMatcher = (t4) => {
              for (const e4 of n3) {
                const u4 = e4(t4);
                if (u4) return u4;
              }
              return false;
            };
            return arrayMatcher;
          }
          const n2 = isObject(t3) && t3.tokens && t3.input;
          if (t3 === "" || typeof t3 !== "string" && !n2) {
            throw new TypeError("Expected pattern to be a non-empty string");
          }
          const o2 = e3 || {};
          const s2 = o2.windows;
          const r2 = n2 ? picomatch.compileRe(t3, e3) : picomatch.makeRe(t3, e3, false, true);
          const a = r2.state;
          delete r2.state;
          let isIgnored = () => false;
          if (o2.ignore) {
            const t4 = { ...e3, ignore: null, onMatch: null, onResult: null };
            isIgnored = picomatch(o2.ignore, t4, u3);
          }
          const matcher = (u4, n3 = false) => {
            const { isMatch: i, match: c, output: p } = picomatch.test(u4, r2, e3, { glob: t3, posix: s2 });
            const l = { glob: t3, state: a, regex: r2, posix: s2, input: u4, output: p, match: c, isMatch: i };
            if (typeof o2.onResult === "function") {
              o2.onResult(l);
            }
            if (i === false) {
              l.isMatch = false;
              return n3 ? l : false;
            }
            if (isIgnored(u4)) {
              if (typeof o2.onIgnore === "function") {
                o2.onIgnore(l);
              }
              l.isMatch = false;
              return n3 ? l : false;
            }
            if (typeof o2.onMatch === "function") {
              o2.onMatch(l);
            }
            return n3 ? l : true;
          };
          if (u3) {
            matcher.state = a;
          }
          return matcher;
        };
        picomatch.test = (t3, e3, u3, { glob: n2, posix: o2 } = {}) => {
          if (typeof t3 !== "string") {
            throw new TypeError("Expected input to be a string");
          }
          if (t3 === "") {
            return { isMatch: false, output: "" };
          }
          const r2 = u3 || {};
          const a = r2.format || (o2 ? s.toPosixSlashes : null);
          let i = t3 === n2;
          let c = i && a ? a(t3) : t3;
          if (i === false) {
            c = a ? a(t3) : t3;
            i = c === n2;
          }
          if (i === false || r2.capture === true) {
            if (r2.matchBase === true || r2.basename === true) {
              i = picomatch.matchBase(t3, e3, u3, o2);
            } else {
              i = e3.exec(c);
            }
          }
          return { isMatch: Boolean(i), match: i, output: c };
        };
        picomatch.matchBase = (t3, e3, u3) => {
          const n2 = e3 instanceof RegExp ? e3 : picomatch.makeRe(e3, u3);
          return n2.test(s.basename(t3));
        };
        picomatch.isMatch = (t3, e3, u3) => picomatch(e3, u3)(t3);
        picomatch.parse = (t3, e3) => {
          if (Array.isArray(t3)) return t3.map(((t4) => picomatch.parse(t4, e3)));
          return o(t3, { ...e3, fastpaths: false });
        };
        picomatch.scan = (t3, e3) => n(t3, e3);
        picomatch.compileRe = (t3, e3, u3 = false, n2 = false) => {
          if (u3 === true) {
            return t3.output;
          }
          const o2 = e3 || {};
          const s2 = o2.contains ? "" : "^";
          const r2 = o2.contains ? "" : "$";
          let a = `${s2}(?:${t3.output})${r2}`;
          if (t3 && t3.negated === true) {
            a = `^(?!${a}).*$`;
          }
          const i = picomatch.toRegex(a, e3);
          if (n2 === true) {
            i.state = t3;
          }
          return i;
        };
        picomatch.makeRe = (t3, e3 = {}, u3 = false, n2 = false) => {
          if (!t3 || typeof t3 !== "string") {
            throw new TypeError("Expected a non-empty string");
          }
          let s2 = { negated: false, fastpaths: true };
          if (e3.fastpaths !== false && (t3[0] === "." || t3[0] === "*")) {
            s2.output = o.fastpaths(t3, e3);
          }
          if (!s2.output) {
            s2 = o(t3, e3);
          }
          return picomatch.compileRe(s2, e3, u3, n2);
        };
        picomatch.toRegex = (t3, e3) => {
          try {
            const u3 = e3 || {};
            return new RegExp(t3, u3.flags || (u3.nocase ? "i" : ""));
          } catch (t4) {
            if (e3 && e3.debug === true) throw t4;
            return /$^/;
          }
        };
        picomatch.constants = r;
        t2.exports = picomatch;
      }, 229: (t2, e2, u2) => {
        const n = u2(971);
        const { CHAR_ASTERISK: o, CHAR_AT: s, CHAR_BACKWARD_SLASH: r, CHAR_COMMA: a, CHAR_DOT: i, CHAR_EXCLAMATION_MARK: c, CHAR_FORWARD_SLASH: p, CHAR_LEFT_CURLY_BRACE: l, CHAR_LEFT_PARENTHESES: f, CHAR_LEFT_SQUARE_BRACKET: A, CHAR_PLUS: _, CHAR_QUESTION_MARK: R, CHAR_RIGHT_CURLY_BRACE: E, CHAR_RIGHT_PARENTHESES: h, CHAR_RIGHT_SQUARE_BRACKET: g } = u2(963);
        const isPathSeparator = (t3) => t3 === p || t3 === r;
        const depth = (t3) => {
          if (t3.isPrefix !== true) {
            t3.depth = t3.isGlobstar ? Infinity : 1;
          }
        };
        const scan = (t3, e3) => {
          const u3 = e3 || {};
          const b = t3.length - 1;
          const C = u3.parts === true || u3.scanToEnd === true;
          const y = [];
          const $ = [];
          const x = [];
          let S = t3;
          let H = -1;
          let v = 0;
          let d = 0;
          let L = false;
          let T = false;
          let O = false;
          let k = false;
          let m = false;
          let w = false;
          let N = false;
          let I = false;
          let B = false;
          let G = false;
          let D = 0;
          let M;
          let P;
          let K = { value: "", depth: 0, isGlob: false };
          const eos = () => H >= b;
          const peek = () => S.charCodeAt(H + 1);
          const advance = () => {
            M = P;
            return S.charCodeAt(++H);
          };
          while (H < b) {
            P = advance();
            let t4;
            if (P === r) {
              N = K.backslashes = true;
              P = advance();
              if (P === l) {
                w = true;
              }
              continue;
            }
            if (w === true || P === l) {
              D++;
              while (eos() !== true && (P = advance())) {
                if (P === r) {
                  N = K.backslashes = true;
                  advance();
                  continue;
                }
                if (P === l) {
                  D++;
                  continue;
                }
                if (w !== true && P === i && (P = advance()) === i) {
                  L = K.isBrace = true;
                  O = K.isGlob = true;
                  G = true;
                  if (C === true) {
                    continue;
                  }
                  break;
                }
                if (w !== true && P === a) {
                  L = K.isBrace = true;
                  O = K.isGlob = true;
                  G = true;
                  if (C === true) {
                    continue;
                  }
                  break;
                }
                if (P === E) {
                  D--;
                  if (D === 0) {
                    w = false;
                    L = K.isBrace = true;
                    G = true;
                    break;
                  }
                }
              }
              if (C === true) {
                continue;
              }
              break;
            }
            if (P === p) {
              y.push(H);
              $.push(K);
              K = { value: "", depth: 0, isGlob: false };
              if (G === true) continue;
              if (M === i && H === v + 1) {
                v += 2;
                continue;
              }
              d = H + 1;
              continue;
            }
            if (u3.noext !== true) {
              const t5 = P === _ || P === s || P === o || P === R || P === c;
              if (t5 === true && peek() === f) {
                O = K.isGlob = true;
                k = K.isExtglob = true;
                G = true;
                if (P === c && H === v) {
                  B = true;
                }
                if (C === true) {
                  while (eos() !== true && (P = advance())) {
                    if (P === r) {
                      N = K.backslashes = true;
                      P = advance();
                      continue;
                    }
                    if (P === h) {
                      O = K.isGlob = true;
                      G = true;
                      break;
                    }
                  }
                  continue;
                }
                break;
              }
            }
            if (P === o) {
              if (M === o) m = K.isGlobstar = true;
              O = K.isGlob = true;
              G = true;
              if (C === true) {
                continue;
              }
              break;
            }
            if (P === R) {
              O = K.isGlob = true;
              G = true;
              if (C === true) {
                continue;
              }
              break;
            }
            if (P === A) {
              while (eos() !== true && (t4 = advance())) {
                if (t4 === r) {
                  N = K.backslashes = true;
                  advance();
                  continue;
                }
                if (t4 === g) {
                  T = K.isBracket = true;
                  O = K.isGlob = true;
                  G = true;
                  break;
                }
              }
              if (C === true) {
                continue;
              }
              break;
            }
            if (u3.nonegate !== true && P === c && H === v) {
              I = K.negated = true;
              v++;
              continue;
            }
            if (u3.noparen !== true && P === f) {
              O = K.isGlob = true;
              if (C === true) {
                while (eos() !== true && (P = advance())) {
                  if (P === f) {
                    N = K.backslashes = true;
                    P = advance();
                    continue;
                  }
                  if (P === h) {
                    G = true;
                    break;
                  }
                }
                continue;
              }
              break;
            }
            if (O === true) {
              G = true;
              if (C === true) {
                continue;
              }
              break;
            }
          }
          if (u3.noext === true) {
            k = false;
            O = false;
          }
          let U = S;
          let X5 = "";
          let F = "";
          if (v > 0) {
            X5 = S.slice(0, v);
            S = S.slice(v);
            d -= v;
          }
          if (U && O === true && d > 0) {
            U = S.slice(0, d);
            F = S.slice(d);
          } else if (O === true) {
            U = "";
            F = S;
          } else {
            U = S;
          }
          if (U && U !== "" && U !== "/" && U !== S) {
            if (isPathSeparator(U.charCodeAt(U.length - 1))) {
              U = U.slice(0, -1);
            }
          }
          if (u3.unescape === true) {
            if (F) F = n.removeBackslashes(F);
            if (U && N === true) {
              U = n.removeBackslashes(U);
            }
          }
          const Q = { prefix: X5, input: t3, start: v, base: U, glob: F, isBrace: L, isBracket: T, isGlob: O, isExtglob: k, isGlobstar: m, negated: I, negatedExtglob: B };
          if (u3.tokens === true) {
            Q.maxDepth = 0;
            if (!isPathSeparator(P)) {
              $.push(K);
            }
            Q.tokens = $;
          }
          if (u3.parts === true || u3.tokens === true) {
            let e4;
            for (let n2 = 0; n2 < y.length; n2++) {
              const o2 = e4 ? e4 + 1 : v;
              const s2 = y[n2];
              const r2 = t3.slice(o2, s2);
              if (u3.tokens) {
                if (n2 === 0 && v !== 0) {
                  $[n2].isPrefix = true;
                  $[n2].value = X5;
                } else {
                  $[n2].value = r2;
                }
                depth($[n2]);
                Q.maxDepth += $[n2].depth;
              }
              if (n2 !== 0 || r2 !== "") {
                x.push(r2);
              }
              e4 = s2;
            }
            if (e4 && e4 + 1 < t3.length) {
              const n2 = t3.slice(e4 + 1);
              x.push(n2);
              if (u3.tokens) {
                $[$.length - 1].value = n2;
                depth($[$.length - 1]);
                Q.maxDepth += $[$.length - 1].depth;
              }
            }
            Q.slashes = y;
            Q.parts = x;
          }
          return Q;
        };
        t2.exports = scan;
      }, 971: (t2, e2, u2) => {
        const { REGEX_BACKSLASH: n, REGEX_REMOVE_BACKSLASH: o, REGEX_SPECIAL_CHARS: s, REGEX_SPECIAL_CHARS_GLOBAL: r } = u2(963);
        e2.isObject = (t3) => t3 !== null && typeof t3 === "object" && !Array.isArray(t3);
        e2.hasRegexChars = (t3) => s.test(t3);
        e2.isRegexChar = (t3) => t3.length === 1 && e2.hasRegexChars(t3);
        e2.escapeRegex = (t3) => t3.replace(r, "\\$1");
        e2.toPosixSlashes = (t3) => t3.replace(n, "/");
        e2.removeBackslashes = (t3) => t3.replace(o, ((t4) => t4 === "\\" ? "" : t4));
        e2.escapeLast = (t3, u3, n2) => {
          const o2 = t3.lastIndexOf(u3, n2);
          if (o2 === -1) return t3;
          if (t3[o2 - 1] === "\\") return e2.escapeLast(t3, u3, o2 - 1);
          return `${t3.slice(0, o2)}\\${t3.slice(o2)}`;
        };
        e2.removePrefix = (t3, e3 = {}) => {
          let u3 = t3;
          if (u3.startsWith("./")) {
            u3 = u3.slice(2);
            e3.prefix = "./";
          }
          return u3;
        };
        e2.wrapOutput = (t3, e3 = {}, u3 = {}) => {
          const n2 = u3.contains ? "" : "^";
          const o2 = u3.contains ? "" : "$";
          let s2 = `${n2}(?:${t3})${o2}`;
          if (e3.negated === true) {
            s2 = `(?:^(?!${s2}).*$)`;
          }
          return s2;
        };
        e2.basename = (t3, { windows: e3 } = {}) => {
          const u3 = t3.split(e3 ? /[\\/]/ : "/");
          const n2 = u3[u3.length - 1];
          if (n2 === "") {
            return u3[u3.length - 2];
          }
          return n2;
        };
      } };
      var e = {};
      function __nccwpck_require__2(u2) {
        var n = e[u2];
        if (n !== void 0) {
          return n.exports;
        }
        var o = e[u2] = { exports: {} };
        var s = true;
        try {
          t[u2](o, o.exports, __nccwpck_require__2);
          s = false;
        } finally {
          if (s) delete e[u2];
        }
        return o.exports;
      }
      if (typeof __nccwpck_require__2 !== "undefined") __nccwpck_require__2.ab = __dirname + "/";
      var u = __nccwpck_require__2(286);
      module.exports = u;
    })();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/match-local-pattern.js
var require_match_local_pattern = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/match-local-pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      hasLocalMatch: function() {
        return hasLocalMatch;
      },
      matchLocalPattern: function() {
        return matchLocalPattern;
      }
    });
    var _picomatch = require_picomatch();
    function matchLocalPattern(pattern, url) {
      if (pattern.search !== void 0) {
        if (pattern.search !== url.search) {
          return false;
        }
      }
      if (!(0, _picomatch.makeRe)(pattern.pathname ?? "**", {
        dot: true
      }).test(url.pathname)) {
        return false;
      }
      return true;
    }
    function hasLocalMatch(localPatterns, urlPathAndQuery) {
      if (!localPatterns) {
        return true;
      }
      const url = new URL(urlPathAndQuery, "http://n");
      return localPatterns.some((p) => matchLocalPattern(p, url));
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/match-remote-pattern.js
var require_match_remote_pattern = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/match-remote-pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      hasRemoteMatch: function() {
        return hasRemoteMatch;
      },
      matchRemotePattern: function() {
        return matchRemotePattern;
      }
    });
    var _picomatch = require_picomatch();
    function matchRemotePattern(pattern, url) {
      if (pattern.protocol !== void 0) {
        if (pattern.protocol.replace(/:$/, "") !== url.protocol.replace(/:$/, "")) {
          return false;
        }
      }
      if (pattern.port !== void 0) {
        if (pattern.port !== url.port) {
          return false;
        }
      }
      if (pattern.hostname === void 0) {
        throw Object.defineProperty(new Error(`Pattern should define hostname but found
${JSON.stringify(pattern)}`), "__NEXT_ERROR_CODE", {
          value: "E410",
          enumerable: false,
          configurable: true
        });
      } else {
        if (!(0, _picomatch.makeRe)(pattern.hostname).test(url.hostname)) {
          return false;
        }
      }
      if (pattern.search !== void 0) {
        if (pattern.search !== url.search) {
          return false;
        }
      }
      if (!(0, _picomatch.makeRe)(pattern.pathname ?? "**", {
        dot: true
      }).test(url.pathname)) {
        return false;
      }
      return true;
    }
    function hasRemoteMatch(domains, remotePatterns, url) {
      return domains.some((domain) => url.hostname === domain) || remotePatterns.some((p) => matchRemotePattern(p, url));
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-loader.js
var require_image_loader = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-loader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "default", {
      enumerable: true,
      get: function() {
        return _default;
      }
    });
    var _findclosestquality = require_find_closest_quality();
    var _deploymentid = require_deployment_id();
    function defaultLoader({ config, src, width, quality }) {
      if (process.env.NODE_ENV !== "production") {
        const missingValues = [];
        if (!src) missingValues.push("src");
        if (!width) missingValues.push("width");
        if (missingValues.length > 0) {
          throw Object.defineProperty(new Error(`Next Image Optimization requires ${missingValues.join(", ")} to be provided. Make sure you pass them as props to the \`next/image\` component. Received: ${JSON.stringify({
            src,
            width,
            quality
          })}`), "__NEXT_ERROR_CODE", {
            value: "E188",
            enumerable: false,
            configurable: true
          });
        }
      }
      let deploymentId = (0, _deploymentid.getDeploymentId)();
      if (src.startsWith("/") && !src.startsWith("//")) {
        if (src.includes("/_next/static/immutable") && !(0, _deploymentid.getAssetToken)()) {
          deploymentId = void 0;
        } else {
          const qIndex = src.indexOf("?");
          if (qIndex !== -1) {
            const params = new URLSearchParams(src.slice(qIndex + 1));
            const srcDpl = params.get("dpl");
            if (srcDpl) {
              deploymentId = srcDpl;
              params.delete("dpl");
              const remaining = params.toString();
              src = src.slice(0, qIndex) + (remaining ? "?" + remaining : "");
            }
          }
        }
      }
      if (src.startsWith("/") && src.includes("?") && config.localPatterns?.length === 1 && config.localPatterns[0].pathname === "**" && config.localPatterns[0].search === "") {
        throw Object.defineProperty(new Error(`Image with src "${src}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`), "__NEXT_ERROR_CODE", {
          value: "E871",
          enumerable: false,
          configurable: true
        });
      }
      if (process.env.NODE_ENV !== "production") {
        if (src.startsWith("//")) {
          throw Object.defineProperty(new Error(`Failed to parse src "${src}" on \`next/image\`, protocol-relative URL (//) must be changed to an absolute URL (http:// or https://)`), "__NEXT_ERROR_CODE", {
            value: "E360",
            enumerable: false,
            configurable: true
          });
        }
        if (src.startsWith("/") && config.localPatterns) {
          if (process.env.NODE_ENV !== "test" && // micromatch isn't compatible with edge runtime
          process.env.NEXT_RUNTIME !== "edge") {
            const { hasLocalMatch } = require_match_local_pattern();
            if (!hasLocalMatch(config.localPatterns, src)) {
              throw Object.defineProperty(new Error(`Invalid src prop (${src}) on \`next/image\` does not match \`images.localPatterns\` configured in your \`next.config.js\`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`), "__NEXT_ERROR_CODE", {
                value: "E426",
                enumerable: false,
                configurable: true
              });
            }
          }
        }
        if (!src.startsWith("/") && (config.domains || config.remotePatterns)) {
          let parsedSrc;
          try {
            parsedSrc = new URL(src);
          } catch (err) {
            console.error(err);
            throw Object.defineProperty(new Error(`Failed to parse src "${src}" on \`next/image\`, if using relative image it must start with a leading slash "/" or be an absolute URL (http:// or https://)`), "__NEXT_ERROR_CODE", {
              value: "E63",
              enumerable: false,
              configurable: true
            });
          }
          if (process.env.NODE_ENV !== "test" && // micromatch isn't compatible with edge runtime
          process.env.NEXT_RUNTIME !== "edge") {
            const { hasRemoteMatch } = require_match_remote_pattern();
            if (!hasRemoteMatch(config.domains, config.remotePatterns, parsedSrc)) {
              throw Object.defineProperty(new Error(`Invalid src prop (${src}) on \`next/image\`, hostname "${parsedSrc.hostname}" is not configured under images in your \`next.config.js\`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host`), "__NEXT_ERROR_CODE", {
                value: "E231",
                enumerable: false,
                configurable: true
              });
            }
          }
        }
      }
      const q = (0, _findclosestquality.findClosestQuality)(quality, config);
      return `${config.path}?url=${encodeURIComponent(src)}&w=${width}&q=${q}${src.startsWith("/") && deploymentId ? `&dpl=${deploymentId}` : ""}`;
    }
    defaultLoader.__next_img_default = true;
    var _default = defaultLoader;
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/use-merged-ref.js
var require_use_merged_ref = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/use-merged-ref.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "useMergedRef", {
      enumerable: true,
      get: function() {
        return useMergedRef;
      }
    });
    var _react = __require("react");
    function useMergedRef(refA, refB) {
      const cleanupA = (0, _react.useRef)(null);
      const cleanupB = (0, _react.useRef)(null);
      return (0, _react.useCallback)((current) => {
        if (current === null) {
          const cleanupFnA = cleanupA.current;
          if (cleanupFnA) {
            cleanupA.current = null;
            cleanupFnA();
          }
          const cleanupFnB = cleanupB.current;
          if (cleanupFnB) {
            cleanupB.current = null;
            cleanupFnB();
          }
        } else {
          if (refA) {
            cleanupA.current = applyRef(refA, current);
          }
          if (refB) {
            cleanupB.current = applyRef(refB, current);
          }
        }
      }, [
        refA,
        refB
      ]);
    }
    function applyRef(refA, current) {
      if (typeof refA === "function") {
        const cleanup = refA(current);
        if (typeof cleanup === "function") {
          return cleanup;
        } else {
          return () => refA(null);
        }
      } else {
        refA.current = current;
        return () => {
          refA.current = null;
        };
      }
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/image-component.js
var require_image_component = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/image-component.js"(exports, module) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "Image", {
      enumerable: true,
      get: function() {
        return Image3;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _jsxruntime = __require("react/jsx-runtime");
    var _react = /* @__PURE__ */ _interop_require_wildcard._(__require("react"));
    var _reactdom = /* @__PURE__ */ _interop_require_default._(__require("react-dom"));
    var _head = /* @__PURE__ */ _interop_require_default._(require_head());
    var _getimgprops = require_get_img_props();
    var _imageconfig = require_image_config();
    var _imageconfigcontextsharedruntime = require_image_config_context_shared_runtime();
    var _routercontextsharedruntime = require_router_context_shared_runtime();
    var _imageloader = /* @__PURE__ */ _interop_require_default._(require_image_loader());
    var _usemergedref = require_use_merged_ref();
    var configEnv = process.env.__NEXT_IMAGE_OPTS;
    if (typeof window === "undefined") {
      ;
      globalThis.__NEXT_IMAGE_IMPORTED = true;
    }
    function handleLoading(img, placeholder, onLoadRef, onLoadingCompleteRef, setBlurComplete, unoptimized, sizesInput) {
      const src = img?.src;
      if (!img || img["data-loaded-src"] === src) {
        return;
      }
      img["data-loaded-src"] = src;
      const p = "decode" in img ? img.decode() : Promise.resolve();
      p.catch(() => {
      }).then(() => {
        if (!img.parentElement || !img.isConnected) {
          return;
        }
        if (placeholder !== "empty") {
          setBlurComplete(true);
        }
        if (onLoadRef?.current) {
          const event = new Event("load");
          Object.defineProperty(event, "target", {
            writable: false,
            value: img
          });
          let prevented = false;
          let stopped = false;
          onLoadRef.current({
            ...event,
            nativeEvent: event,
            currentTarget: img,
            target: img,
            isDefaultPrevented: () => prevented,
            isPropagationStopped: () => stopped,
            persist: () => {
            },
            preventDefault: () => {
              prevented = true;
              event.preventDefault();
            },
            stopPropagation: () => {
              stopped = true;
              event.stopPropagation();
            }
          });
        }
        if (onLoadingCompleteRef?.current) {
          onLoadingCompleteRef.current(img);
        }
        if (process.env.NODE_ENV !== "production") {
          const { warnOnce } = require_warn_once();
          const origSrc = new URL(src, "http://n").searchParams.get("url") || src;
          if (img.getAttribute("data-nimg") === "fill") {
            if (!unoptimized && (!sizesInput || sizesInput === "100vw")) {
              let widthViewportRatio = img.getBoundingClientRect().width / window.innerWidth;
              if (widthViewportRatio < 0.6) {
                if (sizesInput === "100vw") {
                  warnOnce(`Image with src "${origSrc}" has "fill" prop and "sizes" prop of "100vw", but image is not rendered at full viewport width. Please adjust "sizes" to improve page performance. Read more: https://nextjs.org/docs/api-reference/next/image#sizes`);
                } else {
                  warnOnce(`Image with src "${origSrc}" has "fill" but is missing "sizes" prop. Please add it to improve page performance. Read more: https://nextjs.org/docs/api-reference/next/image#sizes`);
                }
              }
            }
            if (img.parentElement) {
              const { position } = window.getComputedStyle(img.parentElement);
              const valid = [
                "absolute",
                "fixed",
                "relative"
              ];
              if (!valid.includes(position)) {
                warnOnce(`Image with src "${origSrc}" has "fill" and parent element with invalid "position". Provided "${position}" should be one of ${valid.map(String).join(",")}.`);
              }
            }
            if (img.height === 0) {
              warnOnce(`Image with src "${origSrc}" has "fill" and a height value of 0. This is likely because the parent element of the image has not been styled to have a set height.`);
            }
          }
          const heightModified = img.height.toString() !== img.getAttribute("height");
          const widthModified = img.width.toString() !== img.getAttribute("width");
          if (heightModified && !widthModified || !heightModified && widthModified) {
            warnOnce(`Image with src "${origSrc}" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.`);
          }
        }
      });
    }
    function getDynamicProps(fetchPriority) {
      if (Boolean(_react.use)) {
        return {
          fetchPriority
        };
      }
      return {
        fetchpriority: fetchPriority
      };
    }
    var useNonWarningLayoutEffect = typeof window === "undefined" ? _react.useEffect : _react.useLayoutEffect;
    var ImageElement = /* @__PURE__ */ (0, _react.forwardRef)(({ src, srcSet, sizes, height, width, decoding, className, style, fetchPriority, placeholder, loading, unoptimized, fill, onLoadRef, onLoadingCompleteRef, setBlurComplete, setShowAltText, sizesInput, onLoad, onError, ...rest }, forwardedRef) => {
      const didInsertRef = (0, _react.useRef)(false);
      const insertedImgRef = (0, _react.useRef)(null);
      useNonWarningLayoutEffect(() => {
        const { current: didInsert } = didInsertRef;
        const { current: img } = insertedImgRef;
        if (!didInsert && img !== null) {
          if (onError) {
            img.src = img.src;
          }
          if (process.env.NODE_ENV !== "production") {
            if (!src) {
              console.error(`Image is missing required "src" property:`, img);
            }
            if (img.getAttribute("alt") === null) {
              console.error(`Image is missing required "alt" property. Please add Alternative Text to describe the image for screen readers and search engines.`);
            }
          }
          if (img.complete) {
            handleLoading(img, placeholder, onLoadRef, onLoadingCompleteRef, setBlurComplete, unoptimized, sizesInput);
          }
          didInsertRef.current = true;
        }
      }, [
        src,
        placeholder,
        onLoadRef,
        onLoadingCompleteRef,
        onError,
        unoptimized,
        sizesInput
      ]);
      const ref = (0, _usemergedref.useMergedRef)(forwardedRef, insertedImgRef);
      return (
        // If you move this element creation, also move the Layout Effect above
        // reading from the ref. Otherwise we might run the Layout Effect when
        // the current value isn't set to the HTMLImageElement instance.
        /* @__PURE__ */ (0, _jsxruntime.jsx)("img", {
          ...rest,
          ...getDynamicProps(fetchPriority),
          // It's intended to keep `loading` before `src` because React updates
          // props in order which causes Safari/Firefox to not lazy load properly.
          // See https://github.com/facebook/react/issues/25883
          loading,
          width,
          height,
          decoding,
          "data-nimg": fill ? "fill" : "1",
          className,
          style,
          // It's intended to keep `src` the last attribute because React updates
          // attributes in order. If we keep `src` the first one, Safari will
          // immediately start to fetch `src`, before `sizes` and `srcSet` are even
          // updated by React. That causes multiple unnecessary requests if `srcSet`
          // and `sizes` are defined.
          // This bug cannot be reproduced in Chrome or Firefox.
          sizes,
          srcSet,
          src,
          ref,
          onLoad: (event) => {
            const currentImage = event.currentTarget;
            handleLoading(currentImage, placeholder, onLoadRef, onLoadingCompleteRef, setBlurComplete, unoptimized, sizesInput);
          },
          onError: (event) => {
            setShowAltText(true);
            if (placeholder !== "empty") {
              setBlurComplete(true);
            }
            if (onError) {
              onError(event);
            }
          }
        })
      );
    });
    function ImagePreload({ isAppRouter, imgAttributes }) {
      const opts = {
        as: "image",
        imageSrcSet: imgAttributes.srcSet,
        imageSizes: imgAttributes.sizes,
        crossOrigin: imgAttributes.crossOrigin,
        referrerPolicy: imgAttributes.referrerPolicy,
        ...getDynamicProps(imgAttributes.fetchPriority)
      };
      if (isAppRouter && _reactdom.default.preload) {
        _reactdom.default.preload(imgAttributes.src, opts);
        return null;
      }
      return /* @__PURE__ */ (0, _jsxruntime.jsx)(_head.default, {
        children: /* @__PURE__ */ (0, _jsxruntime.jsx)("link", {
          rel: "preload",
          // Note how we omit the `href` attribute, as it would only be relevant
          // for browsers that do not support `imagesrcset`, and in those cases
          // it would cause the incorrect image to be preloaded.
          //
          // https://html.spec.whatwg.org/multipage/semantics.html#attr-link-imagesrcset
          href: imgAttributes.srcSet ? void 0 : imgAttributes.src,
          ...opts
        }, "__nimg-" + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes)
      });
    }
    var Image3 = /* @__PURE__ */ (0, _react.forwardRef)((props, forwardedRef) => {
      const pagesRouter = (0, _react.useContext)(_routercontextsharedruntime.RouterContext);
      const isAppRouter = !pagesRouter;
      const configContext = (0, _react.useContext)(_imageconfigcontextsharedruntime.ImageConfigContext);
      const config = (0, _react.useMemo)(() => {
        const c = configEnv || configContext || _imageconfig.imageConfigDefault;
        const allSizes = [
          ...c.deviceSizes,
          ...c.imageSizes
        ].sort((a, b) => a - b);
        const deviceSizes = c.deviceSizes.sort((a, b) => a - b);
        const qualities = c.qualities?.sort((a, b) => a - b);
        return {
          ...c,
          allSizes,
          deviceSizes,
          qualities,
          // During the SSR, configEnv (__NEXT_IMAGE_OPTS) does not include
          // security sensitive configs like `localPatterns`, which is needed
          // during the server render to ensure it's validated. Therefore use
          // configContext, which holds the config from the server for validation.
          localPatterns: typeof window === "undefined" ? configContext?.localPatterns : c.localPatterns
        };
      }, [
        configContext
      ]);
      const { onLoad, onLoadingComplete } = props;
      const onLoadRef = (0, _react.useRef)(onLoad);
      (0, _react.useEffect)(() => {
        onLoadRef.current = onLoad;
      }, [
        onLoad
      ]);
      const onLoadingCompleteRef = (0, _react.useRef)(onLoadingComplete);
      (0, _react.useEffect)(() => {
        onLoadingCompleteRef.current = onLoadingComplete;
      }, [
        onLoadingComplete
      ]);
      const [blurComplete, setBlurComplete] = (0, _react.useState)(false);
      const [showAltText, setShowAltText] = (0, _react.useState)(false);
      const { props: imgAttributes, meta: imgMeta } = (0, _getimgprops.getImgProps)(props, {
        defaultLoader: _imageloader.default,
        imgConf: config,
        blurComplete,
        showAltText
      });
      return /* @__PURE__ */ (0, _jsxruntime.jsxs)(_jsxruntime.Fragment, {
        children: [
          /* @__PURE__ */ (0, _jsxruntime.jsx)(ImageElement, {
            ...imgAttributes,
            unoptimized: imgMeta.unoptimized,
            placeholder: imgMeta.placeholder,
            fill: imgMeta.fill,
            onLoadRef,
            onLoadingCompleteRef,
            setBlurComplete,
            setShowAltText,
            sizesInput: props.sizes,
            ref: forwardedRef
          }),
          imgMeta.preload ? /* @__PURE__ */ (0, _jsxruntime.jsx)(ImagePreload, {
            isAppRouter,
            imgAttributes
          }) : null
        ]
      });
    });
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-external.js
var require_image_external = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/image-external.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      default: function() {
        return _default;
      },
      getImageProps: function() {
        return getImageProps;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _getimgprops = require_get_img_props();
    var _imagecomponent = require_image_component();
    var _imageloader = /* @__PURE__ */ _interop_require_default._(require_image_loader());
    function getImageProps(imgProps) {
      const { props } = (0, _getimgprops.getImgProps)(imgProps, {
        defaultLoader: _imageloader.default,
        // This is replaced by webpack define plugin
        imgConf: process.env.__NEXT_IMAGE_OPTS
      });
      for (const [key, value] of Object.entries(props)) {
        if (value === void 0) {
          delete props[key];
        }
      }
      return {
        props
      };
    }
    var _default = _imagecomponent.Image;
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/image.js
var require_image = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/image.js"(exports, module) {
    "use strict";
    module.exports = require_image_external();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/querystring.js
var require_querystring = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/querystring.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      assign: function() {
        return assign;
      },
      searchParamsToUrlQuery: function() {
        return searchParamsToUrlQuery;
      },
      urlQueryToSearchParams: function() {
        return urlQueryToSearchParams;
      }
    });
    function searchParamsToUrlQuery(searchParams) {
      const query = {};
      for (const [key, value] of searchParams.entries()) {
        const existing = query[key];
        if (typeof existing === "undefined") {
          query[key] = value;
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [
            existing,
            value
          ];
        }
      }
      return query;
    }
    function stringifyUrlQueryParam(param) {
      if (typeof param === "string") {
        return param;
      }
      if (typeof param === "number" && !isNaN(param) || typeof param === "boolean") {
        return String(param);
      } else {
        return "";
      }
    }
    function urlQueryToSearchParams(query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            searchParams.append(key, stringifyUrlQueryParam(item));
          }
        } else {
          searchParams.set(key, stringifyUrlQueryParam(value));
        }
      }
      return searchParams;
    }
    function assign(target, ...searchParamsList) {
      for (const searchParams of searchParamsList) {
        for (const key of searchParams.keys()) {
          target.delete(key);
        }
        for (const [key, value] of searchParams.entries()) {
          target.append(key, value);
        }
      }
      return target;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/format-url.js
var require_format_url = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/format-url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      formatUrl: function() {
        return formatUrl;
      },
      formatWithValidation: function() {
        return formatWithValidation;
      },
      urlObjectKeys: function() {
        return urlObjectKeys;
      }
    });
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _querystring = /* @__PURE__ */ _interop_require_wildcard._(require_querystring());
    var slashedProtocols = /https?|ftp|gopher|file/;
    function formatUrl(urlObj) {
      let { auth, hostname } = urlObj;
      let protocol = urlObj.protocol || "";
      let pathname = urlObj.pathname || "";
      let hash = urlObj.hash || "";
      let query = urlObj.query || "";
      let host = false;
      auth = auth ? encodeURIComponent(auth).replace(/%3A/i, ":") + "@" : "";
      if (urlObj.host) {
        host = auth + urlObj.host;
      } else if (hostname) {
        host = auth + (~hostname.indexOf(":") ? `[${hostname}]` : hostname);
        if (urlObj.port) {
          host += ":" + urlObj.port;
        }
      }
      if (query && typeof query === "object") {
        query = String(_querystring.urlQueryToSearchParams(query));
      }
      let search = urlObj.search || query && `?${query}` || "";
      if (protocol && !protocol.endsWith(":")) protocol += ":";
      if (urlObj.slashes || (!protocol || slashedProtocols.test(protocol)) && host !== false) {
        host = "//" + (host || "");
        if (pathname && pathname[0] !== "/") pathname = "/" + pathname;
      } else if (!host) {
        host = "";
      }
      if (hash && hash[0] !== "#") hash = "#" + hash;
      if (search && search[0] !== "?") search = "?" + search;
      pathname = pathname.replace(/[?#]/g, encodeURIComponent);
      search = search.replace("#", "%23");
      return `${protocol}${host}${pathname}${search}${hash}`;
    }
    var urlObjectKeys = [
      "auth",
      "hash",
      "host",
      "hostname",
      "href",
      "path",
      "pathname",
      "port",
      "protocol",
      "query",
      "search",
      "slashes"
    ];
    function formatWithValidation(url) {
      if (process.env.NODE_ENV === "development") {
        if (url !== null && typeof url === "object") {
          Object.keys(url).forEach((key) => {
            if (!urlObjectKeys.includes(key)) {
              console.warn(`Unknown key passed via urlObject into url.format: ${key}`);
            }
          });
        }
      }
      return formatUrl(url);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/omit.js
var require_omit = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/omit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "omit", {
      enumerable: true,
      get: function() {
        return omit;
      }
    });
    function omit(object, keys) {
      const omitted = {};
      Object.keys(object).forEach((key) => {
        if (!keys.includes(key)) {
          omitted[key] = object[key];
        }
      });
      return omitted;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      DecodeError: function() {
        return DecodeError;
      },
      MiddlewareNotFoundError: function() {
        return MiddlewareNotFoundError;
      },
      MissingStaticPage: function() {
        return MissingStaticPage;
      },
      NormalizeError: function() {
        return NormalizeError;
      },
      PageNotFoundError: function() {
        return PageNotFoundError;
      },
      SP: function() {
        return SP;
      },
      ST: function() {
        return ST;
      },
      WEB_VITALS: function() {
        return WEB_VITALS;
      },
      execOnce: function() {
        return execOnce;
      },
      getDisplayName: function() {
        return getDisplayName;
      },
      getLocationOrigin: function() {
        return getLocationOrigin;
      },
      getURL: function() {
        return getURL;
      },
      isAbsoluteUrl: function() {
        return isAbsoluteUrl;
      },
      isResSent: function() {
        return isResSent;
      },
      loadGetInitialProps: function() {
        return loadGetInitialProps;
      },
      normalizeRepeatedSlashes: function() {
        return normalizeRepeatedSlashes;
      },
      stringifyError: function() {
        return stringifyError;
      }
    });
    var WEB_VITALS = [
      "CLS",
      "FCP",
      "FID",
      "INP",
      "LCP",
      "TTFB"
    ];
    function execOnce(fn) {
      let used = false;
      let result;
      return (...args) => {
        if (!used) {
          used = true;
          result = fn(...args);
        }
        return result;
      };
    }
    var ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
    var isAbsoluteUrl = (url) => {
      const c = url.charCodeAt(0);
      const isLetter = c >= 65 && c <= 90 || c >= 97 && c <= 122;
      if (!isLetter) {
        return false;
      }
      return ABSOLUTE_URL_REGEX.test(url);
    };
    function getLocationOrigin() {
      const { protocol, hostname, port } = window.location;
      return `${protocol}//${hostname}${port ? ":" + port : ""}`;
    }
    function getURL() {
      const { href } = window.location;
      const origin = getLocationOrigin();
      return href.substring(origin.length);
    }
    function getDisplayName(Component2) {
      return typeof Component2 === "string" ? Component2 : Component2.displayName || Component2.name || "Unknown";
    }
    function isResSent(res) {
      return res.finished || res.headersSent;
    }
    function normalizeRepeatedSlashes(url) {
      const urlParts = url.split("?");
      const urlNoQuery = urlParts[0];
      return urlNoQuery.replace(/\\/g, "/").replace(/\/\/+/g, "/") + (urlParts[1] ? `?${urlParts.slice(1).join("?")}` : "");
    }
    async function loadGetInitialProps(App, ctx) {
      if (process.env.NODE_ENV !== "production") {
        if (App.prototype?.getInitialProps) {
          const message = `"${getDisplayName(App)}.getInitialProps()" is defined as an instance method - visit https://nextjs.org/docs/messages/get-initial-props-as-an-instance-method for more information.`;
          throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
            value: "E1035",
            enumerable: false,
            configurable: true
          });
        }
      }
      const res = ctx.res || ctx.ctx && ctx.ctx.res;
      if (!App.getInitialProps) {
        if (ctx.ctx && ctx.Component) {
          return {
            pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx)
          };
        }
        return {};
      }
      const props = await App.getInitialProps(ctx);
      if (res && isResSent(res)) {
        return props;
      }
      if (!props) {
        const message = `"${getDisplayName(App)}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
        throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
          value: "E1025",
          enumerable: false,
          configurable: true
        });
      }
      if (process.env.NODE_ENV !== "production") {
        if (Object.keys(props).length === 0 && !ctx.ctx) {
          console.warn(`${getDisplayName(App)} returned an empty object from \`getInitialProps\`. This de-optimizes and prevents automatic static optimization. https://nextjs.org/docs/messages/empty-object-getInitialProps`);
        }
      }
      return props;
    }
    var SP = typeof performance !== "undefined";
    var ST = SP && [
      "mark",
      "measure",
      "getEntriesByName"
    ].every((method) => typeof performance[method] === "function");
    var DecodeError = class extends Error {
    };
    var NormalizeError = class extends Error {
    };
    var PageNotFoundError = class extends Error {
      constructor(page) {
        super();
        this.code = "ENOENT";
        this.name = "PageNotFoundError";
        this.message = `Cannot find module for page: ${page}`;
      }
    };
    var MissingStaticPage = class extends Error {
      constructor(page, message) {
        super();
        this.message = `Failed to load static file for page: ${page} ${message}`;
      }
    };
    var MiddlewareNotFoundError = class extends Error {
      constructor() {
        super();
        this.code = "ENOENT";
        this.message = `Cannot find the middleware module`;
      }
    };
    function stringifyError(error) {
      return JSON.stringify({
        message: error.message,
        stack: error.stack
      });
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/remove-trailing-slash.js
var require_remove_trailing_slash = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/remove-trailing-slash.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "removeTrailingSlash", {
      enumerable: true,
      get: function() {
        return removeTrailingSlash;
      }
    });
    function removeTrailingSlash(route) {
      return route.charCodeAt(route.length - 1) === 47 && route.length > 1 ? route.slice(0, -1) : route;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-path.js
var require_parse_path = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-path.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "parsePath", {
      enumerable: true,
      get: function() {
        return parsePath;
      }
    });
    function parsePath(path) {
      const hashIndex = path.indexOf("#");
      const queryIndex = path.indexOf("?");
      const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
      if (hasQuery || hashIndex > -1) {
        return {
          pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
          query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : void 0) : "",
          hash: hashIndex > -1 ? path.slice(hashIndex) : ""
        };
      }
      return {
        pathname: path,
        query: "",
        hash: ""
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/normalize-trailing-slash.js
var require_normalize_trailing_slash = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/normalize-trailing-slash.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "normalizePathTrailingSlash", {
      enumerable: true,
      get: function() {
        return normalizePathTrailingSlash;
      }
    });
    var _removetrailingslash = require_remove_trailing_slash();
    var _parsepath = require_parse_path();
    var normalizePathTrailingSlash = (path) => {
      if (path.charCodeAt(0) !== 47 || process.env.__NEXT_MANUAL_TRAILING_SLASH) {
        return path;
      }
      const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
      if (process.env.__NEXT_TRAILING_SLASH) {
        if (/\.[^/]+\/?$/.test(pathname)) {
          return `${(0, _removetrailingslash.removeTrailingSlash)(pathname)}${query}${hash}`;
        } else if (pathname.endsWith("/")) {
          return `${pathname}${query}${hash}`;
        } else {
          return `${pathname}/${query}${hash}`;
        }
      }
      return `${(0, _removetrailingslash.removeTrailingSlash)(pathname)}${query}${hash}`;
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/path-has-prefix.js
var require_path_has_prefix = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/path-has-prefix.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "pathHasPrefix", {
      enumerable: true,
      get: function() {
        return pathHasPrefix;
      }
    });
    var _parsepath = require_parse_path();
    function pathHasPrefix(path, prefix) {
      if (typeof path !== "string") {
        return false;
      }
      const { pathname } = (0, _parsepath.parsePath)(path);
      return pathname === prefix || pathname.startsWith(prefix + "/");
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/has-base-path.js
var require_has_base_path = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/has-base-path.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "hasBasePath", {
      enumerable: true,
      get: function() {
        return hasBasePath;
      }
    });
    var _pathhasprefix = require_path_has_prefix();
    var basePath = process.env.__NEXT_ROUTER_BASEPATH || "";
    function hasBasePath(path) {
      return (0, _pathhasprefix.pathHasPrefix)(path, basePath);
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/is-local-url.js
var require_is_local_url = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/is-local-url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "isLocalURL", {
      enumerable: true,
      get: function() {
        return isLocalURL;
      }
    });
    var _utils = require_utils();
    var _hasbasepath = require_has_base_path();
    function isLocalURL(url) {
      if (!(0, _utils.isAbsoluteUrl)(url)) return true;
      try {
        const locationOrigin = (0, _utils.getLocationOrigin)();
        const resolved = new URL(url, locationOrigin);
        return resolved.origin === locationOrigin && (0, _hasbasepath.hasBasePath)(resolved.pathname);
      } catch (_) {
        return false;
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/sorted-routes.js
var require_sorted_routes = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/sorted-routes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getSortedRouteObjects: function() {
        return getSortedRouteObjects;
      },
      getSortedRoutes: function() {
        return getSortedRoutes;
      }
    });
    var UrlNode = class _UrlNode {
      insert(urlPath) {
        this._insert(urlPath.split("/").filter(Boolean), [], false);
      }
      smoosh() {
        return this._smoosh();
      }
      _smoosh(prefix = "/") {
        const childrenPaths = [
          ...this.children.keys()
        ].sort();
        if (this.slugName !== null) {
          childrenPaths.splice(childrenPaths.indexOf("[]"), 1);
        }
        if (this.restSlugName !== null) {
          childrenPaths.splice(childrenPaths.indexOf("[...]"), 1);
        }
        if (this.optionalRestSlugName !== null) {
          childrenPaths.splice(childrenPaths.indexOf("[[...]]"), 1);
        }
        const routes = childrenPaths.map((c) => this.children.get(c)._smoosh(`${prefix}${c}/`)).reduce((prev, curr) => [
          ...prev,
          ...curr
        ], []);
        if (this.slugName !== null) {
          routes.push(...this.children.get("[]")._smoosh(`${prefix}[${this.slugName}]/`));
        }
        if (!this.placeholder) {
          const r = prefix === "/" ? "/" : prefix.slice(0, -1);
          if (this.optionalRestSlugName != null) {
            throw Object.defineProperty(new Error(`You cannot define a route with the same specificity as a optional catch-all route ("${r}" and "${r}[[...${this.optionalRestSlugName}]]").`), "__NEXT_ERROR_CODE", {
              value: "E458",
              enumerable: false,
              configurable: true
            });
          }
          routes.unshift(r);
        }
        if (this.restSlugName !== null) {
          routes.push(...this.children.get("[...]")._smoosh(`${prefix}[...${this.restSlugName}]/`));
        }
        if (this.optionalRestSlugName !== null) {
          routes.push(...this.children.get("[[...]]")._smoosh(`${prefix}[[...${this.optionalRestSlugName}]]/`));
        }
        return routes;
      }
      _insert(urlPaths, slugNames, isCatchAll) {
        if (urlPaths.length === 0) {
          this.placeholder = false;
          return;
        }
        if (isCatchAll) {
          throw Object.defineProperty(new Error(`Catch-all must be the last part of the URL.`), "__NEXT_ERROR_CODE", {
            value: "E392",
            enumerable: false,
            configurable: true
          });
        }
        let nextSegment = urlPaths[0];
        if (nextSegment.startsWith("[") && nextSegment.endsWith("]")) {
          let handleSlug = function(previousSlug, nextSlug) {
            if (previousSlug !== null) {
              if (previousSlug !== nextSlug) {
                throw Object.defineProperty(new Error(`You cannot use different slug names for the same dynamic path ('${previousSlug}' !== '${nextSlug}').`), "__NEXT_ERROR_CODE", {
                  value: "E337",
                  enumerable: false,
                  configurable: true
                });
              }
            }
            slugNames.forEach((slug) => {
              if (slug === nextSlug) {
                throw Object.defineProperty(new Error(`You cannot have the same slug name "${nextSlug}" repeat within a single dynamic path`), "__NEXT_ERROR_CODE", {
                  value: "E247",
                  enumerable: false,
                  configurable: true
                });
              }
              if (slug.replace(/\W/g, "") === nextSegment.replace(/\W/g, "")) {
                throw Object.defineProperty(new Error(`You cannot have the slug names "${slug}" and "${nextSlug}" differ only by non-word symbols within a single dynamic path`), "__NEXT_ERROR_CODE", {
                  value: "E499",
                  enumerable: false,
                  configurable: true
                });
              }
            });
            slugNames.push(nextSlug);
          };
          let segmentName = nextSegment.slice(1, -1);
          let isOptional = false;
          if (segmentName.startsWith("[") && segmentName.endsWith("]")) {
            segmentName = segmentName.slice(1, -1);
            isOptional = true;
          }
          if (segmentName.startsWith("\u2026")) {
            throw Object.defineProperty(new Error(`Detected a three-dot character ('\u2026') at ('${segmentName}'). Did you mean ('...')?`), "__NEXT_ERROR_CODE", {
              value: "E147",
              enumerable: false,
              configurable: true
            });
          }
          if (segmentName.startsWith("...")) {
            segmentName = segmentName.substring(3);
            isCatchAll = true;
          }
          if (segmentName.startsWith("[") || segmentName.endsWith("]")) {
            throw Object.defineProperty(new Error(`Segment names may not start or end with extra brackets ('${segmentName}').`), "__NEXT_ERROR_CODE", {
              value: "E421",
              enumerable: false,
              configurable: true
            });
          }
          if (segmentName.startsWith(".")) {
            throw Object.defineProperty(new Error(`Segment names may not start with erroneous periods ('${segmentName}').`), "__NEXT_ERROR_CODE", {
              value: "E288",
              enumerable: false,
              configurable: true
            });
          }
          if (isCatchAll) {
            if (isOptional) {
              if (this.restSlugName != null) {
                throw Object.defineProperty(new Error(`You cannot use both an required and optional catch-all route at the same level ("[...${this.restSlugName}]" and "${urlPaths[0]}" ).`), "__NEXT_ERROR_CODE", {
                  value: "E299",
                  enumerable: false,
                  configurable: true
                });
              }
              handleSlug(this.optionalRestSlugName, segmentName);
              this.optionalRestSlugName = segmentName;
              nextSegment = "[[...]]";
            } else {
              if (this.optionalRestSlugName != null) {
                throw Object.defineProperty(new Error(`You cannot use both an optional and required catch-all route at the same level ("[[...${this.optionalRestSlugName}]]" and "${urlPaths[0]}").`), "__NEXT_ERROR_CODE", {
                  value: "E300",
                  enumerable: false,
                  configurable: true
                });
              }
              handleSlug(this.restSlugName, segmentName);
              this.restSlugName = segmentName;
              nextSegment = "[...]";
            }
          } else {
            if (isOptional) {
              throw Object.defineProperty(new Error(`Optional route parameters are not yet supported ("${urlPaths[0]}").`), "__NEXT_ERROR_CODE", {
                value: "E435",
                enumerable: false,
                configurable: true
              });
            }
            handleSlug(this.slugName, segmentName);
            this.slugName = segmentName;
            nextSegment = "[]";
          }
        }
        if (!this.children.has(nextSegment)) {
          this.children.set(nextSegment, new _UrlNode());
        }
        this.children.get(nextSegment)._insert(urlPaths.slice(1), slugNames, isCatchAll);
      }
      constructor() {
        this.placeholder = true;
        this.children = /* @__PURE__ */ new Map();
        this.slugName = null;
        this.restSlugName = null;
        this.optionalRestSlugName = null;
      }
    };
    function getSortedRoutes(normalizedPages) {
      const root = new UrlNode();
      normalizedPages.forEach((pagePath) => root.insert(pagePath));
      return root.smoosh();
    }
    function getSortedRouteObjects(objects, getter) {
      const indexes = {};
      const pathnames = [];
      for (let i = 0; i < objects.length; i++) {
        const pathname = getter(objects[i]);
        indexes[pathname] = i;
        pathnames[i] = pathname;
      }
      const sorted = getSortedRoutes(pathnames);
      return sorted.map((pathname) => objects[indexes[pathname]]);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/page-path/ensure-leading-slash.js
var require_ensure_leading_slash = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/page-path/ensure-leading-slash.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ensureLeadingSlash", {
      enumerable: true,
      get: function() {
        return ensureLeadingSlash;
      }
    });
    function ensureLeadingSlash(path) {
      return path.startsWith("/") ? path : `/${path}`;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/segment.js
var require_segment = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/segment.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      DEFAULT_SEGMENT_KEY: function() {
        return DEFAULT_SEGMENT_KEY;
      },
      NOT_FOUND_SEGMENT_KEY: function() {
        return NOT_FOUND_SEGMENT_KEY;
      },
      PAGE_SEGMENT_KEY: function() {
        return PAGE_SEGMENT_KEY;
      },
      addSearchParamsIfPageSegment: function() {
        return addSearchParamsIfPageSegment;
      },
      computeSelectedLayoutSegment: function() {
        return computeSelectedLayoutSegment;
      },
      getSegmentValue: function() {
        return getSegmentValue;
      },
      getSelectedLayoutSegmentPath: function() {
        return getSelectedLayoutSegmentPath;
      },
      isGroupSegment: function() {
        return isGroupSegment;
      },
      isParallelRouteSegment: function() {
        return isParallelRouteSegment;
      }
    });
    function getSegmentValue(segment) {
      return Array.isArray(segment) ? segment[1] : segment;
    }
    function isGroupSegment(segment) {
      return segment[0] === "(" && segment.endsWith(")");
    }
    function isParallelRouteSegment(segment) {
      return segment.startsWith("@") && segment !== "@children";
    }
    function addSearchParamsIfPageSegment(segment, searchParams) {
      const isPageSegment = segment.includes(PAGE_SEGMENT_KEY);
      if (isPageSegment) {
        const stringifiedQuery = JSON.stringify(searchParams);
        return stringifiedQuery !== "{}" ? PAGE_SEGMENT_KEY + "?" + stringifiedQuery : PAGE_SEGMENT_KEY;
      }
      return segment;
    }
    function computeSelectedLayoutSegment(segments, parallelRouteKey) {
      if (!segments || segments.length === 0) {
        return null;
      }
      const rawSegment = parallelRouteKey === "children" ? segments[0] : segments[segments.length - 1];
      return rawSegment === DEFAULT_SEGMENT_KEY ? null : rawSegment;
    }
    function getSelectedLayoutSegmentPath(tree, parallelRouteKey, first = true, segmentPath = []) {
      let node;
      if (first) {
        node = tree[1][parallelRouteKey];
      } else {
        const parallelRoutes = tree[1];
        node = parallelRoutes.children ?? Object.values(parallelRoutes)[0];
      }
      if (!node) return segmentPath;
      const segment = node[0];
      let segmentValue = getSegmentValue(segment);
      if (!segmentValue || segmentValue.startsWith(PAGE_SEGMENT_KEY)) {
        return segmentPath;
      }
      segmentPath.push(segmentValue);
      return getSelectedLayoutSegmentPath(node, parallelRouteKey, false, segmentPath);
    }
    var PAGE_SEGMENT_KEY = "__PAGE__";
    var DEFAULT_SEGMENT_KEY = "__DEFAULT__";
    var NOT_FOUND_SEGMENT_KEY = "/_not-found";
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/app-paths.js
var require_app_paths = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/app-paths.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      compareAppPaths: function() {
        return compareAppPaths;
      },
      normalizeAppPath: function() {
        return normalizeAppPath;
      },
      normalizeRscURL: function() {
        return normalizeRscURL;
      }
    });
    var _ensureleadingslash = require_ensure_leading_slash();
    var _segment = require_segment();
    function normalizeAppPath(route) {
      return (0, _ensureleadingslash.ensureLeadingSlash)(route.split("/").reduce((pathname, segment, index, segments) => {
        if (!segment) {
          return pathname;
        }
        if ((0, _segment.isGroupSegment)(segment)) {
          return pathname;
        }
        if (segment[0] === "@") {
          return pathname;
        }
        if ((segment === "page" || segment === "route") && index === segments.length - 1) {
          return pathname;
        }
        return `${pathname}/${segment}`;
      }, ""));
    }
    function compareAppPaths(a, b) {
      const aHasSlot = a.includes("/@");
      const bHasSlot = b.includes("/@");
      if (aHasSlot && !bHasSlot) return -1;
      if (!aHasSlot && bHasSlot) return 1;
      return a.localeCompare(b);
    }
    function normalizeRscURL(url) {
      return url.replace(
        /\.rsc($|\?)/,
        // $1 ensures `?` is preserved
        "$1"
      );
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interception-routes.js
var require_interception_routes = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interception-routes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      INTERCEPTION_ROUTE_MARKERS: function() {
        return INTERCEPTION_ROUTE_MARKERS;
      },
      extractInterceptionRouteInformation: function() {
        return extractInterceptionRouteInformation;
      },
      isInterceptionRouteAppPath: function() {
        return isInterceptionRouteAppPath;
      }
    });
    var _apppaths = require_app_paths();
    var INTERCEPTION_ROUTE_MARKERS = [
      "(..)(..)",
      "(.)",
      "(..)",
      "(...)"
    ];
    function isInterceptionRouteAppPath(path) {
      return path.split("/").find((segment) => INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m))) !== void 0;
    }
    function extractInterceptionRouteInformation(path) {
      let interceptingRoute;
      let marker;
      let interceptedRoute;
      for (const segment of path.split("/")) {
        marker = INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m));
        if (marker) {
          ;
          [interceptingRoute, interceptedRoute] = path.split(marker, 2);
          break;
        }
      }
      if (!interceptingRoute || !marker || !interceptedRoute) {
        throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Must be in the format /<intercepting route>/(..|...|..)(..)/<intercepted route>`), "__NEXT_ERROR_CODE", {
          value: "E269",
          enumerable: false,
          configurable: true
        });
      }
      interceptingRoute = (0, _apppaths.normalizeAppPath)(interceptingRoute);
      switch (marker) {
        case "(.)":
          if (interceptingRoute === "/") {
            interceptedRoute = `/${interceptedRoute}`;
          } else {
            interceptedRoute = interceptingRoute + "/" + interceptedRoute;
          }
          break;
        case "(..)":
          if (interceptingRoute === "/") {
            throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..) marker at the root level, use (.) instead.`), "__NEXT_ERROR_CODE", {
              value: "E207",
              enumerable: false,
              configurable: true
            });
          }
          interceptedRoute = interceptingRoute.split("/").slice(0, -1).concat(interceptedRoute).join("/");
          break;
        case "(...)":
          interceptedRoute = "/" + interceptedRoute;
          break;
        case "(..)(..)":
          const splitInterceptingRoute = interceptingRoute.split("/");
          if (splitInterceptingRoute.length <= 2) {
            throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..)(..) marker at the root level or one level up.`), "__NEXT_ERROR_CODE", {
              value: "E486",
              enumerable: false,
              configurable: true
            });
          }
          interceptedRoute = splitInterceptingRoute.slice(0, -2).concat(interceptedRoute).join("/");
          break;
        default:
          throw Object.defineProperty(new Error("Invariant: unexpected marker"), "__NEXT_ERROR_CODE", {
            value: "E112",
            enumerable: false,
            configurable: true
          });
      }
      return {
        interceptingRoute,
        interceptedRoute
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/is-dynamic.js
var require_is_dynamic = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/is-dynamic.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "isDynamicRoute", {
      enumerable: true,
      get: function() {
        return isDynamicRoute;
      }
    });
    var _interceptionroutes = require_interception_routes();
    var TEST_ROUTE = /\/[^/]*\[[^/]+\][^/]*(?=\/|$)/;
    var TEST_STRICT_ROUTE = /\/\[[^/]+\](?=\/|$)/;
    function isDynamicRoute(route, strict = true) {
      if ((0, _interceptionroutes.isInterceptionRouteAppPath)(route)) {
        route = (0, _interceptionroutes.extractInterceptionRouteInformation)(route).interceptedRoute;
      }
      if (strict) {
        return TEST_STRICT_ROUTE.test(route);
      }
      return TEST_ROUTE.test(route);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/index.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getSortedRouteObjects: function() {
        return _sortedroutes.getSortedRouteObjects;
      },
      getSortedRoutes: function() {
        return _sortedroutes.getSortedRoutes;
      },
      isDynamicRoute: function() {
        return _isdynamic.isDynamicRoute;
      }
    });
    var _sortedroutes = require_sorted_routes();
    var _isdynamic = require_is_dynamic();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/path-to-regexp/index.js
var require_path_to_regexp = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/path-to-regexp/index.js"(exports, module) {
    "use strict";
    (() => {
      "use strict";
      if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
      var e = {};
      (() => {
        var n = e;
        Object.defineProperty(n, "__esModule", { value: true });
        n.pathToRegexp = n.tokensToRegexp = n.regexpToFunction = n.match = n.tokensToFunction = n.compile = n.parse = void 0;
        function lexer(e2) {
          var n2 = [];
          var r = 0;
          while (r < e2.length) {
            var t = e2[r];
            if (t === "*" || t === "+" || t === "?") {
              n2.push({ type: "MODIFIER", index: r, value: e2[r++] });
              continue;
            }
            if (t === "\\") {
              n2.push({ type: "ESCAPED_CHAR", index: r++, value: e2[r++] });
              continue;
            }
            if (t === "{") {
              n2.push({ type: "OPEN", index: r, value: e2[r++] });
              continue;
            }
            if (t === "}") {
              n2.push({ type: "CLOSE", index: r, value: e2[r++] });
              continue;
            }
            if (t === ":") {
              var a = "";
              var i = r + 1;
              while (i < e2.length) {
                var o = e2.charCodeAt(i);
                if (o >= 48 && o <= 57 || o >= 65 && o <= 90 || o >= 97 && o <= 122 || o === 95) {
                  a += e2[i++];
                  continue;
                }
                break;
              }
              if (!a) throw new TypeError("Missing parameter name at ".concat(r));
              n2.push({ type: "NAME", index: r, value: a });
              r = i;
              continue;
            }
            if (t === "(") {
              var c = 1;
              var f = "";
              var i = r + 1;
              if (e2[i] === "?") {
                throw new TypeError('Pattern cannot start with "?" at '.concat(i));
              }
              while (i < e2.length) {
                if (e2[i] === "\\") {
                  f += e2[i++] + e2[i++];
                  continue;
                }
                if (e2[i] === ")") {
                  c--;
                  if (c === 0) {
                    i++;
                    break;
                  }
                } else if (e2[i] === "(") {
                  c++;
                  if (e2[i + 1] !== "?") {
                    throw new TypeError("Capturing groups are not allowed at ".concat(i));
                  }
                }
                f += e2[i++];
              }
              if (c) throw new TypeError("Unbalanced pattern at ".concat(r));
              if (!f) throw new TypeError("Missing pattern at ".concat(r));
              n2.push({ type: "PATTERN", index: r, value: f });
              r = i;
              continue;
            }
            n2.push({ type: "CHAR", index: r, value: e2[r++] });
          }
          n2.push({ type: "END", index: r, value: "" });
          return n2;
        }
        function parse(e2, n2) {
          if (n2 === void 0) {
            n2 = {};
          }
          var r = lexer(e2);
          var t = n2.prefixes, a = t === void 0 ? "./" : t, i = n2.delimiter, o = i === void 0 ? "/#?" : i;
          var c = [];
          var f = 0;
          var u = 0;
          var p = "";
          var tryConsume = function(e3) {
            if (u < r.length && r[u].type === e3) return r[u++].value;
          };
          var mustConsume = function(e3) {
            var n3 = tryConsume(e3);
            if (n3 !== void 0) return n3;
            var t2 = r[u], a2 = t2.type, i2 = t2.index;
            throw new TypeError("Unexpected ".concat(a2, " at ").concat(i2, ", expected ").concat(e3));
          };
          var consumeText = function() {
            var e3 = "";
            var n3;
            while (n3 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
              e3 += n3;
            }
            return e3;
          };
          var isSafe = function(e3) {
            for (var n3 = 0, r2 = o; n3 < r2.length; n3++) {
              var t2 = r2[n3];
              if (e3.indexOf(t2) > -1) return true;
            }
            return false;
          };
          var safePattern = function(e3) {
            var n3 = c[c.length - 1];
            var r2 = e3 || (n3 && typeof n3 === "string" ? n3 : "");
            if (n3 && !r2) {
              throw new TypeError('Must have text between two parameters, missing text after "'.concat(n3.name, '"'));
            }
            if (!r2 || isSafe(r2)) return "[^".concat(escapeString(o), "]+?");
            return "(?:(?!".concat(escapeString(r2), ")[^").concat(escapeString(o), "])+?");
          };
          while (u < r.length) {
            var v = tryConsume("CHAR");
            var s = tryConsume("NAME");
            var d = tryConsume("PATTERN");
            if (s || d) {
              var g = v || "";
              if (a.indexOf(g) === -1) {
                p += g;
                g = "";
              }
              if (p) {
                c.push(p);
                p = "";
              }
              c.push({ name: s || f++, prefix: g, suffix: "", pattern: d || safePattern(g), modifier: tryConsume("MODIFIER") || "" });
              continue;
            }
            var x = v || tryConsume("ESCAPED_CHAR");
            if (x) {
              p += x;
              continue;
            }
            if (p) {
              c.push(p);
              p = "";
            }
            var h = tryConsume("OPEN");
            if (h) {
              var g = consumeText();
              var l = tryConsume("NAME") || "";
              var m = tryConsume("PATTERN") || "";
              var T = consumeText();
              mustConsume("CLOSE");
              c.push({ name: l || (m ? f++ : ""), pattern: l && !m ? safePattern(g) : m, prefix: g, suffix: T, modifier: tryConsume("MODIFIER") || "" });
              continue;
            }
            mustConsume("END");
          }
          return c;
        }
        n.parse = parse;
        function compile(e2, n2) {
          return tokensToFunction(parse(e2, n2), n2);
        }
        n.compile = compile;
        function tokensToFunction(e2, n2) {
          if (n2 === void 0) {
            n2 = {};
          }
          var r = flags(n2);
          var t = n2.encode, a = t === void 0 ? function(e3) {
            return e3;
          } : t, i = n2.validate, o = i === void 0 ? true : i;
          var c = e2.map((function(e3) {
            if (typeof e3 === "object") {
              return new RegExp("^(?:".concat(e3.pattern, ")$"), r);
            }
          }));
          return function(n3) {
            var r2 = "";
            for (var t2 = 0; t2 < e2.length; t2++) {
              var i2 = e2[t2];
              if (typeof i2 === "string") {
                r2 += i2;
                continue;
              }
              var f = n3 ? n3[i2.name] : void 0;
              var u = i2.modifier === "?" || i2.modifier === "*";
              var p = i2.modifier === "*" || i2.modifier === "+";
              if (Array.isArray(f)) {
                if (!p) {
                  throw new TypeError('Expected "'.concat(i2.name, '" to not repeat, but got an array'));
                }
                if (f.length === 0) {
                  if (u) continue;
                  throw new TypeError('Expected "'.concat(i2.name, '" to not be empty'));
                }
                for (var v = 0; v < f.length; v++) {
                  var s = a(f[v], i2);
                  if (o && !c[t2].test(s)) {
                    throw new TypeError('Expected all "'.concat(i2.name, '" to match "').concat(i2.pattern, '", but got "').concat(s, '"'));
                  }
                  r2 += i2.prefix + s + i2.suffix;
                }
                continue;
              }
              if (typeof f === "string" || typeof f === "number") {
                var s = a(String(f), i2);
                if (o && !c[t2].test(s)) {
                  throw new TypeError('Expected "'.concat(i2.name, '" to match "').concat(i2.pattern, '", but got "').concat(s, '"'));
                }
                r2 += i2.prefix + s + i2.suffix;
                continue;
              }
              if (u) continue;
              var d = p ? "an array" : "a string";
              throw new TypeError('Expected "'.concat(i2.name, '" to be ').concat(d));
            }
            return r2;
          };
        }
        n.tokensToFunction = tokensToFunction;
        function match(e2, n2) {
          var r = [];
          var t = pathToRegexp(e2, r, n2);
          return regexpToFunction(t, r, n2);
        }
        n.match = match;
        function regexpToFunction(e2, n2, r) {
          if (r === void 0) {
            r = {};
          }
          var t = r.decode, a = t === void 0 ? function(e3) {
            return e3;
          } : t;
          return function(r2) {
            var t2 = e2.exec(r2);
            if (!t2) return false;
            var i = t2[0], o = t2.index;
            var c = /* @__PURE__ */ Object.create(null);
            var _loop_1 = function(e3) {
              if (t2[e3] === void 0) return "continue";
              var r3 = n2[e3 - 1];
              if (r3.modifier === "*" || r3.modifier === "+") {
                c[r3.name] = t2[e3].split(r3.prefix + r3.suffix).map((function(e4) {
                  return a(e4, r3);
                }));
              } else {
                c[r3.name] = a(t2[e3], r3);
              }
            };
            for (var f = 1; f < t2.length; f++) {
              _loop_1(f);
            }
            return { path: i, index: o, params: c };
          };
        }
        n.regexpToFunction = regexpToFunction;
        function escapeString(e2) {
          return e2.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
        }
        function flags(e2) {
          return e2 && e2.sensitive ? "" : "i";
        }
        function regexpToRegexp(e2, n2) {
          if (!n2) return e2;
          var r = /\((?:\?<(.*?)>)?(?!\?)/g;
          var t = 0;
          var a = r.exec(e2.source);
          while (a) {
            n2.push({ name: a[1] || t++, prefix: "", suffix: "", modifier: "", pattern: "" });
            a = r.exec(e2.source);
          }
          return e2;
        }
        function arrayToRegexp(e2, n2, r) {
          var t = e2.map((function(e3) {
            return pathToRegexp(e3, n2, r).source;
          }));
          return new RegExp("(?:".concat(t.join("|"), ")"), flags(r));
        }
        function stringToRegexp(e2, n2, r) {
          return tokensToRegexp(parse(e2, r), n2, r);
        }
        function tokensToRegexp(e2, n2, r) {
          if (r === void 0) {
            r = {};
          }
          var t = r.strict, a = t === void 0 ? false : t, i = r.start, o = i === void 0 ? true : i, c = r.end, f = c === void 0 ? true : c, u = r.encode, p = u === void 0 ? function(e3) {
            return e3;
          } : u, v = r.delimiter, s = v === void 0 ? "/#?" : v, d = r.endsWith, g = d === void 0 ? "" : d;
          var x = "[".concat(escapeString(g), "]|$");
          var h = "[".concat(escapeString(s), "]");
          var l = o ? "^" : "";
          for (var m = 0, T = e2; m < T.length; m++) {
            var E = T[m];
            if (typeof E === "string") {
              l += escapeString(p(E));
            } else {
              var w = escapeString(p(E.prefix));
              var y = escapeString(p(E.suffix));
              if (E.pattern) {
                if (n2) n2.push(E);
                if (w || y) {
                  if (E.modifier === "+" || E.modifier === "*") {
                    var R = E.modifier === "*" ? "?" : "";
                    l += "(?:".concat(w, "((?:").concat(E.pattern, ")(?:").concat(y).concat(w, "(?:").concat(E.pattern, "))*)").concat(y, ")").concat(R);
                  } else {
                    l += "(?:".concat(w, "(").concat(E.pattern, ")").concat(y, ")").concat(E.modifier);
                  }
                } else {
                  if (E.modifier === "+" || E.modifier === "*") {
                    throw new TypeError('Can not repeat "'.concat(E.name, '" without a prefix and suffix'));
                  }
                  l += "(".concat(E.pattern, ")").concat(E.modifier);
                }
              } else {
                l += "(?:".concat(w).concat(y, ")").concat(E.modifier);
              }
            }
          }
          if (f) {
            if (!a) l += "".concat(h, "?");
            l += !r.endsWith ? "$" : "(?=".concat(x, ")");
          } else {
            var A = e2[e2.length - 1];
            var _ = typeof A === "string" ? h.indexOf(A[A.length - 1]) > -1 : A === void 0;
            if (!a) {
              l += "(?:".concat(h, "(?=").concat(x, "))?");
            }
            if (!_) {
              l += "(?=".concat(h, "|").concat(x, ")");
            }
          }
          return new RegExp(l, flags(r));
        }
        n.tokensToRegexp = tokensToRegexp;
        function pathToRegexp(e2, n2, r) {
          if (e2 instanceof RegExp) return regexpToRegexp(e2, n2);
          if (Array.isArray(e2)) return arrayToRegexp(e2, n2, r);
          return stringToRegexp(e2, n2, r);
        }
        n.pathToRegexp = pathToRegexp;
      })();
      module.exports = e;
    })();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/route-pattern-normalizer.js
var require_route_pattern_normalizer = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/route-pattern-normalizer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      PARAM_SEPARATOR: function() {
        return PARAM_SEPARATOR;
      },
      hasAdjacentParameterIssues: function() {
        return hasAdjacentParameterIssues;
      },
      normalizeAdjacentParameters: function() {
        return normalizeAdjacentParameters;
      },
      normalizeTokensForRegexp: function() {
        return normalizeTokensForRegexp;
      },
      stripNormalizedSeparators: function() {
        return stripNormalizedSeparators;
      },
      stripParameterSeparators: function() {
        return stripParameterSeparators;
      }
    });
    var PARAM_SEPARATOR = "_NEXTSEP_";
    function hasAdjacentParameterIssues(route) {
      if (typeof route !== "string") return false;
      if (/\/\(\.{1,3}\):[^/\s]+/.test(route)) {
        return true;
      }
      if (/:[a-zA-Z_][a-zA-Z0-9_]*:[a-zA-Z_][a-zA-Z0-9_]*/.test(route)) {
        return true;
      }
      return false;
    }
    function normalizeAdjacentParameters(route) {
      let normalized = route;
      normalized = normalized.replace(/(\([^)]*\)):([^/\s]+)/g, `$1${PARAM_SEPARATOR}:$2`);
      normalized = normalized.replace(/:([^:/\s)]+)(?=:)/g, `:$1${PARAM_SEPARATOR}`);
      return normalized;
    }
    function normalizeTokensForRegexp(tokens) {
      return tokens.map((token) => {
        if (typeof token === "object" && token !== null && // Not all token objects have 'modifier' property (e.g., simple text tokens)
        "modifier" in token && // Only repeating modifiers (* or +) cause the validation error
        // Other modifiers like '?' (optional) are fine
        (token.modifier === "*" || token.modifier === "+") && // Token objects can have different shapes depending on route pattern
        "prefix" in token && "suffix" in token && // Both prefix and suffix must be empty strings
        // This is what causes the validation error in path-to-regexp
        token.prefix === "" && token.suffix === "") {
          return {
            ...token,
            prefix: "/"
          };
        }
        return token;
      });
    }
    function stripNormalizedSeparators(pathname) {
      return pathname.replace(new RegExp(`\\)${PARAM_SEPARATOR}`, "g"), ")");
    }
    function stripParameterSeparators(params) {
      const cleaned = {};
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string") {
          cleaned[key] = value.replace(new RegExp(`^${PARAM_SEPARATOR}`), "");
        } else if (Array.isArray(value)) {
          cleaned[key] = value.map((item) => typeof item === "string" ? item.replace(new RegExp(`^${PARAM_SEPARATOR}`), "") : item);
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-match-utils.js
var require_route_match_utils = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-match-utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      safeCompile: function() {
        return safeCompile;
      },
      safePathToRegexp: function() {
        return safePathToRegexp;
      },
      safeRegexpToFunction: function() {
        return safeRegexpToFunction;
      },
      safeRouteMatcher: function() {
        return safeRouteMatcher;
      }
    });
    var _pathtoregexp = require_path_to_regexp();
    var _routepatternnormalizer = require_route_pattern_normalizer();
    function safePathToRegexp(route, keys, options) {
      if (typeof route !== "string") {
        return (0, _pathtoregexp.pathToRegexp)(route, keys, options);
      }
      const needsNormalization = (0, _routepatternnormalizer.hasAdjacentParameterIssues)(route);
      const routeToUse = needsNormalization ? (0, _routepatternnormalizer.normalizeAdjacentParameters)(route) : route;
      try {
        return (0, _pathtoregexp.pathToRegexp)(routeToUse, keys, options);
      } catch (error) {
        if (!needsNormalization) {
          try {
            const normalizedRoute = (0, _routepatternnormalizer.normalizeAdjacentParameters)(route);
            return (0, _pathtoregexp.pathToRegexp)(normalizedRoute, keys, options);
          } catch (retryError) {
            throw error;
          }
        }
        throw error;
      }
    }
    function safeCompile(route, options) {
      const needsNormalization = (0, _routepatternnormalizer.hasAdjacentParameterIssues)(route);
      const routeToUse = needsNormalization ? (0, _routepatternnormalizer.normalizeAdjacentParameters)(route) : route;
      try {
        const compiler = (0, _pathtoregexp.compile)(routeToUse, options);
        if (needsNormalization) {
          return (params) => {
            return (0, _routepatternnormalizer.stripNormalizedSeparators)(compiler(params));
          };
        }
        return compiler;
      } catch (error) {
        if (!needsNormalization) {
          try {
            const normalizedRoute = (0, _routepatternnormalizer.normalizeAdjacentParameters)(route);
            const compiler = (0, _pathtoregexp.compile)(normalizedRoute, options);
            return (params) => {
              return (0, _routepatternnormalizer.stripNormalizedSeparators)(compiler(params));
            };
          } catch (retryError) {
            throw error;
          }
        }
        throw error;
      }
    }
    function safeRegexpToFunction(regexp, keys) {
      const originalMatcher = (0, _pathtoregexp.regexpToFunction)(regexp, keys || []);
      return (pathname) => {
        const result = originalMatcher(pathname);
        if (!result) return false;
        return {
          ...result,
          params: (0, _routepatternnormalizer.stripParameterSeparators)(result.params)
        };
      };
    }
    function safeRouteMatcher(matcherFn) {
      return (pathname) => {
        const result = matcherFn(pathname);
        if (!result) return false;
        return (0, _routepatternnormalizer.stripParameterSeparators)(result);
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-matcher.js
var require_route_matcher = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-matcher.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "getRouteMatcher", {
      enumerable: true,
      get: function() {
        return getRouteMatcher;
      }
    });
    var _utils = require_utils();
    var _routematchutils = require_route_match_utils();
    function getRouteMatcher({ re, groups }) {
      const rawMatcher = (pathname) => {
        const routeMatch = re.exec(pathname);
        if (!routeMatch) return false;
        const decode = (param) => {
          try {
            return decodeURIComponent(param);
          } catch {
            throw Object.defineProperty(new _utils.DecodeError("failed to decode param"), "__NEXT_ERROR_CODE", {
              value: "E528",
              enumerable: false,
              configurable: true
            });
          }
        };
        const params = {};
        for (const [key, group] of Object.entries(groups)) {
          const match = routeMatch[group.pos];
          if (match !== void 0) {
            if (group.repeat) {
              params[key] = match.split("/").map((entry) => decode(entry));
            } else {
              params[key] = decode(match);
            }
          }
        }
        return params;
      };
      return (0, _routematchutils.safeRouteMatcher)(rawMatcher);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      ACTION_SUFFIX: function() {
        return ACTION_SUFFIX;
      },
      APP_DIR_ALIAS: function() {
        return APP_DIR_ALIAS;
      },
      CACHE_ONE_YEAR_SECONDS: function() {
        return CACHE_ONE_YEAR_SECONDS;
      },
      DOT_NEXT_ALIAS: function() {
        return DOT_NEXT_ALIAS;
      },
      ESLINT_DEFAULT_DIRS: function() {
        return ESLINT_DEFAULT_DIRS;
      },
      GSP_NO_RETURNED_VALUE: function() {
        return GSP_NO_RETURNED_VALUE;
      },
      GSSP_COMPONENT_MEMBER_ERROR: function() {
        return GSSP_COMPONENT_MEMBER_ERROR;
      },
      GSSP_NO_RETURNED_VALUE: function() {
        return GSSP_NO_RETURNED_VALUE;
      },
      HTML_CONTENT_TYPE_HEADER: function() {
        return HTML_CONTENT_TYPE_HEADER;
      },
      INFINITE_CACHE: function() {
        return INFINITE_CACHE;
      },
      INSTRUMENTATION_HOOK_FILENAME: function() {
        return INSTRUMENTATION_HOOK_FILENAME;
      },
      JSON_CONTENT_TYPE_HEADER: function() {
        return JSON_CONTENT_TYPE_HEADER;
      },
      MATCHED_PATH_HEADER: function() {
        return MATCHED_PATH_HEADER;
      },
      MIDDLEWARE_FILENAME: function() {
        return MIDDLEWARE_FILENAME;
      },
      MIDDLEWARE_LOCATION_REGEXP: function() {
        return MIDDLEWARE_LOCATION_REGEXP;
      },
      NEXT_BODY_SUFFIX: function() {
        return NEXT_BODY_SUFFIX;
      },
      NEXT_CACHE_IMPLICIT_TAG_ID: function() {
        return NEXT_CACHE_IMPLICIT_TAG_ID;
      },
      NEXT_CACHE_REVALIDATED_TAGS_HEADER: function() {
        return NEXT_CACHE_REVALIDATED_TAGS_HEADER;
      },
      NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: function() {
        return NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER;
      },
      NEXT_CACHE_ROOT_PARAM_TAG_ID: function() {
        return NEXT_CACHE_ROOT_PARAM_TAG_ID;
      },
      NEXT_CACHE_SOFT_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_SOFT_TAG_MAX_LENGTH;
      },
      NEXT_CACHE_TAGS_HEADER: function() {
        return NEXT_CACHE_TAGS_HEADER;
      },
      NEXT_CACHE_TAG_MAX_ITEMS: function() {
        return NEXT_CACHE_TAG_MAX_ITEMS;
      },
      NEXT_CACHE_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_TAG_MAX_LENGTH;
      },
      NEXT_DATA_SUFFIX: function() {
        return NEXT_DATA_SUFFIX;
      },
      NEXT_INTERCEPTION_MARKER_PREFIX: function() {
        return NEXT_INTERCEPTION_MARKER_PREFIX;
      },
      NEXT_META_SUFFIX: function() {
        return NEXT_META_SUFFIX;
      },
      NEXT_NAV_DEPLOYMENT_ID_HEADER: function() {
        return NEXT_NAV_DEPLOYMENT_ID_HEADER;
      },
      NEXT_QUERY_PARAM_PREFIX: function() {
        return NEXT_QUERY_PARAM_PREFIX;
      },
      NEXT_RESUME_HEADER: function() {
        return NEXT_RESUME_HEADER;
      },
      NEXT_RESUME_STATE_LENGTH_HEADER: function() {
        return NEXT_RESUME_STATE_LENGTH_HEADER;
      },
      NON_STANDARD_NODE_ENV: function() {
        return NON_STANDARD_NODE_ENV;
      },
      PAGES_DIR_ALIAS: function() {
        return PAGES_DIR_ALIAS;
      },
      PRERENDER_REVALIDATE_HEADER: function() {
        return PRERENDER_REVALIDATE_HEADER;
      },
      PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
        return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
      },
      PROXY_FILENAME: function() {
        return PROXY_FILENAME;
      },
      PROXY_LOCATION_REGEXP: function() {
        return PROXY_LOCATION_REGEXP;
      },
      PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
        return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
      },
      ROOT_DIR_ALIAS: function() {
        return ROOT_DIR_ALIAS;
      },
      RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
        return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
      },
      RSC_ACTION_ENCRYPTION_ALIAS: function() {
        return RSC_ACTION_ENCRYPTION_ALIAS;
      },
      RSC_ACTION_PROXY_ALIAS: function() {
        return RSC_ACTION_PROXY_ALIAS;
      },
      RSC_ACTION_VALIDATE_ALIAS: function() {
        return RSC_ACTION_VALIDATE_ALIAS;
      },
      RSC_CACHE_WRAPPER_ALIAS: function() {
        return RSC_CACHE_WRAPPER_ALIAS;
      },
      RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS: function() {
        return RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS;
      },
      RSC_MOD_REF_PROXY_ALIAS: function() {
        return RSC_MOD_REF_PROXY_ALIAS;
      },
      RSC_SEGMENTS_DIR_SUFFIX: function() {
        return RSC_SEGMENTS_DIR_SUFFIX;
      },
      RSC_SEGMENT_SUFFIX: function() {
        return RSC_SEGMENT_SUFFIX;
      },
      RSC_SUFFIX: function() {
        return RSC_SUFFIX;
      },
      SERVER_PROPS_EXPORT_ERROR: function() {
        return SERVER_PROPS_EXPORT_ERROR;
      },
      SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
        return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
      },
      SERVER_PROPS_SSG_CONFLICT: function() {
        return SERVER_PROPS_SSG_CONFLICT;
      },
      SERVER_RUNTIME: function() {
        return SERVER_RUNTIME;
      },
      SSG_FALLBACK_EXPORT_ERROR: function() {
        return SSG_FALLBACK_EXPORT_ERROR;
      },
      SSG_GET_INITIAL_PROPS_CONFLICT: function() {
        return SSG_GET_INITIAL_PROPS_CONFLICT;
      },
      STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
        return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
      },
      TEXT_PLAIN_CONTENT_TYPE_HEADER: function() {
        return TEXT_PLAIN_CONTENT_TYPE_HEADER;
      },
      UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
        return UNSTABLE_REVALIDATE_RENAME_ERROR;
      },
      WEBPACK_LAYERS: function() {
        return WEBPACK_LAYERS;
      },
      WEBPACK_RESOURCE_QUERIES: function() {
        return WEBPACK_RESOURCE_QUERIES;
      },
      WEB_SOCKET_MAX_RECONNECTIONS: function() {
        return WEB_SOCKET_MAX_RECONNECTIONS;
      }
    });
    var TEXT_PLAIN_CONTENT_TYPE_HEADER = "text/plain";
    var HTML_CONTENT_TYPE_HEADER = "text/html; charset=utf-8";
    var JSON_CONTENT_TYPE_HEADER = "application/json; charset=utf-8";
    var NEXT_QUERY_PARAM_PREFIX = "nxtP";
    var NEXT_INTERCEPTION_MARKER_PREFIX = "nxtI";
    var MATCHED_PATH_HEADER = "x-matched-path";
    var PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
    var PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
    var RSC_SEGMENTS_DIR_SUFFIX = ".segments";
    var RSC_SEGMENT_SUFFIX = ".segment.rsc";
    var RSC_SUFFIX = ".rsc";
    var ACTION_SUFFIX = ".action";
    var NEXT_DATA_SUFFIX = ".json";
    var NEXT_META_SUFFIX = ".meta";
    var NEXT_BODY_SUFFIX = ".body";
    var NEXT_NAV_DEPLOYMENT_ID_HEADER = "x-nextjs-deployment-id";
    var NEXT_CACHE_TAGS_HEADER = "x-next-cache-tags";
    var NEXT_CACHE_REVALIDATED_TAGS_HEADER = "x-next-revalidated-tags";
    var NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = "x-next-revalidate-tag-token";
    var NEXT_RESUME_HEADER = "next-resume";
    var NEXT_RESUME_STATE_LENGTH_HEADER = "x-next-resume-state-length";
    var NEXT_CACHE_TAG_MAX_ITEMS = 128;
    var NEXT_CACHE_TAG_MAX_LENGTH = 256;
    var NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
    var NEXT_CACHE_IMPLICIT_TAG_ID = "_N_T_";
    var NEXT_CACHE_ROOT_PARAM_TAG_ID = "_N_RP_";
    var CACHE_ONE_YEAR_SECONDS = 31536e3;
    var INFINITE_CACHE = 4294967294;
    var MIDDLEWARE_FILENAME = "middleware";
    var MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
    var PROXY_FILENAME = "proxy";
    var PROXY_LOCATION_REGEXP = `(?:src/)?${PROXY_FILENAME}`;
    var INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
    var PAGES_DIR_ALIAS = "private-next-pages";
    var DOT_NEXT_ALIAS = "private-dot-next";
    var ROOT_DIR_ALIAS = "private-next-root-dir";
    var APP_DIR_ALIAS = "private-next-app-dir";
    var RSC_MOD_REF_PROXY_ALIAS = "private-next-rsc-mod-ref-proxy";
    var RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
    var RSC_ACTION_PROXY_ALIAS = "private-next-rsc-server-reference";
    var RSC_CACHE_WRAPPER_ALIAS = "private-next-rsc-cache-wrapper";
    var RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS = "private-next-rsc-track-dynamic-import";
    var RSC_ACTION_ENCRYPTION_ALIAS = "private-next-rsc-action-encryption";
    var RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
    var PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
    var SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
    var SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
    var SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
    var STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
    var SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
    var GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
    var GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
    var UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\nPlease use `revalidate` instead.";
    var GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
    var NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
    var SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
    var ESLINT_DEFAULT_DIRS = [
      "app",
      "pages",
      "components",
      "lib",
      "src"
    ];
    var SERVER_RUNTIME = {
      edge: "edge",
      experimentalEdge: "experimental-edge",
      nodejs: "nodejs"
    };
    var WEB_SOCKET_MAX_RECONNECTIONS = 12;
    var WEBPACK_LAYERS_NAMES = {
      /**
      * The layer for the shared code between the client and server bundles.
      */
      shared: "shared",
      /**
      * The layer for server-only runtime and picking up `react-server` export conditions.
      * Including app router RSC pages and app router custom routes and metadata routes.
      */
      reactServerComponents: "rsc",
      /**
      * Server Side Rendering layer for app (ssr).
      */
      serverSideRendering: "ssr",
      /**
      * The browser client bundle layer for actions.
      */
      actionBrowser: "action-browser",
      /**
      * The Node.js bundle layer for the API routes.
      */
      apiNode: "api-node",
      /**
      * The Edge Lite bundle layer for the API routes.
      */
      apiEdge: "api-edge",
      /**
      * The layer for the middleware code.
      */
      middleware: "middleware",
      /**
      * The layer for the instrumentation hooks.
      */
      instrument: "instrument",
      /**
      * The layer for assets on the edge.
      */
      edgeAsset: "edge-asset",
      /**
      * The browser client bundle layer for App directory.
      */
      appPagesBrowser: "app-pages-browser",
      /**
      * The browser client bundle layer for Pages directory.
      */
      pagesDirBrowser: "pages-dir-browser",
      /**
      * The Edge Lite bundle layer for Pages directory.
      */
      pagesDirEdge: "pages-dir-edge",
      /**
      * The Node.js bundle layer for Pages directory.
      */
      pagesDirNode: "pages-dir-node"
    };
    var WEBPACK_LAYERS = {
      ...WEBPACK_LAYERS_NAMES,
      GROUP: {
        builtinReact: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser
        ],
        serverOnly: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser,
          WEBPACK_LAYERS_NAMES.instrument,
          WEBPACK_LAYERS_NAMES.middleware
        ],
        neutralTarget: [
          // pages api
          WEBPACK_LAYERS_NAMES.apiNode,
          WEBPACK_LAYERS_NAMES.apiEdge
        ],
        clientOnly: [
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser
        ],
        bundled: [
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.actionBrowser,
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser,
          WEBPACK_LAYERS_NAMES.shared,
          WEBPACK_LAYERS_NAMES.instrument,
          WEBPACK_LAYERS_NAMES.middleware
        ],
        appPages: [
          // app router pages and layouts
          WEBPACK_LAYERS_NAMES.reactServerComponents,
          WEBPACK_LAYERS_NAMES.serverSideRendering,
          WEBPACK_LAYERS_NAMES.appPagesBrowser,
          WEBPACK_LAYERS_NAMES.actionBrowser
        ]
      }
    };
    var WEBPACK_RESOURCE_QUERIES = {
      edgeSSREntry: "__next_edge_ssr_entry__",
      metadata: "__next_metadata__",
      metadataRoute: "__next_metadata_route__",
      metadataImageMeta: "__next_metadata_image_meta__"
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/escape-regexp.js
var require_escape_regexp = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/escape-regexp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "escapeStringRegexp", {
      enumerable: true,
      get: function() {
        return escapeStringRegexp;
      }
    });
    var reHasRegExp = /[|\\{}()[\]^$+*?.-]/;
    var reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g;
    function escapeStringRegexp(str) {
      if (reHasRegExp.test(str)) {
        return str.replace(reReplaceRegExp, "\\$&");
      }
      return str;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/invariant-error.js
var require_invariant_error = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/invariant-error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "InvariantError", {
      enumerable: true,
      get: function() {
        return InvariantError;
      }
    });
    var InvariantError = class extends Error {
      constructor(message, options) {
        super(`Invariant: ${message.endsWith(".") ? message : message + "."} This is a bug in Next.js.`, options);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
          value: "E1179",
          enumerable: false,
          configurable: true
        });
        this.name = "InvariantError";
      }
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-loader-tree.js
var require_parse_loader_tree = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-loader-tree.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "parseLoaderTree", {
      enumerable: true,
      get: function() {
        return parseLoaderTree;
      }
    });
    var _segment = require_segment();
    function parseLoaderTree(tree) {
      const [segment, parallelRoutes, modules, staticSiblings] = tree;
      const { layout, template } = modules;
      let { page } = modules;
      page = segment === _segment.DEFAULT_SEGMENT_KEY ? modules.defaultPage : page;
      const conventionPath = layout?.[1] || template?.[1] || page?.[1];
      return {
        page,
        segment,
        modules,
        /* it can be either layout / template / page */
        conventionPath,
        parallelRoutes,
        staticSiblings
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/get-segment-param.js
var require_get_segment_param = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/get-segment-param.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getParamProperties: function() {
        return getParamProperties;
      },
      getSegmentParam: function() {
        return getSegmentParam;
      },
      isCatchAll: function() {
        return isCatchAll;
      }
    });
    var _interceptionroutes = require_interception_routes();
    function getSegmentParam(segment) {
      const interceptionMarker = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.find((marker) => segment.startsWith(marker));
      if (interceptionMarker) {
        segment = segment.slice(interceptionMarker.length);
      }
      if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        return {
          // TODO-APP: Optional catchall does not currently work with parallel routes,
          // so for now aren't handling a potential interception marker.
          paramType: "optional-catchall",
          paramName: segment.slice(5, -2)
        };
      }
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        return {
          paramType: interceptionMarker ? `catchall-intercepted-${interceptionMarker}` : "catchall",
          paramName: segment.slice(4, -1)
        };
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        return {
          paramType: interceptionMarker ? `dynamic-intercepted-${interceptionMarker}` : "dynamic",
          paramName: segment.slice(1, -1)
        };
      }
      return null;
    }
    function isCatchAll(type) {
      return type === "catchall" || type === "catchall-intercepted-(..)(..)" || type === "catchall-intercepted-(.)" || type === "catchall-intercepted-(..)" || type === "catchall-intercepted-(...)" || type === "optional-catchall";
    }
    function getParamProperties(paramType) {
      let repeat = false;
      let optional = false;
      switch (paramType) {
        case "catchall":
        case "catchall-intercepted-(..)(..)":
        case "catchall-intercepted-(.)":
        case "catchall-intercepted-(..)":
        case "catchall-intercepted-(...)":
          repeat = true;
          break;
        case "optional-catchall":
          repeat = true;
          optional = true;
          break;
        case "dynamic":
        case "dynamic-intercepted-(..)(..)":
        case "dynamic-intercepted-(.)":
        case "dynamic-intercepted-(..)":
        case "dynamic-intercepted-(...)":
          break;
        default:
          paramType;
      }
      return {
        repeat,
        optional
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/routes/app.js
var require_app = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/routes/app.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      isInterceptionAppRoute: function() {
        return isInterceptionAppRoute;
      },
      isNormalizedAppRoute: function() {
        return isNormalizedAppRoute;
      },
      parseAppRouteSegment: function() {
        return parseAppRouteSegment;
      },
      parseAppRouteWithSlots: function() {
        return parseAppRouteWithSlots;
      },
      parseNormalizedAppRoute: function() {
        return parseNormalizedAppRoute;
      }
    });
    var _invarianterror = require_invariant_error();
    var _getsegmentparam = require_get_segment_param();
    var _interceptionroutes = require_interception_routes();
    function normalizeEncodedDynamicPlaceholder(segment) {
      if (!/%5b|%5d/i.test(segment)) {
        return segment;
      }
      try {
        const decodedSegment = decodeURIComponent(segment);
        return (0, _getsegmentparam.getSegmentParam)(decodedSegment) ? decodedSegment : segment;
      } catch {
        return segment;
      }
    }
    function parseAppRouteSegment(segment) {
      if (segment === "") {
        return null;
      }
      const interceptionMarker = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m));
      const param = (0, _getsegmentparam.getSegmentParam)(segment);
      if (param) {
        return {
          type: "dynamic",
          name: segment,
          param,
          interceptionMarker
        };
      } else if (segment.startsWith("(") && segment.endsWith(")")) {
        return {
          type: "route-group",
          name: segment,
          interceptionMarker
        };
      } else if (segment.startsWith("@")) {
        return {
          type: "parallel-route",
          name: segment,
          interceptionMarker
        };
      } else {
        return {
          type: "static",
          name: segment,
          interceptionMarker
        };
      }
    }
    function isNormalizedAppRoute(route) {
      return route.normalized;
    }
    function isInterceptionAppRoute(route) {
      return route.interceptionMarker !== void 0 && route.interceptingRoute !== void 0 && route.interceptedRoute !== void 0;
    }
    var OnlyRoutableSegments = (
      /*   */
      0
    );
    var AllowParallelSegments = (
      /*  */
      1
    );
    var AllowGroupSegments = (
      /*     */
      2
    );
    function parseAppRouteImpl(pathname, allowedTypes) {
      const pathnameSegments = pathname.split("/").filter(Boolean);
      const segments = [];
      let interceptionMarker;
      let interceptingRoute;
      let interceptedRoute;
      for (const segment of pathnameSegments) {
        const normalizedSegment = normalizeEncodedDynamicPlaceholder(segment);
        const appSegment = parseAppRouteSegment(normalizedSegment);
        if (!appSegment) {
          continue;
        }
        if (appSegment.type === "route-group" && !(allowedTypes & AllowGroupSegments)) {
          throw Object.defineProperty(new _invarianterror.InvariantError(`${pathname} is being parsed as a normalized route, but it has a route group segment.`), "__NEXT_ERROR_CODE", {
            value: "E1151",
            enumerable: false,
            configurable: true
          });
        }
        if (appSegment.type === "parallel-route" && !(allowedTypes & AllowParallelSegments)) {
          throw Object.defineProperty(new _invarianterror.InvariantError(`${pathname} is being parsed as a normalized route, but it has a parallel route segment.`), "__NEXT_ERROR_CODE", {
            value: "E1152",
            enumerable: false,
            configurable: true
          });
        }
        segments.push(appSegment);
        if (appSegment.interceptionMarker) {
          const parts = pathname.split(appSegment.interceptionMarker);
          if (parts.length !== 2) {
            throw Object.defineProperty(new Error(`Invalid interception route: ${pathname}`), "__NEXT_ERROR_CODE", {
              value: "E924",
              enumerable: false,
              configurable: true
            });
          }
          interceptingRoute = parseAppRouteImpl(parts[0], allowedTypes);
          interceptedRoute = parseAppRouteImpl(parts[1], allowedTypes);
          interceptionMarker = appSegment.interceptionMarker;
        }
      }
      const dynamicSegments = segments.filter((segment) => segment.type === "dynamic");
      return {
        normalized: allowedTypes === OnlyRoutableSegments,
        pathname,
        segments,
        dynamicSegments,
        interceptionMarker,
        interceptingRoute,
        interceptedRoute
      };
    }
    function parseNormalizedAppRoute(pathname) {
      return parseAppRouteImpl(pathname, OnlyRoutableSegments);
    }
    function parseAppRouteWithSlots(pathname) {
      return parseAppRouteImpl(pathname, AllowParallelSegments);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interception-prefix-from-param-type.js
var require_interception_prefix_from_param_type = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interception-prefix-from-param-type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "interceptionPrefixFromParamType", {
      enumerable: true,
      get: function() {
        return interceptionPrefixFromParamType;
      }
    });
    function interceptionPrefixFromParamType(paramType) {
      switch (paramType) {
        case "catchall-intercepted-(..)(..)":
        case "dynamic-intercepted-(..)(..)":
          return "(..)(..)";
        case "catchall-intercepted-(.)":
        case "dynamic-intercepted-(.)":
          return "(.)";
        case "catchall-intercepted-(..)":
        case "dynamic-intercepted-(..)":
          return "(..)";
        case "catchall-intercepted-(...)":
        case "dynamic-intercepted-(...)":
          return "(...)";
        case "catchall":
        case "dynamic":
        case "optional-catchall":
        default:
          return null;
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/resolve-param-value.js
var require_resolve_param_value = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/resolve-param-value.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "resolveParamValue", {
      enumerable: true,
      get: function() {
        return resolveParamValue;
      }
    });
    var _invarianterror = require_invariant_error();
    var _interceptionprefixfromparamtype = require_interception_prefix_from_param_type();
    function getParamValueFromSegment(pathSegment, params, paramType) {
      if (pathSegment.type === "dynamic") {
        return params[pathSegment.param.paramName];
      }
      const interceptionPrefix = (0, _interceptionprefixfromparamtype.interceptionPrefixFromParamType)(paramType);
      if (interceptionPrefix === pathSegment.interceptionMarker) {
        return pathSegment.name.replace(pathSegment.interceptionMarker, "");
      }
      return pathSegment.name;
    }
    function resolveParamValue(paramName, paramType, depth, route, params) {
      switch (paramType) {
        case "catchall":
        case "optional-catchall":
        case "catchall-intercepted-(..)(..)":
        case "catchall-intercepted-(.)":
        case "catchall-intercepted-(..)":
        case "catchall-intercepted-(...)":
          const processedSegments = [];
          for (let index = depth; index < route.segments.length; index++) {
            const pathSegment = route.segments[index];
            if (pathSegment.type === "static") {
              let value = pathSegment.name;
              const interceptionPrefix = (0, _interceptionprefixfromparamtype.interceptionPrefixFromParamType)(paramType);
              if (interceptionPrefix && index === depth && interceptionPrefix === pathSegment.interceptionMarker) {
                value = value.replace(pathSegment.interceptionMarker, "");
              }
              processedSegments.push(value);
            } else {
              if (!params.hasOwnProperty(pathSegment.param.paramName)) {
                if (pathSegment.param.paramType === "optional-catchall") {
                  break;
                }
                return void 0;
              }
              const paramValue = params[pathSegment.param.paramName];
              if (Array.isArray(paramValue)) {
                processedSegments.push(...paramValue);
              } else {
                processedSegments.push(paramValue);
              }
            }
          }
          if (processedSegments.length > 0) {
            return processedSegments;
          } else if (paramType === "optional-catchall") {
            return void 0;
          } else {
            throw Object.defineProperty(new _invarianterror.InvariantError(`Unexpected empty path segments match for a route "${route.pathname}" with param "${paramName}" of type "${paramType}"`), "__NEXT_ERROR_CODE", {
              value: "E931",
              enumerable: false,
              configurable: true
            });
          }
        case "dynamic":
        case "dynamic-intercepted-(..)(..)":
        case "dynamic-intercepted-(.)":
        case "dynamic-intercepted-(..)":
        case "dynamic-intercepted-(...)":
          if (depth < route.segments.length) {
            const pathSegment = route.segments[depth];
            if (pathSegment.type === "dynamic" && !params.hasOwnProperty(pathSegment.param.paramName)) {
              return void 0;
            }
            return getParamValueFromSegment(pathSegment, params, paramType);
          }
          return void 0;
        default:
          paramType;
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/get-dynamic-param.js
var require_get_dynamic_param = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/get-dynamic-param.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      PARAMETER_PATTERN: function() {
        return PARAMETER_PATTERN;
      },
      getDynamicParam: function() {
        return getDynamicParam;
      },
      interpolateParallelRouteParams: function() {
        return interpolateParallelRouteParams;
      },
      parseMatchedParameter: function() {
        return parseMatchedParameter;
      },
      parseParameter: function() {
        return parseParameter;
      }
    });
    var _invarianterror = require_invariant_error();
    var _parseloadertree = require_parse_loader_tree();
    var _app = require_app();
    var _resolveparamvalue = require_resolve_param_value();
    function getParamValue(interpolatedParams, segmentKey, fallbackRouteParams) {
      let value = interpolatedParams[segmentKey];
      if (fallbackRouteParams?.has(segmentKey)) {
        const [searchValue] = fallbackRouteParams.get(segmentKey);
        value = searchValue;
      } else if (Array.isArray(value)) {
        value = value.map((i) => encodeURIComponent(i));
      } else if (typeof value === "string") {
        value = encodeURIComponent(value);
      }
      return value;
    }
    function interpolateParallelRouteParams(loaderTree, params, pagePath, fallbackRouteParams) {
      const interpolated = structuredClone(params);
      const stack = [
        {
          tree: loaderTree,
          depth: 0
        }
      ];
      const route = (0, _app.parseNormalizedAppRoute)(pagePath);
      while (stack.length > 0) {
        const { tree, depth } = stack.pop();
        const { segment, parallelRoutes } = (0, _parseloadertree.parseLoaderTree)(tree);
        const appSegment = (0, _app.parseAppRouteSegment)(segment);
        if (appSegment?.type === "dynamic" && !interpolated.hasOwnProperty(appSegment.param.paramName) && // If the param is in the fallback route params, we don't need to
        // interpolate it because it's already marked as being unknown.
        !fallbackRouteParams?.has(appSegment.param.paramName)) {
          const { paramName, paramType } = appSegment.param;
          const paramValue = (0, _resolveparamvalue.resolveParamValue)(paramName, paramType, depth, route, interpolated);
          if (paramValue !== void 0) {
            interpolated[paramName] = paramValue;
          } else if (paramType !== "optional-catchall") {
            throw Object.defineProperty(new _invarianterror.InvariantError(`Could not resolve param value for segment: ${paramName}`), "__NEXT_ERROR_CODE", {
              value: "E932",
              enumerable: false,
              configurable: true
            });
          }
        }
        let nextDepth = depth;
        if (appSegment && appSegment.type !== "route-group" && appSegment.type !== "parallel-route") {
          nextDepth++;
        }
        for (const parallelRoute of Object.values(parallelRoutes)) {
          stack.push({
            tree: parallelRoute,
            depth: nextDepth
          });
        }
      }
      return interpolated;
    }
    function getDynamicParam(interpolatedParams, segmentKey, dynamicParamType, fallbackRouteParams, staticSiblings) {
      let value = getParamValue(interpolatedParams, segmentKey, fallbackRouteParams);
      if (!value || value.length === 0) {
        if (dynamicParamType === "oc") {
          return {
            param: segmentKey,
            value: null,
            type: dynamicParamType,
            treeSegment: [
              segmentKey,
              "",
              dynamicParamType,
              staticSiblings
            ]
          };
        }
        throw Object.defineProperty(new _invarianterror.InvariantError(`Missing value for segment key: "${segmentKey}" with dynamic param type: ${dynamicParamType}`), "__NEXT_ERROR_CODE", {
          value: "E864",
          enumerable: false,
          configurable: true
        });
      }
      const paramCacheKey = Array.isArray(value) ? value.join("/") : value;
      return {
        param: segmentKey,
        // The value that is passed to user code.
        value,
        // The value that is rendered in the router tree.
        // TODO: If the number of static siblings exceeds some threshold (e.g.,
        // dozens or hundreds), consider sending a Bloom filter instead of the full
        // array to reduce payload size. The client would then use the Bloom filter
        // to check membership with a small false positive rate.
        treeSegment: [
          segmentKey,
          paramCacheKey,
          dynamicParamType,
          staticSiblings
        ],
        type: dynamicParamType
      };
    }
    var PARAMETER_PATTERN = /^([^[]*)\[((?:\[[^\]]*\])|[^\]]+)\](.*)$/;
    function parseParameter(param) {
      const match = param.match(PARAMETER_PATTERN);
      if (!match) {
        return parseMatchedParameter(param);
      }
      return parseMatchedParameter(match[2]);
    }
    function parseMatchedParameter(param) {
      const optional = param.startsWith("[") && param.endsWith("]");
      if (optional) {
        param = param.slice(1, -1);
      }
      const repeat = param.startsWith("...");
      if (repeat) {
        param = param.slice(3);
      }
      return {
        key: param,
        repeat,
        optional
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-regex.js
var require_route_regex = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/route-regex.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getNamedMiddlewareRegex: function() {
        return getNamedMiddlewareRegex;
      },
      getNamedRouteRegex: function() {
        return getNamedRouteRegex;
      },
      getRouteRegex: function() {
        return getRouteRegex;
      }
    });
    var _constants = require_constants();
    var _interceptionroutes = require_interception_routes();
    var _escaperegexp = require_escape_regexp();
    var _removetrailingslash = require_remove_trailing_slash();
    var _getdynamicparam = require_get_dynamic_param();
    function getParametrizedRoute(route, includeSuffix, includePrefix) {
      const groups = {};
      let groupIndex = 1;
      const segments = [];
      for (const segment of (0, _removetrailingslash.removeTrailingSlash)(route).slice(1).split("/")) {
        const markerMatch = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m));
        const paramMatches = segment.match(_getdynamicparam.PARAMETER_PATTERN);
        if (markerMatch && paramMatches && paramMatches[2]) {
          const { key, optional, repeat } = (0, _getdynamicparam.parseMatchedParameter)(paramMatches[2]);
          groups[key] = {
            pos: groupIndex++,
            repeat,
            optional
          };
          segments.push(`/${(0, _escaperegexp.escapeStringRegexp)(markerMatch)}([^/]+?)`);
        } else if (paramMatches && paramMatches[2]) {
          const { key, repeat, optional } = (0, _getdynamicparam.parseMatchedParameter)(paramMatches[2]);
          groups[key] = {
            pos: groupIndex++,
            repeat,
            optional
          };
          if (includePrefix && paramMatches[1]) {
            segments.push(`/${(0, _escaperegexp.escapeStringRegexp)(paramMatches[1])}`);
          }
          let s = repeat ? optional ? "(?:/(.+?))?" : "/(.+?)" : "/([^/]+?)";
          if (includePrefix && paramMatches[1]) {
            s = s.substring(1);
          }
          segments.push(s);
        } else {
          segments.push(`/${(0, _escaperegexp.escapeStringRegexp)(segment)}`);
        }
        if (includeSuffix && paramMatches && paramMatches[3]) {
          segments.push((0, _escaperegexp.escapeStringRegexp)(paramMatches[3]));
        }
      }
      return {
        parameterizedRoute: segments.join(""),
        groups
      };
    }
    function getRouteRegex(normalizedRoute, { includeSuffix = false, includePrefix = false, excludeOptionalTrailingSlash = false } = {}) {
      const { parameterizedRoute, groups } = getParametrizedRoute(normalizedRoute, includeSuffix, includePrefix);
      let re = parameterizedRoute;
      if (!excludeOptionalTrailingSlash) {
        re += "(?:/)?";
      }
      return {
        re: new RegExp(`^${re}$`),
        groups
      };
    }
    function buildGetSafeRouteKey() {
      let i = 0;
      return () => {
        let routeKey = "";
        let j = ++i;
        while (j > 0) {
          routeKey += String.fromCharCode(97 + (j - 1) % 26);
          j = Math.floor((j - 1) / 26);
        }
        return routeKey;
      };
    }
    function getSafeKeyFromSegment({ interceptionMarker, getSafeRouteKey, segment, routeKeys, keyPrefix, backreferenceDuplicateKeys }) {
      const { key, optional, repeat } = (0, _getdynamicparam.parseMatchedParameter)(segment);
      let cleanedKey = key.replace(/\W/g, "");
      if (keyPrefix) {
        cleanedKey = `${keyPrefix}${cleanedKey}`;
      }
      let invalidKey = false;
      if (cleanedKey.length === 0 || cleanedKey.length > 30) {
        invalidKey = true;
      }
      if (!isNaN(parseInt(cleanedKey.slice(0, 1)))) {
        invalidKey = true;
      }
      if (invalidKey) {
        cleanedKey = getSafeRouteKey();
      }
      const duplicateKey = cleanedKey in routeKeys;
      if (keyPrefix) {
        routeKeys[cleanedKey] = `${keyPrefix}${key}`;
      } else {
        routeKeys[cleanedKey] = key;
      }
      const interceptionPrefix = interceptionMarker ? (0, _escaperegexp.escapeStringRegexp)(interceptionMarker) : "";
      let pattern;
      if (duplicateKey && backreferenceDuplicateKeys) {
        pattern = `\\k<${cleanedKey}>`;
      } else if (repeat) {
        pattern = `(?<${cleanedKey}>.+?)`;
      } else {
        pattern = `(?<${cleanedKey}>[^/]+?)`;
      }
      return {
        key,
        pattern: optional ? `(?:/${interceptionPrefix}${pattern})?` : `/${interceptionPrefix}${pattern}`,
        cleanedKey,
        optional,
        repeat
      };
    }
    function getNamedParametrizedRoute(route, prefixRouteKeys, includeSuffix, includePrefix, backreferenceDuplicateKeys, reference = {
      names: {},
      intercepted: {}
    }) {
      const getSafeRouteKey = buildGetSafeRouteKey();
      const routeKeys = {};
      const segments = [];
      const inverseParts = [];
      reference = structuredClone(reference);
      for (const segment of (0, _removetrailingslash.removeTrailingSlash)(route).slice(1).split("/")) {
        const hasInterceptionMarker = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.some((m) => segment.startsWith(m));
        const paramMatches = segment.match(_getdynamicparam.PARAMETER_PATTERN);
        const interceptionMarker = hasInterceptionMarker ? paramMatches?.[1] : void 0;
        let keyPrefix;
        if (interceptionMarker && paramMatches?.[2]) {
          keyPrefix = prefixRouteKeys ? _constants.NEXT_INTERCEPTION_MARKER_PREFIX : void 0;
          reference.intercepted[paramMatches[2]] = interceptionMarker;
        } else if (paramMatches?.[2] && reference.intercepted[paramMatches[2]]) {
          keyPrefix = prefixRouteKeys ? _constants.NEXT_INTERCEPTION_MARKER_PREFIX : void 0;
        } else {
          keyPrefix = prefixRouteKeys ? _constants.NEXT_QUERY_PARAM_PREFIX : void 0;
        }
        if (interceptionMarker && paramMatches && paramMatches[2]) {
          const { key, pattern, cleanedKey, repeat, optional } = getSafeKeyFromSegment({
            getSafeRouteKey,
            interceptionMarker,
            segment: paramMatches[2],
            routeKeys,
            keyPrefix,
            backreferenceDuplicateKeys
          });
          segments.push(pattern);
          inverseParts.push(`/${paramMatches[1]}:${reference.names[key] ?? cleanedKey}${repeat ? optional ? "*" : "+" : ""}`);
          reference.names[key] ??= cleanedKey;
        } else if (paramMatches && paramMatches[2]) {
          if (includePrefix && paramMatches[1]) {
            segments.push(`/${(0, _escaperegexp.escapeStringRegexp)(paramMatches[1])}`);
            inverseParts.push(`/${paramMatches[1]}`);
          }
          const { key, pattern, cleanedKey, repeat, optional } = getSafeKeyFromSegment({
            getSafeRouteKey,
            segment: paramMatches[2],
            routeKeys,
            keyPrefix,
            backreferenceDuplicateKeys
          });
          let s = pattern;
          if (includePrefix && paramMatches[1]) {
            s = s.substring(1);
          }
          segments.push(s);
          inverseParts.push(`/:${reference.names[key] ?? cleanedKey}${repeat ? optional ? "*" : "+" : ""}`);
          reference.names[key] ??= cleanedKey;
        } else {
          segments.push(`/${(0, _escaperegexp.escapeStringRegexp)(segment)}`);
          inverseParts.push(`/${segment}`);
        }
        if (includeSuffix && paramMatches && paramMatches[3]) {
          segments.push((0, _escaperegexp.escapeStringRegexp)(paramMatches[3]));
          inverseParts.push(paramMatches[3]);
        }
      }
      return {
        namedParameterizedRoute: segments.join(""),
        routeKeys,
        pathToRegexpPattern: inverseParts.join(""),
        reference
      };
    }
    function getNamedRouteRegex(normalizedRoute, options) {
      const result = getNamedParametrizedRoute(normalizedRoute, options.prefixRouteKeys, options.includeSuffix ?? false, options.includePrefix ?? false, options.backreferenceDuplicateKeys ?? false, options.reference);
      let namedRegex = result.namedParameterizedRoute;
      if (!options.excludeOptionalTrailingSlash) {
        namedRegex += "(?:/)?";
      }
      return {
        ...getRouteRegex(normalizedRoute, options),
        namedRegex: `^${namedRegex}$`,
        routeKeys: result.routeKeys,
        pathToRegexpPattern: result.pathToRegexpPattern,
        reference: result.reference
      };
    }
    function getNamedMiddlewareRegex(normalizedRoute, options) {
      const { parameterizedRoute } = getParametrizedRoute(normalizedRoute, false, false);
      const { catchAll = true } = options;
      if (parameterizedRoute === "/") {
        let catchAllRegex = catchAll ? ".*" : "";
        return {
          namedRegex: `^/${catchAllRegex}$`
        };
      }
      const { namedParameterizedRoute } = getNamedParametrizedRoute(normalizedRoute, false, false, false, false, void 0);
      let catchAllGroupedRegex = catchAll ? "(?:(/.*)?)" : "";
      return {
        namedRegex: `^${namedParameterizedRoute}${catchAllGroupedRegex}$`
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interpolate-as.js
var require_interpolate_as = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/interpolate-as.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "interpolateAs", {
      enumerable: true,
      get: function() {
        return interpolateAs;
      }
    });
    var _routematcher = require_route_matcher();
    var _routeregex = require_route_regex();
    function interpolateAs(route, asPathname, query) {
      let interpolatedRoute = "";
      const dynamicRegex = (0, _routeregex.getRouteRegex)(route);
      const dynamicGroups = dynamicRegex.groups;
      const dynamicMatches = (
        // Try to match the dynamic route against the asPath
        (asPathname !== route ? (0, _routematcher.getRouteMatcher)(dynamicRegex)(asPathname) : "") || // Fall back to reading the values from the href
        // TODO: should this take priority; also need to change in the router.
        query
      );
      interpolatedRoute = route;
      const params = Object.keys(dynamicGroups);
      if (!params.every((param) => {
        let value = dynamicMatches[param] || "";
        const { repeat, optional } = dynamicGroups[param];
        let replaced = `[${repeat ? "..." : ""}${param}]`;
        if (optional) {
          replaced = `${!value ? "/" : ""}[${replaced}]`;
        }
        if (repeat && !Array.isArray(value)) value = [
          value
        ];
        return (optional || param in dynamicMatches) && // Interpolate group into data URL if present
        (interpolatedRoute = interpolatedRoute.replace(replaced, repeat ? value.map(
          // these values should be fully encoded instead of just
          // path delimiter escaped since they are being inserted
          // into the URL and we expect URL encoded segments
          // when parsing dynamic route params
          (segment) => encodeURIComponent(segment)
        ).join("/") : encodeURIComponent(value)) || "/");
      })) {
        interpolatedRoute = "";
      }
      return {
        params,
        result: interpolatedRoute
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/resolve-href.js
var require_resolve_href = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/resolve-href.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "resolveHref", {
      enumerable: true,
      get: function() {
        return resolveHref;
      }
    });
    var _querystring = require_querystring();
    var _formaturl = require_format_url();
    var _omit = require_omit();
    var _utils = require_utils();
    var _normalizetrailingslash = require_normalize_trailing_slash();
    var _islocalurl = require_is_local_url();
    var _utils1 = require_utils2();
    var _interpolateas = require_interpolate_as();
    var _routeregex = require_route_regex();
    var _routematcher = require_route_matcher();
    function resolveHref(router, href, resolveAs) {
      let base;
      let urlAsString = typeof href === "string" ? href : (0, _formaturl.formatWithValidation)(href);
      const urlProtoMatch = urlAsString.match(/^[a-z][a-z0-9+.-]*:\/\//i);
      const urlAsStringNoProto = urlProtoMatch ? urlAsString.slice(urlProtoMatch[0].length) : urlAsString;
      const urlParts = urlAsStringNoProto.split("?", 1);
      if ((urlParts[0] || "").match(/(\/\/|\\)/)) {
        console.error(`Invalid href '${urlAsString}' passed to next/router in page: '${router.pathname}'. Repeated forward-slashes (//) or backslashes \\ are not valid in the href.`);
        const normalizedUrl = (0, _utils.normalizeRepeatedSlashes)(urlAsStringNoProto);
        urlAsString = (urlProtoMatch ? urlProtoMatch[0] : "") + normalizedUrl;
      }
      if (!(0, _islocalurl.isLocalURL)(urlAsString)) {
        return resolveAs ? [
          urlAsString
        ] : urlAsString;
      }
      try {
        let baseBase = urlAsString.startsWith("#") ? router.asPath : router.pathname;
        if (urlAsString.startsWith("?")) {
          baseBase = router.asPath;
          if ((0, _utils1.isDynamicRoute)(router.pathname)) {
            baseBase = router.pathname;
            const routeRegex = (0, _routeregex.getRouteRegex)(router.pathname);
            const match = (0, _routematcher.getRouteMatcher)(routeRegex)(router.asPath);
            if (!match) {
              baseBase = router.asPath;
            }
          }
        }
        base = new URL(baseBase, "http://n");
      } catch (_) {
        base = new URL("/", "http://n");
      }
      try {
        const finalUrl = new URL(urlAsString, base);
        finalUrl.pathname = (0, _normalizetrailingslash.normalizePathTrailingSlash)(finalUrl.pathname);
        let interpolatedAs = "";
        if ((0, _utils1.isDynamicRoute)(finalUrl.pathname) && finalUrl.searchParams && resolveAs) {
          const query = (0, _querystring.searchParamsToUrlQuery)(finalUrl.searchParams);
          const { result, params } = (0, _interpolateas.interpolateAs)(finalUrl.pathname, finalUrl.pathname, query);
          if (result) {
            interpolatedAs = (0, _formaturl.formatWithValidation)({
              pathname: result,
              hash: finalUrl.hash,
              query: (0, _omit.omit)(query, params)
            });
          }
        }
        const resolvedHref = finalUrl.origin === base.origin ? finalUrl.href.slice(finalUrl.origin.length) : finalUrl.href;
        return resolveAs ? [
          resolvedHref,
          interpolatedAs || resolvedHref
        ] : resolvedHref;
      } catch (_) {
        return resolveAs ? [
          urlAsString
        ] : urlAsString;
      }
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/add-path-prefix.js
var require_add_path_prefix = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/add-path-prefix.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "addPathPrefix", {
      enumerable: true,
      get: function() {
        return addPathPrefix;
      }
    });
    var _parsepath = require_parse_path();
    function addPathPrefix(path, prefix) {
      if (!path.startsWith("/") || !prefix) {
        return path;
      }
      const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
      return `${prefix}${pathname}${query}${hash}`;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/add-locale.js
var require_add_locale = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/add-locale.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "addLocale", {
      enumerable: true,
      get: function() {
        return addLocale;
      }
    });
    var _addpathprefix = require_add_path_prefix();
    var _pathhasprefix = require_path_has_prefix();
    function addLocale(path, locale, defaultLocale, ignorePrefix) {
      if (!locale || locale === defaultLocale) return path;
      const lower = path.toLowerCase();
      if (!ignorePrefix) {
        if ((0, _pathhasprefix.pathHasPrefix)(lower, "/api")) return path;
        if ((0, _pathhasprefix.pathHasPrefix)(lower, `/${locale.toLowerCase()}`)) return path;
      }
      return (0, _addpathprefix.addPathPrefix)(path, `/${locale}`);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/add-locale.js
var require_add_locale2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/add-locale.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "addLocale", {
      enumerable: true,
      get: function() {
        return addLocale;
      }
    });
    var _normalizetrailingslash = require_normalize_trailing_slash();
    var addLocale = (path, ...args) => {
      if (process.env.__NEXT_I18N_SUPPORT) {
        return (0, _normalizetrailingslash.normalizePathTrailingSlash)(require_add_locale().addLocale(path, ...args));
      }
      return path;
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/request-idle-callback.js
var require_request_idle_callback = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/request-idle-callback.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      cancelIdleCallback: function() {
        return cancelIdleCallback;
      },
      requestIdleCallback: function() {
        return requestIdleCallback;
      }
    });
    var requestIdleCallback = typeof self !== "undefined" && self.requestIdleCallback && self.requestIdleCallback.bind(window) || function(cb) {
      let start = Date.now();
      return self.setTimeout(function() {
        cb({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    };
    var cancelIdleCallback = typeof self !== "undefined" && self.cancelIdleCallback && self.cancelIdleCallback.bind(window) || function(id) {
      return clearTimeout(id);
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/use-intersection.js
var require_use_intersection = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/use-intersection.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "useIntersection", {
      enumerable: true,
      get: function() {
        return useIntersection;
      }
    });
    var _react = __require("react");
    var _requestidlecallback = require_request_idle_callback();
    var hasIntersectionObserver = typeof IntersectionObserver === "function";
    var observers = /* @__PURE__ */ new Map();
    var idList = [];
    function createObserver(options) {
      const id = {
        root: options.root || null,
        margin: options.rootMargin || ""
      };
      const existing = idList.find((obj) => obj.root === id.root && obj.margin === id.margin);
      let instance;
      if (existing) {
        instance = observers.get(existing);
        if (instance) {
          return instance;
        }
      }
      const elements = /* @__PURE__ */ new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const callback = elements.get(entry.target);
          const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
          if (callback && isVisible) {
            callback(isVisible);
          }
        });
      }, options);
      instance = {
        id,
        observer,
        elements
      };
      idList.push(id);
      observers.set(id, instance);
      return instance;
    }
    function observe(element, callback, options) {
      const { id, observer, elements } = createObserver(options);
      elements.set(element, callback);
      observer.observe(element);
      return function unobserve() {
        elements.delete(element);
        observer.unobserve(element);
        if (elements.size === 0) {
          observer.disconnect();
          observers.delete(id);
          const index = idList.findIndex((obj) => obj.root === id.root && obj.margin === id.margin);
          if (index > -1) {
            idList.splice(index, 1);
          }
        }
      };
    }
    function useIntersection({ rootRef, rootMargin, disabled }) {
      const isDisabled = disabled || !hasIntersectionObserver;
      const [visible, setVisible] = (0, _react.useState)(false);
      const elementRef = (0, _react.useRef)(null);
      const setElement = (0, _react.useCallback)((element) => {
        elementRef.current = element;
      }, []);
      (0, _react.useEffect)(() => {
        if (hasIntersectionObserver) {
          if (isDisabled || visible) return;
          const element = elementRef.current;
          if (element && element.tagName) {
            const unobserve = observe(element, (isVisible) => isVisible && setVisible(isVisible), {
              root: rootRef?.current,
              rootMargin
            });
            return unobserve;
          }
        } else {
          if (!visible) {
            const idleCallback = (0, _requestidlecallback.requestIdleCallback)(() => setVisible(true));
            return () => (0, _requestidlecallback.cancelIdleCallback)(idleCallback);
          }
        }
      }, [
        isDisabled,
        rootMargin,
        rootRef,
        visible,
        elementRef.current
      ]);
      const resetVisible = (0, _react.useCallback)(() => {
        setVisible(false);
      }, []);
      return [
        setElement,
        visible,
        resetVisible
      ];
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/i18n/normalize-locale-path.js
var require_normalize_locale_path = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/i18n/normalize-locale-path.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "normalizeLocalePath", {
      enumerable: true,
      get: function() {
        return normalizeLocalePath;
      }
    });
    var cache = /* @__PURE__ */ new WeakMap();
    function normalizeLocalePath(pathname, locales) {
      if (!locales) return {
        pathname
      };
      let lowercasedLocales = cache.get(locales);
      if (!lowercasedLocales) {
        lowercasedLocales = locales.map((locale) => locale.toLowerCase());
        cache.set(locales, lowercasedLocales);
      }
      let detectedLocale;
      const segments = pathname.split("/", 2);
      if (!segments[1]) return {
        pathname
      };
      const segment = segments[1].toLowerCase();
      const index = lowercasedLocales.indexOf(segment);
      if (index < 0) return {
        pathname
      };
      detectedLocale = locales[index];
      pathname = pathname.slice(detectedLocale.length + 1) || "/";
      return {
        pathname,
        detectedLocale
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/normalize-locale-path.js
var require_normalize_locale_path2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/normalize-locale-path.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "normalizeLocalePath", {
      enumerable: true,
      get: function() {
        return normalizeLocalePath;
      }
    });
    var normalizeLocalePath = (pathname, locales) => {
      if (process.env.__NEXT_I18N_SUPPORT) {
        return require_normalize_locale_path().normalizeLocalePath(pathname, locales);
      }
      return {
        pathname,
        detectedLocale: void 0
      };
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/i18n/detect-domain-locale.js
var require_detect_domain_locale = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/i18n/detect-domain-locale.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "detectDomainLocale", {
      enumerable: true,
      get: function() {
        return detectDomainLocale;
      }
    });
    function detectDomainLocale(domainItems, hostname, detectedLocale) {
      if (!domainItems) return;
      if (detectedLocale) {
        detectedLocale = detectedLocale.toLowerCase();
      }
      for (const item of domainItems) {
        const domainHostname = item.domain?.split(":", 1)[0].toLowerCase();
        if (hostname === domainHostname || detectedLocale === item.defaultLocale.toLowerCase() || item.locales?.some((locale) => locale.toLowerCase() === detectedLocale)) {
          return item;
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/detect-domain-locale.js
var require_detect_domain_locale2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/detect-domain-locale.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "detectDomainLocale", {
      enumerable: true,
      get: function() {
        return detectDomainLocale;
      }
    });
    var detectDomainLocale = (...args) => {
      if (process.env.__NEXT_I18N_SUPPORT) {
        return require_detect_domain_locale().detectDomainLocale(...args);
      }
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/get-domain-locale.js
var require_get_domain_locale = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/get-domain-locale.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "getDomainLocale", {
      enumerable: true,
      get: function() {
        return getDomainLocale;
      }
    });
    var _normalizetrailingslash = require_normalize_trailing_slash();
    var basePath = process.env.__NEXT_ROUTER_BASEPATH || "";
    function getDomainLocale(path, locale, locales, domainLocales) {
      if (process.env.__NEXT_I18N_SUPPORT) {
        const normalizeLocalePath = require_normalize_locale_path2().normalizeLocalePath;
        const detectDomainLocale = require_detect_domain_locale2().detectDomainLocale;
        const target = locale || normalizeLocalePath(path, locales).detectedLocale;
        const domain = detectDomainLocale(domainLocales, void 0, target);
        if (domain) {
          const proto = `http${domain.http ? "" : "s"}://`;
          const finalLocale = target === domain.defaultLocale ? "" : `/${target}`;
          return `${proto}${domain.domain}${(0, _normalizetrailingslash.normalizePathTrailingSlash)(`${basePath}${finalLocale}${path}`)}`;
        }
        return false;
      } else {
        return false;
      }
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/add-base-path.js
var require_add_base_path = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/add-base-path.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "addBasePath", {
      enumerable: true,
      get: function() {
        return addBasePath;
      }
    });
    var _addpathprefix = require_add_path_prefix();
    var _normalizetrailingslash = require_normalize_trailing_slash();
    var basePath = process.env.__NEXT_ROUTER_BASEPATH || "";
    function addBasePath(path, required) {
      return (0, _normalizetrailingslash.normalizePathTrailingSlash)(process.env.__NEXT_MANUAL_CLIENT_BASE_PATH && !required ? path : (0, _addpathprefix.addPathPrefix)(path, basePath));
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/error-once.js
var require_error_once = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/error-once.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "errorOnce", {
      enumerable: true,
      get: function() {
        return errorOnce;
      }
    });
    var errorOnce = (_) => {
    };
    if (process.env.NODE_ENV !== "production") {
      const errors = /* @__PURE__ */ new Set();
      errorOnce = (msg) => {
        if (!errors.has(msg)) {
          console.error(msg);
        }
        errors.add(msg);
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/link.js
var require_link = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/link.js"(exports, module) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      default: function() {
        return _default;
      },
      useLinkStatus: function() {
        return useLinkStatus;
      }
    });
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _jsxruntime = __require("react/jsx-runtime");
    var _react = /* @__PURE__ */ _interop_require_wildcard._(__require("react"));
    var _resolvehref = require_resolve_href();
    var _islocalurl = require_is_local_url();
    var _formaturl = require_format_url();
    var _utils = require_utils();
    var _addlocale = require_add_locale2();
    var _routercontextsharedruntime = require_router_context_shared_runtime();
    var _useintersection = require_use_intersection();
    var _getdomainlocale = require_get_domain_locale();
    var _addbasepath = require_add_base_path();
    var _usemergedref = require_use_merged_ref();
    var prefetched = /* @__PURE__ */ new Set();
    function prefetch(router, href, as, options) {
      if (typeof window === "undefined") {
        return;
      }
      if (!(0, _islocalurl.isLocalURL)(href)) {
        return;
      }
      if (!options.bypassPrefetchedCheck) {
        const locale = (
          // Let the link's locale prop override the default router locale.
          typeof options.locale !== "undefined" ? options.locale : "locale" in router ? router.locale : void 0
        );
        const prefetchedKey = href + "%" + as + "%" + locale;
        if (prefetched.has(prefetchedKey)) {
          return;
        }
        prefetched.add(prefetchedKey);
      }
      router.prefetch(href, as, options).catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          throw err;
        }
      });
    }
    function isModifiedEvent(event) {
      const eventTarget = event.currentTarget;
      const target = eventTarget.getAttribute("target");
      return target && target !== "_self" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || // triggers resource download
      event.nativeEvent && event.nativeEvent.which === 2;
    }
    function linkClicked(e, router, href, as, replace, shallow, scroll, locale, onNavigate) {
      const { nodeName } = e.currentTarget;
      const isAnchorNodeName = nodeName.toUpperCase() === "A";
      if (isAnchorNodeName && isModifiedEvent(e) || e.currentTarget.hasAttribute("download")) {
        return;
      }
      if (!(0, _islocalurl.isLocalURL)(href)) {
        if (replace) {
          e.preventDefault();
          location.replace(href);
        }
        return;
      }
      e.preventDefault();
      const navigate = () => {
        if (onNavigate) {
          let isDefaultPrevented = false;
          onNavigate({
            preventDefault: () => {
              isDefaultPrevented = true;
            }
          });
          if (isDefaultPrevented) {
            return;
          }
        }
        const routerScroll = scroll ?? true;
        if ("beforePopState" in router) {
          router[replace ? "replace" : "push"](href, as, {
            shallow,
            locale,
            scroll: routerScroll
          });
        } else {
          router[replace ? "replace" : "push"](as || href, {
            scroll: routerScroll
          });
        }
      };
      navigate();
    }
    function formatStringOrUrl(urlObjOrString) {
      if (typeof urlObjOrString === "string") {
        return urlObjOrString;
      }
      return (0, _formaturl.formatUrl)(urlObjOrString);
    }
    var Link2 = /* @__PURE__ */ _react.default.forwardRef(function LinkComponent(props, forwardedRef) {
      let children;
      const { href: hrefProp, as: asProp, children: childrenProp, prefetch: prefetchProp = null, passHref, replace, shallow, scroll, locale, onClick, onNavigate, onMouseEnter: onMouseEnterProp, onTouchStart: onTouchStartProp, legacyBehavior = false, transitionTypes, ...restProps } = props;
      children = childrenProp;
      if (legacyBehavior && (typeof children === "string" || typeof children === "number")) {
        children = /* @__PURE__ */ (0, _jsxruntime.jsx)("a", {
          children
        });
      }
      const router = _react.default.useContext(_routercontextsharedruntime.RouterContext);
      const prefetchEnabled = prefetchProp !== false;
      if (process.env.NODE_ENV !== "production") {
        let createPropError = function(args) {
          return Object.defineProperty(new Error(`Failed prop type: The prop \`${args.key}\` expects a ${args.expected} in \`<Link>\`, but got \`${args.actual}\` instead.` + (typeof window !== "undefined" ? "\nOpen your browser's console to view the Component stack trace." : "")), "__NEXT_ERROR_CODE", {
            value: "E319",
            enumerable: false,
            configurable: true
          });
        };
        const requiredPropsGuard = {
          href: true
        };
        const requiredProps = Object.keys(requiredPropsGuard);
        requiredProps.forEach((key) => {
          if (key === "href") {
            if (props[key] == null || typeof props[key] !== "string" && typeof props[key] !== "object") {
              throw createPropError({
                key,
                expected: "`string` or `object`",
                actual: props[key] === null ? "null" : typeof props[key]
              });
            }
          } else {
            const _ = key;
          }
        });
        const optionalPropsGuard = {
          as: true,
          replace: true,
          scroll: true,
          shallow: true,
          passHref: true,
          prefetch: true,
          locale: true,
          onClick: true,
          onMouseEnter: true,
          onTouchStart: true,
          legacyBehavior: true,
          onNavigate: true,
          transitionTypes: true
        };
        const optionalProps = Object.keys(optionalPropsGuard);
        optionalProps.forEach((key) => {
          const valType = typeof props[key];
          if (key === "as") {
            if (props[key] && valType !== "string" && valType !== "object") {
              throw createPropError({
                key,
                expected: "`string` or `object`",
                actual: valType
              });
            }
          } else if (key === "locale") {
            if (props[key] && valType !== "string") {
              throw createPropError({
                key,
                expected: "`string`",
                actual: valType
              });
            }
          } else if (key === "onClick" || key === "onMouseEnter" || key === "onTouchStart" || key === "onNavigate") {
            if (props[key] && valType !== "function") {
              throw createPropError({
                key,
                expected: "`function`",
                actual: valType
              });
            }
          } else if (key === "replace" || key === "scroll" || key === "shallow" || key === "passHref" || key === "legacyBehavior") {
            if (props[key] != null && valType !== "boolean") {
              throw createPropError({
                key,
                expected: "`boolean`",
                actual: valType
              });
            }
          } else if (key === "prefetch") {
            if (props[key] != null && valType !== "boolean" && props[key] !== "auto") {
              throw createPropError({
                key,
                expected: '`boolean | "auto"`',
                actual: valType
              });
            }
          } else if (key === "transitionTypes") {
            if (props[key] != null && !Array.isArray(props[key])) {
              throw createPropError({
                key,
                expected: "`string[]`",
                actual: valType
              });
            }
          } else {
            const _ = key;
          }
        });
      }
      const { href, as } = _react.default.useMemo(() => {
        if (!router) {
          const resolvedHref2 = formatStringOrUrl(hrefProp);
          return {
            href: resolvedHref2,
            as: asProp ? formatStringOrUrl(asProp) : resolvedHref2
          };
        }
        const [resolvedHref, resolvedAs] = (0, _resolvehref.resolveHref)(router, hrefProp, true);
        return {
          href: resolvedHref,
          as: asProp ? (0, _resolvehref.resolveHref)(router, asProp) : resolvedAs || resolvedHref
        };
      }, [
        router,
        hrefProp,
        asProp
      ]);
      const previousHref = _react.default.useRef(href);
      const previousAs = _react.default.useRef(as);
      let child;
      if (legacyBehavior) {
        if (process.env.NODE_ENV === "development") {
          if (onClick) {
            console.warn(`"onClick" was passed to <Link> with \`href\` of \`${hrefProp}\` but "legacyBehavior" was set. The legacy behavior requires onClick be set on the child of next/link`);
          }
          if (onMouseEnterProp) {
            console.warn(`"onMouseEnter" was passed to <Link> with \`href\` of \`${hrefProp}\` but "legacyBehavior" was set. The legacy behavior requires onMouseEnter be set on the child of next/link`);
          }
          try {
            child = _react.default.Children.only(children);
          } catch (err) {
            if (!children) {
              throw Object.defineProperty(new Error(`No children were passed to <Link> with \`href\` of \`${hrefProp}\` but one child is required https://nextjs.org/docs/messages/link-no-children`), "__NEXT_ERROR_CODE", {
                value: "E320",
                enumerable: false,
                configurable: true
              });
            }
            throw Object.defineProperty(new Error(`Multiple children were passed to <Link> with \`href\` of \`${hrefProp}\` but only one child is supported https://nextjs.org/docs/messages/link-multiple-children` + (typeof window !== "undefined" ? " \nOpen your browser's console to view the Component stack trace." : "")), "__NEXT_ERROR_CODE", {
              value: "E266",
              enumerable: false,
              configurable: true
            });
          }
        } else {
          child = _react.default.Children.only(children);
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          if (children?.type === "a") {
            throw Object.defineProperty(new Error("Invalid <Link> with <a> child. Please remove <a> or use <Link legacyBehavior>.\nLearn more: https://nextjs.org/docs/messages/invalid-new-link-with-extra-anchor"), "__NEXT_ERROR_CODE", {
              value: "E209",
              enumerable: false,
              configurable: true
            });
          }
        }
      }
      const childRef = legacyBehavior ? child && typeof child === "object" && child.ref : forwardedRef;
      const [setIntersectionRef, isVisible, resetVisible] = (0, _useintersection.useIntersection)({
        rootMargin: "200px"
      });
      const setIntersectionWithResetRef = _react.default.useCallback((el) => {
        if (previousAs.current !== as || previousHref.current !== href) {
          resetVisible();
          previousAs.current = as;
          previousHref.current = href;
        }
        setIntersectionRef(el);
      }, [
        as,
        href,
        resetVisible,
        setIntersectionRef
      ]);
      const setRef = (0, _usemergedref.useMergedRef)(setIntersectionWithResetRef, childRef);
      _react.default.useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
          return;
        }
        if (!router) {
          return;
        }
        if (!isVisible || !prefetchEnabled) {
          return;
        }
        prefetch(router, href, as, {
          // dedupe across appear/disappear of the Link.
          bypassPrefetchedCheck: false,
          locale
        });
      }, [
        as,
        href,
        isVisible,
        locale,
        prefetchEnabled,
        router?.locale,
        router
      ]);
      const childProps = {
        ref: setRef,
        onClick(e) {
          if (process.env.NODE_ENV !== "production") {
            if (!e) {
              throw Object.defineProperty(new Error(`Component rendered inside next/link has to pass click event to "onClick" prop.`), "__NEXT_ERROR_CODE", {
                value: "E312",
                enumerable: false,
                configurable: true
              });
            }
          }
          if (!legacyBehavior && typeof onClick === "function") {
            onClick(e);
          }
          if (legacyBehavior && child.props && typeof child.props.onClick === "function") {
            child.props.onClick(e);
          }
          if (!router) {
            return;
          }
          if (e.defaultPrevented) {
            return;
          }
          linkClicked(e, router, href, as, replace, shallow, scroll, locale, onNavigate);
        },
        onMouseEnter(e) {
          if (!legacyBehavior && typeof onMouseEnterProp === "function") {
            onMouseEnterProp(e);
          }
          if (legacyBehavior && child.props && typeof child.props.onMouseEnter === "function") {
            child.props.onMouseEnter(e);
          }
          if (!router) {
            return;
          }
          prefetch(router, href, as, {
            locale,
            priority: true,
            // @see {https://github.com/vercel/next.js/discussions/40268?sort=top#discussioncomment-3572642}
            bypassPrefetchedCheck: true
          });
        },
        onTouchStart: process.env.__NEXT_LINK_NO_TOUCH_START ? void 0 : function onTouchStart(e) {
          if (!legacyBehavior && typeof onTouchStartProp === "function") {
            onTouchStartProp(e);
          }
          if (legacyBehavior && child.props && typeof child.props.onTouchStart === "function") {
            child.props.onTouchStart(e);
          }
          if (!router) {
            return;
          }
          prefetch(router, href, as, {
            locale,
            priority: true,
            // @see {https://github.com/vercel/next.js/discussions/40268?sort=top#discussioncomment-3572642}
            bypassPrefetchedCheck: true
          });
        }
      };
      if ((0, _utils.isAbsoluteUrl)(as)) {
        childProps.href = as;
      } else if (!legacyBehavior || passHref || child.type === "a" && !("href" in child.props)) {
        const curLocale = typeof locale !== "undefined" ? locale : router?.locale;
        const localeDomain = router?.isLocaleDomain && (0, _getdomainlocale.getDomainLocale)(as, curLocale, router?.locales, router?.domainLocales);
        childProps.href = localeDomain || (0, _addbasepath.addBasePath)((0, _addlocale.addLocale)(as, curLocale, router?.defaultLocale));
      }
      if (legacyBehavior) {
        if (process.env.NODE_ENV === "development") {
          const { errorOnce } = require_error_once();
          errorOnce("`legacyBehavior` is deprecated and will be removed in a future release. A codemod is available to upgrade your components:\n\nnpx @next/codemod@latest new-link .\n\nLearn more: https://nextjs.org/docs/app/building-your-application/upgrading/codemods#remove-a-tags-from-link-components");
        }
        return /* @__PURE__ */ _react.default.cloneElement(child, childProps);
      }
      return /* @__PURE__ */ (0, _jsxruntime.jsx)("a", {
        ...restProps,
        ...childProps,
        children
      });
    });
    var LinkStatusContext = /* @__PURE__ */ (0, _react.createContext)({
      // We do not support link status in the Pages Router, so we always return false
      pending: false
    });
    var useLinkStatus = () => {
      return (0, _react.useContext)(LinkStatusContext);
    };
    var _default = Link2;
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/link.js
var require_link2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/link.js"(exports, module) {
    "use strict";
    module.exports = require_link();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js
var require_app_router_context_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js"(exports) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      AppRouterContext: function() {
        return AppRouterContext;
      },
      GlobalLayoutRouterContext: function() {
        return GlobalLayoutRouterContext;
      },
      LayoutRouterContext: function() {
        return LayoutRouterContext;
      },
      MissingSlotContext: function() {
        return MissingSlotContext;
      },
      TemplateContext: function() {
        return TemplateContext;
      }
    });
    var _interop_require_default = require_interop_require_default();
    var _react = /* @__PURE__ */ _interop_require_default._(__require("react"));
    var AppRouterContext = _react.default.createContext(null);
    var LayoutRouterContext = _react.default.createContext(null);
    var GlobalLayoutRouterContext = _react.default.createContext(null);
    var TemplateContext = _react.default.createContext(null);
    if (process.env.NODE_ENV !== "production") {
      AppRouterContext.displayName = "AppRouterContext";
      LayoutRouterContext.displayName = "LayoutRouterContext";
      GlobalLayoutRouterContext.displayName = "GlobalLayoutRouterContext";
      TemplateContext.displayName = "TemplateContext";
    }
    var MissingSlotContext = _react.default.createContext(/* @__PURE__ */ new Set());
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/readonly-url-search-params.js
var require_readonly_url_search_params = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/readonly-url-search-params.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ReadonlyURLSearchParams", {
      enumerable: true,
      get: function() {
        return ReadonlyURLSearchParams;
      }
    });
    var ReadonlyURLSearchParamsError = class extends Error {
      constructor() {
        super("Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams");
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
          value: "E1174",
          enumerable: false,
          configurable: true
        });
      }
    };
    var ReadonlyURLSearchParams = class extends URLSearchParams {
      /** @deprecated Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams */
      append() {
        throw new ReadonlyURLSearchParamsError();
      }
      /** @deprecated Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams */
      delete() {
        throw new ReadonlyURLSearchParamsError();
      }
      /** @deprecated Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams */
      set() {
        throw new ReadonlyURLSearchParamsError();
      }
      /** @deprecated Method unavailable on `ReadonlyURLSearchParams`. Read more: https://nextjs.org/docs/app/api-reference/functions/use-search-params#updating-searchparams */
      sort() {
        throw new ReadonlyURLSearchParamsError();
      }
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.js
var require_hooks_client_context_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.js"(exports) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      NavigationPromisesContext: function() {
        return NavigationPromisesContext;
      },
      PathParamsContext: function() {
        return PathParamsContext;
      },
      PathnameContext: function() {
        return PathnameContext;
      },
      ReadonlyURLSearchParams: function() {
        return _readonlyurlsearchparams.ReadonlyURLSearchParams;
      },
      SearchParamsContext: function() {
        return SearchParamsContext;
      },
      createDevToolsInstrumentedPromise: function() {
        return createDevToolsInstrumentedPromise;
      }
    });
    var _react = __require("react");
    var _readonlyurlsearchparams = require_readonly_url_search_params();
    var SearchParamsContext = (0, _react.createContext)(null);
    var PathnameContext = (0, _react.createContext)(null);
    var PathParamsContext = (0, _react.createContext)(null);
    var NavigationPromisesContext = (0, _react.createContext)(null);
    function createDevToolsInstrumentedPromise(displayName, value) {
      const promise = Promise.resolve(value);
      promise.status = "fulfilled";
      promise.value = value;
      promise.displayName = `${displayName} (SSR)`;
      return promise;
    }
    if (process.env.NODE_ENV !== "production") {
      SearchParamsContext.displayName = "SearchParamsContext";
      PathnameContext.displayName = "PathnameContext";
      PathParamsContext.displayName = "PathParamsContext";
      NavigationPromisesContext.displayName = "NavigationPromisesContext";
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/hooks-server-context.js
var require_hooks_server_context = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/hooks-server-context.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      DynamicServerError: function() {
        return DynamicServerError;
      },
      isDynamicServerError: function() {
        return isDynamicServerError;
      }
    });
    var DYNAMIC_ERROR_CODE = "DYNAMIC_SERVER_USAGE";
    var DynamicServerError = class extends Error {
      constructor(description) {
        super(`Dynamic server usage: ${description}`), this.description = description, this.digest = DYNAMIC_ERROR_CODE;
      }
    };
    function isDynamicServerError(err) {
      if (typeof err !== "object" || err === null || !("digest" in err) || typeof err.digest !== "string") {
        return false;
      }
      return err.digest === DYNAMIC_ERROR_CODE;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/static-generation-bailout.js
var require_static_generation_bailout = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/static-generation-bailout.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      StaticGenBailoutError: function() {
        return StaticGenBailoutError;
      },
      isStaticGenBailoutError: function() {
        return isStaticGenBailoutError;
      }
    });
    var NEXT_STATIC_GEN_BAILOUT = "NEXT_STATIC_GEN_BAILOUT";
    var StaticGenBailoutError = class extends Error {
      constructor(...args) {
        super(...args), this.code = NEXT_STATIC_GEN_BAILOUT;
      }
    };
    function isStaticGenBailoutError(error) {
      if (typeof error !== "object" || error === null || !("code" in error)) {
        return false;
      }
      return error.code === NEXT_STATIC_GEN_BAILOUT;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/async-local-storage.js
var require_async_local_storage = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/async-local-storage.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      bindSnapshot: function() {
        return bindSnapshot;
      },
      createAsyncLocalStorage: function() {
        return createAsyncLocalStorage;
      },
      createSnapshot: function() {
        return createSnapshot;
      }
    });
    var sharedAsyncLocalStorageNotAvailableError = Object.defineProperty(new Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"), "__NEXT_ERROR_CODE", {
      value: "E504",
      enumerable: false,
      configurable: true
    });
    var FakeAsyncLocalStorage = class {
      disable() {
        throw sharedAsyncLocalStorageNotAvailableError;
      }
      getStore() {
        return void 0;
      }
      run() {
        throw sharedAsyncLocalStorageNotAvailableError;
      }
      exit() {
        throw sharedAsyncLocalStorageNotAvailableError;
      }
      enterWith() {
        throw sharedAsyncLocalStorageNotAvailableError;
      }
      static bind(fn) {
        return fn;
      }
    };
    var maybeGlobalAsyncLocalStorage = typeof globalThis !== "undefined" && globalThis.AsyncLocalStorage;
    function createAsyncLocalStorage() {
      if (maybeGlobalAsyncLocalStorage) {
        return new maybeGlobalAsyncLocalStorage();
      }
      return new FakeAsyncLocalStorage();
    }
    function bindSnapshot(fn) {
      if (maybeGlobalAsyncLocalStorage) {
        return maybeGlobalAsyncLocalStorage.bind(fn);
      }
      return FakeAsyncLocalStorage.bind(fn);
    }
    function createSnapshot() {
      if (maybeGlobalAsyncLocalStorage) {
        return maybeGlobalAsyncLocalStorage.snapshot();
      }
      return function(fn, ...args) {
        return fn(...args);
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-unit-async-storage-instance.js
var require_work_unit_async_storage_instance = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-unit-async-storage-instance.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "workUnitAsyncStorageInstance", {
      enumerable: true,
      get: function() {
        return workUnitAsyncStorageInstance;
      }
    });
    var _asynclocalstorage = require_async_local_storage();
    var workUnitAsyncStorageInstance = (0, _asynclocalstorage.createAsyncLocalStorage)();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-unit-async-storage.external.js
var require_work_unit_async_storage_external = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-unit-async-storage.external.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getCacheSignal: function() {
        return getCacheSignal;
      },
      getDraftModeProviderForCacheScope: function() {
        return getDraftModeProviderForCacheScope;
      },
      getHmrRefreshHash: function() {
        return getHmrRefreshHash;
      },
      getResumeDataCache: function() {
        return getResumeDataCache;
      },
      getServerComponentsHmrCache: function() {
        return getServerComponentsHmrCache;
      },
      getStagedRenderingController: function() {
        return getStagedRenderingController;
      },
      getVaryParamsAccumulator: function() {
        return getVaryParamsAccumulator;
      },
      isHmrRefresh: function() {
        return isHmrRefresh;
      },
      throwForMissingRequestStore: function() {
        return throwForMissingRequestStore;
      },
      throwInvariantForMissingStore: function() {
        return throwInvariantForMissingStore;
      },
      workUnitAsyncStorage: function() {
        return _workunitasyncstorageinstance.workUnitAsyncStorageInstance;
      }
    });
    var _workunitasyncstorageinstance = require_work_unit_async_storage_instance();
    var _invarianterror = require_invariant_error();
    function throwForMissingRequestStore(callingExpression) {
      throw Object.defineProperty(new Error(`\`${callingExpression}\` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context`), "__NEXT_ERROR_CODE", {
        value: "E251",
        enumerable: false,
        configurable: true
      });
    }
    function throwInvariantForMissingStore() {
      throw Object.defineProperty(new _invarianterror.InvariantError("Expected workUnitAsyncStorage to have a store."), "__NEXT_ERROR_CODE", {
        value: "E696",
        enumerable: false,
        configurable: true
      });
    }
    function getResumeDataCache(workUnitStore) {
      switch (workUnitStore.type) {
        case "request":
        case "prerender":
        case "prerender-runtime":
        case "prerender-client":
        case "validation-client":
        case "prerender-ppr":
          return workUnitStore.resumeDataCache;
        case "cache":
        case "private-cache":
        case "unstable-cache":
        case "prerender-legacy":
        case "generate-static-params":
          return null;
        default:
          return workUnitStore;
      }
    }
    function getHmrRefreshHash(workUnitStore) {
      if (process.env.__NEXT_DEV_SERVER) {
        switch (workUnitStore.type) {
          case "cache":
          case "private-cache":
          case "prerender":
          case "prerender-runtime":
          case "request":
            return workUnitStore.hmrRefreshHash;
          case "prerender-client":
          case "validation-client":
          case "prerender-ppr":
          case "prerender-legacy":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return void 0;
    }
    function isHmrRefresh(workUnitStore) {
      if (process.env.__NEXT_DEV_SERVER) {
        switch (workUnitStore.type) {
          case "cache":
          case "private-cache":
          case "request":
            return workUnitStore.isHmrRefresh ?? false;
          case "prerender":
          case "prerender-client":
          case "validation-client":
          case "prerender-runtime":
          case "prerender-ppr":
          case "prerender-legacy":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return false;
    }
    function getServerComponentsHmrCache(workUnitStore) {
      if (process.env.__NEXT_DEV_SERVER) {
        switch (workUnitStore.type) {
          case "cache":
          case "private-cache":
          case "request":
            return workUnitStore.serverComponentsHmrCache;
          case "prerender":
          case "prerender-client":
          case "validation-client":
          case "prerender-runtime":
          case "prerender-ppr":
          case "prerender-legacy":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return void 0;
    }
    function getDraftModeProviderForCacheScope(workStore, workUnitStore) {
      if (workStore.isDraftMode) {
        switch (workUnitStore.type) {
          case "cache":
          case "private-cache":
          case "unstable-cache":
          case "prerender-runtime":
          case "request":
            return workUnitStore.draftMode;
          case "prerender":
          case "prerender-client":
          case "validation-client":
          case "prerender-ppr":
          case "prerender-legacy":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return void 0;
    }
    function getStagedRenderingController(workUnitStore) {
      switch (workUnitStore.type) {
        case "request":
        case "prerender-runtime":
        case "prerender":
          return workUnitStore.stagedRendering ?? null;
        case "prerender-client":
        case "validation-client":
        case "prerender-ppr":
        case "prerender-legacy":
        case "cache":
        case "private-cache":
        case "unstable-cache":
        case "generate-static-params":
          return null;
        default:
          return workUnitStore;
      }
    }
    function getCacheSignal(workUnitStore) {
      switch (workUnitStore.type) {
        case "prerender":
        case "prerender-client":
        case "validation-client":
        case "prerender-runtime":
          return workUnitStore.cacheSignal;
        case "request": {
          if (workUnitStore.cacheSignal) {
            return workUnitStore.cacheSignal;
          }
        }
        case "prerender-ppr":
        case "prerender-legacy":
        case "cache":
        case "private-cache":
        case "unstable-cache":
        case "generate-static-params":
          return null;
        default:
          return workUnitStore;
      }
    }
    function getVaryParamsAccumulator(workUnitStore) {
      switch (workUnitStore.type) {
        case "prerender":
        case "prerender-runtime":
        case "request": {
          return workUnitStore.varyParamsAccumulator ?? null;
        }
        case "prerender-ppr":
        case "prerender-legacy":
        case "cache":
        case "private-cache":
        case "prerender-client":
        case "validation-client":
        case "unstable-cache":
        case "generate-static-params":
          return null;
        default:
          workUnitStore;
          return null;
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-async-storage-instance.js
var require_work_async_storage_instance = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-async-storage-instance.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "workAsyncStorageInstance", {
      enumerable: true,
      get: function() {
        return workAsyncStorageInstance;
      }
    });
    var _asynclocalstorage = require_async_local_storage();
    var workAsyncStorageInstance = (0, _asynclocalstorage.createAsyncLocalStorage)();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-async-storage.external.js
var require_work_async_storage_external = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/work-async-storage.external.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "workAsyncStorage", {
      enumerable: true,
      get: function() {
        return _workasyncstorageinstance.workAsyncStorageInstance;
      }
    });
    var _workasyncstorageinstance = require_work_async_storage_instance();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/promise-with-resolvers.js
var require_promise_with_resolvers = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/promise-with-resolvers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "createPromiseWithResolvers", {
      enumerable: true,
      get: function() {
        return createPromiseWithResolvers;
      }
    });
    function createPromiseWithResolvers() {
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return {
        resolve,
        reject,
        promise
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/staged-rendering.js
var require_staged_rendering = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/staged-rendering.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      RENDER_STAGE_ADVANCE_ORDER: function() {
        return RENDER_STAGE_ADVANCE_ORDER;
      },
      RenderStage: function() {
        return RenderStage;
      },
      StagedRenderingController: function() {
        return StagedRenderingController;
      },
      SyncIOMode: function() {
        return SyncIOMode;
      },
      getNextStage: function() {
        return getNextStage;
      },
      isAdvanceableRenderStage: function() {
        return isAdvanceableRenderStage;
      }
    });
    var _invarianterror = require_invariant_error();
    var _promisewithresolvers = require_promise_with_resolvers();
    var RenderStage = /* @__PURE__ */ (function(RenderStage2) {
      RenderStage2[RenderStage2["Before"] = 1] = "Before";
      RenderStage2[RenderStage2["ShellStatic"] = 11] = "ShellStatic";
      RenderStage2[RenderStage2["Static"] = 13] = "Static";
      RenderStage2[RenderStage2["ShellRuntime"] = 21] = "ShellRuntime";
      RenderStage2[RenderStage2["Runtime"] = 23] = "Runtime";
      RenderStage2[RenderStage2["Dynamic"] = 30] = "Dynamic";
      RenderStage2[RenderStage2["Abandoned"] = 40] = "Abandoned";
      return RenderStage2;
    })({});
    var RENDER_STAGE_ADVANCE_ORDER = [
      11,
      13,
      21,
      23,
      30
    ];
    function getNextStage(stage) {
      return RENDER_STAGE_ADVANCE_ORDER[RENDER_STAGE_ADVANCE_ORDER.indexOf(stage) + 1];
    }
    function isAdvanceableRenderStage(stage) {
      return 1 < stage && stage <= 30;
    }
    var SyncIOMode = /* @__PURE__ */ (function(SyncIOMode2) {
      SyncIOMode2[SyncIOMode2["Untracked"] = 1] = "Untracked";
      SyncIOMode2[SyncIOMode2["AllowedInRuntimeOrDynamic"] = 2] = "AllowedInRuntimeOrDynamic";
      SyncIOMode2[SyncIOMode2["AllowedInDynamic"] = 3] = "AllowedInDynamic";
      return SyncIOMode2;
    })({});
    var StagedRenderingController = class {
      constructor({ abortSignal, abandonController, syncIO, finalStage }) {
        this.currentStage = 1;
        this.syncInterruptReason = null;
        this.triggers = {
          [11]: createStageTrigger(),
          [13]: createStageTrigger(),
          //
          [21]: createStageTrigger(),
          [23]: createStageTrigger(),
          //
          [30]: createStageTrigger()
        };
        this.abortSignal = abortSignal;
        this.abandonController = abandonController;
        this.syncIOMode = syncIO;
        this.finalStage = finalStage;
        if (abortSignal) {
          abortSignal.addEventListener("abort", () => {
            const { reason } = abortSignal;
            for (const trigger of Object.values(this.triggers)) {
              cancelStageTrigger(trigger, reason);
            }
          }, {
            once: true
          });
        }
        if (abandonController) {
          abandonController.signal.addEventListener("abort", () => {
            this.abandonRender();
          }, {
            once: true
          });
        }
      }
      onStage(stage, callback) {
        addSyncTriggerListener(this.triggers[stage], callback);
      }
      shouldTrackSyncInterrupt() {
        if (this.syncIOMode === 1) {
          return false;
        }
        switch (this.currentStage) {
          case 1:
            return false;
          case 11:
          case 13:
            return true;
          case 21:
          case 23: {
            switch (this.syncIOMode) {
              case 2: {
                return false;
              }
              case 3: {
                return true;
              }
            }
          }
          case 30:
          case 40:
            return false;
          default:
            this.currentStage;
            return false;
        }
      }
      /** Note: only call this if `shouldTrackSyncInterrupt()` returned true */
      syncInterruptCurrentStageWithReason(reason) {
        const { currentStage } = this;
        if (currentStage === 1 || currentStage === 30 || currentStage === 40) {
          return;
        }
        if (this.abandonController) {
          this.abandonController.abort();
          return;
        }
        if (this.abortSignal) {
          this.syncInterruptReason = reason;
          this.currentStage = 40;
          return;
        }
        this.syncInterruptReason = reason;
        this.advanceStage(30);
      }
      getSyncInterruptReason() {
        return this.syncInterruptReason;
      }
      getStageEndTime(stage) {
        return this.triggers[getNextStage(stage)].triggeredAt ?? Infinity;
      }
      abandonRender() {
        const { currentStage } = this;
        if (currentStage === 1) {
          throw Object.defineProperty(new _invarianterror.InvariantError("A render that hasn't started yet cannot be abandoned"), "__NEXT_ERROR_CODE", {
            value: "E1300",
            enumerable: false,
            configurable: true
          });
        }
        if (currentStage === 30 || currentStage === 40) {
          return;
        }
        const nextStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(currentStage) + 1;
        const dynamicStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(30);
        for (let i = nextStageIx; i < dynamicStageIx; i++) {
          this.resolveStage(RENDER_STAGE_ADVANCE_ORDER[i]);
        }
        this.currentStage = 40;
      }
      advanceStage(targetStage) {
        if (this.finalStage !== null && targetStage > this.finalStage) {
          throw Object.defineProperty(new _invarianterror.InvariantError(`Attempted to advance to stage ${RenderStage[targetStage]} but the render is limited to ${RenderStage[this.finalStage]}`), "__NEXT_ERROR_CODE", {
            value: "E1302",
            enumerable: false,
            configurable: true
          });
        }
        const { currentStage } = this;
        if (currentStage === 30 || currentStage === 40) {
          return;
        }
        if (targetStage <= currentStage) {
          return;
        }
        this.currentStage = targetStage;
        const nextStageIx = currentStage === 1 ? 0 : RENDER_STAGE_ADVANCE_ORDER.indexOf(currentStage) + 1;
        const targetStageIx = RENDER_STAGE_ADVANCE_ORDER.indexOf(targetStage);
        for (let i = nextStageIx; i <= targetStageIx; i++) {
          this.resolveStage(RENDER_STAGE_ADVANCE_ORDER[i]);
        }
      }
      resolveStage(stage) {
        fireStageTrigger(this.triggers[stage]);
      }
      getStagePromise(stage) {
        return this.triggers[stage].promise;
      }
      waitForStage(stage) {
        return this.getStagePromise(stage);
      }
      delayUntilStage(stage, displayName, resolvedValue) {
        const stagePromise = this.getStagePromise(stage);
        const promise = process.env.NODE_ENV === "development" ? makeDevtoolsIOPromiseFromIOTrigger(stagePromise, displayName, resolvedValue) : stagePromise.then(() => resolvedValue);
        if (this.abortSignal) {
          promise.catch(ignoreReject);
        }
        return promise;
      }
    };
    function ignoreReject() {
    }
    function makeDevtoolsIOPromiseFromIOTrigger(ioTrigger, displayName, resolvedValue) {
      const promise = new Promise((resolve, reject) => {
        ioTrigger.then(resolve.bind(null, resolvedValue), reject);
      });
      if (displayName !== void 0) {
        promise.displayName = displayName;
      }
      return promise;
    }
    function addSyncTriggerListener(trigger, listener) {
      if (trigger.state === "pending") {
        trigger._listeners.push(listener);
      } else {
        listener();
      }
    }
    function createStageTrigger() {
      const { promise, resolve, reject } = (0, _promisewithresolvers.createPromiseWithResolvers)();
      return {
        state: "pending",
        triggeredAt: null,
        promise,
        _listeners: [],
        _resolvePromise: resolve,
        _rejectPromise: reject
      };
    }
    function fireStageTrigger(trigger) {
      if (trigger.state !== "pending") {
        return;
      }
      trigger.state = "triggered";
      trigger.triggeredAt = performance.now() + performance.timeOrigin;
      try {
        const { _listeners: listeners } = trigger;
        for (let i = 0; i < listeners.length; i++) {
          listeners[i]();
        }
        listeners.length = 0;
      } finally {
        trigger._resolvePromise();
      }
    }
    function cancelStageTrigger(trigger, reason) {
      if (trigger.state !== "pending") {
        return;
      }
      trigger.state = "cancelled";
      trigger._listeners.length = 0;
      trigger.promise.catch(ignoreReject);
      trigger._rejectPromise(reason);
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/runtime-reacts.external.js
var require_runtime_reacts_external = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/runtime-reacts.external.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getClientReact: function() {
        return getClientReact;
      },
      getServerReact: function() {
        return getServerReact;
      },
      registerClientReact: function() {
        return registerClientReact;
      },
      registerServerReact: function() {
        return registerServerReact;
      }
    });
    var ClientReact = null;
    function registerClientReact(react) {
      ClientReact = react;
    }
    function getClientReact() {
      return ClientReact;
    }
    var ServerReact = null;
    function registerServerReact(react) {
      ServerReact = react;
    }
    function getServerReact() {
      return ServerReact;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/dynamic-rendering-utils.js
var require_dynamic_rendering_utils = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/dynamic-rendering-utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      ClientHookDynamicError: function() {
        return ClientHookDynamicError;
      },
      RENDER_STAGES_BY_DATA_KIND: function() {
        return RENDER_STAGES_BY_DATA_KIND;
      },
      applyOwnerStack: function() {
        return applyOwnerStack;
      },
      isClientHookDynamicError: function() {
        return isClientHookDynamicError;
      },
      isHangingPromiseRejectionError: function() {
        return isHangingPromiseRejectionError;
      },
      makeClientHookHangingPromise: function() {
        return makeClientHookHangingPromise;
      },
      makeDevtoolsIOAwarePromise: function() {
        return makeDevtoolsIOAwarePromise;
      },
      makeDynamicHangingPromise: function() {
        return makeDynamicHangingPromise;
      },
      makeFallbackParamsHangingPromise: function() {
        return makeFallbackParamsHangingPromise;
      },
      makePromiseFromTrigger: function() {
        return makePromiseFromTrigger;
      },
      makeRuntimeHangingPromise: function() {
        return makeRuntimeHangingPromise;
      },
      makeStageHangingPromise: function() {
        return makeStageHangingPromise;
      },
      makeUntrackedHangingPromise: function() {
        return makeUntrackedHangingPromise;
      },
      trackFallbackParamsAccessed: function() {
        return trackFallbackParamsAccessed;
      },
      trackRuntimeDataAccessed: function() {
        return trackRuntimeDataAccessed;
      }
    });
    var _stagedrendering = require_staged_rendering();
    var _workunitasyncstorageexternal = require_work_unit_async_storage_external();
    var _runtimereactsexternal = require_runtime_reacts_external();
    function isHangingPromiseRejectionError(err) {
      if (typeof err !== "object" || err === null || !("digest" in err)) {
        return false;
      }
      return err.digest === HANGING_PROMISE_REJECTION;
    }
    var HANGING_PROMISE_REJECTION = "HANGING_PROMISE_REJECTION";
    var HangingPromiseRejectionError = class extends Error {
      constructor(route, expression) {
        super(`During prerendering, ${expression} rejects when the prerender is complete. Typically these errors are handled by React but if you move ${expression} to a different context by using \`setTimeout\`, \`after\`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "${route}".`), this.route = route, this.expression = expression, this.digest = HANGING_PROMISE_REJECTION;
      }
    };
    var CLIENT_HOOK_DYNAMIC = "CLIENT_HOOK_DYNAMIC";
    var ClientHookDynamicError = class extends Error {
      constructor(route, expression) {
        super(`Route "${route}": Next.js encountered URL data \`${expression}\` in a Client Component outside of \`<Suspense>\`.

This blocks prerendering because the value is only available at runtime.

Ways to fix this:
  - [stream] Wrap the component in \`<Suspense fallback={...}>\` so the hook value streams in after prerendering
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-client-hook`), this.digest = CLIENT_HOOK_DYNAMIC;
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
          value: "E1433",
          enumerable: false,
          configurable: true
        });
      }
    };
    function isClientHookDynamicError(err) {
      if (typeof err !== "object" || err === null || !("digest" in err)) {
        return false;
      }
      return err.digest === CLIENT_HOOK_DYNAMIC;
    }
    var abortListenersBySignal = /* @__PURE__ */ new WeakMap();
    function makeDynamicHangingPromise(signal, route, expression) {
      return makeHangingPromiseWithError(signal, new HangingPromiseRejectionError(route, expression));
    }
    function makeUntrackedHangingPromise(signal, route, expression) {
      return makeHangingPromiseWithError(signal, new HangingPromiseRejectionError(route, expression));
    }
    function makeRuntimeHangingPromise(signal, route, expression, workUnitStore) {
      if (workUnitStore !== null) {
        trackRuntimeDataAccessed(workUnitStore);
      }
      return makeHangingPromiseWithError(signal, new HangingPromiseRejectionError(route, expression));
    }
    function makeFallbackParamsHangingPromise(signal, route, expression, workUnitStore) {
      if (workUnitStore !== null) {
        trackFallbackParamsAccessed(workUnitStore);
      }
      return makeHangingPromiseWithError(signal, new HangingPromiseRejectionError(route, expression));
    }
    function makeStageHangingPromise(signal, route, expression, workUnitStore) {
      trackRuntimeDataAccessed(workUnitStore);
      return makeHangingPromiseWithError(signal, new HangingPromiseRejectionError(route, expression));
    }
    function trackRuntimeDataAccessed(workUnitStore) {
      trackRuntimeDataAccessedImpl(workUnitStore, false);
    }
    function trackFallbackParamsAccessed(workUnitStore) {
      trackRuntimeDataAccessedImpl(workUnitStore, true);
    }
    function trackRuntimeDataAccessedImpl(workUnitStore, isFallbackParamAccess) {
      switch (workUnitStore.type) {
        case "prerender": {
          var _workUnitStore_runtimeDataAccessed;
          (_workUnitStore_runtimeDataAccessed = workUnitStore.runtimeDataAccessed) == null ? void 0 : _workUnitStore_runtimeDataAccessed.resolve(true);
          const hintCell = workUnitStore.shouldAttemptStaticPrefetch;
          if (hintCell !== null && (!isFallbackParamAccess || !workUnitStore.isFallbackUpgradeable)) {
            hintCell.current = false;
          }
          break;
        }
        case "prerender-client":
        case "prerender-ppr":
        case "prerender-legacy":
        case "prerender-runtime":
        case "validation-client":
        case "request":
        case "cache":
        case "private-cache":
        case "unstable-cache":
        case "generate-static-params":
          break;
        default:
          workUnitStore;
      }
    }
    function makeClientHookHangingPromise(signal, error) {
      return makeHangingPromiseWithError(signal, error);
    }
    function makeHangingPromiseWithError(signal, error) {
      if (signal.aborted) {
        return Promise.reject(error);
      } else {
        const hangingPromise = new Promise((_, reject) => {
          const boundRejection = reject.bind(null, error);
          let currentListeners = abortListenersBySignal.get(signal);
          if (currentListeners) {
            currentListeners.push(boundRejection);
          } else {
            const listeners = [
              boundRejection
            ];
            abortListenersBySignal.set(signal, listeners);
            signal.addEventListener("abort", () => {
              for (let i = 0; i < listeners.length; i++) {
                listeners[i]();
              }
            }, {
              once: true
            });
          }
        });
        hangingPromise.catch(ignoreReject);
        return hangingPromise;
      }
    }
    function ignoreReject() {
    }
    function makePromiseFromTrigger(trigger, value) {
      const promise = trigger.then(() => value);
      promise.catch(ignoreReject);
      return promise;
    }
    function makeDevtoolsIOAwarePromise(underlying, requestStore, stage) {
      if (requestStore.stagedRendering) {
        return requestStore.stagedRendering.delayUntilStage(stage, void 0, underlying);
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(underlying);
        }, 0);
      });
    }
    var RENDER_STAGES_BY_DATA_KIND = {
      sessionData: _stagedrendering.RenderStage.ShellRuntime,
      staticLinkData: _stagedrendering.RenderStage.Static,
      runtimeLinkData: _stagedrendering.RenderStage.Runtime
    };
    function applyOwnerStack(error) {
      if (process.env.NODE_ENV !== "production") {
        var _getClientReact_captureOwnerStack, _getClientReact, _getServerReact_captureOwnerStack, _getServerReact;
        let ownerStack;
        const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
        const innerOwnerStack = ((_getClientReact = (0, _runtimereactsexternal.getClientReact)()) == null ? void 0 : (_getClientReact_captureOwnerStack = _getClientReact.captureOwnerStack) == null ? void 0 : _getClientReact_captureOwnerStack.call(_getClientReact)) ?? ((_getServerReact = (0, _runtimereactsexternal.getServerReact)()) == null ? void 0 : (_getServerReact_captureOwnerStack = _getServerReact.captureOwnerStack) == null ? void 0 : _getServerReact_captureOwnerStack.call(_getServerReact));
        switch (workUnitStore == null ? void 0 : workUnitStore.type) {
          case "cache":
          case "private-cache":
            ownerStack = (innerOwnerStack || "") + (workUnitStore.outerOwnerStack || "") || void 0;
            break;
          case "unstable-cache":
          case "request":
          case "prerender":
          case "prerender-ppr":
          case "prerender-legacy":
          case "prerender-runtime":
          case "prerender-client":
          case "validation-client":
          case "generate-static-params":
          case void 0:
            ownerStack = innerOwnerStack;
            break;
          default:
            workUnitStore;
        }
        if (ownerStack) {
          let stack = ownerStack;
          if (error.stack) {
            const frames = [];
            for (const frame of error.stack.split("\n").slice(1)) {
              if (frame.includes("react_stack_bottom_frame")) {
                break;
              }
              frames.push(frame);
            }
            stack = "\n" + frames.join("\n") + stack;
          }
          error.stack = error.name + ": " + error.message + stack;
        }
      }
      return error;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/framework/boundary-constants.js
var require_boundary_constants = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/framework/boundary-constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      METADATA_BOUNDARY_NAME: function() {
        return METADATA_BOUNDARY_NAME;
      },
      OUTLET_BOUNDARY_NAME: function() {
        return OUTLET_BOUNDARY_NAME;
      },
      ROOT_LAYOUT_BOUNDARY_NAME: function() {
        return ROOT_LAYOUT_BOUNDARY_NAME;
      },
      VIEWPORT_BOUNDARY_NAME: function() {
        return VIEWPORT_BOUNDARY_NAME;
      }
    });
    var METADATA_BOUNDARY_NAME = "__next_metadata_boundary__";
    var VIEWPORT_BOUNDARY_NAME = "__next_viewport_boundary__";
    var OUTLET_BOUNDARY_NAME = "__next_outlet_boundary__";
    var ROOT_LAYOUT_BOUNDARY_NAME = "__next_root_layout_boundary__";
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/scheduler.js
var require_scheduler = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/lib/scheduler.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      atLeastOneTask: function() {
        return atLeastOneTask;
      },
      scheduleImmediate: function() {
        return scheduleImmediate;
      },
      scheduleOnNextTick: function() {
        return scheduleOnNextTick;
      },
      waitAtLeastOneReactRenderTask: function() {
        return waitAtLeastOneReactRenderTask;
      }
    });
    var scheduleOnNextTick = (cb) => {
      Promise.resolve().then(() => {
        if (process.env.NEXT_RUNTIME === "edge") {
          setTimeout(cb, 0);
        } else {
          process.nextTick(cb);
        }
      });
    };
    var scheduleImmediate = (cb) => {
      if (process.env.NEXT_RUNTIME === "edge") {
        setTimeout(cb, 0);
      } else {
        setImmediate(cb);
      }
    };
    function atLeastOneTask() {
      return new Promise((resolve) => scheduleImmediate(resolve));
    }
    function waitAtLeastOneReactRenderTask() {
      if (process.env.NEXT_RUNTIME === "edge") {
        return new Promise((r) => setTimeout(r, 0));
      } else {
        return new Promise((r) => setImmediate(r));
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js
var require_bailout_to_csr = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      BailoutToCSRError: function() {
        return BailoutToCSRError;
      },
      isBailoutToCSRError: function() {
        return isBailoutToCSRError;
      }
    });
    var BAILOUT_TO_CSR = "BAILOUT_TO_CLIENT_SIDE_RENDERING";
    var BailoutToCSRError = class extends Error {
      constructor(reason) {
        super(`Bail out to client-side rendering: ${reason}`), this.reason = reason, this.digest = BAILOUT_TO_CSR;
      }
    };
    function isBailoutToCSRError(err) {
      if (typeof err !== "object" || err === null || !("digest" in err)) {
        return false;
      }
      return err.digest === BAILOUT_TO_CSR;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/blocking-route-messages.js
var require_blocking_route_messages = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/blocking-route-messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      createDynamicBodyError: function() {
        return createDynamicBodyError;
      },
      createDynamicBodyErrorInNavigation: function() {
        return createDynamicBodyErrorInNavigation;
      },
      createDynamicMetadataError: function() {
        return createDynamicMetadataError;
      },
      createDynamicOrRuntimeBodyError: function() {
        return createDynamicOrRuntimeBodyError;
      },
      createDynamicOrRuntimeMetadataError: function() {
        return createDynamicOrRuntimeMetadataError;
      },
      createDynamicOrRuntimeViewportError: function() {
        return createDynamicOrRuntimeViewportError;
      },
      createDynamicViewportError: function() {
        return createDynamicViewportError;
      },
      createLinkBodyErrorInNavigation: function() {
        return createLinkBodyErrorInNavigation;
      },
      createLinkMetadataError: function() {
        return createLinkMetadataError;
      },
      createLinkViewportError: function() {
        return createLinkViewportError;
      },
      createRuntimeBodyError: function() {
        return createRuntimeBodyError;
      },
      createRuntimeBodyErrorInNavigation: function() {
        return createRuntimeBodyErrorInNavigation;
      },
      createRuntimeMetadataError: function() {
        return createRuntimeMetadataError;
      },
      createRuntimeViewportError: function() {
        return createRuntimeViewportError;
      },
      logBuildDebugHint: function() {
        return logBuildDebugHint;
      }
    });
    function createRuntimeBodyError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data during prerendering.

\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1427",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicBodyError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data during prerendering.

\`fetch(...)\` or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [cache] Cache the data access with \`"use cache"\` (does not apply to \`connection()\`)
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1440",
        enumerable: false,
        configurable: true
      });
    }
    function createRuntimeBodyErrorInNavigation(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data during prerendering or a navigation.

\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed outside of \`<Suspense>\` prevents the route from being prerendered or the navigation from being instant, leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1430",
        enumerable: false,
        configurable: true
      });
    }
    function createLinkBodyErrorInNavigation(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data during prerendering or a navigation.

\`params\` or \`searchParams\` accessed outside of \`<Suspense>\` may prevent the navigation from being instant, leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/instant-shell-url-data`), "__NEXT_ERROR_CODE", {
        value: "E1439",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicBodyErrorInNavigation(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data during prerendering or a navigation.

\`fetch(...)\` or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered or the navigation from being instant, leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [cache] Cache the data access with \`"use cache"\` (does not apply to \`connection()\`)
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1437",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicOrRuntimeBodyError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data during prerendering.

\`fetch(...)\`, \`cookies()\`, \`headers()\`, \`params\`, \`searchParams\`, or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.

Ways to fix this:
  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access
  - [cache] For uncached data (\`fetch\`, database calls): cache the access with \`"use cache"\` (does not apply to \`connection()\`)
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1428",
        enumerable: false,
        configurable: true
      });
    }
    function createLinkMetadataError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data in \`generateMetadata()\`.

This route's metadata is blocked, but the rest of its content can be prefetched. \`params\` or \`searchParams\` accessed in \`generateMetadata()\` prevent it from being prefetched.

Ways to fix this:
  - [static] Use a static metadata export instead of \`generateMetadata()\`
  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1429",
        enumerable: false,
        configurable: true
      });
    }
    function createRuntimeMetadataError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data in \`generateMetadata()\`.

This route's metadata is blocked, but the rest of its content can be prerendered. \`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed in \`generateMetadata()\` cause it to run dynamically.

Ways to fix this:
  - [static] Use a static metadata export instead of \`generateMetadata()\`
  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1423",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicMetadataError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data in \`generateMetadata()\`.

This route's metadata is blocked, but the rest of its content can be prerendered. \`fetch(...)\` or \`connection()\` accessed in \`generateMetadata()\` cause it to run dynamically.

Ways to fix this:
  - [cache] Cache the metadata with \`"use cache"\` in \`generateMetadata()\` (does not apply to \`connection()\`)
  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1425",
        enumerable: false,
        configurable: true
      });
    }
    function createLinkViewportError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data in \`generateViewport()\`.

\`params\` or \`searchParams\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.

Ways to fix this:
  - [static] Use a static viewport export instead of \`generateViewport()\`
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1431",
        enumerable: false,
        configurable: true
      });
    }
    function createRuntimeViewportError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data in \`generateViewport()\`.

\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.

Ways to fix this:
  - [static] Use a static viewport export instead of \`generateViewport()\`
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1424",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicViewportError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data in \`generateViewport()\`.

\`fetch(...)\` or \`connection()\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.

Ways to fix this:
  - [cache] Cache the viewport data with \`"use cache"\` in \`generateViewport()\` (does not apply to \`connection()\`)
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1438",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicOrRuntimeViewportError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data in \`generateViewport()\`.

This prevents the page from being prerendered, leading to a slower user experience. Unlike metadata, viewport cannot be streamed behind \`<Suspense>\` because it affects the initial page load.

Ways to fix this:
  - [static] Use a static viewport export instead of \`generateViewport()\`
  - [cache] For uncached data (\`fetch\`, database calls): cache the viewport with \`"use cache"\` in \`generateViewport()\` (does not apply to \`connection()\`)
  - [block] Set \`export const instant = false\` to allow a blocking route

Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1436",
        enumerable: false,
        configurable: true
      });
    }
    function createDynamicOrRuntimeMetadataError(route) {
      return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data in \`generateMetadata()\`.

This route's metadata is blocked, but the rest of its content can be prerendered.

Ways to fix this:
  - [static] Use a static metadata export instead of \`generateMetadata()\`
  - [cache] Cache the metadata with \`"use cache"\` in \`generateMetadata()\` (does not apply to \`connection()\`)
  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1426",
        enumerable: false,
        configurable: true
      });
    }
    function logBuildDebugHint(route) {
      if (process.env.NODE_ENV !== "development") {
        console.error(`To get a more detailed stack trace and pinpoint the issue, try one of the following:
  - Start the app in development mode by running \`next dev\`, then open "${route}" in your browser to investigate the error.
  - Rerun the production build with \`next build --debug-prerender\` to generate better stack traces.`);
      } else if (!process.env.__NEXT_DEV_SERVER) {
        console.error(`To debug the issue, start the app in development mode by running \`next dev\`, then open "${route}" in your browser to investigate the error.`);
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/boundary-constants.js
var require_boundary_constants2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/boundary-constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      INSTANT_SLOT_MARKER_PREFIX: function() {
        return INSTANT_SLOT_MARKER_PREFIX;
      },
      INSTANT_SLOT_MARKER_SUFFIX: function() {
        return INSTANT_SLOT_MARKER_SUFFIX;
      },
      INSTANT_VALIDATION_BOUNDARY_NAME: function() {
        return INSTANT_VALIDATION_BOUNDARY_NAME;
      }
    });
    var INSTANT_VALIDATION_BOUNDARY_NAME = "__next_instant_validation_boundary__";
    var INSTANT_SLOT_MARKER_PREFIX = "__next_instant_slot_";
    var INSTANT_SLOT_MARKER_SUFFIX = "__";
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/boundary-tracking.js
var require_boundary_tracking = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/boundary-tracking.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      allRequiredBoundariesRendered: function() {
        return allRequiredBoundariesRendered;
      },
      createValidationBoundaryTracking: function() {
        return createValidationBoundaryTracking;
      }
    });
    function createValidationBoundaryTracking() {
      return {
        requiredIds: /* @__PURE__ */ new Map(),
        renderedIds: /* @__PURE__ */ new Set()
      };
    }
    function allRequiredBoundariesRendered(state) {
      for (const id of state.requiredIds.keys()) {
        if (!state.renderedIds.has(id)) {
          return false;
        }
      }
      return true;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/instant-messages.js
var require_instant_messages = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/instant-messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      createLinkPrefetchPartialError: function() {
        return createLinkPrefetchPartialError;
      },
      createUnrenderedSegmentError: function() {
        return createUnrenderedSegmentError;
      }
    });
    function createUnrenderedSegmentError(route, missingFiles) {
      let message = `Route "${route}": Could not validate that a segment in your UI has instant navigation.`;
      if (missingFiles.length > 0) {
        const label = missingFiles.length === 1 ? "Dropped segment" : "Dropped segments";
        message += `

This segment was dropped from rendering. Issues that would prevent instant navigation will go undetected.

${label}:
${missingFiles.map((p) => `  ${p}`).join("\n")}

Ways to fix this:
  - [render] Render the dropped segment
  - [ignore] Set \`export const instant = false\` to opt the dropped segment out of instant-navigation validation

Learn more: https://nextjs.org/docs/messages/instant-unrendered-segment`;
      }
      return Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
        value: "E1286",
        enumerable: false,
        configurable: true
      });
    }
    function createLinkPrefetchPartialError(pathname) {
      return Object.defineProperty(new Error(`Next.js encountered dynamic data during prefetching for "${pathname}".

This will lead to slower, more expensive prefetches.

Ways to fix this:
  - [upgrade] Opt into Partial Prefetching by exporting \`const prefetch = 'partial'\` from the page or layout, or by setting \`partialPrefetching: true\` in next.config to opt the whole app in
  - [disable] Remove \`prefetch={true}\` from the <Link> to use the default prefetch
  - [ignore] Set \`export const instant = false\` to opt the route out of instant-navigation validation

Learn more: https://nextjs.org/docs/messages/instant-link-prefetch-partial`), "__NEXT_ERROR_CODE", {
        value: "E1435",
        enumerable: false,
        configurable: true
      });
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/dynamic-rendering.js
var require_dynamic_rendering = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/dynamic-rendering.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      DynamicHoleKind: function() {
        return DynamicHoleKind;
      },
      Postpone: function() {
        return Postpone;
      },
      PreludeState: function() {
        return PreludeState;
      },
      abortAndThrowOnSynchronousRequestDataAccess: function() {
        return abortAndThrowOnSynchronousRequestDataAccess;
      },
      abortOnSynchronousPlatformIOAccess: function() {
        return abortOnSynchronousPlatformIOAccess;
      },
      accessedDynamicData: function() {
        return accessedDynamicData;
      },
      annotateDynamicAccess: function() {
        return annotateDynamicAccess;
      },
      consumeDynamicAccess: function() {
        return consumeDynamicAccess;
      },
      createDynamicTrackingState: function() {
        return createDynamicTrackingState;
      },
      createDynamicValidationState: function() {
        return createDynamicValidationState;
      },
      createHangingInputAbortSignal: function() {
        return createHangingInputAbortSignal;
      },
      createInstantValidationState: function() {
        return createInstantValidationState;
      },
      createRenderInBrowserAbortSignal: function() {
        return createRenderInBrowserAbortSignal;
      },
      formatDynamicAPIAccesses: function() {
        return formatDynamicAPIAccesses;
      },
      getFirstDynamicReason: function() {
        return getFirstDynamicReason;
      },
      getNavigationDisallowedDynamicReasons: function() {
        return getNavigationDisallowedDynamicReasons;
      },
      getStaticShellDisallowedDynamicReasons: function() {
        return getStaticShellDisallowedDynamicReasons;
      },
      isDynamicPostpone: function() {
        return isDynamicPostpone;
      },
      isPrerenderInterruptedError: function() {
        return isPrerenderInterruptedError;
      },
      logDisallowedDynamicError: function() {
        return logDisallowedDynamicError;
      },
      markCurrentScopeAsDynamic: function() {
        return markCurrentScopeAsDynamic;
      },
      postponeWithTracking: function() {
        return postponeWithTracking;
      },
      throwIfDisallowedDynamic: function() {
        return throwIfDisallowedDynamic;
      },
      throwIfSyncIOUsed: function() {
        return throwIfSyncIOUsed;
      },
      throwToInterruptStaticGeneration: function() {
        return throwToInterruptStaticGeneration;
      },
      trackAllowedDynamicAccess: function() {
        return trackAllowedDynamicAccess;
      },
      trackDynamicDataInDynamicRender: function() {
        return trackDynamicDataInDynamicRender;
      },
      trackDynamicHoleInNavigation: function() {
        return trackDynamicHoleInNavigation;
      },
      trackDynamicHoleInRuntimeShell: function() {
        return trackDynamicHoleInRuntimeShell;
      },
      trackDynamicHoleInStaticShell: function() {
        return trackDynamicHoleInStaticShell;
      },
      trackThrownErrorInNavigation: function() {
        return trackThrownErrorInNavigation;
      },
      useDynamicRouteParams: function() {
        return useDynamicRouteParams;
      },
      useDynamicSearchParams: function() {
        return useDynamicSearchParams;
      }
    });
    var _react = /* @__PURE__ */ _interop_require_default(__require("react"));
    var _hooksservercontext = require_hooks_server_context();
    var _staticgenerationbailout = require_static_generation_bailout();
    var _workunitasyncstorageexternal = require_work_unit_async_storage_external();
    var _workasyncstorageexternal = require_work_async_storage_external();
    var _dynamicrenderingutils = require_dynamic_rendering_utils();
    var _boundaryconstants = require_boundary_constants();
    var _scheduler = require_scheduler();
    var _bailouttocsr = require_bailout_to_csr();
    var _blockingroutemessages = require_blocking_route_messages();
    var _invarianterror = require_invariant_error();
    var _boundaryconstants1 = require_boundary_constants2();
    var _boundarytracking = require_boundary_tracking();
    var _instantmessages = require_instant_messages();
    function _interop_require_default(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      };
    }
    var hasPostpone = typeof _react.default.unstable_postpone === "function";
    function createDynamicTrackingState(isDebugDynamicAccesses) {
      return {
        isDebugDynamicAccesses,
        dynamicAccesses: [],
        syncDynamicErrorWithStack: null,
        syncDynamicErrorWithStackPostMicrotask: false
      };
    }
    function createDynamicValidationState() {
      return {
        hasSuspenseAboveBody: false,
        hasDynamicMetadata: false,
        dynamicMetadata: null,
        hasDynamicViewport: false,
        hasAllowedDynamic: false,
        dynamicErrors: []
      };
    }
    function getPendingClientSyncDynamicError(clientDynamic) {
      return clientDynamic.syncDynamicErrorWithStackPostMicrotask ? null : clientDynamic.syncDynamicErrorWithStack;
    }
    function getFirstDynamicReason(trackingState) {
      var _trackingState_dynamicAccesses_;
      return (_trackingState_dynamicAccesses_ = trackingState.dynamicAccesses[0]) == null ? void 0 : _trackingState_dynamicAccesses_.expression;
    }
    function markCurrentScopeAsDynamic(store, workUnitStore, expression) {
      if (workUnitStore) {
        switch (workUnitStore.type) {
          case "cache":
          case "unstable-cache":
            return;
          case "private-cache":
            return;
          case "prerender-legacy":
          case "prerender-ppr":
          case "request":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      if (store.forceDynamic || store.forceStatic) return;
      if (store.dynamicShouldError) {
        throw Object.defineProperty(new _staticgenerationbailout.StaticGenBailoutError(`Route ${store.route} with \`dynamic = "error"\` couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`), "__NEXT_ERROR_CODE", {
          value: "E553",
          enumerable: false,
          configurable: true
        });
      }
      if (workUnitStore) {
        switch (workUnitStore.type) {
          case "prerender-ppr":
            return postponeWithTracking(store.route, expression, workUnitStore.dynamicTracking);
          case "prerender-legacy":
            workUnitStore.revalidate = 0;
            const err = Object.defineProperty(new _hooksservercontext.DynamicServerError(`Route ${store.route} couldn't be rendered statically because it used ${expression}. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`), "__NEXT_ERROR_CODE", {
              value: "E550",
              enumerable: false,
              configurable: true
            });
            store.dynamicUsageDescription = expression;
            store.dynamicUsageStack = err.stack;
            throw err;
          case "request":
            if (process.env.NODE_ENV !== "production") {
              workUnitStore.usedDynamic = true;
            }
            break;
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
    }
    function throwToInterruptStaticGeneration(expression, store, prerenderStore) {
      const err = Object.defineProperty(new _hooksservercontext.DynamicServerError(`Route ${store.route} couldn't be rendered statically because it used \`${expression}\`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`), "__NEXT_ERROR_CODE", {
        value: "E558",
        enumerable: false,
        configurable: true
      });
      prerenderStore.revalidate = 0;
      store.dynamicUsageDescription = expression;
      store.dynamicUsageStack = err.stack;
      throw err;
    }
    function trackDynamicDataInDynamicRender(workUnitStore) {
      switch (workUnitStore.type) {
        case "cache":
        case "unstable-cache":
          return;
        case "private-cache":
          return;
        case "prerender":
        case "prerender-runtime":
        case "prerender-legacy":
        case "prerender-ppr":
        case "prerender-client":
        case "validation-client":
        case "generate-static-params":
          break;
        case "request":
          if (process.env.NODE_ENV !== "production") {
            workUnitStore.usedDynamic = true;
          }
          break;
        default:
          workUnitStore;
      }
    }
    function abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore) {
      const reason = `Route ${route} needs to bail out of prerendering at this point because it used ${expression}.`;
      const error = createPrerenderInterruptedError(reason);
      prerenderStore.controller.abort(error);
      const dynamicTracking = prerenderStore.dynamicTracking;
      if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
          // When we aren't debugging, we don't need to create another error for the
          // stack trace.
          stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : void 0,
          expression
        });
      }
    }
    function abortOnSynchronousPlatformIOAccess(route, expression, errorWithStack, prerenderStore) {
      const dynamicTracking = prerenderStore.dynamicTracking;
      if (dynamicTracking && dynamicTracking.syncDynamicErrorWithStack === null) {
        dynamicTracking.syncDynamicErrorWithStack = errorWithStack;
        queueMicrotask(() => {
          dynamicTracking.syncDynamicErrorWithStackPostMicrotask = true;
        });
      }
      abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore);
    }
    function abortAndThrowOnSynchronousRequestDataAccess(route, expression, errorWithStack, prerenderStore) {
      (0, _dynamicrenderingutils.trackRuntimeDataAccessed)(prerenderStore);
      const prerenderSignal = prerenderStore.controller.signal;
      if (prerenderSignal.aborted === false) {
        abortOnSynchronousDynamicDataAccess(route, expression, prerenderStore);
        const dynamicTracking = prerenderStore.dynamicTracking;
        if (dynamicTracking) {
          if (dynamicTracking.syncDynamicErrorWithStack === null) {
            dynamicTracking.syncDynamicErrorWithStack = errorWithStack;
          }
        }
      }
      throw createPrerenderInterruptedError(`Route ${route} needs to bail out of prerendering at this point because it used ${expression}.`);
    }
    function Postpone({ reason, route }) {
      const prerenderStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      const dynamicTracking = prerenderStore && prerenderStore.type === "prerender-ppr" ? prerenderStore.dynamicTracking : null;
      postponeWithTracking(route, reason, dynamicTracking);
    }
    function postponeWithTracking(route, expression, dynamicTracking) {
      assertPostpone();
      if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
          // When we aren't debugging, we don't need to create another error for the
          // stack trace.
          stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : void 0,
          expression
        });
      }
      _react.default.unstable_postpone(createPostponeReason(route, expression));
    }
    function createPostponeReason(route, expression) {
      return `Route ${route} needs to bail out of prerendering at this point because it used ${expression}. React throws this special object to indicate where. It should not be caught by your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error`;
    }
    function isDynamicPostpone(err) {
      if (typeof err === "object" && err !== null && typeof err.message === "string") {
        return isDynamicPostponeReason(err.message);
      }
      return false;
    }
    function isDynamicPostponeReason(reason) {
      return reason.includes("needs to bail out of prerendering at this point because it used") && reason.includes("Learn more: https://nextjs.org/docs/messages/ppr-caught-error");
    }
    if (isDynamicPostponeReason(createPostponeReason("%%%", "^^^")) === false) {
      throw Object.defineProperty(new Error("Invariant: isDynamicPostpone misidentified a postpone reason. This is a bug in Next.js"), "__NEXT_ERROR_CODE", {
        value: "E296",
        enumerable: false,
        configurable: true
      });
    }
    var NEXT_PRERENDER_INTERRUPTED = "NEXT_PRERENDER_INTERRUPTED";
    function createPrerenderInterruptedError(message) {
      const error = Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
      });
      error.digest = NEXT_PRERENDER_INTERRUPTED;
      return error;
    }
    function isPrerenderInterruptedError(error) {
      return typeof error === "object" && error !== null && error.digest === NEXT_PRERENDER_INTERRUPTED && "name" in error && "message" in error && error instanceof Error;
    }
    function accessedDynamicData(dynamicAccesses) {
      return dynamicAccesses.length > 0;
    }
    function consumeDynamicAccess(serverDynamic, clientDynamic) {
      serverDynamic.dynamicAccesses.push(...clientDynamic.dynamicAccesses);
      return serverDynamic.dynamicAccesses;
    }
    function formatDynamicAPIAccesses(dynamicAccesses) {
      return dynamicAccesses.filter((access) => typeof access.stack === "string" && access.stack.length > 0).map(({ expression, stack }) => {
        stack = stack.split("\n").slice(4).filter((line) => {
          if (line.includes("node_modules/next/")) {
            return false;
          }
          if (line.includes(" (<anonymous>)")) {
            return false;
          }
          if (line.includes(" (node:")) {
            return false;
          }
          return true;
        }).join("\n");
        return `Dynamic API Usage Debug - ${expression}:
${stack}`;
      });
    }
    function assertPostpone() {
      if (!hasPostpone) {
        throw Object.defineProperty(new Error(`Invariant: React.unstable_postpone is not defined. This suggests the wrong version of React was loaded. This is a bug in Next.js`), "__NEXT_ERROR_CODE", {
          value: "E224",
          enumerable: false,
          configurable: true
        });
      }
    }
    function createRenderInBrowserAbortSignal() {
      const controller = new AbortController();
      controller.abort(Object.defineProperty(new _bailouttocsr.BailoutToCSRError("Render in Browser"), "__NEXT_ERROR_CODE", {
        value: "E721",
        enumerable: false,
        configurable: true
      }));
      return controller.signal;
    }
    function createHangingInputAbortSignal(workUnitStore) {
      switch (workUnitStore.type) {
        case "prerender":
        case "prerender-runtime":
          const controller = new AbortController();
          if (workUnitStore.cacheSignal) {
            workUnitStore.cacheSignal.inputReady().then(() => {
              controller.abort();
            });
          } else {
            const stagedRendering = (0, _workunitasyncstorageexternal.getStagedRenderingController)(workUnitStore);
            if (stagedRendering && stagedRendering.finalStage !== null) {
              stagedRendering.waitForStage(stagedRendering.finalStage).then(() => (0, _scheduler.scheduleOnNextTick)(() => controller.abort()), noop);
            } else {
              (0, _scheduler.scheduleOnNextTick)(() => controller.abort());
            }
          }
          return controller.signal;
        case "prerender-client":
        case "validation-client":
        case "prerender-ppr":
        case "prerender-legacy":
        case "request":
        case "cache":
        case "private-cache":
        case "unstable-cache":
        case "generate-static-params":
          return void 0;
        default:
          workUnitStore;
      }
    }
    function noop() {
    }
    function annotateDynamicAccess(expression, prerenderStore) {
      const dynamicTracking = prerenderStore.dynamicTracking;
      if (dynamicTracking) {
        dynamicTracking.dynamicAccesses.push({
          stack: dynamicTracking.isDebugDynamicAccesses ? new Error().stack : void 0,
          expression
        });
      }
    }
    function useDynamicRouteParams(expression) {
      const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (workStore && workUnitStore) {
        switch (workUnitStore.type) {
          case "prerender-client": {
            const fallbackParams = workUnitStore.fallbackRouteParams;
            if (fallbackParams && fallbackParams.size > 0) {
              _react.default.use((0, _dynamicrenderingutils.makeClientHookHangingPromise)(workUnitStore.renderSignal, new _dynamicrenderingutils.ClientHookDynamicError(workStore.route, expression)));
            }
            break;
          }
          case "prerender":
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called from a Server Component. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
              value: "E795",
              enumerable: false,
              configurable: true
            });
          case "prerender-ppr": {
            const fallbackParams = workUnitStore.fallbackRouteParams;
            if (fallbackParams && fallbackParams.size > 0) {
              return postponeWithTracking(workStore.route, expression, workUnitStore.dynamicTracking);
            }
            break;
          }
          case "validation-client": {
            break;
          }
          case "prerender-runtime":
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called during a runtime prerender. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
              value: "E771",
              enumerable: false,
              configurable: true
            });
          case "cache":
          case "private-cache":
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called inside a cache scope. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
              value: "E745",
              enumerable: false,
              configurable: true
            });
          case "generate-static-params":
            throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called in \`generateStaticParams\`. Next.js should be preventing ${expression} from being included in server component files statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
              value: "E1130",
              enumerable: false,
              configurable: true
            });
          case "prerender-legacy":
          case "request":
          case "unstable-cache":
            break;
          default:
            workUnitStore;
        }
      }
    }
    function useDynamicSearchParams(expression) {
      const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (!workStore) {
        return;
      }
      if (!workUnitStore) {
        (0, _workunitasyncstorageexternal.throwForMissingRequestStore)(expression);
      }
      switch (workUnitStore.type) {
        case "validation-client":
          return;
        case "prerender-client": {
          _react.default.use((0, _dynamicrenderingutils.makeClientHookHangingPromise)(workUnitStore.renderSignal, new _dynamicrenderingutils.ClientHookDynamicError(workStore.route, expression)));
          break;
        }
        case "prerender-legacy":
        case "prerender-ppr": {
          if (workStore.forceStatic) {
            return;
          }
          throw Object.defineProperty(new _bailouttocsr.BailoutToCSRError(expression), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
          });
        }
        case "prerender":
        case "prerender-runtime":
          throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called from a Server Component. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
            value: "E795",
            enumerable: false,
            configurable: true
          });
        case "cache":
        case "unstable-cache":
        case "private-cache":
          throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called inside a cache scope. Next.js should be preventing ${expression} from being included in server components statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
            value: "E745",
            enumerable: false,
            configurable: true
          });
        case "generate-static-params":
          throw Object.defineProperty(new _invarianterror.InvariantError(`\`${expression}\` was called in \`generateStaticParams\`. Next.js should be preventing ${expression} from being included in server component files statically, but did not in this case.`), "__NEXT_ERROR_CODE", {
            value: "E1130",
            enumerable: false,
            configurable: true
          });
        case "request":
          return;
        default:
          workUnitStore;
      }
    }
    var hasSuspenseRegex = /\n\s+at Suspense \(<anonymous>\)/;
    var bodyAndImplicitTags = "body|div|main|section|article|aside|header|footer|nav|form|p|span|h1|h2|h3|h4|h5|h6";
    var hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex = new RegExp(`\\n\\s+at Suspense \\(<anonymous>\\)(?:(?!\\n\\s+at (?:${bodyAndImplicitTags}) \\(<anonymous>\\))[\\s\\S])*?\\n\\s+at ${_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME} \\([^\\n]*\\)`);
    var hasMetadataRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.METADATA_BOUNDARY_NAME}[\\n\\s]`);
    var hasViewportRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.VIEWPORT_BOUNDARY_NAME}[\\n\\s]`);
    var hasOutletRegex = new RegExp(`\\n\\s+at ${_boundaryconstants.OUTLET_BOUNDARY_NAME}[\\n\\s]`);
    var hasInstantValidationBoundaryRegex = new RegExp(`\\n\\s+at ${_boundaryconstants1.INSTANT_VALIDATION_BOUNDARY_NAME}[\\n\\s]`);
    var slotMarkerRegex = new RegExp(`\\n\\s+at ${_boundaryconstants1.INSTANT_SLOT_MARKER_PREFIX}(\\d+)${_boundaryconstants1.INSTANT_SLOT_MARKER_SUFFIX}[\\n\\s]`);
    function resolveInstantStack(componentStack, dynamicValidation) {
      const { slotStacks } = dynamicValidation;
      if (slotStacks.length > 1) {
        const match = slotMarkerRegex.exec(componentStack);
        if (match) {
          const slotIndex = parseInt(match[1], 10) + 1;
          const slotStack = slotStacks[slotIndex];
          if (slotStack != null) {
            return slotStack;
          }
        }
      }
      return slotStacks[0] ?? null;
    }
    function trackOutletSuspenseAboveBody(componentStack, dynamicValidation) {
      if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        dynamicValidation.hasSuspenseAboveBody = true;
      }
    }
    function trackAllowedDynamicAccess(dynamicReason, workStore, componentStack, dynamicValidation, clientDynamic) {
      const syncDynamicError = getPendingClientSyncDynamicError(clientDynamic);
      if (hasOutletRegex.test(componentStack)) {
        trackOutletSuspenseAboveBody(componentStack, dynamicValidation);
        return;
      } else if (hasMetadataRegex.test(componentStack)) {
        dynamicValidation.hasDynamicMetadata = true;
        return;
      } else if (hasViewportRegex.test(componentStack)) {
        dynamicValidation.hasDynamicViewport = true;
        return;
      } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
      } else if (hasSuspenseRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        return;
      } else if (syncDynamicError) {
        dynamicValidation.dynamicErrors.push(syncDynamicError);
        return;
      }
      if ((0, _dynamicrenderingutils.isClientHookDynamicError)(dynamicReason)) {
        dynamicValidation.dynamicErrors.push(addErrorContext(dynamicReason, componentStack, null));
        return;
      }
      const error = addErrorContext((0, _blockingroutemessages.createDynamicOrRuntimeBodyError)(workStore.route), componentStack, null);
      dynamicValidation.dynamicErrors.push(error);
      return;
    }
    var DynamicHoleKind = /* @__PURE__ */ (function(DynamicHoleKind2) {
      DynamicHoleKind2[DynamicHoleKind2["Link"] = 1] = "Link";
      DynamicHoleKind2[DynamicHoleKind2["Runtime"] = 2] = "Runtime";
      DynamicHoleKind2[DynamicHoleKind2["Dynamic"] = 3] = "Dynamic";
      return DynamicHoleKind2;
    })({});
    function createInstantValidationState(slotStacks) {
      return {
        hasDynamicMetadata: false,
        hasAllowedClientDynamicAboveBoundary: false,
        dynamicMetadata: null,
        hasDynamicViewport: false,
        hasAllowedDynamic: false,
        dynamicErrors: [],
        validationPreventingErrors: [],
        thrownErrorsOutsideBoundary: [],
        slotStacks
      };
    }
    function trackDynamicHoleInNavigation(dynamicReason, workStore, componentStack, dynamicValidation, clientDynamic, kind, boundaryState) {
      const syncDynamicError = getPendingClientSyncDynamicError(clientDynamic);
      if (hasOutletRegex.test(componentStack)) {
        return;
      }
      const effectiveCreateInstantStack = resolveInstantStack(componentStack, dynamicValidation);
      if (hasMetadataRegex.test(componentStack)) {
        const error2 = addErrorContext(kind === 1 ? (0, _blockingroutemessages.createLinkMetadataError)(workStore.route) : kind === 2 ? (0, _blockingroutemessages.createRuntimeMetadataError)(workStore.route) : (0, _blockingroutemessages.createDynamicMetadataError)(workStore.route), componentStack, effectiveCreateInstantStack);
        dynamicValidation.dynamicMetadata = error2;
        return;
      }
      if (hasViewportRegex.test(componentStack)) {
        const error2 = addErrorContext(kind === 1 ? (0, _blockingroutemessages.createLinkViewportError)(workStore.route) : kind === 2 ? (0, _blockingroutemessages.createRuntimeViewportError)(workStore.route) : (0, _blockingroutemessages.createDynamicViewportError)(workStore.route), componentStack, effectiveCreateInstantStack);
        dynamicValidation.dynamicErrors.push(error2);
        return;
      }
      const boundaryLocation = hasInstantValidationBoundaryRegex.exec(componentStack);
      if (!boundaryLocation) {
        if ((0, _boundarytracking.allRequiredBoundariesRendered)(boundaryState)) {
          dynamicValidation.hasAllowedClientDynamicAboveBoundary = true;
          dynamicValidation.hasAllowedDynamic = true;
          return;
        } else {
          const message = `Route "${workStore.route}": Could not validate \`instant\` because a Client Component in a parent segment prevented the page from rendering.`;
          const error2 = addErrorContext(Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
            value: "E1331",
            enumerable: false,
            configurable: true
          }), componentStack, effectiveCreateInstantStack);
          dynamicValidation.validationPreventingErrors.push(error2);
          return;
        }
      } else {
        const suspenseLocation = hasSuspenseRegex.exec(componentStack);
        if (suspenseLocation) {
          if (suspenseLocation.index < boundaryLocation.index) {
            dynamicValidation.hasAllowedDynamic = true;
            return;
          } else {
          }
        }
      }
      if (syncDynamicError) {
        if (effectiveCreateInstantStack !== null && syncDynamicError.cause === void 0) {
          syncDynamicError.cause = effectiveCreateInstantStack();
        }
        dynamicValidation.dynamicErrors.push(syncDynamicError);
        return;
      }
      if ((0, _dynamicrenderingutils.isClientHookDynamicError)(dynamicReason)) {
        dynamicValidation.dynamicErrors.push(addErrorContext(dynamicReason, componentStack, effectiveCreateInstantStack));
        return;
      }
      const error = addErrorContext(kind === 1 ? (0, _blockingroutemessages.createLinkBodyErrorInNavigation)(workStore.route) : kind === 2 ? (0, _blockingroutemessages.createRuntimeBodyErrorInNavigation)(workStore.route) : (0, _blockingroutemessages.createDynamicBodyErrorInNavigation)(workStore.route), componentStack, effectiveCreateInstantStack);
      dynamicValidation.dynamicErrors.push(error);
      return;
    }
    function trackThrownErrorInNavigation(workStore, dynamicValidation, thrownValue, componentStack) {
      const boundaryLocation = hasInstantValidationBoundaryRegex.exec(componentStack);
      if (!boundaryLocation) {
        const error = addErrorContext(Object.defineProperty(new Error("An error occurred while attempting to validate instant UI. This error may be preventing the validation from completing.", {
          cause: thrownValue
        }), "__NEXT_ERROR_CODE", {
          value: "E1118",
          enumerable: false,
          configurable: true
        }), componentStack, null);
        dynamicValidation.thrownErrorsOutsideBoundary.push(error);
      } else {
        const suspenseLocation = hasSuspenseRegex.exec(componentStack);
        if (suspenseLocation) {
          if (suspenseLocation.index < boundaryLocation.index) {
            return;
          } else {
          }
        }
        const message = `Route "${workStore.route}": Could not validate \`instant\` because an error prevented the target segment from rendering.`;
        const error = addErrorContext(
          Object.defineProperty(new Error(message, {
            cause: thrownValue
          }), "__NEXT_ERROR_CODE", {
            value: "E1338",
            enumerable: false,
            configurable: true
          }),
          componentStack,
          null
          // TODO(instant-validation-build): conflicting use of cause
        );
        dynamicValidation.validationPreventingErrors.push(error);
      }
    }
    function trackDynamicHoleInRuntimeShell(dynamicReason, workStore, componentStack, dynamicValidation, clientDynamic) {
      const syncDynamicError = getPendingClientSyncDynamicError(clientDynamic);
      if (hasOutletRegex.test(componentStack)) {
        trackOutletSuspenseAboveBody(componentStack, dynamicValidation);
        return;
      } else if (hasMetadataRegex.test(componentStack)) {
        const error2 = addErrorContext((0, _blockingroutemessages.createDynamicMetadataError)(workStore.route), componentStack, null);
        dynamicValidation.dynamicMetadata = error2;
        return;
      } else if (hasViewportRegex.test(componentStack)) {
        const error2 = addErrorContext((0, _blockingroutemessages.createDynamicViewportError)(workStore.route), componentStack, null);
        dynamicValidation.dynamicErrors.push(error2);
        return;
      } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
      } else if (hasSuspenseRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        return;
      } else if (syncDynamicError) {
        dynamicValidation.dynamicErrors.push(syncDynamicError);
        return;
      }
      if ((0, _dynamicrenderingutils.isClientHookDynamicError)(dynamicReason)) {
        dynamicValidation.dynamicErrors.push(addErrorContext(dynamicReason, componentStack, null));
        return;
      }
      const error = addErrorContext((0, _blockingroutemessages.createDynamicBodyError)(workStore.route), componentStack, null);
      dynamicValidation.dynamicErrors.push(error);
      return;
    }
    function trackDynamicHoleInStaticShell(dynamicReason, workStore, componentStack, dynamicValidation, clientDynamic) {
      const syncDynamicError = getPendingClientSyncDynamicError(clientDynamic);
      if (hasOutletRegex.test(componentStack)) {
        trackOutletSuspenseAboveBody(componentStack, dynamicValidation);
        return;
      } else if (hasMetadataRegex.test(componentStack)) {
        const error2 = addErrorContext((0, _blockingroutemessages.createRuntimeMetadataError)(workStore.route), componentStack, null);
        dynamicValidation.dynamicMetadata = error2;
        return;
      } else if (hasViewportRegex.test(componentStack)) {
        const error2 = addErrorContext((0, _blockingroutemessages.createRuntimeViewportError)(workStore.route), componentStack, null);
        dynamicValidation.dynamicErrors.push(error2);
        return;
      } else if (hasSuspenseBeforeRootLayoutWithoutBodyOrImplicitBodyRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        dynamicValidation.hasSuspenseAboveBody = true;
        return;
      } else if (hasSuspenseRegex.test(componentStack)) {
        dynamicValidation.hasAllowedDynamic = true;
        return;
      } else if (syncDynamicError) {
        dynamicValidation.dynamicErrors.push(syncDynamicError);
        return;
      }
      if ((0, _dynamicrenderingutils.isClientHookDynamicError)(dynamicReason)) {
        dynamicValidation.dynamicErrors.push(addErrorContext(dynamicReason, componentStack, null));
        return;
      }
      const error = addErrorContext((0, _blockingroutemessages.createRuntimeBodyError)(workStore.route), componentStack, null);
      dynamicValidation.dynamicErrors.push(error);
      return;
    }
    function addErrorContext(error, componentStack, createInstantStack) {
      const ownerStack = process.env.NODE_ENV !== "production" && _react.default.captureOwnerStack ? _react.default.captureOwnerStack() : null;
      if (createInstantStack !== null) {
        error.cause = createInstantStack();
      }
      error.stack = error.name + ": " + error.message + (ownerStack || componentStack);
      return error;
    }
    var PreludeState = /* @__PURE__ */ (function(PreludeState2) {
      PreludeState2[PreludeState2["Full"] = 0] = "Full";
      PreludeState2[PreludeState2["Empty"] = 1] = "Empty";
      PreludeState2[PreludeState2["Errored"] = 2] = "Errored";
      return PreludeState2;
    })({});
    function logDisallowedDynamicError(workStore, error) {
      console.error(error);
      (0, _blockingroutemessages.logBuildDebugHint)(workStore.route);
    }
    function throwIfSyncIOUsed(workStore, serverDynamic) {
      if (serverDynamic.syncDynamicErrorWithStack) {
        logDisallowedDynamicError(workStore, serverDynamic.syncDynamicErrorWithStack);
        throw new _staticgenerationbailout.StaticGenBailoutError();
      }
    }
    function throwIfDisallowedDynamic(workStore, prelude, dynamicValidation, serverDynamic, allowEmptyStaticShell) {
      throwIfSyncIOUsed(workStore, serverDynamic);
      if (prelude === 0 && dynamicValidation.hasAllowedDynamic === false && dynamicValidation.hasDynamicMetadata) {
        console.error((0, _blockingroutemessages.createDynamicOrRuntimeMetadataError)(workStore.route).message);
        throw new _staticgenerationbailout.StaticGenBailoutError();
      }
      if (allowEmptyStaticShell || dynamicValidation.hasSuspenseAboveBody) {
        return;
      }
      if (prelude !== 0) {
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
          for (let i = 0; i < dynamicErrors.length; i++) {
            logDisallowedDynamicError(workStore, dynamicErrors[i]);
          }
          throw new _staticgenerationbailout.StaticGenBailoutError();
        }
        if (dynamicValidation.hasDynamicViewport) {
          console.error((0, _blockingroutemessages.createDynamicOrRuntimeViewportError)(workStore.route).message);
          throw new _staticgenerationbailout.StaticGenBailoutError();
        }
        if (prelude === 1) {
          console.error(`Route "${workStore.route}" did not produce a static shell and Next.js was unable to determine a reason. This is a bug in Next.js.`);
          throw new _staticgenerationbailout.StaticGenBailoutError();
        }
      }
    }
    function getStaticShellDisallowedDynamicReasons(workStore, prelude, dynamicValidation, allowEmptyStaticShell) {
      if (prelude === 0 && dynamicValidation.hasAllowedDynamic === false && dynamicValidation.dynamicErrors.length === 0 && dynamicValidation.dynamicMetadata) {
        return [
          dynamicValidation.dynamicMetadata
        ];
      }
      if (allowEmptyStaticShell || dynamicValidation.hasSuspenseAboveBody) {
        return [];
      }
      if (prelude !== 0) {
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
          return dynamicErrors;
        }
        if (prelude === 1) {
          return [
            Object.defineProperty(new _invarianterror.InvariantError(`Route "${workStore.route}" did not produce a static shell and Next.js was unable to determine a reason.`), "__NEXT_ERROR_CODE", {
              value: "E936",
              enumerable: false,
              configurable: true
            })
          ];
        }
      }
      return [];
    }
    function getNavigationDisallowedDynamicReasons(workStore, prelude, dynamicValidation, validationSampleTracking, boundaryState, devRenderDidError) {
      if (validationSampleTracking) {
        const { missingSampleErrors } = validationSampleTracking;
        if (missingSampleErrors.length > 0) {
          return missingSampleErrors;
        }
      }
      const { validationPreventingErrors } = dynamicValidation;
      if (validationPreventingErrors.length > 0) {
        if (process.env.__NEXT_DEV_SERVER && devRenderDidError) {
          return [];
        }
        return validationPreventingErrors;
      }
      if (prelude !== 0) {
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
          return dynamicErrors;
        }
        if (prelude === 1 && !dynamicValidation.hasAllowedClientDynamicAboveBoundary && (0, _boundarytracking.allRequiredBoundariesRendered)(boundaryState)) {
          return Object.defineProperty(new _invarianterror.InvariantError(`Route "${workStore.route}" failed to render during instant validation and Next.js was unable to determine a reason.`), "__NEXT_ERROR_CODE", {
            value: "E1055",
            enumerable: false,
            configurable: true
          });
        }
      } else {
        const dynamicErrors = dynamicValidation.dynamicErrors;
        if (dynamicErrors.length > 0) {
          return dynamicErrors;
        }
        if (dynamicValidation.hasAllowedDynamic === false && dynamicValidation.dynamicMetadata) {
          return [
            dynamicValidation.dynamicMetadata
          ];
        }
      }
      if (!(0, _boundarytracking.allRequiredBoundariesRendered)(boundaryState)) {
        const { thrownErrorsOutsideBoundary } = dynamicValidation;
        const rootInstantStack = dynamicValidation.slotStacks[0];
        if (thrownErrorsOutsideBoundary.length === 0) {
          const missingFiles = [];
          for (const [id, filePaths] of boundaryState.requiredIds) {
            if (!boundaryState.renderedIds.has(id)) {
              for (const filePath of filePaths) {
                let normalized = filePath.replace(/^\[project\][\\/]?/, "").replace(process.cwd() + "/", "").replace(process.cwd() + "\\", "");
                missingFiles.push(normalized);
              }
            }
          }
          missingFiles.sort();
          return (0, _instantmessages.createUnrenderedSegmentError)(workStore.route, missingFiles);
        } else if (process.env.__NEXT_DEV_SERVER && devRenderDidError) {
          return [];
        } else if (thrownErrorsOutsideBoundary.length === 1) {
          const message = `Route "${workStore.route}": Could not validate \`instant\` because the target segment was prevented from rendering, likely due to the following error.`;
          const error = rootInstantStack !== null ? rootInstantStack() : new Error();
          error.name = "Error";
          error.message = message;
          return new AggregateError([
            error,
            thrownErrorsOutsideBoundary[0]
          ]);
        } else {
          const message = `Route "${workStore.route}": Could not validate \`instant\` because the target segment was prevented from rendering, likely due to one of the following errors.`;
          const error = rootInstantStack !== null ? rootInstantStack() : new Error();
          error.name = "Error";
          error.message = message;
          return new AggregateError([
            error,
            ...thrownErrorsOutsideBoundary
          ]);
        }
      }
      return [];
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation-dynamic-rendering.js
var require_navigation_dynamic_rendering = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation-dynamic-rendering.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      useDynamicRouteParams: function() {
        return _dynamicrendering.useDynamicRouteParams;
      },
      useDynamicSearchParams: function() {
        return _dynamicrendering.useDynamicSearchParams;
      }
    });
    var _dynamicrendering = require_dynamic_rendering();
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/server-inserted-html.shared-runtime.js
var require_server_inserted_html_shared_runtime = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/server-inserted-html.shared-runtime.js"(exports) {
    "use strict";
    "use client";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      ServerInsertedHTMLContext: function() {
        return ServerInsertedHTMLContext;
      },
      useServerInsertedHTML: function() {
        return useServerInsertedHTML;
      }
    });
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _react = /* @__PURE__ */ _interop_require_wildcard._(__require("react"));
    var ServerInsertedHTMLContext = /* @__PURE__ */ _react.default.createContext(null);
    function useServerInsertedHTML(callback) {
      const addInsertedServerHTMLCallback = (0, _react.useContext)(ServerInsertedHTMLContext);
      if (addInsertedServerHTMLCallback) {
        addInsertedServerHTMLCallback(callback);
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unrecognized-action-error.js
var require_unrecognized_action_error = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unrecognized-action-error.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      UnrecognizedActionError: function() {
        return UnrecognizedActionError;
      },
      unstable_isUnrecognizedActionError: function() {
        return unstable_isUnrecognizedActionError;
      }
    });
    var UnrecognizedActionError = class extends Error {
      constructor(...args) {
        super(...args);
        this.name = "UnrecognizedActionError";
      }
    };
    function unstable_isUnrecognizedActionError(error) {
      return !!(error && typeof error === "object" && error instanceof UnrecognizedActionError);
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect-status-code.js
var require_redirect_status_code = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect-status-code.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "RedirectStatusCode", {
      enumerable: true,
      get: function() {
        return RedirectStatusCode;
      }
    });
    var RedirectStatusCode = /* @__PURE__ */ (function(RedirectStatusCode2) {
      RedirectStatusCode2[RedirectStatusCode2["SeeOther"] = 303] = "SeeOther";
      RedirectStatusCode2[RedirectStatusCode2["TemporaryRedirect"] = 307] = "TemporaryRedirect";
      RedirectStatusCode2[RedirectStatusCode2["PermanentRedirect"] = 308] = "PermanentRedirect";
      return RedirectStatusCode2;
    })({});
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect-error.js
var require_redirect_error = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect-error.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      REDIRECT_ERROR_CODE: function() {
        return REDIRECT_ERROR_CODE;
      },
      isRedirectError: function() {
        return isRedirectError;
      }
    });
    var _redirectstatuscode = require_redirect_status_code();
    var REDIRECT_ERROR_CODE = "NEXT_REDIRECT";
    function isRedirectError(error) {
      if (typeof error !== "object" || error === null || !("digest" in error) || typeof error.digest !== "string") {
        return false;
      }
      const digest = error.digest.split(";");
      const [errorCode, type] = digest;
      const destination = digest.slice(2, -2).join(";");
      const status = digest.at(-2);
      const statusCode = Number(status);
      return errorCode === REDIRECT_ERROR_CODE && (type === "replace" || type === "push") && typeof destination === "string" && !isNaN(statusCode) && statusCode in _redirectstatuscode.RedirectStatusCode;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/action-async-storage-instance.js
var require_action_async_storage_instance = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/action-async-storage-instance.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "actionAsyncStorageInstance", {
      enumerable: true,
      get: function() {
        return actionAsyncStorageInstance;
      }
    });
    var _asynclocalstorage = require_async_local_storage();
    var actionAsyncStorageInstance = (0, _asynclocalstorage.createAsyncLocalStorage)();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/action-async-storage.external.js
var require_action_async_storage_external = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/action-async-storage.external.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "actionAsyncStorage", {
      enumerable: true,
      get: function() {
        return _actionasyncstorageinstance.actionAsyncStorageInstance;
      }
    });
    var _actionasyncstorageinstance = require_action_async_storage_instance();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/server-async-storage.js
var require_server_async_storage = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/server-async-storage.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      actionAsyncStorage: function() {
        return _actionasyncstorageexternal.actionAsyncStorage;
      },
      workAsyncStorage: function() {
        return _workasyncstorageexternal.workAsyncStorage;
      },
      workUnitAsyncStorage: function() {
        return _workunitasyncstorageexternal.workUnitAsyncStorage;
      }
    });
    var _actionasyncstorageexternal = require_action_async_storage_external();
    var _workasyncstorageexternal = require_work_async_storage_external();
    var _workunitasyncstorageexternal = require_work_unit_async_storage_external();
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect.js
var require_redirect = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/redirect.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      getRedirectError: function() {
        return getRedirectError;
      },
      getRedirectStatusCodeFromError: function() {
        return getRedirectStatusCodeFromError;
      },
      getRedirectTypeFromError: function() {
        return getRedirectTypeFromError;
      },
      getURLFromRedirectError: function() {
        return getURLFromRedirectError;
      },
      permanentRedirect: function() {
        return permanentRedirect;
      },
      redirect: function() {
        return redirect;
      }
    });
    var _redirectstatuscode = require_redirect_status_code();
    var _redirecterror = require_redirect_error();
    var _serverasyncstorage = require_server_async_storage();
    function getRedirectError(url, type, statusCode = _redirectstatuscode.RedirectStatusCode.TemporaryRedirect) {
      const error = Object.defineProperty(new Error(_redirecterror.REDIRECT_ERROR_CODE), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
      });
      error.digest = `${_redirecterror.REDIRECT_ERROR_CODE};${type};${url};${statusCode};`;
      return error;
    }
    function redirect(url, type) {
      type ??= _serverasyncstorage.actionAsyncStorage?.getStore()?.isAction ? "push" : "replace";
      throw getRedirectError(url, type, _redirectstatuscode.RedirectStatusCode.TemporaryRedirect);
    }
    function permanentRedirect(url, type = "replace") {
      throw getRedirectError(url, type, _redirectstatuscode.RedirectStatusCode.PermanentRedirect);
    }
    function getURLFromRedirectError(error) {
      if (!(0, _redirecterror.isRedirectError)(error)) return null;
      return error.digest.split(";").slice(2, -2).join(";");
    }
    function getRedirectTypeFromError(error) {
      if (!(0, _redirecterror.isRedirectError)(error)) {
        throw Object.defineProperty(new Error("Not a redirect error"), "__NEXT_ERROR_CODE", {
          value: "E260",
          enumerable: false,
          configurable: true
        });
      }
      return error.digest.split(";", 2)[1];
    }
    function getRedirectStatusCodeFromError(error) {
      if (!(0, _redirecterror.isRedirectError)(error)) {
        throw Object.defineProperty(new Error("Not a redirect error"), "__NEXT_ERROR_CODE", {
          value: "E260",
          enumerable: false,
          configurable: true
        });
      }
      return Number(error.digest.split(";").at(-2));
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/http-access-fallback/http-access-fallback.js
var require_http_access_fallback = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/http-access-fallback/http-access-fallback.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      HTTPAccessErrorStatus: function() {
        return HTTPAccessErrorStatus;
      },
      HTTP_ERROR_FALLBACK_ERROR_CODE: function() {
        return HTTP_ERROR_FALLBACK_ERROR_CODE;
      },
      getAccessFallbackErrorTypeByStatus: function() {
        return getAccessFallbackErrorTypeByStatus;
      },
      getAccessFallbackHTTPStatus: function() {
        return getAccessFallbackHTTPStatus;
      },
      isHTTPAccessFallbackError: function() {
        return isHTTPAccessFallbackError;
      }
    });
    var HTTPAccessErrorStatus = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      UNAUTHORIZED: 401
    };
    var ALLOWED_CODES = new Set(Object.values(HTTPAccessErrorStatus));
    var HTTP_ERROR_FALLBACK_ERROR_CODE = "NEXT_HTTP_ERROR_FALLBACK";
    function isHTTPAccessFallbackError(error) {
      if (typeof error !== "object" || error === null || !("digest" in error) || typeof error.digest !== "string") {
        return false;
      }
      const [prefix, httpStatus] = error.digest.split(";");
      return prefix === HTTP_ERROR_FALLBACK_ERROR_CODE && ALLOWED_CODES.has(Number(httpStatus));
    }
    function getAccessFallbackHTTPStatus(error) {
      const httpStatus = error.digest.split(";")[1];
      return Number(httpStatus);
    }
    function getAccessFallbackErrorTypeByStatus(status) {
      switch (status) {
        case 401:
          return "unauthorized";
        case 403:
          return "forbidden";
        case 404:
          return "not-found";
        default:
          return;
      }
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/not-found.js
var require_not_found = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/not-found.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "notFound", {
      enumerable: true,
      get: function() {
        return notFound;
      }
    });
    var _httpaccessfallback = require_http_access_fallback();
    var DIGEST = `${_httpaccessfallback.HTTP_ERROR_FALLBACK_ERROR_CODE};404`;
    function notFound() {
      const error = Object.defineProperty(new Error(DIGEST), "__NEXT_ERROR_CODE", {
        value: "E1041",
        enumerable: false,
        configurable: true
      });
      error.digest = DIGEST;
      throw error;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/forbidden.js
var require_forbidden = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/forbidden.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "forbidden", {
      enumerable: true,
      get: function() {
        return forbidden;
      }
    });
    var _httpaccessfallback = require_http_access_fallback();
    var DIGEST = `${_httpaccessfallback.HTTP_ERROR_FALLBACK_ERROR_CODE};403`;
    function forbidden() {
      if (!process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS) {
        throw Object.defineProperty(new Error(`\`forbidden()\` is experimental and only allowed to be enabled when \`experimental.authInterrupts\` is enabled.`), "__NEXT_ERROR_CODE", {
          value: "E488",
          enumerable: false,
          configurable: true
        });
      }
      const error = Object.defineProperty(new Error(DIGEST), "__NEXT_ERROR_CODE", {
        value: "E1019",
        enumerable: false,
        configurable: true
      });
      error.digest = DIGEST;
      throw error;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unauthorized.js
var require_unauthorized = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unauthorized.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "unauthorized", {
      enumerable: true,
      get: function() {
        return unauthorized;
      }
    });
    var _httpaccessfallback = require_http_access_fallback();
    var DIGEST = `${_httpaccessfallback.HTTP_ERROR_FALLBACK_ERROR_CODE};401`;
    function unauthorized() {
      if (!process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS) {
        throw Object.defineProperty(new Error(`\`unauthorized()\` is experimental and only allowed to be used when \`experimental.authInterrupts\` is enabled.`), "__NEXT_ERROR_CODE", {
          value: "E411",
          enumerable: false,
          configurable: true
        });
      }
      const error = Object.defineProperty(new Error(DIGEST), "__NEXT_ERROR_CODE", {
        value: "E1002",
        enumerable: false,
        configurable: true
      });
      error.digest = DIGEST;
      throw error;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/lib/router-utils/is-postpone.js
var require_is_postpone = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/lib/router-utils/is-postpone.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "isPostpone", {
      enumerable: true,
      get: function() {
        return isPostpone;
      }
    });
    var REACT_POSTPONE_TYPE = /* @__PURE__ */ Symbol.for("react.postpone");
    function isPostpone(error) {
      return typeof error === "object" && error !== null && error.$$typeof === REACT_POSTPONE_TYPE;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/is-next-router-error.js
var require_is_next_router_error = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/is-next-router-error.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "isNextRouterError", {
      enumerable: true,
      get: function() {
        return isNextRouterError;
      }
    });
    var _httpaccessfallback = require_http_access_fallback();
    var _redirecterror = require_redirect_error();
    function isNextRouterError(error) {
      return (0, _redirecterror.isRedirectError)(error) || (0, _httpaccessfallback.isHTTPAccessFallbackError)(error);
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unstable-rethrow.js
var require_unstable_rethrow = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/unstable-rethrow.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "unstable_rethrow", {
      enumerable: true,
      get: function() {
        return unstable_rethrow;
      }
    });
    var _dynamicrenderingutils = require_dynamic_rendering_utils();
    var _ispostpone = require_is_postpone();
    var _bailouttocsr = require_bailout_to_csr();
    var _isnextroutererror = require_is_next_router_error();
    var _dynamicrendering = require_dynamic_rendering();
    var _hooksservercontext = require_hooks_server_context();
    function unstable_rethrow(error) {
      if ((0, _isnextroutererror.isNextRouterError)(error) || (0, _bailouttocsr.isBailoutToCSRError)(error) || (0, _hooksservercontext.isDynamicServerError)(error) || (0, _dynamicrendering.isDynamicPostpone)(error) || (0, _ispostpone.isPostpone)(error) || (0, _dynamicrenderingutils.isHangingPromiseRejectionError)(error) || (0, _dynamicrendering.isPrerenderInterruptedError)(error)) {
        throw error;
      }
      if (error instanceof Error && "cause" in error) {
        unstable_rethrow(error.cause);
      }
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation.react-server.js
var require_navigation_react_server = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation.react-server.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      ReadonlyURLSearchParams: function() {
        return _readonlyurlsearchparams.ReadonlyURLSearchParams;
      },
      RedirectType: function() {
        return RedirectType;
      },
      forbidden: function() {
        return _forbidden.forbidden;
      },
      notFound: function() {
        return _notfound.notFound;
      },
      permanentRedirect: function() {
        return _redirect.permanentRedirect;
      },
      redirect: function() {
        return _redirect.redirect;
      },
      unauthorized: function() {
        return _unauthorized.unauthorized;
      },
      unstable_isUnrecognizedActionError: function() {
        return unstable_isUnrecognizedActionError;
      },
      unstable_rethrow: function() {
        return _unstablerethrow.unstable_rethrow;
      }
    });
    var _readonlyurlsearchparams = require_readonly_url_search_params();
    var _redirect = require_redirect();
    var _notfound = require_not_found();
    var _forbidden = require_forbidden();
    var _unauthorized = require_unauthorized();
    var _unstablerethrow = require_unstable_rethrow();
    function unstable_isUnrecognizedActionError() {
      throw Object.defineProperty(new Error("`unstable_isUnrecognizedActionError` can only be used on the client."), "__NEXT_ERROR_CODE", {
        value: "E776",
        enumerable: false,
        configurable: true
      });
    }
    var RedirectType = {
      push: "push",
      replace: "replace"
    };
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/@edge-runtime/cookies/index.js
var require_cookies = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/compiled/@edge-runtime/cookies/index.js"(exports, module) {
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
    var src_exports = {};
    __export(src_exports, {
      RequestCookies: () => RequestCookies,
      ResponseCookies: () => ResponseCookies,
      parseCookie: () => parseCookie,
      parseSetCookie: () => parseSetCookie,
      stringifyCookie: () => stringifyCookie
    });
    module.exports = __toCommonJS(src_exports);
    function stringifyCookie(c) {
      var _a;
      const attrs = [
        "path" in c && c.path && `Path=${c.path}`,
        "expires" in c && (c.expires || c.expires === 0) && `Expires=${(typeof c.expires === "number" ? new Date(c.expires) : c.expires).toUTCString()}`,
        "maxAge" in c && typeof c.maxAge === "number" && `Max-Age=${c.maxAge}`,
        "domain" in c && c.domain && `Domain=${c.domain}`,
        "secure" in c && c.secure && "Secure",
        "httpOnly" in c && c.httpOnly && "HttpOnly",
        "sameSite" in c && c.sameSite && `SameSite=${c.sameSite}`,
        "partitioned" in c && c.partitioned && "Partitioned",
        "priority" in c && c.priority && `Priority=${c.priority}`
      ].filter(Boolean);
      const stringified = `${c.name}=${encodeURIComponent((_a = c.value) != null ? _a : "")}`;
      return attrs.length === 0 ? stringified : `${stringified}; ${attrs.join("; ")}`;
    }
    function parseCookie(cookie) {
      const map = /* @__PURE__ */ new Map();
      for (const pair of cookie.split(/; */)) {
        if (!pair)
          continue;
        const splitAt = pair.indexOf("=");
        if (splitAt === -1) {
          map.set(pair, "true");
          continue;
        }
        const [key, value] = [pair.slice(0, splitAt), pair.slice(splitAt + 1)];
        try {
          map.set(key, decodeURIComponent(value != null ? value : "true"));
        } catch {
        }
      }
      return map;
    }
    function parseSetCookie(setCookie) {
      if (!setCookie) {
        return void 0;
      }
      const [[name, value], ...attributes] = parseCookie(setCookie);
      const {
        domain,
        expires,
        httponly,
        maxage,
        path,
        samesite,
        secure,
        partitioned,
        priority
      } = Object.fromEntries(
        attributes.map(([key, value2]) => [
          key.toLowerCase().replace(/-/g, ""),
          value2
        ])
      );
      const cookie = {
        name,
        value: decodeURIComponent(value),
        domain,
        ...expires && { expires: new Date(expires) },
        ...httponly && { httpOnly: true },
        ...typeof maxage === "string" && { maxAge: Number(maxage) },
        path,
        ...samesite && { sameSite: parseSameSite(samesite) },
        ...secure && { secure: true },
        ...priority && { priority: parsePriority(priority) },
        ...partitioned && { partitioned: true }
      };
      return compact(cookie);
    }
    function compact(t) {
      const newT = {};
      for (const key in t) {
        if (t[key]) {
          newT[key] = t[key];
        }
      }
      return newT;
    }
    var SAME_SITE = ["strict", "lax", "none"];
    function parseSameSite(string) {
      string = string.toLowerCase();
      return SAME_SITE.includes(string) ? string : void 0;
    }
    var PRIORITY = ["low", "medium", "high"];
    function parsePriority(string) {
      string = string.toLowerCase();
      return PRIORITY.includes(string) ? string : void 0;
    }
    function splitCookiesString(cookiesString) {
      if (!cookiesString)
        return [];
      var cookiesStrings = [];
      var pos = 0;
      var start;
      var ch;
      var lastComma;
      var nextStart;
      var cookiesSeparatorFound;
      function skipWhitespace() {
        while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
          pos += 1;
        }
        return pos < cookiesString.length;
      }
      function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
      }
      while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
          ch = cookiesString.charAt(pos);
          if (ch === ",") {
            lastComma = pos;
            pos += 1;
            skipWhitespace();
            nextStart = pos;
            while (pos < cookiesString.length && notSpecialChar()) {
              pos += 1;
            }
            if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
              cookiesSeparatorFound = true;
              pos = nextStart;
              cookiesStrings.push(cookiesString.substring(start, lastComma));
              start = pos;
            } else {
              pos = lastComma + 1;
            }
          } else {
            pos += 1;
          }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
          cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
      }
      return cookiesStrings;
    }
    var RequestCookies = class {
      constructor(requestHeaders) {
        this._parsed = /* @__PURE__ */ new Map();
        this._headers = requestHeaders;
        const header = requestHeaders.get("cookie");
        if (header) {
          const parsed = parseCookie(header);
          for (const [name, value] of parsed) {
            this._parsed.set(name, { name, value });
          }
        }
      }
      [Symbol.iterator]() {
        return this._parsed[Symbol.iterator]();
      }
      /**
       * The amount of cookies received from the client
       */
      get size() {
        return this._parsed.size;
      }
      get(...args) {
        const name = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(name);
      }
      getAll(...args) {
        var _a;
        const all = Array.from(this._parsed);
        if (!args.length) {
          return all.map(([_, value]) => value);
        }
        const name = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter(([n]) => n === name).map(([_, value]) => value);
      }
      has(name) {
        return this._parsed.has(name);
      }
      set(...args) {
        const [name, value] = args.length === 1 ? [args[0].name, args[0].value] : args;
        const map = this._parsed;
        map.set(name, { name, value });
        this._headers.set(
          "cookie",
          Array.from(map).map(([_, value2]) => stringifyCookie(value2)).join("; ")
        );
        return this;
      }
      /**
       * Delete the cookies matching the passed name or names in the request.
       */
      delete(names) {
        const map = this._parsed;
        const result = !Array.isArray(names) ? map.delete(names) : names.map((name) => map.delete(name));
        this._headers.set(
          "cookie",
          Array.from(map).map(([_, value]) => stringifyCookie(value)).join("; ")
        );
        return result;
      }
      /**
       * Delete all the cookies in the cookies in the request.
       */
      clear() {
        this.delete(Array.from(this._parsed.keys()));
        return this;
      }
      /**
       * Format the cookies in the request as a string for logging
       */
      [/* @__PURE__ */ Symbol.for("edge-runtime.inspect.custom")]() {
        return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
      }
      toString() {
        return [...this._parsed.values()].map((v) => `${v.name}=${encodeURIComponent(v.value)}`).join("; ");
      }
    };
    var ResponseCookies = class {
      constructor(responseHeaders) {
        this._parsed = /* @__PURE__ */ new Map();
        var _a, _b, _c;
        this._headers = responseHeaders;
        const setCookie = (_c = (_b = (_a = responseHeaders.getSetCookie) == null ? void 0 : _a.call(responseHeaders)) != null ? _b : responseHeaders.get("set-cookie")) != null ? _c : [];
        const cookieStrings = Array.isArray(setCookie) ? setCookie : splitCookiesString(setCookie);
        for (const cookieString of cookieStrings) {
          const parsed = parseSetCookie(cookieString);
          if (parsed)
            this._parsed.set(parsed.name, parsed);
        }
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
       */
      get(...args) {
        const key = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(key);
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
       */
      getAll(...args) {
        var _a;
        const all = Array.from(this._parsed.values());
        if (!args.length) {
          return all;
        }
        const key = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter((c) => c.name === key);
      }
      has(name) {
        return this._parsed.has(name);
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
       */
      set(...args) {
        const [name, value, cookie] = args.length === 1 ? [args[0].name, args[0].value, args[0]] : args;
        const map = this._parsed;
        map.set(name, normalizeCookie({ name, value, ...cookie }));
        replace(map, this._headers);
        return this;
      }
      /**
       * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
       */
      delete(...args) {
        const [name, options] = typeof args[0] === "string" ? [args[0]] : [args[0].name, args[0]];
        return this.set({ ...options, name, value: "", expires: /* @__PURE__ */ new Date(0) });
      }
      [/* @__PURE__ */ Symbol.for("edge-runtime.inspect.custom")]() {
        return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
      }
      toString() {
        return [...this._parsed.values()].map(stringifyCookie).join("; ");
      }
    };
    function replace(bag, headers) {
      headers.delete("set-cookie");
      for (const [, value] of bag) {
        const serialized = stringifyCookie(value);
        headers.append("set-cookie", serialized);
      }
    }
    function normalizeCookie(cookie = { name: "", value: "" }) {
      if (typeof cookie.expires === "number") {
        cookie.expires = new Date(cookie.expires);
      }
      if (cookie.maxAge) {
        cookie.expires = new Date(Date.now() + cookie.maxAge * 1e3);
      }
      if (cookie.path === null || cookie.path === void 0) {
        cookie.path = "/";
      }
      return cookie;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/cookies.js
var require_cookies2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/cookies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      RequestCookies: function() {
        return _cookies.RequestCookies;
      },
      ResponseCookies: function() {
        return _cookies.ResponseCookies;
      },
      stringifyCookie: function() {
        return _cookies.stringifyCookie;
      }
    });
    var _cookies = require_cookies();
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js
var require_reflect = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/reflect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ReflectAdapter", {
      enumerable: true,
      get: function() {
        return ReflectAdapter;
      }
    });
    var ReflectAdapter = class {
      static get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      }
      static set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
      }
      static has(target, prop) {
        return Reflect.has(target, prop);
      }
      static deleteProperty(target, prop) {
        return Reflect.deleteProperty(target, prop);
      }
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/action-revalidation-kind.js
var require_action_revalidation_kind = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/action-revalidation-kind.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      ActionDidNotRevalidate: function() {
        return ActionDidNotRevalidate;
      },
      ActionDidRevalidateDynamicOnly: function() {
        return ActionDidRevalidateDynamicOnly;
      },
      ActionDidRevalidateStaticAndDynamic: function() {
        return ActionDidRevalidateStaticAndDynamic;
      }
    });
    var ActionDidNotRevalidate = 0;
    var ActionDidRevalidateStaticAndDynamic = 1;
    var ActionDidRevalidateDynamicOnly = 2;
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js
var require_request_cookies = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      MutableRequestCookiesAdapter: function() {
        return MutableRequestCookiesAdapter;
      },
      ReadonlyRequestCookiesError: function() {
        return ReadonlyRequestCookiesError;
      },
      RequestCookiesAdapter: function() {
        return RequestCookiesAdapter;
      },
      appendMutableCookies: function() {
        return appendMutableCookies;
      },
      areCookiesMutableInCurrentPhase: function() {
        return areCookiesMutableInCurrentPhase;
      },
      createCookiesWithMutableAccessCheck: function() {
        return createCookiesWithMutableAccessCheck;
      },
      getModifiedCookieValues: function() {
        return getModifiedCookieValues;
      },
      responseCookiesToRequestCookies: function() {
        return responseCookiesToRequestCookies;
      }
    });
    var _cookies = require_cookies2();
    var _reflect = require_reflect();
    var _workasyncstorageexternal = require_work_async_storage_external();
    var _actionrevalidationkind = require_action_revalidation_kind();
    var ReadonlyRequestCookiesError = class _ReadonlyRequestCookiesError extends Error {
      constructor() {
        super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options");
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
          value: "E1180",
          enumerable: false,
          configurable: true
        });
      }
      static callable() {
        throw new _ReadonlyRequestCookiesError();
      }
    };
    var RequestCookiesAdapter = class {
      static seal(cookies) {
        return new Proxy(cookies, {
          get(target, prop, receiver) {
            switch (prop) {
              case "clear":
              case "delete":
              case "set":
                return ReadonlyRequestCookiesError.callable;
              default:
                return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
          }
        });
      }
      /**
      * @param cookies
      * @returns A fresh object identity backed by the original value
      */
      static fresh(cookies) {
        return new Proxy(cookies, {
          get(target, prop, receiver) {
            return _reflect.ReflectAdapter.get(target, prop, receiver);
          }
        });
      }
    };
    var SYMBOL_MODIFY_COOKIE_VALUES = /* @__PURE__ */ Symbol.for("next.mutated.cookies");
    function getModifiedCookieValues(cookies) {
      const modified = cookies[SYMBOL_MODIFY_COOKIE_VALUES];
      if (!modified || !Array.isArray(modified) || modified.length === 0) {
        return [];
      }
      return modified;
    }
    function appendMutableCookies(headers, mutableCookies) {
      const modifiedCookieValues = getModifiedCookieValues(mutableCookies);
      if (modifiedCookieValues.length === 0) {
        return false;
      }
      const resCookies = new _cookies.ResponseCookies(headers);
      const returnedCookies = resCookies.getAll();
      for (const cookie of modifiedCookieValues) {
        resCookies.set(cookie);
      }
      for (const cookie of returnedCookies) {
        resCookies.set(cookie);
      }
      return true;
    }
    var MutableRequestCookiesAdapter = class {
      static wrap(cookies, onUpdateCookies) {
        const responseCookies = new _cookies.ResponseCookies(new Headers());
        for (const cookie of cookies.getAll()) {
          responseCookies.set(cookie);
        }
        let modifiedValues = [];
        const modifiedCookies = /* @__PURE__ */ new Set();
        const updateResponseCookies = () => {
          const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
          if (workStore) {
            workStore.pathWasRevalidated = _actionrevalidationkind.ActionDidRevalidateStaticAndDynamic;
          }
          const allCookies = responseCookies.getAll();
          modifiedValues = allCookies.filter((c) => modifiedCookies.has(c.name));
          if (onUpdateCookies) {
            const serializedCookies = [];
            for (const cookie of modifiedValues) {
              const tempCookies = new _cookies.ResponseCookies(new Headers());
              tempCookies.set(cookie);
              serializedCookies.push(tempCookies.toString());
            }
            onUpdateCookies(serializedCookies);
          }
        };
        const wrappedCookies = new Proxy(responseCookies, {
          get(target, prop, receiver) {
            switch (prop) {
              // A special symbol to get the modified cookie values
              case SYMBOL_MODIFY_COOKIE_VALUES:
                return modifiedValues;
              // TODO: Throw error if trying to set a cookie after the response
              // headers have been set.
              case "delete":
                return function(...args) {
                  modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                  try {
                    target.delete(...args);
                    return wrappedCookies;
                  } finally {
                    updateResponseCookies();
                  }
                };
              case "set":
                return function(...args) {
                  modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                  try {
                    target.set(...args);
                    return wrappedCookies;
                  } finally {
                    updateResponseCookies();
                  }
                };
              default:
                return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
          }
        });
        return wrappedCookies;
      }
    };
    function createCookiesWithMutableAccessCheck(requestStore) {
      const wrappedCookies = new Proxy(requestStore.mutableCookies, {
        get(target, prop, receiver) {
          switch (prop) {
            case "delete":
              return function(...args) {
                ensureCookiesAreStillMutable(requestStore, "cookies().delete");
                target.delete(...args);
                return wrappedCookies;
              };
            case "set":
              return function(...args) {
                ensureCookiesAreStillMutable(requestStore, "cookies().set");
                target.set(...args);
                return wrappedCookies;
              };
            default:
              return _reflect.ReflectAdapter.get(target, prop, receiver);
          }
        }
      });
      return wrappedCookies;
    }
    function areCookiesMutableInCurrentPhase(requestStore) {
      return requestStore.phase === "action";
    }
    function ensureCookiesAreStillMutable(requestStore, _callingExpression) {
      if (!areCookiesMutableInCurrentPhase(requestStore)) {
        throw new ReadonlyRequestCookiesError();
      }
    }
    function responseCookiesToRequestCookies(responseCookies) {
      const requestCookies = new _cookies.RequestCookies(new Headers());
      for (const cookie of responseCookies.getAll()) {
        requestCookies.set(cookie);
      }
      return requestCookies;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/headers.js
var require_headers = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/web/spec-extension/adapters/headers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      HeadersAdapter: function() {
        return HeadersAdapter;
      },
      ReadonlyHeadersError: function() {
        return ReadonlyHeadersError;
      }
    });
    var _reflect = require_reflect();
    var ReadonlyHeadersError = class _ReadonlyHeadersError extends Error {
      constructor() {
        super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
          value: "E1176",
          enumerable: false,
          configurable: true
        });
      }
      static callable() {
        throw new _ReadonlyHeadersError();
      }
    };
    var HeadersAdapter = class _HeadersAdapter extends Headers {
      constructor(headers) {
        super();
        this.headers = new Proxy(headers, {
          get(target, prop, receiver) {
            if (typeof prop === "symbol") {
              return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
            const lowercased = prop.toLowerCase();
            const original = Object.keys(headers).find((o) => o.toLowerCase() === lowercased);
            if (typeof original === "undefined") return;
            return _reflect.ReflectAdapter.get(target, original, receiver);
          },
          set(target, prop, value, receiver) {
            if (typeof prop === "symbol") {
              return _reflect.ReflectAdapter.set(target, prop, value, receiver);
            }
            const lowercased = prop.toLowerCase();
            const original = Object.keys(headers).find((o) => o.toLowerCase() === lowercased);
            return _reflect.ReflectAdapter.set(target, original ?? prop, value, receiver);
          },
          has(target, prop) {
            if (typeof prop === "symbol") return _reflect.ReflectAdapter.has(target, prop);
            const lowercased = prop.toLowerCase();
            const original = Object.keys(headers).find((o) => o.toLowerCase() === lowercased);
            if (typeof original === "undefined") return false;
            return _reflect.ReflectAdapter.has(target, original);
          },
          deleteProperty(target, prop) {
            if (typeof prop === "symbol") return _reflect.ReflectAdapter.deleteProperty(target, prop);
            const lowercased = prop.toLowerCase();
            const original = Object.keys(headers).find((o) => o.toLowerCase() === lowercased);
            if (typeof original === "undefined") return true;
            return _reflect.ReflectAdapter.deleteProperty(target, original);
          }
        });
      }
      /**
      * Seals a Headers instance to prevent modification by throwing an error when
      * any mutating method is called.
      */
      static seal(headers) {
        return new Proxy(headers, {
          get(target, prop, receiver) {
            switch (prop) {
              case "append":
              case "delete":
              case "set":
                return ReadonlyHeadersError.callable;
              default:
                return _reflect.ReflectAdapter.get(target, prop, receiver);
            }
          }
        });
      }
      /**
      * @param headers
      * @returns A fresh object identity backed by the original value
      */
      static fresh(headers) {
        return new Proxy(headers, {
          get(target, prop, receiver) {
            return _reflect.ReflectAdapter.get(target, prop, receiver);
          }
        });
      }
      /**
      * Merges a header value into a string. This stores multiple values as an
      * array, so we need to merge them into a string.
      *
      * @param value a header value
      * @returns a merged header value (a string)
      */
      merge(value) {
        if (Array.isArray(value)) return value.join(", ");
        return value;
      }
      /**
      * Creates a Headers instance from a plain object or a Headers instance.
      *
      * @param headers a plain object or a Headers instance
      * @returns a headers instance
      */
      static from(headers) {
        if (headers instanceof Headers) return headers;
        return new _HeadersAdapter(headers);
      }
      append(name, value) {
        const existing = this.headers[name];
        if (typeof existing === "string") {
          this.headers[name] = [
            existing,
            value
          ];
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          this.headers[name] = value;
        }
      }
      delete(name) {
        delete this.headers[name];
      }
      get(name) {
        const value = this.headers[name];
        if (typeof value !== "undefined") return this.merge(value);
        return null;
      }
      has(name) {
        return typeof this.headers[name] !== "undefined";
      }
      set(name, value) {
        this.headers[name] = value;
      }
      forEach(callbackfn, thisArg) {
        for (const [name, value] of this.entries()) {
          callbackfn.call(thisArg, value, name, this);
        }
      }
      *entries() {
        for (const key of Object.keys(this.headers)) {
          const name = key.toLowerCase();
          const value = this.get(name);
          yield [
            name,
            value
          ];
        }
      }
      *keys() {
        for (const key of Object.keys(this.headers)) {
          const name = key.toLowerCase();
          yield name;
        }
      }
      *values() {
        for (const key of Object.keys(this.headers)) {
          const value = this.get(key);
          yield value;
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-relative-url.js
var require_parse_relative_url = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/router/utils/parse-relative-url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "parseRelativeUrl", {
      enumerable: true,
      get: function() {
        return parseRelativeUrl;
      }
    });
    var _utils = require_utils();
    var _querystring = require_querystring();
    function parseRelativeUrl(url, base, parseQuery = true) {
      const globalBase = new URL(typeof window === "undefined" ? "http://n" : (0, _utils.getLocationOrigin)());
      const resolvedBase = base ? new URL(base, globalBase) : url.startsWith(".") ? new URL(typeof window === "undefined" ? "http://n" : window.location.href) : globalBase;
      const { pathname, searchParams, search, hash, href, origin } = url.startsWith("/") ? (
        // See https://nodejs.org/api/http.html#messageurl
        // Not using `origin` to support other protocols
        new URL(`${resolvedBase.protocol}//${resolvedBase.host}${url}`)
      ) : new URL(url, resolvedBase);
      if (origin !== globalBase.origin) {
        throw Object.defineProperty(new Error(`invariant: invalid relative URL, router received ${url}`), "__NEXT_ERROR_CODE", {
          value: "E159",
          enumerable: false,
          configurable: true
        });
      }
      return {
        auth: null,
        host: null,
        hostname: null,
        pathname,
        port: null,
        protocol: null,
        query: parseQuery ? (0, _querystring.searchParamsToUrlQuery)(searchParams) : void 0,
        search,
        hash,
        href: href.slice(origin.length),
        // We don't know for relative URLs at this point since we set a custom, internal
        // base that isn't surfaced to users.
        slashes: null
      };
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/instant-validation-error.js
var require_instant_validation_error = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/instant-validation-error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      InstantValidationError: function() {
        return InstantValidationError;
      },
      isInstantValidationError: function() {
        return isInstantValidationError;
      }
    });
    var INSTANT_VALIDATION_ERROR_DIGEST = "INSTANT_VALIDATION_ERROR";
    function isInstantValidationError(err) {
      return !!(err && typeof err === "object" && err instanceof Error && err.digest === INSTANT_VALIDATION_ERROR_DIGEST);
    }
    var InstantValidationError = class extends Error {
      constructor(...args) {
        super(...args), this.digest = INSTANT_VALIDATION_ERROR_DIGEST;
      }
    };
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/reflect-utils.js
var require_reflect_utils = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/shared/lib/utils/reflect-utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      describeHasCheckingStringProperty: function() {
        return describeHasCheckingStringProperty;
      },
      describeStringPropertyAccess: function() {
        return describeStringPropertyAccess;
      },
      wellKnownProperties: function() {
        return wellKnownProperties;
      }
    });
    var isDefinitelyAValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    function describeStringPropertyAccess(target, prop) {
      if (isDefinitelyAValidIdentifier.test(prop)) {
        return `\`${target}.${prop}\``;
      }
      return `\`${target}[${JSON.stringify(prop)}]\``;
    }
    function describeHasCheckingStringProperty(target, prop) {
      const stringifiedProp = JSON.stringify(prop);
      return `\`Reflect.has(${target}, ${stringifiedProp})\`, \`${stringifiedProp} in ${target}\`, or similar`;
    }
    var wellKnownProperties = /* @__PURE__ */ new Set([
      "hasOwnProperty",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "toString",
      "valueOf",
      "toLocaleString",
      // Promise prototype
      "then",
      "catch",
      "finally",
      // React Promise extension
      "status",
      // 'value',
      // 'error',
      // React introspection
      "displayName",
      "_debugInfo",
      // Common tested properties
      "toJSON",
      "$$typeof",
      "__esModule",
      // Tested by flight when checking for iterables
      "@@iterator"
    ]);
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/instant-samples.js
var require_instant_samples = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/server/app-render/instant-validation/instant-samples.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      assertRootParamInSamples: function() {
        return assertRootParamInSamples;
      },
      createCookiesFromSample: function() {
        return createCookiesFromSample;
      },
      createDraftModeForValidation: function() {
        return createDraftModeForValidation;
      },
      createExhaustiveParamsProxy: function() {
        return createExhaustiveParamsProxy;
      },
      createExhaustiveSearchParamsProxy: function() {
        return createExhaustiveSearchParamsProxy;
      },
      createExhaustiveURLSearchParamsProxy: function() {
        return createExhaustiveURLSearchParamsProxy;
      },
      createHeadersFromSample: function() {
        return createHeadersFromSample;
      },
      createRelativeURLFromSamples: function() {
        return createRelativeURLFromSamples;
      },
      createValidationSampleTracking: function() {
        return createValidationSampleTracking;
      },
      trackMissingSampleError: function() {
        return trackMissingSampleError;
      },
      trackMissingSampleErrorAndThrow: function() {
        return trackMissingSampleErrorAndThrow;
      }
    });
    var _cookies = require_cookies2();
    var _requestcookies = require_request_cookies();
    var _headers = require_headers();
    var _getsegmentparam = require_get_segment_param();
    var _parserelativeurl = require_parse_relative_url();
    var _invarianterror = require_invariant_error();
    var _instantvalidationerror = require_instant_validation_error();
    var _workunitasyncstorageexternal = require_work_unit_async_storage_external();
    var _reflectutils = require_reflect_utils();
    function createValidationSampleTracking() {
      return {
        missingSampleErrors: []
      };
    }
    function getExpectedSampleTracking() {
      let validationSampleTracking = null;
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (workUnitStore) {
        switch (workUnitStore.type) {
          case "request":
          case "validation-client":
            validationSampleTracking = workUnitStore.validationSampleTracking ?? null;
            break;
          case "cache":
          case "private-cache":
          case "unstable-cache":
          case "prerender-legacy":
          case "prerender-ppr":
          case "prerender-client":
          case "prerender":
          case "prerender-runtime":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      if (!validationSampleTracking) {
        throw Object.defineProperty(new _invarianterror.InvariantError("Expected to have a workUnitStore that provides validationSampleTracking"), "__NEXT_ERROR_CODE", {
          value: "E1110",
          enumerable: false,
          configurable: true
        });
      }
      return validationSampleTracking;
    }
    function trackMissingSampleError(error) {
      const validationSampleTracking = getExpectedSampleTracking();
      validationSampleTracking.missingSampleErrors.push(error);
    }
    function trackMissingSampleErrorAndThrow(error) {
      trackMissingSampleError(error);
      throw error;
    }
    function createCookiesFromSample(sampleCookies, route) {
      const declaredNames = /* @__PURE__ */ new Set();
      const cookies = new _cookies.RequestCookies(new Headers());
      if (sampleCookies) {
        for (const cookie of sampleCookies) {
          declaredNames.add(cookie.name);
          if (cookie.value !== null) {
            cookies.set(cookie.name, cookie.value);
          }
        }
      }
      const sealed = _requestcookies.RequestCookiesAdapter.seal(cookies);
      return new Proxy(sealed, {
        get(target, prop, receiver) {
          if (prop === "has") {
            const originalMethod = Reflect.get(target, prop, receiver);
            const wrappedMethod = function(name) {
              if (!declaredNames.has(name)) {
                trackMissingSampleErrorAndThrow(createMissingCookieSampleError(route, name));
              }
              return originalMethod.call(target, name);
            };
            return wrappedMethod;
          }
          if (prop === "get") {
            const originalMethod = Reflect.get(target, prop, receiver);
            const wrappedMethod = function(nameOrCookie) {
              let name;
              if (typeof nameOrCookie === "string") {
                name = nameOrCookie;
              } else if (nameOrCookie && typeof nameOrCookie === "object" && typeof nameOrCookie.name === "string") {
                name = nameOrCookie.name;
              } else {
                return originalMethod.call(target, nameOrCookie);
              }
              if (!declaredNames.has(name)) {
                trackMissingSampleErrorAndThrow(createMissingCookieSampleError(route, name));
              }
              return originalMethod.call(target, name);
            };
            return wrappedMethod;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    function createMissingCookieSampleError(route, name) {
      return Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${route}" accessed cookie "${name}" which is not defined in the \`unstable_samples\` of \`instant\`. Add it to the sample's \`cookies\` array, or \`{ name: "${name}", value: null }\` if it should be absent.`), "__NEXT_ERROR_CODE", {
        value: "E1346",
        enumerable: false,
        configurable: true
      });
    }
    function createHeadersFromSample(rawSampleHeaders, sampleCookies, route) {
      const sampleHeaders = rawSampleHeaders ? [
        ...rawSampleHeaders
      ] : [];
      if (sampleHeaders.find(([name]) => name.toLowerCase() === "cookie")) {
        throw Object.defineProperty(new _instantvalidationerror.InstantValidationError('Invalid sample: Defining cookies via a "cookie" header is not supported. Use `cookies: [{ name: ..., value: ... }]` instead.'), "__NEXT_ERROR_CODE", {
          value: "E1111",
          enumerable: false,
          configurable: true
        });
      }
      if (sampleCookies) {
        const cookieHeaderValue = sampleCookies.toString();
        sampleHeaders.push([
          "cookie",
          // if the `cookies` samples were empty, or they were all `null`, then we have no cookies,
          // and the header isn't present, but should remains readable, so we set it to null.
          cookieHeaderValue !== "" ? cookieHeaderValue : null
        ]);
      }
      const declaredNames = /* @__PURE__ */ new Set();
      const headersInit = {};
      for (const [name, value] of sampleHeaders) {
        declaredNames.add(name.toLowerCase());
        if (value !== null) {
          headersInit[name.toLowerCase()] = value;
        }
      }
      const sealed = _headers.HeadersAdapter.seal(_headers.HeadersAdapter.from(headersInit));
      return new Proxy(sealed, {
        get(target, prop, receiver) {
          if (prop === "get" || prop === "has") {
            const originalMethod = Reflect.get(target, prop, receiver);
            const patchedMethod = function(rawName) {
              const name = rawName.toLowerCase();
              if (!declaredNames.has(name)) {
                trackMissingSampleErrorAndThrow(Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${route}" accessed header "${name}" which is not defined in the \`unstable_samples\` of \`instant\`. Add it to the sample's \`headers\` array, or \`["${name}", null]\` if it should be absent.`), "__NEXT_ERROR_CODE", {
                  value: "E1348",
                  enumerable: false,
                  configurable: true
                }));
              }
              return originalMethod.call(target, name);
            };
            return patchedMethod;
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    function createDraftModeForValidation() {
      return {
        get isEnabled() {
          return false;
        },
        enable() {
          throw Object.defineProperty(new Error("Draft mode cannot be enabled during build-time instant validation."), "__NEXT_ERROR_CODE", {
            value: "E1092",
            enumerable: false,
            configurable: true
          });
        },
        disable() {
          throw Object.defineProperty(new Error("Draft mode cannot be disabled during build-time instant validation."), "__NEXT_ERROR_CODE", {
            value: "E1094",
            enumerable: false,
            configurable: true
          });
        }
      };
    }
    function createExhaustiveParamsProxy(underlyingParams, declaredParamNames, route) {
      return new Proxy(underlyingParams, {
        get(target, prop, receiver) {
          if (typeof prop === "string" && !_reflectutils.wellKnownProperties.has(prop) && // Only error when accessing a param that is part of the route but wasn't provided.
          // accessing properties that aren't expected to be a valid param value is fine.
          prop in underlyingParams && !declaredParamNames.has(prop)) {
            trackMissingSampleErrorAndThrow(Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${route}" accessed param "${prop}" which is not defined in the \`unstable_samples\` of \`instant\`. Add it to the sample's \`params\` object.`), "__NEXT_ERROR_CODE", {
              value: "E1349",
              enumerable: false,
              configurable: true
            }));
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
    function createExhaustiveSearchParamsProxy(searchParams, declaredSearchParamNames, route) {
      return new Proxy(searchParams, {
        get(target, prop, receiver) {
          if (typeof prop === "string" && !_reflectutils.wellKnownProperties.has(prop) && !declaredSearchParamNames.has(prop)) {
            trackMissingSampleErrorAndThrow(createMissingSearchParamSampleError(route, prop));
          }
          return Reflect.get(target, prop, receiver);
        },
        has(target, prop) {
          if (typeof prop === "string" && !_reflectutils.wellKnownProperties.has(prop) && !declaredSearchParamNames.has(prop)) {
            trackMissingSampleErrorAndThrow(createMissingSearchParamSampleError(route, prop));
          }
          return Reflect.has(target, prop);
        }
      });
    }
    function createExhaustiveURLSearchParamsProxy(searchParams, declaredSearchParamNames, route) {
      return new Proxy(searchParams, {
        get(target, prop, receiver) {
          if (prop === "get" || prop === "getAll" || prop === "has") {
            const originalMathod = Reflect.get(target, prop, receiver);
            return (name) => {
              if (typeof name === "string" && !declaredSearchParamNames.has(name)) {
                trackMissingSampleErrorAndThrow(createMissingSearchParamSampleError(route, name));
              }
              return originalMathod.call(target, name);
            };
          }
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === "function" && !Object.hasOwn(target, prop)) {
            return value.bind(target);
          }
          return value;
        }
      });
    }
    function createMissingSearchParamSampleError(route, name) {
      return Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${route}" accessed searchParam "${name}" which is not defined in the \`unstable_samples\` of \`instant\`. Add it to the sample's \`searchParams\` object, or \`{ "${name}": null }\` if it should be absent.`), "__NEXT_ERROR_CODE", {
        value: "E1347",
        enumerable: false,
        configurable: true
      });
    }
    function createRelativeURLFromSamples(route, sampleParams, sampleSearchParams) {
      const pathname = createPathnameFromRouteAndSampleParams(route, sampleParams ?? {});
      let search = "";
      if (sampleSearchParams) {
        const qs = createURLSearchParamsFromSample(sampleSearchParams).toString();
        if (qs) {
          search = "?" + qs;
        }
      }
      return (0, _parserelativeurl.parseRelativeUrl)(pathname + search, void 0, true);
    }
    function createURLSearchParamsFromSample(sampleSearchParams) {
      const result = new URLSearchParams();
      if (sampleSearchParams) {
        for (const [key, value] of Object.entries(sampleSearchParams)) {
          if (value === null || value === void 0) continue;
          if (Array.isArray(value)) {
            for (const v of value) {
              result.append(key, v);
            }
          } else {
            result.set(key, value);
          }
        }
      }
      return result;
    }
    function createPathnameFromRouteAndSampleParams(route, params) {
      let interpolatedSegments = [];
      const rawSegments = route.split("/");
      for (const rawSegment of rawSegments) {
        const param = (0, _getsegmentparam.getSegmentParam)(rawSegment);
        if (param) {
          switch (param.paramType) {
            case "catchall":
            case "optional-catchall": {
              let paramValue = params[param.paramName];
              if (paramValue === void 0) {
                paramValue = [
                  rawSegment
                ];
              } else if (!Array.isArray(paramValue)) {
                throw Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Expected sample param value for segment '${rawSegment}' to be an array of strings, got ${typeof paramValue}`), "__NEXT_ERROR_CODE", {
                  value: "E1104",
                  enumerable: false,
                  configurable: true
                });
              }
              interpolatedSegments.push(...paramValue.map((v) => encodeURIComponent(v)));
              break;
            }
            case "dynamic": {
              let paramValue = params[param.paramName];
              if (paramValue === void 0) {
                paramValue = rawSegment;
              } else if (typeof paramValue !== "string") {
                throw Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Expected sample param value for segment '${rawSegment}' to be a string, got ${typeof paramValue}`), "__NEXT_ERROR_CODE", {
                  value: "E1108",
                  enumerable: false,
                  configurable: true
                });
              }
              interpolatedSegments.push(encodeURIComponent(paramValue));
              break;
            }
            case "catchall-intercepted-(..)(..)":
            case "catchall-intercepted-(.)":
            case "catchall-intercepted-(..)":
            case "catchall-intercepted-(...)":
            case "dynamic-intercepted-(..)(..)":
            case "dynamic-intercepted-(.)":
            case "dynamic-intercepted-(..)":
            case "dynamic-intercepted-(...)": {
              throw Object.defineProperty(new _invarianterror.InvariantError("Not implemented: Validation of interception routes"), "__NEXT_ERROR_CODE", {
                value: "E1106",
                enumerable: false,
                configurable: true
              });
            }
            default: {
              param.paramType;
            }
          }
        } else {
          interpolatedSegments.push(rawSegment);
        }
      }
      return interpolatedSegments.join("/");
    }
    function assertRootParamInSamples(workStore, sampleParams, paramName) {
      if (sampleParams && paramName in sampleParams) {
      } else {
        const route = workStore.route;
        trackMissingSampleErrorAndThrow(Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${route}" accessed root param "${paramName}" which is not defined in the \`unstable_samples\` of \`instant\`. Add it to the sample's \`params\` object.`), "__NEXT_ERROR_CODE", {
          value: "E1192",
          enumerable: false,
          configurable: true
        }));
      }
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/instant-samples.js
var require_instant_samples2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/instant-samples.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      expectCompleteParamsInClientValidation: function() {
        return expectCompleteParamsInClientValidation;
      },
      instrumentParamsForClientValidation: function() {
        return instrumentParamsForClientValidation;
      },
      instrumentSearchParamsForClientValidation: function() {
        return instrumentSearchParamsForClientValidation;
      }
    });
    var _workunitasyncstorageexternal = require_work_unit_async_storage_external();
    var _workasyncstorageexternal = require_work_async_storage_external();
    var _instantsamples = require_instant_samples();
    var _instantvalidationerror = require_instant_validation_error();
    function instrumentParamsForClientValidation(underlyingParams) {
      const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (workStore && workUnitStore) {
        switch (workUnitStore.type) {
          case "validation-client": {
            if (workUnitStore.validationSamples) {
              const declaredKeys = new Set(Object.keys(workUnitStore.validationSamples.params ?? {}));
              return (0, _instantsamples.createExhaustiveParamsProxy)(underlyingParams, declaredKeys, workStore.route);
            }
            break;
          }
          case "prerender-runtime":
          case "prerender-client":
          case "prerender-legacy":
          case "prerender-ppr":
          case "prerender":
          case "cache":
          case "request":
          case "private-cache":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return underlyingParams;
    }
    function expectCompleteParamsInClientValidation(expression) {
      const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (workStore && workUnitStore) {
        switch (workUnitStore.type) {
          case "validation-client": {
            if (workUnitStore.validationSamples) {
              const fallbackParams = workUnitStore.fallbackRouteParams;
              if (fallbackParams && fallbackParams.size > 0) {
                const missingParams = Array.from(fallbackParams.keys());
                (0, _instantsamples.trackMissingSampleErrorAndThrow)(Object.defineProperty(new _instantvalidationerror.InstantValidationError(`Route "${workStore.route}" called ${expression} but param${missingParams.length > 1 ? "s" : ""} ${missingParams.map((p) => `"${p}"`).join(", ")} ${missingParams.length > 1 ? "are" : "is"} not defined in the \`unstable_samples\` of \`instant\`. ${expression} requires all route params to be provided.`), "__NEXT_ERROR_CODE", {
                  value: "E1191",
                  enumerable: false,
                  configurable: true
                }));
              }
            }
            break;
          }
          case "prerender-runtime":
          case "prerender-client":
          case "prerender-legacy":
          case "prerender-ppr":
          case "prerender":
          case "cache":
          case "request":
          case "private-cache":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
    }
    function instrumentSearchParamsForClientValidation(underlyingSearchParams) {
      const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
      const workUnitStore = _workunitasyncstorageexternal.workUnitAsyncStorage.getStore();
      if (workStore && workUnitStore) {
        switch (workUnitStore.type) {
          case "validation-client": {
            if (workUnitStore.validationSamples) {
              const declaredKeys = new Set(Object.keys(workUnitStore.validationSamples.searchParams ?? {}));
              return (0, _instantsamples.createExhaustiveURLSearchParamsProxy)(underlyingSearchParams, declaredKeys, workStore.route);
            }
            break;
          }
          case "prerender-runtime":
          case "prerender-client":
          case "prerender-legacy":
          case "prerender-ppr":
          case "prerender":
          case "cache":
          case "request":
          case "private-cache":
          case "unstable-cache":
          case "generate-static-params":
            break;
          default:
            workUnitStore;
        }
      }
      return underlyingSearchParams;
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation.js
var require_navigation = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/client/components/navigation.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    function _export(target, all) {
      for (var name in all) Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
      });
    }
    _export(exports, {
      // We need the same class that was used to instantiate the context value
      // Otherwise instanceof checks will fail in usercode
      ReadonlyURLSearchParams: function() {
        return _hooksclientcontextsharedruntime.ReadonlyURLSearchParams;
      },
      RedirectType: function() {
        return _navigationreactserver.RedirectType;
      },
      ServerInsertedHTMLContext: function() {
        return _serverinsertedhtmlsharedruntime.ServerInsertedHTMLContext;
      },
      forbidden: function() {
        return _navigationreactserver.forbidden;
      },
      notFound: function() {
        return _navigationreactserver.notFound;
      },
      permanentRedirect: function() {
        return _navigationreactserver.permanentRedirect;
      },
      redirect: function() {
        return _navigationreactserver.redirect;
      },
      unauthorized: function() {
        return _navigationreactserver.unauthorized;
      },
      unstable_isUnrecognizedActionError: function() {
        return _unrecognizedactionerror.unstable_isUnrecognizedActionError;
      },
      unstable_rethrow: function() {
        return _navigationreactserver.unstable_rethrow;
      },
      useParams: function() {
        return useParams;
      },
      usePathname: function() {
        return usePathname2;
      },
      useRouter: function() {
        return useRouter2;
      },
      useSearchParams: function() {
        return useSearchParams;
      },
      useSelectedLayoutSegment: function() {
        return useSelectedLayoutSegment;
      },
      useSelectedLayoutSegments: function() {
        return useSelectedLayoutSegments;
      },
      useServerInsertedHTML: function() {
        return _serverinsertedhtmlsharedruntime.useServerInsertedHTML;
      }
    });
    var _interop_require_wildcard = require_interop_require_wildcard();
    var _react = /* @__PURE__ */ _interop_require_wildcard._(__require("react"));
    var _approutercontextsharedruntime = require_app_router_context_shared_runtime();
    var _hooksclientcontextsharedruntime = require_hooks_client_context_shared_runtime();
    var _segment = require_segment();
    var _navigationdynamicrendering = require_navigation_dynamic_rendering();
    var _serverinsertedhtmlsharedruntime = require_server_inserted_html_shared_runtime();
    var _unrecognizedactionerror = require_unrecognized_action_error();
    var _navigationreactserver = require_navigation_react_server();
    var { instrumentParamsForClientValidation, instrumentSearchParamsForClientValidation, expectCompleteParamsInClientValidation } = process.env.__NEXT_CACHE_COMPONENTS ? require_instant_samples2() : {};
    function useSearchParams() {
      _navigationdynamicrendering.useDynamicSearchParams?.("useSearchParams()");
      const searchParams = (0, _react.useContext)(_hooksclientcontextsharedruntime.SearchParamsContext);
      const readonlySearchParams = (0, _react.useMemo)(() => {
        if (!searchParams) {
          return null;
        }
        return new _hooksclientcontextsharedruntime.ReadonlyURLSearchParams(searchParams);
      }, [
        searchParams
      ]);
      if (typeof window === "undefined" && process.env.__NEXT_CACHE_COMPONENTS && readonlySearchParams) {
        return instrumentSearchParamsForClientValidation(readonlySearchParams);
      }
      if (process.env.NODE_ENV !== "production" && "use" in _react.default) {
        const navigationPromises = (0, _react.use)(_hooksclientcontextsharedruntime.NavigationPromisesContext);
        if (navigationPromises) {
          return (0, _react.use)(navigationPromises.searchParams);
        }
      }
      return readonlySearchParams;
    }
    function usePathname2() {
      _navigationdynamicrendering.useDynamicRouteParams?.("usePathname()");
      const pathname = (0, _react.useContext)(_hooksclientcontextsharedruntime.PathnameContext);
      if (typeof window === "undefined" && process.env.__NEXT_CACHE_COMPONENTS && pathname) {
        expectCompleteParamsInClientValidation("usePathname()");
        return pathname;
      }
      if (process.env.NODE_ENV !== "production" && "use" in _react.default) {
        const navigationPromises = (0, _react.use)(_hooksclientcontextsharedruntime.NavigationPromisesContext);
        if (navigationPromises) {
          return (0, _react.use)(navigationPromises.pathname);
        }
      }
      return pathname;
    }
    function useRouter2() {
      const router = (0, _react.useContext)(_approutercontextsharedruntime.AppRouterContext);
      if (router === null) {
        throw Object.defineProperty(new Error("invariant expected app router to be mounted"), "__NEXT_ERROR_CODE", {
          value: "E238",
          enumerable: false,
          configurable: true
        });
      }
      const layout = (0, _react.useContext)(_approutercontextsharedruntime.LayoutRouterContext);
      const bfcacheIdNumber = layout?.parentCacheNode.bfcacheId ?? 0;
      return (0, _react.useMemo)(() => ({
        back: router.back,
        forward: router.forward,
        refresh: router.refresh,
        hmrRefresh: router.hmrRefresh,
        push: router.push,
        replace: router.replace,
        prefetch: router.prefetch,
        experimental_gesturePush: router.experimental_gesturePush,
        bfcacheId: "_b_" + bfcacheIdNumber + "_"
      }), [
        router,
        bfcacheIdNumber
      ]);
    }
    function useParams() {
      _navigationdynamicrendering.useDynamicRouteParams?.("useParams()");
      const params = (0, _react.useContext)(_hooksclientcontextsharedruntime.PathParamsContext);
      if (typeof window === "undefined" && process.env.__NEXT_CACHE_COMPONENTS && params) {
        return instrumentParamsForClientValidation(params);
      }
      if (process.env.NODE_ENV !== "production" && "use" in _react.default) {
        const navigationPromises = (0, _react.use)(_hooksclientcontextsharedruntime.NavigationPromisesContext);
        if (navigationPromises) {
          return (0, _react.use)(navigationPromises.params);
        }
      }
      return params;
    }
    function useSelectedLayoutSegments(parallelRouteKey = "children") {
      _navigationdynamicrendering.useDynamicRouteParams?.("useSelectedLayoutSegments()");
      const context = (0, _react.useContext)(_approutercontextsharedruntime.LayoutRouterContext);
      if (!context) return null;
      if (typeof window === "undefined" && process.env.__NEXT_CACHE_COMPONENTS && context) {
        expectCompleteParamsInClientValidation("useSelectedLayoutSegments()");
      }
      if (process.env.NODE_ENV !== "production" && "use" in _react.default) {
        const navigationPromises = (0, _react.use)(_hooksclientcontextsharedruntime.NavigationPromisesContext);
        if (navigationPromises) {
          const promise = navigationPromises.selectedLayoutSegmentsPromises?.get(parallelRouteKey);
          if (promise) {
            return (0, _react.use)(promise);
          }
        }
      }
      return (0, _segment.getSelectedLayoutSegmentPath)(context.parentTree, parallelRouteKey);
    }
    function useSelectedLayoutSegment(parallelRouteKey = "children") {
      _navigationdynamicrendering.useDynamicRouteParams?.("useSelectedLayoutSegment()");
      const navigationPromises = (0, _react.useContext)(_hooksclientcontextsharedruntime.NavigationPromisesContext);
      const selectedLayoutSegments = useSelectedLayoutSegments(parallelRouteKey);
      if (typeof window === "undefined" && process.env.__NEXT_CACHE_COMPONENTS) {
        expectCompleteParamsInClientValidation("useSelectedLayoutSegment()");
      }
      if (process.env.NODE_ENV !== "production" && navigationPromises && "use" in _react.default) {
        const promise = navigationPromises.selectedLayoutSegmentPromises?.get(parallelRouteKey);
        if (promise) {
          return (0, _react.use)(promise);
        }
      }
      return (0, _segment.computeSelectedLayoutSegment)(selectedLayoutSegments, parallelRouteKey);
    }
    if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
      Object.defineProperty(exports.default, "__esModule", { value: true });
      Object.assign(exports.default, exports);
      module.exports = exports.default;
    }
  }
});

// ../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/navigation.js
var require_navigation2 = __commonJS({
  "../../node_modules/.pnpm/next@16.3.0_@babel+core@7.29.7_@opentelemetry+api@1.9.1_@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/navigation.js"(exports, module) {
    "use strict";
    module.exports = require_navigation();
  }
});

// src/components/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

// src/utils/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/button.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-120 active:scale-[0.96] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success: "bg-success text-white hover:bg-success/90",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);
var RainbowBorder = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "group relative inline-flex rounded-md p-[1px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(138,43,226,0.4)]",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsx("span", { className: "absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8A2BE2_0%,#F97316_10%,#EF4444_20%,#FF1493_30%,#D946EF_40%,#3B82F6_50%,#6366F1_60%,#06B6D4_70%,#14B8A6_80%,#22C55E_90%,#8A2BE2_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:hidden" }),
          /* @__PURE__ */ jsx("span", { className: "absolute inset-0 rounded-md ring-1 ring-inset ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:opacity-100 hidden motion-reduce:block" }),
          /* @__PURE__ */ jsx("div", { className: "relative inline-flex h-full w-full rounded-md bg-primary", children })
        ]
      }
    );
  }
);
RainbowBorder.displayName = "RainbowBorder";
var DotLoader = () => /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-1", children: [
  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" }),
  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" }),
  /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-current animate-bounce" })
] });
var Button = React.forwardRef(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const content = /* @__PURE__ */ jsxs(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        disabled: isLoading || disabled,
        ...props,
        children: [
          isLoading ? /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx(DotLoader, {}) }) : null,
          /* @__PURE__ */ jsx("span", { className: cn("inline-flex items-center gap-2", isLoading && "opacity-0"), children })
        ]
      }
    );
    if (variant === "primary" && !asChild) {
      return /* @__PURE__ */ jsx(RainbowBorder, { children: content });
    }
    return content;
  }
);
Button.displayName = "Button";

// src/components/input.tsx
import * as React2 from "react";
import { cva as cva2 } from "class-variance-authority";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var inputVariants = cva2(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Input = React2.forwardRef(
  ({ className, type, variant, error, ...props }, ref) => {
    return /* @__PURE__ */ jsxs2("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx2(
        "input",
        {
          type,
          className: cn(inputVariants({ variant: error ? "error" : variant, className })),
          ref,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx2("p", { className: "mt-1 text-xs text-destructive", children: error })
    ] });
  }
);
Input.displayName = "Input";

// src/components/password-input.tsx
import * as React3 from "react";
import { Eye, EyeOff } from "lucide-react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var PasswordInput = React3.forwardRef(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React3.useState(false);
    return /* @__PURE__ */ jsxs3("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx3(
        Input,
        {
          type: showPassword ? "text" : "password",
          className: cn("pr-10", className),
          ref,
          error,
          ...props
        }
      ),
      /* @__PURE__ */ jsxs3(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground",
          onClick: () => setShowPassword((prev) => !prev),
          children: [
            showPassword ? /* @__PURE__ */ jsx3(EyeOff, { className: "h-4 w-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsx3(Eye, { className: "h-4 w-4", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx3("span", { className: "sr-only", children: showPassword ? "Hide password" : "Show password" })
          ]
        }
      )
    ] });
  }
);
PasswordInput.displayName = "PasswordInput";

// src/components/empty-state.tsx
import { Inbox } from "lucide-react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function EmptyState({
  title,
  description,
  icon,
  videoSrc,
  action,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className: cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card text-card-foreground shadow-sm",
        className
      ),
      ...props,
      children: [
        icon ? /* @__PURE__ */ jsx4("div", { className: "mb-4 text-muted-foreground animate-pulse motion-reduce:animate-none", children: icon }) : videoSrc ? /* @__PURE__ */ jsx4(
          "video",
          {
            src: videoSrc,
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
            className: "mb-4 h-16 w-16 opacity-75 rounded-full"
          }
        ) : /* @__PURE__ */ jsx4(Inbox, { className: "mb-4 h-12 w-12 text-muted-foreground opacity-50 animate-bounce motion-reduce:animate-none" }),
        /* @__PURE__ */ jsx4("h3", { className: "text-base font-semibold", children: title }),
        description && /* @__PURE__ */ jsx4("p", { className: "mt-1 max-w-sm text-sm text-muted-foreground", children: description }),
        action && /* @__PURE__ */ jsx4("div", { className: "mt-5", children: action })
      ]
    }
  );
}

// src/components/dialog.tsx
import * as React4 from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var Dialog = DialogPrimitive.Root;
var DialogTrigger = DialogPrimitive.Trigger;
var DialogPortal = DialogPrimitive.Portal;
var DialogClose = DialogPrimitive.Close;
var DialogOverlay = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React4.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs5(DialogPortal, { children: [
  /* @__PURE__ */ jsx5(DialogOverlay, {}),
  /* @__PURE__ */ jsxs5(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full h-[100dvh] sm:h-auto sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-e4 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      "aria-describedby": props["aria-describedby"] ?? void 0,
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs5(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx5(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx5("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx5(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx5(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// src/components/alert-dialog.tsx
import * as React5 from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-dialog";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogTrigger = AlertDialogPrimitive.Trigger;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-[280ms]",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs6(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx6(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx6(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full h-[100dvh] sm:h-auto sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-[280ms] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg border-border",
        className
      ),
      "aria-describedby": props["aria-describedby"] ?? void 0,
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx6(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx6(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  AlertDialogPrimitive.Close,
  {
    ref,
    className: cn(buttonVariants({ variant: "destructive" }), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Close.displayName;
var AlertDialogCancel = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  AlertDialogPrimitive.Close,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Close.displayName;

// src/components/sheet.tsx
import * as React6 from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva as cva3 } from "class-variance-authority";
import { X as X2 } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var Sheet = SheetPrimitive.Root;
var SheetTrigger = SheetPrimitive.Trigger;
var SheetClose = SheetPrimitive.Close;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-[200ms]",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva3(
  "fixed z-50 gap-4 bg-background p-6 shadow-e4 transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-[200ms]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[420px]"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var SheetContent = React6.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs7(SheetPortal, { children: [
  /* @__PURE__ */ jsx7(SheetOverlay, {}),
  /* @__PURE__ */ jsxs7(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      "aria-describedby": props["aria-describedby"] ?? void 0,
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs7(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx7(X2, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx7("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx7(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx7(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/tooltip.tsx
import * as React7 from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx as jsx8 } from "react/jsx-runtime";
var TooltipProvider = ({
  delayDuration = 150,
  ...props
}) => /* @__PURE__ */ jsx8(TooltipPrimitive.Provider, { delayDuration, ...props });
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React7.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx8(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md duration-150 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    ),
    onPointerDownOutside: (e) => {
      if (e.detail?.originalEvent?.pointerType === "touch" || e.pointerType === "touch") e.preventDefault();
    },
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
var TooltipWrapper = React7.forwardRef(({ children, className, ...props }, ref) => {
  return /* @__PURE__ */ jsx8(
    "div",
    {
      ref,
      className: cn("inline-block", className),
      ...props,
      children
    }
  );
});
TooltipWrapper.displayName = "TooltipWrapper";

// src/components/dropdown-menu.tsx
import * as React8 from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React8.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs8(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx9(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React8.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx9(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx9(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-e3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React8.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx9(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React8.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs8(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx9("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx9(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx9(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React8.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs8(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx9("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx9(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx9(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React8.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx9(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx9(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx9(
    "span",
    {
      className: cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/context-menu.tsx
import * as React9 from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check as Check2, ChevronRight as ChevronRight2, Circle as Circle2 } from "lucide-react";
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
var ContextMenu = ContextMenuPrimitive.Root;
var ContextMenuTrigger = ContextMenuPrimitive.Trigger;
var ContextMenuGroup = ContextMenuPrimitive.Group;
var ContextMenuPortal = ContextMenuPrimitive.Portal;
var ContextMenuSub = ContextMenuPrimitive.Sub;
var ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
var ContextMenuSubTrigger = React9.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs9(
  ContextMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx10(ChevronRight2, { className: "ml-auto h-4 w-4" })
    ]
  }
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
var ContextMenuSubContent = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  ContextMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
var ContextMenuContent = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(ContextMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx10(
  ContextMenuPrimitive.Content,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
var ContextMenuItem = React9.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx10(
  ContextMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
var ContextMenuCheckboxItem = React9.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs9(
  ContextMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx10("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx10(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx10(Check2, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
var ContextMenuRadioItem = React9.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs9(
  ContextMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx10("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx10(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx10(Circle2, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
var ContextMenuLabel = React9.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx10(
  ContextMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
var ContextMenuSeparator = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx10(
  ContextMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-border", className),
    ...props
  }
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
var ContextMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx10(
    "span",
    {
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

// src/components/select.tsx
import * as React10 from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check as Check3, ChevronDown, ChevronUp } from "lucide-react";
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React10.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs10(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx11(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx11(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx11(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx11(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx11(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx11(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React10.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx11(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs10(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx11(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx11(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx11(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx11(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React10.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs10(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx11("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx11(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx11(Check3, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx11(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx11(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/checkbox.tsx
import * as React11 from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check as Check4, Minus } from "lucide-react";
import { jsx as jsx12 } from "react/jsx-runtime";
var Checkbox = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx12(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx12(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: props.checked === "indeterminate" ? /* @__PURE__ */ jsx12(Minus, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx12(Check4, { className: "h-3 w-3" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/switch.tsx
import * as React12 from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { jsx as jsx13 } from "react/jsx-runtime";
var Switch = React12.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx13(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx13(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;

// src/components/radio-group.tsx
import * as React13 from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle as Circle3 } from "lucide-react";
import { jsx as jsx14 } from "react/jsx-runtime";
var RadioGroup3 = React13.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx14(
    RadioGroupPrimitive.Root,
    {
      className: cn("grid gap-2", className),
      ...props,
      ref
    }
  );
});
RadioGroup3.displayName = RadioGroupPrimitive.Root.displayName;
var RadioGroupItem = React13.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx14(
    RadioGroupPrimitive.Item,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx14(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx14(Circle3, { className: "h-2.5 w-2.5 fill-current text-current" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

// src/components/slider.tsx
import * as React14 from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { jsx as jsx15, jsxs as jsxs11 } from "react/jsx-runtime";
var Slider = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs11(
  SliderPrimitive.Root,
  {
    ref,
    className: cn(
      "relative flex w-full touch-none select-none items-center",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx15(SliderPrimitive.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsx15(SliderPrimitive.Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsx15(SliderPrimitive.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = SliderPrimitive.Root.displayName;

// src/components/tabs.tsx
import * as React15 from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { jsx as jsx16 } from "react/jsx-runtime";
var Tabs = TabsPrimitive.Root;
var TabsList = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx16(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx16(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx16(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// src/components/accordion.tsx
import * as React16 from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown as ChevronDown2 } from "lucide-react";
import { jsx as jsx17, jsxs as jsxs12 } from "react/jsx-runtime";
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React16.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx17(
  AccordionPrimitive.Item,
  {
    ref,
    className: cn("border-b", className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React16.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx17(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs12(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx17(ChevronDown2, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React16.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx17(
  AccordionPrimitive.Content,
  {
    ref,
    className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down duration-[180ms]",
    ...props,
    children: /* @__PURE__ */ jsx17("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// src/components/collapsible.tsx
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
var Collapsible = CollapsiblePrimitive.Root;
var CollapsibleTrigger2 = CollapsiblePrimitive.CollapsibleTrigger;
var CollapsibleContent2 = CollapsiblePrimitive.CollapsibleContent;

// src/components/scroll-area.tsx
import * as React17 from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { jsx as jsx18, jsxs as jsxs13 } from "react/jsx-runtime";
var ScrollArea = React17.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs13(
  ScrollAreaPrimitive.Root,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx18(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsx18(ScrollBar, {}),
      /* @__PURE__ */ jsx18(ScrollAreaPrimitive.Corner, {})
    ]
  }
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
var ScrollBar = React17.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsx18(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx18(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// src/components/form.tsx
import * as React19 from "react";
import { Slot as Slot2 } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext
} from "react-hook-form";

// src/components/label.tsx
import * as React18 from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva as cva4 } from "class-variance-authority";
import { jsx as jsx19, jsxs as jsxs14 } from "react/jsx-runtime";
var labelVariants = cva4(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
var Label4 = React18.forwardRef(({ className, required, children, ...props }, ref) => /* @__PURE__ */ jsxs14(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props,
    children: [
      children,
      required && /* @__PURE__ */ jsx19("span", { className: "ml-1 text-destructive", children: "*" })
    ]
  }
));
Label4.displayName = LabelPrimitive.Root.displayName;

// src/components/form.tsx
import { jsx as jsx20, jsxs as jsxs15 } from "react/jsx-runtime";
var Form = FormProvider;
var FormFieldContext = React19.createContext(null);
var FormField = ({
  ...props
}) => {
  return /* @__PURE__ */ jsx20(FormFieldContext.Provider, { value: { name: props.name }, children: /* @__PURE__ */ jsx20(Controller, { ...props }) });
};
var useFormField = () => {
  const fieldContext = React19.useContext(FormFieldContext);
  const itemContext = React19.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>");
  }
  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState
  };
};
var FormItemContext = React19.createContext(null);
var FormItem = React19.forwardRef(({ className, ...props }, ref) => {
  const id = React19.useId();
  return /* @__PURE__ */ jsx20(FormItemContext.Provider, { value: { id }, children: /* @__PURE__ */ jsx20("div", { ref, className: cn("space-y-2", className), ...props }) });
});
FormItem.displayName = "FormItem";
var FormLabel = React19.forwardRef(({ className, required, children, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return /* @__PURE__ */ jsxs15(
    Label4,
    {
      ref,
      className: cn(error && "text-destructive", className),
      htmlFor: formItemId,
      ...props,
      children: [
        children,
        required && /* @__PURE__ */ jsx20("span", { className: "ml-1 text-destructive", children: "*" })
      ]
    }
  );
});
FormLabel.displayName = "FormLabel";
var FormControl = React19.forwardRef(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return /* @__PURE__ */ jsx20(
    Slot2,
    {
      ref,
      id: formItemId,
      "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !!error,
      ...props
    }
  );
});
FormControl.displayName = "FormControl";
var FormDescription = React19.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return /* @__PURE__ */ jsx20(
    "p",
    {
      ref,
      id: formDescriptionId,
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
});
FormDescription.displayName = "FormDescription";
var FormMessage = React19.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ jsx20(
    "p",
    {
      ref,
      id: formMessageId,
      className: cn("text-sm font-medium text-destructive", className),
      ...props,
      children: body
    }
  );
});
FormMessage.displayName = "FormMessage";
var FormSection = React19.forwardRef(({ className, title, description, children, ...props }, ref) => {
  return /* @__PURE__ */ jsxs15("div", { ref, className: cn("space-y-4 mb-8", className), ...props, children: [
    /* @__PURE__ */ jsxs15("div", { children: [
      /* @__PURE__ */ jsx20("h4", { className: "text-lg font-medium text-foreground", children: title }),
      description && /* @__PURE__ */ jsx20("p", { className: "text-sm text-muted-foreground", children: description })
    ] }),
    /* @__PURE__ */ jsx20("div", { className: "grid gap-6", children })
  ] });
});
FormSection.displayName = "FormSection";

// src/components/skeleton.tsx
import { jsx as jsx21 } from "react/jsx-runtime";
function Skeleton({ className, shape = "text", ...props }) {
  return /* @__PURE__ */ jsx21(
    "div",
    {
      className: cn(
        "animate-pulse bg-muted",
        {
          "h-32 w-full rounded-xl": shape === "card",
          "h-12 w-full rounded-md": shape === "row",
          "h-4 w-full rounded": shape === "text",
          "h-10 w-10 rounded-full": shape === "avatar"
        },
        className
      ),
      ...props
    }
  );
}

// src/components/error-boundary.tsx
import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { jsx as jsx22, jsxs as jsxs16 } from "react/jsx-runtime";
var ErrorBoundary = class extends Component {
  state = {
    hasError: false
  };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error(
      `ErrorBoundary caught an error in ${this.props.name || "Widget"}:`,
      error,
      errorInfo
    );
  }
  handleReset = () => {
    this.setState({ hasError: false, error: void 0 });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxs16("div", { className: "flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center", children: [
        /* @__PURE__ */ jsx22(AlertTriangle, { className: "mb-2 h-8 w-8 text-destructive" }),
        /* @__PURE__ */ jsx22("h4", { className: "text-sm font-semibold text-destructive", children: this.props.fallbackTitle || "Something went wrong in this section" }),
        /* @__PURE__ */ jsx22("p", { className: "mt-1 max-w-xs text-xs text-destructive/80", children: this.state.error?.message || "An unexpected error occurred." }),
        /* @__PURE__ */ jsxs16(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: this.handleReset,
            className: "mt-4 gap-1.5 text-xs text-destructive hover:bg-destructive/20",
            children: [
              /* @__PURE__ */ jsx22(RefreshCw, { className: "h-3.5 w-3.5" }),
              "Try again"
            ]
          }
        )
      ] });
    }
    return this.props.children;
  }
};

// src/components/offline-banner.tsx
import { useEffect, useState as useState2 } from "react";
import { RefreshCw as RefreshCw2, WifiOff } from "lucide-react";
import { jsx as jsx23, jsxs as jsxs17 } from "react/jsx-runtime";
function OfflineBanner({ pendingItems = 0 }) {
  const [isOffline, setIsOffline] = useState2(false);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  if (!isOffline) return null;
  return /* @__PURE__ */ jsxs17("div", { className: "fixed left-0 right-0 top-0 z-[100] flex animate-in slide-in-from-top items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-lg duration-300", children: [
    /* @__PURE__ */ jsx23(WifiOff, { className: "h-4 w-4 shrink-0" }),
    /* @__PURE__ */ jsxs17("span", { children: [
      "You are currently offline. ",
      pendingItems > 0 && `(${pendingItems} changes queued locally)`
    ] }),
    /* @__PURE__ */ jsxs17(
      "button",
      {
        onClick: () => window.location.reload(),
        className: "ml-2 flex items-center gap-1 rounded bg-background/20 px-2 py-0.5 transition-colors hover:bg-background/30",
        children: [
          /* @__PURE__ */ jsx23(RefreshCw2, { className: "h-3 w-3" }),
          "Retry Connection"
        ]
      }
    )
  ] });
}

// src/components/sonner.tsx
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { jsx as jsx24 } from "react/jsx-runtime";
var Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx24(
    Sonner,
    {
      theme,
      className: "toaster group",
      position: "top-right",
      duration: 4e3,
      richColors: true,
      icons: {
        success: /* @__PURE__ */ jsx24(CircleCheck, { className: "h-4 w-4" }),
        info: /* @__PURE__ */ jsx24(Info, { className: "h-4 w-4" }),
        warning: /* @__PURE__ */ jsx24(TriangleAlert, { className: "h-4 w-4" }),
        error: /* @__PURE__ */ jsx24(OctagonX, { className: "h-4 w-4" }),
        loading: /* @__PURE__ */ jsx24(LoaderCircle, { className: "h-4 w-4 animate-spin" })
      },
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};

// src/components/textarea.tsx
import * as React21 from "react";
import { cva as cva5 } from "class-variance-authority";
import { jsx as jsx25, jsxs as jsxs18 } from "react/jsx-runtime";
var textareaVariants = cva5(
  "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Textarea = React21.forwardRef(
  ({ className, variant, error, ...props }, ref) => {
    return /* @__PURE__ */ jsxs18("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx25(
        "textarea",
        {
          className: cn(textareaVariants({ variant: error ? "error" : variant, className })),
          ref,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsx25("p", { className: "mt-1 text-xs text-destructive", children: error })
    ] });
  }
);
Textarea.displayName = "Textarea";

// src/components/card.tsx
import * as React22 from "react";
import { jsx as jsx26 } from "react/jsx-runtime";
var Card = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-surface text-card-foreground shadow-e1 transition-all duration-100 hover:shadow-e2 hover:-translate-y-[2px]",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
  "h3",
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx26(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/separator.tsx
import * as React23 from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { jsx as jsx27 } from "react/jsx-runtime";
var Separator4 = React23.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx27(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator4.displayName = SeparatorPrimitive.Root.displayName;

// src/components/badge.tsx
import { cva as cva6 } from "class-variance-authority";
import { jsx as jsx28, jsxs as jsxs19 } from "react/jsx-runtime";
var badgeVariants = cva6(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx28("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
var statusColorMap = {
  neutral: { bg: "bg-neutral-status/10", text: "text-neutral-status", dot: "bg-neutral-status" },
  info: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  success: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  danger: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger" }
};
function StatusBadge({ className, status, dot = false, children, ...props }) {
  const colors = statusColorMap[status];
  return /* @__PURE__ */ jsxs19(
    "div",
    {
      className: cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150",
        colors.bg,
        colors.text,
        className
      ),
      ...props,
      children: [
        dot && /* @__PURE__ */ jsx28("span", { className: cn("mr-1.5 h-1.5 w-1.5 rounded-full", colors.dot), "aria-hidden": "true" }),
        children
      ]
    }
  );
}

// src/components/avatar.tsx
var import_image = __toESM(require_image());
import * as React24 from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva as cva7 } from "class-variance-authority";
import { jsx as jsx29, jsxs as jsxs20 } from "react/jsx-runtime";
var avatarVariants = cva7(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var Avatar = React24.forwardRef(({ className, size, ...props }, ref) => /* @__PURE__ */ jsx29(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn(avatarVariants({ size }), className),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = React24.forwardRef(({ className, src, alt, ...props }, ref) => /* @__PURE__ */ jsx29(
  AvatarPrimitive.Image,
  {
    ref,
    asChild: true,
    className: cn("aspect-square h-full w-full object-cover", className),
    ...props,
    children: src ? /* @__PURE__ */ jsx29(import_image.default, { src, alt: alt || "", fill: true, sizes: "96px", className: "object-cover" }) : /* @__PURE__ */ jsx29("img", { src: "", alt: alt || "" })
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var accentColors = [
  "bg-accent-violet text-white",
  "bg-accent-blue text-white",
  "bg-accent-cyan text-white",
  "bg-accent-teal text-white",
  "bg-accent-green text-white",
  "bg-accent-orange text-white",
  "bg-accent-red text-white",
  "bg-accent-pink text-white"
];
function getHashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return accentColors[Math.abs(hash) % accentColors.length];
}
var AvatarFallback = React24.forwardRef(({ className, name, children, ...props }, ref) => {
  const bgColorClass = name ? getHashColor(name) : "bg-muted text-muted-foreground";
  return /* @__PURE__ */ jsx29(
    AvatarPrimitive.Fallback,
    {
      ref,
      className: cn(
        "flex h-full w-full items-center justify-center rounded-full text-xs font-medium uppercase",
        bgColorClass,
        className
      ),
      ...props,
      children: children || (name ? name.substring(0, 2) : "UI")
    }
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
function AvatarGroup({ className, children, limit = 4, ...props }) {
  const avatars = React24.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, limit);
  const overflowCount = Math.max(0, avatars.length - limit);
  return /* @__PURE__ */ jsxs20("div", { className: cn("flex items-center -space-x-2", className), ...props, children: [
    visibleAvatars.map((avatar, i) => /* @__PURE__ */ jsx29("div", { className: "ring-2 ring-background rounded-full", children: avatar }, i)),
    overflowCount > 0 && /* @__PURE__ */ jsxs20("div", { className: "flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-muted-foreground text-xs font-medium z-10", children: [
      "+",
      overflowCount
    ] })
  ] });
}

// src/components/progress.tsx
import * as React25 from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva as cva8 } from "class-variance-authority";
import { jsx as jsx30 } from "react/jsx-runtime";
var progressVariants = cva8(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        default: "h-4",
        sm: "h-2",
        lg: "h-6"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);
var Progress = React25.forwardRef(({ className, value, size, isOverdue, striped, indicatorColorClass, ...props }, ref) => {
  let colorClass = indicatorColorClass || "bg-primary";
  if (value === 100) {
    colorClass = "bg-success";
  } else if (isOverdue) {
    colorClass = "bg-warning";
  }
  const stripedStyle = striped ? {
    backgroundImage: "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
    backgroundSize: "1rem 1rem"
  } : {};
  return /* @__PURE__ */ jsx30(
    ProgressPrimitive.Root,
    {
      ref,
      className: cn(progressVariants({ size }), className),
      ...props,
      children: /* @__PURE__ */ jsx30(
        ProgressPrimitive.Indicator,
        {
          className: cn(
            "h-full w-full flex-1 transition-all duration-600",
            colorClass
          ),
          style: {
            transform: `translateX(-${100 - (value || 0)}%)`,
            ...stripedStyle
          }
        }
      )
    }
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

// src/components/popover.tsx
import * as React26 from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { jsx as jsx31 } from "react/jsx-runtime";
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverContent = React26.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx31(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx31(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-e3 outline-none duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// src/components/command.tsx
import * as React27 from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { Dialog as Dialog2, DialogContent as DialogContent2 } from "@radix-ui/react-dialog";
import { jsx as jsx32, jsxs as jsxs21 } from "react/jsx-runtime";
var Command = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = CommandPrimitive.displayName;
var CommandDialog = ({ children, ...props }) => {
  return /* @__PURE__ */ jsx32(Dialog2, { ...props, children: /* @__PURE__ */ jsx32(DialogContent2, { className: "overflow-hidden p-0 shadow-lg", children: /* @__PURE__ */ jsx32(Command, { className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5", children }) }) });
};
var CommandInput = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs21("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsx32(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsx32(
    CommandPrimitive.Input,
    {
      ref,
      className: cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = CommandPrimitive.Input.displayName;
var CommandList = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = CommandPrimitive.List.displayName;
var CommandEmpty = React27.forwardRef((props, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive.Empty,
  {
    ref,
    className: "py-6 text-center text-sm",
    ...props
  }
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;
var CommandGroup = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;
var CommandSeparator = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;
var CommandItem = React27.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx32(
  CommandPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
      className
    ),
    ...props
  }
));
CommandItem.displayName = CommandPrimitive.Item.displayName;
var CommandShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx32(
    "span",
    {
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
CommandShortcut.displayName = "CommandShortcut";

// src/components/combobox.tsx
import * as React28 from "react";
import { Check as Check5, ChevronsUpDown } from "lucide-react";
import { jsx as jsx33, jsxs as jsxs22 } from "react/jsx-runtime";
function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  emptyText = "No option found.",
  className,
  disabled = false
}) {
  const [open, setOpen] = React28.useState(false);
  const [search, setSearch] = React28.useState("");
  const debouncedSearch = useDebouncedValidation(search, (val) => val, 250) || "";
  const filteredOptions = React28.useMemo(() => {
    if (!debouncedSearch) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, options]);
  return /* @__PURE__ */ jsxs22(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx33(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs22(
      Button,
      {
        variant: "outline",
        role: "combobox",
        "aria-expanded": open,
        className: cn("w-full justify-between font-normal", className),
        disabled,
        children: [
          value ? options.find((option) => option.value === value)?.label : placeholder,
          /* @__PURE__ */ jsx33(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx33(PopoverContent, { className: "w-full p-0", align: "start", children: /* @__PURE__ */ jsxs22(Command, { shouldFilter: false, children: [
      /* @__PURE__ */ jsx33(
        CommandInput,
        {
          placeholder: "Search...",
          value: search,
          onValueChange: setSearch
        }
      ),
      /* @__PURE__ */ jsxs22(CommandList, { children: [
        /* @__PURE__ */ jsx33(CommandEmpty, { children: emptyText }),
        /* @__PURE__ */ jsx33(CommandGroup, { children: filteredOptions.map((option) => /* @__PURE__ */ jsxs22(
          CommandItem,
          {
            value: option.value,
            onSelect: (currentValue) => {
              onChange?.(currentValue === value ? "" : currentValue);
              setOpen(false);
            },
            children: [
              /* @__PURE__ */ jsx33(
                Check5,
                {
                  className: cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )
                }
              ),
              option.label
            ]
          },
          option.value
        )) })
      ] })
    ] }) })
  ] });
}

// src/components/data-table.tsx
import React29, { useCallback, useMemo as useMemo2, useState as useState4, useRef, useEffect as useEffect2 } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Settings2, Pencil, Check as Check6, X as XIcon } from "lucide-react";
import { jsx as jsx34, jsxs as jsxs23 } from "react/jsx-runtime";
var MemoizedCell = React29.memo(
  ({
    cell,
    density,
    stickyFirstCol,
    isFirstCol,
    onInlineEditSave
  }) => {
    const [isEditing, setIsEditing] = useState4(false);
    const [editValue, setEditValue] = useState4(cell.getValue());
    const inputRef = useRef(null);
    const editable = cell.column.columnDef.meta?.editable;
    const handleEditStart = useCallback(() => {
      if (!editable) return;
      setIsEditing(true);
    }, [editable]);
    const handleSave = useCallback(() => {
      setIsEditing(false);
      if (onInlineEditSave && editValue !== cell.getValue()) {
        onInlineEditSave(cell.row.id, cell.column.id, editValue);
      }
    }, [editValue, cell.getValue, onInlineEditSave, cell.row.id, cell.column.id]);
    const handleCancel = useCallback(() => {
      setIsEditing(false);
      setEditValue(cell.getValue());
    }, [cell.getValue]);
    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") handleCancel();
      },
      [handleSave, handleCancel]
    );
    useEffect2(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);
    return /* @__PURE__ */ jsx34(
      "td",
      {
        className: cn(
          "align-middle transition-colors group-hover:bg-muted/50 data-[state=selected]:bg-muted",
          density === "compact" ? "p-2" : "p-4",
          stickyFirstCol && isFirstCol ? "sticky left-0 z-10 bg-background" : "",
          editable ? "group/cell relative" : ""
        ),
        children: isEditing ? /* @__PURE__ */ jsxs23("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx34(
            Input,
            {
              ref: inputRef,
              value: editValue,
              onChange: (e) => setEditValue(e.target.value),
              onKeyDown: handleKeyDown,
              className: "h-7 text-xs"
            }
          ),
          /* @__PURE__ */ jsx34(Button, { size: "icon", variant: "ghost", className: "h-6 w-6", onClick: handleSave, children: /* @__PURE__ */ jsx34(Check6, { className: "h-3 w-3 text-green-600" }) }),
          /* @__PURE__ */ jsx34(Button, { size: "icon", variant: "ghost", className: "h-6 w-6", onClick: handleCancel, children: /* @__PURE__ */ jsx34(XIcon, { className: "h-3 w-3 text-destructive" }) })
        ] }) : /* @__PURE__ */ jsxs23("div", { className: "flex items-center justify-between", children: [
          flexRender(cell.column.columnDef.cell, cell.getContext()),
          editable && /* @__PURE__ */ jsx34(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-6 w-6 opacity-0 group-hover/cell:opacity-100 transition-opacity",
              onClick: handleEditStart,
              children: /* @__PURE__ */ jsx34(Pencil, { className: "h-3 w-3" })
            }
          )
        ] })
      }
    );
  }
);
MemoizedCell.displayName = "MemoizedCell";
var MemoizedRow = React29.memo(
  ({
    row,
    virtualRow,
    density,
    stickyFirstCol,
    onInlineEditSave
  }) => {
    return /* @__PURE__ */ jsx34(
      "tr",
      {
        "data-state": row.getIsSelected() && "selected",
        className: "group absolute flex w-full border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        style: {
          top: 0,
          left: 0,
          transform: `translateY(${virtualRow.start}px)`,
          height: `${virtualRow.size}px`
        },
        children: row.getVisibleCells().map((cell, index) => /* @__PURE__ */ jsx34(
          MemoizedCell,
          {
            cell,
            density,
            stickyFirstCol,
            isFirstCol: index === 0,
            onInlineEditSave
          },
          cell.id
        ))
      }
    );
  }
);
MemoizedRow.displayName = "MemoizedRow";
function DataTable({
  columns,
  data,
  getRowId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  density = "comfortable",
  stickyHeader = true,
  stickyFirstCol = true,
  rowSelection: externalRowSelection,
  onRowSelectionChange,
  onInlineEditSave
}) {
  const [sorting, setSorting] = useState4([]);
  const [columnVisibility, setColumnVisibility] = useState4({});
  const [internalRowSelection, setInternalRowSelection] = useState4({});
  const [isMobile, setIsMobile] = useState4(false);
  useEffect2(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const tableColumns = useMemo2(() => {
    if (!onRowSelectionChange) return columns;
    const selectColumn = {
      id: "select",
      header: ({ table: table2 }) => /* @__PURE__ */ jsx34(
        Checkbox,
        {
          checked: table2.getIsAllPageRowsSelected() || (table2.getIsSomePageRowsSelected() ? "indeterminate" : false),
          onCheckedChange: (value) => table2.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all"
        }
      ),
      cell: ({ row }) => /* @__PURE__ */ jsx34(
        Checkbox,
        {
          checked: row.getIsSelected(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row"
        }
      ),
      enableSorting: false,
      enableHiding: false
    };
    return [selectColumn, ...columns];
  }, [columns, onRowSelectionChange]);
  const defaultGetRowId = useCallback((row, index) => String(index), []);
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      const newValue = typeof updaterOrValue === "function" ? updaterOrValue(internalRowSelection) : updaterOrValue;
      setInternalRowSelection(newValue);
      onRowSelectionChange?.(newValue);
    },
    getRowId: getRowId || defaultGetRowId,
    state: {
      sorting,
      columnVisibility,
      rowSelection: externalRowSelection !== void 0 ? externalRowSelection : internalRowSelection
    }
  });
  useEffect2(() => {
  }, [internalRowSelection, externalRowSelection, onRowSelectionChange]);
  const tableContainerRef = useRef(null);
  const { rows } = table.getRowModel();
  const desktopRowHeight = density === "compact" ? 40 : 64;
  const estimatedCardHeight = 200;
  const rowHeight = isMobile ? estimatedCardHeight : desktopRowHeight;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: 10
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const handleScroll = useCallback(
    (e) => {
      const target = e.target;
      const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;
      if (bottom && hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );
  return /* @__PURE__ */ jsxs23("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx34("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs23(DropdownMenu, { children: [
      /* @__PURE__ */ jsx34(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs23(Button, { variant: "outline", size: "sm", className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsx34(Settings2, { className: "h-4 w-4" }),
        "View"
      ] }) }),
      /* @__PURE__ */ jsx34(DropdownMenuContent, { align: "end", className: "w-[150px]", children: table.getAllColumns().filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide()).map((column) => {
        return /* @__PURE__ */ jsx34(
          DropdownMenuCheckboxItem,
          {
            className: "capitalize",
            checked: column.getIsVisible(),
            onCheckedChange: (value) => column.toggleVisibility(!!value),
            children: column.id
          },
          column.id
        );
      }) })
    ] }) }),
    /* @__PURE__ */ jsxs23(
      "div",
      {
        ref: tableContainerRef,
        onScroll: handleScroll,
        className: "rounded-md border bg-background relative h-[600px] overflow-auto",
        children: [
          !isMobile ? /* @__PURE__ */ jsxs23("table", { className: "w-full caption-bottom text-sm grid", children: [
            /* @__PURE__ */ jsx34(
              "thead",
              {
                className: cn(
                  "[&_tr]:border-b grid",
                  stickyHeader ? "sticky top-0 z-20 bg-muted/50 backdrop-blur" : ""
                ),
                children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx34("tr", { className: "flex w-full", children: headerGroup.headers.map((header, index) => {
                  return /* @__PURE__ */ jsx34(
                    "th",
                    {
                      className: cn(
                        "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                        stickyFirstCol && index === 0 ? "sticky left-0 z-30 bg-muted/50" : ""
                      ),
                      children: header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())
                    },
                    header.id
                  );
                }) }, headerGroup.id))
              }
            ),
            /* @__PURE__ */ jsx34(
              "tbody",
              {
                className: "relative grid w-full",
                style: {
                  height: `${rowVirtualizer.getTotalSize()}px`
                },
                children: virtualRows.length > 0 ? virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return /* @__PURE__ */ jsx34(
                    MemoizedRow,
                    {
                      row,
                      virtualRow,
                      density,
                      stickyFirstCol,
                      onInlineEditSave
                    },
                    row.id
                  );
                }) : /* @__PURE__ */ jsx34("tr", { children: /* @__PURE__ */ jsx34("td", { colSpan: columns.length, className: "h-24 text-center align-middle", children: "No results." }) })
              }
            )
          ] }) : /* @__PURE__ */ jsx34(
            "div",
            {
              className: "relative w-full p-4",
              style: {
                height: `${rowVirtualizer.getTotalSize()}px`
              },
              children: virtualRows.length > 0 ? virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return /* @__PURE__ */ jsx34(
                  "div",
                  {
                    className: "absolute left-4 right-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm space-y-3",
                    style: {
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`
                      // allow dynamic height by not forcing it if possible, but virtualizer requires explicit height or dynamic measurement
                    },
                    ref: rowVirtualizer.measureElement,
                    "data-index": virtualRow.index,
                    children: row.getVisibleCells().map((cell) => {
                      const headerTitle = cell.column.id === "select" ? "" : cell.column.columnDef.header;
                      return /* @__PURE__ */ jsxs23("div", { className: "flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0", children: [
                        headerTitle && /* @__PURE__ */ jsx34("span", { className: "text-xs font-medium text-muted-foreground", children: typeof headerTitle === "string" ? headerTitle : cell.column.id }),
                        /* @__PURE__ */ jsx34("span", { className: "text-sm", children: flexRender(cell.column.columnDef.cell, cell.getContext()) })
                      ] }, cell.id);
                    })
                  },
                  row.id
                );
              }) : /* @__PURE__ */ jsx34("div", { className: "h-24 flex items-center justify-center text-muted-foreground", children: "No results." })
            }
          ),
          isFetchingNextPage && /* @__PURE__ */ jsx34("div", { className: "p-4 text-center text-sm text-muted-foreground", children: "Loading more..." })
        ]
      }
    )
  ] });
}

// src/components/filter-bar.tsx
import { useState as useState5, useEffect as useEffect3, startTransition } from "react";
import { Search as Search2, X as X3, SlidersHorizontal } from "lucide-react";
import { jsx as jsx35, jsxs as jsxs24 } from "react/jsx-runtime";
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState5(value);
  useEffect3(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onClearAll
}) {
  const [localSearch, setLocalSearch] = useState5(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 250);
  useEffect3(() => {
    if (debouncedSearch !== searchQuery) {
      startTransition(() => {
        onSearchChange(debouncedSearch);
      });
    }
  }, [debouncedSearch, onSearchChange, searchQuery]);
  useEffect3(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);
  const activeFiltersCount = filters.reduce((acc, f) => {
    if (f.type === "checkbox-group" && Array.isArray(f.value)) return acc + f.value.length;
    if (f.value && f.value !== "all") return acc + 1;
    return acc;
  }, 0);
  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.length > 0;
  const handleClearAll = () => {
    setLocalSearch("");
    onSearchChange("");
    filters.forEach((f) => {
      f.onChange(f.type === "checkbox-group" ? [] : "all");
    });
    if (onClearAll) onClearAll();
  };
  const renderFilterControl = (filter) => {
    switch (filter.type) {
      case "select":
        return /* @__PURE__ */ jsxs24(Select, { value: filter.value, onValueChange: filter.onChange, children: [
          /* @__PURE__ */ jsx35(SelectTrigger, { className: "w-full sm:w-[150px] h-9", children: /* @__PURE__ */ jsx35(SelectValue, { placeholder: filter.label }) }),
          /* @__PURE__ */ jsxs24(SelectContent, { children: [
            /* @__PURE__ */ jsxs24(SelectItem, { value: "all", children: [
              "All ",
              filter.label
            ] }),
            filter.options?.map((opt) => /* @__PURE__ */ jsx35(SelectItem, { value: opt.value, children: opt.label }, opt.value))
          ] })
        ] });
      case "combobox":
        return /* @__PURE__ */ jsx35(
          Combobox,
          {
            options: filter.options || [],
            value: filter.value === "all" ? "" : filter.value,
            onChange: (val) => filter.onChange(val || "all"),
            placeholder: `Select ${filter.label}`
          }
        );
      case "checkbox-group":
        return /* @__PURE__ */ jsxs24(Select, { children: [
          /* @__PURE__ */ jsx35(SelectTrigger, { className: "w-full sm:w-[150px] h-9", children: /* @__PURE__ */ jsx35(SelectValue, { placeholder: `${filter.label} (${Array.isArray(filter.value) ? filter.value.length : 0})` }) }),
          /* @__PURE__ */ jsx35(SelectContent, { children: /* @__PURE__ */ jsx35("div", { className: "p-2 space-y-2", children: filter.options?.map((opt) => {
            const isChecked = Array.isArray(filter.value) && filter.value.includes(opt.value);
            return /* @__PURE__ */ jsxs24("label", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx35(
                Checkbox,
                {
                  checked: isChecked,
                  onCheckedChange: (checked) => {
                    const current = Array.isArray(filter.value) ? filter.value : [];
                    if (checked) filter.onChange([...current, opt.value]);
                    else filter.onChange(current.filter((v) => v !== opt.value));
                  }
                }
              ),
              opt.label
            ] }, opt.value);
          }) }) })
        ] });
      case "date-range":
        return /* @__PURE__ */ jsxs24("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx35(
            Input,
            {
              type: "date",
              className: "h-9 w-full sm:w-[130px]",
              value: filter.value?.start || "",
              onChange: (e) => filter.onChange({ ...filter.value, start: e.target.value })
            }
          ),
          /* @__PURE__ */ jsx35("span", { className: "text-muted-foreground", children: "-" }),
          /* @__PURE__ */ jsx35(
            Input,
            {
              type: "date",
              className: "h-9 w-full sm:w-[130px]",
              value: filter.value?.end || "",
              onChange: (e) => filter.onChange({ ...filter.value, end: e.target.value })
            }
          )
        ] });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs24("div", { className: "space-y-3 w-full", children: [
    /* @__PURE__ */ jsxs24("div", { className: "flex items-center gap-3 w-full", children: [
      /* @__PURE__ */ jsxs24("div", { className: "relative flex-1 w-full sm:max-w-sm", children: [
        /* @__PURE__ */ jsx35(Search2, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx35(
          Input,
          {
            placeholder: searchPlaceholder,
            value: localSearch,
            onChange: (e) => setLocalSearch(e.target.value),
            className: "pl-9 h-9"
          }
        ),
        localSearch && /* @__PURE__ */ jsx35(
          "button",
          {
            onClick: () => setLocalSearch(""),
            className: "absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors",
            children: /* @__PURE__ */ jsx35(X3, { className: "h-3 w-3" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs24("div", { className: "hidden md:flex items-center gap-3", children: [
        filters.map((filter) => /* @__PURE__ */ jsx35("div", { children: renderFilterControl(filter) }, filter.key)),
        hasActiveFilters && /* @__PURE__ */ jsx35(
          Button,
          {
            variant: "ghost",
            onClick: handleClearAll,
            className: "h-9 px-3 text-muted-foreground hover:text-foreground",
            children: "Clear all"
          }
        )
      ] }),
      /* @__PURE__ */ jsx35("div", { className: "md:hidden", children: /* @__PURE__ */ jsxs24(Sheet, { children: [
        /* @__PURE__ */ jsx35(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs24(Button, { variant: "outline", size: "sm", className: "h-9 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx35(SlidersHorizontal, { className: "h-4 w-4" }),
          "Filters",
          activeFiltersCount > 0 && /* @__PURE__ */ jsx35(Badge, { variant: "secondary", className: "ml-1 px-1.5 h-5 rounded-full text-xs", children: activeFiltersCount })
        ] }) }),
        /* @__PURE__ */ jsxs24(SheetContent, { side: "right", className: "w-[300px] sm:w-[400px]", children: [
          /* @__PURE__ */ jsx35(SheetHeader, { children: /* @__PURE__ */ jsx35(SheetTitle, { children: "Filters" }) }),
          /* @__PURE__ */ jsxs24("div", { className: "mt-6 space-y-6", children: [
            filters.map((filter) => /* @__PURE__ */ jsxs24("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx35("label", { className: "text-sm font-medium", children: filter.label }),
              renderFilterControl(filter)
            ] }, filter.key)),
            hasActiveFilters && /* @__PURE__ */ jsx35(Button, { variant: "outline", onClick: handleClearAll, className: "w-full", children: "Clear all" })
          ] })
        ] })
      ] }) })
    ] }),
    hasActiveFilters && /* @__PURE__ */ jsxs24("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx35("span", { className: "text-sm text-muted-foreground mr-1", children: "Active filters:" }),
      searchQuery && /* @__PURE__ */ jsxs24(Badge, { variant: "secondary", className: "pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal", children: [
        "Search: ",
        searchQuery,
        /* @__PURE__ */ jsx35(
          "div",
          {
            role: "button",
            className: "h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer",
            onClick: () => setLocalSearch(""),
            children: /* @__PURE__ */ jsx35(X3, { className: "h-3 w-3" })
          }
        )
      ] }),
      filters.map((filter) => {
        if (filter.type === "checkbox-group" && Array.isArray(filter.value)) {
          return filter.value.map((v) => {
            const optLabel = filter.options?.find((o) => o.value === v)?.label || v;
            return /* @__PURE__ */ jsxs24(Badge, { variant: "secondary", className: "pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal", children: [
              filter.label,
              ": ",
              optLabel,
              /* @__PURE__ */ jsx35(
                "div",
                {
                  role: "button",
                  className: "h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer",
                  onClick: () => filter.onChange(filter.value.filter((val) => val !== v)),
                  children: /* @__PURE__ */ jsx35(X3, { className: "h-3 w-3" })
                }
              )
            ] }, `${filter.key}-${v}`);
          });
        }
        if (filter.value && filter.value !== "all") {
          if (filter.type === "date-range") {
            if (!filter.value.start && !filter.value.end) return null;
            const label = `${filter.value.start || ""} to ${filter.value.end || ""}`;
            return /* @__PURE__ */ jsxs24(Badge, { variant: "secondary", className: "pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal", children: [
              filter.label,
              ": ",
              label,
              /* @__PURE__ */ jsx35(
                "div",
                {
                  role: "button",
                  className: "h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer",
                  onClick: () => filter.onChange("all"),
                  children: /* @__PURE__ */ jsx35(X3, { className: "h-3 w-3" })
                }
              )
            ] }, filter.key);
          }
          const optLabel = filter.options?.find((o) => o.value === filter.value)?.label || filter.value;
          return /* @__PURE__ */ jsxs24(Badge, { variant: "secondary", className: "pl-3 pr-1 h-6 rounded-full flex items-center gap-1 font-normal", children: [
            filter.label,
            ": ",
            optLabel,
            /* @__PURE__ */ jsx35(
              "div",
              {
                role: "button",
                className: "h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer",
                onClick: () => filter.onChange("all"),
                children: /* @__PURE__ */ jsx35(X3, { className: "h-3 w-3" })
              }
            )
          ] }, filter.key);
        }
        return null;
      })
    ] })
  ] });
}

// src/components/pagination.tsx
import { ChevronLeft, ChevronRight as ChevronRight3, Loader2 } from "lucide-react";
import { jsx as jsx36, jsxs as jsxs25 } from "react/jsx-runtime";
function Pagination({
  className,
  variant = "standard",
  currentPage = 1,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  pageSize = 20,
  pageSizeOptions = [20, 50, 100],
  onPageSizeChange,
  onLoadMore,
  isLoading,
  ...props
}) {
  if (variant === "infinite") {
    if (!hasNextPage) return null;
    return /* @__PURE__ */ jsx36("div", { className: cn("flex w-full justify-center py-4", className), ...props, children: /* @__PURE__ */ jsxs25(
      Button,
      {
        variant: "outline",
        onClick: onLoadMore,
        disabled: isLoading,
        className: "w-full sm:w-auto",
        children: [
          isLoading && /* @__PURE__ */ jsx36(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          isLoading ? "Loading..." : "Load more"
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxs25(
    "nav",
    {
      role: "navigation",
      "aria-label": "pagination",
      className: cn("flex items-center justify-between w-full", className),
      ...props,
      children: [
        /* @__PURE__ */ jsxs25("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx36("span", { className: "text-sm font-medium text-muted-foreground hidden sm:block", children: "Rows per page:" }),
          /* @__PURE__ */ jsxs25(
            Select,
            {
              value: pageSize.toString(),
              onValueChange: (val) => onPageSizeChange?.(Number(val)),
              children: [
                /* @__PURE__ */ jsx36(SelectTrigger, { className: "h-8 w-[70px]", children: /* @__PURE__ */ jsx36(SelectValue, { placeholder: pageSize }) }),
                /* @__PURE__ */ jsx36(SelectContent, { side: "top", children: pageSizeOptions.map((size) => /* @__PURE__ */ jsx36(SelectItem, { value: size.toString(), children: size }, size)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs25("div", { className: "flex flex-row items-center gap-1", children: [
          /* @__PURE__ */ jsx36(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-8 w-8",
              onClick: onPreviousPage,
              disabled: !hasPreviousPage,
              "aria-label": "Go to previous page",
              children: /* @__PURE__ */ jsx36(ChevronLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx36("div", { className: "flex items-center justify-center text-sm font-medium px-2", children: totalPages ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage}` }),
          /* @__PURE__ */ jsx36(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-8 w-8",
              onClick: onNextPage,
              disabled: !hasNextPage,
              "aria-label": "Go to next page",
              children: /* @__PURE__ */ jsx36(ChevronRight3, { className: "h-4 w-4" })
            }
          )
        ] })
      ]
    }
  );
}

// src/components/breadcrumb.tsx
var import_link = __toESM(require_link2());
var import_navigation = __toESM(require_navigation2());
import { ChevronRight as ChevronRight4, MoreHorizontal as MoreHorizontal2 } from "lucide-react";
import { Fragment, jsx as jsx37, jsxs as jsxs26 } from "react/jsx-runtime";
function Breadcrumb({
  className,
  overrides = {},
  hiddenOnRoot = true,
  rootPath = "/dashboard",
  ...props
}) {
  const pathname = (0, import_navigation.usePathname)();
  if (hiddenOnRoot && pathname === rootPath) {
    return null;
  }
  const pathSegments = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return null;
  }
  const breadcrumbs = pathSegments.map((segment, index) => {
    const currentPath = `/${pathSegments.slice(0, index + 1).join("/")}`;
    const override = overrides[segment];
    return {
      id: currentPath,
      label: override?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href: override?.href || currentPath,
      isLast: index === pathSegments.length - 1
    };
  });
  const MAX_ITEMS = 3;
  const shouldTruncate = breadcrumbs.length > MAX_ITEMS;
  const renderBreadcrumbItem = (item) => {
    return /* @__PURE__ */ jsxs26("div", { className: "flex items-center", children: [
      item.isLast ? /* @__PURE__ */ jsx37("span", { className: "text-sm font-semibold text-foreground", "aria-current": "page", children: item.label }) : /* @__PURE__ */ jsx37(
        import_link.default,
        {
          href: item.href,
          className: "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          children: item.label
        }
      ),
      !item.isLast && /* @__PURE__ */ jsx37(ChevronRight4, { className: "h-4 w-4 mx-2 text-muted-foreground" })
    ] }, item.id);
  };
  return /* @__PURE__ */ jsx37(
    "nav",
    {
      "aria-label": "Breadcrumb",
      className: cn("flex items-center break-words text-muted-foreground sm:text-sm", className),
      ...props,
      children: /* @__PURE__ */ jsx37("ol", { className: "flex items-center gap-1.5 sm:gap-2.5", children: !shouldTruncate ? breadcrumbs.map(renderBreadcrumbItem) : /* @__PURE__ */ jsxs26(Fragment, { children: [
        renderBreadcrumbItem(breadcrumbs[0]),
        /* @__PURE__ */ jsxs26("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx37(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-6 w-6 pointer-events-none",
              "aria-label": "More items",
              children: /* @__PURE__ */ jsx37(MoreHorizontal2, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx37(ChevronRight4, { className: "h-4 w-4 mx-2 text-muted-foreground" })
        ] }),
        renderBreadcrumbItem(breadcrumbs[breadcrumbs.length - 2]),
        renderBreadcrumbItem(breadcrumbs[breadcrumbs.length - 1])
      ] }) })
    }
  );
}

// src/components/command-menu.tsx
var import_navigation2 = __toESM(require_navigation2());
import * as React31 from "react";
import { useTheme as useTheme2 } from "next-themes";
import {
  Calendar,
  Settings,
  User,
  LayoutDashboard,
  Users,
  Map as Map2,
  Moon,
  Sun,
  Laptop,
  Plane,
  ClipboardList
} from "lucide-react";
import { jsx as jsx38, jsxs as jsxs27 } from "react/jsx-runtime";
function CommandMenu() {
  const [open, setOpen] = React31.useState(false);
  const router = (0, import_navigation2.useRouter)();
  const { setTheme } = useTheme2();
  React31.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open2) => !open2);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  const runCommand = React31.useCallback((command) => {
    setOpen(false);
    command();
  }, []);
  return /* @__PURE__ */ jsxs27(CommandDialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx38(CommandInput, { placeholder: "Type a command or search actions..." }),
    /* @__PURE__ */ jsxs27(CommandList, { children: [
      /* @__PURE__ */ jsx38(CommandEmpty, { children: "No results found." }),
      /* @__PURE__ */ jsxs27(CommandGroup, { heading: "Navigation", children: [
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard")), children: [
          /* @__PURE__ */ jsx38(LayoutDashboard, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Dashboard" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/directory")), children: [
          /* @__PURE__ */ jsx38(Users, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Employee Directory" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/attendance")), children: [
          /* @__PURE__ */ jsx38(Calendar, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "My Attendance" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/profile")), children: [
          /* @__PURE__ */ jsx38(User, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "My Profile" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/settings")), children: [
          /* @__PURE__ */ jsx38(Settings, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Settings" }),
          /* @__PURE__ */ jsx38(CommandShortcut, { children: "\u2318S" })
        ] })
      ] }),
      /* @__PURE__ */ jsx38(CommandSeparator, {}),
      /* @__PURE__ */ jsxs27(CommandGroup, { heading: "Time Off", children: [
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/leave")), children: [
          /* @__PURE__ */ jsx38(Plane, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Request Leave" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/leave")), children: [
          /* @__PURE__ */ jsx38(Calendar, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "View My Leave" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/org/leave?status=pending")), children: [
          /* @__PURE__ */ jsx38(ClipboardList, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "View Pending Approvals" })
        ] })
      ] }),
      /* @__PURE__ */ jsx38(CommandSeparator, {}),
      /* @__PURE__ */ jsxs27(CommandGroup, { heading: "Admin", children: [
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/org/departments")), children: [
          /* @__PURE__ */ jsx38(Map2, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Departments" })
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => router.push("/dashboard/org/users")), children: [
          /* @__PURE__ */ jsx38(Users, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ jsx38("span", { children: "Manage Users" })
        ] })
      ] }),
      /* @__PURE__ */ jsx38(CommandSeparator, {}),
      /* @__PURE__ */ jsxs27(CommandGroup, { heading: "Theme", children: [
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => setTheme("light")), children: [
          /* @__PURE__ */ jsx38(Sun, { className: "mr-2 h-4 w-4" }),
          "Light"
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => setTheme("dark")), children: [
          /* @__PURE__ */ jsx38(Moon, { className: "mr-2 h-4 w-4" }),
          "Dark"
        ] }),
        /* @__PURE__ */ jsxs27(CommandItem, { onSelect: () => runCommand(() => setTheme("system")), children: [
          /* @__PURE__ */ jsx38(Laptop, { className: "mr-2 h-4 w-4" }),
          "System"
        ] })
      ] })
    ] })
  ] });
}

// src/components/help-overlay.tsx
import * as React32 from "react";
import { jsx as jsx39, jsxs as jsxs28 } from "react/jsx-runtime";
var SHORTCUTS = [
  {
    category: "Global Navigation",
    items: [
      { keys: ["\u2318", "K"], description: "Open Command Menu" },
      { keys: ["\u2318", "B"], description: "Toggle Sidebar" },
      { keys: ["\u2318", "/"], description: "Show Keyboard Shortcuts" }
    ]
  },
  {
    category: "Actions",
    items: [
      { keys: ["\u2318", "N"], description: "Create New Item" },
      { keys: ["\u2318", "S"], description: "Save Changes / Draft" },
      { keys: ["Enter"], description: "Submit Form / Inline Edit" },
      { keys: ["Esc"], description: "Cancel / Close Dialog" }
    ]
  }
];
function HelpOverlay() {
  const [open, setOpen] = React32.useState(false);
  React32.useEffect(() => {
    const down = (e) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open2) => !open2);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return /* @__PURE__ */ jsx39(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs28(DialogContent, { className: "sm:max-w-[500px]", children: [
    /* @__PURE__ */ jsx39(DialogHeader, { children: /* @__PURE__ */ jsx39(DialogTitle, { children: "Keyboard Shortcuts" }) }),
    /* @__PURE__ */ jsx39("div", { className: "grid gap-6 py-4", children: SHORTCUTS.map((group) => /* @__PURE__ */ jsxs28("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx39("h4", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider", children: group.category }),
      /* @__PURE__ */ jsx39("div", { className: "space-y-2", children: group.items.map((item, index) => /* @__PURE__ */ jsxs28("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx39("span", { className: "text-sm font-medium", children: item.description }),
        /* @__PURE__ */ jsx39("div", { className: "flex items-center gap-1", children: item.keys.map((key, i) => /* @__PURE__ */ jsx39(
          "kbd",
          {
            className: "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100",
            children: key
          },
          i
        )) })
      ] }, index)) })
    ] }, group.category)) })
  ] }) });
}

// src/components/confirm-dialog.tsx
import { jsx as jsx40, jsxs as jsxs29 } from "react/jsx-runtime";
function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false
}) {
  const handleConfirm = async (e) => {
    e.preventDefault();
    await onConfirm();
    onOpenChange(false);
  };
  return /* @__PURE__ */ jsx40(AlertDialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs29(AlertDialogContent, { children: [
    /* @__PURE__ */ jsxs29(AlertDialogHeader, { children: [
      /* @__PURE__ */ jsx40(AlertDialogTitle, { children: title }),
      /* @__PURE__ */ jsx40(AlertDialogDescription, { children: description })
    ] }),
    /* @__PURE__ */ jsxs29(AlertDialogFooter, { children: [
      /* @__PURE__ */ jsx40(AlertDialogCancel, { disabled: isLoading, children: cancelText }),
      /* @__PURE__ */ jsx40(
        AlertDialogAction,
        {
          onClick: handleConfirm,
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          disabled: isLoading,
          children: isLoading ? "Processing..." : confirmText
        }
      )
    ] })
  ] }) });
}

// src/components/file-upload-popup.tsx
import * as React33 from "react";
import { UploadCloud, X as X4, File as FileIcon, Loader2 as Loader22 } from "lucide-react";
import { jsx as jsx41, jsxs as jsxs30 } from "react/jsx-runtime";
function FileUploadPopup({
  open,
  onOpenChange,
  title = "Upload File",
  description = "Drag and drop your file here, or click to browse.",
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  onUpload,
  isLoading = false
}) {
  const [file, setFile] = React33.useState(null);
  const [previewUrl, setPreviewUrl] = React33.useState(null);
  const [error, setError] = React33.useState(null);
  const [isDragging, setIsDragging] = React33.useState(false);
  const fileInputRef = React33.useRef(null);
  React33.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  React33.useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [open, previewUrl]);
  const validateFile = (selectedFile) => {
    setError(null);
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes.map((t) => t.split("/")[1]).join(", ")}`);
      return false;
    }
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };
  const handleFileSelect = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  const handleConfirm = async () => {
    if (!file) return;
    try {
      await onUpload(file);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    }
  };
  const formatTypes = acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ");
  return /* @__PURE__ */ jsx41(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs30(DialogContent, { className: "sm:max-w-[425px]", children: [
    /* @__PURE__ */ jsxs30(DialogHeader, { children: [
      /* @__PURE__ */ jsx41(DialogTitle, { children: title }),
      /* @__PURE__ */ jsxs30(DialogDescription, { children: [
        description,
        /* @__PURE__ */ jsx41("br", {}),
        /* @__PURE__ */ jsxs30("span", { className: "text-xs text-muted-foreground", children: [
          "Supports: ",
          formatTypes,
          " (Max ",
          maxSizeMB,
          "MB)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs30("div", { className: "grid gap-4 py-4", children: [
      !file ? /* @__PURE__ */ jsxs30(
        "div",
        {
          className: cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
            error ? "border-destructive bg-destructive/5" : ""
          ),
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
          onClick: () => fileInputRef.current?.click(),
          role: "button",
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          },
          children: [
            /* @__PURE__ */ jsx41(UploadCloud, { className: "h-8 w-8 text-muted-foreground" }),
            /* @__PURE__ */ jsx41("p", { className: "text-sm font-medium text-center", children: "Click to upload or drag and drop" }),
            /* @__PURE__ */ jsx41(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                className: "hidden",
                accept: acceptedTypes.join(","),
                onChange: (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }
              }
            )
          ]
        }
      ) : /* @__PURE__ */ jsxs30("div", { className: "relative overflow-hidden rounded-lg border bg-muted/20", children: [
        /* @__PURE__ */ jsx41(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-background/80 hover:bg-background",
            onClick: () => {
              setFile(null);
              setPreviewUrl(null);
            },
            children: /* @__PURE__ */ jsx41(X4, { className: "h-4 w-4" })
          }
        ),
        previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          /* @__PURE__ */ jsx41(
            "img",
            {
              src: previewUrl,
              alt: "Preview",
              className: "aspect-video w-full object-cover"
            }
          )
        ) : /* @__PURE__ */ jsxs30("div", { className: "flex aspect-video w-full flex-col items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx41(FileIcon, { className: "h-10 w-10 text-muted-foreground" }),
          /* @__PURE__ */ jsx41("p", { className: "text-sm font-medium", children: file.name }),
          /* @__PURE__ */ jsxs30("p", { className: "text-xs text-muted-foreground", children: [
            (file.size / 1024 / 1024).toFixed(2),
            " MB"
          ] })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx41("p", { className: "text-sm text-destructive text-center", children: error })
    ] }),
    /* @__PURE__ */ jsxs30(DialogFooter, { children: [
      /* @__PURE__ */ jsx41(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: isLoading, children: "Cancel" }),
      /* @__PURE__ */ jsxs30(Button, { onClick: handleConfirm, disabled: !file || isLoading, children: [
        isLoading && /* @__PURE__ */ jsx41(Loader22, { className: "mr-2 h-4 w-4 animate-spin" }),
        isLoading ? "Uploading..." : "Upload"
      ] })
    ] })
  ] }) });
}

// src/components/inline-edit.tsx
import { useState as useState9, useRef as useRef3, useEffect as useEffect7 } from "react";
import { Pencil as Pencil2 } from "lucide-react";
import { jsx as jsx42, jsxs as jsxs31 } from "react/jsx-runtime";
function InlineEdit({ value, onSave, className, inputClassName, placeholder = "Enter value..." }) {
  const [isEditing, setIsEditing] = useState9(false);
  const [currentValue, setCurrentValue] = useState9(value);
  const inputRef = useRef3(null);
  useEffect7(() => {
    setCurrentValue(value);
  }, [value]);
  useEffect7(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  const handleSave = () => {
    if (currentValue.trim() !== value) {
      onSave(currentValue.trim());
    } else {
      setCurrentValue(value);
    }
    setIsEditing(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };
  if (isEditing) {
    return /* @__PURE__ */ jsx42(
      Input,
      {
        ref: inputRef,
        value: currentValue,
        onChange: (e) => setCurrentValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        className: cn("h-7 px-2 py-1 text-sm", inputClassName),
        placeholder
      }
    );
  }
  return /* @__PURE__ */ jsxs31(
    "div",
    {
      className: cn(
        "group flex items-center gap-2 rounded px-1.5 py-0.5 -ml-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors",
        className
      ),
      onClick: () => setIsEditing(true),
      children: [
        /* @__PURE__ */ jsx42("span", { className: cn("truncate", !value && "text-muted-foreground italic"), children: value || placeholder }),
        /* @__PURE__ */ jsx42(Pencil2, { className: "w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" })
      ]
    }
  );
}
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent2 as CollapsibleContent,
  CollapsibleTrigger2 as CollapsibleTrigger,
  Combobox,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  CommandSeparator,
  CommandShortcut,
  ConfirmDialog,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DataTable,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DotLoader,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  EmptyState,
  ErrorBoundary,
  FileUploadPopup,
  FilterBar,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSection,
  HelpOverlay,
  InlineEdit,
  Input,
  Label4 as Label,
  OfflineBanner,
  Pagination,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup3 as RadioGroup,
  RadioGroupItem,
  RainbowBorder,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator4 as Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipWrapper,
  badgeVariants,
  buttonVariants,
  inputVariants,
  textareaVariants,
  useFormField
};
