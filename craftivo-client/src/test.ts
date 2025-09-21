// Global test setup for Angular (Karma)
// Ensures Zone.js test environment is loaded.

import 'zone.js'; // Included with Angular CLI normally via polyfills
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Provide common testing modules globally so individual specs for standalone components
// don't each have to import HttpClient/Router testing utilities.
getTestBed().configureTestingModule({
	imports: [HttpClientTestingModule, RouterTestingModule],
});

// Monkey patch configureTestingModule so later calls in individual specs automatically
// append our common test imports (they often overwrite instead of merge the initial one).
const tb: any = getTestBed();
const originalConfigure = tb.configureTestingModule.bind(tb);
tb.configureTestingModule = (moduleDef: any = {}) => {
	moduleDef.imports = [
		...(moduleDef.imports || []),
		HttpClientTestingModule,
		RouterTestingModule,
	];
	return originalConfigure(moduleDef);
};
