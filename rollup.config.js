import typescript from "rollup-plugin-typescript2";
import {terser} from "rollup-plugin-terser";
import nodeResolve from '@rollup/plugin-node-resolve';

export default [{
    input: ["./src/main.ts"],
    output: [
        {
            file: "build/sh.js",
            format: "iife",
            name: "SH" // the global which can be used in a browser
        },
        {
            file: "build/sh.min.js",
            format: "iife",
            name: "SH", // the global which can be used in a browser
            plugins: [terser()]
        },
        {
            file: "build/sh.module.js",
            format: "es",
            // plugins: [terser()]
        }
    ],
    plugins: [
        typescript({
            useTsconfigDeclarationDir: true,
            sourceMap: true,
            inlineSources: true
        }),
        nodeResolve()
    ]
}];
