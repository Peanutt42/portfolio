import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import inline from "@zhoumutou/vite-plugin-inline";

export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/style.css");
	eleventyConfig.addPassthroughCopy("src/ardemu_web");
	eleventyConfig.ignores.add("src/ardemu_web/**");
	eleventyConfig.addPassthroughCopy("src/icons");
	eleventyConfig.addPassthroughCopy("src/images");

	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		formats: ["webp", "jpeg", "svg", "auto"],
		// dont rasterize svgs to webp
		svgShortCircuit: true
	});

	eleventyConfig.addPlugin(EleventyVitePlugin, {
		viteOptions: {
			plugins: [
				inline()
			],
			build: {},
		},
	});

	return {
		dir: {
			input: "src",
			output: "dist",
		},
	};
};