package com.gentics.mesh.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SearchSupport {

	@JsonProperty("Search API")
	private String searchAPI;

	@JsonProperty("Search Features [Full Text Search]")
	private String fullTextSearch;

	@JsonProperty("Search Features [Stemming]")
	private String stemming;

	@JsonProperty("Search Features [Stop Words]")
	private String stopWords;

	@JsonProperty("Search Features [Boosting]")
	private String boosting;

	@JsonProperty("Search Features [Autocompletion]")
	private String autocompletion;

	@JsonProperty("Search Features [Autosuggestion]")
	private String autosuggestion;

	@JsonProperty("Search Features [Result Highlighting]")
	private String highlighting;

	@JsonProperty("Search Features [Geospatial Search]")
	private String geoSearch;

	@JsonProperty("Search Features [Search within uploads (pdf,doc)]")
	private String uploadSearch;

}
