"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
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

// node_modules/sql.js/dist/sql-wasm.js
var require_sql_wasm = __commonJS({
  "node_modules/sql.js/dist/sql-wasm.js"(exports2, module2) {
    var initSqlJsPromise = void 0;
    var initSqlJs2 = function(moduleConfig) {
      if (initSqlJsPromise) {
        return initSqlJsPromise;
      }
      initSqlJsPromise = new Promise(function(resolveModule, reject) {
        var Module = typeof moduleConfig !== "undefined" ? moduleConfig : {};
        var originalOnAbortFunction = Module["onAbort"];
        Module["onAbort"] = function(errorThatCausedAbort) {
          reject(new Error(errorThatCausedAbort));
          if (originalOnAbortFunction) {
            originalOnAbortFunction(errorThatCausedAbort);
          }
        };
        Module["postRun"] = Module["postRun"] || [];
        Module["postRun"].push(function() {
          resolveModule(Module);
        });
        module2 = void 0;
        var k;
        k ||= typeof Module != "undefined" ? Module : {};
        var aa = !!globalThis.window, ca = !!globalThis.WorkerGlobalScope, da = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
        k.onRuntimeInitialized = function() {
          function a(f, h) {
            tb(f, h instanceof Error ? h.message : String(h), -1);
          }
          function b(f, h) {
            switch (typeof h) {
              case "boolean":
                kc(f, h ? 1 : 0);
                break;
              case "number":
                lc(f, h);
                break;
              case "string":
                mc(f, h, m(h), -1);
                break;
              case "object":
                if (h === null) ub(f);
                else if (h.length != null) {
                  var p = ea(h.length);
                  u.set(h, p);
                  nc(f, p, h.length, -1);
                  y(p);
                } else tb(f, "Wrong API use : tried to return a value of an unknown type (" + h + ").", -1);
                break;
              default:
                ub(f);
            }
          }
          function d(f, h) {
            for (var p = [], q = 0; q < f; q += 1) {
              var t = A(
                h + 4 * q,
                "i32"
              ), w = oc(t);
              if (w === 1 || w === 2) t = pc(t);
              else if (w === 3) w = vb(t), t = qc(t), t = B(t, w, true);
              else if (w === 4) {
                w = t;
                t = vb(w);
                w = rc(w);
                for (var x = new Uint8Array(t), G = 0; G < t; G += 1) x[G] = u[w + G];
                t = x;
              } else t = null;
              p.push(t);
            }
            return p;
          }
          function c(f, h) {
            this.Ua = f;
            this.db = h;
            this.Sa = 1;
            this.qb = [];
          }
          function e(f, h) {
            this.db = h;
            this.jb = fa(f);
            if (this.jb === null) throw Error("Unable to allocate memory for the SQL string");
            this.ob = this.jb;
            this.ab = this.wb = null;
          }
          function g(f) {
            this.filename = "dbfile_" + (4294967295 * Math.random() >>> 0);
            f != null && ja(
              this.filename,
              f
            );
            this.handleError(z(this.filename, v));
            this.db = A(v, "i32");
            sc(this.db);
            this.pb = {};
            this.Xa = /* @__PURE__ */ new Map();
          }
          function n(f, h) {
            return f.replace(/[A-Z]/g, function(p) {
              return p.toLowerCase();
            }) + ":" + h;
          }
          function r(f) {
            f.forEach(ka);
          }
          var v = la(4), l = k.cwrap, z = l("sqlite3_open", "number", ["string", "number"]), F = l("sqlite3_close_v2", "number", ["number"]), ba = l("sqlite3_backup_init", "number", ["number", "string", "number", "string"]), za = l("sqlite3_backup_step", "number", ["number", "number"]), ma = l("sqlite3_backup_finish", "number", ["number"]), Aa = l("sqlite3_exec", "number", ["number", "number", "number", "number", "number"]), ha = l("sqlite3_changes", "number", ["number"]), Ba = l("sqlite3_sql", "string", ["number"]), N = l("sqlite3_normalized_sql", "string", ["number"]), Ua = l("sqlite3_prepare_v2", "number", ["number", "number", "number", "number", "number"]), tc = l("sqlite3_bind_text", "number", ["number", "number", "number", "number", "number"]), xb = l("sqlite3_bind_blob", "number", ["number", "number", "number", "number", "number"]), uc = l("sqlite3_bind_double", "number", [
            "number",
            "number",
            "number"
          ]), vc = l("sqlite3_bind_int", "number", ["number", "number", "number"]), wc = l("sqlite3_bind_parameter_index", "number", ["number", "string"]), xc = l("sqlite3_step", "number", ["number"]), ia = l("sqlite3_errmsg", "string", ["number"]), yc = l("sqlite3_column_count", "number", ["number"]), zc = l("sqlite3_data_count", "number", ["number"]), Ac = l("sqlite3_column_double", "number", ["number", "number"]), Bc = l("sqlite3_column_text", "number", ["number", "number"]), Cc = l("sqlite3_column_blob", "number", ["number", "number"]), yb = l("sqlite3_column_bytes", "number", ["number", "number"]), Dc = l("sqlite3_column_type", "number", ["number", "number"]), Ec = l("sqlite3_column_name", "string", ["number", "number"]), Fc = l("sqlite3_reset", "number", ["number"]), Gc = l("sqlite3_clear_bindings", "number", ["number"]), Hc = l("sqlite3_finalize", "number", ["number"]), zb = l("sqlite3_create_function_v2", "number", "number string number number number number number number number".split(" ")), oc = l("sqlite3_value_type", "number", ["number"]), vb = l(
            "sqlite3_value_bytes",
            "number",
            ["number"]
          ), qc = l("sqlite3_value_text", "number", ["number"]), rc = l("sqlite3_value_blob", "number", ["number"]), pc = l("sqlite3_value_double", "number", ["number"]), lc = l("sqlite3_result_double", "", ["number", "number"]), ub = l("sqlite3_result_null", "", ["number"]), mc = l("sqlite3_result_text", "", ["number", "string", "number", "number"]), nc = l("sqlite3_result_blob", "", ["number", "number", "number", "number"]), kc = l("sqlite3_result_int", "", ["number", "number"]), tb = l("sqlite3_result_error", "", ["number", "string", "number"]), Ab = l("sqlite3_aggregate_context", "number", ["number", "number"]), sc = l("RegisterExtensionFunctions", "number", ["number"]), Bb = l("sqlite3_update_hook", "number", ["number", "number", "number"]);
          c.prototype.bind = function(f) {
            if (!this.Ua) throw "Statement closed";
            this.reset();
            return Array.isArray(f) ? this.Nb(f) : f != null && typeof f === "object" ? this.Ob(f) : true;
          };
          c.prototype.step = function() {
            if (!this.Ua) throw "Statement closed";
            this.Sa = 1;
            var f = xc(this.Ua);
            switch (f) {
              case 100:
                return true;
              case 101:
                return false;
              default:
                throw this.db.handleError(f);
            }
          };
          c.prototype.Gb = function(f) {
            f == null && (f = this.Sa, this.Sa += 1);
            return Ac(this.Ua, f);
          };
          c.prototype.Wb = function(f) {
            f == null && (f = this.Sa, this.Sa += 1);
            if (typeof BigInt !== "function") throw Error("BigInt is not supported");
            return BigInt(this.Hb(f));
          };
          c.prototype.Hb = function(f) {
            f == null && (f = this.Sa, this.Sa += 1);
            var h = Bc(this.Ua, f);
            f = yb(this.Ua, f);
            return B(h, f, true);
          };
          c.prototype.getBlob = function(f) {
            f == null && (f = this.Sa, this.Sa += 1);
            var h = yb(this.Ua, f);
            f = Cc(this.Ua, f);
            for (var p = new Uint8Array(h), q = 0; q < h; q += 1) p[q] = u[f + q];
            return p;
          };
          c.prototype.get = function(f, h) {
            h = h || {};
            f != null && this.bind(f) && this.step();
            f = [];
            for (var p = zc(this.Ua), q = 0; q < p; q += 1) switch (Dc(this.Ua, q)) {
              case 1:
                var t = h.useBigInt ? this.Wb(q) : this.Gb(q);
                f.push(t);
                break;
              case 2:
                f.push(this.Gb(q));
                break;
              case 3:
                f.push(this.Hb(q));
                break;
              case 4:
                f.push(this.getBlob(q));
                break;
              default:
                f.push(null);
            }
            return f;
          };
          c.prototype.tb = function() {
            for (var f = [], h = yc(this.Ua), p = 0; p < h; p += 1) f.push(Ec(this.Ua, p));
            return f;
          };
          c.prototype.Fb = function(f, h) {
            var p = this.get(f, h);
            f = this.tb();
            return Object.fromEntries(f.map(function(q, t) {
              return [q, p[t]];
            }));
          };
          c.prototype.$b = function() {
            return Ba(this.Ua);
          };
          c.prototype.Xb = function() {
            return N(this.Ua);
          };
          c.prototype.run = function(f) {
            f != null && this.bind(f);
            this.step();
            return this.reset();
          };
          c.prototype.Bb = function(f, h) {
            h == null && (h = this.Sa, this.Sa += 1);
            var p = fa(f);
            this.qb.push(p);
            this.db.handleError(tc(this.Ua, h, p, m(f), 0));
          };
          c.prototype.Mb = function(f, h) {
            h == null && (h = this.Sa, this.Sa += 1);
            var p = ea(f.length);
            u.set(f, p);
            this.qb.push(p);
            this.db.handleError(xb(
              this.Ua,
              h,
              p,
              f.length,
              0
            ));
          };
          c.prototype.Ab = function(f, h) {
            h == null && (h = this.Sa, this.Sa += 1);
            this.db.handleError((f === (f | 0) ? vc : uc)(this.Ua, h, f));
          };
          c.prototype.Pb = function(f) {
            f == null && (f = this.Sa, this.Sa += 1);
            xb(this.Ua, f, 0, 0, 0);
          };
          c.prototype.Cb = function(f, h) {
            h == null && (h = this.Sa, this.Sa += 1);
            switch (typeof f) {
              case "string":
                this.Bb(f, h);
                return;
              case "number":
                this.Ab(f, h);
                return;
              case "bigint":
                this.Bb(f.toString(), h);
                return;
              case "boolean":
                this.Ab(f + 0, h);
                return;
              case "object":
                if (f === null) {
                  this.Pb(h);
                  return;
                }
                if (f.length != null) {
                  this.Mb(
                    f,
                    h
                  );
                  return;
                }
            }
            throw "Wrong API use : tried to bind a value of an unknown type (" + f + ").";
          };
          c.prototype.Ob = function(f) {
            var h = this;
            Object.keys(f).forEach(function(p) {
              var q = wc(h.Ua, p);
              q !== 0 && h.Cb(f[p], q);
            });
            return true;
          };
          c.prototype.Nb = function(f) {
            for (var h = 0; h < f.length; h += 1) this.Cb(f[h], h + 1);
            return true;
          };
          c.prototype.reset = function() {
            this.freemem();
            return Gc(this.Ua) === 0 && Fc(this.Ua) === 0;
          };
          c.prototype.freemem = function() {
            for (var f; (f = this.qb.pop()) !== void 0; ) y(f);
          };
          c.prototype.cb = function() {
            this.freemem();
            var f = Hc(this.Ua) === 0;
            delete this.db.pb[this.Ua];
            this.Ua = 0;
            return f;
          };
          e.prototype.next = function() {
            if (this.jb === null) return { done: true };
            this.ab !== null && (this.ab.cb(), this.ab = null);
            if (!this.db.db) throw this.kb(), Error("Database closed");
            var f = na(), h = la(4);
            oa(v);
            oa(h);
            try {
              this.db.handleError(Ua(this.db.db, this.ob, -1, v, h));
              this.ob = A(h, "i32");
              var p = A(v, "i32");
              if (p === 0) return this.kb(), { done: true };
              this.ab = new c(p, this.db);
              this.db.pb[p] = this.ab;
              return { value: this.ab, done: false };
            } catch (q) {
              throw this.wb = B(this.ob), this.kb(), q;
            } finally {
              pa(f);
            }
          };
          e.prototype.kb = function() {
            y(this.jb);
            this.jb = null;
          };
          e.prototype["return"] = function() {
            this.ab !== null && (this.ab.cb(), this.ab = null);
            this.kb();
            return { done: true };
          };
          e.prototype.Yb = function() {
            return this.wb !== null ? this.wb : B(this.ob);
          };
          typeof Symbol === "function" && typeof Symbol.iterator === "symbol" && (e.prototype[Symbol.iterator] = function() {
            return this;
          });
          g.prototype.run = function(f, h) {
            if (!this.db) throw "Database closed";
            if (h) {
              f = this.xb(f, h);
              try {
                f.step();
              } finally {
                f.cb();
              }
            } else {
              f = fa(f);
              try {
                this.handleError(Aa(
                  this.db,
                  f,
                  0,
                  0,
                  v
                ));
              } finally {
                y(f);
              }
            }
            return this;
          };
          g.prototype.exec = function(f, h, p) {
            if (!this.db) throw "Database closed";
            var q = na(), t = null, w = null, x = null;
            try {
              x = w = fa(f);
              var G = la(4);
              for (f = []; A(x, "i8") !== 0; ) {
                oa(v);
                oa(G);
                this.handleError(Ua(this.db, x, -1, v, G));
                var S = A(v, "i32");
                x = A(G, "i32");
                if (S !== 0) {
                  var D = null;
                  t = new c(S, this);
                  for (h != null && t.bind(h); t.step(); ) D === null && (D = { columns: t.tb(), values: [] }, f.push(D)), D.values.push(t.get(null, p));
                  t.cb();
                }
              }
              return f;
            } catch (K) {
              throw t && t.cb(), K;
            } finally {
              w && y(w), pa(q);
            }
          };
          g.prototype.Tb = function(f, h, p, q, t) {
            typeof h === "function" && (q = p, p = h, h = void 0);
            f = this.xb(f, h);
            try {
              for (; f.step(); ) p(f.Fb(null, t));
            } finally {
              f.cb();
            }
            if (typeof q === "function") return q();
          };
          g.prototype.xb = function(f, h) {
            f = fa(f);
            try {
              oa(v), this.handleError(Ua(this.db, f, -1, v, 0));
            } finally {
              y(f);
            }
            f = A(v, "i32");
            if (f === 0) throw "Nothing to prepare";
            var p = new c(f, this);
            h != null && p.bind(h);
            return this.pb[f] = p;
          };
          g.prototype.ac = function(f) {
            return new e(f, this);
          };
          g.prototype.Vb = function() {
            if (!this.db) throw Error("Database closed");
            var f = this.filename + "_export";
            ja(f, []);
            var h = 0, p = 0;
            try {
              var q = C(f).node, t = null, w = q.Pa.write;
              q.Pa = Object.create(q.Pa);
              q.Pa.write = function(S, D, K, U, T) {
                if (t === null) return w(S, D, K, U, T);
                q.Ta.set(D.subarray(K, K + U), T);
                q.Va = Math.max(q.Va, T + U);
                return U;
              };
              var x = z(f, v);
              h = A(v, "i32");
              if (x !== 0) throw Error(ia(h));
              p = ba(h, "main", this.db, "main");
              if (p === 0) throw Error(ia(h));
              x = za(p, 0);
              if (x === 0) {
                var G = this.exec("PRAGMA main.page_count; PRAGMA main.page_size");
                t = new Uint8Array(G[0].values[0][0] * G[1].values[0][0]);
                q.Ta = t;
                x = za(p, -1);
              }
              if (x === 5 || x === 6) throw Error("Unable to export: SQLite is busy or locked. Finish active write transactions before exporting.");
              if (x !== 101) throw Error(ia(h));
              x = ma(p);
              p = 0;
              if (x !== 0) throw Error(ia(h));
              x = F(h);
              if (x !== 0) throw Error(ia(h));
              h = 0;
              t = new Uint8Array(q.Ta.buffer, q.Ta.byteOffset, q.Va);
              t.length > 0 && (t[18] = 1, t[19] = 1);
              return t;
            } finally {
              p !== 0 && ma(p), h !== 0 && F(h), qa("/" + f);
            }
          };
          g.prototype.close = function() {
            this.db !== null && (Object.values(this.pb).forEach(function(f) {
              f.cb();
            }), this.Xa.forEach(r), this.Xa.clear(), this.eb && (ka(this.eb), this.eb = void 0), this.handleError(F(this.db)), qa("/" + this.filename), this.db = null);
          };
          g.prototype.handleError = function(f) {
            if (f === 0) return null;
            f = ia(this.db);
            throw Error(f);
          };
          g.prototype.Zb = function() {
            return ha(this.db);
          };
          g.prototype.Sb = function(f, h) {
            var p = n(f, h.length);
            this.Xa.has(p) && (r(this.Xa.get(p)), this.Xa.delete(p));
            var q = ra(function(t, w, x) {
              w = d(w, x);
              try {
                var G = h.apply(null, w);
              } catch (S) {
                a(t, S);
                return;
              }
              b(t, G);
            }, "viii");
            this.Xa.set(p, [q]);
            this.handleError(zb(this.db, f, h.length, 1, 0, q, 0, 0, 0));
            return this;
          };
          g.prototype.Rb = function(f, h) {
            function p(D) {
              x.has(D) || x.set(D, q());
              return x.get(D);
            }
            var q = h.init || function() {
              return null;
            }, t = h.finalize || function(D) {
              return D;
            }, w = h.step;
            if (!w) throw "An aggregate function must have a step function in " + f;
            var x = /* @__PURE__ */ new Map();
            h = n(f, w.length - 1);
            this.Xa.has(h) && (r(this.Xa.get(h)), this.Xa.delete(h));
            var G = ra(function(D, K, U) {
              var T = Ab(D, 1), Wa = p(T);
              K = d(K, U);
              Wa = [Wa].concat(K);
              try {
                x.set(T, w.apply(null, Wa));
              } catch (Ic) {
                x.delete(T), a(D, Ic);
              }
            }, "viii"), S = ra(function(D) {
              var K = Ab(
                D,
                1
              );
              try {
                var U = t(p(K));
              } catch (T) {
                x.delete(K);
                a(D, T);
                return;
              }
              b(D, U);
              x.delete(K);
            }, "vi");
            this.Xa.set(h, [G, S]);
            this.handleError(zb(this.db, f, w.length - 1, 1, 0, 0, G, S, 0));
            return this;
          };
          g.prototype.hc = function(f) {
            this.eb && (Bb(this.db, 0, 0), ka(this.eb), this.eb = void 0);
            if (!f) return this;
            this.eb = ra(function(h, p, q, t, w) {
              switch (p) {
                case 18:
                  h = "insert";
                  break;
                case 23:
                  h = "update";
                  break;
                case 9:
                  h = "delete";
                  break;
                default:
                  throw "unknown operationCode in updateHook callback: " + p;
              }
              q = B(q);
              t = B(t);
              if (w > Number.MAX_SAFE_INTEGER) throw "rowId too big to fit inside a Number";
              f(h, q, t, Number(w));
            }, "viiiij");
            Bb(this.db, this.eb, 0);
            return this;
          };
          c.prototype.bind = c.prototype.bind;
          c.prototype.step = c.prototype.step;
          c.prototype.get = c.prototype.get;
          c.prototype.getColumnNames = c.prototype.tb;
          c.prototype.getAsObject = c.prototype.Fb;
          c.prototype.getSQL = c.prototype.$b;
          c.prototype.getNormalizedSQL = c.prototype.Xb;
          c.prototype.run = c.prototype.run;
          c.prototype.reset = c.prototype.reset;
          c.prototype.freemem = c.prototype.freemem;
          c.prototype.free = c.prototype.cb;
          e.prototype.next = e.prototype.next;
          e.prototype.getRemainingSQL = e.prototype.Yb;
          g.prototype.run = g.prototype.run;
          g.prototype.exec = g.prototype.exec;
          g.prototype.each = g.prototype.Tb;
          g.prototype.prepare = g.prototype.xb;
          g.prototype.iterateStatements = g.prototype.ac;
          g.prototype["export"] = g.prototype.Vb;
          g.prototype.close = g.prototype.close;
          g.prototype.handleError = g.prototype.handleError;
          g.prototype.getRowsModified = g.prototype.Zb;
          g.prototype.create_function = g.prototype.Sb;
          g.prototype.create_aggregate = g.prototype.Rb;
          g.prototype.updateHook = g.prototype.hc;
          k.Database = g;
        };
        var sa = "./this.program", ta = (a, b) => {
          throw b;
        }, ua = globalThis.document?.currentScript?.src;
        typeof __filename != "undefined" ? ua = __filename : ca && (ua = self.location.href);
        var va = "", wa, xa;
        if (da) {
          var fs4 = require("node:fs");
          va = __dirname + "/";
          xa = (a) => {
            a = ya(a) ? new URL(a) : a;
            return fs4.readFileSync(a);
          };
          wa = async (a) => {
            a = ya(a) ? new URL(a) : a;
            return fs4.readFileSync(a, void 0);
          };
          process.argv.length > 1 && (sa = process.argv[1].replace(/\\/g, "/"));
          process.argv.slice(2);
          typeof module2 != "undefined" && (module2.exports = k);
          ta = (a, b) => {
            process.exitCode = a;
            throw b;
          };
        } else if (aa || ca) {
          try {
            va = new URL(".", ua).href;
          } catch {
          }
          ca && (xa = (a) => {
            var b = new XMLHttpRequest();
            b.open("GET", a, false);
            b.responseType = "arraybuffer";
            b.send(null);
            return new Uint8Array(b.response);
          });
          wa = async (a) => {
            if (ya(a)) return new Promise((d, c) => {
              var e = new XMLHttpRequest();
              e.open("GET", a, true);
              e.responseType = "arraybuffer";
              e.onload = () => {
                e.status == 200 || e.status == 0 && e.response ? d(e.response) : c(e.status);
              };
              e.onerror = c;
              e.send(null);
            });
            var b = await fetch(a, { credentials: "same-origin" });
            if (b.ok) return b.arrayBuffer();
            throw Error(b.status + " : " + b.url);
          };
        }
        var Ca = console.log.bind(console), E = console.error.bind(console), Da, Ea = false, Fa, ya = (a) => a.startsWith("file://");
        function Ga() {
          if (!u?.buffer?.resizable) {
            var a = Ha.buffer;
            u = new Int8Array(a);
            Ia = new Int16Array(a);
            H = new Uint8Array(a);
            I = new Int32Array(a);
            J = new Uint32Array(a);
            Ja = new Float32Array(a);
            Ka = new Float64Array(a);
            L = new BigInt64Array(a);
          }
        }
        function La() {
          var a = k.preRun;
          a && (typeof a == "function" && (a = [a]), Ma.push(...a));
          for (a = Ma; a.length > 0; ) a.shift()(k);
        }
        function Na() {
          var a = k.postRun;
          a && (typeof a == "function" && (a = [a]), Oa.push(...a));
          for (a = Oa; a.length > 0; ) a.shift()(k);
        }
        function Pa(a) {
          k.onAbort?.(a);
          a = `Aborted(${a})`;
          E(a);
          Ea = true;
          throw new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
        }
        var Qa;
        async function Ra(a) {
          if (!Da) try {
            var b = await wa(a);
            return new Uint8Array(b);
          } catch {
          }
          if (a == Qa && Da) a = new Uint8Array(Da);
          else if (xa) a = xa(a);
          else throw "both async and sync fetching of the wasm failed";
          return a;
        }
        async function Sa(a, b) {
          try {
            var d = await Ra(a);
            return await WebAssembly.instantiate(d, b);
          } catch (c) {
            E(`failed to asynchronously prepare wasm: ${c}`), Pa(c);
          }
        }
        async function Ta(a) {
          var b = Qa;
          if (!Da && !ya(b) && !da) try {
            var d = fetch(b, { credentials: "same-origin" });
            return await WebAssembly.instantiateStreaming(d, a);
          } catch (c) {
            E(`wasm streaming compile failed: ${c}`), E("falling back to ArrayBuffer instantiation");
          }
          return Sa(b, a);
        }
        class Va {
          name = "ExitStatus";
          constructor(a) {
            this.message = `Program terminated with exit(${a})`;
            this.status = a;
          }
        }
        var u, Oa = [], Ma = [], Xa = true, Ya = new TextDecoder(), Za = (a, b, d, c) => {
          d = b + d;
          if (c) return d;
          for (; a[b] && !(b >= d); ) ++b;
          return b;
        }, H, B = (a, b, d) => a ? Ya.decode(H.subarray(a, Za(H, a, b, d))) : "", $a = (a, b) => {
          for (var d = 0, c = a.length - 1; c >= 0; c--) {
            var e = a[c];
            e === "." ? a.splice(c, 1) : e === ".." ? (a.splice(c, 1), d++) : d && (a.splice(c, 1), d--);
          }
          if (b) for (; d; d--) a.unshift("..");
          return a;
        }, ab = (a) => {
          var b = a.charAt(0) === "/", d = a.slice(-1) === "/";
          (a = $a(a.split("/").filter((c) => !!c), !b).join("/")) || b || (a = ".");
          a && d && (a += "/");
          return (b ? "/" : "") + a;
        }, bb = (a) => {
          var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
          a = b[0];
          b = b[1];
          if (!a && !b) return ".";
          b &&= b.slice(0, -1);
          return a + b;
        }, cb = (a) => a && a.match(/([^\/]+|\/)\/*$/)[1], db2 = () => {
          if (da) {
            var a = require("node:crypto");
            return (b) => (a.randomFillSync(b), 0);
          }
          return (b) => (crypto.getRandomValues(b), 0);
        }, eb = (a) => (eb = db2())(a), fb = (...a) => {
          for (var b = "", d = false, c = a.length - 1; c >= -1 && !d; c--) {
            d = c >= 0 ? a[c] : "/";
            if (typeof d != "string") throw new TypeError("Arguments to path.resolve must be strings");
            if (!d) return "";
            b = d + "/" + b;
            d = d.charAt(0) === "/";
          }
          b = $a(b.split("/").filter((e) => !!e), !d).join("/");
          return (d ? "/" : "") + b || ".";
        }, gb = (a) => {
          var b = Za(a, 0);
          return Ya.decode(a.buffer ? a.subarray(0, b) : new Uint8Array(a.slice(0, b)));
        }, hb = [], m = (a) => {
          for (var b = 0, d = 0; d < a.length; ++d) {
            var c = a.charCodeAt(d);
            c <= 127 ? b++ : c <= 2047 ? b += 2 : c >= 55296 && c <= 57343 ? (b += 4, ++d) : b += 3;
          }
          return b;
        }, M = (a, b, d, c) => {
          if (!(c > 0)) return 0;
          var e = d;
          c = d + c - 1;
          for (var g = 0; g < a.length; ++g) {
            var n = a.codePointAt(g);
            if (n <= 127) {
              if (d >= c) break;
              b[d++] = n;
            } else if (n <= 2047) {
              if (d + 1 >= c) break;
              b[d++] = 192 | n >> 6;
              b[d++] = 128 | n & 63;
            } else if (n <= 65535) {
              if (d + 2 >= c) break;
              b[d++] = 224 | n >> 12;
              b[d++] = 128 | n >> 6 & 63;
              b[d++] = 128 | n & 63;
            } else {
              if (d + 3 >= c) break;
              b[d++] = 240 | n >> 18;
              b[d++] = 128 | n >> 12 & 63;
              b[d++] = 128 | n >> 6 & 63;
              b[d++] = 128 | n & 63;
              g++;
            }
          }
          b[d] = 0;
          return d - e;
        }, ib = (a) => {
          var b = Array(m(a) + 1);
          a = M(a, b, 0, b.length);
          b.length = a;
          return b;
        }, jb = [];
        function kb(a, b) {
          jb[a] = { input: [], output: [], ib: b };
          lb(a, mb);
        }
        var mb = { open(a) {
          var b = jb[a.node.rdev];
          if (!b) throw new O(43);
          a.tty = b;
          a.seekable = false;
        }, close(a) {
          a.tty.ib.fsync(a.tty);
        }, fsync(a) {
          a.tty.ib.fsync(a.tty);
        }, read(a, b, d, c) {
          if (!a.tty || !a.tty.ib.Ib) throw new O(60);
          for (var e = 0, g = 0; g < c; g++) {
            try {
              var n = a.tty.ib.Ib(a.tty);
            } catch (r) {
              throw new O(29);
            }
            if (n === void 0 && !e) throw new O(6);
            if (n === null || n === void 0) break;
            e++;
            b[d + g] = n;
            if (n === 10) break;
          }
          e && (a.node.atime = Date.now());
          return e;
        }, write(a, b, d, c) {
          if (!a.tty || !a.tty.ib.yb) throw new O(60);
          try {
            for (var e = 0; e < c; e++) a.tty.ib.yb(
              a.tty,
              b[d + e]
            );
          } catch (g) {
            throw new O(29);
          }
          c && (a.node.mtime = a.node.ctime = Date.now());
          return e;
        } }, nb = {
          Ib() {
            a: {
              if (!hb.length) {
                var a = null;
                if (da) {
                  var b = Buffer.alloc(256), d = 0;
                  try {
                    d = fs4.readSync(process.stdin.fd, b, 0, 256);
                  } catch (c) {
                    if (c.toString().includes("EOF")) d = 0;
                    else throw c;
                  }
                  d > 0 && (a = b.toString("utf-8", 0, d));
                } else globalThis.window?.prompt && (a = window.prompt("Input: "), a !== null && (a += "\n"));
                if (!a) {
                  a = null;
                  break a;
                }
                hb = ib(a);
              }
              a = hb.shift();
            }
            return a;
          },
          yb(a, b) {
            b === null || b === 10 ? (Ca(gb(a.output)), a.output = []) : b != 0 && a.output.push(b);
          },
          fsync(a) {
            a.output?.length > 0 && (Ca(gb(a.output)), a.output = []);
          },
          qc() {
            return { lc: 25856, nc: 5, kc: 191, mc: 35387, jc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
          },
          rc() {
            return 0;
          },
          sc() {
            return [24, 80];
          }
        }, ob = { yb(a, b) {
          b === null || b === 10 ? (E(gb(a.output)), a.output = []) : b != 0 && a.output.push(b);
        }, fsync(a) {
          a.output?.length > 0 && (E(gb(a.output)), a.output = []);
        } }, P = { Za: null, bb() {
          return P.createNode(null, "/", 16895, 0);
        }, createNode(a, b, d, c) {
          if ((d & 61440) === 24576 || (d & 61440) === 4096) throw new O(63);
          P.Za || (P.Za = { dir: { node: { Wa: P.Qa.Wa, $a: P.Qa.$a, lookup: P.Qa.lookup, lb: P.Qa.lb, rename: P.Qa.rename, unlink: P.Qa.unlink, rmdir: P.Qa.rmdir, readdir: P.Qa.readdir, symlink: P.Qa.symlink }, stream: { Ya: P.Pa.Ya } }, file: { node: { Wa: P.Qa.Wa, $a: P.Qa.$a }, stream: { Ya: P.Pa.Ya, read: P.Pa.read, write: P.Pa.write, mb: P.Pa.mb, nb: P.Pa.nb } }, link: { node: { Wa: P.Qa.Wa, $a: P.Qa.$a, readlink: P.Qa.readlink }, stream: {} }, Db: { node: { Wa: P.Qa.Wa, $a: P.Qa.$a }, stream: pb } });
          d = qb(a, b, d, c);
          Q(d.mode) ? (d.Qa = P.Za.dir.node, d.Pa = P.Za.dir.stream, d.Ta = {}) : (d.mode & 61440) === 32768 ? (d.Qa = P.Za.file.node, d.Pa = P.Za.file.stream, d.Va = 0, d.Ta = P.Ub ?? (P.Ub = new Uint8Array(0))) : (d.mode & 61440) === 40960 ? (d.Qa = P.Za.link.node, d.Pa = P.Za.link.stream) : (d.mode & 61440) === 8192 && (d.Qa = P.Za.Db.node, d.Pa = P.Za.Db.stream);
          d.atime = d.mtime = d.ctime = Date.now();
          a && (a.Ta[b] = d, a.atime = a.mtime = a.ctime = d.atime);
          return d;
        }, Qa: {
          Wa(a) {
            var b = {};
            b.dev = (a.mode & 61440) === 8192 ? a.id : 1;
            b.ino = a.id;
            b.mode = a.mode;
            b.nlink = 1;
            b.uid = 0;
            b.gid = 0;
            b.rdev = a.rdev;
            Q(a.mode) ? b.size = 4096 : (a.mode & 61440) === 32768 ? b.size = a.Va : (a.mode & 61440) === 40960 ? b.size = a.link.length : b.size = 0;
            b.atime = new Date(a.atime);
            b.mtime = new Date(a.mtime);
            b.ctime = new Date(a.ctime);
            b.atimeMs = a.atime;
            b.mtimeMs = a.mtime;
            b.ctimeMs = a.ctime;
            b.blksize = 4096;
            b.blocks = Math.ceil(b.size / b.blksize);
            return b;
          },
          $a(a, b) {
            for (var d of ["mode", "atime", "mtime", "ctime"]) b[d] != null && (a[d] = b[d]);
            b.size !== void 0 && (b = b.size, a.Va != b && (d = a.Ta, a.Ta = new Uint8Array(b), a.Ta.set(d.subarray(0, Math.min(b, a.Va))), a.Va = b));
          },
          lookup() {
            P.rb || (P.rb = new O(44), P.rb.stack = "<generic error, no stack>");
            throw P.rb;
          },
          lb(a, b, d, c) {
            return P.createNode(a, b, d, c);
          },
          rename(a, b, d) {
            try {
              var c = rb(b, d);
            } catch (g) {
            }
            if (c && Q(a.mode)) for (var e in c.Ta) throw new O(55);
            delete a.parent.Ta[a.name];
            b.Ta[d] = a;
            a.name = d;
            b.ctime = b.mtime = a.parent.ctime = a.parent.mtime = Date.now();
          },
          unlink(a, b) {
            delete a.Ta[b];
            a.ctime = a.mtime = Date.now();
          },
          rmdir(a, b) {
            var d = rb(a, b), c;
            for (c in d.Ta) throw new O(55);
            delete a.Ta[b];
            a.ctime = a.mtime = Date.now();
          },
          readdir(a) {
            return [".", "..", ...Object.keys(a.Ta)];
          },
          symlink(a, b, d) {
            a = P.createNode(a, b, 41471, 0);
            a.link = d;
            return a;
          },
          readlink(a) {
            if ((a.mode & 61440) !== 40960) throw new O(28);
            return a.link;
          }
        }, Pa: { read(a, b, d, c, e) {
          if (e >= a.node.Va) return 0;
          c = Math.min(a.node.Va - e, c);
          b.set(a.node.Ta.subarray(e, e + c), d);
          return c;
        }, write(a, b, d, c, e, g) {
          b.buffer === u.buffer && (g = false);
          if (!c) return 0;
          a = a.node;
          a.mtime = a.ctime = Date.now();
          if (g) a.Ta = b.subarray(d, d + c), a.Va = c;
          else if (a.Va || e) {
            g = e + c;
            var n = a.Ta.length;
            n >= g || (g = Math.max(g, n * (n < 1048576 ? 2 : 1.125) >>> 0), n && (g = Math.max(g, 256)), n = a.Ta.subarray(0, a.Va), a.Ta = new Uint8Array(g), a.Ta.set(n));
            a.Ta.set(b.subarray(
              d,
              d + c
            ), e);
            a.Va = Math.max(a.Va, e + c);
          } else a.Ta = b.slice(d, d + c), a.Va = c;
          return c;
        }, Ya(a, b, d) {
          d === 1 ? b += a.position : d === 2 && (a.node.mode & 61440) === 32768 && (b += a.node.Va);
          if (b < 0) throw new O(28);
          return b;
        }, mb(a, b, d, c, e) {
          if ((a.node.mode & 61440) !== 32768) throw new O(43);
          a = a.node.Ta;
          if (e & 2 || a.buffer !== u.buffer) {
            e = true;
            c = Math.ceil(b / 65536) * 65536;
            var g = sb(65536, c);
            g && H.fill(0, g, g + c);
            c = g;
            if (!c) throw new O(48);
            if (a) {
              if (d > 0 || d + b < a.length) a.subarray ? a = a.subarray(d, d + b) : a = Array.prototype.slice.call(a, d, d + b);
              u.set(a, c);
            }
          } else e = false, c = a.byteOffset;
          return { ec: c, Lb: e };
        }, nb(a, b, d, c) {
          P.Pa.write(a, b, 0, c, d, false);
          return 0;
        } } }, wb = (a, b) => {
          var d = 0;
          a && (d |= 365);
          b && (d |= 146);
          return d;
        }, Cb = null, Db = {}, Eb = [], Fb = 1, R = [], Gb = false, Hb = true, Ib = {}, O = class {
          name = "ErrnoError";
          constructor(a) {
            this.Ra = a;
          }
        }, Jb = class {
          shared = {};
          node = null;
          get flags() {
            return this.shared.flags;
          }
          set flags(a) {
            this.shared.flags = a;
          }
          get position() {
            return this.shared.position;
          }
          set position(a) {
            this.shared.position = a;
          }
        }, Kb = class {
          Qa = {};
          Pa = {};
          gb = null;
          listeners = null;
          zb = 0;
          constructor(a, b, d, c) {
            a ||= this;
            this.parent = a;
            this.bb = a.bb;
            this.id = Fb++;
            this.name = b;
            this.mode = d;
            this.rdev = c;
            this.atime = this.mtime = this.ctime = Date.now();
          }
          get read() {
            return (this.mode & 365) === 365;
          }
          set read(a) {
            a ? this.mode |= 365 : this.mode &= -366;
          }
          get write() {
            return (this.mode & 146) === 146;
          }
          set write(a) {
            a ? this.mode |= 146 : this.mode &= -147;
          }
          dc() {
            if (this.listeners) {
              var a;
              for (b of this.listeners) b.exclusive ? (a ||= []).push(b) : b.Qb(32);
              if (a) {
                var b = (this.zb || 0) % a.length;
                this.zb = b + 1;
                a[b].Qb(32);
              }
            }
          }
        };
        function C(a, b = {}) {
          if (!a) throw new O(44);
          b.sb ?? (b.sb = true);
          a.charAt(0) === "/" || (a = "//" + a);
          var d = 0;
          a: for (; d < 40; d++) {
            a = a.split("/").filter((r) => !!r);
            for (var c = Cb, e = "/", g = 0; g < a.length; g++) {
              var n = g === a.length - 1;
              if (n && b.parent) break;
              if (a[g] !== ".") if (a[g] === "..") if (e = bb(e), c === c.parent) {
                a = e + "/" + a.slice(g + 1).join("/");
                d--;
                continue a;
              } else c = c.parent;
              else {
                e = ab(e + "/" + a[g]);
                try {
                  c = rb(c, a[g]);
                } catch (r) {
                  if (r?.Ra === 44 && n && b.cc) return { path: e };
                  throw r;
                }
                !c.gb || n && !b.sb || (c = c.gb.root);
                if ((c.mode & 61440) === 40960 && (!n || b.fb)) {
                  if (!c.Qa.readlink) throw new O(52);
                  c = c.Qa.readlink(c);
                  c.charAt(0) === "/" || (c = bb(e) + "/" + c);
                  a = c + "/" + a.slice(g + 1).join("/");
                  continue a;
                }
              }
            }
            return { path: e, node: c };
          }
          throw new O(32);
        }
        function Lb(a) {
          for (var b; ; ) {
            if (a === a.parent) return a = a.bb.Kb, b ? a[a.length - 1] !== "/" ? `${a}/${b}` : a + b : a;
            b = b ? `${a.name}/${b}` : a.name;
            a = a.parent;
          }
        }
        function Mb(a, b) {
          for (var d = 0, c = 0; c < b.length; c++) d = (d << 5) - d + b.charCodeAt(c) | 0;
          return (a + d >>> 0) % R.length;
        }
        function Nb(a) {
          var b = Mb(a.parent.id, a.name);
          if (R[b] === a) R[b] = a.hb;
          else for (b = R[b]; b; ) {
            if (b.hb === a) {
              b.hb = a.hb;
              break;
            }
            b = b.hb;
          }
        }
        function rb(a, b) {
          var d = Q(a.mode) ? (d = Ob(a, "x")) ? d : a.Qa.lookup ? 0 : 2 : 54;
          if (d) throw new O(d);
          for (d = R[Mb(a.id, b)]; d; d = d.hb) {
            var c = d.name;
            if (d.parent.id === a.id && c === b) return d;
          }
          return a.Qa.lookup(a, b);
        }
        function qb(a, b, d, c) {
          a = new Kb(a, b, d, c);
          b = Mb(a.parent.id, a.name);
          a.hb = R[b];
          return R[b] = a;
        }
        function Q(a) {
          return (a & 61440) === 16384;
        }
        function Ob(a, b) {
          return Hb ? 0 : b.includes("r") && !(a.mode & 292) || b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73) ? 2 : 0;
        }
        function Pb(a, b) {
          if (!Q(a.mode)) return 54;
          try {
            return rb(a, b), 20;
          } catch (d) {
          }
          return Ob(a, "wx");
        }
        function Qb(a, b, d) {
          try {
            var c = rb(a, b);
          } catch (e) {
            return e.Ra;
          }
          if (a = Ob(a, "wx")) return a;
          if (d) {
            if (!Q(c.mode)) return 54;
            if (c === c.parent || Lb(c) === "/") return 10;
          } else if (Q(c.mode)) return 31;
          return 0;
        }
        function Rb(a) {
          if (!a) throw new O(63);
          return a;
        }
        function V(a) {
          a = Eb[a];
          if (!a) throw new O(8);
          return a;
        }
        function Sb(a, b = -1) {
          a = Object.assign(new Jb(), a);
          if (b == -1) a: {
            for (b = 0; b <= 4096; b++) if (!Eb[b]) break a;
            throw new O(33);
          }
          a.fd = b;
          return Eb[b] = a;
        }
        function Tb(a, b = -1) {
          a = Sb(a, b);
          a.Pa?.oc?.(a);
          return a;
        }
        function Ub(a, b, d) {
          var c = a?.Pa.$a;
          a = c ? a : b;
          c ??= b.Qa.$a;
          Rb(c);
          try {
            c(a, d);
          } catch (e) {
            if (e instanceof RangeError) throw new O(22);
            throw e;
          }
        }
        var pb = { open(a) {
          a.Pa = Db[a.node.rdev].Pa;
          a.Pa.open?.(a);
        }, Ya() {
          throw new O(70);
        } };
        function lb(a, b) {
          Db[a] = { Pa: b };
        }
        function Vb(a, b) {
          var d = b === "/";
          if (d && Cb) throw new O(10);
          if (!d && b) {
            var c = C(b, { sb: false });
            b = c.path;
            c = c.node;
            if (c.gb) throw new O(10);
            if (!Q(c.mode)) throw new O(54);
          }
          b = { type: a, tc: {}, Kb: b, bc: [] };
          a = a.bb(b);
          a.bb = b;
          b.root = a;
          d ? Cb = a : c && (c.gb = b, c.bb && c.bb.bc.push(b));
        }
        function Wb(a, b, d) {
          var c = C(a, { parent: true }).node;
          a = cb(a);
          if (!a) throw new O(28);
          if (a === "." || a === "..") throw new O(20);
          var e = Pb(c, a);
          if (e) throw new O(e);
          if (!c.Qa.lb) throw new O(63);
          return c.Qa.lb(c, a, b, d);
        }
        function Xb(a, b = 438) {
          return Wb(a, b & 4095 | 32768, 0);
        }
        function W(a, b = 511) {
          return Wb(a, b & 1023 | 16384, 0);
        }
        function Yb(a, b, d) {
          typeof d == "undefined" && (d = b, b = 438);
          Wb(a, b | 8192, d);
        }
        function Zb(a, b) {
          if (!fb(a)) throw new O(44);
          var d = C(b, { parent: true }).node;
          if (!d) throw new O(44);
          b = cb(b);
          var c = Pb(d, b);
          if (c) throw new O(c);
          if (!d.Qa.symlink) throw new O(63);
          d.Qa.symlink(d, b, a);
        }
        function $b(a) {
          var b = C(a, { parent: true }).node;
          a = cb(a);
          var d = rb(b, a), c = Qb(b, a, true);
          if (c) throw new O(c);
          if (!b.Qa.rmdir) throw new O(63);
          if (d.gb) throw new O(10);
          b.Qa.rmdir(b, a);
          Nb(d);
        }
        function qa(a) {
          var b = C(a, { parent: true }).node;
          if (!b) throw new O(44);
          a = cb(a);
          var d = rb(b, a), c = Qb(b, a, false);
          if (c) throw new O(c);
          if (!b.Qa.unlink) throw new O(63);
          if (d.gb) throw new O(10);
          b.Qa.unlink(b, a);
          Nb(d);
        }
        function ac(a, b = false) {
          a = C(a, { fb: !b }).node;
          return Rb(a.Qa.Wa)(a);
        }
        function bc(a, b, d) {
          Ub(a, b, { mode: d & 4095 | b.mode & -4096, ctime: Date.now(), Eb: false });
        }
        function cc(a, b) {
          a = typeof a == "string" ? C(a, { fb: true }).node : a;
          bc(null, a, b);
        }
        function dc(a, b, d) {
          if (Q(b.mode)) throw new O(31);
          if ((b.mode & 61440) !== 32768) throw new O(28);
          var c = Ob(b, "w");
          if (c) throw new O(c);
          Ub(a, b, { size: d, timestamp: Date.now() });
        }
        function ec(a, b, d, c = false) {
          a = C(a, { fb: !c });
          Ub(null, a.node, { atime: b, mtime: d, Eb: c });
        }
        function fc(a, b, d = 438) {
          if (a === "") throw new O(44);
          if (typeof b == "string") {
            var c = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b];
            if (typeof c == "undefined") throw Error(`Unknown file open mode: ${b}`);
            b = c;
          }
          d = b & 64 ? d & 4095 | 32768 : 0;
          if (typeof a == "object") c = a;
          else {
            var e = a.endsWith("/");
            a = C(a, { fb: !(b & 131072), cc: true });
            c = a.node;
            a = a.path;
          }
          var g = false;
          if (b & 64) if (c) {
            if (b & 128) throw new O(20);
          } else {
            if (e) throw new O(31);
            c = Wb(a, d | 511, 0);
            g = true;
          }
          if (!c) throw new O(44);
          (c.mode & 61440) === 8192 && (b &= -513);
          if (b & 65536 && !Q(c.mode)) throw new O(54);
          if (!g && (c ? (c.mode & 61440) === 40960 ? e = 32 : (e = ["r", "w", "rw"][b & 3], b & 512 && (e += "w"), e = Q(c.mode) && (e !== "r" || b & 576) ? 31 : Ob(c, e)) : e = 44, e)) throw new O(e);
          b & 512 && !g && (e = c, e = typeof e == "string" ? C(e, { fb: true }).node : e, dc(null, e, 0));
          b &= -131713;
          e = Sb({ node: c, path: Lb(c), flags: b, seekable: true, position: 0, Pa: c.Pa, fc: [], error: false });
          e.Pa.open && e.Pa.open(e);
          g && cc(c, d & 511);
          !k.logReadFiles || b & 1 || a in Ib || (Ib[a] = 1, E(`read file: ${a}`));
          return e;
        }
        function hc(a) {
          if (a.fd === null) throw new O(8);
          a.ub && (a.ub = null);
          a.node?.dc();
          try {
            a.Pa.close && a.Pa.close(a);
          } catch (b) {
            throw b;
          } finally {
            Eb[a.fd] = null;
          }
          a.fd = null;
        }
        function ic(a, b, d) {
          if (a.fd === null) throw new O(8);
          if (!a.seekable || !a.Pa.Ya) throw new O(70);
          if (d != 0 && d != 1 && d != 2) throw new O(28);
          a.position = a.Pa.Ya(a, b, d);
          a.fc = [];
        }
        function jc(a, b, d, c, e) {
          if (c < 0 || e < 0) throw new O(28);
          if (a.fd === null) throw new O(8);
          if ((a.flags & 2097155) === 0) throw new O(8);
          if (Q(a.node.mode)) throw new O(31);
          if (!a.Pa.write) throw new O(28);
          a.seekable && a.flags & 1024 && ic(a, 0, 2);
          var g = typeof e != "undefined";
          if (!g) e = a.position;
          else if (!a.seekable) throw new O(70);
          b = a.Pa.write(a, b, d, c, e, void 0);
          g || (a.position += b);
          return b;
        }
        function Jc() {
          var a, b, d;
          Gb = true;
          a ??= k.stdin;
          b ??= k.stdout;
          d ??= k.stderr;
          a ? X("stdin", a) : Zb("/dev/tty", "/dev/stdin");
          b ? X("stdout", null, b) : Zb("/dev/tty", "/dev/stdout");
          d ? X("stderr", null, d) : Zb("/dev/tty1", "/dev/stderr");
          fc("/dev/stdin", 0);
          fc("/dev/stdout", 1);
          fc("/dev/stderr", 1);
        }
        function ja(a, b) {
          var d = "/", c = a;
          d && (d = typeof d == "string" ? d : Lb(d), c = a ? ab(d + "/" + a) : d);
          a = wb(true, true);
          c = Xb(c, a);
          b && (typeof b == "string" && (b = ib(b)), b.subarray || (b = new Uint8Array(b)), cc(c, a | 146), d = fc(c, 577), jc(d, b, 0, b.length, 0), hc(d), cc(c, a));
        }
        function X(a, b, d) {
          a = ab("/dev/" + a);
          var c = wb(!!b, !!d);
          X.Jb ?? (X.Jb = 64);
          var e = X.Jb++ << 8 | 0;
          lb(e, { open(g) {
            g.seekable = false;
          }, close() {
            d?.buffer?.length && d(10);
          }, read(g, n, r, v) {
            for (var l = 0, z = 0; z < v; z++) {
              try {
                var F = b();
              } catch (ba) {
                throw new O(29);
              }
              if (F === void 0 && !l) throw new O(6);
              if (F === null || F === void 0) break;
              l++;
              n[r + z] = F;
            }
            l && (g.node.atime = Date.now());
            return l;
          }, write(g, n, r, v) {
            for (var l = 0; l < v; l++) try {
              d(n[r + l]);
            } catch (z) {
              throw new O(29);
            }
            v && (g.node.mtime = g.node.ctime = Date.now());
            return l;
          } });
          Yb(a, c, e);
        }
        var Y = {}, I, J, L;
        function Kc(a, b, d = false) {
          if (b.charAt(0) === "/") return b;
          a = a === -100 ? "/" : V(a).path;
          if (b.length == 0) {
            if (!d) throw new O(44);
            return a;
          }
          return a + "/" + b;
        }
        function Lc(a, b) {
          J[a >> 2] = b.dev;
          J[a + 4 >> 2] = b.mode;
          J[a + 8 >> 2] = b.nlink;
          J[a + 12 >> 2] = b.uid;
          J[a + 16 >> 2] = b.gid;
          J[a + 20 >> 2] = b.rdev;
          L[a + 24 >> 3] = BigInt(b.size);
          I[a + 32 >> 2] = 4096;
          I[a + 36 >> 2] = b.blocks;
          var d = b.atimeMs ?? b.atime.getTime(), c = b.mtimeMs ?? b.mtime.getTime(), e = b.ctimeMs ?? b.ctime.getTime();
          L[a + 40 >> 3] = BigInt(Math.floor(d / 1e3));
          J[a + 48 >> 2] = Math.floor(d % 1e3 * 1e6);
          L[a + 56 >> 3] = BigInt(Math.floor(c / 1e3));
          J[a + 64 >> 2] = Math.floor(c % 1e3 * 1e6);
          L[a + 72 >> 3] = BigInt(Math.floor(e / 1e3));
          J[a + 80 >> 2] = Math.floor(e % 1e3 * 1e6);
          L[a + 88 >> 3] = BigInt(b.ino);
          return 0;
        }
        var Mc = void 0, Nc = () => {
          var a = I[+Mc >> 2];
          Mc += 4;
          return a;
        }, Ia, Oc = 0, Pc = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Qc = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], Rc = {}, Sc = (a) => {
          Fa = a;
          Xa || Oc > 0 || (k.onExit?.(a), Ea = true);
          ta(a, new Va(a));
        }, Tc = {}, Vc = () => {
          if (!Uc) {
            var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: sa }, b;
            for (b in Tc) Tc[b] === void 0 ? delete a[b] : a[b] = Tc[b];
            var d = [];
            for (b in a) d.push(`${b}=${a[b]}`);
            Uc = d;
          }
          return Uc;
        }, Uc, Ja, Ka;
        function A(a, b = "i8") {
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              return u[a];
            case "i8":
              return u[a];
            case "i16":
              return Ia[a >> 1];
            case "i32":
              return I[a >> 2];
            case "i64":
              return L[a >> 3];
            case "float":
              return Ja[a >> 2];
            case "double":
              return Ka[a >> 3];
            case "*":
              return J[a >> 2];
            default:
              Pa(`invalid type for getValue: ${b}`);
          }
        }
        function oa(a) {
          var b = "i32";
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              u[a] = 0;
              break;
            case "i8":
              u[a] = 0;
              break;
            case "i16":
              Ia[a >> 1] = 0;
              break;
            case "i32":
              I[a >> 2] = 0;
              break;
            case "i64":
              L[a >> 3] = BigInt(0);
              break;
            case "float":
              Ja[a >> 2] = 0;
              break;
            case "double":
              Ka[a >> 3] = 0;
              break;
            case "*":
              J[a >> 2] = 0;
              break;
            default:
              Pa(`invalid type for setValue: ${b}`);
          }
        }
        var Wc = (a, b, d, c) => {
          var e = { string: (l) => {
            var z = 0;
            if (l !== null && l !== void 0 && l !== 0) {
              z = m(l) + 1;
              var F = la(z);
              M(l, H, F, z);
              z = F;
            }
            return z;
          }, array: (l) => {
            var z = la(l.length);
            u.set(l, z);
            return z;
          } };
          a = k["_" + a];
          var g = [], n = 0;
          if (c) for (var r = 0; r < c.length; r++) {
            var v = e[d[r]];
            v ? (n ||= na(), g[r] = v(c[r])) : g[r] = c[r];
          }
          d = a(...g);
          return d = (function(l) {
            n && pa(n);
            return b === "string" ? B(l) : b === "boolean" ? !!l : l;
          })(d);
        }, fa = (a) => {
          var b = m(a) + 1, d = ea(b);
          d && M(a, H, d, b);
          return d;
        }, Xc, Yc = [], ka = (a) => {
          Xc.delete(Z.get(a));
          Z.set(a, null);
          Yc.push(a);
        }, Zc = (a) => {
          var b = a.length;
          return [b % 128 | 128, b >> 7, ...a];
        }, $c = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 }, ad = (a) => Zc(Array.from(a, (b) => $c[b])), ra = (a, b) => {
          if (!Xc) {
            Xc = /* @__PURE__ */ new WeakMap();
            var d = Z.length;
            if (Xc) for (var c = 0; c < 0 + d; c++) {
              var e = Z.get(c);
              e && Xc.set(e, c);
            }
          }
          if (d = Xc.get(a) || 0) return d;
          d = Yc.length ? Yc.pop() : Z.grow(1);
          try {
            Z.set(d, a);
          } catch (g) {
            if (!(g instanceof TypeError)) throw g;
            b = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...Zc([1, 96, ...ad(b.slice(1)), ...ad(b[0] === "v" ? "" : b[0])]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
            b = new WebAssembly.Module(b);
            b = new WebAssembly.Instance(
              b,
              { e: { f: a } }
            ).exports.f;
            Z.set(d, b);
          }
          Xc.set(a, d);
          return d;
        };
        R.length = 4096;
        Vb(P, "/");
        W("/tmp");
        W("/home");
        W("/home/web_user");
        (function() {
          W("/dev");
          lb(259, { read: () => 0, write: (c, e, g, n) => n, Ya: () => 0 });
          Yb("/dev/null", 259);
          kb(1280, nb);
          kb(1536, ob);
          Yb("/dev/tty", 1280);
          Yb("/dev/tty1", 1536);
          var a = new Uint8Array(1024), b = 0, d = () => {
            b || (eb(a), b = a.byteLength);
            return a[--b];
          };
          X("random", d);
          X("urandom", d);
          W("/dev/shm");
          W("/dev/shm/tmp");
        })();
        (function() {
          W("/proc");
          var a = W("/proc/self");
          W("/proc/self/fd");
          Vb({ bb() {
            var b = qb(a, "fd", 16895, 73);
            b.Pa = { Ya: P.Pa.Ya };
            b.Qa = { lookup(d, c) {
              d = +c;
              var e = V(d);
              d = { parent: null, bb: { Kb: "fake" }, Qa: { readlink: () => e.path }, id: d + 1 };
              return d.parent = d;
            }, readdir() {
              return Array.from(Eb.entries()).filter(([, d]) => d).map(([d]) => d.toString());
            } };
            return b;
          } }, "/proc/self/fd");
        })();
        k.noExitRuntime && (Xa = k.noExitRuntime);
        k.print && (Ca = k.print);
        k.printErr && (E = k.printErr);
        k.wasmBinary && (Da = k.wasmBinary);
        k.thisProgram && (sa = k.thisProgram);
        var bd = k.preInit;
        if (bd) for (typeof bd == "function" && (k.preInit = bd = [bd]); bd.length > 0; ) bd.shift()();
        k.stackSave = () => na();
        k.stackRestore = (a) => pa(a);
        k.stackAlloc = (a) => la(a);
        k.cwrap = (a, b, d, c) => {
          var e = !d || d.every((g) => g === "number" || g === "boolean");
          return b !== "string" && e && !c ? k["_" + a] : (...g) => Wc(a, b, d, g);
        };
        k.addFunction = ra;
        k.removeFunction = ka;
        k.UTF8ToString = B;
        k.lengthBytesUTF8 = m;
        k.stringToNewUTF8 = fa;
        k.writeArrayToMemory = (a, b) => {
          u.set(a, b);
        };
        var ea, y, sb, cd, pa, la, na, Ha, Z, dd = {
          a: (a, b, d, c) => Pa(`Assertion failed: ${B(a)}, at: ` + [b ? B(b) : "unknown filename", d, c ? B(c) : "unknown function"]),
          i: function(a, b) {
            try {
              return a = B(a), cc(a, b), 0;
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return -d.Ra;
            }
          },
          M: function(a, b, d) {
            try {
              b = B(b);
              b = Kc(a, b);
              if (d & -8) return -28;
              var c = C(b, { fb: true }).node;
              if (!c) return -44;
              a = "";
              d & 4 && (a += "r");
              d & 2 && (a += "w");
              d & 1 && (a += "x");
              return a && Ob(c, a) ? -2 : 0;
            } catch (e) {
              if (typeof Y == "undefined" || e.name !== "ErrnoError") throw e;
              return -e.Ra;
            }
          },
          j: function(a, b) {
            try {
              var d = V(a);
              bc(d, d.node, b);
              return 0;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return -c.Ra;
            }
          },
          h: function(a) {
            try {
              var b = V(a);
              Ub(b, b.node, { timestamp: Date.now(), Eb: false });
              return 0;
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return -d.Ra;
            }
          },
          b: function(a, b, d) {
            Mc = d;
            try {
              var c = V(a);
              switch (b) {
                case 0:
                  var e = Nc();
                  if (e < 0) break;
                  for (; Eb[e]; ) e++;
                  return Tb(c, e).fd;
                case 1:
                case 2:
                  return 0;
                case 3:
                  return c.flags;
                case 4:
                  return e = Nc(), c.flags = c.flags & -289793 | e & 289792, 0;
                case 12:
                  return e = Nc(), Ia[e + 0 >> 1] = 2, 0;
                case 13:
                case 14:
                  return 0;
              }
              return -28;
            } catch (g) {
              if (typeof Y == "undefined" || g.name !== "ErrnoError") throw g;
              return -g.Ra;
            }
          },
          g: function(a, b) {
            try {
              var d = V(a), c = d.node, e = d.Pa.Wa;
              a = e ? d : c;
              e ??= c.Qa.Wa;
              Rb(e);
              var g = e(a);
              return Lc(b, g);
            } catch (n) {
              if (typeof Y == "undefined" || n.name !== "ErrnoError") throw n;
              return -n.Ra;
            }
          },
          I: function(a, b) {
            b = b < -9007199254740992 || b > 9007199254740992 ? NaN : Number(b);
            try {
              if (isNaN(b)) return -22;
              var d = V(a);
              if (b < 0 || (d.flags & 2097155) === 0) throw new O(28);
              dc(
                d,
                d.node,
                b
              );
              return 0;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return -c.Ra;
            }
          },
          H: function(a, b) {
            try {
              if (!b) return -28;
              var d = m("/") + 1;
              if (b < d) return -68;
              M("/", H, a, b);
              return d;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return -c.Ra;
            }
          },
          E: () => 0,
          L: function(a, b) {
            try {
              return a = B(a), Lc(b, ac(a, true));
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return -d.Ra;
            }
          },
          C: function(a, b, d) {
            try {
              return b = B(b), b = Kc(a, b), W(b, d & -19), 0;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return -c.Ra;
            }
          },
          K: function(a, b, d, c) {
            try {
              b = B(b);
              var e = c & 256;
              b = Kc(a, b, c & 4096);
              return Lc(d, e ? ac(b, true) : ac(b));
            } catch (g) {
              if (typeof Y == "undefined" || g.name !== "ErrnoError") throw g;
              return -g.Ra;
            }
          },
          x: function(a, b, d, c) {
            Mc = c;
            try {
              b = B(b);
              b = Kc(a, b);
              var e = c ? Nc() : 0;
              d & 64 && (e &= -19);
              return fc(b, d, e).fd;
            } catch (g) {
              if (typeof Y == "undefined" || g.name !== "ErrnoError") throw g;
              return -g.Ra;
            }
          },
          s: function(a, b, d, c) {
            try {
              b = B(b);
              b = Kc(a, b);
              if (c <= 0) return -28;
              var e = C(b).node;
              if (!e) throw new O(44);
              if (!e.Qa.readlink) throw new O(28);
              var g = e.Qa.readlink(e);
              var n = Math.min(c, m(g)), r = u[d + n];
              M(g, H, d, c + 1);
              u[d + n] = r;
              return n;
            } catch (v) {
              if (typeof Y == "undefined" || v.name !== "ErrnoError") throw v;
              return -v.Ra;
            }
          },
          r: function(a) {
            try {
              return a = B(a), $b(a), 0;
            } catch (b) {
              if (typeof Y == "undefined" || b.name !== "ErrnoError") throw b;
              return -b.Ra;
            }
          },
          f: function(a, b) {
            try {
              return a = B(a), Lc(b, ac(a));
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return -d.Ra;
            }
          },
          o: function(a, b, d) {
            try {
              b = B(b);
              b = Kc(a, b);
              if (d) if (d === 512) $b(b);
              else return -28;
              else qa(b);
              return 0;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return -c.Ra;
            }
          },
          n: function(a, b, d, c) {
            try {
              c &= 256;
              b = B(b);
              b = Kc(a, b, true);
              var e = Date.now();
              if (d) {
                let r2 = function(v) {
                  var l = I[v + 8 >> 2];
                  return l == 1073741823 ? e : l == 1073741822 ? null : (J[v >> 2] + I[v + 4 >> 2] * 4294967296 + (l / 1e4 | 0) * 1e4 / 1e9) * 1e3;
                };
                var r = r2;
                var g = r2(d);
                var n = r2(d + 16);
              } else n = g = e;
              (n ?? g) !== null && ec(b, g, n, c);
              return 0;
            } catch (r2) {
              if (typeof Y == "undefined" || r2.name !== "ErrnoError") throw r2;
              return -r2.Ra;
            }
          },
          w: () => Pa(""),
          v: () => {
            Xa = false;
            Oc = 0;
          },
          A: function(a, b) {
            a = a < -9007199254740992 || a > 9007199254740992 ? NaN : Number(a);
            a = new Date(a * 1e3);
            if (isNaN(a.getTime())) return 1;
            I[b >> 2] = a.getSeconds();
            I[b + 4 >> 2] = a.getMinutes();
            I[b + 8 >> 2] = a.getHours();
            I[b + 12 >> 2] = a.getDate();
            I[b + 16 >> 2] = a.getMonth();
            I[b + 20 >> 2] = a.getFullYear() - 1900;
            I[b + 24 >> 2] = a.getDay();
            var d = a.getFullYear();
            I[b + 28 >> 2] = (d % 4 !== 0 || d % 100 === 0 && d % 400 !== 0 ? Qc : Pc)[a.getMonth()] + a.getDate() - 1 | 0;
            I[b + 36 >> 2] = -(a.getTimezoneOffset() * 60);
            d = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
            var c = new Date(a.getFullYear(), 0, 1).getTimezoneOffset();
            I[b + 32 >> 2] = (d != c && a.getTimezoneOffset() == Math.min(c, d)) | 0;
            return 0;
          },
          y: function(a, b, d, c, e, g, n) {
            e = e < -9007199254740992 || e > 9007199254740992 ? NaN : Number(e);
            try {
              var r = V(c);
              if (b & 2 && !(d & 2) && (r.flags & 2097155) !== 2) throw new O(2);
              if ((r.flags & 2097155) === 1) throw new O(2);
              if (!r.Pa.mb) throw new O(43);
              if (!a) throw new O(28);
              var v = r.Pa.mb(r, a, e, b, d);
              var l = v.ec;
              I[g >> 2] = v.Lb;
              J[n >> 2] = l;
              return 0;
            } catch (z) {
              if (typeof Y == "undefined" || z.name !== "ErrnoError") throw z;
              return -z.Ra;
            }
          },
          z: function(a, b, d, c, e, g) {
            g = g < -9007199254740992 || g > 9007199254740992 ? NaN : Number(g);
            try {
              var n = V(e);
              if (d & 2) {
                if ((n.node.mode & 61440) !== 32768) throw new O(43);
                c & 2 || n.Pa.nb && n.Pa.nb(n, H.subarray(a, a + b), g, b, c);
              }
            } catch (r) {
              if (typeof Y == "undefined" || r.name !== "ErrnoError") throw r;
              return -r.Ra;
            }
          },
          k: (a, b) => {
            Rc[a] && (clearTimeout(Rc[a].id), delete Rc[a]);
            if (!b) return 0;
            var d = setTimeout(() => {
              delete Rc[a];
              var c = [a, performance.now()], e = cd;
              if (!Ea) try {
                e(...c);
              } catch (g) {
                g instanceof Va || g == "unwind" || ta(1, g);
              } finally {
                if (!(Xa || Oc > 0)) try {
                  Fa = c = Fa, Sc(c);
                } catch (g) {
                  g instanceof Va || g == "unwind" || ta(
                    1,
                    g
                  );
                }
              }
            }, b);
            Rc[a] = { id: d, uc: b };
            return 0;
          },
          B: (a, b, d, c) => {
            var e = (/* @__PURE__ */ new Date()).getFullYear(), g = new Date(e, 0, 1).getTimezoneOffset();
            e = new Date(e, 6, 1).getTimezoneOffset();
            J[a >> 2] = Math.max(g, e) * 60;
            I[b >> 2] = Number(g != e);
            b = (n) => {
              var r = Math.abs(n);
              return `UTC${n >= 0 ? "-" : "+"}${String(Math.floor(r / 60)).padStart(2, "0")}${String(r % 60).padStart(2, "0")}`;
            };
            a = b(g);
            b = b(e);
            e < g ? (M(a, H, d, 17), M(b, H, c, 17)) : (M(a, H, c, 17), M(b, H, d, 17));
          },
          d: () => Date.now(),
          p: () => 2147483648,
          c: () => performance.now(),
          l: (a) => {
            var b = H.length;
            a >>>= 0;
            if (a > 2147483648) return false;
            for (var d = 1; d <= 4; d *= 2) {
              var c = b * (1 + 0.2 / d);
              c = Math.min(c, a + 100663296);
              a: {
                c = (Math.min(2147483648, Math.ceil(Math.max(a, c) / 65536) * 65536) - Ha.buffer.byteLength + 65535) / 65536 | 0;
                try {
                  Ha.grow(c);
                  Ga();
                  var e = 1;
                  break a;
                } catch (g) {
                }
                e = void 0;
              }
              if (e) return true;
            }
            return false;
          },
          F: (a, b) => {
            var d = 0, c = 0, e;
            for (e of Vc()) {
              var g = b + d;
              J[a + c >> 2] = g;
              d += M(e, H, g, Infinity) + 1;
              c += 4;
            }
            return 0;
          },
          G: (a, b) => {
            var d = Vc();
            J[a >> 2] = d.length;
            a = 0;
            for (var c of d) a += m(c) + 1;
            J[b >> 2] = a;
            return 0;
          },
          e: function(a) {
            try {
              var b = V(a);
              hc(b);
              return 0;
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return d.Ra;
            }
          },
          m: function(a, b) {
            try {
              var d = V(a);
              u[b] = d.tty ? 2 : Q(d.mode) ? 3 : (d.mode & 61440) === 40960 ? 7 : 4;
              Ia[b + 2 >> 1] = 0;
              L[b + 8 >> 3] = BigInt(0);
              L[b + 16 >> 3] = BigInt(0);
              return 0;
            } catch (c) {
              if (typeof Y == "undefined" || c.name !== "ErrnoError") throw c;
              return c.Ra;
            }
          },
          t: function(a, b, d, c) {
            try {
              a: {
                var e = V(a);
                a = b;
                for (var g, n = b = 0; n < d; n++) {
                  var r = J[a >> 2], v = J[a + 4 >> 2];
                  a += 8;
                  try {
                    var l = e, z = r, F = v, ba = g, za = u;
                    if (F < 0 || ba < 0) throw new O(28);
                    if (l.fd === null) throw new O(8);
                    if ((l.flags & 2097155) === 1) throw new O(8);
                    if (Q(l.node.mode)) throw new O(31);
                    if (!l.Pa.read) throw new O(28);
                    var ma = typeof ba != "undefined";
                    if (!ma) ba = l.position;
                    else if (!l.seekable) throw new O(70);
                    var Aa = l.Pa.read(l, za, z, F, ba);
                    ma || (l.position += Aa);
                    var ha = Aa;
                  } catch (N) {
                    if (b > 0 && N instanceof O && (N.Ra == 6 || N.Ra == 6)) break;
                    throw N;
                  }
                  if (ha < 0) {
                    var Ba = -1;
                    break a;
                  }
                  b += ha;
                  if (ha < v) break;
                  typeof g != "undefined" && (g += ha);
                }
                Ba = b;
              }
              J[c >> 2] = Ba;
              return 0;
            } catch (N) {
              if (typeof Y == "undefined" || N.name !== "ErrnoError") throw N;
              return N.Ra;
            }
          },
          D: function(a, b, d, c) {
            b = b < -9007199254740992 || b > 9007199254740992 ? NaN : Number(b);
            try {
              if (isNaN(b)) return 22;
              var e = V(a);
              ic(e, b, d);
              L[c >> 3] = BigInt(e.position);
              e.ub && !b && d === 0 && (e.ub = null);
              return 0;
            } catch (g) {
              if (typeof Y == "undefined" || g.name !== "ErrnoError") throw g;
              return g.Ra;
            }
          },
          J: function(a) {
            try {
              var b = V(a);
              return b.Pa?.fsync?.(b);
            } catch (d) {
              if (typeof Y == "undefined" || d.name !== "ErrnoError") throw d;
              return d.Ra;
            }
          },
          q: function(a, b, d, c) {
            try {
              var e = V(a);
              a = b;
              if (d == 1) var g = jc(e, u, J[a >> 2], J[a + 4 >> 2]);
              else {
                for (var n = b = 0, r = a; n < d; n++, r += 8) b += J[r + 4 >> 2];
                var v = new Uint8Array(b);
                for (n = r = 0; n < d; n++, a += 8) {
                  var l = J[a >> 2], z = J[a + 4 >> 2];
                  v.set(H.subarray(l, l + z), r);
                  r += z;
                }
                g = jc(e, v, 0, b);
              }
              J[c >> 2] = g;
              return 0;
            } catch (F) {
              if (typeof Y == "undefined" || F.name !== "ErrnoError") throw F;
              return F.Ra;
            }
          },
          u: Sc
        };
        async function ed() {
          La();
          var a = k.setStatus;
          a && (a("Running..."), await new Promise((b) => setTimeout(b, 1)), setTimeout(a, 1, ""));
          Ea || (k.noFSInit || Gb || Jc(), fd.O(), Hb = false, k.onRuntimeInitialized?.(), Na());
        }
        var fd;
        (async function() {
          function a(c) {
            c = fd = c.exports;
            k._sqlite3_free = c.Q;
            k._sqlite3_value_text = c.R;
            k._sqlite3_prepare_v2 = c.S;
            k._sqlite3_step = c.T;
            k._sqlite3_reset = c.U;
            k._sqlite3_exec = c.V;
            k._sqlite3_finalize = c.W;
            k._sqlite3_column_name = c.X;
            k._sqlite3_column_text = c.Y;
            k._sqlite3_column_type = c.Z;
            k._sqlite3_errmsg = c._;
            k._sqlite3_backup_init = c.$;
            k._sqlite3_backup_step = c.aa;
            k._sqlite3_backup_finish = c.ba;
            k._sqlite3_clear_bindings = c.ca;
            k._sqlite3_value_blob = c.da;
            k._sqlite3_value_bytes = c.ea;
            k._sqlite3_value_double = c.fa;
            k._sqlite3_value_int = c.ga;
            k._sqlite3_value_type = c.ha;
            k._sqlite3_result_blob = c.ia;
            k._sqlite3_result_double = c.ja;
            k._sqlite3_result_error = c.ka;
            k._sqlite3_result_int = c.la;
            k._sqlite3_result_int64 = c.ma;
            k._sqlite3_result_null = c.na;
            k._sqlite3_result_text = c.oa;
            k._sqlite3_aggregate_context = c.pa;
            k._sqlite3_column_count = c.qa;
            k._sqlite3_data_count = c.ra;
            k._sqlite3_column_blob = c.sa;
            k._sqlite3_column_bytes = c.ta;
            k._sqlite3_column_double = c.ua;
            k._sqlite3_bind_blob = c.va;
            k._sqlite3_bind_double = c.wa;
            k._sqlite3_bind_int = c.xa;
            k._sqlite3_bind_text = c.ya;
            k._sqlite3_bind_parameter_index = c.za;
            k._sqlite3_sql = c.Aa;
            k._sqlite3_normalized_sql = c.Ba;
            k._sqlite3_changes = c.Ca;
            k._sqlite3_close_v2 = c.Da;
            k._sqlite3_create_function_v2 = c.Ea;
            k._sqlite3_update_hook = c.Fa;
            k._sqlite3_open = c.Ga;
            ea = k._malloc = c.Ha;
            y = k._free = c.Ia;
            k._RegisterExtensionFunctions = c.Ja;
            sb = c.Ka;
            cd = c.La;
            pa = c.Ma;
            la = c.Na;
            na = c.Oa;
            Ha = c.N;
            Z = c.P;
            Ga();
            return fd;
          }
          var b = { a: dd }, d = k.instantiateWasm;
          if (d) return new Promise((c) => {
            d(b, (e) => c(a(e)));
          });
          Qa ??= k.locateFile ? k.locateFile(
            "sql-wasm.wasm",
            va
          ) : va + "sql-wasm.wasm";
          return (function(c) {
            return a(c.instance);
          })(await Ta(b));
        })().then(() => ed());
        return Module;
      });
      return initSqlJsPromise;
    };
    if (typeof exports2 === "object" && typeof module2 === "object") {
      module2.exports = initSqlJs2;
      module2.exports.default = initSqlJs2;
    } else if (typeof define === "function" && define["amd"]) {
      define([], function() {
        return initSqlJs2;
      });
    } else if (typeof exports2 === "object") {
      exports2["Module"] = initSqlJs2;
    }
  }
});

