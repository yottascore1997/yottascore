"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/student/exam-notifications/route";
exports.ids = ["app/api/student/exam-notifications/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstudent%2Fexam-notifications%2Froute&page=%2Fapi%2Fstudent%2Fexam-notifications%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstudent%2Fexam-notifications%2Froute.ts&appDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstudent%2Fexam-notifications%2Froute&page=%2Fapi%2Fstudent%2Fexam-notifications%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstudent%2Fexam-notifications%2Froute.ts&appDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   headerHooks: () => (/* binding */ headerHooks),\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),\n/* harmony export */   staticGenerationBailout: () => (/* binding */ staticGenerationBailout)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_Polestar_Desktop_ExamRosh1_examindia_src_app_api_student_exam_notifications_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/student/exam-notifications/route.ts */ \"(rsc)/./src/app/api/student/exam-notifications/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/student/exam-notifications/route\",\n        pathname: \"/api/student/exam-notifications\",\n        filename: \"route\",\n        bundlePath: \"app/api/student/exam-notifications/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\Polestar\\\\Desktop\\\\ExamRosh1\\\\examindia\\\\src\\\\app\\\\api\\\\student\\\\exam-notifications\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_Polestar_Desktop_ExamRosh1_examindia_src_app_api_student_exam_notifications_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks, headerHooks, staticGenerationBailout } = routeModule;\nconst originalPathname = \"/api/student/exam-notifications/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZzdHVkZW50JTJGZXhhbS1ub3RpZmljYXRpb25zJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzdHVkZW50JTJGZXhhbS1ub3RpZmljYXRpb25zJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc3R1ZGVudCUyRmV4YW0tbm90aWZpY2F0aW9ucyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNQb2xlc3RhciU1Q0Rlc2t0b3AlNUNFeGFtUm9zaDElNUNleGFtaW5kaWElNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q1BvbGVzdGFyJTVDRGVza3RvcCU1Q0V4YW1Sb3NoMSU1Q2V4YW1pbmRpYSZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUN3RDtBQUNySTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHVHQUF1RztBQUMvRztBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzZKOztBQUU3SiIsInNvdXJjZXMiOlsid2VicGFjazovL2V4YW1yb3NoLz85Y2VhIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXFBvbGVzdGFyXFxcXERlc2t0b3BcXFxcRXhhbVJvc2gxXFxcXGV4YW1pbmRpYVxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxzdHVkZW50XFxcXGV4YW0tbm90aWZpY2F0aW9uc1xcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3R1ZGVudC9leGFtLW5vdGlmaWNhdGlvbnMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9zdHVkZW50L2V4YW0tbm90aWZpY2F0aW9uc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc3R1ZGVudC9leGFtLW5vdGlmaWNhdGlvbnMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxQb2xlc3RhclxcXFxEZXNrdG9wXFxcXEV4YW1Sb3NoMVxcXFxleGFtaW5kaWFcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcc3R1ZGVudFxcXFxleGFtLW5vdGlmaWNhdGlvbnNcXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgaGVhZGVySG9va3MsIHN0YXRpY0dlbmVyYXRpb25CYWlsb3V0IH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvc3R1ZGVudC9leGFtLW5vdGlmaWNhdGlvbnMvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgaGVhZGVySG9va3MsIHN0YXRpY0dlbmVyYXRpb25CYWlsb3V0LCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstudent%2Fexam-notifications%2Froute&page=%2Fapi%2Fstudent%2Fexam-notifications%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstudent%2Fexam-notifications%2Froute.ts&appDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/student/exam-notifications/route.ts":
/*!*********************************************************!*\
  !*** ./src/app/api/student/exam-notifications/route.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/web/exports/next-response */ \"(rsc)/./node_modules/next/dist/server/web/exports/next-response.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var _lib_jwt__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/jwt */ \"(rsc)/./src/lib/jwt.ts\");\n\n\n\nasync function GET(req) {\n    try {\n        const token = req.headers.get(\"authorization\")?.split(\" \")[1];\n        if (!token) {\n            return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        const payload = await (0,_lib_jwt__WEBPACK_IMPORTED_MODULE_2__.verifyToken)(token);\n        if (!payload) {\n            return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        const notifications = await _lib_prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.govtExamNotification.findMany({\n            orderBy: [\n                {\n                    year: \"desc\"\n                },\n                {\n                    month: \"desc\"\n                }\n            ]\n        });\n        return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json(notifications);\n    } catch (error) {\n        console.error(\"Error fetching notifications:\", error);\n        return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n            error: \"Internal server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9zdHVkZW50L2V4YW0tbm90aWZpY2F0aW9ucy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTJDO0FBQ0w7QUFDRTtBQUVqQyxlQUFlRyxJQUFJQyxHQUFZO0lBQ3BDLElBQUk7UUFDRixNQUFNQyxRQUFRRCxJQUFJRSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxrQkFBa0JDLE1BQU0sSUFBSSxDQUFDLEVBQUU7UUFDN0QsSUFBSSxDQUFDSCxPQUFPO1lBQ1YsT0FBT0wsa0ZBQVlBLENBQUNTLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFlLEdBQUc7Z0JBQUVDLFFBQVE7WUFBSTtRQUNwRTtRQUVBLE1BQU1DLFVBQVUsTUFBTVYscURBQVdBLENBQUNHO1FBQ2xDLElBQUksQ0FBQ08sU0FBUztZQUNaLE9BQU9aLGtGQUFZQSxDQUFDUyxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBZSxHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDcEU7UUFFQSxNQUFNRSxnQkFBZ0IsTUFBTVosK0NBQU1BLENBQUNhLG9CQUFvQixDQUFDQyxRQUFRLENBQUM7WUFDL0RDLFNBQVM7Z0JBQ1A7b0JBQUVDLE1BQU07Z0JBQU87Z0JBQ2Y7b0JBQUVDLE9BQU87Z0JBQU87YUFDakI7UUFDSDtRQUVBLE9BQU9sQixrRkFBWUEsQ0FBQ1MsSUFBSSxDQUFDSTtJQUMzQixFQUFFLE9BQU9ILE9BQU87UUFDZFMsUUFBUVQsS0FBSyxDQUFDLGlDQUFpQ0E7UUFDL0MsT0FBT1Ysa0ZBQVlBLENBQUNTLElBQUksQ0FDdEI7WUFBRUMsT0FBTztRQUF3QixHQUNqQztZQUFFQyxRQUFRO1FBQUk7SUFFbEI7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL2V4YW1yb3NoLy4vc3JjL2FwcC9hcGkvc3R1ZGVudC9leGFtLW5vdGlmaWNhdGlvbnMvcm91dGUudHM/ZWEzNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcclxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xyXG5pbXBvcnQgeyB2ZXJpZnlUb2tlbiB9IGZyb20gXCJAL2xpYi9qd3RcIjtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOiBSZXF1ZXN0KSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHRva2VuID0gcmVxLmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKT8uc3BsaXQoXCIgXCIpWzFdO1xyXG4gICAgaWYgKCF0b2tlbikge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJVbmF1dGhvcml6ZWRcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB2ZXJpZnlUb2tlbih0b2tlbik7XHJcbiAgICBpZiAoIXBheWxvYWQpIHtcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiVW5hdXRob3JpemVkXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBub3RpZmljYXRpb25zID0gYXdhaXQgcHJpc21hLmdvdnRFeGFtTm90aWZpY2F0aW9uLmZpbmRNYW55KHtcclxuICAgICAgb3JkZXJCeTogW1xyXG4gICAgICAgIHsgeWVhcjogJ2Rlc2MnIH0sXHJcbiAgICAgICAgeyBtb250aDogJ2Rlc2MnIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKG5vdGlmaWNhdGlvbnMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgbm90aWZpY2F0aW9uczpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxyXG4gICAgICB7IGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiIH0sXHJcbiAgICAgIHsgc3RhdHVzOiA1MDAgfVxyXG4gICAgKTtcclxuICB9XHJcbn0gIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsInByaXNtYSIsInZlcmlmeVRva2VuIiwiR0VUIiwicmVxIiwidG9rZW4iLCJoZWFkZXJzIiwiZ2V0Iiwic3BsaXQiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJwYXlsb2FkIiwibm90aWZpY2F0aW9ucyIsImdvdnRFeGFtTm90aWZpY2F0aW9uIiwiZmluZE1hbnkiLCJvcmRlckJ5IiwieWVhciIsIm1vbnRoIiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/student/exam-notifications/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/jwt.ts":
/*!************************!*\
  !*** ./src/lib/jwt.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   generateToken: () => (/* binding */ generateToken),\n/* harmony export */   verifyToken: () => (/* binding */ verifyToken)\n/* harmony export */ });\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jsonwebtoken */ \"(rsc)/./node_modules/jsonwebtoken/index.js\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);\n\nconst JWT_SECRET = process.env.JWT_SECRET || \"your-secret-key\";\nasync function verifyToken(token) {\n    try {\n        const decoded = jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().verify(token, JWT_SECRET);\n        return decoded;\n    } catch (error) {\n        console.error(\"Token verification failed:\", error);\n        return null;\n    }\n}\nfunction generateToken(payload) {\n    return jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().sign(payload, JWT_SECRET, {\n        expiresIn: \"7d\"\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2p3dC50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQStCO0FBRS9CLE1BQU1DLGFBQWFDLFFBQVFDLEdBQUcsQ0FBQ0YsVUFBVSxJQUFJO0FBUXRDLGVBQWVHLFlBQVlDLEtBQWE7SUFDN0MsSUFBSTtRQUNGLE1BQU1DLFVBQVVOLDBEQUFVLENBQUNLLE9BQU9KO1FBQ2xDLE9BQU9LO0lBQ1QsRUFBRSxPQUFPRSxPQUFPO1FBQ2RDLFFBQVFELEtBQUssQ0FBQyw4QkFBOEJBO1FBQzVDLE9BQU87SUFDVDtBQUNGO0FBRU8sU0FBU0UsY0FBY0MsT0FBcUI7SUFDakQsT0FBT1gsd0RBQVEsQ0FBQ1csU0FBU1YsWUFBWTtRQUFFWSxXQUFXO0lBQUs7QUFDekQiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9leGFtcm9zaC8uL3NyYy9saWIvand0LnRzPzE0ZmYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGp3dCBmcm9tIFwianNvbndlYnRva2VuXCI7XHJcblxyXG5jb25zdCBKV1RfU0VDUkVUID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCBcInlvdXItc2VjcmV0LWtleVwiO1xyXG5cclxuaW50ZXJmYWNlIFRva2VuUGF5bG9hZCB7XHJcbiAgdXNlcklkOiBzdHJpbmc7XHJcbiAgcm9sZTogc3RyaW5nO1xyXG4gIGVtYWlsOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlUb2tlbih0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxUb2tlblBheWxvYWQgfCBudWxsPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKSBhcyBUb2tlblBheWxvYWQ7XHJcbiAgICByZXR1cm4gZGVjb2RlZDtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlRva2VuIHZlcmlmaWNhdGlvbiBmYWlsZWQ6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVG9rZW4ocGF5bG9hZDogVG9rZW5QYXlsb2FkKTogc3RyaW5nIHtcclxuICByZXR1cm4gand0LnNpZ24ocGF5bG9hZCwgSldUX1NFQ1JFVCwgeyBleHBpcmVzSW46IFwiN2RcIiB9KTtcclxufSAiXSwibmFtZXMiOlsiand0IiwiSldUX1NFQ1JFVCIsInByb2Nlc3MiLCJlbnYiLCJ2ZXJpZnlUb2tlbiIsInRva2VuIiwiZGVjb2RlZCIsInZlcmlmeSIsImVycm9yIiwiY29uc29sZSIsImdlbmVyYXRlVG9rZW4iLCJwYXlsb2FkIiwic2lnbiIsImV4cGlyZXNJbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/jwt.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log: [\n        \"query\"\n    ]\n});\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkM7QUFFN0MsTUFBTUMsa0JBQWtCQztBQUlqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsQ0FBQztJQUMvREksS0FBSztRQUFDO0tBQVE7QUFDaEIsR0FBRTtBQUVGLElBQUlDLElBQXlCLEVBQWNKLGdCQUFnQkUsTUFBTSxHQUFHQSIsInNvdXJjZXMiOlsid2VicGFjazovL2V4YW1yb3NoLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcclxuXHJcbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7XHJcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/IG5ldyBQcmlzbWFDbGllbnQoe1xyXG4gIGxvZzogW1wicXVlcnlcIl0sXHJcbn0pXHJcblxyXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYSAiXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsVGhpcyIsInByaXNtYSIsImxvZyIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/ms","vendor-chunks/semver","vendor-chunks/jsonwebtoken","vendor-chunks/lodash.includes","vendor-chunks/jws","vendor-chunks/jwa","vendor-chunks/lodash.once","vendor-chunks/lodash.isinteger","vendor-chunks/ecdsa-sig-formatter","vendor-chunks/lodash.isplainobject","vendor-chunks/lodash.isstring","vendor-chunks/lodash.isnumber","vendor-chunks/lodash.isboolean","vendor-chunks/safe-buffer","vendor-chunks/buffer-equal-constant-time"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstudent%2Fexam-notifications%2Froute&page=%2Fapi%2Fstudent%2Fexam-notifications%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstudent%2Fexam-notifications%2Froute.ts&appDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CPolestar%5CDesktop%5CExamRosh1%5Cexamindia&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();