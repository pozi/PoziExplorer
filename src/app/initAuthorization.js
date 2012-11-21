initAuthorization = function(app, gCurrentLoggedRole, westPanel) {
    
    app.authorizedRoles = [];

    // If there is a cookie, the user is authorize
    var user = app.getCookieValue(app.cookieParamName);
    if (user !== null) {
        app.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
        gCurrentLoggedRole.value = app.authorizedRoles[0];
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
            gCurrentLoggedRole.value = app.authorizedRoles[0];
        }
    }

};

