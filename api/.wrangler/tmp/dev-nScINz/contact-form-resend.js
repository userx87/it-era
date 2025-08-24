var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-QW707U/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-QW707U/checked-fetch.js"() {
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-QW707U/middleware-loader.entry.ts
var import_checked_fetch7 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-QW707U/middleware-insertion-facade.js
var import_checked_fetch5 = __toESM(require_checked_fetch());

// contact-form-resend.js
var import_checked_fetch2 = __toESM(require_checked_fetch());
var CONFIG = {
  // Email settings
  EMAIL_TO: "andrea@bulltech.it",
  EMAIL_TO_TEST: "codeagent087@gmail.com",
  // Per test mode Resend (temporaneo)
  EMAIL_FROM: "info@it-era.it",
  // Usare dopo verifica dominio
  EMAIL_FROM_FALLBACK: "onboarding@resend.dev",
  // Fallback se dominio non verificato
  EMAIL_FROM_NAME: "IT-ERA",
  EMAIL_REPLY_TO: "info@it-era.it",
  EMAIL_SUBJECT_PREFIX: "[IT-ERA]",
  // Rate limiting
  RATE_LIMIT_REQUESTS: 95,
  // Resend free: 100/giorno, lasciamo margine
  RATE_LIMIT_WINDOW: 86400,
  // 24 ore in secondi
  // CORS
  ALLOWED_ORIGINS: [
    "https://www.it-era.it",
    "https://it-era.it",
    "https://it-era.pages.dev",
    "http://localhost:8788",
    "http://localhost:3000",
    "http://127.0.0.1:5500"
  ]
};
var corsHeaders = /* @__PURE__ */ __name((origin) => ({
  "Access-Control-Allow-Origin": CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
}), "corsHeaders");
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function isValidPhone(phone) {
  const phoneRegex = /^(\+39)?[\s]?[0-9]{3,4}[\s]?[0-9]{6,7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}
__name(isValidPhone, "isValidPhone");
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "").substring(0, 1e3);
}
__name(sanitizeInput, "sanitizeInput");
async function checkRateLimit(ip, KV) {
  if (!KV) return true;
  const key = `ratelimit:${ip}`;
  const current = await KV.get(key);
  if (current) {
    const count = parseInt(current);
    if (count >= CONFIG.RATE_LIMIT_REQUESTS) {
      return false;
    }
    await KV.put(key, String(count + 1), { expirationTtl: CONFIG.RATE_LIMIT_WINDOW });
  } else {
    await KV.put(key, "1", { expirationTtl: CONFIG.RATE_LIMIT_WINDOW });
  }
  return true;
}
__name(checkRateLimit, "checkRateLimit");
async function sendEmailResend(data, env) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
        IT-ERA
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        Nuova richiesta dal sito web
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Dettagli Richiesta</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666; width: 35%;">
            <strong>Nome:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.nome}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Email:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <a href="mailto:${data.email}" style="color: #667eea; text-decoration: none;">
              ${data.email}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Telefono:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <a href="tel:${data.telefono}" style="color: #667eea; text-decoration: none;">
              ${data.telefono}
            </a>
          </td>
        </tr>
        ${data.azienda ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Azienda:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.azienda}
          </td>
        </tr>
        ` : ""}
        ${data.comune ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Comune:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.comune}
          </td>
        </tr>
        ` : ""}
        ${data.servizi && data.servizi.length > 0 ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Servizi:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">
            ${data.servizi.join(", ")}
          </td>
        </tr>
        ` : ""}
        ${data.urgenza ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">
            <strong>Urgenza:</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; background-color: ${data.urgenza === "urgente" ? "#ff4444" : "#4CAF50"}; color: white;">
              ${data.urgenza.toUpperCase()}
            </span>
          </td>
        </tr>
        ` : ""}
        ${data.messaggio ? `
        <tr>
          <td style="padding: 12px; color: #666; vertical-align: top;">
            <strong>Messaggio:</strong>
          </td>
          <td style="padding: 12px; color: #333;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
              ${data.messaggio}
            </div>
          </td>
        </tr>
        ` : ""}
      </table>
      
      <!-- CTA -->
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
          Rispondi direttamente a questa email o contatta il cliente:
        </p>
        <a href="mailto:${data.email}" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
          Rispondi al Cliente
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        IT-ERA - Servizi IT Professionali<br>
        Viale Risorgimento 32, Vimercate (MB)<br>
        Tel: 039 888 2041 | P.IVA: 10524040966
      </p>
      <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
        Questa email \xE8 stata inviata dal sistema automatico del sito web IT-ERA
      </p>
    </div>
  </div>
