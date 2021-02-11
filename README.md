# Public Land Survey

This app tells the user what the land looked like around 200 years ago at the user's location. The data originally comes from the U.S. Federal Government's [Public Land Surveys](https://en.wikipedia.org/wiki/Public_Land_Survey_System).
Most of the territory of the current United States have some version of a Public Land Survey except for the Eastern states.

A few states have digitized the Public Land Surveys to create maps of the land cover at the time of surveying, which usually predated significant colonization and settlement
by the United States. This app uses ArcGIS servers of various states to query the land cover at the user's location.

As of now we have found and are using servers for

* [Michigan](https://mnfi.anr.msu.edu/resources/vegetation-circa-1800)
* [Illinois](https://clearinghouse.isgs.illinois.edu/data/landcover/illinois-landcover-early-1800s)

If you know of any similar data sources for other states, please open an issue!

## To use the app
Go to https://pls.bunkum.us

## To develop the app
Right now, the app is pure ES6, so if you have a modern browser you should be able to clone a local copy and open `index.html` directly in your browser.
