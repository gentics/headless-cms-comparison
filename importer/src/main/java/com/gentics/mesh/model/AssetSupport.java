package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AssetSupport {
	@JsonProperty("Image Manipulation")
	private String imageManipulation;

	@JsonProperty("Image Focalpoint support")
	private String focalPoint;

	@JsonProperty("Image Facedetection")
	private String faceDetection;

	@JsonProperty("Optimized Image Encoding")
	private String imageEncoding;

	@JsonProperty("Asset fingerprinting")
	private String fingerprinting;

	@JsonProperty("CDN Support")
	private String cdn;

	@JsonProperty("Antivirus Scanning")
	private String antivirus;

	@JsonProperty("Custom Binary Handler")
	private String binaryHandler;

}
