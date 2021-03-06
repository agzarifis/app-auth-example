/*
 * Copyright 2016-2017 Symphony Application Authentication - Symphony LLC
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// application token, returned from /authentication, passed to /validateTokens
var appToken;

// ID of pod/company - comes back from 'hello'
var companyId;

// Kicks off app authentication flow at server.  Passes pod ID which came from 'hello' call previously.
// Returns Symphony token.
function authenticate(response) {

    console.log('Response: ', response);
    companyId = ''+ response.pod;

    // /authenticate returns app token in body (only)
    return ajax.call('/authenticate', companyId, 'POST', 'text/text')
        .then(function(data)
        {
            appToken = data;
            return Q({appId: appId, tokenA: data});
        }.bind(this));
}

// Sends the application token (and the symphony token) back to the server for validation.  In this implementation,
// we are passing back both tokens so that back end can remain stateless. If a sticky session had been established,
// only the app token would be required since the Symphony token could have been stored in the session on the server.
function validate(response)
{
    var request = {
        companyId : companyId,
        symphonyToken : response.tokenS,
        appToken : appToken
    };

    return ajax.call('/validate-tokens', request, 'POST', 'application/json')
        .then(function(data)
        {
            console.log("Response: ", data);
        }.bind(this));
}

var uiService;
var navService;
var modulesService;

function register(appData) {
    return SYMPHONY.application.register(appData, ['ui', 'modules', 'applications-nav', 'extended-user-info'], ['authexample:controller'])
        .then(validate)
        .then(function(response) {

            uiService = SYMPHONY.services.subscribe('ui');
            navService = SYMPHONY.services.subscribe('applications-nav');
            modulesService = SYMPHONY.services.subscribe('modules');

            // LEFT NAV: Add an entry to the left navigation for our application
            navService.add("app-auth-nav", "App Auth Example", "authexample:controller");

            // Implement some methods on our local service. These will be invoked by user actions.
            controllerService.implement({

                // LEFT NAV & MODULE: When the left navigation item is clicked on, invoke Symphony's module service to show our application in the grid
                select: function (id) {
                    if (id == "app-auth-nav") {
                        // Focus the left navigation item when clicked
                        navService.focus("hello-nav");
                    }

                    modulesService.show("app-auth", {title: "App Auth Example"}, "authexample:controller", "https://localhost.symphony.com:8443/app.html", {
                        // You must specify canFloat in the module options so that the module can be pinned
                        "canFloat": true
                    });
                    // Focus the module after it is shown
                    modulesService.focus("app-auth");
                }
            });
        })
}

var controllerService = SYMPHONY.services.register('authexample:controller');

// All Symphony services are namespaced with SYMPHONY
SYMPHONY.remote.hello()
    .then(authenticate)
    .then(register)
    .fail(function(e) {
        console.log(e.stack);
    });
