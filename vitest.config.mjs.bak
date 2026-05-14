/*
▲ [WARNING] The CommonJS "module" variable is treated as
a global variable in an ECMAScript module and may not work
as expected [commonjs-variable-in-esm]
*/

import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.js"],
            exclude: ["src/generated/**", "src/index.js"],
        }
    }
});