// electron/main.ts
var import_electron = require("electron");
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));

// electron/database.ts
var import_sql = __toESM(require_sql_wasm());
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_crypto = __toESM(require("crypto"));
var TournamentDatabase = class {
  db = null;
  dbPath;
  wasmBinaryPath;
  constructor(dbPath, wasmBinaryPath) {
    this.dbPath = dbPath || import_path.default.join(process.cwd(), "tournament.db");
    this.wasmBinaryPath = wasmBinaryPath;
  }
  async initialize() {
    let wasmBinary;
    const candidates = [
      this.wasmBinaryPath,
      import_path.default.join(__dirname, "sql-wasm.wasm"),
      import_path.default.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
      import_path.default.join(process.cwd(), "dist-electron", "sql-wasm.wasm")
    ].filter(Boolean);
    for (const c of candidates) {
      if (import_fs.default.existsSync(c)) {
        try {
          const buf = import_fs.default.readFileSync(c);
          wasmBinary = new Uint8Array(buf);
          break;
        } catch {
        }
      }
    }
    const SQL = await (0, import_sql.default)({
      wasmBinary: wasmBinary ? wasmBinary.buffer : void 0,
      locateFile: () => import_path.default.join(__dirname, "sql-wasm.wasm")
    });
    if (import_fs.default.existsSync(this.dbPath)) {
      try {
        const fileBuffer = import_fs.default.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } catch (err) {
        console.error("Failed to read existing database file, creating fresh one:", err);
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }
    this.runMigrations();
    this.persistToDisk();
  }
  getRawDb() {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }
  persistToDisk() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = import_path.default.dirname(this.dbPath);
      if (!import_fs.default.existsSync(dir)) {
        import_fs.default.mkdirSync(dir, { recursive: true });
      }
      import_fs.default.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error("Failed to persist database to disk:", err);
    }
  }
  runMigrations() {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        rotation_policy TEXT NOT NULL DEFAULT 'one_time',
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL UNIQUE,
        captain_name TEXT NOT NULL,
        captain_phone TEXT,
        captain_discord_id TEXT,
        status TEXT NOT NULL DEFAULT 'eligible',
        original_data_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_captain INTEGER NOT NULL DEFAULT 0,
        extra_info TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS draws (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        draw_number INTEGER NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 12,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at TEXT NOT NULL,
        finalized_at TEXT
      );

      CREATE TABLE IF NOT EXISTS draw_selections (
        id TEXT PRIMARY KEY,
        draw_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        selection_order INTEGER NOT NULL,
        selected_at TEXT NOT NULL,
        notification_status TEXT NOT NULL DEFAULT 'pending',
        discord_message_id TEXT,
        notification_error TEXT,
        notified_at TEXT,
        FOREIGN KEY (draw_id) REFERENCES draws(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        draw_id TEXT,
        match_number INTEGER NOT NULL,
        room_id TEXT,
        room_password TEXT,
        match_date TEXT,
        match_time TEXT,
        voice_channel_info TEXT,
        additional_instructions TEXT,
        room_notification_status TEXT NOT NULL DEFAULT 'draft',
        status TEXT NOT NULL DEFAULT 'scheduled',
        completed_at TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (draw_id) REFERENCES draws(id)
      );

      CREATE TABLE IF NOT EXISTS match_team_participation (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        selection_order INTEGER,
        actually_played INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );

      CREATE TABLE IF NOT EXISTS match_player_participation (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        role TEXT NOT NULL,
        participated INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
      );

      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        team_id TEXT NOT NULL,
        captain_discord_id TEXT NOT NULL,
        captain_name TEXT,
        status TEXT NOT NULL,
        message_content TEXT NOT NULL,
        message_id TEXT,
        error_message TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN team_name TEXT;");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN captain_name TEXT;");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE teams ADD COLUMN current_stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE teams ADD COLUMN qualification_status TEXT NOT NULL DEFAULT 'pending';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE matches ADD COLUMN stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE draws ADD COLUMN stage TEXT NOT NULL DEFAULT 'qualifying';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN match_number INTEGER;");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN stage TEXT DEFAULT 'qualifying';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN result TEXT DEFAULT 'pending';");
    } catch {
    }
    try {
      this.db.run("ALTER TABLE match_team_participation ADD COLUMN match_date TEXT;");
    } catch {
    }
    const defaultSettings = [
      ["tournament_name", "Free Fire Championship 2026"],
      ["rotation_policy", "one_time"],
      ["selection_target", "12"],
      ["discord_bot_token", ""],
      ["sound_enabled", "true"],
      ["rules", JSON.stringify([
        "All team captains must be present in Discord 15 minutes before match time.",
        "Every player must remain in their assigned team voice channel during gameplay.",
        "Room ID and Password must not be shared with unauthorized players or outsiders.",
        "Emulator use is strictly prohibited unless specifically permitted by organizers.",
        "Teams arriving more than 10 minutes late forfeit their match slot."
      ])]
    ];
    for (const [key, val] of defaultSettings) {
      const existing = this.getSetting(key);
      if (existing === null) {
        this.setSetting(key, val);
      }
    }
  }
  // --- SETTINGS ---
  getSetting(key) {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT value FROM settings WHERE key = :key");
    stmt.bind({ ":key": key });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.value;
    }
    stmt.free();
    return null;
  }
  setSetting(key, value) {
    if (!this.db) return;
    this.db.run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (:key, :value)",
      { ":key": key, ":value": value }
    );
    this.persistToDisk();
  }
  getSettings() {
    const rulesStr = this.getSetting("rules");
    let rules = [];
    try {
      rules = rulesStr ? JSON.parse(rulesStr) : [];
    } catch {
      rules = [];
    }
    return {
      tournament_name: this.getSetting("tournament_name") || "Free Fire Tournament",
      rotation_policy: this.getSetting("rotation_policy") || "one_time",
      selection_target: parseInt(this.getSetting("selection_target") || "12", 10),
      discord_bot_token: this.getSetting("discord_bot_token") || "",
      discord_guild_id: this.getSetting("discord_guild_id") || "",
      sound_enabled: this.getSetting("sound_enabled") !== "false",
      rules
    };
  }
  saveSettings(settings) {
    if (settings.tournament_name !== void 0) this.setSetting("tournament_name", settings.tournament_name);
    if (settings.rotation_policy !== void 0) this.setSetting("rotation_policy", settings.rotation_policy);
    if (settings.selection_target !== void 0) this.setSetting("selection_target", settings.selection_target.toString());
    if (settings.discord_bot_token !== void 0) this.setSetting("discord_bot_token", settings.discord_bot_token);
    if (settings.discord_guild_id !== void 0) this.setSetting("discord_guild_id", settings.discord_guild_id);
    if (settings.sound_enabled !== void 0) this.setSetting("sound_enabled", settings.sound_enabled ? "true" : "false");
    if (settings.rules !== void 0) this.setSetting("rules", JSON.stringify(settings.rules));
    this.addAuditLog("UPDATE_SETTINGS", "Organizer updated tournament settings");
  }
  // --- AUDIT LOGS ---
  addAuditLog(action, details) {
    if (!this.db) return;
    const id = import_crypto.default.randomUUID();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      "INSERT INTO audit_logs (id, action, details, timestamp) VALUES (:id, :action, :details, :timestamp)",
      { ":id": id, ":action": action, ":details": details, ":timestamp": timestamp }
    );
    this.persistToDisk();
  }
  getAuditLogs() {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200");
    if (!res || res.length === 0) return [];
    const cols = res[0].columns;
    return res[0].values.map((row) => {
      const obj = {};
      cols.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      return obj;
    });
  }
  // --- TEAMS & PLAYERS ---
  getAllTeams() {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teams ORDER BY team_name ASC");
    if (!res || res.length === 0) return [];
    const teams = res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      return obj;
    });
    for (const team of teams) {
      team.players = this.getTeamPlayers(team.id);
      if (!team.current_stage) team.current_stage = "qualifying";
      if (!team.qualification_status) team.qualification_status = "pending";
      if (team.original_data_json) {
        try {
          team.extra_columns = JSON.parse(team.original_data_json);
        } catch {
        }
      }
      try {
        const statsStmt = this.db.prepare(`
          SELECT COUNT(*) as count, result 
          FROM match_team_participation 
          WHERE team_id = :team_id AND actually_played = 1
          ORDER BY rowid DESC LIMIT 1
        `);
        statsStmt.bind({ ":team_id": team.id });
        if (statsStmt.step()) {
          const row = statsStmt.getAsObject();
          team.matches_played_count = row.count || 0;
          team.last_match_result = row.result || void 0;
        }
        statsStmt.free();
      } catch {
      }
    }
    return teams;
  }
  getEligibleTeams(stage, allowRepeat = false) {
    if (!this.db) return [];
    let query;
    const params = {};
    if (stage) {
      if (allowRepeat) {
        query = `
          SELECT * FROM teams 
          WHERE current_stage = :stage 
            AND qualification_status != 'eliminated'
            AND status NOT IN ('withdrawn', 'disqualified')
          ORDER BY team_name ASC
        `;
        params[":stage"] = stage;
      } else {
        query = `
          SELECT * FROM teams 
          WHERE current_stage = :stage 
            AND qualification_status != 'eliminated'
            AND status NOT IN ('withdrawn', 'disqualified')
            AND id NOT IN (
              SELECT mtp.team_id 
              FROM match_team_participation mtp
              JOIN matches m ON mtp.match_id = m.id
              WHERE m.stage = :stage AND m.status = 'completed' AND mtp.actually_played = 1
            )
          ORDER BY team_name ASC
        `;
        params[":stage"] = stage;
      }
    } else {
      query = `
        SELECT * FROM teams 
        WHERE qualification_status != 'eliminated'
          AND status NOT IN ('withdrawn', 'disqualified')
          AND id NOT IN (
            SELECT mtp.team_id 
            FROM match_team_participation mtp
            JOIN matches m ON mtp.match_id = m.id
            WHERE m.stage = teams.current_stage AND m.status = 'completed' AND mtp.actually_played = 1
          )
        ORDER BY team_name ASC
      `;
    }
    const stmt = this.db.prepare(query);
    stmt.bind(params);
    const teams = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.players = this.getTeamPlayers(row.id);
      if (!row.current_stage) row.current_stage = "qualifying";
      if (!row.qualification_status) row.qualification_status = "pending";
      teams.push(row);
    }
    stmt.free();
    return teams;
  }
  getPlayedTeams() {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teams WHERE status = 'played' OR id IN (SELECT DISTINCT team_id FROM match_team_participation WHERE actually_played = 1) ORDER BY updated_at DESC");
    if (!res || res.length === 0) return [];
    return res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      const team = obj;
      team.players = this.getTeamPlayers(team.id);
      if (!team.current_stage) team.current_stage = "qualifying";
      if (!team.qualification_status) team.qualification_status = "pending";
      return team;
    });
  }
  getTeamById(id) {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM teams WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      row.players = this.getTeamPlayers(row.id);
      if (!row.current_stage) row.current_stage = "qualifying";
      if (!row.qualification_status) row.qualification_status = "pending";
      if (row.original_data_json) {
        try {
          row.extra_columns = JSON.parse(row.original_data_json);
        } catch {
        }
      }
      return row;
    }
    stmt.free();
    return null;
  }
  updateTeamQualification(teamId, qualificationStatus, currentStage) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let sql = "UPDATE teams SET qualification_status = :status, updated_at = :now";
    const params = { ":status": qualificationStatus, ":now": now, ":id": teamId };
    if (currentStage) {
      sql += ", current_stage = :stage";
      params[":stage"] = currentStage;
    }
    sql += " WHERE id = :id";
    this.db.run(sql, params);
    this.addAuditLog("UPDATE_QUALIFICATION", `Team ${teamId} qualification updated to ${qualificationStatus}${currentStage ? ` (Stage: ${currentStage})` : ""}`);
    this.persistToDisk();
  }
  advanceTeamStage(teamId, nextStage) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      `UPDATE teams 
       SET current_stage = :stage, 
           status = 'eligible', 
           updated_at = :now 
       WHERE id = :id`,
      { ":stage": nextStage, ":now": now, ":id": teamId }
    );
    this.addAuditLog("ADVANCE_STAGE", `Team ${teamId} advanced to stage: ${nextStage}`);
    this.persistToDisk();
  }
  batchUpdateTeamQualification(teamIds, qualificationStatus, currentStage) {
    if (!this.db || teamIds.length === 0) return;
    this.db.run("BEGIN TRANSACTION;");
    try {
      for (const tId of teamIds) {
        this.updateTeamQualification(tId, qualificationStatus, currentStage);
      }
      this.db.run("COMMIT;");
      this.persistToDisk();
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  batchAdvanceTeamStage(teamIds, nextStage) {
    if (!this.db || teamIds.length === 0) return;
    this.db.run("BEGIN TRANSACTION;");
    try {
      for (const tId of teamIds) {
        this.advanceTeamStage(tId, nextStage);
      }
      this.db.run("COMMIT;");
      this.persistToDisk();
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  getTeamMatchHistory(teamId) {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT mtp.*, m.room_id, m.status as match_status
      FROM match_team_participation mtp
      LEFT JOIN matches m ON mtp.match_id = m.id
      WHERE mtp.team_id = :team_id
      ORDER BY mtp.rowid DESC
    `);
    stmt.bind({ ":team_id": teamId });
    const list = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        id: row.id,
        match_id: row.match_id,
        team_id: row.team_id,
        team_name: row.team_name,
        captain_name: row.captain_name,
        selection_order: row.selection_order,
        actually_played: Boolean(row.actually_played),
        match_number: row.match_number,
        stage: row.stage,
        result: row.result || "pending",
        match_date: row.match_date,
        notes: row.notes,
        players: this.getMatchPlayerParticipation(row.match_id, teamId)
      });
    }
    stmt.free();
    return list;
  }
  getTeamPlayers(teamId) {
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM players WHERE team_id = :team_id ORDER BY is_captain DESC, role ASC");
    stmt.bind({ ":team_id": teamId });
    const players = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      players.push({
        id: row.id,
        team_id: row.team_id,
        player_name: row.player_name,
        role: row.role,
        is_captain: Boolean(row.is_captain),
        extra_info: row.extra_info
      });
    }
    stmt.free();
    return players;
  }
  addPlayer(teamId, playerName, role = "substitute", isCaptain = false, extraInfo = "") {
    if (!this.db) throw new Error("Database not initialized");
    const id = import_crypto.default.randomUUID();
    this.db.run(
      `INSERT INTO players (id, team_id, player_name, role, is_captain, extra_info)
       VALUES (:id, :team_id, :player_name, :role, :is_captain, :extra_info)`,
      {
        ":id": id,
        ":team_id": teamId,
        ":player_name": playerName.trim(),
        ":role": role.trim(),
        ":is_captain": isCaptain ? 1 : 0,
        ":extra_info": extraInfo.trim()
      }
    );
    if (isCaptain) {
      this.db.run(
        `UPDATE teams SET captain_name = :captain_name, updated_at = :updated_at WHERE id = :team_id`,
        {
          ":captain_name": playerName.trim(),
          ":updated_at": (/* @__PURE__ */ new Date()).toISOString(),
          ":team_id": teamId
        }
      );
    }
    this.addAuditLog("ADD_PLAYER", `Added player "${playerName}" (${role}) to team ${teamId}`);
    this.persistToDisk();
    return {
      id,
      team_id: teamId,
      player_name: playerName.trim(),
      role,
      is_captain: isCaptain,
      extra_info: extraInfo.trim()
    };
  }
  deletePlayer(playerId) {
    if (!this.db) return;
    this.db.run("DELETE FROM players WHERE id = :id", { ":id": playerId });
    this.addAuditLog("DELETE_PLAYER", `Deleted player ${playerId}`);
    this.persistToDisk();
  }
  updateTeamStatus(teamId, status, reason) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      "UPDATE teams SET status = :status, updated_at = :updated_at WHERE id = :id",
      { ":status": status, ":updated_at": now, ":id": teamId }
    );
    this.addAuditLog("UPDATE_TEAM_STATUS", `Team ${teamId} changed to ${status}. Reason: ${reason || "Manual update"}`);
    this.persistToDisk();
  }
  addTeam(teamName, captainName, captainDiscordId = "") {
    if (!this.db) throw new Error("Database not initialized");
    const id = import_crypto.default.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      `INSERT INTO teams (id, team_name, captain_name, captain_discord_id, status, current_stage, qualification_status, created_at, updated_at)
       VALUES (:id, :team_name, :captain_name, :captain_discord_id, 'eligible', 'qualifying', 'pending', :created_at, :updated_at)`,
      {
        ":id": id,
        ":team_name": teamName.trim(),
        ":captain_name": captainName.trim(),
        ":captain_discord_id": captainDiscordId.trim() || null,
        ":created_at": now,
        ":updated_at": now
      }
    );
    const playerId = import_crypto.default.randomUUID();
    this.db.run(
      `INSERT INTO players (id, team_id, player_name, role, is_captain, extra_info)
       VALUES (:id, :team_id, :player_name, 'captain', 1, '')`,
      {
        ":id": playerId,
        ":team_id": id,
        ":player_name": captainName.trim()
      }
    );
    this.addAuditLog("ADD_TEAM", `Added team "${teamName}" with captain "${captainName}"`);
    this.persistToDisk();
    return {
      id,
      team_name: teamName.trim(),
      captain_name: captainName.trim(),
      captain_discord_id: captainDiscordId.trim() || null,
      captain_phone: null,
      status: "eligible",
      current_stage: "qualifying",
      qualification_status: "pending",
      matches_played_count: 0,
      original_data_json: null,
      created_at: now,
      updated_at: now,
      players: [
        {
          id: playerId,
          team_id: id,
          player_name: captainName.trim(),
          role: "captain",
          is_captain: true,
          extra_info: ""
        }
      ]
    };
  }
  deleteTeam(teamId) {
    if (!this.db) return;
    this.db.run("DELETE FROM players WHERE team_id = :id", { ":id": teamId });
    this.db.run("DELETE FROM draw_selections WHERE team_id = :id", { ":id": teamId });
    this.db.run("DELETE FROM teams WHERE id = :id", { ":id": teamId });
    this.addAuditLog("DELETE_TEAM", `Deleted team ${teamId}`);
    this.persistToDisk();
  }
  resetRotation(policy) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      "UPDATE teams SET status = 'eligible', updated_at = :now WHERE status IN ('played', 'selected', 'playing')",
      { ":now": now }
    );
    this.addAuditLog("RESET_ROTATION", `Rotation reset under policy: ${policy}`);
    this.persistToDisk();
  }
  importTeamsBatch(teamsToImport) {
    if (!this.db) throw new Error("Database not initialized");
    let inserted = 0;
    let updated = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const usedNames = /* @__PURE__ */ new Set();
    const existingStmt = this.db.prepare("SELECT LOWER(team_name) as name FROM teams");
    while (existingStmt.step()) {
      usedNames.add(existingStmt.getAsObject().name);
    }
    existingStmt.free();
    this.db.run("BEGIN TRANSACTION;");
    try {
      for (let i = 0; i < teamsToImport.length; i++) {
        const t = teamsToImport[i];
        let cleanName = (t.team_name || "").trim();
        let cleanCapt = (t.captain_name || "").trim();
        const cleanDiscord = (t.captain_discord_id || "").trim();
        if (!cleanCapt && cleanName) cleanCapt = `${cleanName} Leader`;
        if (!cleanName && cleanCapt) cleanName = `${cleanCapt}'s Squad`;
        if (!cleanName && !cleanCapt) cleanName = `Squad #${i + 1}`;
        if (!cleanCapt) cleanCapt = `Captain #${i + 1}`;
        let finalName = cleanName;
        let disambiguateCounter = 2;
        while (usedNames.has(finalName.toLowerCase())) {
          finalName = `${cleanName} (${disambiguateCounter})`;
          disambiguateCounter++;
        }
        usedNames.add(finalName.toLowerCase());
        let existingId = null;
        let existingStage = "qualifying";
        let existingQual = "pending";
        try {
          const prevTeamStmt = this.db.prepare("SELECT id, current_stage, qualification_status FROM teams WHERE LOWER(team_name) = :name");
          prevTeamStmt.bind({ ":name": finalName.toLowerCase() });
          if (prevTeamStmt.step()) {
            const row = prevTeamStmt.getAsObject();
            existingId = row.id;
            existingStage = row.current_stage || "qualifying";
            existingQual = row.qualification_status || "pending";
          }
          prevTeamStmt.free();
        } catch {
        }
        const teamId = existingId || import_crypto.default.randomUUID();
        this.db.run(
          `INSERT OR REPLACE INTO teams (id, team_name, captain_name, captain_phone, captain_discord_id, status, current_stage, qualification_status, original_data_json, created_at, updated_at)
           VALUES (:id, :name, :capt, :phone, :discord, 'eligible', :stage, :qual, :json, :created, :updated)`,
          {
            ":id": teamId,
            ":name": finalName,
            ":capt": cleanCapt,
            ":phone": t.captain_phone?.trim() || null,
            ":discord": cleanDiscord || null,
            ":stage": existingStage,
            ":qual": existingQual,
            ":json": t.extra_columns ? JSON.stringify(t.extra_columns) : null,
            ":created": now,
            ":updated": now
          }
        );
        inserted++;
        const captPlayerId = import_crypto.default.randomUUID();
        this.db.run(
          `INSERT INTO players (id, team_id, player_name, role, is_captain)
           VALUES (:id, :team_id, :name, 'captain', 1)`,
          {
            ":id": captPlayerId,
            ":team_id": teamId,
            ":name": cleanCapt
          }
        );
        if (t.players && Array.isArray(t.players)) {
          for (const p of t.players) {
            if (!p || !p.name || p.is_captain) continue;
            const pid = import_crypto.default.randomUUID();
            this.db.run(
              `INSERT INTO players (id, team_id, player_name, role, is_captain)
               VALUES (:id, :team_id, :name, :role, 0)`,
              {
                ":id": pid,
                ":team_id": teamId,
                ":name": String(p.name).trim(),
                ":role": p.role || "player"
              }
            );
          }
        }
      }
      this.db.run("COMMIT;");
      this.addAuditLog("IMPORT_EXCEL", `Imported ${inserted} new teams, updated ${updated} existing teams`);
      this.persistToDisk();
      return { inserted, updated };
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  // --- DRAWS & SELECTIONS ---
  getActiveDraw() {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM draws WHERE status = 'in_progress' ORDER BY created_at DESC LIMIT 1");
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }
  getDrawById(id) {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM draws WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }
  getLatestDraw() {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 1");
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      row.selections = this.getDrawSelections(row.id);
      return row;
    }
    stmt.free();
    return null;
  }
  getDrawSelections(drawId) {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT ds.*, t.team_name, t.captain_name, t.captain_discord_id
      FROM draw_selections ds
      JOIN teams t ON ds.team_id = t.id
      WHERE ds.draw_id = :draw_id
      ORDER BY ds.selection_order ASC
    `);
    stmt.bind({ ":draw_id": drawId });
    const selections = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      selections.push({
        id: row.id,
        draw_id: row.draw_id,
        team_id: row.team_id,
        team_name: row.team_name,
        captain_name: row.captain_name,
        captain_discord_id: row.captain_discord_id,
        selection_order: row.selection_order,
        selected_at: row.selected_at,
        notification_status: row.notification_status,
        discord_message_id: row.discord_message_id,
        notification_error: row.notification_error,
        notified_at: row.notified_at
      });
    }
    stmt.free();
    return selections;
  }
  createDraw(targetCount = 12, stage = "qualifying") {
    if (!this.db) throw new Error("Database not initialized");
    const active = this.getActiveDraw();
    if (active) {
      this.cancelDraw(active.id);
    }
    const countRes = this.db.exec("SELECT COUNT(*) as count FROM draws");
    const drawNumber = (countRes[0]?.values[0][0] || 0) + 1;
    const id = import_crypto.default.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      `INSERT INTO draws (id, tournament_id, draw_number, target_count, stage, status, created_at)
       VALUES (:id, 'tournament-main', :draw_num, :target, :stage, 'in_progress', :created)`,
      {
        ":id": id,
        ":draw_num": drawNumber,
        ":target": targetCount,
        ":stage": stage,
        ":created": now
      }
    );
    this.addAuditLog("CREATE_DRAW", `Started Draw #${drawNumber} (${stage}) with target of ${targetCount} teams`);
    this.persistToDisk();
    return {
      id,
      tournament_id: "tournament-main",
      draw_number: drawNumber,
      target_count: targetCount,
      stage,
      status: "in_progress",
      created_at: now,
      selections: []
    };
  }
  recordSelection(drawId, teamId, order) {
    if (!this.db) throw new Error("Database not initialized");
    const id = import_crypto.default.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run("BEGIN TRANSACTION;");
    try {
      this.db.run(
        `INSERT INTO draw_selections (id, draw_id, team_id, selection_order, selected_at, notification_status)
         VALUES (:id, :draw_id, :team_id, :order, :selected_at, 'pending')`,
        {
          ":id": id,
          ":draw_id": drawId,
          ":team_id": teamId,
          ":order": order,
          ":selected_at": now
        }
      );
      this.db.run(
        "UPDATE teams SET status = 'selected', updated_at = :now WHERE id = :team_id",
        { ":now": now, ":team_id": teamId }
      );
      this.db.run("COMMIT;");
      this.persistToDisk();
      const team = this.getTeamById(teamId);
      this.addAuditLog("RECORD_SELECTION", `Draw ${drawId}: Team "${team?.team_name}" selected at #${order}`);
      return {
        id,
        draw_id: drawId,
        team_id: teamId,
        team_name: team?.team_name || "",
        captain_name: team?.captain_name || "",
        captain_discord_id: team?.captain_discord_id || void 0,
        selection_order: order,
        selected_at: now,
        notification_status: "pending"
      };
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  recordSelectionBatch(drawId, teamIds, startingOrder = 1) {
    if (!this.db || !teamIds || teamIds.length === 0) return [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const selections = [];
    this.db.run("BEGIN TRANSACTION;");
    try {
      teamIds.forEach((teamId, idx) => {
        const order = startingOrder + idx;
        const id = `sel_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        this.db?.run(`
          INSERT INTO draw_selections (
            id, draw_id, team_id, selection_order, selected_at, notification_status
          ) VALUES (
            :id, :draw_id, :team_id, :order, :selected_at, 'pending'
          );
        `, {
          ":id": id,
          ":draw_id": drawId,
          ":team_id": teamId,
          ":order": order,
          ":selected_at": now
        });
        this.db?.run(
          "UPDATE teams SET status = 'selected', updated_at = :now WHERE id = :team_id",
          { ":now": now, ":team_id": teamId }
        );
        const team = this.getTeamById(teamId);
        selections.push({
          id,
          draw_id: drawId,
          team_id: teamId,
          team_name: team?.team_name || "",
          captain_name: team?.captain_name || "",
          captain_discord_id: team?.captain_discord_id || void 0,
          selection_order: order,
          selected_at: now,
          notification_status: "pending"
        });
      });
      this.db.run("COMMIT;");
      this.persistToDisk();
      this.addAuditLog("RECORD_SELECTION_BATCH", `Draw ${drawId}: ${selections.length} teams selected in batch`);
      return selections;
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  finalizeDraw(drawId) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      "UPDATE draws SET status = 'finalized', finalized_at = :now WHERE id = :id",
      { ":now": now, ":id": drawId }
    );
    this.addAuditLog("FINALIZE_DRAW", `Finalized draw ${drawId}`);
    this.persistToDisk();
  }
  cancelDraw(drawId) {
    if (!this.db) return;
    this.db.run("BEGIN TRANSACTION;");
    try {
      this.db.run(`
        UPDATE teams 
        SET status = 'eligible' 
        WHERE id IN (SELECT team_id FROM draw_selections WHERE draw_id = :draw_id)
          AND status = 'selected'
      `, { ":draw_id": drawId });
      this.db.run(
        "UPDATE draws SET status = 'cancelled' WHERE id = :draw_id",
        { ":draw_id": drawId }
      );
      this.db.run("COMMIT;");
      this.addAuditLog("CANCEL_DRAW", `Cancelled draw ${drawId} and returned teams to eligible`);
      this.persistToDisk();
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  getDrawHistory() {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM draws WHERE status != 'cancelled' ORDER BY draw_number DESC");
    if (!res || res.length === 0) return [];
    const draws = res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      return obj;
    });
    for (const d of draws) {
      d.selections = this.getDrawSelections(d.id);
    }
    return draws;
  }
  // --- MATCH DETAILS & MATCH PARTICIPATION ---
  getMatches() {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM matches ORDER BY match_number DESC");
    if (!res || res.length === 0) return [];
    return res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      return obj;
    });
  }
  getLatestMatch() {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM matches ORDER BY match_number DESC LIMIT 1");
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
  getMatchById(id) {
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM matches WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
  saveMatchDetails(data) {
    if (!this.db) throw new Error("Database not initialized");
    const id = data.id || import_crypto.default.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const localNow = /* @__PURE__ */ new Date();
    const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
    const defaultLocalTime = localNow.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", hour12: true });
    const finalDate = data.match_date || defaultLocalDate;
    const finalTime = data.match_time || defaultLocalTime;
    const finalStage = data.stage || "qualifying";
    const existing = this.getMatchById(id);
    if (existing) {
      this.db.run(
        `UPDATE matches SET
          room_id = :room_id,
          room_password = :room_password,
          match_date = :match_date,
          match_time = :match_time,
          voice_channel_info = :voice_info,
          additional_instructions = :instr,
          stage = COALESCE(:stage, stage, 'qualifying'),
          admin_notes = :notes
         WHERE id = :id`,
        {
          ":room_id": data.room_id,
          ":room_password": data.room_password,
          ":match_date": finalDate,
          ":match_time": finalTime,
          ":voice_info": data.voice_channel_info,
          ":instr": data.additional_instructions,
          ":stage": finalStage,
          ":notes": data.admin_notes || "",
          ":id": id
        }
      );
      this.addAuditLog("UPDATE_MATCH_DETAILS", `Updated details for Match #${data.match_number} (${finalStage})`);
    } else {
      this.db.run(
        `INSERT INTO matches (id, draw_id, match_number, stage, room_id, room_password, match_date, match_time, voice_channel_info, additional_instructions, room_notification_status, status, admin_notes, created_at)
         VALUES (:id, :draw_id, :match_num, :stage, :room_id, :room_password, :match_date, :match_time, :voice_info, :instr, 'draft', 'scheduled', :notes, :created)`,
        {
          ":id": id,
          ":draw_id": data.draw_id || null,
          ":match_num": data.match_number,
          ":stage": finalStage,
          ":room_id": data.room_id,
          ":room_password": data.room_password,
          ":match_date": finalDate,
          ":match_time": finalTime,
          ":voice_info": data.voice_channel_info,
          ":instr": data.additional_instructions,
          ":notes": data.admin_notes || "",
          ":created": now
        }
      );
      this.addAuditLog("CREATE_MATCH", `Created Match #${data.match_number} (${finalStage})`);
    }
    this.persistToDisk();
    return this.getMatchById(id);
  }
  completeMatch(matchId, participatingTeams, participatingPlayers, adminNotes = "") {
    if (!this.db) throw new Error("Database not initialized");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const localNow = /* @__PURE__ */ new Date();
    const defaultLocalDate = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}`;
    const defaultLocalTime = localNow.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", hour12: true });
    let playedCount = 0;
    let unplayedCount = 0;
    this.db.run("BEGIN TRANSACTION;");
    try {
      this.db.run(
        `UPDATE matches SET status = 'completed', completed_at = :now, match_date = COALESCE(NULLIF(match_date, ''), :localDate), match_time = COALESCE(NULLIF(match_time, ''), :localTime), admin_notes = :notes WHERE id = :id`,
        { ":now": now, ":localDate": defaultLocalDate, ":localTime": defaultLocalTime, ":notes": adminNotes, ":id": matchId }
      );
      this.db.run("DELETE FROM match_team_participation WHERE match_id = :id", { ":id": matchId });
      this.db.run("DELETE FROM match_player_participation WHERE match_id = :id", { ":id": matchId });
      const match = this.getMatchById(matchId);
      const matchStage = match?.stage || "qualifying";
      const matchNumber = match?.match_number || 1;
      const matchDateStr = match?.match_date || defaultLocalDate;
      for (let i = 0; i < participatingTeams.length; i++) {
        const item = participatingTeams[i];
        const partId = import_crypto.default.randomUUID();
        const teamObj = this.getTeamById(item.team_id);
        const tName = teamObj?.team_name || "";
        const cName = teamObj?.captain_name || "";
        const resStr = item.result || (item.actually_played ? "completed" : "forfeit");
        this.db.run(
          `INSERT INTO match_team_participation (id, match_id, team_id, team_name, captain_name, selection_order, actually_played, notes, match_number, stage, result, match_date)
           VALUES (:id, :match_id, :team_id, :team_name, :captain_name, :order, :actually_played, :notes, :match_number, :stage, :result, :match_date)`,
          {
            ":id": partId,
            ":match_id": matchId,
            ":team_id": item.team_id,
            ":team_name": tName,
            ":captain_name": cName,
            ":order": i + 1,
            ":actually_played": item.actually_played ? 1 : 0,
            ":notes": item.notes || "",
            ":match_number": matchNumber,
            ":stage": matchStage,
            ":result": resStr,
            ":match_date": matchDateStr
          }
        );
        if (item.actually_played) {
          playedCount++;
          let qualClause = "";
          const updateParams = { ":now": now, ":team_id": item.team_id };
          if (resStr === "qualified") {
            qualClause = ", qualification_status = 'qualified'";
          } else if (resStr === "eliminated") {
            qualClause = ", qualification_status = 'eliminated'";
          }
          this.db.run(
            `UPDATE teams SET status = 'played', updated_at = :now ${qualClause} WHERE id = :team_id`,
            updateParams
          );
        } else {
          this.db.run(
            "UPDATE teams SET status = 'eligible', updated_at = :now WHERE id = :team_id",
            { ":now": now, ":team_id": item.team_id }
          );
          unplayedCount++;
        }
      }
      for (const p of participatingPlayers) {
        const playerPartId = import_crypto.default.randomUUID();
        this.db.run(
          `INSERT INTO match_player_participation (id, match_id, team_id, player_id, player_name, role, participated)
           VALUES (:id, :match_id, :team_id, :player_id, :name, :role, :participated)`,
          {
            ":id": playerPartId,
            ":match_id": matchId,
            ":team_id": p.team_id,
            ":player_id": p.player_id,
            ":name": p.player_name,
            ":role": p.role,
            ":participated": p.participated ? 1 : 0
          }
        );
      }
      if (match?.draw_id) {
        this.db.run(
          "UPDATE draws SET status = 'finalized', finalized_at = :now WHERE id = :draw_id",
          { ":now": now, ":draw_id": match.draw_id }
        );
      }
      this.db.run("COMMIT;");
      this.addAuditLog("COMPLETE_MATCH", `Match #${match?.match_number} (${matchStage}) completed: ${playedCount} teams played, ${unplayedCount} unplayed. All team records preserved.`);
      this.persistToDisk();
      return { playedCount, unplayedCount };
    } catch (err) {
      this.db.run("ROLLBACK;");
      throw err;
    }
  }
  getMatchTeamParticipation(matchId) {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT mtp.*, 
             COALESCE(NULLIF(mtp.team_name, ''), t.team_name, 'Registered Team') as resolved_team_name,
             COALESCE(NULLIF(mtp.captain_name, ''), t.captain_name, '') as resolved_captain_name
      FROM match_team_participation mtp
      LEFT JOIN teams t ON mtp.team_id = t.id
      WHERE mtp.match_id = :match_id
      ORDER BY mtp.selection_order ASC
    `);
    stmt.bind({ ":match_id": matchId });
    const list = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        id: row.id,
        match_id: row.match_id,
        team_id: row.team_id,
        team_name: row.resolved_team_name,
        captain_name: row.resolved_captain_name,
        selection_order: row.selection_order,
        actually_played: Boolean(row.actually_played),
        match_number: row.match_number,
        stage: row.stage || "qualifying",
        result: row.result || (row.actually_played ? "completed" : "forfeit"),
        match_date: row.match_date,
        notes: row.notes,
        players: this.getMatchPlayerParticipation(matchId, row.team_id)
      });
    }
    stmt.free();
    return list;
  }
  getMatchPlayerParticipation(matchId, teamId) {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT * FROM match_player_participation
      WHERE match_id = :match_id AND team_id = :team_id
      ORDER BY role ASC
    `);
    stmt.bind({ ":match_id": matchId, ":team_id": teamId });
    const list = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        id: row.id,
        match_id: row.match_id,
        team_id: row.team_id,
        player_id: row.player_id,
        player_name: row.player_name,
        role: row.role,
        participated: Boolean(row.participated)
      });
    }
    stmt.free();
    return list;
  }
  deleteMatch(matchId) {
    if (!this.db) return;
    this.db.run("DELETE FROM match_player_participation WHERE match_id = :id", { ":id": matchId });
    this.db.run("DELETE FROM match_team_participation WHERE match_id = :id", { ":id": matchId });
    this.db.run("DELETE FROM matches WHERE id = :id", { ":id": matchId });
    this.addAuditLog("DELETE_MATCH", `Deleted match ${matchId} from history`);
    this.persistToDisk();
  }
  clearAllMatches() {
    if (!this.db) return;
    this.db.run("DELETE FROM match_player_participation");
    this.db.run("DELETE FROM match_team_participation");
    this.db.run("DELETE FROM matches");
    this.addAuditLog("CLEAR_MATCHES", "Cleared all match history");
    this.persistToDisk();
  }
  // --- NOTIFICATION TRACKING ---
  updateSelectionNotificationStatus(selectionId, status, messageId, error) {
    if (!this.db) return;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      `UPDATE draw_selections 
       SET notification_status = :status, discord_message_id = :msg_id, notification_error = :err, notified_at = :now
       WHERE id = :id`,
      {
        ":status": status,
        ":msg_id": messageId || null,
        ":err": error || null,
        ":now": now,
        ":id": selectionId
      }
    );
    this.persistToDisk();
  }
  logNotification(data) {
    if (!this.db) return;
    const id = import_crypto.default.randomUUID();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    this.db.run(
      `INSERT INTO notification_logs (id, type, team_id, captain_discord_id, captain_name, status, message_content, message_id, error_message, timestamp)
       VALUES (:id, :type, :team_id, :discord_id, :capt_name, :status, :content, :msg_id, :err, :ts)`,
      {
        ":id": id,
        ":type": data.type,
        ":team_id": data.team_id,
        ":discord_id": data.captain_discord_id,
        ":capt_name": data.captain_name,
        ":status": data.status,
        ":content": data.message_content,
        ":msg_id": data.message_id || null,
        ":err": data.error_message || null,
        ":ts": timestamp
      }
    );
    this.persistToDisk();
  }
  getNotificationLogs() {
    if (!this.db) return [];
    const res = this.db.exec(`
      SELECT nl.*, t.team_name 
      FROM notification_logs nl 
      LEFT JOIN teams t ON nl.team_id = t.id 
      ORDER BY nl.timestamp DESC LIMIT 100
    `);
    if (!res || res.length === 0) return [];
    return res[0].values.map((row) => {
      const obj = {};
      res[0].columns.forEach((c, idx) => {
        obj[c] = row[idx];
      });
      return obj;
    });
  }
  // --- DASHBOARD STATS ---
  getDashboardStats() {
    if (!this.db) {
      return {
        total_teams: 0,
        eligible_teams: 0,
        played_teams: 0,
        selected_teams: 0,
        remaining_eligible: 0,
        notifications_sent: 0,
        notifications_pending: 0,
        notifications_failed: 0,
        latest_draw: null,
        latest_match: null
      };
    }
    const total = this.db.exec("SELECT COUNT(*) FROM teams")[0]?.values[0][0] || 0;
    const eligible = this.db.exec("SELECT COUNT(*) FROM teams WHERE status = 'eligible'")[0]?.values[0][0] || 0;
    const played = this.db.exec("SELECT COUNT(*) FROM teams WHERE status = 'played'")[0]?.values[0][0] || 0;
    const selected = this.db.exec("SELECT COUNT(*) FROM teams WHERE status IN ('selected', 'playing')")[0]?.values[0][0] || 0;
    const notifLogsSent = this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'sent'")[0]?.values[0][0] || 0;
    const notifDrawsSent = this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'sent'")[0]?.values[0][0] || 0;
    const notifSent = Math.max(notifLogsSent, notifDrawsSent);
    const notifLogsPending = this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'pending'")[0]?.values[0][0] || 0;
    const notifDrawsPending = this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'pending'")[0]?.values[0][0] || 0;
    const notifPending = Math.max(notifLogsPending, notifDrawsPending);
    const notifLogsFailed = this.db.exec("SELECT COUNT(*) FROM notification_logs WHERE status = 'failed'")[0]?.values[0][0] || 0;
    const notifDrawsFailed = this.db.exec("SELECT COUNT(*) FROM draw_selections WHERE notification_status = 'failed'")[0]?.values[0][0] || 0;
    const notifFailed = Math.max(notifLogsFailed, notifDrawsFailed);
    const stageCounts = {
      qualifying: this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'qualifying'")[0]?.values[0][0] || 0,
      quarter_final: this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'quarter_final'")[0]?.values[0][0] || 0,
      semi_final: this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'semi_final'")[0]?.values[0][0] || 0,
      final: this.db.exec("SELECT COUNT(*) FROM teams WHERE current_stage = 'final'")[0]?.values[0][0] || 0
    };
    const qualCount = this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'qualified'")[0]?.values[0][0] || 0;
    const elimCount = this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'eliminated'")[0]?.values[0][0] || 0;
    const pendCount = this.db.exec("SELECT COUNT(*) FROM teams WHERE qualification_status = 'pending'")[0]?.values[0][0] || 0;
    return {
      total_teams: total,
      eligible_teams: eligible,
      played_teams: played,
      selected_teams: selected,
      remaining_eligible: eligible,
      notifications_sent: notifSent,
      notifications_pending: notifPending,
      notifications_failed: notifFailed,
      latest_draw: this.getLatestDraw(),
      latest_match: this.getLatestMatch(),
      stage_counts: stageCounts,
      qualified_count: qualCount,
      eliminated_count: elimCount,
      pending_count: pendCount
    };
  }
  clearUnplayedTeams() {
    if (!this.db) return;
    this.db.run(`
      DELETE FROM players 
      WHERE team_id NOT IN (SELECT DISTINCT team_id FROM match_team_participation);
    `);
    this.db.run(`
      DELETE FROM teams 
      WHERE id NOT IN (SELECT DISTINCT team_id FROM match_team_participation);
    `);
    this.addAuditLog("CLEAR_UNPLAYED_TEAMS", "Cleared unplayed teams while preserving all match participants and history");
    this.persistToDisk();
  }
  clearAllTeams(preservePlayed = true) {
    if (!this.db) return;
    if (preservePlayed) {
      this.clearUnplayedTeams();
    } else {
      this.db.run("DELETE FROM players;");
      this.db.run("DELETE FROM teams;");
      this.db.run("DELETE FROM notification_logs;");
      this.addAuditLog("CLEAR_TEAMS", "Cleared all teams and players");
      this.persistToDisk();
    }
  }
  // --- BACKUP & RESTORE ---
  backupDatabase(destinationPath) {
    if (!this.db) throw new Error("Database not initialized");
    const data = this.db.export();
    const buffer = Buffer.from(data);
    import_fs.default.writeFileSync(destinationPath, buffer);
    this.addAuditLog("BACKUP_DATABASE", `Database backed up to ${destinationPath}`);
  }
  async restoreDatabase(sourcePath) {
    if (!import_fs.default.existsSync(sourcePath)) throw new Error("Source backup file does not exist");
    const fileBuffer = import_fs.default.readFileSync(sourcePath);
    const SQL = await (0, import_sql.default)({
      locateFile: () => import_path.default.join(__dirname, "sql-wasm.wasm")
    });
    const restoredDb = new SQL.Database(fileBuffer);
    this.db = restoredDb;
    this.persistToDisk();
    this.addAuditLog("RESTORE_DATABASE", `Database restored from ${sourcePath}`);
  }
};