</body>
</html>
  `;
  const textContent = `
Nuova richiesta dal sito IT-ERA

DETTAGLI RICHIESTA
------------------
Nome: ${data.nome}
Email: ${data.email}
Telefono: ${data.telefono}
${data.azienda ? `Azienda: ${data.azienda}` : ""}
${data.comune ? `Comune: ${data.comune}` : ""}
${data.servizi && data.servizi.length > 0 ? `Servizi: ${data.servizi.join(", ")}` : ""}
${data.urgenza ? `Urgenza: ${data.urgenza}` : ""}
${data.messaggio ? `
Messaggio:
${data.messaggio}` : ""}

--
IT-ERA - Servizi IT Professionali
Viale Risorgimento 32, Vimercate (MB)
Tel: 039 888 2041 | P.IVA: 10524040966
  `;
  try {
    let emailFrom = `${CONFIG.EMAIL_FROM_NAME} <${CONFIG.EMAIL_FROM}>`;
    let emailTo = CONFIG.EMAIL_TO;
    let usedFallback = false;
    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [emailTo],
        reply_to: data.email,
        // Rispondi direttamente al cliente
        subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || "Richiesta"} - ${data.nome}`,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: "source", value: "website" },
          { name: "type", value: data.formType || "contact" }
        ]
      })
    });
    if (!response.ok && response.status === 403) {
      const errorText = await response.text();
      if (errorText.includes("verify a domain") || errorText.includes("testing emails")) {
        console.log("Dominio non verificato, usando fallback...");
        emailFrom = `${CONFIG.EMAIL_FROM_NAME} <${CONFIG.EMAIL_FROM_FALLBACK}>`;
        emailTo = CONFIG.EMAIL_TO_TEST;
        usedFallback = true;
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [emailTo],
            reply_to: data.email,
            subject: `${CONFIG.EMAIL_SUBJECT_PREFIX} ${data.formType || "Richiesta"} - ${data.nome}`,
            html: htmlContent + `<p style="color: #999; font-size: 10px; margin-top: 20px;">Nota: Email inviata tramite sistema di test. Destinatario finale: ${CONFIG.EMAIL_TO}</p>`,
            text: textContent + `

Nota: Email inviata tramite sistema di test. Destinatario finale: ${CONFIG.EMAIL_TO}`,
            tags: [
              { name: "source", value: "website" },
              { name: "type", value: data.formType || "contact" },
              { name: "fallback", value: "true" }
            ]
          })
        });
      }
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) {
      }
      return { success: false, error: errorMessage, status: response.status };
    }
    const result = await response.json();
    return { success: true, id: result.id, usedFallback };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}
