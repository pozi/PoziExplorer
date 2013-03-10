initAuthorization = function(app, gCurrentLoggedRole, westPanel) {
    
    app.authorizedRoles = [];

    // If there is a cookie, the user is authorize
    var user = app.getCookieValue(app.cookieParamName);
    if (user !== null) {
        app.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
        // Returning the last part of the username (after the dot e.g. 'planning' from 'MITCHELL.planning'), or the username (if there is no dot e.g. 'admin')
        gCurrentLoggedRole.value = user.split(".")[1] || user;
    }

    // unauthorized, show login button
    if (app.authorizedRoles.length === 0) {
        app.showLogin();
    } else {
        var user = app.getCookieValue(app.cookieParamName);
        if (user === null) {
            user = "unknown";
        }
        // Only showing the username without its workspace
        var typedUsername = user;
        if (user.split(".")[1]) {
            typedUsername = user.split(".")[1];
        }
        app.showLogout(typedUsername);

        // Showing the layer tree because we're logged in
        westPanel.expand();

        if (app.authorizedRoles[0]) {
            gCurrentLoggedRole.value = typedUsername;
        }
    }

};

