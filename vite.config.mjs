import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { createHtmlPlugin } from "vite-plugin-html";
import inline from "@zhoumutou/vite-plugin-inline";
import sharp from "sharp";

import { resolve } from "path";
import { readFileSync } from "fs";

import projects from "./src/data/projects.json" with { type: "json" };
import socials from "./src/data/socials.json" with { type: "json" };
import dotfilesInfo from "./src/data/dotfilesInfo.json" with { type: "json" };

export default defineConfig({
	plugins: [
		handlebars({
			context: {
				projects,
				socials,
				dotfilesInfo,
			},
			helpers: {
				includes: (str, substr) => str.includes(substr),
			},
		}),
		svgInlinePlugin(),
		imageDimensionsPlugin(),
		inline(),
		createHtmlPlugin({
			minify: true,
		}),
	],
	root: "src",
	publicDir: resolve(import.meta.dirname, "public"),
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
});

// inlines small (<4kb) svg icons that are only referenced once directly into the html file
function svgInlinePlugin() {
	return {
		name: "svg-inline",
		async transformIndexHtml(html) {
			// First pass: count occurrences of each SVG src
			const countRegex = /src="(\/icons\/[^"]+\.svg)"/g;
			const counts = {};
			let match;
			while ((match = countRegex.exec(html)) !== null) {
				const src = match[1];
				counts[src] = (counts[src] || 0) + 1;
			}
			// Second pass: inline only unique SVGs under 4KB
			const svgRegex =
				/<img\s([^>]*?)src="(\/icons\/[^"]+\.svg)"([^>]*?)>/g;
			return html.replace(svgRegex, (full, before, src, after) => {
				if (counts[src] !== 1) return full;
				const filePath = resolve("public", src.slice(1));
				try {
					const svgContent = readFileSync(filePath, "utf8");
					if (svgContent.length > 4096) return full;
					const dataUri = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
					return `<img ${before}src="${dataUri}"${after}>`;
				} catch {
					return full;
				}
			});
		},
	};
}

// automatically add width and height attributes to <img> elements
function imageDimensionsPlugin() {
	return {
		name: "image-dimensions",
		async transformIndexHtml(html) {
			const imgRegex = /<img\s([^>]*?)>/g;
			let result = html;
			let match;
			while ((match = imgRegex.exec(html)) !== null) {
				const fullMatch = match[0];
				const attrs = match[1];
				if (
					attrs.includes("width=") ||
					attrs.includes("data:image") ||
					attrs.includes("http")
				) {
					continue;
				}
				const srcMatch = attrs.match(/src="([^"]+)"/);
				if (!srcMatch) continue;
				const src = srcMatch[1];
				if (!src.startsWith("/")) continue;
				const filePath = resolve("public", src.slice(1));
				try {
					const metadata = await sharp(filePath).metadata();
					if (metadata.width && metadata.height) {
						const newTag = fullMatch.replace(
							"<img ",
							`<img width="${metadata.width}" height="${metadata.height}" `,
						);
						result = result.replace(fullMatch, newTag);
					}
				} catch {
					// not a raster image or file not found — skip
				}
			}
			return result;
		},
	};
}