__name(sendEmailResend, "sendEmailResend");
var contact_form_resend_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "IT-ERA Email Service",
        provider: "Resend",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(origin)
      });
    }
    if (request.method !== "POST" || url.pathname !== "/api/contact") {
      return new Response(JSON.stringify({
        error: "Method not allowed",
        message: "Use POST /api/contact"
      }), {
        status: 405,
        headers: corsHeaders(origin)
      });
    }
    try {
      const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
      if (env.CONTACT_KV) {
        const canProceed = await checkRateLimit(ip, env.CONTACT_KV);
        if (!canProceed) {
          return new Response(JSON.stringify({
            success: false,
            error: "Troppe richieste. Riprova domani."
          }), {
            status: 429,
            headers: corsHeaders(origin)
          });
        }
      }
      const data = await request.json();
      const errors = [];
      if (!data.nome || data.nome.length < 2) {
        errors.push("Nome richiesto (minimo 2 caratteri)");
      }
      if (!data.email || !isValidEmail(data.email)) {
        errors.push("Email valida richiesta");
      }
      if (!data.telefono || !isValidPhone(data.telefono)) {
        errors.push("Numero di telefono valido richiesto");
      }
      if (!data.privacy) {
        errors.push("Accettazione privacy richiesta");
      }
      if (errors.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          errors
        }), {
          status: 400,
          headers: corsHeaders(origin)
        });
      }
      const sanitizedData = {
        nome: sanitizeInput(data.nome),
        azienda: sanitizeInput(data.azienda),
        email: sanitizeInput(data.email),
        telefono: sanitizeInput(data.telefono),
        comune: sanitizeInput(data.comune),
        dipendenti: sanitizeInput(data.dipendenti),
        servizi: Array.isArray(data.servizi) ? data.servizi.map((s) => sanitizeInput(s)) : [],
        urgenza: sanitizeInput(data.urgenza),
        messaggio: sanitizeInput(data.messaggio),
        formType: sanitizeInput(data.formType || "preventivo")
      };
      const emailResult = await sendEmailResend(sanitizedData, env);
      if (!emailResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: emailResult.error || "Failed to send email",
          status: emailResult.status,
          debug: "Resend API error"
        }), {
          status: 400,
          headers: corsHeaders(origin)
        });
      }
      if (env.CONTACT_DB) {
        try {
          const query = `
            INSERT INTO contacts (
              nome, azienda, email, telefono, comune, dipendenti,
              servizi, urgenza, messaggio, form_type, ip_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await env.CONTACT_DB.prepare(query).bind(
            sanitizedData.nome,
            sanitizedData.azienda || null,
            sanitizedData.email,
            sanitizedData.telefono,
            sanitizedData.comune || null,
            sanitizedData.dipendenti || null,
            JSON.stringify(sanitizedData.servizi || []),
            sanitizedData.urgenza || "normale",
            sanitizedData.messaggio || null,
            sanitizedData.formType || "preventivo",
            ip,
            (/* @__PURE__ */ new Date()).toISOString()
          ).run();
        } catch (dbError) {
          console.error("Database error:", dbError);
        }
      }
      if (env.ANALYTICS_KV) {
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const analyticsKey = `leads:${today}`;
        const currentCount = await env.ANALYTICS_KV.get(analyticsKey) || "0";
        await env.ANALYTICS_KV.put(analyticsKey, String(parseInt(currentCount) + 1), {
          expirationTtl: 86400 * 30
          // 30 giorni
        });
      }
      return new Response(JSON.stringify({
        success: true,
        message: emailResult.usedFallback ? "Richiesta registrata! (Sistema in modalit\xE0 test - verifica dominio in corso)" : "Richiesta inviata con successo! Ti contatteremo entro 2 ore lavorative.",
        ticketId: `ITERA-${Date.now()}`,
        emailId: emailResult.id,
        usedFallback: emailResult.usedFallback
      }), {
        status: 200,
        headers: corsHeaders(origin)
      });
    } catch (error) {
      console.error("Errore:", error);
      const isDev = url.hostname.includes("localhost") || url.hostname.includes("127.0.0.1");
      const errorMessage = isDev ? `Errore: ${error.message || error}` : "Errore durante l'invio. Riprova o contattaci al 039 888 2041.";
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: isDev ? error.stack : void 0
      }), {
        status: 500,
        headers: corsHeaders(origin)
      });
    }
  }
};

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch3 = __toESM(require_checked_fetch());
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch4 = __toESM(require_checked_fetch());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-QW707U/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = contact_form_resend_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch6 = __toESM(require_checked_fetch());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-QW707U/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=contact-form-resend.js.map