// electron/excelService.ts
var XLSX = __toESM(require("xlsx"));
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var ExcelService = class {
  /**
   * Common header aliases mapping to standardized internal fields
   */
  static headerMap = {
    team_name: [
      "team name",
      "team",
      "team_name",
      "squad name",
      "squad",
      "teamname",
      "squad_name"
    ],
    captain_name: [
      "captain name",
      "captain",
      "leader",
      "captain_name",
      "leader name",
      "leader_name",
      "igl"
    ],
    captain_phone: [
      "captain phone number",
      "captain phone",
      "phone number",
      "phone",
      "mobile number",
      "mobile",
      "contact",
      "whatsapp",
      "captain mobile",
      "captain_phone"
    ],
    captain_discord_id: [
      "captain discord user id",
      "captain discord id",
      "discord user id",
      "discord id",
      "discord uid",
      "captain discord",
      "discord_id",
      "discord_user_id",
      "discord",
      "discord username",
      "captain discord username",
      "discord tag",
      "discord handle",
      "discord name",
      "discord_username",
      "username",
      "captain discord name"
    ],
    player2_name: [
      "player 2 name",
      "player 2",
      "player2",
      "player_2",
      "player2 name",
      "member 2",
      "member2"
    ],
    player3_name: [
      "player 3 name",
      "player 3",
      "player3",
      "player_3",
      "player3 name",
      "member 3",
      "member3"
    ],
    player4_name: [
      "player 4 name",
      "player 4",
      "player4",
      "player_4",
      "player4 name",
      "member 4",
      "member4"
    ],
    substitute_name: [
      "substitute player name",
      "substitute name",
      "substitute",
      "sub player",
      "sub",
      "player 5",
      "player 5 name",
      "substitute_name",
      "sub_player"
    ]
  };
  /**
   * Matches a raw header string to a standardized field name
   */
  static matchHeader(rawHeader) {
    if (!rawHeader) return null;
    const normalized = rawHeader.toLowerCase().trim().replace(/[\-_/\\()]/g, " ").replace(/\s+/g, " ");
    for (const [field, aliases] of Object.entries(this.headerMap)) {
      if (aliases.includes(normalized)) {
        return field;
      }
    }
    if (normalized.includes("discord")) {
      return "captain_discord_id";
    }
    if (normalized.includes("team") || normalized.includes("squad")) {
      return "team_name";
    }
    if (normalized.includes("captain") || normalized.includes("leader") || normalized.includes("igl")) {
      if (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("whatsapp") || normalized.includes("contact")) {
        return "captain_phone";
      }
      return "captain_name";
    }
    if (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("whatsapp")) {
      return "captain_phone";
    }
    return null;
  }
  /**
   * Parses an Excel buffer or file path into a preview structure with validation
   */
  static parseExcelBuffer(buffer, existingTeams = []) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel workbook contains no sheets");
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) {
      throw new Error("Excel sheet is empty");
    }
    let headerRowIndex = 0;
    let columnIndexToField = {};
    const detectedHeaders = {};
    const extraColumnIndices = {};
    for (let r = 0; r < Math.min(rawData.length, 5); r++) {
      const candidateHeaders = (rawData[r] || []).map((h) => String(h || "").trim());
      const candidateMap = {};
      candidateHeaders.forEach((header, idx) => {
        if (!header) return;
        const matched = this.matchHeader(header);
        if (matched) {
          candidateMap[idx] = matched;
          detectedHeaders[header] = matched;
        }
      });
      if (Object.keys(candidateMap).length >= 1) {
        headerRowIndex = r;
        columnIndexToField = candidateMap;
        candidateHeaders.forEach((header, idx) => {
          if (header && !candidateMap[idx]) {
            extraColumnIndices[idx] = header;
          }
        });
        break;
      }
    }
    if (Object.keys(columnIndexToField).length === 0) {
      columnIndexToField[0] = "team_name";
      columnIndexToField[1] = "captain_name";
      columnIndexToField[2] = "captain_discord_id";
      headerRowIndex = -1;
    }
    const existingTeamNamesSet = new Set(existingTeams.map((t) => t.team_name.toLowerCase().trim()));
    const seenNamesInFile = /* @__PURE__ */ new Set();
    const rows = [];
    let validCount = 0;
    let duplicateCount = 0;
    const startRow = headerRowIndex + 1;
    for (let r = startRow; r < rawData.length; r++) {
      const rowArr = rawData[r];
      if (!rowArr || rowArr.length === 0 || rowArr.every((cell) => cell === void 0 || cell === null || String(cell).trim() === "")) {
        continue;
      }
      const rowObj = {
        rowIndex: r + 1,
        team_name: "",
        captain_name: "",
        captain_phone: "",
        captain_discord_id: "",
        extra_columns: {},
        validationErrors: [],
        isValid: true,
        isDuplicateInFile: false,
        isDuplicateInDb: false
      };
      Object.entries(columnIndexToField).forEach(([idxStr, field]) => {
        const idx = parseInt(idxStr, 10);
        const val = rowArr[idx] !== void 0 && rowArr[idx] !== null ? String(rowArr[idx]).trim() : "";
        rowObj[field] = val;
      });
      Object.entries(extraColumnIndices).forEach(([idxStr, colName]) => {
        const idx = parseInt(idxStr, 10);
        const val = rowArr[idx] !== void 0 && rowArr[idx] !== null ? String(rowArr[idx]).trim() : "";
        if (val) {
          rowObj.extra_columns[colName] = val;
        }
      });
      if (!rowObj.captain_discord_id && rowObj.extra_columns) {
        for (const [colName, val] of Object.entries(rowObj.extra_columns)) {
          if (colName.toLowerCase().includes("discord") && val) {
            rowObj.captain_discord_id = String(val).trim();
            break;
          }
        }
      }
      if (!rowObj.captain_discord_id) {
        rowArr.forEach((cellVal) => {
          let str = "";
          if (typeof cellVal === "number" && cellVal > 1e16) {
            str = BigInt(Math.round(cellVal)).toString();
          } else {
            str = String(cellVal || "").trim();
          }
          if (str.startsWith("@") || /^\d{17,20}$/.test(str) || /^.+#[0-9]{4}$/.test(str)) {
            rowObj.captain_discord_id = str;
          }
        });
      }
      let cleanCapt = (rowObj.captain_name || "").trim();
      let cleanTeam = (rowObj.team_name || "").trim();
      const cleanDiscord = (rowObj.captain_discord_id || "").trim();
      if (!cleanTeam && !cleanCapt && !cleanDiscord) {
        continue;
      }
      if (!cleanCapt && cleanTeam) cleanCapt = `${cleanTeam} Leader`;
      if (!cleanTeam && cleanCapt) cleanTeam = `${cleanCapt}'s Squad`;
      if (!cleanTeam && !cleanCapt && cleanDiscord) {
        cleanTeam = `Squad ${cleanDiscord}`;
        cleanCapt = `Captain ${cleanDiscord}`;
      }
      rowObj.team_name = cleanTeam;
      rowObj.captain_name = cleanCapt;
      if (rowObj.captain_discord_id) {
        let idStr = String(rowObj.captain_discord_id).trim();
        if (/^\d+(\.\d+)?e\+\d+$/i.test(idStr)) {
          try {
            idStr = BigInt(Math.round(Number(idStr))).toString();
          } catch {
          }
        }
        if (idStr.startsWith("@")) {
          idStr = idStr.slice(1).trim();
        }
        rowObj.captain_discord_id = idStr;
      }
      const normalizedTeamName = (rowObj.team_name || "").toLowerCase().trim();
      if (seenNamesInFile.has(normalizedTeamName)) {
        rowObj.isDuplicateInFile = true;
        duplicateCount++;
      } else {
        seenNamesInFile.add(normalizedTeamName);
      }
      if (existingTeamNamesSet.has(normalizedTeamName)) {
        rowObj.isDuplicateInDb = true;
      }
      rowObj.isValid = true;
      validCount++;
      rows.push(rowObj);
    }
    return {
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: 0,
      duplicateRows: duplicateCount,
      detectedHeaders,
      rows
    };
  }
  /**
   * Generates a 5-sheet updated Excel workbook after a match or for export
   */
  static generateTournamentWorkbook(db2, activeDraw) {
    const allTeams = db2.getAllTeams();
    const eligibleTeams = db2.getEligibleTeams();
    const playedTeams = db2.getPlayedTeams();
    const matches = db2.getMatches();
    const latestDraw = activeDraw || db2.getLatestDraw();
    const workbook = XLSX.utils.book_new();
    const allTeamsRows = allTeams.map((t) => {
      const players = t.players || [];
      const capt = players.find((p) => p.is_captain || p.role === "captain")?.player_name || t.captain_name;
      const p2 = players.find((p) => p.role === "player2")?.player_name || "";
      const p3 = players.find((p) => p.role === "player3")?.player_name || "";
      const p4 = players.find((p) => p.role === "player4")?.player_name || "";
      const sub = players.find((p) => p.role === "substitute")?.player_name || "";
      const baseRow = {
        "Team ID": t.id,
        "Team Name": t.team_name,
        "Captain Name": capt,
        "Captain Phone Number": t.captain_phone || "",
        "Captain Discord User ID": t.captain_discord_id || "",
        "Tournament Stage": (t.current_stage || "qualifying").toUpperCase(),
        "Qualification Status": (t.qualification_status || "pending").toUpperCase(),
        "Participation Status": t.status.toUpperCase(),
        "Matches Played": t.matches_played_count || 0,
        "Last Match Result": t.last_match_result || "N/A",
        "Player 2 Name": p2,
        "Player 3 Name": p3,
        "Player 4 Name": p4,
        "Substitute Player Name": sub,
        "Registration Date": t.created_at
      };
      if (t.extra_columns) {
        Object.entries(t.extra_columns).forEach(([k, v]) => {
          baseRow[k] = v;
        });
      }
      return baseRow;
    });
    const sheet1 = XLSX.utils.json_to_sheet(allTeamsRows.length > 0 ? allTeamsRows : [
      { "Team ID": "", "Team Name": "No teams found", "Captain Name": "", "Participation Status": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet1, "All Teams");
    const eligibleTeamsRows = eligibleTeams.map((t) => {
      const players = t.players || [];
      const capt = players.find((p) => p.is_captain || p.role === "captain")?.player_name || t.captain_name;
      const p2 = players.find((p) => p.role === "player2")?.player_name || "";
      const p3 = players.find((p) => p.role === "player3")?.player_name || "";
      const p4 = players.find((p) => p.role === "player4")?.player_name || "";
      const sub = players.find((p) => p.role === "substitute")?.player_name || "";
      return {
        "Team ID": t.id,
        "Team Name": t.team_name,
        "Captain Name": capt,
        "Captain Discord User ID": t.captain_discord_id || "",
        "Tournament Stage": (t.current_stage || "qualifying").toUpperCase(),
        "Qualification Status": (t.qualification_status || "pending").toUpperCase(),
        "Player 2 Name": p2,
        "Player 3 Name": p3,
        "Player 4 Name": p4,
        "Substitute Player Name": sub,
        "Status": "ELIGIBLE FOR NEXT DRAW"
      };
    });
    const sheet2 = XLSX.utils.json_to_sheet(eligibleTeamsRows.length > 0 ? eligibleTeamsRows : [
      { "Team ID": "", "Team Name": "No eligible teams available", "Captain Name": "", "Status": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet2, "Eligible Teams");
    const qualifiedTeams = allTeams.filter((t) => t.qualification_status === "qualified");
    const qualifiedTeamsRows = qualifiedTeams.map((t) => ({
      "Team ID": t.id,
      "Team Name": t.team_name,
      "Captain Name": t.captain_name,
      "Captain Discord ID": t.captain_discord_id || "",
      "Current Stage": (t.current_stage || "qualifying").toUpperCase(),
      "Matches Played": t.matches_played_count || 0,
      "Last Result": t.last_match_result || "QUALIFIED",
      "Status": "QUALIFIED"
    }));
    const sheet3 = XLSX.utils.json_to_sheet(qualifiedTeamsRows.length > 0 ? qualifiedTeamsRows : [
      { "Team ID": "", "Team Name": "No qualified teams yet", "Captain Name": "", "Status": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet3, "Qualified Teams");
    const eliminatedTeams = allTeams.filter((t) => t.qualification_status === "eliminated");
    const eliminatedTeamsRows = eliminatedTeams.map((t) => ({
      "Team ID": t.id,
      "Team Name": t.team_name,
      "Captain Name": t.captain_name,
      "Eliminated At Stage": (t.current_stage || "qualifying").toUpperCase(),
      "Matches Played": t.matches_played_count || 0,
      "Last Result": t.last_match_result || "ELIMINATED",
      "Status": "ELIMINATED"
    }));
    const sheet4 = XLSX.utils.json_to_sheet(eliminatedTeamsRows.length > 0 ? eliminatedTeamsRows : [
      { "Team ID": "", "Team Name": "No eliminated teams", "Captain Name": "", "Status": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet4, "Eliminated Teams");
    const matchHistoryRows = [];
    for (const m of matches) {
      const teamParticipation = db2.getMatchTeamParticipation(m.id);
      for (const tp of teamParticipation) {
        const playerParts = tp.players || [];
        const participatedPlayersStr = playerParts.filter((p) => p.participated).map((p) => `${p.player_name} (${p.role})`).join(", ");
        matchHistoryRows.push({
          "Match Number": m.match_number,
          "Tournament Stage": (m.stage || tp.stage || "qualifying").toUpperCase(),
          "Draw ID": m.draw_id || "N/A",
          "Team Name": tp.team_name || "",
          "Captain Name": tp.captain_name || "",
          "Selection Order": tp.selection_order || "N/A",
          "Actually Played": tp.actually_played ? "YES" : "NO (FORFEIT/NO-SHOW)",
          "Match Result": (tp.result || (tp.actually_played ? "COMPLETED" : "FORFEIT")).toUpperCase(),
          "Player Participation Info": participatedPlayersStr || "Full Roster",
          "Match Date": m.match_date || "",
          "Match Time": m.match_time || "",
          "Room ID": m.room_id || "",
          "Admin Notes": m.admin_notes || tp.notes || ""
        });
      }
    }
    const sheet5 = XLSX.utils.json_to_sheet(matchHistoryRows.length > 0 ? matchHistoryRows : [
      { "Match Number": "", "Tournament Stage": "", "Team Name": "No match history recorded", "Captain Name": "", "Actually Played": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet5, "Match History");
    const selectedRows = [];
    if (latestDraw && latestDraw.selections) {
      for (const s of latestDraw.selections) {
        selectedRows.push({
          "Draw Number": latestDraw.draw_number,
          "Stage": (latestDraw.stage || "qualifying").toUpperCase(),
          "Selection Order": s.selection_order,
          "Team Name": s.team_name,
          "Captain Name": s.captain_name,
          "Captain Discord ID": s.captain_discord_id || "",
          "Selection Time": s.selected_at,
          "Notification Status": s.notification_status.toUpperCase(),
          "Discord Message ID": s.discord_message_id || "",
          "Notification Error": s.notification_error || ""
        });
      }
    }
    const sheet6 = XLSX.utils.json_to_sheet(selectedRows.length > 0 ? selectedRows : [
      { "Draw Number": "", "Selection Order": "", "Team Name": "No draw selections active", "Captain Name": "", "Notification Status": "" }
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet6, "Selected Teams");
    const outBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return outBuffer;
  }
  /**
   * Generates a sample registration template with 24 realistic teams
   */
  static generateSampleRegistrationTemplate() {
    const sampleTeams = [
      {
        "Team Name": "Total Gaming Esports",
        "Captain Name": "Ajay Sharma",
        "Captain Phone Number": "+91 98765 43210",
        "Captain Discord User ID": "108273645192837465",
        "Player 2 Name": "Prince Gupta",
        "Player 3 Name": "Vicky Singh",
        "Player 4 Name": "Rohit Verma",
        "Substitute Player Name": "Kunal Yadav",
        "Coach Name": "Coach Vikram",
        "Free Fire Guild UID": "FF-GUILD-101"
      },
      {
        "Team Name": "Team Elite Free Fire",
        "Captain Name": "Pahadi Gaming",
        "Captain Phone Number": "+91 98123 45678",
        "Captain Discord User ID": "109283746510293847",
        "Player 2 Name": "Jonty Gaming",
        "Player 3 Name": "Killer FF",
        "Player 4 Name": "Iconic Pro",
        "Substitute Player Name": "Tirth V",
        "Coach Name": "Coach Rakesh",
        "Free Fire Guild UID": "FF-GUILD-102"
      },
      {
        "Team Name": "TSM Entity India",
        "Captain Name": "Neyoo Sen",
        "Captain Phone Number": "+91 98711 22334",
        "Captain Discord User ID": "110293847561029384",
        "Player 2 Name": "Jonathan Amar",
        "Player 3 Name": "ClutchGod",
        "Player 4 Name": "Zgod OP",
        "Substitute Player Name": "Ghatak Sir",
        "Coach Name": "Coach Aman",
        "Free Fire Guild UID": "FF-GUILD-103"
      },
      {
        "Team Name": "GodLike Esports",
        "Captain Name": "Kronten Boss",
        "Captain Phone Number": "+91 98222 33445",
        "Captain Discord User ID": "111293847561029385",
        "Player 2 Name": "Shadow FF",
        "Player 3 Name": "Spower Ace",
        "Player 4 Name": "Gill Gaming",
        "Substitute Player Name": "Manya OP",
        "Coach Name": "Coach Suraj",
        "Free Fire Guild UID": "FF-GUILD-104"
      },
      {
        "Team Name": "Blind Esports",
        "Captain Name": "Mamba Ray",
        "Captain Phone Number": "+91 98333 44556",
        "Captain Discord User ID": "112293847561029386",
        "Player 2 Name": "Nakul Fire",
        "Player 3 Name": "Rony Beast",
        "Player 4 Name": "Harsh Sniper",
        "Substitute Player Name": "Rishi Sub",
        "Coach Name": "Coach Nikhil",
        "Free Fire Guild UID": "FF-GUILD-105"
      },
      {
        "Team Name": "Orangutan Elite",
        "Captain Name": "Wizz Gaming",
        "Captain Phone Number": "+91 98444 55667",
        "Captain Discord User ID": "113293847561029387",
        "Player 2 Name": "Draco FF",
        "Player 3 Name": "Sensei Rush",
        "Player 4 Name": "Blaze OP",
        "Substitute Player Name": "Venom Sub",
        "Coach Name": "Coach Karan",
        "Free Fire Guild UID": "FF-GUILD-106"
      },
      {
        "Team Name": "Hyderabad Hydras",
        "Captain Name": "Viper Fire",
        "Captain Phone Number": "+91 98555 66778",
        "Captain Discord User ID": "114293847561029388",
        "Player 2 Name": "Hydra Ace",
        "Player 3 Name": "Rex Nitro",
        "Player 4 Name": "Ghost Sniper",
        "Substitute Player Name": "Phantom X",
        "Coach Name": "Coach Dev",
        "Free Fire Guild UID": "FF-GUILD-107"
      },
      {
        "Team Name": "Revenant Esports",
        "Captain Name": "Paradox King",
        "Captain Phone Number": "+91 98666 77889",
        "Captain Discord User ID": "115293847561029389",
        "Player 2 Name": "Kyro Rush",
        "Player 3 Name": "Spark Fire",
        "Player 4 Name": "Titan OP",
        "Substitute Player Name": "Alpha Sub",
        "Coach Name": "Coach Sameer",
        "Free Fire Guild UID": "FF-GUILD-108"
      },
      {
        "Team Name": "Enigma Gaming",
        "Captain Name": "Rawknee OP",
        "Captain Phone Number": "+91 98777 88990",
        "Captain Discord User ID": "116293847561029390",
        "Player 2 Name": "Insane God",
        "Player 3 Name": "Bullet Rush",
        "Player 4 Name": "Storm Eye",
        "Substitute Player Name": "Frost Bit",
        "Coach Name": "Coach Rajiv",
        "Free Fire Guild UID": "FF-GUILD-109"
      },
      {
        "Team Name": "Chemin Esports",
        "Captain Name": "Radhe Gaming",
        "Captain Phone Number": "+91 98888 99001",
        "Captain Discord User ID": "117293847561029391",
        "Player 2 Name": "Swag Ace",
        "Player 3 Name": "Thunder Fox",
        "Player 4 Name": "Nova Striker",
        "Substitute Player Name": "Zeus Sub",
        "Coach Name": "Coach Amit",
        "Free Fire Guild UID": "FF-GUILD-110"
      },
      {
        "Team Name": "Nigma Galaxy India",
        "Captain Name": "Vortex Chief",
        "Captain Phone Number": "+91 98999 00112",
        "Captain Discord User ID": "118293847561029392",
        "Player 2 Name": "Aero Blast",
        "Player 3 Name": "Falcon Sky",
        "Player 4 Name": "Cobra Strike",
        "Substitute Player Name": "Raven Sub",
        "Coach Name": "Coach Kabir",
        "Free Fire Guild UID": "FF-GUILD-111"
      },
      {
        "Team Name": "Global Esports FF",
        "Captain Name": "Skylord Legend",
        "Captain Phone Number": "+91 97111 22334",
        "Captain Discord User ID": "119293847561029393",
        "Player 2 Name": "Eagle Eye",
        "Player 3 Name": "Sniper God",
        "Player 4 Name": "Flash Rush",
        "Substitute Player Name": "Ranger Sub",
        "Coach Name": "Coach Arvind",
        "Free Fire Guild UID": "FF-GUILD-112"
      },
      {
        "Team Name": "7Sea Esports",
        "Captain Name": "Poseidon FF",
        "Captain Phone Number": "+91 97222 33445",
        "Captain Discord User ID": "120293847561029394",
        "Player 2 Name": "Ocean Tide",
        "Player 3 Name": "Deep Sea",
        "Player 4 Name": "Shark Attack",
        "Substitute Player Name": "Wave Sub",
        "Coach Name": "Coach Sagar",
        "Free Fire Guild UID": "FF-GUILD-113"
      },
      {
        "Team Name": "Skylightz Gaming",
        "Captain Name": "Zenith Pro",
        "Captain Phone Number": "+91 97333 44556",
        "Captain Discord User ID": "121293847561029395",
        "Player 2 Name": "Cosmo Ace",
        "Player 3 Name": "Starlight FF",
        "Player 4 Name": "Solar Flare",
        "Substitute Player Name": "Lunar Sub",
        "Coach Name": "Coach Tarun",
        "Free Fire Guild UID": "FF-GUILD-114"
      },
      {
        "Team Name": "Marcos Gaming",
        "Captain Name": "Commando Max",
        "Captain Phone Number": "+91 97444 55667",
        "Captain Discord User ID": "122293847561029396",
        "Player 2 Name": "Bravo Force",
        "Player 3 Name": "Delta Recon",
        "Player 4 Name": "Echo Sniper",
        "Substitute Player Name": "Tango Sub",
        "Coach Name": "Coach Mohan",
        "Free Fire Guild UID": "FF-GUILD-115"
      },
      {
        "Team Name": "Insane Esports",
        "Captain Name": "Maniac Rush",
        "Captain Phone Number": "+91 97555 66778",
        "Captain Discord User ID": "123293847561029397",
        "Player 2 Name": "Psycho Ace",
        "Player 3 Name": "Chaos Maker",
        "Player 4 Name": "Frenzy Fire",
        "Substitute Player Name": "Havoc Sub",
        "Coach Name": "Coach Pradeep",
        "Free Fire Guild UID": "FF-GUILD-116"
      },
      {
        "Team Name": "Entity Gaming FF",
        "Captain Name": "Captain Razor",
        "Captain Phone Number": "+91 97666 77889",
        "Captain Discord User ID": "124293847561029398",
        "Player 2 Name": "Blade Runner",
        "Player 3 Name": "Sharp Edge",
        "Player 4 Name": "Steel Heart",
        "Substitute Player Name": "Dagger Sub",
        "Coach Name": "Coach Sunil",
        "Free Fire Guild UID": "FF-GUILD-117"
      },
      {
        "Team Name": "Galaxy Racers India",
        "Captain Name": "Nitro Turbo",
        "Captain Phone Number": "+91 97777 88990",
        "Captain Discord User ID": "125293847561029399",
        "Player 2 Name": "Speed Demon",
        "Player 3 Name": "Overdrive FF",
        "Player 4 Name": "Apex Drift",
        "Substitute Player Name": "Ignition Sub",
        "Coach Name": "Coach Chetan",
        "Free Fire Guild UID": "FF-GUILD-118"
      },
      {
        "Team Name": "Velocity Gaming",
        "Captain Name": "Mach Rush",
        "Captain Phone Number": "+91 97888 99001",
        "Captain Discord User ID": "126293847561029400",
        "Player 2 Name": "Sonic Boom",
        "Player 3 Name": "Hyper Beam",
        "Player 4 Name": "Quantum Leap",
        "Substitute Player Name": "Warp Sub",
        "Coach Name": "Coach Varun",
        "Free Fire Guild UID": "FF-GUILD-119"
      },
      {
        "Team Name": "True Rippers Esports",
        "Captain Name": "Ripper King",
        "Captain Phone Number": "+91 97999 00112",
        "Captain Discord User ID": "127293847561029401",
        "Player 2 Name": "Savage Beast",
        "Player 3 Name": "Predator FF",
        "Player 4 Name": "Apex Hunter",
        "Substitute Player Name": "Carnage Sub",
        "Coach Name": "Coach Deepak",
        "Free Fire Guild UID": "FF-GUILD-120"
      },
      {
        "Team Name": "Force One Esports",
        "Captain Name": "Major General",
        "Captain Phone Number": "+91 96111 22334",
        "Captain Discord User ID": "128293847561029402",
        "Player 2 Name": "Colonel Strike",
        "Player 3 Name": "Captain Fury",
        "Player 4 Name": "Lieutenant Gun",
        "Substitute Player Name": "Sergeant Sub",
        "Coach Name": "Coach Ramesh",
        "Free Fire Guild UID": "FF-GUILD-121"
      },
      {
        "Team Name": "Gods Reign FF",
        "Captain Name": "Ares War",
        "Captain Phone Number": "+91 96222 33445",
        "Captain Discord User ID": "129293847561029403",
        "Player 2 Name": "Hades Realm",
        "Player 3 Name": "Apollo Light",
        "Player 4 Name": "Hermes Swift",
        "Substitute Player Name": "Atlas Sub",
        "Coach Name": "Coach Shashi",
        "Free Fire Guild UID": "FF-GUILD-122"
      },
      {
        "Team Name": "Team Mayhem FF",
        "Captain Name": "Disaster Lord",
        "Captain Phone Number": "+91 96333 44556",
        "Captain Discord User ID": "130293847561029404",
        "Player 2 Name": "Calamity Jane",
        "Player 3 Name": "Cataclysm OP",
        "Player 4 Name": "Rupture Rush",
        "Substitute Player Name": "Quake Sub",
        "Coach Name": "Coach Hemant",
        "Free Fire Guild UID": "FF-GUILD-123"
      },
      {
        "Team Name": "Dragon Claw Esports",
        "Captain Name": "Drake Flame",
        "Captain Phone Number": "+91 96444 55667",
        "Captain Discord User ID": "131293847561029405",
        "Player 2 Name": "Wyvern Wing",
        "Player 3 Name": "Scales Armor",
        "Player 4 Name": "Inferno Breath",
        "Substitute Player Name": "Ember Sub",
        "Coach Name": "Coach Bharat",
        "Free Fire Guild UID": "FF-GUILD-124"
      }
    ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleTeams);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Registrations");
    return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  }
  /**
   * Safely writes a buffer to a target path using atomic temporary write
   */
  static safeSaveFile(destinationPath, buffer) {
    const dir = import_path2.default.dirname(destinationPath);
    if (!import_fs2.default.existsSync(dir)) {
      import_fs2.default.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${destinationPath}.tmp_${Date.now()}`;
    import_fs2.default.writeFileSync(tempPath, buffer);
    import_fs2.default.renameSync(tempPath, destinationPath);
  }
};

// electron/discordService.ts
var import_discord = require("discord.js");
var DiscordService = class _DiscordService {
  constructor(db2) {
    this.db = db2;
  }
  db;
  client = null;
  isConnecting = false;
  currentToken = "";
  /**
   * Initializes or re-initializes Discord bot client with given token
   */
  async initializeClient(token) {
    const botToken = token || (this.db ? this.db.getSetting("discord_bot_token") : this.currentToken);
    if (!botToken || botToken.trim() === "") {
      return { success: false, error: "No Discord bot token configured." };
    }
    if (this.client && this.client.isReady() && this.currentToken === botToken.trim()) {
      return {
        success: true,
        botTag: this.client.user?.tag,
        botId: this.client.user?.id
      };
    }
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
      }
      this.client = null;
    }
    try {
      this.isConnecting = true;
      const connectWithIntents = (intents) => {
        return new Promise((resolve, reject) => {
          const testClient = new import_discord.Client({
            intents,
            partials: [import_discord.Partials.Channel, import_discord.Partials.Message, import_discord.Partials.User]
          });
          const timeout = setTimeout(() => {
            testClient.destroy().catch(() => {
            });
            reject(new Error("Connection timed out after 15 seconds. Please check your token or internet connection."));
          }, 15e3);
          testClient.once(import_discord.Events.ClientReady, () => {
            clearTimeout(timeout);
            resolve(testClient);
          });
          testClient.once("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
          testClient.login(botToken.trim()).catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      };
      let activeClient;
      try {
        activeClient = await connectWithIntents([
          import_discord.GatewayIntentBits.Guilds,
          import_discord.GatewayIntentBits.GuildMembers,
          import_discord.GatewayIntentBits.DirectMessages
        ]);
      } catch (err) {
        const isPrivilegedIntentError = err?.message?.includes("DisAllowedIntents") || err?.message?.includes("Privileged intent") || err?.code === "DisAllowedIntents" || err?.code === 4014;
        if (isPrivilegedIntentError) {
          console.warn("[DiscordService] Server Members Intent not enabled in Discord Developer Portal. Falling back to basic intents...");
          activeClient = await connectWithIntents([
            import_discord.GatewayIntentBits.Guilds,
            import_discord.GatewayIntentBits.DirectMessages
          ]);
        } else {
          throw err;
        }
      }
      this.client = activeClient;
      this.currentToken = botToken.trim();
      this.isConnecting = false;
      return {
        success: true,
        botTag: activeClient.user?.tag,
        botId: activeClient.user?.id
      };
    } catch (err) {
      this.isConnecting = false;
      this.client = null;
      return {
        success: false,
        error: err.message || "Failed to authenticate with Discord API"
      };
    }
  }
  /**
   * Checks current connection status
   */
  getStatus() {
    if (this.client && this.client.isReady()) {
      return {
        isReady: true,
        botTag: this.client.user?.tag,
        botId: this.client.user?.id
      };
    }
    return { isReady: false };
  }
  /**
   * Formats the official Selection DM template (Never includes Room ID or Room Password)
   */
  static formatSelectionMessage(captainName, teamName, customTemplate) {
    if (customTemplate && customTemplate.trim()) {
      return customTemplate.replace(/\{captain_name\}/gi, captainName).replace(/\{team_name\}/gi, teamName);
    }
    return `\u{1F389} Congratulations ${captainName}!

Your team, ${teamName}, has been selected for today's tournament match.

Please stay ready and keep an eye on your Discord messages for room details.

Good luck! \u{1F525}`;
  }
  /**
   * Formats the official Match Details & Room Password DM template
   */
  static formatRoomMessage(captainName, teamName, roomId, roomPassword, matchTime, additionalInstructions, customTemplate) {
    if (customTemplate && customTemplate.trim()) {
      return customTemplate.replace(/\{captain_name\}/gi, captainName).replace(/\{team_name\}/gi, teamName).replace(/\{room_id\}/gi, roomId).replace(/\{room_password\}/gi, roomPassword).replace(/\{match_time\}/gi, matchTime).replace(/\{instructions\}/gi, additionalInstructions || "");
    }
    let msg = `\u{1F3AE} **Match Room Details**
Team: **${teamName}**
Room ID: **${roomId}**
Password: **${roomPassword}**`;
    if (additionalInstructions && additionalInstructions.trim()) {
      msg += `
Instructions: ${additionalInstructions.trim()}`;
    }
    return msg;
  }
  /**
   * Resolves a Discord user by numerical Snowflake ID, Mention, or Username/Tag/Nickname across mutual servers
   */
  async resolveUser(identifier) {
    if (!this.client || !identifier || !identifier.trim()) return null;
    let clean = identifier.trim();
    const mentionMatch = clean.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      clean = mentionMatch[1];
    }
    if (clean.startsWith("@")) clean = clean.slice(1).trim();
    if (/^\d{17,20}$/.test(clean)) {
      try {
        const fetched = await this.client.users.fetch(clean);
        if (fetched) return fetched;
      } catch {
      }
    }
    const lowerClean = clean.toLowerCase();
    const [namePart] = lowerClean.split("#");
    const cached = this.client.users.cache.find(
      (u) => u.username.toLowerCase() === lowerClean || u.tag.toLowerCase() === lowerClean || u.username.toLowerCase() === namePart || u.globalName && u.globalName.toLowerCase() === lowerClean
    );
    if (cached) return cached;
    for (const guild of this.client.guilds.cache.values()) {
      try {
        const members = await guild.members.fetch({ query: clean, limit: 25 });
        const match = members.find(
          (m) => m.user.username.toLowerCase() === lowerClean || m.user.tag.toLowerCase() === lowerClean || m.user.username.toLowerCase() === namePart || m.displayName.toLowerCase() === lowerClean || m.nickname && m.nickname.toLowerCase() === lowerClean || m.user.globalName && m.user.globalName.toLowerCase() === lowerClean
        );
        if (match) return match.user;
      } catch {
      }
      try {
        if (guild.memberCount <= 1e3 && guild.members.cache.size < guild.memberCount) {
          await guild.members.fetch().catch(() => {
          });
        }
        const cachedMatch = guild.members.cache.find(
          (m) => m.user.username.toLowerCase() === lowerClean || m.user.tag.toLowerCase() === lowerClean || m.user.username.toLowerCase() === namePart || m.displayName.toLowerCase() === lowerClean || m.nickname && m.nickname.toLowerCase() === lowerClean || m.user.globalName && m.user.globalName.toLowerCase() === lowerClean || m.user.username.toLowerCase().includes(namePart)
        );
        if (cachedMatch) return cachedMatch.user;
      } catch {
      }
    }
    return null;
  }
  /**
   * Sends a selection congratulations DM to a captain (Never includes room ID or password)
   */
  async sendSelectionDM(selectionId, captainDiscordId, captainName, teamName, teamId, forceRetry = false, customTemplate) {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID/Username for "${teamName}".`;
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, "failed", null, err);
        this.db.logNotification({
          type: "selection_congratulations",
          team_id: teamId,
          captain_discord_id: "MISSING",
          captain_name: captainName,
          status: "failed",
          message_content: "Selection Congratulations Notification",
          error_message: err
        });
      }
      return { success: false, error: err };
    }
    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      const err = initRes.error || "Discord bot client is not connected. Please check bot token in Settings.";
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, "failed", null, err);
      }
      return { success: false, error: err };
    }
    const messageContent = _DiscordService.formatSelectionMessage(captainName, teamName, customTemplate);
    try {
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, "sending");
      }
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Please ensure they have joined the Discord server where this bot is installed, or enter their 17-20 digit Discord User ID.`);
      }
      const sentMsg = await user.send(messageContent);
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, "sent", sentMsg.id);
        this.db.logNotification({
          type: "selection_congratulations",
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: "sent",
          message_content: messageContent,
          message_id: sentMsg.id
        });
      }
      return { success: true, messageId: sentMsg.id };
    } catch (err) {
      let friendlyError = err.message || "Failed to send direct message";
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. Their Discord Privacy Settings block direct messages from server bots, or they do not share a mutual server with the bot.`;
      }
      if (this.db) {
        this.db.updateSelectionNotificationStatus(selectionId, "failed", null, friendlyError);
        this.db.logNotification({
          type: "selection_congratulations",
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: "failed",
          message_content: messageContent,
          error_message: friendlyError
        });
      }
      return { success: false, error: friendlyError };
    }
  }
  /**
   * Sends room ID and password DM to a selected captain
   */
  async sendRoomDM(captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, additionalInstructions, customTemplate) {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID/Username for "${teamName}".`;
      if (this.db) {
        this.db.logNotification({
          type: "room_password",
          team_id: teamId,
          captain_discord_id: "MISSING",
          captain_name: captainName,
          status: "failed",
          message_content: "Match Room Announcement",
          error_message: err
        });
      }
      return { success: false, error: err };
    }
    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      return { success: false, error: initRes.error || "Discord bot client is not connected" };
    }
    const messageContent = _DiscordService.formatRoomMessage(
      captainName,
      teamName,
      roomId,
      roomPassword,
      matchTime,
      additionalInstructions,
      customTemplate
    );
    const safeLogContent = `Free Fire Tournament Match Details: Room ID ${roomId}`;
    try {
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Please ensure they have joined the Discord server where this bot is installed, or enter their 17-20 digit Discord User ID.`);
      }
      const sentMsg = await user.send(messageContent);
      if (this.db) {
        this.db.logNotification({
          type: "room_password",
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: "sent",
          message_content: safeLogContent,
          message_id: sentMsg.id
        });
      }
      return { success: true, messageId: sentMsg.id };
    } catch (err) {
      let friendlyError = err.message || "Failed to send room announcement";
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. User privacy settings block direct messages from server bots.`;
      }
      if (this.db) {
        this.db.logNotification({
          type: "room_password",
          team_id: teamId,
          captain_discord_id: captainDiscordId,
          captain_name: captainName,
          status: "failed",
          message_content: safeLogContent,
          error_message: friendlyError
        });
      }
      return { success: false, error: friendlyError };
    }
  }
  /**
   * Disconnects the Discord client
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch {
      }
      this.client = null;
      this.currentToken = "";
    }
  }
  /**
   * Sends a custom direct message to a user
   */
  async sendDirectMessage(captainDiscordId, messageContent, teamId, captainName, teamName) {
    if (!captainDiscordId || !captainDiscordId.trim()) {
      const err = `Missing Discord User ID or Username.`;
      if (this.db) {
        this.db.logNotification({
          type: "custom_dm",
          team_id: teamId || "",
          captain_discord_id: "MISSING",
          captain_name: captainName || "Unknown",
          status: "failed",
          message_content: messageContent,
          error_message: err
        });
      }
      return { success: false, error: err };
    }
    const initRes = await this.initializeClient();
    if (!initRes.success || !this.client) {
      const err = initRes.error || "Discord bot is not connected. Please check your token in Settings.";
      if (this.db) {
        this.db.logNotification({
          type: "custom_dm",
          team_id: teamId || "",
          captain_discord_id: captainDiscordId,
          captain_name: captainName || "Unknown",
          status: "failed",
          message_content: messageContent,
          error_message: err
        });
      }
      return { success: false, error: err };
    }
    try {
      const user = await this.resolveUser(captainDiscordId);
      if (!user) {
        throw new Error(`Discord user "${captainDiscordId}" was not found. Ensure the user is in the Discord server with the bot.`);
      }
      const sentMsg = await user.send(messageContent);
      if (this.db) {
        this.db.logNotification({
          type: "custom_dm",
          team_id: teamId || "",
          captain_discord_id: captainDiscordId,
          captain_name: captainName || user.username,
          status: "sent",
          message_content: messageContent,
          message_id: sentMsg.id
        });
      }
      return { success: true, messageId: sentMsg.id };
    } catch (err) {
      let friendlyError = err.message || "Failed to send direct message";
      if (err.code === 50007) {
        friendlyError = `Cannot send DM to ${captainDiscordId}. User privacy settings block direct messages, or user does not share a server with the bot.`;
      }
      if (this.db) {
        this.db.logNotification({
          type: "custom_dm",
          team_id: teamId || "",
          captain_discord_id: captainDiscordId,
          captain_name: captainName || "Unknown",
          status: "failed",
          message_content: messageContent,
          error_message: friendlyError
        });
      }
      return { success: false, error: friendlyError };
    }
  }
};

// electron/cryptoRandom.ts
var import_crypto2 = __toESM(require("crypto"));
function getCryptoRandomInt(min, max) {
  if (min >= max) {
    throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
  }
  return import_crypto2.default.randomInt(min, max);
}

// electron/main.ts
var mainWindow = null;
var db;
var discordService;
var isDev = process.env.NODE_ENV === "development" || !import_electron.app?.isPackaged;
async function createWindow() {
  const dbDir = isDev ? process.cwd() : import_electron.app.getPath("userData");
  const dbPath = import_path3.default.join(dbDir, "tournament.db");
  const wasmPath = import_path3.default.join(__dirname, "sql-wasm.wasm");
  db = new TournamentDatabase(dbPath, wasmPath);
  await db.initialize();
  discordService = new DiscordService(db);
  mainWindow = new import_electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "Free Fire Tournament Management System",
    backgroundColor: "#0B0E14",
    show: false,
    frame: false,
    // Sleek frameless esports window
    webPreferences: {
      preload: import_path3.default.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  const distIndex = import_path3.default.join(__dirname, "../dist/index.html");
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (import_fs3.default.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
var lastImportedExcelPath = null;
function autoSyncExcel() {
  try {
    if (!db) return;
    const buffer = ExcelService.generateTournamentWorkbook(db);
    const syncDir = isDev ? process.cwd() : import_electron.app.getPath("userData");
    const syncPath = import_path3.default.join(syncDir, "tournament_master_sync.xlsx");
    ExcelService.safeSaveFile(syncPath, buffer);
    const savedPath = lastImportedExcelPath || db.getSetting("last_imported_excel_path");
    if (savedPath && import_fs3.default.existsSync(savedPath)) {
      try {
        ExcelService.safeSaveFile(savedPath, buffer);
      } catch (err) {
        console.error("Auto Excel sync to imported file error:", err);
      }
    }
  } catch (err) {
    console.error("Auto Excel sync error:", err);
  }
}
function registerIpcHandlers() {
  import_electron.ipcMain.handle("app:minimize", () => mainWindow?.minimize());
  import_electron.ipcMain.handle("app:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  import_electron.ipcMain.handle("app:close", () => mainWindow?.close());
  import_electron.ipcMain.handle("db:getDashboardStats", async () => {
    try {
      const stats = db.getDashboardStats();
      return { success: true, data: stats };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getSettings", async () => {
    try {
      const settings = db.getSettings();
      return { success: true, data: settings };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:saveSettings", async (_, newSettings) => {
    try {
      db.saveSettings(newSettings);
      return { success: true, data: db.getSettings() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getAllTeams", async () => {
    try {
      const teams = db.getAllTeams();
      return { success: true, data: teams };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getEligibleTeams", async (_, args) => {
    try {
      let stage = void 0;
      let allowRepeat = false;
      if (typeof args === "string") {
        stage = args;
      } else if (args && typeof args === "object") {
        stage = args.stage;
        allowRepeat = Boolean(args.allowRepeat);
      }
      const teams = db.getEligibleTeams(stage, allowRepeat);
      return { success: true, data: teams };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getPlayedTeams", async () => {
    try {
      const teams = db.getPlayedTeams();
      return { success: true, data: teams };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getTeamById", async (_, id) => {
    try {
      const team = db.getTeamById(id);
      return { success: true, data: team };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:updateTeamStatus", async (_, { teamId, status, reason }) => {
    try {
      db.updateTeamStatus(teamId, status, reason);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:updateTeamQualification", async (_, { teamId, status, currentStage }) => {
    try {
      db.updateTeamQualification(teamId, status, currentStage);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:advanceTeamStage", async (_, { teamId, nextStage }) => {
    try {
      db.advanceTeamStage(teamId, nextStage);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:batchUpdateTeamQualification", async (_, { teamIds, status, currentStage }) => {
    try {
      db.batchUpdateTeamQualification(teamIds, status, currentStage);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:batchAdvanceTeamStage", async (_, { teamIds, nextStage }) => {
    try {
      db.batchAdvanceTeamStage(teamIds, nextStage);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getTeamMatchHistory", async (_, teamId) => {
    try {
      const history = db.getTeamMatchHistory(teamId);
      return { success: true, data: history };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:deleteTeam", async (_, teamId) => {
    try {
      db.deleteTeam(teamId);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:addTeam", async (_, { teamName, captainName, captainDiscordId }) => {
    try {
      const team = db.addTeam(teamName, captainName, captainDiscordId || "");
      autoSyncExcel();
      return { success: true, data: team };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:addPlayer", async (_, { teamId, playerName, role, isCaptain, extraInfo }) => {
    try {
      const player = db.addPlayer(teamId, playerName, role, isCaptain, extraInfo);
      autoSyncExcel();
      return { success: true, data: player };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:deletePlayer", async (_, playerId) => {
    try {
      db.deletePlayer(playerId);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:resetRotation", async (_, policy) => {
    try {
      db.resetRotation(policy);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getActiveDraw", async () => {
    try {
      const draw = db.getActiveDraw();
      return { success: true, data: draw };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:createDraw", async (_, arg1, arg2) => {
    try {
      let targetCount = 12;
      let stage = "qualifying";
      if (typeof arg1 === "object" && arg1 !== null) {
        targetCount = arg1.targetCount || 12;
        stage = arg1.stage || "qualifying";
      } else {
        if (typeof arg1 === "number") targetCount = arg1;
        if (typeof arg2 === "string") stage = arg2;
      }
      const draw = db.createDraw(targetCount, stage);
      return { success: true, data: draw };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:recordSelection", async (_, { drawId, teamId, order }) => {
    try {
      const selection = db.recordSelection(drawId, teamId, order);
      autoSyncExcel();
      return { success: true, data: selection };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:recordSelectionBatch", async (_, { drawId, teamIds, startingOrder }) => {
    try {
      const selections = db.recordSelectionBatch(drawId, teamIds, startingOrder || 1);
      autoSyncExcel();
      return { success: true, data: selections };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:finalizeDraw", async (_, drawId) => {
    try {
      db.finalizeDraw(drawId);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:cancelDraw", async (_, drawId) => {
    try {
      db.cancelDraw(drawId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getDrawHistory", async () => {
    try {
      const history = db.getDrawHistory();
      return { success: true, data: history };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("crypto:selectWinner", async (_, eligiblePoolIds) => {
    try {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0) {
        throw new Error("Eligible pool is empty");
      }
      const winnerIndex = getCryptoRandomInt(0, eligiblePoolIds.length);
      const winnerId = eligiblePoolIds[winnerIndex];
      return { success: true, data: { winnerId, winnerIndex } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("crypto:selectMultipleWinners", async (_, { eligiblePoolIds, count }) => {
    try {
      if (!eligiblePoolIds || eligiblePoolIds.length === 0 || count <= 0) {
        throw new Error("Eligible pool is empty or count is invalid");
      }
      const pool = [...eligiblePoolIds];
      const selected = [];
      const selectCount = Math.min(count, pool.length);
      for (let i = 0; i < selectCount; i++) {
        const randIdx = getCryptoRandomInt(i, pool.length);
        const temp = pool[i];
        pool[i] = pool[randIdx];
        pool[randIdx] = temp;
        selected.push(pool[i]);
      }
      return { success: true, data: { winnerTeamIds: selected } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getMatches", async () => {
    try {
      const matches = db.getMatches();
      return { success: true, data: matches };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getLatestMatch", async () => {
    try {
      const match = db.getLatestMatch();
      return { success: true, data: match };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getMatchById", async (_, id) => {
    try {
      const match = db.getMatchById(id);
      return { success: true, data: match };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:saveMatchDetails", async (_, matchData) => {
    try {
      const saved = db.saveMatchDetails(matchData);
      return { success: true, data: saved };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:completeMatch", async (_, { matchId, teams, players, notes }) => {
    try {
      const res = db.completeMatch(matchId, teams, players, notes);
      autoSyncExcel();
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getMatchTeamParticipation", async (_, matchId) => {
    try {
      const list = db.getMatchTeamParticipation(matchId);
      return { success: true, data: list };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:deleteMatch", async (_, matchId) => {
    try {
      db.deleteMatch(matchId);
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:clearAllMatches", async () => {
    try {
      db.clearAllMatches();
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("excel:openAndPreview", async () => {
    try {
      const res = await import_electron.dialog.showOpenDialog(mainWindow, {
        title: "Select Free Fire Registration Excel File",
        filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
        properties: ["openFile"]
      });
      if (res.canceled || res.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      const filePath = res.filePaths[0];
      lastImportedExcelPath = filePath;
      try {
        db.setSetting("last_imported_excel_path", filePath);
      } catch {
      }
      const buffer = import_fs3.default.readFileSync(filePath);
      const existingTeams = db.getAllTeams();
      const preview = ExcelService.parseExcelBuffer(buffer, existingTeams);
      return { success: true, data: { preview, filePath } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("excel:commitImport", async (_, teams, mode = "replace") => {
    try {
      if (mode === "replace") {
        db.clearUnplayedTeams();
      }
      const importPayload = teams.map((t) => ({
        team_name: t.team_name,
        captain_name: t.captain_name,
        captain_phone: t.captain_phone,
        captain_discord_id: t.captain_discord_id,
        players: [
          { name: t.captain_name, role: "captain", is_captain: true },
          { name: t.player2_name, role: "player2" },
          { name: t.player3_name, role: "player3" },
          { name: t.player4_name, role: "player4" },
          { name: t.substitute_name, role: "substitute" }
        ],
        extra_columns: t.extra_columns
      }));
      const result = db.importTeamsBatch(importPayload);
      autoSyncExcel();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("excel:exportWorkbook", async () => {
    try {
      const res = await import_electron.dialog.showSaveDialog(mainWindow, {
        title: "Export Tournament Excel Workbook",
        defaultPath: `Free_Fire_Tournament_Export_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`,
        filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }]
      });
      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }
      const buffer = ExcelService.generateTournamentWorkbook(db);
      ExcelService.safeSaveFile(res.filePath, buffer);
      db.addAuditLog("EXPORT_EXCEL", `Exported 5-sheet workbook to ${res.filePath}`);
      return { success: true, data: { filePath: res.filePath } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("excel:downloadSampleTemplate", async () => {
    try {
      const res = await import_electron.dialog.showSaveDialog(mainWindow, {
        title: "Save Sample Registration Template",
        defaultPath: "free_fire_teams_sample_registration.xlsx",
        filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }]
      });
      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }
      const buffer = ExcelService.generateSampleRegistrationTemplate();
      ExcelService.safeSaveFile(res.filePath, buffer);
      return { success: true, data: { filePath: res.filePath } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("discord:checkStatus", async () => {
    try {
      const status = discordService.getStatus();
      return { success: true, data: status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("discord:testConnection", async (_, token) => {
    try {
      const res = await discordService.initializeClient(token);
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("discord:sendSelectionDM", async (_, { selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate }) => {
    try {
      const res = await discordService.sendSelectionDM(selectionId, captainDiscordId, captainName, teamName, teamId, force, customTemplate);
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("discord:sendRoomDM", async (_, { captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate }) => {
    try {
      const res = await discordService.sendRoomDM(captainDiscordId, captainName, teamName, teamId, roomId, roomPassword, matchTime, instructions, customTemplate);
      if (res && res.success && teamId) {
        try {
          db.updateTeamStatus(teamId, "playing", "Room ID and password sent");
        } catch (e) {
          console.error("Failed to update team status to playing:", e);
        }
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("discord:sendDirectMessage", async (_, { captainDiscordId, messageContent, teamId, captainName, teamName }) => {
    try {
      const res = await discordService.sendDirectMessage(captainDiscordId, messageContent, teamId, captainName, teamName);
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:clearAllTeams", async () => {
    try {
      db.clearAllTeams();
      autoSyncExcel();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getAuditLogs", async () => {
    try {
      const logs = db.getAuditLogs();
      return { success: true, data: logs };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:getNotificationLogs", async () => {
    try {
      const logs = db.getNotificationLogs();
      return { success: true, data: logs };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:backupDatabase", async () => {
    try {
      const res = await import_electron.dialog.showSaveDialog(mainWindow, {
        title: "Backup Tournament Database",
        defaultPath: `tournament_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.db`,
        filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }]
      });
      if (res.canceled || !res.filePath) {
        return { success: false, canceled: true };
      }
      db.backupDatabase(res.filePath);
      return { success: true, data: { filePath: res.filePath } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  import_electron.ipcMain.handle("db:restoreDatabase", async () => {
    try {
      const res = await import_electron.dialog.showOpenDialog(mainWindow, {
        title: "Select Backup Database to Restore",
        filters: [{ name: "SQLite Database", extensions: ["db", "sqlite"] }],
        properties: ["openFile"]
      });
      if (res.canceled || res.filePaths.length === 0) {
        return { success: false, canceled: true };
      }
      await db.restoreDatabase(res.filePaths[0]);
      return { success: true, data: { filePath: res.filePaths[0] } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}
import_electron.app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
//# sourceMappingURL=main.cjs.map
